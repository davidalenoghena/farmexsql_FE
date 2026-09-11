'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type CellValueChangedEvent,
  type ColDef,
  type GridApi,
} from 'ag-grid-community';
import Papa from 'papaparse';
import {
  ArrowLeft,
  Columns3,
  Download,
  Loader2,
  Moon,
  Pencil,
  Plus,
  Sun,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { exportQueryCsv } from '@/lib/api';
import {
  type QueryResultsSession,
  updateQueryResultsSession,
} from '@/lib/query-results-storage';

ModuleRegistry.registerModules([AllCommunityModule]);

interface QueryResultsEditorProps {
  initialSession: QueryResultsSession;
}

function generateColumnName(existing: string[]): string {
  let index = existing.length + 1;
  let name = `Column ${index}`;
  while (existing.includes(name)) {
    index += 1;
    name = `Column ${index}`;
  }
  return name;
}

function formatExportValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function downloadCsvFile(csv: string, fileName: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const objectUrl = window.URL.createObjectURL(blob);
  const element = document.createElement('a');
  element.href = objectUrl;
  element.download = fileName;
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  window.URL.revokeObjectURL(objectUrl);
}

export function QueryResultsEditor({ initialSession }: QueryResultsEditorProps) {
  const router = useRouter();
  const gridRef = useRef<AgGridReact>(null);
  const [isDark, setIsDark] = useState(true);
  const [sql] = useState(initialSession.sql);
  const [columns, setColumns] = useState(initialSession.columns);
  const [rows, setRows] = useState(initialSession.rows);
  const [loadedAllRows, setLoadedAllRows] = useState(initialSession.loadedAllRows);
  const [previewLimit] = useState(initialSession.preview_limit);
  const [totalRowCount] = useState(initialSession.row_count);
  const [isLoadingAllRows, setIsLoadingAllRows] = useState(false);
  const [loadAllError, setLoadAllError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const gridTheme = useMemo(
    () =>
      isDark
        ? themeQuartz.withParams({
            backgroundColor: '#0f172a',
            foregroundColor: '#e2e8f0',
            headerBackgroundColor: '#020617',
            headerTextColor: '#f8fafc',
            borderColor: '#1e293b',
            oddRowBackgroundColor: '#0b1220',
          })
        : themeQuartz.withParams({
            backgroundColor: '#ffffff',
            foregroundColor: '#0f172a',
            headerBackgroundColor: '#f8fafc',
            headerTextColor: '#0f172a',
            borderColor: '#e2e8f0',
            oddRowBackgroundColor: '#f8fafc',
          }),
    [isDark],
  );

  const columnDefs = useMemo<ColDef[]>(
    () =>
      columns.map((column) => ({
        field: column,
        headerName: column,
        editable: true,
        flex: 1,
        minWidth: 140,
      })),
    [columns],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      editable: true,
      resizable: true,
      sortable: true,
      filter: true,
    }),
    [],
  );

  const persistSession = useCallback(
    (nextColumns: string[], nextRows: Record<string, unknown>[], allRowsLoaded: boolean) => {
      updateQueryResultsSession({
        sql,
        columns: nextColumns,
        rows: nextRows,
        row_count: totalRowCount,
        preview_limit: previewLimit,
        loadedAllRows: allRowsLoaded,
      });
    },
    [previewLimit, sql, totalRowCount],
  );

  const getFocusedColumnField = (api: GridApi): string | null => {
    const focusedCell = api.getFocusedCell();
    if (!focusedCell) {
      return null;
    }
    return focusedCell.column.getColId();
  };

  const handleCellValueChanged = useCallback(
    (event: CellValueChangedEvent) => {
      if (event.node.rowIndex === null || event.node.rowIndex === undefined) {
        return;
      }

      setRows((previousRows) => {
        const nextRows = [...previousRows];
        nextRows[event.node.rowIndex!] = { ...event.data };
        persistSession(columns, nextRows, loadedAllRows);
        return nextRows;
      });
    },
    [columns, loadedAllRows, persistSession],
  );

  const handleAddRow = () => {
    setActionError(null);
    const emptyRow = Object.fromEntries(columns.map((column) => [column, '']));
    setRows((previousRows) => {
      const nextRows = [...previousRows, emptyRow];
      persistSession(columns, nextRows, loadedAllRows);
      return nextRows;
    });
  };

  const handleDeleteSelectedRows = () => {
    setActionError(null);
    const selectedNodes = gridRef.current?.api.getSelectedNodes() ?? [];
    if (selectedNodes.length === 0) {
      setActionError('Select one or more rows to delete.');
      return;
    }

    const selectedIndexes = new Set(
      selectedNodes
        .map((node) => node.rowIndex)
        .filter((index): index is number => index !== null && index !== undefined),
    );

    setRows((previousRows) => {
      const nextRows = previousRows.filter((_, index) => !selectedIndexes.has(index));
      persistSession(columns, nextRows, loadedAllRows);
      return nextRows;
    });
  };

  const handleAddColumn = () => {
    setActionError(null);
    const columnName = generateColumnName(columns);
    const nextColumns = [...columns, columnName];
    setColumns(nextColumns);
    setRows((previousRows) => {
      const nextRows = previousRows.map((row) => ({ ...row, [columnName]: '' }));
      persistSession(nextColumns, nextRows, loadedAllRows);
      return nextRows;
    });
  };

  const handleDeleteColumn = () => {
    setActionError(null);
    const api = gridRef.current?.api;
    if (!api) {
      return;
    }

    const columnField = getFocusedColumnField(api);
    if (!columnField) {
      setActionError('Click a cell in the column you want to delete.');
      return;
    }

    if (columns.length <= 1) {
      setActionError('At least one column must remain.');
      return;
    }

    const nextColumns = columns.filter((column) => column !== columnField);
    setColumns(nextColumns);
    setRows((previousRows) => {
      const nextRows = previousRows.map((row) => {
        const { [columnField]: _removed, ...rest } = row;
        return rest;
      });
      persistSession(nextColumns, nextRows, loadedAllRows);
      return nextRows;
    });
  };

  const handleRenameColumn = () => {
    setActionError(null);
    const api = gridRef.current?.api;
    if (!api) {
      return;
    }

    const columnField = getFocusedColumnField(api);
    if (!columnField) {
      setActionError('Click a cell in the column you want to rename.');
      return;
    }

    const newName = window.prompt('Enter a new column name:', columnField)?.trim();
    if (!newName || newName === columnField) {
      return;
    }

    if (columns.includes(newName)) {
      setActionError('A column with that name already exists.');
      return;
    }

    const nextColumns = columns.map((column) => (column === columnField ? newName : column));
    setColumns(nextColumns);
    setRows((previousRows) => {
      const nextRows = previousRows.map((row) => {
        const { [columnField]: value, ...rest } = row;
        return { ...rest, [newName]: value };
      });
      persistSession(nextColumns, nextRows, loadedAllRows);
      return nextRows;
    });
  };

  const handleLoadAllRows = async () => {
    if (isLoadingAllRows || loadedAllRows) {
      return;
    }

    setIsLoadingAllRows(true);
    setLoadAllError(null);

    try {
      const blob = await exportQueryCsv(sql);
      const csvText = await blob.text();
      const parsed = Papa.parse<Record<string, string>>(csvText, {
        header: true,
        skipEmptyLines: true,
      });

      if (parsed.errors.length > 0) {
        throw new Error(parsed.errors[0]?.message ?? 'Failed to parse exported CSV.');
      }

      const nextColumns = parsed.meta.fields ?? columns;
      const nextRows = parsed.data.map((row) => ({ ...row }));

      setColumns(nextColumns);
      setRows(nextRows);
      setLoadedAllRows(true);
      persistSession(nextColumns, nextRows, true);
    } catch (error) {
      setLoadAllError(
        error instanceof Error ? error.message : 'Failed to load all rows from the database.',
      );
    } finally {
      setIsLoadingAllRows(false);
    }
  };

  const handleDownloadCsv = () => {
    setActionError(null);
    const exportRows = rows.map((row) =>
      Object.fromEntries(columns.map((column) => [column, formatExportValue(row[column])])),
    );
    const csv = Papa.unparse(exportRows, { columns });
    downloadCsvFile(csv, 'query-results-edited.csv');
  };

  return (
    <div className={isDark ? 'dark h-screen' : 'h-screen'}>
      <div className="flex h-screen flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Query Results Editor</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {rows.length} row(s) in editor
                {!loadedAllRows && ` · preview capped at ${previewLimit}`}
                {loadedAllRows && ' · full result set loaded'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDark((value) => !value)}
              className="rounded-lg border border-slate-300 p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {!loadedAllRows && (
              <button
                type="button"
                onClick={handleLoadAllRows}
                disabled={isLoadingAllRows}
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                {isLoadingAllRows ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading all rows...
                  </>
                ) : (
                  'Load all rows'
                )}
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </button>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <Plus className="h-3.5 w-3.5" />
            Add row
          </button>
          <button
            type="button"
            onClick={handleDeleteSelectedRows}
            className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete rows
          </button>
          <button
            type="button"
            onClick={handleAddColumn}
            className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <Columns3 className="h-3.5 w-3.5" />
            Add column
          </button>
          <button
            type="button"
            onClick={handleRenameColumn}
            className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <Pencil className="h-3.5 w-3.5" />
            Rename column
          </button>
          <button
            type="button"
            onClick={handleDeleteColumn}
            className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete column
          </button>
        </div>

        {(loadAllError || actionError) && (
          <div className="px-4 pt-3">
            {loadAllError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {loadAllError}
              </p>
            )}
            {actionError && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                {actionError}
              </p>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 p-4">
          <div className="h-full w-full">
            <AgGridReact
              ref={gridRef}
              theme={gridTheme}
              rowData={rows}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowSelection={{ mode: 'multiRow', checkboxes: true, headerCheckbox: true }}
              onCellValueChanged={handleCellValueChanged}
              suppressDragLeaveHidesColumns
            />
          </div>
        </div>
      </div>
    </div>
  );
}

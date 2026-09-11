'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Copy, Info, Loader2, Upload, FileText, Trash2, CheckCircle2 } from 'lucide-react';
import { fetchSchema, fetchSqlQueries, deleteSqlQuery, type SqlQueryResponse } from '@/lib/api';
import { parseDDL, type Table } from '@/lib/parse-ddl';
import { ImportSchemaModal } from './import-schema-modal';

interface SidebarProps {
  schemaVersion: number;
  onSchemaSaved: () => void;
  sqlQueriesVersion: number;
}

export function Sidebar({ schemaVersion, onSchemaSaved, sqlQueriesVersion }: SidebarProps) {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [tables, setTables] = useState<Table[]>([]);
  const [ddlContent, setDdlContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [sqlQueries, setSqlQueries] = useState<SqlQueryResponse[]>([]);
  const [sqlQueriesLoading, setSqlQueriesLoading] = useState(false);
  const [expandedQueries, setExpandedQueries] = useState<Set<number>>(new Set());
  const [selectedQuery, setSelectedQuery] = useState<SqlQueryResponse | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSchema = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const schema = await fetchSchema();
        if (cancelled) return;

        const ddl = schema.ddl_content;
        setDdlContent(ddl);

        if (ddl) {
          const parsed = parseDDL(ddl);
          setTables(parsed);
          if (parsed.length > 0) {
            setExpandedTables(new Set([parsed[0].name]));
          }
        } else {
          setTables([]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load schema.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSchema();

    return () => {
      cancelled = true;
    };
  }, [schemaVersion]);

  useEffect(() => {
    let cancelled = false;

    const loadSqlQueries = async () => {
      setSqlQueriesLoading(true);

      try {
        const queries = await fetchSqlQueries();
        if (cancelled) return;
        setSqlQueries(queries);
      } catch (err) {
        console.error('Failed to load SQL queries', err);
      } finally {
        if (!cancelled) {
          setSqlQueriesLoading(false);
        }
      }
    };

    loadSqlQueries();

    return () => {
      cancelled = true;
    };
  }, [sqlQueriesVersion]);

  const toggleQuery = (queryId: number) => {
    const newExpanded = new Set(expandedQueries);
    if (newExpanded.has(queryId)) {
      newExpanded.delete(queryId);
    } else {
      newExpanded.add(queryId);
    }
    setExpandedQueries(newExpanded);
  };

  const handleDeleteQuery = async (queryId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSqlQuery(queryId);
      setSqlQueries((prev) => prev.filter((q) => q.id !== queryId));
    } catch (err) {
      console.error('Failed to delete SQL query', err);
    }
  };

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const copySchema = () => {
    if (ddlContent) {
      navigator.clipboard.writeText(ddlContent);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    }
  };

  const handleSchemaSaved = (ddl: string) => {
    setDdlContent(ddl);
    const parsed = parseDDL(ddl);
    setTables(parsed);
    if (parsed.length > 0) {
      setExpandedTables(new Set([parsed[0].name]));
    }
    onSchemaSaved();
  };

  return (
    <>
      <aside className="w-80 border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-full flex-col overflow-hidden">


          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Saved Queries Section */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="font-semibold text-slate-900 dark:text-white">Saved Queries</h2>
                <FileText className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </div>

              {sqlQueriesLoading ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading queries...
                </div>
              ) : sqlQueries.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400">No saved queries yet.</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Generate and save queries to see them here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sqlQueries.map((query) => (
                    <div key={query.id} className="rounded-lg border border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => toggleQuery(query.id)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 transition-transform ${
                              expandedQueries.has(query.id) ? '' : '-rotate-90'
                            }`}
                          />
                          <span className="truncate">
                            {query.name || (query.prompt.length > 30 ? `${query.prompt.substring(0, 30)}...` : query.prompt)}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteQuery(query.id, e)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </button>

                      {expandedQueries.has(query.id) && (
                        <div className="border-t border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
                          <div className="mb-2">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Prompt:</p>
                            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                              {query.prompt}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">SQL:</p>
                            <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap overflow-x-auto">
                              {query.sql}
                            </pre>
                          </div>
                          {query.description && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Description:</p>
                              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                {query.description}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Schema Content */}
            <div>
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold text-slate-900 dark:text-white">Database Schema</h2>
                  <Info className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">MySQL / MariaDB</p>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading schema...
                </div>
              ) : error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  {error}
                </p>
              ) : !ddlContent ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center dark:border-slate-700">
                  <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">No schema imported yet.</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Upload a `.sql` file with your CREATE TABLE DDL to start generating queries.
                  </p>
                </div>
              ) : tables.length > 0 ? (
                <div className="space-y-2">
                  {tables.map((table) => (
                    <div key={table.name} className="rounded-lg border border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => toggleTable(table.name)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            expandedTables.has(table.name) ? '' : '-rotate-90'
                          }`}
                        />
                        <span className="font-mono text-primary-700 dark:text-primary-400">{table.name}</span>
                      </button>

                      {expandedTables.has(table.name) && (
                        <div className="border-t border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
                          {table.columns.map((column) => (
                            <div key={column.name} className="mb-1 last:mb-0">
                              <div className="flex items-center justify-between font-mono text-xs">
                                <span className="text-slate-700 dark:text-slate-300">{column.name}</span>
                                <span className="text-slate-500">{column.type}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  {ddlContent}
                </pre>
              )}
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-200 p-4 dark:border-slate-800">
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              <Upload className="h-4 w-4" />
              Import Schema
            </button>
            <button
              onClick={copySchema}
              disabled={!ddlContent}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {copiedSchema ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Schema
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      <ImportSchemaModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSaved={handleSchemaSaved}
      />
    </>
  );
}

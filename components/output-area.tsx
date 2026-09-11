'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Download, Lightbulb, CheckCircle2, Loader2, Play, Save, MoreVertical, X, Info } from 'lucide-react';
import { CodeBlock } from './code-block';
import { explainSql, exportQueryCsv, runQuery, saveSqlQuery, UserDatabaseSettings } from '@/lib/api';
import { saveQueryResultsSession, hasQueryResultsSessionForSql } from '@/lib/query-results-storage';
import { saveWorkspaceSession } from '@/lib/workspace-storage';

interface OutputAreaProps {
  generatedSQL: string | null;
  isLoading: boolean;
  queryHistory: string[];
  error?: string | null;
  currentPrompt?: string | null;
  onSqlQuerySaved?: () => void;
  databaseSettings: UserDatabaseSettings | null;
  onOpenDatabaseSettings: () => void;
}

export function OutputArea({ generatedSQL, isLoading, queryHistory, error, currentPrompt, onSqlQuerySaved, databaseSettings, onOpenDatabaseSettings }: OutputAreaProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isRunningQuery, setIsRunningQuery] = useState(false);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExplanationModalOpen, setIsExplanationModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showRunTooltip, setShowRunTooltip] = useState(false);

  useEffect(() => {
    setExplanation(null);
    setExplainError(null);
    setIsExplaining(false);
    setQueryError(null);
    setIsRunningQuery(false);
    setIsDownloadingCsv(false);
    setIsSaving(false);
    setSaveError(null);
    setSaveSuccess(false);
    setIsDropdownOpen(false);
    setIsExplanationModalOpen(false);
  }, [generatedSQL]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSaveQuery = async () => {
    if (!generatedSQL || !currentPrompt || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await saveSqlQuery(currentPrompt, generatedSQL);
      setSaveSuccess(true);
      onSqlQuerySaved?.();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save the SQL query.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    if (generatedSQL) {
      await navigator.clipboard.writeText(generatedSQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadSql = () => {
    if (generatedSQL) {
      const element = document.createElement('a');
      element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(generatedSQL)}`);
      element.setAttribute('download', 'query.sql');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleExplain = async () => {
    if (!generatedSQL || isExplaining) {
      return;
    }

    setIsExplaining(true);
    setExplainError(null);

    try {
      const result = await explainSql(generatedSQL);
      setExplanation(result.explanation);
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : 'Failed to explain the generated SQL.');
    } finally {
      setIsExplaining(false);
    }
  };

  const openQueryResultsEditor = () => {
    saveWorkspaceSession({
      generatedSQL,
      currentPrompt: currentPrompt ?? null,
      queryHistory,
      error: error ?? null,
    });
    router.push('/dashboard/query-results');
  };

  const handleRunQuery = async () => {
    if (!generatedSQL || isRunningQuery) {
      return;
    }

    if (!databaseSettings) {
      onOpenDatabaseSettings();
      return;
    }

    if (hasQueryResultsSessionForSql(generatedSQL)) {
      openQueryResultsEditor();
      return;
    }

    setIsRunningQuery(true);
    setQueryError(null);

    try {
      const result = await runQuery(generatedSQL);

      if (result.columns.length === 0 || result.rows.length === 0) {
        setQueryError('The query ran successfully but returned no rows.');
        return;
      }

      saveQueryResultsSession({
        sql: generatedSQL,
        columns: result.columns,
        rows: result.rows,
        row_count: result.row_count,
        preview_limit: result.preview_limit,
      });
      openQueryResultsEditor();
    } catch (err) {
      setQueryError(err instanceof Error ? err.message : 'Failed to run the generated SQL.');
    } finally {
      setIsRunningQuery(false);
    }
  };

  const handleExplainQuery = async () => {
    if (!generatedSQL || isExplaining) {
      return;
    }

    setIsExplaining(true);
    setExplainError(null);

    try {
      const result = await explainSql(generatedSQL);
      setExplanation(result.explanation);
      setIsExplanationModalOpen(true);
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : 'Failed to explain the generated SQL.');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleDownloadCsv = async () => {
    if (!generatedSQL || isDownloadingCsv) {
      return;
    }

    setIsDownloadingCsv(true);
    setQueryError(null);

    try {
      const blob = await exportQueryCsv(generatedSQL);
      const objectUrl = window.URL.createObjectURL(blob);
      const element = document.createElement('a');
      element.href = objectUrl;
      element.download = 'query-results.csv';
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setQueryError(err instanceof Error ? err.message : 'Failed to export the query results.');
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 p-6 dark:bg-slate-950">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Generated SQL Query</h2>
          <div className="flex items-center gap-2">
            <span className="inline-block rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300">
              MySQL / MariaDB
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        {/* Code Editor Section */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunQuery}
                disabled={!generatedSQL || isRunningQuery}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-700"
              >
                {isRunningQuery ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Query and View Results
                  </>
                )}
              </button>
              {/* Info tooltip */}
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setShowRunTooltip(true)}
                  onMouseLeave={() => setShowRunTooltip(false)}
                  onFocus={() => setShowRunTooltip(true)}
                  onBlur={() => setShowRunTooltip(false)}
                  className="flex items-center justify-center rounded p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  aria-label="About View Query Results"
                >
                  <Info className="h-4 w-4" />
                </button>
                {showRunTooltip && (
                  <div className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Runs the generated SQL against your connected database and opens the results in the editor.
                  </div>
                )}
              </div>
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={!generatedSQL}
                className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-700"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  <button
                    onClick={() => {
                      handleDownloadSql();
                      setIsDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Download className="h-4 w-4" />
                    Download SQL
                  </button>

                  <button
                    onClick={() => {
                      handleSaveQuery();
                      setIsDropdownOpen(false);
                    }}
                    disabled={!currentPrompt}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Query
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      handleExplainQuery();
                      setIsDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {isExplaining ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Explaining...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="h-4 w-4" />
                        Explain Query
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      handleDownloadCsv();
                      setIsDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 border-t border-slate-200 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {isDownloadingCsv ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Exporting CSV...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Download CSV
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Code Block */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-3 p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Generating SQL...</span>
              </div>
            ) : error ? (
              <div className="p-8">
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  {error}
                </p>
              </div>
            ) : generatedSQL ? (
              <CodeBlock code={generatedSQL} />
            ) : (
              <div className="flex items-center justify-center p-8">
                <p className="text-sm text-slate-500 dark:text-slate-400">Write a query above and click Generate SQL to see results here.</p>
              </div>
            )}
          </div>

          {queryError && (
            <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {queryError}
              </p>
            </div>
          )}

          <div className="flex items-center justify-start border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={handleCopy}
              disabled={!generatedSQL}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-700"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy SQL
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Explanation Modal */}
      {isExplanationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Lightbulb className="h-4 w-4 text-primary-500" />
                SQL Explanation
              </div>
              <button
                onClick={() => setIsExplanationModalOpen(false)}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isExplaining ? (
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                <span>Generating explanation...</span>
              </div>
            ) : explainError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {explainError}
              </p>
            ) : explanation ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                {explanation}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

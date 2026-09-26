'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Copy,
  Download,
  Lightbulb,
  CheckCircle2,
  Loader2,
  Play,
  Save,
  MoreVertical,
  X,
  Info,
  Pencil,
  Check,
  MessageSquare,
  SendHorizonal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { ConversationMessage, explainSql, exportQueryCsv, refineSql, runQuery, saveSqlQuery, UserDatabaseSettings } from '@/lib/api';
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
  onSqlRefined?: (newSql: string) => void;
  selectedTables?: string[];
}

export function OutputArea({
  generatedSQL,
  isLoading,
  queryHistory,
  error,
  currentPrompt,
  onSqlQuerySaved,
  databaseSettings,
  onOpenDatabaseSettings,
  onSqlRefined,
  selectedTables,
}: OutputAreaProps) {
  const router = useRouter();

  // ── action states ──────────────────────────────────────────────────────────
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
  const [showRunTooltip, setShowRunTooltip] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── editable SQL ───────────────────────────────────────────────────────────
  const [isEditingSQL, setIsEditingSQL] = useState(false);
  const [editedSQL, setEditedSQL] = useState<string | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // The authoritative SQL used by all actions
  const activeSQL = editedSQL ?? generatedSQL;
  const isEdited = editedSQL !== null && editedSQL !== generatedSQL;

  // ── conversation / reply thread ────────────────────────────────────────────
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const threadBottomRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  // ── reset on new generation ────────────────────────────────────────────────
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
    // reset editable SQL
    setIsEditingSQL(false);
    setEditedSQL(null);
    // seed conversation history with the initial turn
    if (currentPrompt && generatedSQL) {
      setConversationHistory([
        { role: 'user', content: currentPrompt },
        { role: 'assistant', content: generatedSQL },
      ]);
    } else {
      setConversationHistory([]);
    }
    setRefineError(null);
    setReplyText('');
  }, [generatedSQL]); // eslint-disable-line react-hooks/exhaustive-deps

  // focus textarea when entering edit mode
  useEffect(() => {
    if (isEditingSQL && editTextareaRef.current) {
      editTextareaRef.current.focus();
    }
  }, [isEditingSQL]);

  // scroll thread to bottom when history grows
  useEffect(() => {
    if (isThreadOpen) {
      threadBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory, isThreadOpen]);

  // close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  // ── edit-mode helpers ──────────────────────────────────────────────────────
  const handleEnterEditMode = () => {
    setEditedSQL(generatedSQL ?? '');
    setIsEditingSQL(true);
  };

  const handleConfirmEdit = () => {
    setIsEditingSQL(false);
    if (editedSQL === generatedSQL) {
      setEditedSQL(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingSQL(false);
    setEditedSQL(null);
  };

  // ── reply / refine ─────────────────────────────────────────────────────────
  const handleReply = async () => {
    const trimmed = replyText.trim();
    if (!trimmed || isRefining || !generatedSQL) return;

    const nextHistory: ConversationMessage[] = [
      ...conversationHistory,
      { role: 'user', content: trimmed },
    ];
    setConversationHistory(nextHistory);
    setReplyText('');
    setIsRefining(true);
    setRefineError(null);

    try {
      const result = await refineSql(nextHistory, selectedTables);
      const assistantMessage: ConversationMessage = { role: 'assistant', content: result.sql };
      setConversationHistory((prev) => [...prev, assistantMessage]);
      onSqlRefined?.(result.sql);
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : 'Failed to refine the SQL query.');
      setConversationHistory(conversationHistory);
      setReplyText(trimmed);
    } finally {
      setIsRefining(false);
    }
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };

  // ── existing action handlers ───────────────────────────────────────────────
  const handleSaveQuery = async () => {
    if (!activeSQL || !currentPrompt || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await saveSqlQuery(currentPrompt, activeSQL);
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
    if (activeSQL) {
      await navigator.clipboard.writeText(activeSQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadSql = () => {
    if (activeSQL) {
      const element = document.createElement('a');
      element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(activeSQL)}`);
      element.setAttribute('download', 'query.sql');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const openQueryResultsEditor = () => {
    saveWorkspaceSession({ generatedSQL, currentPrompt: currentPrompt ?? null, queryHistory, error: error ?? null });
    router.push('/dashboard/query-results');
  };

  const handleRunQuery = async () => {
    if (!activeSQL || isRunningQuery) return;
    if (!databaseSettings) { onOpenDatabaseSettings(); return; }
    if (hasQueryResultsSessionForSql(activeSQL)) { openQueryResultsEditor(); return; }

    setIsRunningQuery(true);
    setQueryError(null);
    try {
      const result = await runQuery(activeSQL);
      if (result.columns.length === 0 || result.rows.length === 0) {
        setQueryError('The query ran successfully but returned no rows.');
        return;
      }
      saveQueryResultsSession({ sql: activeSQL, columns: result.columns, rows: result.rows, row_count: result.row_count, preview_limit: result.preview_limit });
      openQueryResultsEditor();
    } catch (err) {
      setQueryError(err instanceof Error ? err.message : 'Failed to run the generated SQL.');
    } finally {
      setIsRunningQuery(false);
    }
  };

  const handleExplainQuery = async () => {
    if (!activeSQL || isExplaining) return;
    setIsExplaining(true);
    setExplainError(null);
    try {
      const result = await explainSql(activeSQL);
      setExplanation(result.explanation);
      setIsExplanationModalOpen(true);
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : 'Failed to explain the generated SQL.');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleDownloadCsv = async () => {
    if (!activeSQL || isDownloadingCsv) return;
    setIsDownloadingCsv(true);
    setQueryError(null);
    try {
      const blob = await exportQueryCsv(activeSQL);
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

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 p-6 dark:bg-slate-950">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Generated SQL Query</h2>
          <div className="flex items-center gap-2">
            <span className="inline-block rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300">
              MySQL / MariaDB
            </span>
            {isEdited && (
              <span className="inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                edited
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        {/* ── Code Editor Section ─────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunQuery}
                disabled={!activeSQL || isRunningQuery}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-700"
              >
                {isRunningQuery ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Running...</>
                ) : (
                  <><Play className="h-4 w-4" />Run Query and View Results</>
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

            <div className="flex items-center gap-2">
              {/* Edit toggle */}
              {generatedSQL && !isEditingSQL && (
                <button
                  onClick={handleEnterEditMode}
                  title="Edit SQL"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
              {isEditingSQL && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleConfirmEdit}
                    title="Confirm edits"
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Done
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    title="Discard edits"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              )}

              {/* More actions dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={!activeSQL}
                  className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-700"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    <button
                      onClick={() => { handleDownloadSql(); setIsDropdownOpen(false); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Download className="h-4 w-4" />Download SQL
                    </button>

                    <button
                      onClick={() => { handleSaveQuery(); setIsDropdownOpen(false); }}
                      disabled={!currentPrompt}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {isSaving ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Saving...</>
                      ) : saveSuccess ? (
                        <><CheckCircle2 className="h-4 w-4" />Saved!</>
                      ) : (
                        <><Save className="h-4 w-4" />Save Query</>
                      )}
                    </button>

                    <button
                      onClick={() => { handleExplainQuery(); setIsDropdownOpen(false); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {isExplaining ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Explaining...</>
                      ) : (
                        <><Lightbulb className="h-4 w-4" />Explain Query</>
                      )}
                    </button>

                    <button
                      onClick={() => { handleDownloadCsv(); setIsDropdownOpen(false); }}
                      className="flex w-full items-center gap-2 border-t border-slate-200 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {isDownloadingCsv ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Exporting CSV...</>
                      ) : (
                        <><Download className="h-4 w-4" />Download CSV</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Code Block or Edit Textarea */}
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
            ) : isEditingSQL && editedSQL !== null ? (
              <textarea
                ref={editTextareaRef}
                value={editedSQL}
                onChange={(e) => setEditedSQL(e.target.value)}
                spellCheck={false}
                className="h-full w-full resize-none bg-slate-950 p-4 font-mono text-sm text-slate-100 outline-none placeholder-slate-600 focus:outline-none"
                placeholder="Edit your SQL query here…"
              />
            ) : activeSQL ? (
              <pre className="h-full w-full overflow-auto bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 whitespace-pre-wrap break-words">{activeSQL}</pre>
            ) : (
              <div className="flex items-center justify-center p-8">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Write a query above and click Generate SQL to see results here.
                </p>
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

          {/* Bottom bar: Copy */}
          <div className="flex items-center justify-start border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={handleCopy}
              disabled={!activeSQL}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-700"
            >
              {copied ? (
                <><CheckCircle2 className="h-4 w-4" />Copied!</>
              ) : (
                <><Copy className="h-4 w-4" />Copy SQL</>
              )}
            </button>
          </div>
        </div>

        {/* ── Reply / Refine Thread ────────────────────────────────────────── */}
        {generatedSQL && (
          <div className="flex flex-col rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {/* Thread header / toggle */}
            <button
              onClick={() => {
                setIsThreadOpen((o) => !o);
                setTimeout(() => replyInputRef.current?.focus(), 100);
              }}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary-500" />
                <span>Refine with AI</span>
                {conversationHistory.length > 2 && (
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                    {Math.floor((conversationHistory.length - 2) / 2) + 1} turn{Math.floor((conversationHistory.length - 2) / 2) > 0 ? 's' : ''}
                  </span>
                )}
              </div>
              {isThreadOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>

            {isThreadOpen && (
              <div className="flex flex-col border-t border-slate-200 dark:border-slate-800">
                {/* Conversation history (skip the seeded first pair) */}
                {conversationHistory.length > 2 && (
                  <div className="flex max-h-48 flex-col gap-2 overflow-y-auto px-4 py-3">
                    {conversationHistory.slice(2).map((msg, i) => (
                      <div
                        key={i}
                        className={`flex flex-col gap-0.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          {msg.role === 'user' ? 'You' : 'AI'}
                        </span>
                        <div
                          className={`max-w-[90%] rounded-lg px-3 py-2 text-xs font-mono leading-5 ${
                            msg.role === 'user'
                              ? 'bg-primary-600 text-white'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={threadBottomRef} />
                  </div>
                )}

                {/* Error */}
                {refineError && (
                  <div className="px-4 pb-2">
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                      {refineError}
                    </p>
                  </div>
                )}

                {/* AI thinking indicator */}
                {isRefining && (
                  <div className="flex items-center gap-2 px-4 pb-2 text-xs text-slate-500 dark:text-slate-400">
                    <Loader2 className="h-3 w-3 animate-spin text-primary-500" />
                    <span>AI is refining the query…</span>
                  </div>
                )}

                {/* Reply input */}
                <div className="flex items-end gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                  <textarea
                    ref={replyInputRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleReplyKeyDown}
                    rows={2}
                    placeholder="e.g. Only show active users, add a LIMIT of 20… (Enter to send)"
                    disabled={isRefining}
                    className="flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:placeholder-slate-600"
                  />
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim() || isRefining}
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Send reply (Enter)"
                  >
                    {isRefining ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SendHorizonal className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Explanation Modal ──────────────────────────────────────────────── */}
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

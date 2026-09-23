'use client';

import { useState, useEffect } from 'react';
import { Wand2, Loader2 } from 'lucide-react';

interface InputAreaProps {
  onGenerateSQL: (prompt: string) => void;
  isLoading: boolean;
  restoredPrompt?: string | null;
  selectedTableCount: number;
  availableTableCount: number;
}

export function InputArea({
  onGenerateSQL,
  isLoading,
  restoredPrompt,
  selectedTableCount,
  availableTableCount,
}: InputAreaProps) {
  const [prompt, setPrompt] = useState(restoredPrompt ?? '');

  useEffect(() => {
    if (restoredPrompt) {
      setPrompt(restoredPrompt);
    }
  }, [restoredPrompt]);

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerateSQL(prompt);
    }
  };

  const missingTableSelection = availableTableCount > 0 && selectedTableCount === 0;

  return (
    <div className="flex flex-col border-b border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Describe your data need</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Write in natural language, describe what you want to query.</p>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g., Get the names and emails of all users"
        className="mb-4 min-h-24 rounded-lg border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:placeholder-slate-600"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {availableTableCount === 0
            ? 'Import a schema to choose tables for generation.'
            : missingTableSelection
              ? 'Select at least one table in the schema sidebar.'
              : `Using ${selectedTableCount} of ${availableTableCount} tables. Uncheck unused tables in the sidebar to keep the AI prompt smaller.`}
        </p>
        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim() || missingTableSelection}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Generate SQL
            </>
          )}
        </button>
      </div>
    </div>
  );
}

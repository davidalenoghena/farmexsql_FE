'use client';

import { useEffect, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { saveSchema } from '@/lib/api';

interface ImportSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (ddlContent: string) => void;
}

export function ImportSchemaModal({
  isOpen,
  onClose,
  onSaved,
}: ImportSchemaModalProps) {
  const [ddlContent, setDdlContent] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDdlContent('');
      setSelectedFileName('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFileName('');
      setDdlContent('');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.sql')) {
      setError('Please choose a .sql file.');
      setSelectedFileName('');
      setDdlContent('');
      event.target.value = '';
      return;
    }

    setIsReadingFile(true);
    setError(null);

    try {
      const content = await file.text();

      if (!content.trim()) {
        throw new Error('The selected SQL file is empty.');
      }

      setSelectedFileName(file.name);
      setDdlContent(content);
    } catch (err) {
      setSelectedFileName('');
      setDdlContent('');
      setError(err instanceof Error ? err.message : 'Failed to read the selected SQL file.');
      event.target.value = '';
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleSubmit = async () => {
    if (!ddlContent.trim()) {
      setError('Please choose a SQL file before importing.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await saveSchema(ddlContent.trim());
      onSaved(result.ddl_content ?? ddlContent.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import schema.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Import Schema</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Upload a `.sql` file containing your MySQL CREATE TABLE statements.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/40 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-primary-500 dark:hover:bg-slate-900">
            <Upload className="mb-3 h-8 w-8 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {selectedFileName || 'Choose a .sql file'}
            </span>
            <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isReadingFile ? 'Reading file...' : 'Click to browse and load the file contents'}
            </span>
            <input
              type="file"
              accept=".sql"
              onChange={handleFileChange}
              disabled={isReadingFile || isSaving}
              className="hidden"
            />
          </label>

          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Loaded SQL Preview
            </p>
            <textarea
              value={ddlContent}
              readOnly
              placeholder="Selected file contents will appear here."
              className="min-h-64 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 placeholder-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          {error && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          <button
            onClick={onClose}
            disabled={isReadingFile || isSaving}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isReadingFile || isSaving || !ddlContent.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isReadingFile || isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isReadingFile ? 'Loading file...' : 'Importing...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import Schema
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

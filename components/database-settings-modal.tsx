'use client';

import { useEffect, useState } from 'react';
import { Database, Key, Check, Loader2, Server, Globe, X, Eye, EyeOff, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { fetchDatabaseSettings, saveDatabaseSettings, testDatabaseConnection, type UserDatabaseSettings } from '@/lib/api';

interface DatabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function DatabaseSettingsModal({
  isOpen,
  onClose,
  onSaved,
}: DatabaseSettingsModalProps) {
  const [connection, setConnection] = useState('mysql');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('3306');
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasExistingPassword, setHasExistingPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load existing settings when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadSettings = async () => {
        setIsLoading(true);
        setError(null);
        setTestResult(null);
        setStatusMessage(null);
        try {
          const res = await fetchDatabaseSettings();
          if (res.settings) {
            setConnection(res.settings.connection || 'mysql');
            setHost(res.settings.host || '');
            setPort(res.settings.port || '3306');
            setDatabase(res.settings.database || '');
            setUsername(res.settings.username || '');
            setPassword(''); // Do not load the password into the form field directly
            setHasExistingPassword(!!res.settings.has_password);
          } else {
            // Default blank states
            setConnection('mysql');
            setHost('');
            setPort('3306');
            setDatabase('');
            setUsername('');
            setPassword('');
            setHasExistingPassword(false);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch database settings.');
        } finally {
          setIsLoading(false);
        }
      };
      loadSettings();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const getFormPayload = (): UserDatabaseSettings => {
    return {
      connection,
      host: host.trim(),
      port: port.trim(),
      database: database.trim(),
      username: username.trim(),
      password: password !== '' ? password : undefined,
    };
  };

  const handleTestConnection = async () => {
    if (!host || !port || !database || !username) {
      setError('Please fill in all connection details before testing.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const res = await testDatabaseConnection(getFormPayload());
      setTestResult({ success: true, message: res.message || 'Connection successful!' });
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to connect to the database.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      const payload = getFormPayload();
      await saveDatabaseSettings(payload);
      setStatusMessage({ success: true, text: 'Settings updated successfully!' });
      onSaved?.();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings.');
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear your custom database configuration? The system will revert to the default query database.')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      await saveDatabaseSettings({ host: '' }); // Passing empty host triggers deletion on backend
      setStatusMessage({ success: true, text: 'Custom database credentials cleared!' });
      
      // Reset form
      setConnection('mysql');
      setHost('');
      setPort('3306');
      setDatabase('');
      setUsername('');
      setPassword('');
      setHasExistingPassword(false);
      setTestResult(null);

      onSaved?.();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear settings.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Query Database Settings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure your own target database for running SQL queries.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-850 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Security Notice */}
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3.5 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-950 dark:text-slate-100">Encrypted Credentials:</span> Your database host, port, username, database name, and password are encrypted at rest using strong AES-256 encryption.
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <p className="text-sm text-slate-500">Loading settings...</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Connection & Port Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-350">
                    Connection Driver
                  </label>
                  <select
                    value={connection}
                    onChange={(e) => setConnection(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/50 px-3 py-2 text-sm text-slate-900 focus:border-purple-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="mysql">MySQL</option>
                    <option value="mariadb">MariaDB</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-350">
                    Port
                  </label>
                  <div className="relative">
                    <Server className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="3306"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white/50 pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-450 focus:border-purple-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Host */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Host Address
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. 127.0.0.1 or sql.example.com"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/50 pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-450 focus:border-purple-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Database Name */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Database Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. my_sql_db"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2 text-sm text-slate-900 placeholder-slate-450 focus:border-purple-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. db_user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2 text-sm text-slate-900 placeholder-slate-450 focus:border-purple-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-350 flex justify-between">
                  <span>Password</span>
                  {hasExistingPassword && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                      ✓ Existing password saved
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={hasExistingPassword ? '•••••••• (leave blank to keep current)' : 'Enter password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/50 pl-10 pr-10 py-2 text-sm text-slate-900 placeholder-slate-450 focus:border-purple-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-450 hover:text-slate-650 dark:hover:text-slate-250 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Status and Error Messages */}
              {error && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 p-3 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700 dark:text-rose-450">{error}</p>
                </div>
              )}

              {testResult && (
                <div className={`rounded-xl border p-3 flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/10 border-emerald-250/50 dark:border-emerald-900/30 text-emerald-850 dark:text-emerald-400'
                    : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-900/30 text-rose-850 dark:text-rose-400'
                }`}>
                  {testResult.success ? (
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <p className="text-xs">{testResult.message}</p>
                </div>
              )}

              {statusMessage && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/30 p-3 flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">{statusMessage.text}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div>
            {hasExistingPassword && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading || isTesting}
                className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-950/20 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear settings
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting || isLoading || !host}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-850 cursor-pointer"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || isTesting}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer transition-all active:scale-98"
            >
              {isLoading && !isTesting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

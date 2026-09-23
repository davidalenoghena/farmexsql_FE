'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/navbar';
import { Sidebar } from '@/components/sidebar';
import { InputArea } from '@/components/input-area';
import { OutputArea } from '@/components/output-area';
import { AuthView } from '@/components/auth-view';
import { DatabaseSettingsModal } from '@/components/database-settings-modal';
import { generateSql, fetchCurrentUser, logout, UserResponse, fetchDatabaseSettings, UserDatabaseSettings } from '@/lib/api';
import { clearQueryResultsSession } from '@/lib/query-results-storage';
import {
  clearWorkspaceSession,
  loadWorkspaceSession,
  saveWorkspaceSession,
} from '@/lib/workspace-storage';
import { Database, Loader2 } from 'lucide-react';

export default function Page() {
  const [isDark, setIsDark] = useState(true);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [generatedSQL, setGeneratedSQL] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [schemaVersion, setSchemaVersion] = useState(0);
  const [sqlQueriesVersion, setSqlQueriesVersion] = useState(0);
  const [databaseSettings, setDatabaseSettings] = useState<UserDatabaseSettings | null>(null);
  const [dbSettingsVersion, setDbSettingsVersion] = useState(0);
  const [workspaceRestored, setWorkspaceRestored] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [availableTables, setAvailableTables] = useState<string[]>([]);

  // Check auth status on load
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetchCurrentUser();
          setUser(response.user);
        } catch (err) {
          console.error('Failed to verify token:', err);
          localStorage.removeItem('token');
        }
      }
      setCheckingAuth(false);
    }
    checkAuth();
  }, []);

  // Fetch database settings
  useEffect(() => {
    async function fetchSettings() {
      if (!user) {
        setDatabaseSettings(null);
        return;
      }
      try {
        const response = await fetchDatabaseSettings();
        setDatabaseSettings(response.settings);
      } catch (err) {
        console.error('Failed to fetch DB settings:', err);
        setDatabaseSettings(null);
      }
    }
    fetchSettings();
  }, [user, dbSettingsVersion]);

  useEffect(() => {
    if (!user || workspaceRestored) {
      return;
    }

    const savedWorkspace = loadWorkspaceSession();
    if (savedWorkspace) {
      setGeneratedSQL(savedWorkspace.generatedSQL);
      setCurrentPrompt(savedWorkspace.currentPrompt);
      setQueryHistory(savedWorkspace.queryHistory);
      setError(savedWorkspace.error);
    }

    setWorkspaceRestored(true);
  }, [user, workspaceRestored]);

  useEffect(() => {
    if (!user || !workspaceRestored) {
      return;
    }

    saveWorkspaceSession({
      generatedSQL,
      currentPrompt,
      queryHistory,
      error,
    });
  }, [user, workspaceRestored, generatedSQL, currentPrompt, queryHistory, error]);

  const handleAuthSuccess = (authenticatedUser: UserResponse) => {
    setUser(authenticatedUser);
    clearWorkspaceSession();
    clearQueryResultsSession();
    // Reset workspace state for the new user
    setGeneratedSQL(null);
    setCurrentPrompt(null);
    setQueryHistory([]);
    setError(null);
    setSchemaVersion((v) => v + 1);
    setSqlQueriesVersion((v) => v + 1);
    setSelectedTables([]);
    setAvailableTables([]);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      clearWorkspaceSession();
      clearQueryResultsSession();
      setSelectedTables([]);
      setAvailableTables([]);
    }
  };

  const handleAvailableTablesChange = useCallback((names: string[]) => {
    setAvailableTables(names);
    setSelectedTables((prev) => {
      const remaining = prev.filter((name) => names.includes(name));
      return remaining.length > 0 ? remaining : names;
    });
  }, []);

  const handleGenerateSQL = async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    setGeneratedSQL(null);
    setCurrentPrompt(prompt);

    try {
      const result = await generateSql(prompt, selectedTables);
      setGeneratedSQL(result.sql);
      setQueryHistory((prev) => [prompt, ...prev.slice(0, 2)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate SQL.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Loading Authentication Screen
  if (checkingAuth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 p-2.5 text-white shadow-md animate-pulse">
            <Database className="h-6 w-6" />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
            <span>Loading workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Login/Register Screen
  if (!user) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  // 3. Authenticated Main Dashboard
  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="flex h-screen flex-col overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <Navbar 
          isDark={isDark} 
          onThemeToggle={() => setIsDark(!isDark)} 
          user={user}
          onLogout={handleLogout}
          onSettingsClick={() => setIsSettingsModalOpen(true)}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            schemaVersion={schemaVersion}
            onSchemaSaved={() => setSchemaVersion((v) => v + 1)}
            sqlQueriesVersion={sqlQueriesVersion}
            selectedTables={selectedTables}
            onSelectedTablesChange={setSelectedTables}
            onAvailableTablesChange={handleAvailableTablesChange}
          />
          <main className="flex flex-1 flex-col overflow-hidden">
            <InputArea
              onGenerateSQL={handleGenerateSQL}
              isLoading={isLoading}
              restoredPrompt={workspaceRestored ? currentPrompt : undefined}
              selectedTableCount={selectedTables.length}
              availableTableCount={availableTables.length}
            />
            <OutputArea
              generatedSQL={generatedSQL}
              isLoading={isLoading}
              queryHistory={queryHistory}
              error={error}
              currentPrompt={currentPrompt}
              onSqlQuerySaved={() => setSqlQueriesVersion((v) => v + 1)}
              databaseSettings={databaseSettings}
              onOpenDatabaseSettings={() => setIsSettingsModalOpen(true)}
            />
          </main>
        </div>
        <DatabaseSettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={() => {
            setIsSettingsModalOpen(false);
            setDbSettingsVersion((v) => v + 1);
          }}
        />
      </div>
    </div>
  );
}

export const QUERY_RESULTS_STORAGE_KEY = 'query-results-session';

export interface QueryResultsSession {
  sql: string;
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
  preview_limit: number;
  loadedAllRows: boolean;
}

export function saveQueryResultsSession(
  data: Omit<QueryResultsSession, 'loadedAllRows'>,
): void {
  const session: QueryResultsSession = { ...data, loadedAllRows: false };
  sessionStorage.setItem(QUERY_RESULTS_STORAGE_KEY, JSON.stringify(session));
}

export function loadQueryResultsSession(): QueryResultsSession | null {
  const raw = sessionStorage.getItem(QUERY_RESULTS_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as QueryResultsSession;
  } catch {
    return null;
  }
}

export function updateQueryResultsSession(session: QueryResultsSession): void {
  sessionStorage.setItem(QUERY_RESULTS_STORAGE_KEY, JSON.stringify(session));
}

export function clearQueryResultsSession(): void {
  sessionStorage.removeItem(QUERY_RESULTS_STORAGE_KEY);
}

export function hasQueryResultsSessionForSql(sql: string): boolean {
  const session = loadQueryResultsSession();
  return session !== null && session.sql === sql;
}

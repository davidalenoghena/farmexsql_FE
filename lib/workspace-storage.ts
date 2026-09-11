export const WORKSPACE_STORAGE_KEY = 'workspace-session';

export interface WorkspaceSession {
  generatedSQL: string | null;
  currentPrompt: string | null;
  queryHistory: string[];
  error: string | null;
}

export function saveWorkspaceSession(session: WorkspaceSession): void {
  sessionStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(session));
}

export function loadWorkspaceSession(): WorkspaceSession | null {
  const raw = sessionStorage.getItem(WORKSPACE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as WorkspaceSession;
  } catch {
    return null;
  }
}

export function clearWorkspaceSession(): void {
  sessionStorage.removeItem(WORKSPACE_STORAGE_KEY);
}

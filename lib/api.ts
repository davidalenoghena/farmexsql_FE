const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  is_superadmin: boolean;
  subscription: 'free' | 'paid';
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface AppSchemaResponse {
  id?: number;
  ddl_content: string | null;
  updated_at?: string;
}

export interface GenerateSqlResponse {
  sql: string;
}

export interface ExplainSqlResponse {
  explanation: string;
}

export interface QueryResultsResponse {
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
  preview_limit: number;
}

export interface SqlQueryResponse {
  id: number;
  name: string | null;
  prompt: string;
  sql: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  message: string;
}

// Helper to construct headers with optional Bearer Token
function getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data.message === 'string'
        ? data.message
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

// Authentication Endpoints
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse<AuthResponse>(response);
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', data.token);
  }
  return data;
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse<AuthResponse>(response);
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', data.token);
  }
  return data;
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_URL}/logout`, {
      method: 'POST',
      headers: getHeaders(),
    });
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }
}

export async function fetchCurrentUser(): Promise<{ user: UserResponse }> {
  const response = await fetch(`${API_URL}/me`, {
    headers: getHeaders(),
  });
  return handleResponse<{ user: UserResponse }>(response);
}

// Schema Endpoints
export async function fetchSchema(): Promise<AppSchemaResponse> {
  const response = await fetch(`${API_URL}/schemas`, {
    headers: getHeaders(),
  });
  return handleResponse<AppSchemaResponse>(response);
}

export async function saveSchema(ddlContent: string): Promise<AppSchemaResponse> {
  const response = await fetch(`${API_URL}/schemas`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ ddl_content: ddlContent }),
  });
  return handleResponse<AppSchemaResponse>(response);
}

// Generator Endpoints
export async function generateSql(
  prompt: string,
  tables?: string[],
): Promise<GenerateSqlResponse> {
  const response = await fetch(`${API_URL}/generate`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      prompt,
      ...(tables && tables.length > 0 ? { tables } : {}),
    }),
  });
  return handleResponse<GenerateSqlResponse>(response);
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function refineSql(
  messages: ConversationMessage[],
  tables?: string[],
): Promise<GenerateSqlResponse> {
  const response = await fetch(`${API_URL}/refine`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      messages,
      ...(tables && tables.length > 0 ? { tables } : {}),
    }),
  });
  return handleResponse<GenerateSqlResponse>(response);
}

export async function explainSql(
  sql: string,
  prompt?: string,
): Promise<ExplainSqlResponse> {
  const response = await fetch(`${API_URL}/explain`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ sql, prompt }),
  });

  return handleResponse<ExplainSqlResponse>(response);
}

export async function runQuery(sql: string): Promise<QueryResultsResponse> {
  const response = await fetch(`${API_URL}/query/run`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ sql }),
  });

  return handleResponse<QueryResultsResponse>(response);
}

export async function exportQueryCsv(sql: string): Promise<Blob> {
  const response = await fetch(`${API_URL}/query/export`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ sql, format: 'csv' }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      typeof data.message === 'string'
        ? data.message
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.blob();
}

// SQL Query Management Endpoints
export async function fetchSqlQueries(): Promise<SqlQueryResponse[]> {
  const response = await fetch(`${API_URL}/sql-queries`, {
    headers: getHeaders(),
  });
  return handleResponse<SqlQueryResponse[]>(response);
}

export async function saveSqlQuery(
  prompt: string,
  sql: string,
  name?: string,
  description?: string,
): Promise<SqlQueryResponse> {
  const response = await fetch(`${API_URL}/sql-queries`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ prompt, sql, name, description }),
  });
  return handleResponse<SqlQueryResponse>(response);
}

export async function updateSqlQuery(
  id: number,
  prompt: string,
  sql: string,
  name?: string,
  description?: string,
): Promise<SqlQueryResponse> {
  const response = await fetch(`${API_URL}/sql-queries/${id}`, {
    method: 'PUT',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ prompt, sql, name, description }),
  });
  return handleResponse<SqlQueryResponse>(response);
}

export async function deleteSqlQuery(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/sql-queries/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse<void>(response);
}

// User Database Settings Endpoints
export interface UserDatabaseSettings {
  connection: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password?: string;
  has_password?: boolean;
}

export interface UserDatabaseResponse {
  settings: UserDatabaseSettings | null;
}

export async function fetchDatabaseSettings(): Promise<UserDatabaseResponse> {
  const response = await fetch(`${API_URL}/user/database`, {
    headers: getHeaders(),
  });
  return handleResponse<UserDatabaseResponse>(response);
}

export async function saveDatabaseSettings(
  settings: Partial<UserDatabaseSettings>
): Promise<UserDatabaseResponse> {
  const response = await fetch(`${API_URL}/user/database`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(settings),
  });
  return handleResponse<UserDatabaseResponse>(response);
}

export async function testDatabaseConnection(
  settings: UserDatabaseSettings
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/user/database/test`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(settings),
  });
  return handleResponse<{ message: string }>(response);
}


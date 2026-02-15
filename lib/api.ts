import {
  APIResponse,
  SafetyValveData,
  TalentScoutData,
  CultureThermometerData,
  ContextCheckData,
  CreatePersonaResponse,
  InjectEventResponse,
  RiskLevel,
  PersonaType,
  NudgeData,
  UserSummary,
  SimulationEvent,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/engines';

// ============================================
// Helper Functions
// ============================================
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  const result: APIResponse<T> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'API request failed');
  }
  return result.data as T;
}

// ============================================
// Safety Valve API
// ============================================

/**
 * Get burnout risk analysis for a specific user
 * GET /users/{user_hash}/safety
 */
export async function getSafetyAnalysis(userHash: string): Promise<SafetyValveData> {
  const response = await fetch(`${API_BASE_URL}/users/${userHash}/safety`);
  return handleResponse<SafetyValveData>(response);
}

// ============================================
// Talent Scout API
// ============================================

/**
 * Get network centrality analysis for a specific user
 * GET /users/{user_hash}/talent
 */
export async function getNetworkAnalysis(userHash: string): Promise<TalentScoutData> {
  const response = await fetch(`${API_BASE_URL}/users/${userHash}/talent`);
  return handleResponse<TalentScoutData>(response);
}

// ============================================
// Context Enricher API
// ============================================

/**
 * Check context explanation for a specific timestamp
 * GET /users/{user_hash}/context?timestamp=ISO8601
 */
export async function getContextCheck(
  userHash: string,
  timestamp?: string
): Promise<ContextCheckData> {
  const url = new URL(`${API_BASE_URL}/users/${userHash}/context`);
  if (timestamp) {
    url.searchParams.set('timestamp', timestamp);
  }
  const response = await fetch(url);
  return handleResponse<ContextCheckData>(response);
}

// ============================================
// Culture Thermometer API
// ============================================

/**
 * Analyze team-level contagion risk
 * POST /teams/culture
 */
export async function getTeamAnalysis(userHashes: string[]): Promise<CultureThermometerData> {
  const response = await fetch(`${API_BASE_URL}/teams/culture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team_hashes: userHashes }),
  });
  return handleResponse<CultureThermometerData>(response);
}

/**
 * Get SIR epidemic forecast for team contagion
 * POST /teams/forecast
 */
export async function getTeamForecast(teamHashes: string[], days: number = 30): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/teams/forecast?days=${days}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team_hashes: teamHashes }),
  });
  return handleResponse<any>(response);
}

// ============================================
// Simulation API
// ============================================

/**
 * Create a simulation persona with synthetic behavioral data
 * POST /personas
 */
export async function createPersona(
  email: string,
  personaType: PersonaType
): Promise<CreatePersonaResponse> {
  const response = await fetch(`${API_BASE_URL}/personas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, persona_type: personaType }),
  });
  return handleResponse<CreatePersonaResponse>(response);
}

/**
 * Inject a real-time behavioral event
 * POST /events
 */
export async function injectEvent(
  userHash: string,
  currentRisk: string,
): Promise<InjectEventResponse> {
  const response = await fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_hash: userHash,
      current_risk: currentRisk,
    }),
  });
  return handleResponse<InjectEventResponse>(response);
}

/**
 * Get recent activity stream
 * GET /events
 */
export async function getRecentEvents(limit: number = 20): Promise<SimulationEvent[]> {
  const response = await fetch(`${API_BASE_URL}/events?limit=${limit}`);
  return handleResponse<SimulationEvent[]>(response);
}

// ============================================
// Nudge Dispatcher API
// ============================================

/**
 * Get nudge recommendation for a user
 * GET /users/{user_hash}/nudge
 */
export async function getNudge(userHash: string): Promise<NudgeData> {
  const response = await fetch(`${API_BASE_URL}/users/${userHash}/nudge`);
  return handleResponse<NudgeData>(response);
}

/**
 * Acknowledge a nudge action
 * POST /nudges/{nudge_id}/acknowledge
 */
export async function acknowledgeNudge(nudgeId: string, action: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/nudges/${nudgeId}/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  return handleResponse<void>(response);
}

// ============================================
// User Listing API
// ============================================

/**
 * List all users with their risk scores
 * GET /users
 */
export async function listUsers(): Promise<UserSummary[]> {
  const response = await fetch(`${API_BASE_URL}/users`);
  return handleResponse<UserSummary[]>(response);
}

// ============================================
// Risk History API
// ============================================

/**
 * Get risk score history for timeline charts
 * GET /users/{user_hash}/history?days=30
 */
export async function getRiskHistory(userHash: string, days: number = 30): Promise<Array<{
  timestamp: string;
  risk_level: string;
  velocity: number;
  confidence: number;
  belongingness_score: number;
}>> {
  const response = await fetch(`${API_BASE_URL}/users/${userHash}/history?days=${days}`);
  return handleResponse(response);
}

// ============================================
// WebSocket Client
// ============================================

/**
 * Create a WebSocket connection for real-time updates
 * ws://localhost:8000/ws/{user_hash}
 */
export function createWebSocket(userHash: string): WebSocket {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
  return new WebSocket(`${wsUrl}/${userHash}`);
}

// ============================================
// Health Check
// ============================================

/**
 * Check if the API is healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api/v1/engines', '')}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================
// Generic API Client (for /me, /team, /admin)
// ============================================

// Base URL for role-based endpoints (not engines)
const API_CLIENT_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/engines').replace('/engines', '');

/**
 * Typed error class for API failures.
 * Carries the HTTP status and response body for downstream error handling.
 */
export class ApiError extends Error {
  response: { data: unknown; status: number };
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.response = { data, status };
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const { createClient } = await import('@/lib/supabase');
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch {
    // Supabase not available (e.g., SSR), proceed without auth
  }
  return headers;
}

export const api = {
  get: async (path: string) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_CLIENT_BASE}${path}`, { headers });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(errorData.detail || `GET ${path} failed: ${res.status}`, res.status, errorData);
    }
    return { data: await res.json() };
  },
  post: async (path: string, body?: unknown) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_CLIENT_BASE}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(errorData.detail || `POST ${path} failed: ${res.status}`, res.status, errorData);
    }
    return { data: await res.json() };
  },
  put: async (path: string, body?: unknown) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_CLIENT_BASE}${path}`, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(errorData.detail || `PUT ${path} failed: ${res.status}`, res.status, errorData);
    }
    return { data: await res.json() };
  },
  delete: async (path: string) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_CLIENT_BASE}${path}`, { method: 'DELETE', headers });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(errorData.detail || `DELETE ${path} failed: ${res.status}`, res.status, errorData);
    }
    return { data: await res.json() };
  },
};


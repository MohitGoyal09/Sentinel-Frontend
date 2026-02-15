import axios, { AxiosRequestConfig } from 'axios';
import {
  APIResponse,
  SafetyValveData,
  TalentScoutData,
  CultureThermometerData,
  ContextCheckData,
  CreatePersonaResponse,
  InjectEventResponse,
  PersonaType,
  NudgeData,
  UserSummary,
  SimulationEvent,
} from '@/types';
import { createClient } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ============================================
// Core API Utility
// ============================================

const supabase = createClient();

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return {
    'Authorization': `Bearer ${session.access_token}`,
  };
}

export const api = {
  async get<T>(path: string, options: AxiosRequestConfig = {}): Promise<T> {
    const authHeaders = await getAuthHeaders();
    const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

    try {
      const response = await axios.get<T>(url, {
        ...options,
        headers: {
          ...authHeaders,
          ...options.headers,
        },
        timeout: 10000,
      });
      return response.data;
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        throw err;
      }
      throw err; // Re-throw other errors
    }
  },

  // body is optional, defaults to {} to fix "Expected 2 arguments" errors when body is empty
  async post<T>(path: string, body: any = {}, options: AxiosRequestConfig = {}): Promise<T> {
    const authHeaders = await getAuthHeaders();
    const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

    try {
      const response = await axios.post<T>(url, body, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options.headers,
        },
        timeout: 10000,
      });
      return response.data;
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        throw err;
      }
      throw err;
    }
  },

  async put<T>(path: string, body: any = {}, options: AxiosRequestConfig = {}): Promise<T> {
    const authHeaders = await getAuthHeaders();
    const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

    try {
      const response = await axios.put<T>(url, body, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options.headers,
        },
        timeout: 10000,
      });
      return response.data;
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        throw err;
      }
      throw err;
    }
  },

  async delete<T>(path: string, options: AxiosRequestConfig = {}): Promise<T> {
    const authHeaders = await getAuthHeaders();
    const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

    try {
      const response = await axios.delete<T>(url, {
        ...options,
        headers: {
          ...authHeaders,
          ...options.headers,
        },
        timeout: 10000,
      });
      return response.data;
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        throw err;
      }
      throw err;
    }
  }
};



// ============================================
// Helper Functions (Legacy Compatibility)
// ============================================
async function handleResponse<T>(response: Promise<APIResponse<T>>): Promise<T> {
  const result = await response;
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
 * GET /engines/users/{user_hash}/safety
 */
export async function getSafetyAnalysis(userHash: string): Promise<SafetyValveData> {
  return handleResponse(api.get<SafetyValveData>(`/engines/users/${userHash}/safety`));
}

// ============================================
// Talent Scout API
// ============================================

/**
 * Get network centrality analysis for a specific user
 * GET /engines/users/{user_hash}/talent
 */
export async function getNetworkAnalysis(userHash: string): Promise<TalentScoutData> {
  return handleResponse(api.get<TalentScoutData>(`/engines/users/${userHash}/talent`));
}

// ============================================
// Context Enricher API
// ============================================

/**
 * Check context explanation for a specific timestamp
 * GET /engines/users/{user_hash}/context?timestamp=ISO8601
 */
export async function getContextCheck(
  userHash: string,
  timestamp?: string
): Promise<ContextCheckData> {
  let path = `/engines/users/${userHash}/context`;
  if (timestamp) {
    path += `?timestamp=${encodeURIComponent(timestamp)}`;
  }
  return handleResponse(api.get<ContextCheckData>(path));
}

// ============================================
// Culture Thermometer API
// ============================================

/**
 * Analyze team-level contagion risk
 * POST /engines/teams/culture
 */
export async function getTeamAnalysis(userHashes: string[]): Promise<CultureThermometerData> {
  return handleResponse(api.post<CultureThermometerData>(`/engines/teams/culture`, { team_hashes: userHashes }));
}

/**
 * Get SIR epidemic forecast for team contagion
 * POST /engines/teams/forecast
 */
export async function getTeamForecast(teamHashes: string[], days: number = 30): Promise<any> {
  return handleResponse(api.post<any>(`/engines/teams/forecast?days=${days}`, { team_hashes: teamHashes }));
}

// ============================================
// Simulation API
// ============================================

/**
 * Create a simulation persona with synthetic behavioral data
 * POST /engines/personas
 */
export async function createPersona(
  email: string,
  personaType: PersonaType
): Promise<CreatePersonaResponse> {
  return handleResponse(api.post<CreatePersonaResponse>(`/engines/personas`, { email, persona_type: personaType }));
}

/**
 * Inject a real-time behavioral event
 * POST /engines/events
 */
export async function injectEvent(
  userHash: string,
  currentRisk: string,
): Promise<InjectEventResponse> {
  return handleResponse(api.post<InjectEventResponse>(`/engines/events`, {
    user_hash: userHash,
    current_risk: currentRisk,
  }));
}

/**
 * Get recent activity stream
 * GET /engines/events
 */
export async function getRecentEvents(limit: number = 20): Promise<SimulationEvent[]> {
  return handleResponse(api.get<SimulationEvent[]>(`/engines/events?limit=${limit}`));
}

// ============================================
// Nudge Dispatcher API
// ============================================

/**
 * Get nudge recommendation for a user
 * GET /engines/users/{user_hash}/nudge
 */
export async function getNudge(userHash: string): Promise<NudgeData> {
  return handleResponse(api.get<NudgeData>(`/engines/users/${userHash}/nudge`));
}

/**
 * Acknowledge a nudge action
 * POST /engines/nudges/{nudge_id}/acknowledge (Note: Endpoint path might vary)
 */
export async function acknowledgeNudge(nudgeId: string, action: string): Promise<void> {
  return handleResponse(api.post<void>(`/engines/nudges/${nudgeId}/acknowledge`, { action }));
}

// ============================================
// User Listing API
// ============================================

/**
 * List all users with their risk scores
 * GET /engines/users
 */
export async function listUsers(): Promise<UserSummary[]> {
  return handleResponse(api.get<UserSummary[]>(`/engines/users`));
}

// ============================================
// Risk History API
// ============================================

/**
 * Get risk score history for timeline charts
 * GET /engines/users/{user_hash}/history?days=30
 */
export async function getRiskHistory(userHash: string, days: number = 30): Promise<Array<{
  timestamp: string;
  risk_level: string;
  velocity: number;
  confidence: number;
  belongingness_score: number;
}>> {
  return handleResponse(api.get<any>(`/engines/users/${userHash}/history?days=${days}`));
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
    const url = `${API_BASE_URL.replace('/api/v1', '')}/health`;
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

"use client"

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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ============================================
// Core API Utility
// ============================================

// Module-level cached token — set by AuthProvider via onAuthStateChange,
// read by getAuthHeaders(). This avoids calling supabase.auth.getSession()
// on every API call, which can fail when the refresh token is invalid
// even though the access token is still valid.
let _cachedAccessToken: string | null = null;
let _currentTenantId: string | null = null;

export function setCurrentTenantId(tenantId: string | null) {
  _currentTenantId = tenantId;
}

export function setCachedAccessToken(token: string | null) {
  _cachedAccessToken = token;
}

function getAuthHeaders(): Record<string, string> {
  if (!_cachedAccessToken) return {};

  return {
    'Authorization': `Bearer ${_cachedAccessToken}`,
    ...(_currentTenantId && { 'X-Tenant-ID': _currentTenantId }),
  };
}

export const api = {
  async get<T>(path: string, options: AxiosRequestConfig = {}): Promise<T> {
    const authHeaders = getAuthHeaders();
    // Strip trailing slash — FastAPI 307-redirects them, dropping Authorization header
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const url = cleanPath.startsWith('http') ? cleanPath : `${API_BASE_URL}${cleanPath}`;

    const response = await axios.get<T>(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
      timeout: 10000,
      maxRedirects: 5,
    });
    return response.data;
  },

  // body is optional, defaults to {} to fix "Expected 2 arguments" errors when body is empty
  async post<T>(path: string, body: any = {}, options: AxiosRequestConfig = {}): Promise<T> {
    const authHeaders = getAuthHeaders();
    // Strip trailing slash — FastAPI 307-redirects them, dropping Authorization header
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const url = cleanPath.startsWith('http') ? cleanPath : `${API_BASE_URL}${cleanPath}`;

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
  },

  async put<T>(path: string, body: any = {}, options: AxiosRequestConfig = {}): Promise<T> {
    const authHeaders = getAuthHeaders();
    // Strip trailing slash — FastAPI 307-redirects them, dropping Authorization header
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const url = cleanPath.startsWith('http') ? cleanPath : `${API_BASE_URL}${cleanPath}`;

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
  },

  async delete<T>(path: string, options: AxiosRequestConfig = {}): Promise<T> {
    const authHeaders = getAuthHeaders();
    // Strip trailing slash — FastAPI 307-redirects them, dropping Authorization header
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const url = cleanPath.startsWith('http') ? cleanPath : `${API_BASE_URL}${cleanPath}`;

    const response = await axios.delete<T>(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
      timeout: 10000,
    });
    return response.data;
  },

  async patch<T>(path: string, body: any = {}, options: AxiosRequestConfig = {}): Promise<T> {
    const authHeaders = getAuthHeaders();
    // Strip trailing slash — FastAPI 307-redirects them, dropping Authorization header
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const url = cleanPath.startsWith('http') ? cleanPath : `${API_BASE_URL}${cleanPath}`;

    const response = await axios.patch<T>(url, body, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
      timeout: 10000,
    });
    return response.data;
  }
};



// ============================================
// Helper Functions (Legacy Compatibility)
// ============================================
async function handleResponse<T>(response: Promise<T>): Promise<T> {
  const result = await response;
  // Check if result has the APIResponse format (success/data)
  if (result && typeof result === 'object' && 'success' in result) {
    if (!(result as any).success) {
      throw new Error((result as any).error || 'API request failed');
    }
    return (result as any).data;
  }
  // Otherwise return the result directly (some endpoints return data directly)
  return result;
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

/**
 * Get the full network graph with all nodes and edges
 * GET /engines/network/global/talent
 */
export async function getGlobalNetworkData(): Promise<TalentScoutData> {
  return handleResponse(api.get<TalentScoutData>('/engines/network/global/talent'));
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
  return handleResponse(api.post<any>(`/engines/teams/forecast`, { team_hashes: teamHashes, days }));
}

/**
 * Get work-pattern energy heatmap (daily activity and risk level per day)
 * GET /analytics/team-energy-heatmap?days=30
 */
export async function getTeamEnergyHeatmap(days: number = 30): Promise<any> {
  return handleResponse(api.get(`/analytics/team-energy-heatmap?days=${days}`));
}

// ============================================
// Team Member Details API
// ============================================

/**
 * Get skills profile for a team member
 * GET /team/member/{user_hash}
 */
export async function getTeamMemberSkills(userHash: string): Promise<{
  technical: number;
  communication: number;
  leadership: number;
  collaboration: number;
  adaptability: number;
  creativity: number;
} | null> {
  const result = await handleResponse(api.get<any>(`/team/member/${userHash}`));
  return result?.skills ?? null;
}

// ============================================
// Simulation API
// ============================================

/**
 * Create a new persona with synthetic behavioral data
 * POST /engines/personas
 */
export async function createPersona(
  email: string,
  personaType: PersonaType
): Promise<{ user_hash: string; events_created: number; persona?: string }> {
  const response = await api.post<any>(`/engines/personas`, { email, persona_type: personaType });
  // Handle the nested response format
  if (response && response.data) {
    return {
      user_hash: response.data.user_hash,
      events_created: response.data.events_count,
      persona: response.data.persona
    };
  }
  return response;
}

/**
 * Inject a real-time behavioral event
 * POST /engines/events
 */
export async function injectEvent(
  userHash: string,
  eventType: string,
): Promise<InjectEventResponse> {
  return handleResponse(api.post<InjectEventResponse>(`/engines/events/inject`, {
    user_hash: userHash,
    current_risk: eventType,
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
 * Dismiss an active nudge for a user
 * POST /engines/users/{user_hash}/nudge/dismiss
 *
 * NOTE: This endpoint returns a flat { success, message } object (no `data`
 * wrapper), so we bypass handleResponse which would return `undefined`.
 */
export async function dismissNudge(userHash: string): Promise<{ success: boolean; message: string }> {
  const result = await api.post<{ success: boolean; message: string }>(`/engines/users/${userHash}/nudge/dismiss`);
  if (result && typeof result === 'object' && 'success' in result && !(result as Record<string, unknown>).success) {
    throw new Error((result as Record<string, unknown>).error as string || 'Failed to dismiss nudge');
  }
  return result;
}

/**
 * Schedule a break for a user
 * POST /engines/users/{user_hash}/nudge/schedule-break
 *
 * NOTE: This endpoint returns a flat { success, message, scheduled_time,
 * calendar_link } object (no `data` wrapper), so we bypass handleResponse
 * which would return `undefined`.
 */
export async function scheduleBreak(userHash: string): Promise<{ success: boolean; message: string; scheduled_time: string; calendar_link: string }> {
  const result = await api.post<{ success: boolean; message: string; scheduled_time: string; calendar_link: string }>(`/engines/users/${userHash}/nudge/schedule-break`);
  if (result && typeof result === 'object' && 'success' in result && !(result as Record<string, unknown>).success) {
    throw new Error((result as Record<string, unknown>).error as string || 'Failed to schedule break');
  }
  return result;
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
// Industry Benchmarks API
// ============================================

/**
 * Get industry benchmark comparison data
 * GET /engines/benchmarks
 */
export async function getBenchmarks(industry: string = "tech"): Promise<any> {
  return handleResponse(api.get(`/engines/benchmarks?industry=${industry}`));
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

// ============================================
// AI Copilot API
// ============================================

export interface AgendaTalkingPoint {
  id: number;
  text: string;
  type?: string;
}

export interface AgendaSuggestion {
  type: string;
  label: string;
  action: string;
}

export interface AgendaResponse {
  user_hash: string;
  user_name: string;
  risk_level: string;
  pattern: string;
  context: string;
  talking_points: AgendaTalkingPoint[];
  suggestions: AgendaSuggestion[];
}

/**
 * Generate AI-powered 1:1 agenda for a user
 * POST /ai/copilot/agenda
 */
export async function generateAgenda(userHash: string): Promise<AgendaResponse> {
  return handleResponse(api.post<AgendaResponse>(`/ai/copilot/agenda`, { user_hash: userHash }));
}

// ============================================
// Semantic Query Engine (Ask Sentinel)
// ============================================

export interface SemanticQueryResult {
  name: string;
  user_hash: string;
  risk_level: string;
  insights: string[];
  suggested_action: string;
  velocity?: number;
  betweenness?: number;
  eigenvector?: number;
  skills?: string[];
  tenure_months?: number;
}

export interface SemanticQueryResponse {
  query: string;
  results: SemanticQueryResult[];
  summary?: string;
  response?: string;
}

/**
 * Execute a semantic natural language query
 * POST /ai/query
 */
export async function semanticQuery(query: string): Promise<SemanticQueryResponse> {
  return handleResponse(api.post<SemanticQueryResponse>(`/ai/query`, { query }));
}

// ============================================
// AI Chat API
// ============================================

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  session_id?: string;
  context?: Record<string, unknown>;
}

export interface ChatContextUsed {
  risk_level?: string;
  velocity?: number;
  belongingness?: number;
  team_size?: number;
  org_total_users?: number;
}

export interface ChatResponse {
  response: string;
  role: string;
  conversation_id?: string;
  context_used: ChatContextUsed;
  generated_at: string;
}

/**
 * Send a message to the AI chat endpoint
 * POST /ai/chat
 */
export async function chatWithSentinel(request: ChatRequest): Promise<ChatResponse> {
  return handleResponse(api.post<ChatResponse>(`/ai/chat`, request));
}

/**
 * Stream a chat response from the AI endpoint via SSE
 * POST /ai/chat/stream
 */
export interface ToolCallEvent {
  tool_name: string;
  tool_slug: string;
  status: "starting" | "processing" | "complete" | "error";
  description?: string;
  args?: Record<string, unknown>;
  result?: string;
}

export interface ConnectionLinkEvent {
  tool_name: string;
  tool_slug: string;
  tool_logo?: string;
  connection_url?: string;
  message: string;
}

export async function chatWithSentinelStream(
  request: ChatRequest,
  onToken: (token: string) => void,
  onDone: (metadata: {
    role: string;
    conversation_id?: string;
    session_id?: string;
    context_used: ChatContextUsed;
    generated_at: string;
  }) => void,
  onError?: (error: Error) => void,
  signal?: AbortSignal,
  onToolCall?: (event: ToolCallEvent) => void,
  onConnectionLink?: (event: ConnectionLinkEvent) => void,
): Promise<void> {
  const authHeaders = getAuthHeaders();
  const url = `${API_BASE_URL}/ai/chat/stream`;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.status}`);
    }

    reader = response.body?.getReader();
    if (!reader) throw new Error("No readable stream");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "token") {
              onToken(data.content);
            } else if (data.type === "refusal") {
              onToken(data.content);
            } else if (data.type === "workflow") {
              onToken(data.description);
            } else if (data.type === "tool_request") {
              onToken(data.description);
            } else if (data.type === "tool_call") {
              onToolCall?.({
                tool_name: data.tool_name ?? data.name ?? "tool",
                tool_slug: data.tool_slug ?? data.slug ?? "",
                status: data.status ?? "starting",
                description: data.description,
                args: data.args,
                result: data.result,
              });
            } else if (data.type === "connection_link") {
              onConnectionLink?.({
                tool_name: data.tool_name ?? data.name ?? "Tool",
                tool_slug: data.tool_slug ?? data.slug ?? "",
                tool_logo: data.tool_logo,
                connection_url: data.connection_url,
                message: data.message ?? `Connect ${data.tool_name ?? "this tool"} to continue`,
              });
            } else if (data.type === "classification") {
              // Internal routing info — ignore silently
            } else if (data.type === "done") {
              onDone(data);
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    }
  } catch (error) {
    try { reader?.cancel(); } catch {}  // Release the stream lock
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    } else {
      throw error;
    }
  } finally {
    try { reader?.releaseLock(); } catch {}
  }
}

// ============================================
// Marketplace / Connections
// ============================================

export const getConnectedTools = () => api.get('/tools/connected')
export const getAvailableTools = () => api.get('/tools/available')

export async function listToolkits(params?: { search?: string; limit?: number; cursor?: string }) {
  const query = new URLSearchParams()
  if (params?.search) query.set("search", params.search)
  if (params?.limit) query.set("limit", String(params.limit))
  if (params?.cursor) query.set("cursor", params.cursor)
  const qs = query.toString()
  return api.get(`/tools/toolkits${qs ? `?${qs}` : ""}`) as Promise<{
    items: Array<{ slug: string; name: string; description: string; logo: string; category: string; no_auth?: boolean }>
    total: number
    next_cursor: string | null
  }>
}
export const connectTool = (toolSlug: string) => api.post('/tools/connect', { tool_slug: toolSlug })
export const executeToolAction = (toolSlug: string, action: string, params: Record<string, unknown>) =>
  api.post('/tools/marketplace/execute', { tool_slug: toolSlug, action, params })

// ============================================
// Connection Management (Composio OAuth)
// ============================================

/**
 * Initiate an OAuth connection for a toolkit via Composio.
 * Returns a redirect_url for OAuth toolkits, or success for no-auth toolkits.
 *
 * NOTE: Connection endpoints return flat objects with `success` field (not wrapped
 * in `{data: ...}`), so we bypass `handleResponse` which would strip the response.
 * POST /connections/initiate
 */
export async function initiateConnection(
  toolkitName: string,
  successUrl?: string,
): Promise<{ success: boolean; redirect_url?: string; connection_id?: string; toolkit_name: string; status?: string }> {
  const result = await api.post('/connections/initiate', {
    toolkit_name: toolkitName,
    success_url: successUrl,
  })
  if (result && typeof result === 'object' && 'success' in result && !(result as Record<string, unknown>).success) {
    throw new Error((result as Record<string, unknown>).error as string || 'Connection initiation failed')
  }
  return result as { success: boolean; redirect_url?: string; connection_id?: string; toolkit_name: string; status?: string }
}

/**
 * Get the list of currently connected toolkits (live from Composio).
 * GET /connections/connected
 */
export async function getConnectedToolsLive(): Promise<{ tools: string[]; total: number; composio_enabled: boolean }> {
  return api.get('/connections/connected') as Promise<{ tools: string[]; total: number; composio_enabled: boolean }>
}

/**
 * Get the status of a specific toolkit connection.
 * GET /connections/toolkit-status?toolkit_name=...
 */
export async function getToolkitStatus(
  toolkitName: string,
): Promise<{ is_connected: boolean; toolkit_name: string; composio_enabled: boolean }> {
  return api.get(
    `/connections/toolkit-status?toolkit_name=${encodeURIComponent(toolkitName)}`,
  ) as Promise<{ is_connected: boolean; toolkit_name: string; composio_enabled: boolean }>
}

/**
 * Invalidate the backend MCP Tool Router cache for the current user.
 * Call after connecting/disconnecting a tool so the next chat message
 * picks up the updated tool set.
 * POST /connections/invalidate-cache
 */
export async function invalidateToolCache(): Promise<{ success: boolean; invalidated: boolean }> {
  return api.post('/connections/invalidate-cache') as Promise<{ success: boolean; invalidated: boolean }>
}

/**
 * Disconnect a toolkit via Composio.
 * POST /connections/disconnect
 */
export async function disconnectTool(
  toolkitName: string,
): Promise<{ success: boolean; toolkit_name: string; message: string }> {
  const result = await api.post('/connections/disconnect', {
    toolkit_name: toolkitName,
  })
  if (result && typeof result === 'object' && 'success' in result && !(result as Record<string, unknown>).success) {
    throw new Error((result as Record<string, unknown>).error as string || 'Disconnection failed')
  }
  return result as { success: boolean; toolkit_name: string; message: string }
}

// ============================================
// Data Sync API
// ============================================

/**
 * Trigger manual data sync for connected tools
 * POST /ingestion/sync
 */
export async function syncConnectedTools(source: string = "all"): Promise<any> {
  return handleResponse(api.post(`/ingestion/sync?source=${source}`));
}

/**
 * Trigger post-OAuth-connection data sync (7-day backfill)
 * POST /connections/post-connect-sync
 */
export async function postConnectSync(): Promise<any> {
  return handleResponse(api.post('/connections/post-connect-sync'));
}

// ============================================
// Workflows
// ============================================

export const getWorkflows = () => api.get('/workflows')
export const createWorkflow = (data: { name: string; trigger: string; actions: unknown[] }) =>
  api.post('/workflows', data)
export const toggleWorkflow = (id: string, enabled: boolean) =>
  api.patch(`/workflows/${id}`, { enabled })
export const deleteWorkflow = (id: string) => api.delete(`/workflows/${id}`)
export const executeWorkflow = (id: string) => api.post(`/workflows/${id}/execute`)

// ============================================
// AI Feedback API
// ============================================

/**
 * Submit thumbs up/down feedback for a chat message
 * POST /ai/feedback
 */
export async function sendChatFeedback(
  conversationId: string,
  messageIndex: number,
  rating: "positive" | "negative",
): Promise<void> {
  return handleResponse(api.post<void>(`/ai/feedback`, {
    conversation_id: conversationId,
    message_index: messageIndex,
    rating,
  }));
}

// ============================================
// Chat History API
// ============================================

export interface ConversationTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "message" | "tool_call" | "connection_link" | string;
  created_at: string | null;
  metadata: Record<string, unknown> | null;
}

export async function getConversationTurns(
  conversationId: string,
): Promise<{ conversation_id: string; turns: ConversationTurn[] }> {
  return handleResponse(
    api.get<{ conversation_id: string; turns: ConversationTurn[] }>(
      `/ai/chat/history/${conversationId}`,
    ),
  );
}

// ============================================
// Chat Sessions API
// ============================================

export interface ChatSessionSummary {
  id: string
  title: string
  is_favorite: boolean
  created_at: string | null
  updated_at: string | null
}

export async function listChatSessions(limit = 20, offset = 0, search?: string): Promise<{ sessions: ChatSessionSummary[] }> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  if (search) params.set('search', search)
  return handleResponse(api.get(`/ai/chat/sessions?${params}`))
}

export async function getChatSession(sessionId: string): Promise<{ id: string; title: string; is_favorite: boolean; turns: ConversationTurn[] }> {
  return handleResponse(api.get(`/ai/chat/sessions/${sessionId}`))
}

export async function createChatSession(title = 'Untitled Chat'): Promise<{ id: string; title: string }> {
  return handleResponse(api.post('/ai/chat/sessions', { title }))
}

export async function renameChatSession(sessionId: string, title: string): Promise<{ id: string; title: string }> {
  return handleResponse(api.put(`/ai/chat/sessions/${sessionId}`, { title }))
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  return handleResponse(api.delete(`/ai/chat/sessions/${sessionId}`))
}

export async function toggleFavoriteSession(sessionId: string): Promise<{ id: string; is_favorite: boolean }> {
  return handleResponse(api.post(`/ai/chat/sessions/${sessionId}/favorite`))
}

// ============================================
// AI Narrative Reports API
// ============================================

export interface RiskNarrativeData {
  user_hash: string;
  narrative: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  time_period: string;
  key_insights: string[];
}

export interface TeamNarrativeData {
  team_hash: string;
  narrative: string;
  health_trend: 'improving' | 'declining' | 'stable';
  risk_distribution: {
    critical: number;
    elevated: number;
    low: number;
    calibrating: number;
  };
  key_insights: string[];
  time_period: string;
}

/**
 * Get AI-generated risk narrative for a specific user
 * GET /ai/narratives/user/{user_hash}?time_range=14
 */
export async function getRiskNarrative(userHash: string, timeRange?: number): Promise<RiskNarrativeData> {
  let path = `/ai/narratives/user/${userHash}`;
  if (timeRange) {
    path += `?time_range=${timeRange}`;
  }
  return handleResponse(api.get<RiskNarrativeData>(path));
}

/**
 * Get AI-generated team health narrative
 * GET /ai/narratives/team/{team_hash}?days=30
 */
export async function getTeamNarrative(teamHash: string, days?: number): Promise<TeamNarrativeData> {
  let path = `/ai/narratives/team/${teamHash}`;
  if (days) {
    path += `?days=${days}`;
  }
  return handleResponse(api.get<TeamNarrativeData>(path));
}


// Orchestrator Client SDK
// Frontend client for multi-agent orchestration system

import type { SupabaseClient } from "@supabase/supabase-js";

// Types
export interface OrchestrationRequest {
    agents: string[];
    payload: Record<string, unknown>;
    strategy?: "parallel" | "sequential" | "hierarchical";
    aggregation?: "hierarchical" | "weighted_average" | "majority_vote" | "ensemble";
    timeout?: number;
    parallel?: boolean;
}

export interface OrchestrationResponse {
    success: boolean;
    request_id: string;
    results: Record<string, unknown>;
    errors: Record<string, string>;
    statistics: {
        total_agents: number;
        successful_agents: number;
        failed_agents: number;
        total_duration_ms: number;
    };
    aggregated_result?: unknown;
    created_at: string;
    completed_at: string;
}

export interface AgentInfo {
    agent_id: string;
    name: string;
    agent_type: string;
    capabilities: string[];
    status: "ready" | "busy" | "error";
}

export interface AgentResult {
    agent_id: string;
    success: boolean;
    result: Record<string, unknown>;
    error?: string;
    duration_ms: number;
    confidence?: number;
}

// Orchestrator Client Class
export class OrchestratorClient {
    private baseUrl: string;
    private supabase: SupabaseClient | null;
    private accessToken: string | null;

    constructor(supabase?: SupabaseClient) {
        this.baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1/engines", "") || "http://localhost:8000";
        this.supabase = supabase || null;
        this.accessToken = null;
    }

    // Set access token for authenticated requests
    setAccessToken(token: string) {
        this.accessToken = token;
    }

    // Get auth headers
    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (this.accessToken) {
            headers["Authorization"] = `Bearer ${this.accessToken}`;
        }

        return headers;
    }

    // Orchestrate multiple agents
    async orchestrate(request: OrchestrationRequest): Promise<OrchestrationResponse> {
        const response = await fetch(`${this.baseUrl}/orchestrate`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`Orchestration failed: ${response.statusText}`);
        }

        return response.json();
    }

    // Get single agent result
    async getAgentResult(agentId: string, payload: Record<string, unknown>): Promise<AgentResult> {
        const response = await fetch(`${this.baseUrl}/orchestrate`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify({
                agents: [agentId],
                payload,
                strategy: "parallel",
            }),
        });

        if (!response.ok) {
            throw new Error(`Agent request failed: ${response.statusText}`);
        }

        const result: OrchestrationResponse = await response.json();
        const agentResult = result.results[agentId];

        return {
            agent_id: agentId,
            success: result.errors[agentId] === undefined,
            result: (agentResult as Record<string, unknown>) || {},
            error: result.errors[agentId],
            duration_ms: result.statistics.total_duration_ms,
            confidence: (agentResult as Record<string, unknown>)?.confidence as number,
        };
    }

    // Get list of available agents
    async getAgents(): Promise<AgentInfo[]> {
        const response = await fetch(`${this.baseUrl}/agents`, {
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to get agents: ${response.statusText}`);
        }

        return response.json();
    }

    // Check orchestrator health
    async healthCheck(): Promise<{ status: string; agents_registered: number }> {
        const response = await fetch(`${this.baseUrl}/health`, {
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Health check failed: ${response.statusText}`);
        }

        return response.json();
    }

    // Quick analysis: Safety + Talent + Context (parallel)
    async quickUserAnalysis(userHash: string): Promise<{
        safety: AgentResult;
        talent: AgentResult;
        context: AgentResult;
    }> {
        const request: OrchestrationRequest = {
            agents: ["safety_valve", "talent_scout", "llm_context"],
            payload: { user_hash: userHash },
            strategy: "parallel",
            aggregation: "hierarchical",
            parallel: true,
        };

        const result = await this.orchestrate(request);

        return {
            safety: {
                agent_id: "safety_valve",
                success: result.errors.safety_valve === undefined,
                result: (result.results.safety_valve as Record<string, unknown>) || {},
                error: result.errors.safety_valve,
                duration_ms: 0,
                confidence: (result.results.safety_valve as Record<string, unknown>)?.confidence as number,
            },
            talent: {
                agent_id: "talent_scout",
                success: result.errors.talent_scout === undefined,
                result: (result.results.talent_scout as Record<string, unknown>) || {},
                error: result.errors.talent_scout,
                duration_ms: 0,
                confidence: (result.results.talent_scout as Record<string, unknown>)?.confidence as number,
            },
            context: {
                agent_id: "llm_context",
                success: result.errors.llm_context === undefined,
                result: (result.results.llm_context as Record<string, unknown>) || {},
                error: result.errors.llm_context,
                duration_ms: 0,
                confidence: (result.results.llm_context as Record<string, unknown>)?.confidence as number,
            },
        };
    }

    // Team analysis: Culture Thermometer + Safety (team aggregate)
    async teamAnalysis(teamHashes: string[]): Promise<{
        culture: AgentResult;
        safety_aggregate: AgentResult;
    }> {
        const request: OrchestrationRequest = {
            agents: ["culture_thermometer", "safety_valve"],
            payload: {
                team_hashes: teamHashes,
                analysis_type: "team",
            },
            strategy: "parallel",
            aggregation: "hierarchical",
            parallel: true,
        };

        const result = await this.orchestrate(request);

        return {
            culture: {
                agent_id: "culture_thermometer",
                success: result.errors.culture_thermometer === undefined,
                result: (result.results.culture_thermometer as Record<string, unknown>) || {},
                error: result.errors.culture_thermometer,
                duration_ms: 0,
                confidence: (result.results.culture_thermometer as Record<string, unknown>)?.confidence as number,
            },
            safety_aggregate: {
                agent_id: "safety_valve",
                success: result.errors.safety_valve === undefined,
                result: (result.results.safety_valve as Record<string, unknown>) || {},
                error: result.errors.safety_valve,
                duration_ms: 0,
                confidence: (result.results.safety_valve as Record<string, unknown>)?.confidence as number,
            },
        };
    }

    // Full dashboard analysis
    async fullDashboardAnalysis(userHash: string, teamHashes?: string[]): Promise<{
        safety: AgentResult;
        talent: AgentResult;
        context: AgentResult;
        culture?: AgentResult;
        nudge?: AgentResult;
    }> {
        const agents = ["safety_valve", "talent_scout", "llm_context"];
        const payload: Record<string, unknown> = { user_hash: userHash };

        if (teamHashes) {
            payload.team_hashes = teamHashes;
            agents.push("culture_thermometer");
        }

        const request: OrchestrationRequest = {
            agents,
            payload,
            strategy: "parallel",
            aggregation: "hierarchical",
            parallel: true,
        };

        const result = await this.orchestrate(request);

        const response: {
            safety: AgentResult;
            talent: AgentResult;
            context: AgentResult;
            culture?: AgentResult;
            nudge?: AgentResult;
        } = {
            safety: {
                agent_id: "safety_valve",
                success: result.errors.safety_valve === undefined,
                result: (result.results.safety_valve as Record<string, unknown>) || {},
                error: result.errors.safety_valve,
                duration_ms: 0,
                confidence: (result.results.safety_valve as Record<string, unknown>)?.confidence as number,
            },
            talent: {
                agent_id: "talent_scout",
                success: result.errors.talent_scout === undefined,
                result: (result.results.talent_scout as Record<string, unknown>) || {},
                error: result.errors.talent_scout,
                duration_ms: 0,
                confidence: (result.results.talent_scout as Record<string, unknown>)?.confidence as number,
            },
            context: {
                agent_id: "llm_context",
                confidence: (result.results.talent_scout as Record<string, unknown>)?.confidence as number,
            },
            context: {
                agent_id: "llm_context",
                confidence: (result.results.llm_context as Record<string, unknown>)?.confidence as number,
            },
        };

        if (teamHashes) {
            response.culture = {
                agent_id: "culture_thermometer",
                success: result.errors.culture_thermometer === undefined,
                result: (result.results.culture_thermometer as Record<string, unknown>) || {},
                error: result.errors.culture_thermometer,
                duration_ms: 0,
                confidence: (result.results.culture_thermometer as Record<string, unknown>)?.confidence as number,
            };
        }

        return response;
    }

    // Dispatch nudge
    async dispatchNudge(
        userHash: string,
        channel: "slack" | "email" | "auto" = "auto",
        priority: "low" | "normal" | "high" = "normal"
    ): Promise<AgentResult> {
        const request: OrchestrationRequest = {
            agents: ["nudge_dispatcher"],
            payload: {
                user_hash: userHash,
                channel,
                priority,
            },
            strategy: "parallel",
        };

        const result = await this.orchestrate(request);

        return {
            agent_id: "nudge_dispatcher",
            success: result.errors.nudge_dispatcher === undefined,
            result: (result.results.nudge_dispatcher as Record<string, unknown>) || {},
            error: result.errors.nudge_dispatcher,
            duration_ms: result.statistics.total_duration_ms,
            confidence: (result.results.nudge_dispatcher as Record<string, unknown>)?.confidence as number,
        };
    }
}

// Singleton instance
let orchestratorClient: OrchestratorClient | null = null;

export function getOrchestratorClient(supabase?: SupabaseClient): OrchestratorClient {
    if (!orchestratorClient) {
        orchestratorClient = new OrchestratorClient(supabase);
    }
    return orchestratorClient;
}

export default OrchestratorClient;

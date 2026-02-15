// useOrchestrator Hook
// React hook for orchestrator integration

import { useState, useCallback, useEffect } from "react";
import { getOrchestratorClient, OrchestratorClient, OrchestrationResponse, AgentResult } from "@/lib/orchestrator";

interface UseOrchestratorOptions {
    autoRegister?: boolean;
}

interface UseOrchestratorReturn {
    client: OrchestratorClient | null;
    isLoading: boolean;
    error: string | null;
    agents: Array<{
        agent_id: string;
        name: string;
        capabilities: string[];
    }>;
    orchestrate: (agents: string[], payload: Record<string, unknown>) => Promise<OrchestrationResponse>;
    quickAnalysis: (userHash: string) => Promise<{
        safety: AgentResult;
        talent: AgentResult;
        context: AgentResult;
    }>;
    fullAnalysis: (userHash: string, teamHashes?: string[]) => Promise<{
        safety: AgentResult;
        talent: AgentResult;
        context: AgentResult;
        culture?: AgentResult;
    }>;
    dispatchNudge: (userHash: string, channel?: "slack" | "email" | "auto", priority?: "low" | "normal" | "high") => Promise<AgentResult>;
    healthCheck: () => Promise<{ status: string; agents_registered: number } | null>;
}

export function useOrchestrator(options: UseOrchestratorOptions = {}): UseOrchestratorReturn {
    const { autoRegister = true } = options;
    const [client, setClient] = useState<OrchestratorClient | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agents, setAgents] = useState<Array<{
        agent_id: string;
        name: string;
        capabilities: string[];
    }>>([]);

    // Initialize client
    useEffect(() => {
        try {
            const orchClient = getOrchestratorClient();
            setClient(orchClient);

            // Optionally fetch agents
            if (autoRegister) {
                fetchAgents(orchClient);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to initialize orchestrator");
        }
    }, [autoRegister]);

    const fetchAgents = async (orchClient: OrchestratorClient) => {
        try {
            const agentList = await orchClient.getAgents();
            setAgents(agentList.map(a => ({
                agent_id: a.agent_id,
                name: a.name,
                capabilities: a.capabilities,
            })));
        } catch (err) {
            console.error("Failed to fetch agents:", err);
        }
    };

    const orchestrate = useCallback(async (
        agentIds: string[],
        payload: Record<string, unknown>
    ): Promise<OrchestrationResponse> => {
        if (!client) {
            throw new Error("Orchestrator client not initialized");
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await client.orchestrate({
                agents: agentIds,
                payload,
                strategy: "parallel",
                parallel: true,
            });
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Orchestration failed";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [client]);

    const quickAnalysis = useCallback(async (userHash: string) => {
        if (!client) {
            throw new Error("Orchestrator client not initialized");
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await client.quickUserAnalysis(userHash);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Quick analysis failed";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [client]);

    const fullAnalysis = useCallback(async (
        userHash: string,
        teamHashes?: string[]
    ) => {
        if (!client) {
            throw new Error("Orchestrator client not initialized");
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await client.fullDashboardAnalysis(userHash, teamHashes);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Full analysis failed";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [client]);

    const dispatchNudge = useCallback(async (
        userHash: string,
        channel: "slack" | "email" | "auto" = "auto",
        priority: "low" | "normal" | "high" = "normal"
    ) => {
        if (!client) {
            throw new Error("Orchestrator client not initialized");
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await client.dispatchNudge(userHash, channel, priority);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Nudge dispatch failed";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [client]);

    const healthCheck = useCallback(async () => {
        if (!client) {
            return null;
        }

        try {
            const result = await client.healthCheck();
            return result;
        } catch (err) {
            console.error("Health check failed:", err);
            return null;
        }
    }, [client]);

    return {
        client,
        isLoading,
        error,
        agents,
        orchestrate,
        quickAnalysis,
        fullAnalysis,
        dispatchNudge,
        healthCheck,
    };
}

export default useOrchestrator;

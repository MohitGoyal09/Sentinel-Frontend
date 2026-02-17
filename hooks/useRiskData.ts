'use client';

import { useState, useEffect, useCallback } from 'react';
import { SafetyValveData, UseRiskDataReturn } from '@/types';
import { getSafetyAnalysis } from '@/lib/api';

/**
 * Hook for fetching and managing safety valve (burnout risk) data
 * 
 * Fetches data via REST API with polling for real-time updates
 * GET /users/{user_hash}/safety
 * 
 * Note: WebSocket was removed in favor of simple REST polling for stability
 */
export function useRiskData(userHash: string | null): UseRiskDataReturn {
  const [data, setData] = useState<SafetyValveData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!userHash) {
      setData(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getSafetyAnalysis(userHash);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch safety analysis';
      setError(new Error(errorMessage));
      console.error('Error fetching safety analysis:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userHash]);

  // Initial fetch when userHash changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    data, 
    isLoading, 
    error, 
    refetch: fetchData,
  };
}

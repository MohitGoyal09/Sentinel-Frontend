'use client';

import { useState, useEffect } from 'react';
import { getRiskHistory } from '@/lib/api';

export function useRiskHistory(userHash: string | null) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userHash || userHash === 'undefined') {
        setHistory([]);
        return;
    }
    
    setIsLoading(true);
    console.log(`[useRiskHistory] Fetching history for ${userHash}`);
    
    getRiskHistory(userHash)
      .then((response: any) => {
        // Backend returns wrapped object { user_hash, history: [...] } sometimes
        // But getRiskHistory types it as Array. Let's handle both.
        const data = Array.isArray(response) ? response : (response?.history || []);
        
        console.log(`[useRiskHistory] Fetched ${data?.length || 0} records`);
        setHistory(data);
        setError(null);
      })
      .catch((err) => {
        console.error('[useRiskHistory] Failed to fetch:', err);
        setError(err);
        setHistory([]);
      })
      .finally(() => setIsLoading(false));
  }, [userHash]);

  return { history, isLoading, error };
}

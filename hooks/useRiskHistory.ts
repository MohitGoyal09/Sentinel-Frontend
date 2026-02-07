'use client';

import { useState, useEffect } from 'react';
import { getRiskHistory } from '@/lib/api';

export function useRiskHistory(userHash: string | null) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userHash) return;
    setIsLoading(true);
    getRiskHistory(userHash)
      .then(setHistory)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [userHash]);

  return { history, isLoading };
}

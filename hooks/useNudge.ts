'use client';
import { useState, useEffect } from 'react';
import { getNudge } from '@/lib/api';
import { NudgeData } from '@/types';

export function useNudge(userHash: string | null) {
  const [data, setData] = useState<NudgeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!userHash) return;
    setIsLoading(true);
    getNudge(userHash)
      .then(setData)
      .catch((e) => {
          // 404 is expected if user has no risk
          console.log("No active nudge or error", e.message); 
          setData(null);
      })
      .finally(() => setIsLoading(false));
  }, [userHash]);

  return { data, isLoading };
}

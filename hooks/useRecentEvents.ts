'use client';

import { useState, useCallback, useEffect } from 'react';
import { SimulationEvent } from '@/types';
import { getRecentEvents } from '@/lib/api';

export function useRecentEvents(limit: number = 20) {
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchEvents = useCallback(async () => {
      setIsLoading(true);
      try {
          // getRecentEvents returns list of SimulationEvent-like objects
          const data = await getRecentEvents(limit);
          setEvents(data);
      } catch (e) {
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  }, [limit]);

  useEffect(() => {
      fetchEvents();
      // Optional polling every 5s for realtime feel
      const interval = setInterval(fetchEvents, 5000);
      return () => clearInterval(interval);
  }, [fetchEvents]);

  return { events, isLoading, refetch: fetchEvents };
}

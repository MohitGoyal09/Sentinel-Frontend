'use client';

import { useState, useCallback } from 'react';
import {
  CreatePersonaResponse,
  InjectEventResponse,
  SimulationEvent,
  PersonaType,
  UseSimulationReturn,
} from '@/types';
import { createPersona as apiCreatePersona, injectEvent as apiInjectEvent } from '@/lib/api';

/**
 * Hook for managing simulation controls
 * 
 * Provides functions to:
 * - Create simulation personas (alex_burnout, sarah_gem, jordan_steady)
 * - Inject real-time events into the simulation
 * 
 * API Endpoints:
 * - POST /personas - Create simulation personas
 * - POST /events - Inject real-time event
 */
export function useSimulation(): UseSimulationReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Create a new simulation persona
   * @param email - User email address
   * @param personaType - Type of persona to create
   * @returns Created persona data including user_hash
   */
  const createPersona = useCallback(async (
    email: string,
    personaType: PersonaType
  ): Promise<CreatePersonaResponse> => {
    setIsCreating(true);
    setError(null);

    try {
      const result = await apiCreatePersona(email, personaType);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create persona';
      setError(new Error(errorMessage));
      console.error('Error creating persona:', err);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  /**
   * Inject a real-time event into the simulation
   * @param userHash - Target user hash
   * @param currentRisk - Current risk level to send to backend
   * @returns Event injection result
   */
  const injectEvent = useCallback(async (
    userHash: string,
    currentRisk: string,
  ): Promise<InjectEventResponse> => {
    setIsInjecting(true);
    setError(null);

    try {
      const result = await apiInjectEvent(userHash, currentRisk);

      // Add to local events list for display
      const newEvent: SimulationEvent = {
        user_hash: userHash,
        timestamp: new Date().toISOString(),
        event_type: currentRisk,
        metadata: {},
      };

      setEvents((prev) => [newEvent, ...prev].slice(0, 50)); // Keep last 50 events
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to inject event';
      setError(new Error(errorMessage));
      console.error('Error injecting event:', err);
      throw err;
    } finally {
      setIsInjecting(false);
    }
  }, []);

  /**
   * Clear all recorded events
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    createPersona,
    injectEvent,
    isCreating,
    isInjecting,
    events,
    error,
    clearEvents,
  };
}

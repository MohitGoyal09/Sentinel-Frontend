'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTeamForecast } from '@/lib/api'

interface SIRForecastData {
  status: string
  risk_level?: string
  r0?: number
  peak_day?: number
  peak_infected?: number
  forecast?: {
    days: number[]
    susceptible: number[]
    infected: number[]
    recovered: number[]
  }
}

interface UseForecastReturn {
  data: SIRForecastData | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useForecast(teamHashes?: string[]): UseForecastReturn {
  const [data, setData] = useState<SIRForecastData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const stableHashes = JSON.stringify(teamHashes || [])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const hashes = JSON.parse(stableHashes)
      const result = await getTeamForecast(hashes)
      setData(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch forecast'
      setError(new Error(errorMessage))
      console.error('Error fetching forecast:', err)
    } finally {
      setIsLoading(false)
    }
  }, [stableHashes])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  }
}

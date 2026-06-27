'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchWithTimeout } from '../lib/fetch'
import type { SvixEndpoint } from '../types'

interface UseEndpointsResult {
  endpoints: SvixEndpoint[]
  loading: boolean
  error: string | null
  refresh: () => void
  create: (data: EndpointPayload) => Promise<SvixEndpoint>
  update: (id: string, data: EndpointPayload) => Promise<SvixEndpoint>
  remove: (id: string) => Promise<void>
}

export interface EndpointPayload {
  url: string
  description?: string
  filterTypes?: string[]
  disabled?: boolean
  headers?: Record<string, string>
}

export function useEndpoints(appId: string | null, apiBaseUrl: string): UseEndpointsResult {
  const [endpoints, setEndpoints] = useState<SvixEndpoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!appId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchWithTimeout(`${apiBaseUrl}/endpoints?appId=${encodeURIComponent(appId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          if (data.error) setError(data.error)
          else setEndpoints(data.data ?? data)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [appId, apiBaseUrl, tick])

  async function create(data: EndpointPayload): Promise<SvixEndpoint> {
    const res = await fetchWithTimeout(`${apiBaseUrl}/endpoints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId, ...data }),
    })
    const json = await res.json()
    if (json.error) throw new Error(json.error)
    refresh()
    return json
  }

  async function update(id: string, data: EndpointPayload): Promise<SvixEndpoint> {
    const res = await fetchWithTimeout(
      `${apiBaseUrl}/endpoints/${id}?appId=${encodeURIComponent(appId!)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    )
    const json = await res.json()
    if (json.error) throw new Error(json.error)
    refresh()
    return json
  }

  async function remove(id: string): Promise<void> {
    const res = await fetchWithTimeout(
      `${apiBaseUrl}/endpoints/${id}?appId=${encodeURIComponent(appId!)}`,
      { method: 'DELETE' }
    )
    const json = await res.json()
    if (json.error) throw new Error(json.error)
    refresh()
  }

  return { endpoints, loading, error, refresh, create, update, remove }
}

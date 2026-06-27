'use client'

import { useEffect, useState } from 'react'
import { fetchWithTimeout } from '../lib/fetch'
import type { SvixApp } from '../types'

interface UseAppResult {
  app: SvixApp | null
  loading: boolean
  error: string | null
  rename: (name: string) => Promise<void>
}

export function useApp(appName: string, apiBaseUrl: string): UseAppResult {
  const [app, setApp] = useState<SvixApp | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchWithTimeout(`${apiBaseUrl}/app?name=${encodeURIComponent(appName)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          if (data.error) setError(data.error)
          else setApp(data)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [appName, apiBaseUrl])

  async function rename(name: string) {
    if (!app) return
    const res = await fetchWithTimeout(`${apiBaseUrl}/app/${app.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    setApp(data)
  }

  return { app, loading, error, rename }
}

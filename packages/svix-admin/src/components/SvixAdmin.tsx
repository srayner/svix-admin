'use client'

import { useEffect, useRef } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { WebhookList } from './WebhookList'
import { AppSettings } from './AppSettings'
import { SvixAdminProvider } from '../context'
import { useApp } from '../hooks/use-app'
import { fetchWithTimeout } from '../lib/fetch'
import { cn } from '../lib/utils'
import type { SvixAdminProps } from '../types'

export function SvixAdmin({
  appName,
  apiBaseUrl = '/api/svix',
  eventTypes,
  className,
}: SvixAdminProps) {
  const { app, loading, error, rename } = useApp(appName, apiBaseUrl)
  const registeredRef = useRef(false)

  useEffect(() => {
    if (!app || registeredRef.current) return
    registeredRef.current = true
    fetchWithTimeout(`${apiBaseUrl}/event-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventTypes }),
    }).catch(console.error)
  }, [app, apiBaseUrl, eventTypes])

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-16 text-muted-foreground', className)}>
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Connecting to Svix…
      </div>
    )
  }

  if (error || !app) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive',
          className
        )}
      >
        <AlertCircle className="h-4 w-4 shrink-0" />
        {error ?? 'Failed to load application'}
      </div>
    )
  }

  return (
    <SvixAdminProvider value={{ appId: app.id, appName: app.name, apiBaseUrl, eventTypes }}>
      <div className={cn('space-y-6', className)}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{app.name}</h1>
          <p className="text-muted-foreground text-sm">Webhook administration</p>
        </div>

        <Tabs defaultValue="webhooks">
          <TabsList>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="webhooks" className="mt-6">
            <WebhookList />
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <AppSettings currentName={app.name} appId={app.id} onRename={rename} />
          </TabsContent>
        </Tabs>
      </div>
    </SvixAdminProvider>
  )
}

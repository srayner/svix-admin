'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { useSvixAdmin } from '../context'
import { fetchWithTimeout } from '../lib/fetch'
import type { SvixEndpoint } from '../types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  endpoint: SvixEndpoint | null
}

export function WebhookTestDialog({ open, onOpenChange, endpoint }: Props) {
  const { apiBaseUrl, appId, eventTypes } = useSvixAdmin()

  const availableTypes =
    endpoint?.filterTypes?.length
      ? endpoint.filterTypes
      : eventTypes.map((e) => e.name)

  const [selectedType, setSelectedType] = useState(availableTypes[0] ?? '')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    if (!open) return
    setResult(null)
    setSelectedType(availableTypes[0] ?? '')
  }, [open, endpoint?.id])

  function labelForType(name: string) {
    return eventTypes.find((e) => e.name === name)?.label ?? name
  }

  async function handleSend() {
    if (!endpoint || !selectedType) return
    setSending(true)
    setResult(null)
    try {
      const res = await fetchWithTimeout(
        `${apiBaseUrl}/endpoints/${endpoint.id}/test?appId=${encodeURIComponent(appId)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType: selectedType }),
        }
      )
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true, message: `Event sent — message ID: ${data.id ?? '(unknown)'}` })
      } else {
        const detail = data.detail ?? data.error ?? 'Unknown error'
        let message = typeof detail === 'string' ? detail : JSON.stringify(detail)
        const hasSchema = eventTypes.find((e) => e.name === selectedType)?.schema
        if (!hasSchema) {
          message += '\n\nHint: This event type has no schema defined. Add a schema with example values to enable test delivery.'
        }
        setResult({ ok: false, message })
      }
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : 'Network error' })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Test Webhook</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Endpoint</Label>
            <p className="text-sm font-mono truncate" title={endpoint?.url}>
              {endpoint?.url}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="test-event-type">Event type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger id="test-event-type">
                <SelectValue placeholder="Select an event type" />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((name) => {
                  const hasSchema = eventTypes.find((e) => e.name === name)?.schema
                  return (
                    <SelectItem key={name} value={name}>
                      {labelForType(name)}
                      <span className="ml-2 text-xs text-muted-foreground font-mono">{name}</span>
                      {!hasSchema && (
                        <span className="ml-2 text-xs text-muted-foreground">(no schema)</span>
                      )}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {result && (
            <div
              className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
                result.ok
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-destructive/30 bg-destructive/5 text-destructive'
              }`}
            >
              {result.ok ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <span>{result.message}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={sending || !selectedType}
          >
            {sending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            Send Test Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

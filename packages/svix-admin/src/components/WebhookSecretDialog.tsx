'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, RefreshCw, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
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

export function WebhookSecretDialog({ open, onOpenChange, endpoint }: Props) {
  const { apiBaseUrl, appId } = useSvixAdmin()

  const [secret, setSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open || !endpoint) return
    setSecret(null)
    setError(null)
    setCopied(false)
    setLoading(true)

    fetchWithTimeout(
      `${apiBaseUrl}/endpoints/${endpoint.id}/secret?appId=${encodeURIComponent(appId)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setSecret(data.key as string)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load secret'))
      .finally(() => setLoading(false))
  }, [open, endpoint?.id])

  async function handleCopy() {
    if (!secret) return
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Signing Secret</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use this secret in your receiving application to verify that webhook deliveries
            are authentic by checking the{' '}
            <code className="font-mono text-xs">svix-signature</code> header.
          </p>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Endpoint</Label>
            <p className="text-sm font-mono truncate" title={endpoint?.url}>
              {endpoint?.url}
            </p>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Secret</Label>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading secret…
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {secret && !loading && (
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm font-mono break-all">
                  {secret}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  aria-label="Copy signing secret"
                  title={copied ? 'Copied!' : 'Copy to clipboard'}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

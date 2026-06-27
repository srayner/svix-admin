'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import type { SvixEndpoint } from '../types'

interface Props {
  endpoint: SvixEndpoint | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (id: string) => Promise<void>
}

export function WebhookDeleteDialog({ endpoint, open, onOpenChange, onConfirm }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    if (!endpoint) return
    setLoading(true)
    try {
      await onConfirm(endpoint.id)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Webhook</DialogTitle>
          <DialogDescription>
            This will permanently delete the webhook endpoint. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {endpoint && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-mono text-foreground break-all">
            {endpoint.url}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

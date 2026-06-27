'use client'

import { useState } from 'react'
import { Pencil, Trash2, Plus, RefreshCw, AlertCircle, FlaskConical } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { WebhookForm } from './WebhookForm'
import { WebhookDeleteDialog } from './WebhookDeleteDialog'
import { WebhookTestDialog } from './WebhookTestDialog'
import { useSvixAdmin } from '../context'
import { useEndpoints } from '../hooks/use-endpoints'
import type { SvixEndpoint } from '../types'

export function WebhookList() {
  const { appId, apiBaseUrl, eventTypes } = useSvixAdmin()
  const { endpoints, loading, error, create, update, remove } = useEndpoints(appId, apiBaseUrl)

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SvixEndpoint | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SvixEndpoint | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [testTarget, setTestTarget] = useState<SvixEndpoint | null>(null)
  const [testOpen, setTestOpen] = useState(false)

  function openCreate() {
    setEditTarget(null)
    setFormOpen(true)
  }

  function openEdit(ep: SvixEndpoint) {
    setEditTarget(ep)
    setFormOpen(true)
  }

  function openDelete(ep: SvixEndpoint) {
    setDeleteTarget(ep)
    setDeleteOpen(true)
  }

  function openTest(ep: SvixEndpoint) {
    setTestTarget(ep)
    setTestOpen(true)
  }

  async function handleSubmit(payload: Parameters<typeof create>[0]) {
    if (editTarget) {
      await update(editTarget.id, payload)
    } else {
      await create(payload)
    }
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Webhooks</h2>
          <p className="text-sm text-muted-foreground">
            {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          New Webhook
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          Loading endpoints…
        </div>
      ) : endpoints.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">No webhook endpoints yet.</p>
          <Button variant="outline" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Create your first webhook
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Events</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {endpoints.map((ep) => (
              <TableRow key={ep.id}>
                <TableCell className="font-mono text-sm max-w-xs truncate" title={ep.url}>
                  <div>{ep.url}</div>
                  {ep.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">{ep.description}</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {ep.filterTypes && ep.filterTypes.length > 0 ? (
                      ep.filterTypes.slice(0, 3).map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs font-mono">
                          {t}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">All events</span>
                    )}
                    {ep.filterTypes && ep.filterTypes.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{ep.filterTypes.length - 3} more
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={ep.disabled ? 'secondary' : 'default'}>
                    {ep.disabled ? 'Disabled' : 'Active'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openTest(ep)}
                      aria-label="Test"
                      title="Send test event"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <FlaskConical className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(ep)}
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDelete(ep)}
                      aria-label="Delete"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <WebhookForm
        open={formOpen}
        onOpenChange={setFormOpen}
        eventTypes={eventTypes}
        endpoint={editTarget}
        onSubmit={handleSubmit}
      />

      <WebhookDeleteDialog
        endpoint={deleteTarget}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={remove}
      />

      <WebhookTestDialog
        endpoint={testTarget}
        open={testOpen}
        onOpenChange={setTestOpen}
      />
    </div>
  )
}

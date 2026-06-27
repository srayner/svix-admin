'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Switch } from './ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Separator } from './ui/separator'
import { Label } from './ui/label'
import { useSvixAdmin } from '../context'
import { webhookFormSchema } from '../lib/schemas'
import type { WebhookFormSchema as FormValues } from '../lib/schemas'
import type { EventTypeConfig, SvixEndpoint } from '../types'
import type { EndpointPayload } from '../hooks/use-endpoints'

const schema = webhookFormSchema

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventTypes: EventTypeConfig[]
  endpoint?: SvixEndpoint | null
  onSubmit: (payload: EndpointPayload) => Promise<void>
}

function headersToCustom(headers: Record<string, string>): { key: string; value: string }[] {
  const authKeys = new Set(['authorization'])
  return Object.entries(headers)
    .filter(([k]) => !authKeys.has(k.toLowerCase()))
    .map(([key, value]) => ({ key, value }))
}

function buildHeaders(values: FormValues): Record<string, string> {
  const headers: Record<string, string> = {}
  if (values.authMethod === 'bearer' && values.bearerToken?.trim()) {
    headers['Authorization'] = `Bearer ${values.bearerToken.trim()}`
  } else if (values.authMethod === 'basic' && values.basicUsername?.trim()) {
    headers['Authorization'] = `Basic ${btoa(`${values.basicUsername.trim()}:${values.basicPassword ?? ''}`)}`
  }
  for (const { key, value } of values.customHeaders) {
    if (key) headers[key] = value
  }
  return headers
}

const defaultValues: FormValues = {
  url: '',
  description: '',
  eventTypes: [],
  authMethod: 'none',
  bearerToken: '',
  basicUsername: '',
  basicPassword: '',
  customHeaders: [],
  disabled: false,
}

export function WebhookForm({ open, onOpenChange, eventTypes, endpoint, onSubmit }: Props) {
  const { apiBaseUrl, appId } = useSvixAdmin()
  const isEdit = !!endpoint
  const [changingAuth, setChangingAuth] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'customHeaders' })
  const authMethod = form.watch('authMethod')

  // Reset form and auth state whenever the dialog opens
  useEffect(() => {
    if (!open) return
    setChangingAuth(false)
    form.reset(
      isEdit && endpoint
        ? {
            url: endpoint.url ?? '',
            description: endpoint.description ?? '',
            eventTypes: endpoint.filterTypes ?? [],
            authMethod: 'none',
            bearerToken: '',
            basicUsername: '',
            basicPassword: '',
            customHeaders: [],
            disabled: endpoint.disabled ?? false,
          }
        : defaultValues
    )
  }, [open, endpoint])

  // Fetch non-auth custom headers when editing
  useEffect(() => {
    if (!open || !isEdit || !endpoint) return
    let cancelled = false

    fetch(`${apiBaseUrl}/endpoints/${endpoint.id}/headers?appId=${encodeURIComponent(appId)}`)
      .then((r) => r.json())
      .then((data: { headers: Record<string, string>; sensitive: string[] }) => {
        if (cancelled) return
        form.setValue('customHeaders', headersToCustom(data.headers ?? {}))
      })
      .catch(() => {/* non-fatal */})

    return () => { cancelled = true }
  }, [open, isEdit, endpoint?.id])

  async function handleSubmit(values: FormValues) {
    const allHeaders = buildHeaders(values)

    // In edit mode, only send auth headers if the user explicitly chose to change auth.
    // Omitting Authorization from the payload leaves whatever Svix already has in place.
    if (isEdit && !changingAuth) {
      delete allHeaders['Authorization']
    }

    const payload: EndpointPayload = {
      url: values.url,
      description: values.description,
      filterTypes: values.eventTypes,
      disabled: values.disabled,
      headers: allHeaders,
    }
    await onSubmit(payload)
    onOpenChange(false)
  }

  const showAuthFields = !isEdit || changingAuth

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Webhook' : 'New Webhook'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* URL */}
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endpoint URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/webhooks" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description{' '}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder="What is this webhook for?" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Event Types */}
            <FormField
              control={form.control}
              name="eventTypes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Types</FormLabel>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {eventTypes.map((et) => (
                      <label
                        key={et.name}
                        className="flex items-start gap-2 rounded-md border p-3 cursor-pointer hover:bg-accent transition-colors"
                      >
                        <Checkbox
                          checked={field.value.includes(et.name)}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? [...field.value, et.name]
                              : field.value.filter((v) => v !== et.name)
                            field.onChange(next)
                          }}
                        />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium leading-none">{et.label}</span>
                          {et.description && (
                            <span className="text-xs text-muted-foreground">{et.description}</span>
                          )}
                          <span className="text-xs text-muted-foreground font-mono">{et.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Auth — collapsed in edit mode until user clicks "Change Auth" */}
            {!showAuthFields ? (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Authentication</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Credentials are write-only and cannot be displayed
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setChangingAuth(true)}
                >
                  Change Auth
                </Button>
              </div>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="authMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Authentication</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None (HMAC signature only)</SelectItem>
                          <SelectItem value="bearer">Bearer Token</SelectItem>
                          <SelectItem value="basic">Basic Auth</SelectItem>
                          <SelectItem value="custom">Custom Headers only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {authMethod === 'bearer' && (
                  <FormField
                    control={form.control}
                    name="bearerToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bearer Token</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="your-token" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {authMethod === 'basic' && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="basicUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="basicPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </>
            )}

            {/* Custom Headers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Custom Headers</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ key: '', value: '' })}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Header
                </Button>
              </div>
              {fields.length > 0 && (
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <FormField
                        control={form.control}
                        name={`customHeaders.${index}.key`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Header-Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`customHeaders.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="value" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="mt-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Enabled toggle */}
            <FormField
              control={form.control}
              name="disabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel className="text-base">Disable endpoint</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Disabled endpoints will not receive events
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Webhook'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

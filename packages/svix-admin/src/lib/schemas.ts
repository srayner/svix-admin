import { z } from 'zod'

export const webhookFormSchema = z
  .object({
    url: z.url({ error: 'Must be a valid URL' }),
    description: z.string().optional(),
    eventTypes: z.array(z.string()).min(1, { error: 'Select at least one event type' }),
    authMethod: z.enum(['none', 'bearer', 'basic', 'custom'] as const),
    bearerToken: z.string().optional(),
    basicUsername: z.string().optional(),
    basicPassword: z.string().optional(),
    customHeaders: z.array(
      z.object({
        key: z.string().min(1, { error: 'Header name required' }),
        value: z.string().min(1, { error: 'Header value required' }),
      })
    ),
    disabled: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.authMethod === 'bearer' && !data.bearerToken?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['bearerToken'],
        message: 'Bearer token is required',
      })
    }
    if (data.authMethod === 'basic' && !data.basicUsername?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['basicUsername'],
        message: 'Username is required',
      })
    }
  })

export type WebhookFormSchema = z.infer<typeof webhookFormSchema>

export const appSettingsSchema = z.object({
  name: z.string().min(1, { error: 'App name is required' }),
})

export type AppSettingsSchema = z.infer<typeof appSettingsSchema>

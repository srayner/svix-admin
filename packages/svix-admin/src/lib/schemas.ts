import { z } from 'zod'

export const webhookFormSchema = z
  .object({
    url: z.string().url({ message: 'Must be a valid URL' }),
    description: z.string().optional(),
    eventTypes: z.array(z.string()).min(1, { message: 'Select at least one event type' }),
    authMethod: z.enum(['none', 'bearer', 'basic', 'custom'] as const),
    bearerToken: z.string().optional(),
    basicUsername: z.string().optional(),
    basicPassword: z.string().optional(),
    customHeaders: z.array(
      z.object({
        key: z.string().min(1, { message: 'Header name required' }),
        value: z.string().min(1, { message: 'Header value required' }),
      })
    ),
    disabled: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.authMethod === 'bearer' && !data.bearerToken?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['bearerToken'],
        message: 'Bearer token is required',
      })
    }
    if (data.authMethod === 'basic' && !data.basicUsername?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['basicUsername'],
        message: 'Username is required',
      })
    }
  })

export type WebhookFormSchema = z.infer<typeof webhookFormSchema>

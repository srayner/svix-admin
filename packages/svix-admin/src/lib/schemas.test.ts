import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { appSettingsSchema, webhookFormSchema } from './schemas'

const valid = {
  url: 'https://example.com/webhook',
  eventTypes: ['order.created'],
  authMethod: 'none' as const,
  customHeaders: [],
  disabled: false,
}

describe('webhookFormSchema', () => {
  it('accepts a minimal valid form', () => {
    expect(webhookFormSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects an invalid URL', () => {
    const result = webhookFormSchema.safeParse({ ...valid, url: 'not-a-url' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(z.flattenError(result.error).fieldErrors.url).toBeDefined()
    }
  })

  it('rejects when no event types are selected', () => {
    const result = webhookFormSchema.safeParse({ ...valid, eventTypes: [] })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(z.flattenError(result.error).fieldErrors.eventTypes).toBeDefined()
    }
  })

  it('requires bearerToken when authMethod is bearer', () => {
    const result = webhookFormSchema.safeParse({
      ...valid,
      authMethod: 'bearer',
      bearerToken: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(z.flattenError(result.error).fieldErrors.bearerToken).toBeDefined()
    }
  })

  it('accepts bearer auth with a non-empty token', () => {
    expect(
      webhookFormSchema.safeParse({ ...valid, authMethod: 'bearer', bearerToken: 'tok_abc' }).success
    ).toBe(true)
  })

  it('requires basicUsername when authMethod is basic', () => {
    const result = webhookFormSchema.safeParse({
      ...valid,
      authMethod: 'basic',
      basicUsername: '  ',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(z.flattenError(result.error).fieldErrors.basicUsername).toBeDefined()
    }
  })

  it('accepts basic auth with a username', () => {
    expect(
      webhookFormSchema.safeParse({
        ...valid,
        authMethod: 'basic',
        basicUsername: 'user',
        basicPassword: 'pass',
      }).success
    ).toBe(true)
  })

  it('requires non-empty key and value on custom headers', () => {
    const result = webhookFormSchema.safeParse({
      ...valid,
      customHeaders: [{ key: '', value: 'v' }],
    })
    expect(result.success).toBe(false)
  })

  it('accepts custom auth method with valid headers', () => {
    expect(
      webhookFormSchema.safeParse({
        ...valid,
        authMethod: 'custom',
        customHeaders: [{ key: 'X-Api-Key', value: 'secret' }],
      }).success
    ).toBe(true)
  })
})

// The exact text each form shows under an invalid field. Pinned so that a change of
// validation library or API can't silently swap them for the library's default wording.
describe('validation messages', () => {
  /** Messages for each path in the failed result, keyed like "customHeaders.0.key". */
  function messagesByPath(result: { success: boolean; error?: z.ZodError }) {
    expect(result.success).toBe(false)
    return Object.fromEntries(result.error!.issues.map((i) => [i.path.join('.'), i.message]))
  }

  it.each([
    { path: 'url', override: { url: 'not-a-url' }, message: 'Must be a valid URL' },
    { path: 'eventTypes', override: { eventTypes: [] }, message: 'Select at least one event type' },
    { path: 'bearerToken', override: { authMethod: 'bearer', bearerToken: '' }, message: 'Bearer token is required' },
    { path: 'basicUsername', override: { authMethod: 'basic', basicUsername: '  ' }, message: 'Username is required' },
    { path: 'customHeaders.0.key', override: { customHeaders: [{ key: '', value: 'v' }] }, message: 'Header name required' },
    { path: 'customHeaders.0.value', override: { customHeaders: [{ key: 'k', value: '' }] }, message: 'Header value required' },
  ])('webhook form: $path shows "$message"', ({ path, override, message }) => {
    expect(messagesByPath(webhookFormSchema.safeParse({ ...valid, ...override }))).toEqual({
      [path]: message,
    })
  })

  it('app settings: an empty name shows "App name is required"', () => {
    expect(messagesByPath(appSettingsSchema.safeParse({ name: '' }))).toEqual({
      name: 'App name is required',
    })
  })

  it('app settings: accepts a non-empty name', () => {
    expect(appSettingsSchema.safeParse({ name: 'Oxygen' }).success).toBe(true)
  })
})

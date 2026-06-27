import { describe, it, expect } from 'vitest'
import { webhookFormSchema } from './schemas'

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
      expect(result.error.flatten().fieldErrors.url).toBeDefined()
    }
  })

  it('rejects when no event types are selected', () => {
    const result = webhookFormSchema.safeParse({ ...valid, eventTypes: [] })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.eventTypes).toBeDefined()
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
      expect(result.error.flatten().fieldErrors.bearerToken).toBeDefined()
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
      expect(result.error.flatten().fieldErrors.basicUsername).toBeDefined()
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

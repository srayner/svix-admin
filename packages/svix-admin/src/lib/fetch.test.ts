import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchWithTimeout } from './fetch'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('fetchWithTimeout', () => {
  it('resolves with the fetch response on success', async () => {
    const mockResponse = new Response('{"ok":true}', { status: 200 })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const res = await fetchWithTimeout('http://example.com/test')
    expect(res.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith('http://example.com/test', expect.objectContaining({ signal: expect.any(AbortSignal) }))
  })

  it('passes through request options', async () => {
    const mockResponse = new Response('{}', { status: 201 })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    await fetchWithTimeout('http://example.com', { method: 'POST', body: '{}' })
    expect(fetch).toHaveBeenCalledWith(
      'http://example.com',
      expect.objectContaining({ method: 'POST', body: '{}' })
    )
  })

  it('aborts after the timeout elapses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        (_url: string, opts: RequestInit) =>
          new Promise((_resolve, reject) => {
            opts.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError'))
            )
          })
      )
    )

    const promise = fetchWithTimeout('http://example.com', undefined, 5_000)
    vi.advanceTimersByTime(5_000)
    await expect(promise).rejects.toThrow('Aborted')
  })

  it('does not abort before the timeout elapses', async () => {
    const mockResponse = new Response('{}', { status: 200 })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const promise = fetchWithTimeout('http://example.com', undefined, 5_000)
    vi.advanceTimersByTime(4_999)
    const res = await promise
    expect(res.status).toBe(200)
  })
})

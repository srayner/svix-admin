import { describe, it, expect, vi, beforeEach } from 'vitest'

const { svixMock } = vi.hoisted(() => {
  const mockApp = { id: 'app_1', name: 'test-app', uid: 'test-app', createdAt: '', updatedAt: '' }
  const mockEndpoint = { id: 'ep_1', url: 'https://example.com', createdAt: '', updatedAt: '' }

  const svixMock = {
    _app: mockApp,
    _endpoint: mockEndpoint,
    application: {
      getOrCreate: vi.fn().mockResolvedValue(mockApp),
      update: vi.fn().mockResolvedValue({ ...mockApp, name: 'renamed' }),
    },
    eventType: {
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    },
    endpoint: {
      list: vi.fn().mockResolvedValue({ data: [mockEndpoint] }),
      create: vi.fn().mockResolvedValue(mockEndpoint),
      update: vi.fn().mockResolvedValue(mockEndpoint),
      delete: vi.fn().mockResolvedValue(undefined),
      getHeaders: vi.fn().mockResolvedValue({ headers: {} }),
      updateHeaders: vi.fn().mockResolvedValue({}),
      sendExample: vi.fn().mockResolvedValue({ id: 'msg_1' }),
    },
  }
  return { svixMock }
})

vi.mock('svix', () => ({
  Svix: vi.fn().mockImplementation(function () {
    return svixMock
  }),
}))

process.env.SVIX_API_TOKEN = 'test-token'
process.env.SVIX_SERVER_URL = 'http://localhost:8071'

import { handler } from './route-handler'

function req(method: string, path: string, body?: unknown): Request {
  return new Request(`http://localhost/api/svix/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

function ctx(path: string) {
  const segments = path.split('/')
  return { params: Promise.resolve({ path: segments }) }
}

beforeEach(() => {
  const mockApp = svixMock._app
  const mockEndpoint = svixMock._endpoint
  svixMock.application.getOrCreate.mockResolvedValue(mockApp)
  svixMock.application.update.mockResolvedValue({ ...mockApp, name: 'renamed' })
  svixMock.eventType.create.mockResolvedValue({})
  svixMock.eventType.update.mockResolvedValue({})
  svixMock.endpoint.list.mockResolvedValue({ data: [mockEndpoint] })
  svixMock.endpoint.create.mockResolvedValue(mockEndpoint)
  svixMock.endpoint.update.mockResolvedValue(mockEndpoint)
  svixMock.endpoint.delete.mockResolvedValue(undefined)
  svixMock.endpoint.getHeaders.mockResolvedValue({ headers: {} })
  svixMock.endpoint.updateHeaders.mockResolvedValue({})
  svixMock.endpoint.sendExample.mockResolvedValue({ id: 'msg_1' })
  vi.clearAllMocks()
})

describe('GET /app', () => {
  it('returns the application for a valid name', async () => {
    svixMock.application.getOrCreate.mockResolvedValue(svixMock._app)
    const res = await handler(req('GET', 'app?name=test-app'), ctx('app'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.id).toBe('app_1')
    expect(svixMock.application.getOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'test-app' })
    )
  })

  it('returns 400 when name is missing', async () => {
    const res = await handler(req('GET', 'app'), ctx('app'))
    expect(res.status).toBe(400)
  })
})

describe('PATCH /app/:id', () => {
  it('renames the application', async () => {
    svixMock.application.update.mockResolvedValue({ ...svixMock._app, name: 'renamed' })
    const res = await handler(req('PATCH', 'app/app_1', { name: 'renamed' }), ctx('app/app_1'))
    expect(res.status).toBe(200)
    expect(svixMock.application.update).toHaveBeenCalledWith('app_1', { name: 'renamed' })
  })
})

describe('POST /event-types', () => {
  it('creates event types without schema', async () => {
    svixMock.eventType.create.mockResolvedValue({})
    const res = await handler(
      req('POST', 'event-types', { eventTypes: [{ name: 'order.created', description: 'test' }] }),
      ctx('event-types')
    )
    expect(res.status).toBe(200)
    expect(svixMock.eventType.create).toHaveBeenCalledWith({
      name: 'order.created',
      description: 'test',
      schemas: undefined,
    })
  })

  it('passes schema directly without a version wrapper', async () => {
    svixMock.eventType.create.mockResolvedValue({})
    const schema = { type: 'object', properties: { id: { type: 'string', example: 'x' } } }
    await handler(
      req('POST', 'event-types', { eventTypes: [{ name: 'order.created', schema }] }),
      ctx('event-types')
    )
    expect(svixMock.eventType.create).toHaveBeenCalledWith(
      expect.objectContaining({ schemas: schema })
    )
  })

  it('falls back to update on 409 conflict', async () => {
    svixMock.eventType.create.mockRejectedValue({ code: 409 })
    svixMock.eventType.update.mockResolvedValue({})
    const res = await handler(
      req('POST', 'event-types', { eventTypes: [{ name: 'order.created', description: 'v2' }] }),
      ctx('event-types')
    )
    expect(res.status).toBe(200)
    expect(svixMock.eventType.update).toHaveBeenCalledWith('order.created', {
      description: 'v2',
      schemas: undefined,
    })
  })

  it('returns 500 on unexpected create error', async () => {
    svixMock.eventType.create.mockRejectedValue(new Error('unexpected'))
    const res = await handler(
      req('POST', 'event-types', { eventTypes: [{ name: 'x' }] }),
      ctx('event-types')
    )
    expect(res.status).toBe(500)
  })
})

describe('GET /endpoints', () => {
  it('lists endpoints for an app', async () => {
    svixMock.endpoint.list.mockResolvedValue({ data: [svixMock._endpoint] })
    const res = await handler(req('GET', 'endpoints?appId=app_1'), ctx('endpoints'))
    expect(res.status).toBe(200)
    expect(svixMock.endpoint.list).toHaveBeenCalledWith('app_1')
  })

  it('returns 400 when appId is missing', async () => {
    const res = await handler(req('GET', 'endpoints'), ctx('endpoints'))
    expect(res.status).toBe(400)
  })
})

describe('POST /endpoints', () => {
  it('creates an endpoint', async () => {
    svixMock.endpoint.create.mockResolvedValue(svixMock._endpoint)
    const res = await handler(
      req('POST', 'endpoints', { appId: 'app_1', url: 'https://example.com', filterTypes: [] }),
      ctx('endpoints')
    )
    expect(res.status).toBe(200)
    expect(svixMock.endpoint.create).toHaveBeenCalled()
  })

  it('returns 400 when appId is missing', async () => {
    const res = await handler(
      req('POST', 'endpoints', { url: 'https://example.com' }),
      ctx('endpoints')
    )
    expect(res.status).toBe(400)
  })
})

describe('POST /endpoints/:id/test', () => {
  it('sends an example event', async () => {
    svixMock.endpoint.sendExample.mockResolvedValue({ id: 'msg_1' })
    const res = await handler(
      req('POST', 'endpoints/ep_1/test?appId=app_1', { eventType: 'order.created' }),
      ctx('endpoints/ep_1/test')
    )
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.id).toBe('msg_1')
    expect(svixMock.endpoint.sendExample).toHaveBeenCalledWith('app_1', 'ep_1', {
      eventType: 'order.created',
    })
  })

  it('returns 400 when eventType is missing', async () => {
    const res = await handler(
      req('POST', 'endpoints/ep_1/test?appId=app_1', {}),
      ctx('endpoints/ep_1/test')
    )
    expect(res.status).toBe(400)
  })
})

describe('DELETE /endpoints/:id', () => {
  it('deletes an endpoint', async () => {
    svixMock.endpoint.delete.mockResolvedValue(undefined)
    const res = await handler(
      req('DELETE', 'endpoints/ep_1?appId=app_1'),
      ctx('endpoints/ep_1')
    )
    expect(res.status).toBe(200)
    expect(svixMock.endpoint.delete).toHaveBeenCalledWith('app_1', 'ep_1')
  })
})

describe('unknown routes', () => {
  it('returns 404 for unrecognised paths', async () => {
    const res = await handler(req('GET', 'unknown'), ctx('unknown'))
    expect(res.status).toBe(404)
  })
})

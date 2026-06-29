import { Svix } from 'svix'

function getSvix() {
  const token = process.env.SVIX_API_TOKEN
  if (!token) throw new Error('SVIX_API_TOKEN is not set')
  return new Svix(token, {
    serverUrl: process.env.SVIX_SERVER_URL,
  })
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function err(message: string, status = 500) {
  return json({ error: message }, status)
}

function endpointFields(body: Record<string, unknown>) {
  return {
    url: body.url as string,
    // Svix rejects empty string — only pass description when non-empty
    ...(body.description ? { description: body.description as string } : {}),
    // Svix rejects empty array — pass null to mean "all events"
    filterTypes: Array.isArray(body.filterTypes) && body.filterTypes.length > 0
      ? (body.filterTypes as string[])
      : null,
    disabled: body.disabled as boolean | undefined,
  }
}

export async function handler(
  req: Request,
  context: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  const { path } = await context.params
  const [segment, id, sub] = path ?? []
  const method = req.method

  try {
    const svix = getSvix()

    // GET /app?name=xxx  — get or create application
    if (segment === 'app' && method === 'GET') {
      const name = new URL(req.url).searchParams.get('name')
      if (!name) return err('name required', 400)
      const uid = name.toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      const app = await svix.application.getOrCreate({ name, uid })
      return json(app)
    }

    // PATCH /app/:id  — rename application
    if (segment === 'app' && id && method === 'PATCH') {
      const body = await req.json()
      const app = await svix.application.update(id, { name: body.name })
      return json(app)
    }

    // POST /event-types  — ensure event types exist in Svix (idempotent)
    if (segment === 'event-types' && method === 'POST') {
      const body = await req.json()
      const eventTypes: { name: string; description?: string; schema?: Record<string, unknown> }[] = body.eventTypes ?? []
      for (const et of eventTypes) {
        try {
          await svix.eventType.create({
            name: et.name,
            description: et.description ?? '',
            schemas: et.schema ?? undefined,
          })
        } catch (e) {
          if ((e as Record<string, unknown>)?.code === 409) {
            // already exists — update so schema/description changes take effect
            await svix.eventType.update(et.name, {
              description: et.description ?? '',
              schemas: et.schema ?? undefined,
            })
          } else {
            throw e
          }
        }
      }
      return json({ ok: true })
    }

    // GET /endpoints/:id/headers?appId=xxx
    if (segment === 'endpoints' && id && sub === 'headers' && method === 'GET') {
      const appId = new URL(req.url).searchParams.get('appId')
      if (!appId) return err('appId required', 400)
      const result = await svix.endpoint.getHeaders(appId, id)
      return json(result)
    }

    // GET /endpoints/:id/secret?appId=xxx
    if (segment === 'endpoints' && id && sub === 'secret' && method === 'GET') {
      const appId = new URL(req.url).searchParams.get('appId')
      if (!appId) return err('appId required', 400)
      const result = await svix.endpoint.getSecret(appId, id)
      return json({ key: result.key })
    }

    // GET /endpoints?appId=xxx
    if (segment === 'endpoints' && !id && method === 'GET') {
      const appId = new URL(req.url).searchParams.get('appId')
      if (!appId) return err('appId required', 400)
      const list = await svix.endpoint.list(appId)
      return json(list)
    }

    // POST /endpoints  — create then optionally set headers separately
    if (segment === 'endpoints' && !id && method === 'POST') {
      const body = await req.json()
      const { appId, headers } = body
      if (!appId) return err('appId required', 400)

      const fields = endpointFields(body)
      const endpoint = await svix.endpoint.create(appId, fields)

      if (headers && Object.keys(headers).length > 0) {
        await svix.endpoint.updateHeaders(appId, endpoint.id, { headers })
      }

      return json(endpoint)
    }

    // POST /endpoints/:id/test?appId=xxx  — send example event to this endpoint
    if (segment === 'endpoints' && id && sub === 'test' && method === 'POST') {
      const appId = new URL(req.url).searchParams.get('appId')
      if (!appId) return err('appId required', 400)
      const body = await req.json()
      const { eventType } = body
      if (!eventType) return err('eventType required', 400)
      const result = await svix.endpoint.sendExample(appId, id, { eventType })
      return json(result)
    }

    // PATCH /endpoints/:id?appId=xxx  — update then optionally set headers
    if (segment === 'endpoints' && id && method === 'PATCH') {
      const appId = new URL(req.url).searchParams.get('appId')
      if (!appId) return err('appId required', 400)
      const body = await req.json()
      const { headers } = body

      const endpoint = await svix.endpoint.update(appId, id, endpointFields(body))

      if (headers !== undefined) {
        await svix.endpoint.updateHeaders(appId, id, { headers })
      }

      return json(endpoint)
    }

    // DELETE /endpoints/:id?appId=xxx
    if (segment === 'endpoints' && id && method === 'DELETE') {
      const appId = new URL(req.url).searchParams.get('appId')
      if (!appId) return err('appId required', 400)
      await svix.endpoint.delete(appId, id)
      return json({ ok: true })
    }

    return err('Not found', 404)
  } catch (e) {
    console.error('[svix-admin] error:', e)
    const message = e instanceof Error ? e.message : 'Unknown error'
    // Forward Svix structured error body if available
    const body = (e as Record<string, unknown>)?.body
    if (body) return json({ error: message, detail: body }, 422)
    return err(message)
  }
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE }

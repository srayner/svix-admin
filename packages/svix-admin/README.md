# @srayner02/svix-admin

An embeddable React admin UI for a self-hosted [Svix](https://www.svix.com/) webhook server. Drop it into any Next.js (App Router) application to give your users a full webhook management experience: create and configure endpoint URLs, filter by event type, set authentication headers, and test delivery — all without leaving your app.

## Prerequisites

- A Svix server running locally (Docker):
  ```bash
  docker run --rm -p 8071:8071 svix/svix-server
  ```
- An API token for that server (shown in the Svix server logs on first start)
- Next.js 13+ with the App Router

## Installation

```bash
npm install @srayner02/svix-admin svix
```

> The `svix` package is needed both by the library's route handler and by your own server code when firing webhook events.

## Quick Start

### 1. Mount the API route handler

Create `app/api/svix/[...path]/route.ts`:

```ts
export { GET, POST, PATCH, DELETE } from '@srayner02/svix-admin/server'
```

Add your Svix credentials to `.env.local`:

```
SVIX_SERVER_URL=http://localhost:8071
SVIX_API_TOKEN=your-token-here
```

### 2. Import the styles

In your root `app/layout.tsx`:

```ts
import '@srayner02/svix-admin/styles.css'
```

### 3. Render the component

```tsx
import { SvixAdmin } from '@srayner02/svix-admin'
import { eventTypes } from './events.config'

export default function WebhooksPage() {
  return <SvixAdmin appName="my-app" eventTypes={eventTypes} />
}
```

## Where to Place the Admin UI

The `<SvixAdmin>` component can be rendered on any page in your application, but the recommended placement is a dedicated admin or settings page such as `/admin/webhooks` or `/settings/webhooks`.

**Important: protect this page with your application's auth middleware.** The admin UI can create, modify, and delete webhook endpoints, so it should only be accessible to authorised users (e.g. account owners or admins).

The API route handler at `/api/svix/[...path]` should also be protected — it performs the same operations on the server. Apply the same auth middleware or add a session check inside a wrapper:

```ts
// app/api/svix/[...path]/route.ts
import { handler } from '@srayner02/svix-admin/server'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return requireAdmin(req) ?? handler(req, ctx)
}
// repeat for POST, PATCH, DELETE
```

**`apiBaseUrl` prop:** If you mount the handler at a path other than `/api/svix`, pass the matching `apiBaseUrl` prop:

```tsx
<SvixAdmin appName="my-app" apiBaseUrl="/api/webhooks" eventTypes={eventTypes} />
```

## Internal API Routes

The route handler at `app/api/svix/[...path]/route.ts` exposes the following endpoints. You don't call these directly — the `<SvixAdmin>` component calls them internally — but knowing the paths is useful when writing per-route auth middleware.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/svix/app?name=` | Get or create the Svix application |
| PATCH | `/api/svix/app/:id` | Rename the application |
| POST | `/api/svix/event-types` | Register / sync event types (called on mount) |
| GET | `/api/svix/endpoints?appId=` | List endpoints |
| POST | `/api/svix/endpoints` | Create an endpoint |
| PATCH | `/api/svix/endpoints/:id?appId=` | Update an endpoint |
| DELETE | `/api/svix/endpoints/:id?appId=` | Delete an endpoint |
| GET | `/api/svix/endpoints/:id/headers?appId=` | Get endpoint custom headers |
| POST | `/api/svix/endpoints/:id/test?appId=` | Send a test event to an endpoint |

> If you override `apiBaseUrl` (e.g. `/api/webhooks`), that prefix replaces `/api/svix` in all paths above.

## Configuring Event Types and Schemas

The `eventTypes` prop defines which webhook events your application can send. Each entry is registered with Svix automatically when the component mounts (idempotent — safe to call on every render).

Create a config file alongside your component:

```ts
// events.config.ts
import type { EventTypeConfig } from '@srayner02/svix-admin'

export const eventTypes: EventTypeConfig[] = [
  {
    name: 'order.created',
    label: 'Order Created',
    description: 'Fired when a new order is placed',
    schema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', example: 'ord_abc123' },
        customerId: { type: 'string', example: 'cust_xyz456' },
        total: { type: 'number', example: 49.99 },
      },
      required: ['orderId', 'customerId', 'total'],
    },
  },
  {
    name: 'payment.failed',
    label: 'Payment Failed',
    description: 'Fired when a payment attempt is declined',
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string', example: 'pay_def789' },
        orderId: { type: 'string', example: 'ord_abc123' },
        failureCode: { type: 'string', example: 'card_declined' },
        failureMessage: { type: 'string', example: 'Your card was declined.' },
      },
      required: ['paymentId', 'orderId', 'failureCode'],
    },
  },
]
```

> **Note:** Every property must include an `example` value. Svix uses these to generate the test payload when you click "Send Test Event". Properties without examples will cause test delivery to fail.

### EventTypeConfig fields

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | The event type identifier used internally by Svix (e.g. `order.created`) |
| `label` | `string` | Yes | Human-readable name shown in the UI |
| `description` | `string` | No | Longer description shown in the event type picker |
| `schema` | `Record<string, unknown>` | No | OpenAPI 3.0 schema object for the event payload. **Required for the "Send Test Event" button** — Svix uses this to generate example payloads |

The `schema` follows the [OpenAPI 3.0 Schema Object](https://swagger.io/specification/#schema-object) format. If omitted, the event type is still registered and can be used for filtering, but the test button will not be able to generate an example payload.

## Firing Webhooks from Your Application

`@srayner02/svix-admin` provides the admin UI only. When something happens in your application (an order is created, a payment fails, etc.) you fire the event from your own server code using the Svix SDK directly:

```ts
// e.g. in an API route, server action, or background job
import { Svix } from 'svix'

const svix = new Svix(process.env.SVIX_API_TOKEN!, {
  serverUrl: process.env.SVIX_SERVER_URL,
})

// Use the same appName as configured in <SvixAdmin appName="my-app">
const app = await svix.application.getOrCreate({ name: 'my-app' })

await svix.message.create(app.id, {
  eventType: 'order.created',
  payload: {
    orderId: 'ord_abc123',
    customerId: 'cust_xyz456',
    total: 49.99,
  },
})
```

`application.getOrCreate` is idempotent — safe to call on every request. For performance, cache the returned `appId` after the first call (e.g. in a module-level variable or a short-lived cache).

Svix will then deliver the message to all endpoint URLs configured for that application that subscribe to `order.created`.

## Theming

The component uses [shadcN/ui](https://ui.shadcn.com/) CSS variables for theming. It ships with a default set of values, but you can override them in your global CSS to match your application's brand:

```css
/* app/globals.css */
:root {
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  /* ... other shadcN variables */
}
```

## Troubleshooting

**"Send Test Event" fails with a schema error**

The selected event type either has no schema, or one or more properties are missing an `example` value. Svix uses `example` fields to generate the test payload. Ensure every property in your schema includes one:

```ts
orderId: { type: 'string', example: 'ord_abc123' },
```

**Component loads then shows an error banner**

Check that `SVIX_API_TOKEN` and `SVIX_SERVER_URL` are set in `.env.local` and that your Svix server is running. The API token is printed in the Svix server logs on first start.

**Route handler returns 404**

Confirm the handler file is at `app/api/svix/[...path]/route.ts` (note the catch-all `[...path]` segment). Also check that the `apiBaseUrl` prop on `<SvixAdmin>` matches your actual mount path — if you mounted it at `/api/webhooks`, pass `apiBaseUrl="/api/webhooks"`.

**Schema changes aren't taking effect**

Event types are registered (and updated) when the component mounts. If you change a schema, reload the page to re-trigger registration. The route handler calls `eventType.create` then falls back to `eventType.update` on conflict, so the latest schema is always synced on mount.

## Props Reference

### `SvixAdminProps`

| Prop | Type | Default | Description |
|---|---|---|---|
| `appName` | `string` | — | Svix Application name. The library calls `getOrCreate` with this name on mount. |
| `apiBaseUrl` | `string` | `/api/svix` | Base URL of the mounted route handler. |
| `eventTypes` | `EventTypeConfig[]` | — | List of event types to register and make available in the UI. |
| `className` | `string` | — | Additional CSS class applied to the root element. |

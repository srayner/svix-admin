/** Configuration for a single webhook event type shown in the admin UI. */
export interface EventTypeConfig {
  /** Svix event type identifier (e.g. `order.created`). */
  name: string
  /** Human-readable label shown in the UI. */
  label: string
  /** Optional longer description shown in the event type picker. */
  description?: string
  /**
   * OpenAPI 3.0 Schema Object for the event payload.
   * Every property **must** include an `example` value — Svix uses these
   * to generate the test payload when "Send Test Event" is clicked.
   */
  schema?: Record<string, unknown>
}

export type AuthMethodType = 'none' | 'bearer' | 'basic' | 'custom'

export interface CustomHeader {
  key: string
  value: string
}

export interface WebhookFormValues {
  url: string
  description: string
  eventTypes: string[]
  authMethod: AuthMethodType
  bearerToken: string
  basicUsername: string
  basicPassword: string
  customHeaders: CustomHeader[]
  disabled: boolean
}

/** Props for the `<SvixAdmin>` component. */
export interface SvixAdminProps {
  /** Svix application name. Used to call `getOrCreate` on mount. */
  appName: string
  /**
   * Base URL of the mounted route handler.
   * @default "/api/svix"
   */
  apiBaseUrl?: string
  /** Event types to register with Svix and expose in the UI. */
  eventTypes: EventTypeConfig[]
  /** Additional CSS class applied to the root element. */
  className?: string
}

/** A webhook endpoint as returned by the Svix API. */
export interface SvixEndpoint {
  id: string
  url: string
  description?: string
  /**
   * Event types this endpoint subscribes to.
   * `null` means the endpoint receives all event types.
   */
  filterTypes?: string[] | null
  disabled?: boolean
  headers?: Record<string, string>
  createdAt: string
  updatedAt: string
}

/** A Svix application. */
export interface SvixApp {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-27

Initial stable release.

### Added
- `<SvixAdmin>` component — embeddable webhook admin UI for Next.js App Router
- `svix-admin/server` route handler export for Next.js API routes
- Event type registration with optional OpenAPI 3.0 schema support
- "Send Test Event" dialog with per-property `example` hint when schema is missing
- Endpoint management: create, edit, delete, disable/enable
- Per-endpoint event type filtering
- Auth header support: Bearer token, HTTP Basic, custom headers
- Application rename via Settings tab
- Theming via shadcn/ui CSS variables
- `fetchWithTimeout` utility — all internal fetch calls time out after 10 s
- Full test suite (Vitest): route handler, form schema validation, fetch utility

### Fixed
- Schema stored without version wrapper — `schemas` passed directly to Svix API instead of `{ '1': schema }`, which caused "Send Test Event" to fail with an OpenAPI validation error

### Changed
- `SvixEndpoint.filterTypes` type corrected to `string[] | null` (was `string[] | undefined`); `null` means the endpoint receives all event types
- `WebhookFormValues` removed from public exports (internal type)
- JSDoc added to all public-facing interfaces (`EventTypeConfig`, `SvixAdminProps`, `SvixEndpoint`, `SvixApp`)
- `license` and `engines` fields added to `package.json`

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - Unreleased

### Changed (breaking)
- `zod`, `react-hook-form` and `@hookform/resolvers` are now peer dependencies instead of
  dependencies, so the library uses your app's copy instead of installing its own. Install
  them alongside the package:
  `npm install @srayner02/svix-admin svix zod react-hook-form @hookform/resolvers`
- Requires zod `^4.6.6`, `@hookform/resolvers` `^5.2.2` and `react-hook-form` `^7.55.0`.
  Zod 3 is no longer supported.

### Security
- Fixes CVE-2023-54404 (zod denial of service via unbounded array validation, fixed in
  zod 4.6.6). The library no longer installs its own nested zod 3 copy, and the zod peer
  range starts at 4.6.6, so npm warns if your app's zod is still affected.

## [1.1.0] - 2026-06-29

### Added
- "View signing secret" button on each endpoint, opening a dialog that loads the endpoint's
  signing secret and lets you copy it, for verifying deliveries in the receiving app.
- Route handler: `GET /endpoints/:id/secret?appId=…` returns the endpoint's signing secret.

### Fixed
- Type declarations for `@srayner02/svix-admin/server` are now always emitted and resolved
  (separate declaration build pass, plus `typesVersions` for older module resolution).
- `npm run build` clears `dist` first, so stale files from earlier builds aren't published.

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

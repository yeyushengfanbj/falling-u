# JD Union Integration Specification

## Purpose

The JD Union integration manages server-side product search, promotion-link generation, and future product synchronization.

## Requirements

### Requirement: Server-Only Credentials

JD Union credentials SHALL only be loaded from server environment variables.

#### Scenario: Frontend is built

- **WHEN** `npm run build` is executed
- **THEN** no JD Union `AppKey`, `AppSecret`, access token, site ID, position ID, or PID is required by frontend code.

### Requirement: Admin Authentication

Admin JD Union endpoints SHALL require `SERVER_ADMIN_TOKEN`.

#### Scenario: Missing admin token

- **WHEN** an unauthenticated request calls `/api/admin/jd/goods/search` or `/api/admin/jd/promotion/link`
- **THEN** the server rejects the request.

### Requirement: Product Search Proxy

The backend SHALL expose an admin-only product search proxy for JD Union goods query.

#### Scenario: Admin searches JD products

- **GIVEN** valid JD Union credentials and admin authorization
- **WHEN** the admin posts a keyword or SKU request to `/api/admin/jd/goods/search`
- **THEN** the server calls JD Union and returns normalized product fields plus the raw response for diagnostics.

### Requirement: Promotion Link Generation

The backend SHALL expose an admin-only endpoint to generate JD Union promotion links.

#### Scenario: Admin converts a JD item URL

- **GIVEN** valid JD Union credentials, promotion defaults, and admin authorization
- **WHEN** the admin posts a JD item URL to `/api/admin/jd/promotion/link`
- **THEN** the server calls JD Union promotion generation and returns the result without exposing secrets.


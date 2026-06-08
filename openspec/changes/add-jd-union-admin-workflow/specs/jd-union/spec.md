## ADDED Requirements

### Requirement: Normalized Search Result Contract

JD Union product search responses SHALL be normalized before they are used by admin UI or draft creation.

#### Scenario: JD Union returns raw goods data

- **GIVEN** JD Union returns a successful goods query response
- **WHEN** the backend responds to the admin search request
- **THEN** each candidate includes stable normalized fields for SKU, title, material URL, image URL, price, final price, commission share, coupon list, and raw source data.

### Requirement: Promotion Link Error Preservation

Promotion-link generation failures SHALL return useful error information to authenticated admins without leaking secrets.

#### Scenario: JD Union rejects a promotion request

- **GIVEN** an authenticated admin requests promotion-link generation
- **WHEN** JD Union returns an error
- **THEN** the backend returns a failure response that includes the safe JD error details and excludes credentials.

### Requirement: Promotion Defaults

Promotion-link generation SHALL use configured default promotion fields unless an authenticated admin supplies allowed overrides.

#### Scenario: Admin omits promotion placement fields

- **GIVEN** `.env` defines site, position, PID, or sub-union defaults
- **WHEN** an authenticated admin generates a promotion link without explicit placement fields
- **THEN** the backend uses the configured defaults in the JD Union request.


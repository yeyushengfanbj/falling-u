## ADDED Requirements

### Requirement: Outbound Click Recording

The system SHALL provide a server-side way to record outbound product click events.

#### Scenario: Product buy link is clicked

- **GIVEN** a public product exists
- **WHEN** a user clicks through to buy the product
- **THEN** the system records a best-effort click event with product ID, timestamp, referrer when available, and user-agent when available.

### Requirement: Redirect Resilience

Click tracking SHALL NOT block the user from reaching the JD Union promotion link.

#### Scenario: Click recording fails

- **GIVEN** click tracking storage is unavailable
- **WHEN** a user clicks a product buy link
- **THEN** the user is still redirected to the product's affiliate URL.

### Requirement: Admin Click Summary

The system SHALL expose an authenticated summary of product click counts.

#### Scenario: Admin views click summary

- **GIVEN** click events have been recorded
- **WHEN** an authenticated admin requests click metrics
- **THEN** the system returns click counts grouped by product ID.


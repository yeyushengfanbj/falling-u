## ADDED Requirements

### Requirement: Admin Product Search

The system SHALL provide an authenticated admin workflow to search JD products using keywords or SKU identifiers.

#### Scenario: Admin searches by keyword

- **GIVEN** a valid admin token and JD Union credentials are configured
- **WHEN** an admin searches for products with a keyword
- **THEN** the system returns normalized product candidates including SKU, title, price, image, commission fields when available, and raw diagnostic data.

### Requirement: Admin Promotion Link Generation

The system SHALL allow an authenticated admin to generate a JD Union promotion link for a selected JD product or material URL.

#### Scenario: Admin generates promotion link

- **GIVEN** a valid admin token, JD Union credentials, and promotion defaults are configured
- **WHEN** an admin requests promotion-link generation for a JD item URL
- **THEN** the system returns the JD Union promotion result without exposing credentials to the frontend.

### Requirement: Product Draft Creation

The system SHALL save selected JD products as reviewable drafts before publication.

#### Scenario: Admin saves search result as draft

- **GIVEN** an admin has selected a JD product and generated a promotion link
- **WHEN** the admin saves the item as a product draft
- **THEN** the draft contains source JD fields, promotion link, candidate image, price fields, category, specs, tags, and `importStatus`.

### Requirement: Product Draft Review

The system SHALL require product drafts to be reviewed before publication.

#### Scenario: Draft is missing required review fields

- **GIVEN** a product draft is missing summary, category, reliable image decision, or promotion link
- **WHEN** the admin attempts to publish it
- **THEN** the system rejects publication and reports the missing fields.

### Requirement: Product Publication

The system SHALL publish only reviewed product drafts into the public catalog.

#### Scenario: Reviewed draft is published

- **GIVEN** a product draft has `importStatus` set to `ready` and required public fields are valid
- **WHEN** the admin publishes the draft
- **THEN** the product is added to the public catalog and can be returned by `/api/products` after reload or rebuild.


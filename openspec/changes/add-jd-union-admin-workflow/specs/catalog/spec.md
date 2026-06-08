## ADDED Requirements

### Requirement: Draft Lifecycle

The catalog SHALL support a draft lifecycle before products become public.

#### Scenario: Product is imported from JD source data

- **WHEN** a JD product is imported from share text or API search
- **THEN** it is stored as a draft until reviewed and marked ready.

### Requirement: Publication Validation

The catalog SHALL validate reviewed drafts before publishing them to public product data.

#### Scenario: Ready draft is merged

- **GIVEN** a draft is marked `ready`
- **WHEN** publication or merge runs
- **THEN** the system validates required product fields, affiliate link format, category, prices, specs, and duplicate product identifiers.

### Requirement: Duplicate Prevention

The catalog SHALL prevent duplicate public products based on product ID and affiliate URL.

#### Scenario: Duplicate draft is published

- **GIVEN** the public catalog already contains a product with the same ID or affiliate URL
- **WHEN** publication attempts to add the duplicate draft
- **THEN** the system rejects or skips the duplicate with a clear diagnostic message.


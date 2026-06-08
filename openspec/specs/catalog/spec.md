# Product Catalog Specification

## Purpose

The catalog defines the public product data used by the static frontend and backend product API.

## Requirements

### Requirement: Product Records

Each public product SHALL include a stable `id`, `category`, display `name`, original `jdTitle`, `summary`, `bestFor`, `priceBand`, `jdPrice`, `finalPrice`, `affiliateUrl`, `typeLabel`, `specs`, and `tags`.

#### Scenario: Product is rendered on public pages

- **GIVEN** a product exists in `src/data/products.json`
- **WHEN** the home page, category page, or detail page renders the product
- **THEN** the page can display the name, summary, pricing, tags, and buy action without missing required fields.

### Requirement: Affiliate Link Validity

Each public product SHALL use a JD Union promotion link for `affiliateUrl`.

#### Scenario: Catalog link audit runs

- **WHEN** `npm run check:links` is executed
- **THEN** every public `affiliateUrl` uses an accepted JD Union short-link format.

### Requirement: Category Coverage

The first operational catalog target SHALL be at least 30 products with at least 6 products in each core category.

#### Scenario: Catalog audit runs

- **WHEN** `npm run audit:catalog` is executed
- **THEN** the audit reports total product count and per-category gaps against the configured target.

### Requirement: Image Reliability

Product images SHALL be used only when they are reliable and match the JD product being promoted.

#### Scenario: Product image is unavailable or unverified

- **GIVEN** a product lacks a reliable image
- **WHEN** the product card renders
- **THEN** the UI uses the existing non-misleading fallback treatment instead of a mismatched product image.


# Public Shopping Experience Specification

## Purpose

The public site should feel like a usable product list and shopping discovery experience, not a blog-first site.

## Requirements

### Requirement: Home Product Discovery

The home page SHALL prioritize product search, filtering, and product cards.

#### Scenario: User lands on home page

- **WHEN** a user opens `/`
- **THEN** they can immediately search or browse products without first entering a blog-style article flow.

### Requirement: Category Product Lists

Category pages SHALL present products as stable shopping lists.

#### Scenario: User opens a category

- **WHEN** a user opens `/categories/<slug>/`
- **THEN** they see products in that category with pricing, tags, summaries, and buy actions.

### Requirement: Product Details

Product detail pages SHALL provide enough information to decide whether to click through to JD.

#### Scenario: User opens product detail

- **WHEN** a user opens `/products/<id>/`
- **THEN** they see product title, summary, pricing, key specs, suitable use case, and a JD Union buy action.

### Requirement: Affiliate Disclosure

Public pages SHALL disclose that some links may be affiliate promotion links.

#### Scenario: User views a page with buy links

- **WHEN** a page contains JD buy links
- **THEN** the site includes a clear affiliate disclosure.


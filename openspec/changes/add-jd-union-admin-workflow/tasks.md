## 1. Backend Admin APIs

- [ ] 1.1 Add a draft repository module for reading and writing product drafts.
- [ ] 1.2 Add an authenticated API to save a normalized JD search result as a draft.
- [ ] 1.3 Add an authenticated API to list product drafts.
- [ ] 1.4 Add an authenticated API to update draft fields and review status.
- [ ] 1.5 Add an authenticated API to publish ready drafts into the public catalog or merge pipeline.

## 2. JD Union Workflow

- [ ] 2.1 Verify `/api/admin/jd/goods/search` works with real JD Union credentials.
- [ ] 2.2 Verify `/api/admin/jd/promotion/link` works with real promotion defaults.
- [ ] 2.3 Normalize promotion-link responses into stable fields for admin workflow use.
- [ ] 2.4 Preserve safe JD Union error details for admin diagnostics.

## 3. Admin UI

- [ ] 3.1 Add a minimal admin page gated by `SERVER_ADMIN_TOKEN` entry.
- [ ] 3.2 Add JD product search form with keyword and SKU modes.
- [ ] 3.3 Add search result cards with title, price, image, SKU, commission, and action buttons.
- [ ] 3.4 Add one-click promotion-link generation for a selected product.
- [ ] 3.5 Add draft preview and edit controls for category, summary, specs, tags, image, and review status.
- [ ] 3.6 Add publish action for reviewed drafts.

## 4. Catalog Validation

- [ ] 4.1 Extend draft validation to require public product fields before publish.
- [ ] 4.2 Prevent duplicate product IDs and affiliate URLs during publish.
- [ ] 4.3 Keep `npm run audit:catalog` and `npm run check:links` passing after published drafts are merged.

## 5. Click Tracking

- [ ] 5.1 Add a server-side click event repository.
- [ ] 5.2 Add an API endpoint to record product outbound clicks.
- [ ] 5.3 Wire public buy or go flow to record clicks best-effort before redirect.
- [ ] 5.4 Add an authenticated API endpoint for click counts grouped by product ID.

## 6. Verification

- [ ] 6.1 Add focused tests or script-level checks for draft validation and duplicate prevention.
- [ ] 6.2 Run `npx @fission-ai/openspec validate --all --strict`.
- [ ] 6.3 Run `npm run audit:catalog`.
- [ ] 6.4 Run `npm run check:links`.
- [ ] 6.5 Run `npm run build`.


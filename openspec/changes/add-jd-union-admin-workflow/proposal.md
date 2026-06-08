## Why

falling-u currently has JD Union API endpoints and import scripts, but adding products still depends on manual copying, review, and JSON edits. A small admin workflow is needed now so product search, promotion-link generation, draft review, and publishing can be managed consistently before the catalog grows beyond the initial 6 products.

## What Changes

- Add an admin product workflow for JD Union goods search, promotion-link generation, and draft saving.
- Add a reviewable product draft lifecycle before products enter the public catalog.
- Add a click-tracking foundation for `/go/[id]` so product performance can be measured later.
- Keep the public frontend static and keep JD Union credentials server-only.

## Capabilities

### New Capabilities

- `admin-product-workflow`: Admin workflow for searching JD products, generating promotion links, saving drafts, and publishing reviewed products.
- `click-tracking`: Server-side foundation for recording product outbound click events.

### Modified Capabilities

- `jd-union`: Extends the existing JD Union integration from raw API proxy endpoints toward a managed admin workflow.
- `catalog`: Adds draft lifecycle requirements before products are published.

## Impact

- Affected frontend areas: future admin pages under `src/pages` or a server-rendered admin surface.
- Affected backend areas: `server/index.mjs`, `server/lib/*`, product/draft repository logic.
- Affected data areas: `imports/product-drafts.json`, `src/data/products.json`, possible future `data/` storage.
- Affected operations: `.env` must include JD Union credentials and `SERVER_ADMIN_TOKEN`.


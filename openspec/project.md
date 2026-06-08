# Project: falling-u

## Purpose

falling-u is a consumer-facing product discovery and affiliate commerce site focused on JD products. It helps users search, filter, compare, and click through to JD Union promotion links.

## Current Stack

- Frontend: Astro static site.
- Styling: project CSS in `src/styles/global.css`.
- Content: Markdown guides in `src/content/guides/`.
- Product catalog: JSON in `src/data/products.json` with TypeScript shape in `src/data/products.ts`.
- Backend: Node HTTP service in `server/`, mounted under `/api/*` in production.
- Affiliate integration: JD Union Open Platform through server-only credentials.

## Development Rules

- Keep JD Union credentials out of frontend code.
- Public buy links must use JD Union promotion links, not plain JD item links.
- Product images must be reliable and match the target JD product.
- New products should enter a reviewable draft state before publishing.
- Prefer static frontend output until product volume or refresh needs justify a database.
- Validate catalog and affiliate links before build.

## Key Commands

```bash
npm run dev
npm run server:dev
npm run audit:catalog
npm run check:links
npm run build
```

## OpenSpec Workflow

- Use `openspec/specs/` for accepted product and system behavior.
- Use `openspec/changes/<change-id>/` for proposed changes before implementation.
- Each change should include `proposal.md`, `design.md`, `tasks.md`, and affected spec deltas.
- Run OpenSpec validation before implementing or archiving a change.


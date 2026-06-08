## Context

falling-u currently has a static Astro frontend backed by `src/data/products.json`, import scripts for copied JD share text, and a Node service with admin-only JD Union proxy endpoints. The next operational bottleneck is product onboarding: searching JD goods, converting promotion links, reviewing metadata, and publishing products are still separate manual steps.

## Goals / Non-Goals

**Goals:**

- Provide a minimal admin workflow for JD product search, promotion-link generation, draft review, and publishing.
- Keep JD Union credentials server-only.
- Preserve static public pages and the current JSON catalog until catalog size or refresh needs justify a database.
- Introduce click tracking in a way that does not block or slow down outbound JD redirects.

**Non-Goals:**

- Building a full marketplace, cart, checkout, or user account system.
- Fully automatic product publishing without human review.
- Replacing Astro static output with a dynamic frontend app.
- Adding a database in the first implementation unless JSON storage becomes a clear blocker.

## Decisions

### Decision: Use the Existing Node Server for Admin APIs

The admin workflow will extend `server/index.mjs` and `server/lib/*` instead of adding a separate backend framework. This keeps deployment simple: Astro remains static and Nginx proxies `/api/*` to one local Node process.

Alternative considered: introduce Express, Fastify, or a separate service. Rejected for now because current requirements are small and the existing server already handles routing, JSON, auth, and JD Union calls.

### Decision: Keep Drafts as Files Before Introducing a Database

Product drafts will continue to use file-backed JSON, compatible with `imports/product-drafts.json` and existing merge scripts. This makes product review easy to inspect and keeps the first implementation low-risk.

Alternative considered: use SQLite immediately. Deferred until product count, daily refresh needs, or admin concurrency make file storage awkward.

### Decision: Admin Publishing Requires Review

JD search results and promotion links will save into draft records first. Publishing will require required fields and explicit review status, because JD titles, images, prices, and activity links can be noisy or mismatched.

Alternative considered: auto-publish search results after conversion. Rejected because it risks public pages showing bad images, weak summaries, or non-converting links.

### Decision: Click Tracking Must Be Best-Effort

`/go/[id]` click recording should never prevent redirecting users to JD. The tracking path can record asynchronously or fail silently after logging server-side.

Alternative considered: require successful event persistence before redirect. Rejected because affiliate conversion is more important than perfect analytics.

## Risks / Trade-offs

- JD Union API permissions may differ by account or require additional fields → keep raw responses in admin results and document required `.env` values.
- File-backed draft storage can conflict if multiple admins edit simultaneously → acceptable for single-operator MVP; move to SQLite later.
- Product images from JD search may still mismatch variants → require preview and manual review before publish.
- Click tracking through a static `/go/[id]` page may need a backend event call → record best-effort and preserve the existing redirect behavior.


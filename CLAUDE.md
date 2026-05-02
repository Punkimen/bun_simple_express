# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev          # Start dev server with hot reload on port 3000
bun run typecheck    # Run TypeScript type checking (no emit)
bun build.ts         # Build to ./build/ directory (target: bun)
bun install          # Install dependencies
```

No test runner is configured.

## Environment

Requires a `.env` file with:

- `DATABASE_URL` — PostgreSQL connection string (e.g. `postgresql://max@localhost:5432/budjet`)
- `ADMIN_LOGIN` / `ADMIN_PASSWORD` — hardcoded single-user credentials
- `AUTH_COOKIE_KEY` — value stored in the `auth` cookie to validate sessions

Database schema is in `src/server/db/schema.sql`. Apply it manually via `psql`.

## Architecture

This is a single-user personal budget tracker. There is no user table — authentication is a single admin login checked against env vars, with session state held in an `auth` cookie.

### Custom HTTP framework (`src/server/app.ts`)

The app does **not** use Express or Hono. `createApp()` builds a minimal wrapper around `Bun.serve()` that:

- Stores routes in a plain object passed directly to `Bun.serve({ routes })`
- Runs a middleware chain (`app.use(cb)`) before every route handler
- Provides `app.methodGet/Post/Put/Delete` for JSON API routes and `app.methodHtml` for EJS-rendered HTML routes
- Serves static files from `src/client/public/` under the `/public` path via the `fetch` fallback

### Request flow

```
Bun.serve
  ├── routes object  → wrapWithMiddleware → executeMiddleware → handler
  └── fetch fallback → static files from src/client/public/
```

Unmatched non-`/public` requests in the `fetch` fallback redirect to `/login` (separate from the auth middleware).

### Auth middleware (`src/server/middlewares/authMiddleware.ts`)

Applied globally. Public routes: `/login`, `/api/login`, `/public/*`. Unauthenticated API requests get 401 JSON; unauthenticated page requests get 302 to `/login`. Detects HTMX requests via `HX-Request` header and responds with `HX-Redirect` instead of 302.

### Module structure

Each domain (transactions, categories, users, login) has a `routes.ts` and `controller.ts` under `src/server/modules/<name>/`. Controllers are plain classes exported as singletons. Routes are registered by calling `init*Routes(app)` in `src/server/index.ts`.

### Rendering

- Full pages: `renderPage(pageName)` wraps an EJS page in `layout.ejs`
- Partial HTML (for HTMX swaps): `renderHtmlPart({ clientPath, name }, data)` renders a partial EJS template directly
- EJS templates live in `src/client/views/` split into `pages/`, `partials/`, and `layout/`

### Frontend

Alpine.js (`budgetApp`, `categoryForm`, `transactionForm` components) handles client-side state in `src/client/public/js/index.js`. HTMX is loaded but Alpine.js fetch calls are used for the main data flows. Custom events (`category-created`, `transaction-created`) coordinate between Alpine components.
Необходимо по возможности использовать htmx - для отправки форм (hx-post) hx-ext="json-enc"
Новые модули и функционал важно разносить по client/views/partials и подключать в index.ejs

### Database

`src/server/db/db.ts` exports a single `Bun.SQL` instance. Queries use the tagged template literal syntax: `` db`SELECT ...` ``. Tables: `categories` (id, name, type) and `transactions` (id, category_id, amount, date, note).

### Error handling

`AppError` (and subclasses `NotFoundError`, `UnauthorizedError`, `BadRequestError`) in `src/server/utils/error.ts` are caught by `wrapWithMiddleware` in `app.ts` and serialized as `{ error: message }` JSON with the appropriate HTTP status.

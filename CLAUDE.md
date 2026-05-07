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
- `JWT_ACCESS_SECRET` — secret for signing access JWT tokens
- `JWT_REFRESH_SECRET` — secret for signing refresh JWT tokens

Database schema is managed via Prisma (`src/server/prisma/schema.prisma`). Run migrations with `bunx prisma migrate dev`.

## Architecture

This is a multi-user budget tracker. Users register and log in with email/password. Auth is JWT-based: a short-lived access token (httpOnly cookie) and a long-lived refresh token stored in the `refresh_tokens` table, supporting multiple concurrent sessions per user (multiple devices).

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

Applied globally. Public routes: `/login`, `/register`, `/api/login`, `/api/register`, `/public/*`. Validates the access JWT from the httpOnly cookie; on expiry, attempts silent refresh via the refresh token. Unauthenticated API requests get 401 JSON; unauthenticated page requests get 302 to `/login`. Detects HTMX requests via `HX-Request` header and responds with `HX-Redirect` instead of 302. On successful token validation, attaches `user_id` to the request context so controllers can scope queries to the current user.

### Module structure

Each domain (transactions, categories, users, auth) has a `routes.ts` and `controller.ts` under `src/server/modules/<name>/`. Controllers are plain classes exported as singletons. Routes are registered by calling `init*Routes(app)` in `src/server/index.ts`. The `auth` module handles registration, login, logout, and token refresh.

### Rendering

- Full pages: `renderPage(pageName)` wraps an EJS page in `layout.ejs`
- Partial HTML (for HTMX swaps): `renderHtmlPart({ clientPath, name }, data)` renders a partial EJS template directly
- EJS templates live in `src/client/views/` split into `pages/`, `partials/`, and `layout/`

### Frontend

Alpine.js (`budgetApp`, `categoryForm`, `transactionForm` components) handles client-side state in `src/client/public/js/index.js`. HTMX is loaded but Alpine.js fetch calls are used for the main data flows. Custom events (`category-created`, `transaction-created`) coordinate between Alpine components.
Необходимо по возможности использовать htmx - для отправки форм (hx-post) hx-ext="json-enc"
Новые модули и функционал важно разносить по client/views/partials и подключать в index.ejs

### Database

Managed via Prisma ORM. Schema: `src/server/prisma/schema.prisma`. Generated client: `src/server/generated/prisma`. Tables: `users` (id, name, email, password, created_at), `refresh_tokens` (id, token, user_id, expires_at, created_at), `categories` (id, name, type, user_id), `transactions` (id, category_id, amount, date, note, user_id). All data is scoped to `user_id` — queries must always filter by the authenticated user.

### Error handling

`AppError` (and subclasses `NotFoundError`, `UnauthorizedError`, `BadRequestError`) in `src/server/utils/error.ts` are caught by `wrapWithMiddleware` in `app.ts` and serialized as `{ error: message }` JSON with the appropriate HTTP status.

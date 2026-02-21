# vercel-be-node-template

Reusable Node.js backend template for Vercel (Express + TypeScript), extracted from real production service patterns.

## Start a new service in 5 minutes

### 1. Prerequisites

- Node.js `20.x` (matches `package.json` engines)
- npm `>=10`

### 2. Install dependencies

```bash
npm install
```

### 3. Bootstrap service identity

Minimal:

```bash
npm run bootstrap -- --service-name your-service-name --version 0.1.0
```

With scoped package name:

```bash
npm run bootstrap -- --service-name your-service-name --package-name @your-org/your-service-name --version 0.1.0
```

What this updates automatically:

- `package.json` + `package-lock.json` name/version
- `SERVICE_NAME` / `SERVICE_VERSION` in all `*.env.example` files
- test defaults in `test/setup-env.ts`
- README title

### 4. Configure local environment

```bash
cp .env.local.example .env.local
```

Set `SITE_URL` to your canonical API domain before deploying (example: `https://api.yourdomain.com`).

### 5. Run locally

```bash
npm run dev
```

Expected local URLs:

- `http://localhost:3001/`
- `http://localhost:3001/api/v1/health`
- `http://localhost:3001/api/v1/docs`

### 6. Validate before pushing

```bash
npm run ci
```

This runs lint, typecheck, tests, and build.

## Deploy to Vercel

1. Push repository to GitHub.
2. Import project in Vercel.
3. Set environment variables in Vercel Project Settings.
4. Deploy.

`vercel.json` already rewrites `/api/*` to `api/index.ts`.

## Google + AEO/GEO checklist

1. Set `SITE_URL` to your production canonical domain in Vercel env vars.
2. Keep crawler endpoints enabled: `GET /robots.txt`, `GET /sitemap.xml`, `GET /llms.txt`.
3. Submit `${SITE_URL}/sitemap.xml` in Google Search Console.
4. Add clear repo description and topics on GitHub (these influence search and AI retrieval quality).
5. Keep `README.md`, `/api/v1/docs`, and `/api/v1/openapi.json` aligned with actual behavior.

## What you get

- Express + TypeScript strict mode
- Shared app factory for local server and Vercel serverless runtime
- Versioned API routing under `/api/v1`
- Structured logs with Pino + `x-request-id` correlation
- Security middleware (`helmet`, CORS, compression, body limits)
- Standardized success/error response envelopes
- OpenAPI JSON + Swagger UI
- Pluggable auth and rate-limit abstractions
- Unit/integration/smoke tests with coverage thresholds
- CI workflow (`.github/workflows/ci.yml`)

## Key architecture

Entrypoints:

- `src/app.ts`: app composition
- `src/server.ts`: local Node bootstrap
- `api/index.ts`: Vercel function entrypoint

Core modules:

- `src/config/*`: env loading + Zod validation
- `src/middleware/*`: request ID, error handling, not-found, validation helper
- `src/modules/system/*`: health/readiness/meta endpoints
- `src/modules/docs/*`: OpenAPI + Swagger routes
- `src/modules/auth/*`: auth strategy contracts + middleware
- `src/modules/rate-limit/*`: rate-limit store contract + middleware

## Scripts

- `npm run dev`: local watch mode
- `npm run lint`: ESLint
- `npm run typecheck`: TypeScript checks
- `npm test`: tests with coverage
- `npm run test:watch`: tests in watch mode
- `npm run test:smoke`: Vercel entrypoint smoke test only
- `npm run build`: compile to `dist/`
- `npm run start`: run compiled server
- `npm run ci`: lint + typecheck + test + build
- `npm run bootstrap -- --service-name <name> [--package-name <name>] [--version <semver>]`: initialize service metadata

## Configuration

All env vars are validated at startup in `src/config/env.ts`.

Important vars:

- `APP_ENV` (`local|preview|production`)
- `PORT`
- `SITE_URL` (canonical public base URL, no path)
- `LOG_LEVEL`
- `CORS_ORIGINS` (comma-separated)
- `DOCS_ENABLED`
- `RATE_LIMIT_ENABLED`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`
- `AUTH_ENABLED`
- `READINESS_FAIL`
- `SERVICE_NAME`, `SERVICE_VERSION`, `COMMIT_SHA`

Env loading precedence:

1. runtime env vars
2. target file (`.env.local` / `.env.preview` / `.env.production`)
3. base `.env`

## Auth and rate limiting

- Auth is strategy-driven via `src/modules/auth/types.ts`.
- If `AUTH_ENABLED=true`, app startup requires an `authStrategy`.
- Rate limiting is store-driven via `src/modules/rate-limit/types.ts`, with noop default.

For production services, pass concrete implementations into `createApp({ authStrategy, rateLimitStore })`.

## Public endpoints

- `GET /`
- `GET /robots.txt`
- `GET /sitemap.xml`
- `GET /llms.txt`
- `GET /api/v1/health`
- `GET /api/v1/ready`
- `GET /api/v1/meta`
- `GET /api/v1/openapi.json`
- `GET /api/v1/docs`
- `GET /api/docs` -> `307` redirect to `/api/v1/docs`
- `GET /api/openapi.json` -> `307` redirect to `/api/v1/openapi.json`

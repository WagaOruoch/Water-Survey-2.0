# Water Site Survey 2.0

Web-based water-site survey platform with Google-authenticated access, structured form capture, operational response management, and analytics dashboards.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend | Django + Django REST Framework + SimpleJWT |
| Database | PostgreSQL |
| Auth | Google Identity (frontend) + JWT issuance on backend |

## Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Create `backend/.env` (keys used by current settings):

```env
SECRET_KEY=replace-me
DB_NAME=water_survey
DB_USER=postgres
DB_PASSWORD=replace-me
DB_HOST=localhost
DB_PORT=5432
GOOGLE_OAUTH_CLIENT_ID=replace-me

# Cache backend (locmem or redis)
CACHE_BACKEND=locmem
REDIS_URL=redis://127.0.0.1:6379/1
ANALYTICS_SUMMARY_CACHE_TTL=120
DASHBOARD_SUMMARY_CACHE_TTL=60
DASHBOARD_RECENT_CACHE_TTL=30

# Optional Cloudinary image hosting
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

To enable Redis-backed caching, set:

```env
CACHE_BACKEND=redis
REDIS_URL=redis://127.0.0.1:6379/1
```

Backend runs on `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=replace-me
```

Frontend runs on `http://localhost:3000`.

## App Flow

1. Landing page (`/`) with `Log In`
2. Login page (`/login`) using Google sign-in
3. Protected app shell (`/app/*`) with sidebar:
   - `Dashboard`
   - `Surveys`
   - `Responses`
   - `Analytics`

## Implemented Features

### Surveys
- Full dynamic form with conditional sections/fields.
- Client validation and hidden-field clearing.
- Authenticated submission to backend.

### Responses (Operational)
- Paginated list view.
- Server-side filtering/sorting.
- Inline record detail expansion.
- CSV export with applied filters.

### Dashboard (Operational Snapshot)
- KPI summary cards from live data.
- Recent activity (top 5).
- Insight links deep-linking to filtered `Responses`.

### Analytics v1 (Interpretation)
- Date-range + site filter.
- KPI cards (submissions, staffed %, treated %).
- Submissions trend chart with `Bar | Line` toggle.
- Water source distribution chart.
- Site coverage donut chart.
- Service quality indicators.
- Drill-through links to filtered `Responses`.

## API Endpoints

Base prefix: `/api/`

- `POST /auth/google/`
- `GET /responses/` (filters, sorting, pagination)
- `POST /responses/`
- `GET /responses/<uuid:pk>/`
- `GET /responses/export/csv/`
- `GET /dashboard/summary/`
- `GET /dashboard/recent/`
- `GET /analytics/summary/`

## API Performance Testing

You can profile API latency and rank slow endpoints directly from Django.

### 1) Enable per-request profiling headers

Set in `backend/.env`:

```env
API_PROFILING_ENABLED=true
```

Then restart backend. API responses include:

- `X-Response-Time-ms` — total backend request time
- `X-DB-Query-Count` — SQL queries executed (DEBUG mode)
- `X-DB-Time-ms` — cumulative SQL time in ms (DEBUG mode)

### 2) Run repeatable API benchmarks

From `backend/`:

```bash
python manage.py benchmark_apis --preset load --runs 20 --warmup 3
```

From project root (PowerShell, one command with timestamped reports):

```powershell
.\backend\scripts\run_api_perf.ps1 -Preset load -Runs 20 -Warmup 3
```

Optional flags:

- `--preset smoke|load` (`smoke` is lighter; `load` includes heavier endpoints)
- `--endpoint /api/analytics/summary/?start_date=2026-01-01&end_date=2026-01-31` (repeatable)
- `--email you@example.com` (pick specific user data)
- `--fail-on-error` (stop on first HTTP 4xx/5xx)
- `--output-json backend/perf-reports/latest.json`
- `--output-csv backend/perf-reports/latest.csv`

Output is sorted slowest-first and includes average, median, p95, min/max, status codes, and DB query/time averages (when profiling headers are enabled).

### How to interpret slowness quickly

- High `avg_db_queries` → likely N+1/extra ORM work; reduce queries, prefetch/select related.
- High `avg_db_ms` but low query count → expensive query; add indexes, tighten filters, reduce scans.
- High response time but low DB time → Python serialization/business logic overhead; optimize processing and payload size.

### Frontend Lighthouse (production mode)

Run Lighthouse against production frontend build for reliable metrics:

```bash
cd frontend
npm run build
npm run start
```

Then run Lighthouse against `http://localhost:3000/app/analytics` (Incognito, extensions disabled recommended).

## CI/CD with GitHub Actions

This repo includes GitHub-native CI/CD workflows:

- CI workflow: `.github/workflows/ci.yml`
- CD workflow: `.github/workflows/cd.yml`

### CI (automatic quality checks)

Runs on every push and pull request to `main`:

- Backend:
  - install dependencies
  - validate migrations are committed
  - run migrations
  - run `python manage.py check`
- Frontend:
  - `npm ci`
  - `npm run lint`
  - `npm run build`

### CD (automatic deployment trigger)

Runs after CI succeeds on a `main` push (or manual trigger), then calls Render deploy hooks.

Set these repository secrets in GitHub (`Settings -> Secrets and variables -> Actions`):

- `FRONTEND_DEPLOY_HOOK_URL` (Render frontend service deploy hook)
- `BACKEND_DEPLOY_HOOK_URL` (example: Render Deploy Hook)

If a hook secret is missing, that deploy job is skipped automatically.

### Recommended provider mapping

- Frontend (Next.js): Render Web Service
- Backend (Django): Render Web Service
- Database: Render PostgreSQL

## Render Deployment (full project)

This repository is Render-ready via `render.yaml` in the project root.

### One-click blueprint setup

1. Push this repo to GitHub.
2. In Render, choose **New +** -> **Blueprint**.
3. Select this repository and deploy.

Render provisions:

- `water-survey-backend` (Python web service)
- `water-survey-frontend` (Node web service)
- `water-survey-db` (PostgreSQL)

### Render commands used

Backend:

- Build: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate --noinput`
- Start: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`

Frontend:

- Build: `npm ci && npm run build`
- Start: `npm run start`

### Required Render environment variables

Backend service:

- `SECRET_KEY` (generated by Render in blueprint)
- `DATABASE_URL` (injected from Render PostgreSQL in blueprint)
- `GOOGLE_OAUTH_CLIENT_ID`
- `CORS_ALLOWED_ORIGINS` (comma-separated, include frontend URL)
- `CSRF_TRUSTED_ORIGINS` (comma-separated, include `https://<frontend>.onrender.com`)
- `FRONTEND_URL` (frontend public URL)
- Optional Cloudinary keys

Frontend service:

- `NEXT_PUBLIC_API_URL` (e.g. `https://<backend>.onrender.com/api`)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### Backend health endpoint

- Health path for Render: `GET /api/health/`

### Suggested branch strategy

1. Open PRs into `main` (CI runs).
2. Merge only when CI is green.
3. Merge to `main` triggers CD hook(s) for deployment.

### Optional hardening next steps

- Add backend test suite and run in CI.
- Add frontend tests (Playwright or Vitest) in CI.
- Add protected branch rule: require CI to pass before merge.
- Add environment-specific secrets (`staging`/`production`) using GitHub Environments.

## Responses Query Parameters

Supported on `GET /responses/` and CSV export:

- `site_name`
- `is_staffed` (`yes|no`)
- `water_source_type`
- `water_is_treated` (`yes|no`)
- `used_for_drinking` (`yes|no`)
- `submitted_after` (`YYYY-MM-DD`)
- `submitted_before` (`YYYY-MM-DD`)
- `period` (`this_week|this_month`)
- `ordering` (`submitted_at|-submitted_at|site_code|-site_code|site_name|-site_name`)
- `page`
- `page_size`

## Data Model Note

Each submission is stored in a flat `survey_responses` row. Multi-select form fields are expanded to boolean columns:

- `True` = option selected
- `False` = option visible but not selected
- `NULL` = question not shown

## Project Structure (High Level)

```text
backend/apps/surveys/
  models.py
  serializers.py
  views.py
  urls.py

frontend/
  app/
    page.tsx
    login/page.tsx
    app/
      dashboard/page.tsx
      surveys/page.tsx
      responses/page.tsx
      analytics/page.tsx
  components/
    auth/
    navigation/
    survey/
  lib/api.ts
  lib/formEngine.ts
  types/survey.ts
```

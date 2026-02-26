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

- Python 3.11+
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

# Optional Cloudinary image hosting
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
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

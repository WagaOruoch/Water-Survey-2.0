# Water Site Survey

A web-based field data collection tool for water site assessments. Enumerators fill out a structured survey covering site background, staff interviews, and direct site observations. Responses are stored in PostgreSQL with one column per field for direct analytical use.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend | Django 6, Django REST Framework |
| Database | PostgreSQL |

---

## Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL running locally

---

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

Create `backend/.env`:

```
DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/water_survey
SECRET_KEY=your-secret-key
DEBUG=True
```

Apply migrations and start the server:

```bash
python manage.py migrate
python manage.py runserver
```

The API will be available at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

The form will be available at `http://localhost:3000`.

---

## Project Structure

```
backend/
  apps/surveys/
    models.py        — SurveyResponse model (flat columnar schema)
    serializers.py   — DRF serializer; expands multi-select arrays to boolean columns
    views.py         — Single POST endpoint
    admin.py         — Django Admin with fieldsets
    migrations/      — 0001 initial → 0002 flat columns → 0003 rename columns

frontend/
  app/               — Next.js App Router entry point
  components/survey/
    SurveyForm.tsx   — Top-level form controller (state, validation, submit)
    sections/        — Background, StaffInterview, SiteObservation components
    fields/          — Reusable field components (SelectOne, SelectMultiple, etc.)
  lib/
    formEngine.ts    — Pure logic: visibility flags, field clearing
    api.ts           — Axios POST to backend
  types/
    survey.ts        — TypeScript types and FieldId union
```

---

## Data Schema

Each survey submission is one row in the `survey_responses` table. Multi-select questions (dry months, treatment methods, shore distances) are stored as individual boolean columns — `True` = selected, `False` = not selected, `NULL` = question was not shown to the enumerator.

---

## Source Form

`Water_Site_Survey.xlsx` — the original XLSForm this application is based on.

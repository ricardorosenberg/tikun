# Tikun

**Tikun** is a production-ready, accessibility-first assistive sound recognition web app. It helps people with hearing impairments receive alerts they can see and feel through visual flashes, vibration, and optional audio cues.

**Tagline:** _“Alerts that you can see and feel.”_

## Repository structure

```
/apps
  /api       FastAPI backend + YAMNet embeddings + kNN classifier
  /web       Next.js (App Router) + Tailwind UI
/packages
  /shared    Shared types
```

## Tech stack

- **Frontend:** Next.js (App Router) + TypeScript + TailwindCSS
- **Backend:** FastAPI + TensorFlow (YAMNet) + scikit-learn kNN
- **Auth/DB:** Supabase Auth + Postgres (preferred) or local SQLite fallback
- **Storage:** embeddings + labels only (no raw audio stored by default)

## Setup

### 1) Prerequisites

- Node.js 20+
- Python 3.11+
- (Optional) Docker for Postgres

### 2) Clone & install

```bash
npm install
```

### 3) Environment variables

Create `.env` files from the examples:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

**Supabase (recommended)**

Set these in `apps/web/.env`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Set this in `apps/api/.env` to validate Supabase JWTs:

```
TIKUN_SUPABASE_JWT_SECRET=your_supabase_jwt_secret
```

**Local dev auth (fallback)**

If Supabase isn’t configured, Tikun falls back to local SQLite auth with stub email delivery (links are printed to the server console).

### 4) Database (optional local Postgres)

```bash
docker compose up -d
```

Then set `TIKUN_DATABASE_URL` in `apps/api/.env`:

```
TIKUN_DATABASE_URL=postgresql+psycopg2://tikun:tikun@localhost:5432/tikun
```

### 5) Run locally

```bash
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:8000

## Usage flow

1. **Sign up / Login**
   - Email verification and password reset supported via Supabase or local stub.
2. **Dashboard**
   - Create sound definitions (e.g., Door knock, Fire alarm).
3. **Training wizard**
   - Record short clips and confirm labels (Yes / No / Similar).
4. **Tikun Listening**
   - Live inference every ~1s, alerts with flash + vibration + optional beep.

## API overview

### Authentication
- `POST /api/auth/signup` – create new user account
- `POST /api/auth/login` – login with email and password
- `POST /api/auth/verify` – verify email with token
- `POST /api/auth/forgot` – request password reset
- `POST /api/auth/reset` – reset password with token

### Sounds
- `POST /api/sounds` – create sound
- `GET /api/sounds` – list sounds
- `PATCH /api/sounds/:id` – update sound
- `DELETE /api/sounds/:id` – delete sound

### Training & Inference
- `POST /api/train/sample` – upload clip + label; stores embedding
- `POST /api/train/rebuild` – rebuild user classifier
- `POST /api/infer` – classify a chunk
- `GET /api/detections` – history

## Testing

```bash
npm run test
```

## Notes on privacy & accessibility

- Audio is processed for recognition only. By default, only embeddings are stored.
- UI uses large buttons, clear contrast, and keyboard-focus styles.
- Use HTTPS in production for microphone + vibration access.

## Seed/demo data

Use the UI on `/dashboard` to add common sounds (Door knock, Fire alarm, Phone ringing), or run:

```bash
python apps/api/scripts/seed_demo.py
```

## Performance

- YAMNet is loaded once and reused in memory.
- kNN classifier supports incremental updates and fast inference.
- Rate limiting and upload size limits protect the inference endpoint.

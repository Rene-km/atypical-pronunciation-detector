# Say It Right — Atypical Pronunciation Detector

An AI-powered web app that helps learners improve their spoken English. A user
picks a target phrase, records themselves saying it in the browser, and gets
back a per-word similarity score computed by comparing an automatic
transcription of their speech against the expected phrase.

Speech recognition runs on Meta's **Wav2Vec 2.0** model (via `torchaudio`),
decoded with a greedy CTC decoder. The resulting transcript is aligned to the
target phrase word-by-word to produce a pronunciation score and highlight the
words that need work.


---

## Features

- **Browser-based audio capture** — records speech with the MediaStream
  Recording API and sends it to the backend as base64-encoded WAV.
- **Speech-to-text** — Wav2Vec 2.0 (`WAV2VEC2_ASR_BASE_960H`) + greedy CTC
  decoding, with automatic resampling to the model's sample rate.
- **Pronunciation scoring** — word-level alignment of the learner transcript
  against the target phrase using `difflib.SequenceMatcher`, returning a
  similarity percentage per word.
- **Difficulty modules** — Easy / Medium / Hard phrase sets.
- **Progress tracking** — completed phrases and per-difficulty scores persisted
  per user, shown on a dashboard with charts and sortable tables.
- **Authentication** — email + password accounts, JWT issued in an `httpOnly`
  cookie, with route protection enforced in Next.js middleware.

## Tech stack

| Layer      | Technology |
|------------|------------|
| Frontend   | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, TanStack Table, Recharts |
| Backend    | Django 5, Django REST Framework, PyJWT |
| ML / audio | PyTorch, torchaudio (Wav2Vec 2.0), pydub, FFmpeg |
| Database   | SQLite (development) |
| Testing    | Jest + React Testing Library (frontend) |

## Architecture

```
Browser (Next.js)                     Django REST API
─────────────────                     ───────────────
record audio ──► base64 WAV ─────────► POST /api/answers/post/
                                          └─ decode & store as .wav
request score ───────────────────────► GET  /api/answers/{id}/
                                          ├─ torchaudio.load + resample
                                          ├─ Wav2Vec 2.0 ► logits
                                          ├─ greedy CTC decode ► transcript
                                          └─ word-level compare vs phrase
       ◄───────────────────────────────  { learner_transcript, per-word similarity }
```

### Key API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/register/` | Create an account |
| `POST` | `/api/login/` | Authenticate, set JWT cookie |
| `POST` | `/api/logout/` | Clear JWT cookie |
| `GET`  | `/api/user/` | Current user details |
| `GET`  | `/api/phrases/`, `/api/phrases/{id}/` | Practice phrases |
| `POST` | `/api/answers/post/` | Submit a recorded answer |
| `GET`  | `/api/answers/{id}/` | Transcribe answer and score pronunciation |
| `POST` | `/api/update_progress/` | Mark a phrase complete |
| `GET`  | `/api/get_progress/` | Phrases with completion status and scores |

## Repository layout

```
backend/
  server/
    server/                  Django project (settings, urls, wsgi/asgi)
    atypical_pronunciation/   app: models, DRF views, serializers, ML pipeline
    manage.py
    requirements.txt
frontend/
  apd/                       Next.js app (App Router)
    app/                     routes: /, /login, /register, /home, /practice
    components/              shadcn/ui primitives and blocks
    __tests__/               Jest tests
```

## Running locally

### Prerequisites

- Python 3.10+
- Node.js 18+
- FFmpeg on your system (or set explicit binary paths — see below)

### Backend

```bash
cd backend/server
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Optional: provide a real secret key (a dev fallback is used otherwise)
export DJANGO_SECRET_KEY="your-random-secret"

python manage.py migrate
python manage.py runserver          # http://localhost:8000
```

`backend/server/server/settings.py` currently sets `FFMPEG_PATH` /
`FFPROBE_PATH` to hard-coded Windows paths for pydub. Update these to point at
your own FFmpeg/FFprobe binaries (or the platform's `ffmpeg` on `PATH`) before
submitting recordings.

The database ships empty. Create an admin user with
`python manage.py createsuperuser` and add `Module` / `Phrase` rows via
`/admin/` to populate practice content.

### Frontend

```bash
cd frontend/apd
npm install
npm run dev                         # http://localhost:3000
```

The frontend expects the API at `http://localhost:8000`.

### Tests

```bash
cd frontend/apd
npm test
```

## Notes and limitations

This is an academic proof of concept, not a production system:

- Auth uses a static string to sign JWTs and `CORS_ORIGIN_ALLOW_ALL`; `DEBUG`
  is on. These need hardening before any real deployment.
- The API URL is hard-coded in the frontend rather than configured via
  environment variables.
- SQLite and local filesystem media storage are used throughout.
- Scoring is a lightweight string-similarity heuristic over the ASR transcript,
  not a phoneme-level pronunciation assessment.

## References

- [Wav2Vec 2.0 (Baevski et al., 2020)](https://arxiv.org/abs/2006.11477)
- [torchaudio Wav2Vec 2.0 pipelines](https://pytorch.org/audio/stable/pipelines.html)
- [MediaStream Recording API](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API)
- [How to Write a WAV File in JavaScript](https://devtails.xyz/@adam/how-to-write-a-wav-file-in-javascript)
- [Next.js Documentation](https://nextjs.org/docs)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/latest) · [TanStack Table](https://tanstack.com/table/latest)

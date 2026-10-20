# 108 Wren Street

A Flask/Jinja2 single-page film experience with SQLite-backed memory, RSVP, and collaborator forms.

## Run locally

Requires Python 3.11 or newer.

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Open <http://127.0.0.1:5000>. The SQLite database is initialized from `schema.sql` when the Flask app starts. Set `DATABASE_PATH` to use a different database file.

## Routes

- `/`, `/oak-tree`, `/epk`, `/collaborate` — the five-screen experience and deep links.
- `GET /api/memories?category=ALL|LOVE|LOSS|MEMORY|PEOPLE` and `POST /api/memories`
- `POST /api/rsvp`
- `POST /api/collaborate`

Screening RSVPs download an `.ics` calendar event after the RSVP succeeds. Press-kit files are intentionally shown as unavailable until approved assets are added under `static/downloads/`.

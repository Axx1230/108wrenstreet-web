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

Open <http://127.0.0.1:5000>. The SQLite database is initialized from `schema.sql` when the Flask app starts. Existing databases are migrated to allow the `FAMILY` memory category without removing saved memories. Set `DATABASE_PATH` to use a different database file.

The opening appointment scene pushes in as you scroll, and section content reveals from the direction of travel, then recedes when you scroll back. On desktop, the memory-vault artifacts use Lenis and GSAP ScrollTrigger for a pinned 3D depth sequence. If Lenis is unavailable, the vault uses native scrolling; mobile, reduced-motion, and no-GSAP environments keep all artifact cards in a readable vertical layout.

## Routes

- `/`, `/oak-tree`, `/collaborate` — the narrative experience and deep links.
- `/press` and `/press-kit` — standalone press kit, production stills gallery, and screening details. `/epk` redirects to the screening section.
- `GET /api/memories?category=ALL|LOVE|LOSS|MEMORY|PEOPLE|FAMILY` and `POST /api/memories`
- `POST /api/rsvp`
- `POST /api/collaborate`

Screening and still metadata are stored in SQLite. Add approved still records to `gallery_assets` and place their image and high-resolution files under `static/`; only published records are shown. The still category must be `clinic`, `memories`, or `behind-the-scenes`, and asset paths are relative to `static/`. Screening records are seeded from `schema.sql` and can be maintained in the `screenings` table. Add trailer chapter names and times to `trailer_chapters` to show seekable markers when the trailer is available.

The press page enables downloads when `static/downloads/press-kit.zip` and `static/downloads/one-sheet.pdf` are present. Add the approved trailer at `static/videos/official-trailer.mp4` to enable its player. These controls remain unavailable until the approved files are added. Screening RSVPs download an `.ics` calendar event after the RSVP succeeds.

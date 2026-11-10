CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 280),
    author TEXT NOT NULL DEFAULT 'Anonymous',
    category TEXT NOT NULL DEFAULT 'MEMORY'
       CHECK (category IN ('LOVE', 'LOSS', 'MEMORY', 'PEOPLE', 'FAMILY')),   -- CHANGED
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS memories_category_created_at
    ON memories (category, created_at DESC);

CREATE TABLE IF NOT EXISTS rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    seats INTEGER NOT NULL DEFAULT 1 CHECK (seats BETWEEN 1 AND 6),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS collaborators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    specialism TEXT NOT NULL,
    portfolio_url TEXT NOT NULL DEFAULT '',
    showreel_url TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS gallery_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    scene_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('clinic', 'memories', 'behind-the-scenes')),
    image_path TEXT NOT NULL,
    download_path TEXT NOT NULL,
    aspect_ratio TEXT NOT NULL DEFAULT '2.39:1',
    camera TEXT NOT NULL DEFAULT '',
    lens TEXT NOT NULL DEFAULT '',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published INTEGER NOT NULL DEFAULT 0 CHECK (is_published IN (0, 1))
);

CREATE TABLE IF NOT EXISTS screenings (
    event_id TEXT PRIMARY KEY,
    city TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'UK',
    name TEXT NOT NULL,
    venue TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    display_time TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trailer_chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    time_seconds INTEGER NOT NULL CHECK (time_seconds >= 0),
    display_order INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO screenings
    (event_id, city, country, name, venue, starts_at, display_time)
VALUES
    ('manchester-new-voices', 'Manchester', 'UK', 'Manchester New Voices',
     'HOME, Manchester', '2026-11-14T18:30:00', '18:30'),
    ('sci-fi-london', 'London', 'UK', 'Sci-Fi London',
     'Bethnal Green, London', '2026-12-02T20:00:00', '20:00'),
    ('edinburgh-short-film-night', 'Edinburgh', 'UK', 'Edinburgh Short Film Night',
     'The Cameo, Edinburgh', '2027-01-20T19:00:00', '19:00');

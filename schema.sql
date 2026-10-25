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

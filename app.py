import os
import re
import sqlite3
from pathlib import Path

from flask import Flask, g, jsonify, render_template, request


BASE_DIR = Path(__file__).resolve().parent
DATABASE = Path(os.environ.get("DATABASE_PATH", BASE_DIR / "database.db"))
SCHEMA = BASE_DIR / "schema.sql"

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_error):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def initialize_database():
    DATABASE.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DATABASE) as db:
        db.executescript(SCHEMA.read_text(encoding="utf-8"))


def json_payload(required_fields):
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return None, (jsonify(error="A JSON object is required."), 400)
    for field in required_fields:
        if not isinstance(payload.get(field), str) or not payload[field].strip():
            return None, (jsonify(error=f"{field.replace('_', ' ').capitalize()} is required."), 400)
    return payload, None


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/oak-tree")
def oak_tree():
    return render_template("index.html", page_section="oak-tree")


@app.get("/epk")
def epk():
    return render_template("index.html", page_section="epk")


@app.get("/collaborate")
def collaborate():
    return render_template("index.html", page_section="collaborate")


@app.get("/api/memories")
def get_memories():
    category = request.args.get("category", "ALL").strip().upper()
    allowed_categories = {"ALL", "LOVE", "LOSS", "MEMORY", "PEOPLE", "FAMILY"}
    if category not in allowed_categories:
        return jsonify(error="Choose a valid memory category."), 400

@app.get("/press-kit")
def press_kit():
    return render_template("press-kit.html")



    db = get_db()
    if category == "ALL":
        rows = db.execute(
            "SELECT id, body, author, category, created_at FROM memories "
            "ORDER BY created_at DESC, id DESC LIMIT 100"
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT id, body, author, category, created_at FROM memories "
            "WHERE category = ? ORDER BY created_at DESC, id DESC LIMIT 100",
            (category,),
        ).fetchall()
    return jsonify(memories=[dict(row) for row in rows])


@app.get("/api/memories/count")
def memories_count():
    total = get_db().execute("SELECT COUNT(*) FROM memories").fetchone()[0]
    return jsonify(total=total)

@app.post("/api/memories")
def create_memory():
    payload, error = json_payload(("body",))
    if error:
        return error

    body = payload["body"].strip()
    author = payload.get("author", "Anonymous")
    category = payload.get("category", "MEMORY")
    if not isinstance(author, str) or not isinstance(category, str):
        return jsonify(error="Author and category must be text values."), 400
    author = author.strip() or "Anonymous"
    category = category.strip().upper()
    if len(body) > 280:
        return jsonify(error="Memory text must be 280 characters or fewer."), 400
    if len(author) > 80:
        return jsonify(error="Author attribution must be 80 characters or fewer."), 400
    if category not in {"LOVE", "LOSS", "MEMORY", "PEOPLE", "FAMILY"}:
        return jsonify(error="Choose a valid memory category."), 400

    cursor = get_db().execute(
        "INSERT INTO memories (body, author, category) VALUES (?, ?, ?)",
        (body, author, category),
    )
    get_db().commit()
    memory = get_db().execute(
        "SELECT id, body, author, category, created_at FROM memories WHERE id = ?",
        (cursor.lastrowid,),
    ).fetchone()
    return jsonify(memory=dict(memory)), 201


@app.post("/api/rsvp")
def create_rsvp():
    payload, error = json_payload(("event_id", "name", "email"))
    if error:
        return error

    event_id = payload["event_id"].strip()
    name = payload["name"].strip()
    email = payload["email"].strip()
    seats = payload.get("seats", 1)
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify(error="Enter a valid email address."), 400
    if len(event_id) > 100 or len(name) > 100 or len(email) > 254:
        return jsonify(error="Name or email is too long."), 400
    if type(seats) is not int or not 1 <= seats <= 6:
        return jsonify(error="Choose between 1 and 6 seats."), 400

    cursor = get_db().execute(
        "INSERT INTO rsvps (event_id, name, email, seats) VALUES (?, ?, ?, ?)",
        (event_id, name, email, seats),
    )
    get_db().commit()
    return jsonify(rsvp_id=cursor.lastrowid, event_id=event_id, seats=seats), 201


@app.post("/api/collaborate")
def create_collaborator():
    payload, error = json_payload(("name", "email", "specialism"))
    if error:
        return error

    name = payload["name"].strip()
    email = payload["email"].strip()
    specialism = payload["specialism"].strip()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify(error="Enter a valid email address."), 400
    if len(name) > 100 or len(email) > 254 or len(specialism) > 80:
        return jsonify(error="One or more fields are too long."), 400
    optional_fields = ("portfolio_url", "showreel_url", "message")
    if any(not isinstance(payload.get(field, ""), str) for field in optional_fields):
        return jsonify(error="Optional form fields must be text values."), 400
    portfolio_url = payload.get("portfolio_url", "").strip()
    showreel_url = payload.get("showreel_url", "").strip()
    message = payload.get("message", "").strip()
    if len(portfolio_url) > 500 or len(showreel_url) > 500 or len(message) > 2000:
        return jsonify(error="One or more optional fields are too long."), 400

    cursor = get_db().execute(
        "INSERT INTO collaborators "
        "(name, email, specialism, portfolio_url, showreel_url, message) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (
            name,
            email,
            specialism,
            portfolio_url,
            showreel_url,
            message,
        ),
    )
    get_db().commit()
    return jsonify(submission_id=cursor.lastrowid), 201


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify(error="The submitted form is too large."), 413


with app.app_context():
    initialize_database()


if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1")

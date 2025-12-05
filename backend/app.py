from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

DB = "users.db"

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])  # Allow frontend requests

def init_db():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    );
    """)
    conn.commit()
    conn.close()

init_db()

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    password_confirm = data.get("password_confirm", "")

    if not username or not email or not password or not password_confirm:
        return jsonify({"message": "All fields are required"}), 400
    if password != password_confirm:
        return jsonify({"message": "Passwords do not match"}), 400

    password_hash = generate_password_hash(password)

    try:
        conn = sqlite3.connect(DB, check_same_thread=False)
        c = conn.cursor()
        c.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (username, email, password_hash)
        )
        conn.commit()
        user_id = c.lastrowid
    except sqlite3.IntegrityError as e:
        if "username" in str(e).lower():
            return jsonify({"message": "Username already taken"}), 400
        elif "email" in str(e).lower():
            return jsonify({"message": "Email already registered"}), 400
        else:
            return jsonify({"message": "Registration failed"}), 400
    finally:
        conn.close()

    return jsonify({
        "message": "Registered successfully",
        "user": {"id": user_id, "username": username, "email": email}
    }), 201


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    identifier = data.get("identifier", "").strip()  # username or email
    password = data.get("password", "")

    if not identifier or not password:
        return jsonify({"message": "Username/email and password required"}), 400

    try:
        conn = sqlite3.connect(DB, check_same_thread=False)
        c = conn.cursor()
        c.execute(
            "SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ?",
            (identifier, identifier)
        )
        row = c.fetchone()
    finally:
        conn.close()

    if not row:
        return jsonify({"message": "Invalid credentials"}), 401

    user_id, username, email, password_hash = row

    if check_password_hash(password_hash, password):
        return jsonify({
            "message": "Login successful",
            "user": {"id": user_id, "username": username, "email": email}
        }), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401


if __name__ == "__main__":
    app.run(debug=True)

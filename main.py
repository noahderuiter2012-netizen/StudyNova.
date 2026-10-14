import os
import sqlite3
import hashlib
import hmac
import secrets
import time
from pathlib import Path
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException, Request, Response, Depends
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).parent
DB_PATH = os.getenv("DATABASE_PATH", str(BASE_DIR / "studynova.db"))
SESSION_SECRET = os.getenv("SESSION_SECRET", "")
AI_API_KEY = os.getenv("AI_API_KEY", "")
AI_BASE_URL = os.getenv("AI_BASE_URL", "https://api.openai.com/v1")
AI_MODEL = os.getenv("AI_MODEL", "gpt-4o-mini")
COOKIE_NAME = "studynova_session"
SESSION_TTL = 60 * 60 * 24 * 7

app = FastAPI(title="StudyNova", version="0.1.0")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

def db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con

def init_db():
    with db() as con:
        con.execute("""CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at INTEGER NOT NULL
        )""")
        con.execute("""CREATE TABLE IF NOT EXISTS progress (
            user_id INTEGER PRIMARY KEY,
            xp INTEGER NOT NULL DEFAULT 0,
            streak INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )""")

init_db()

def password_hash(password: str, salt: Optional[bytes] = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 260_000)
    return salt.hex() + ":" + digest.hex()

def password_matches(password: str, stored: str) -> bool:
    try:
        salt_hex, digest_hex = stored.split(":", 1)
        candidate = password_hash(password, bytes.fromhex(salt_hex)).split(":", 1)[1]
        return hmac.compare_digest(candidate, digest_hex)
    except (ValueError, TypeError):
        return False

def sign_session(user_id: int) -> str:
    if not SESSION_SECRET:
        raise HTTPException(503, "De website is nog niet geconfigureerd: stel SESSION_SECRET in.")
    expires = int(time.time()) + SESSION_TTL
    payload = f"{user_id}.{expires}"
    signature = hmac.new(SESSION_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{signature}"

def current_user(request: Request):
    token = request.cookies.get(COOKIE_NAME)
    if not token or not SESSION_SECRET:
        raise HTTPException(401, "Log eerst in om verder te gaan.")
    try:
        user_id_s, expires_s, signature = token.split(".", 2)
        payload = f"{user_id_s}.{expires_s}"
        expected = hmac.new(SESSION_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected) or int(expires_s) < int(time.time()):
            raise ValueError()
        with db() as con:
            user = con.execute("SELECT id,email,display_name FROM users WHERE id=?", (int(user_id_s),)).fetchone()
        if not user:
            raise ValueError()
        return dict(user)
    except (ValueError, TypeError):
        raise HTTPException(401, "Je sessie is verlopen. Log opnieuw in.")

class AuthInput(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)
    display_name: Optional[str] = Field(default="Leerling", min_length=1, max_length=50)

class ChatInput(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    school_level: str = Field(default="middelbare school", max_length=60)
    subject: str = Field(default="algemeen", max_length=80)
    mode: str = Field(default="uitleg", max_length=30)

@app.get("/", response_class=HTMLResponse)
def home():
    return FileResponse(BASE_DIR / "static" / "index.html")

@app.get("/api/health")
def health():
    return {"ok": True, "app": "StudyNova", "ai_configured": bool(AI_API_KEY), "database": "sqlite"}

@app.post("/api/register")
def register(data: AuthInput, response: Response):
    email = data.email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(400, "Vul een geldig e-mailadres in.")
    if not SESSION_SECRET:
        raise HTTPException(503, "De website is nog niet geconfigureerd. Stel SESSION_SECRET in.")
    try:
        with db() as con:
            cur = con.execute(
                "INSERT INTO users(email,display_name,password_hash,created_at) VALUES(?,?,?,?)",
                (email, data.display_name.strip() or "Leerling", password_hash(data.password), int(time.time()))
            )
            user_id = cur.lastrowid
            con.execute("INSERT INTO progress(user_id,xp,streak) VALUES(?,0,0)", (user_id,))
    except sqlite3.IntegrityError:
        raise HTTPException(409, "Voor dit e-mailadres bestaat al een account.")
    response.set_cookie(COOKIE_NAME, sign_session(user_id), httponly=True, secure=os.getenv("COOKIE_SECURE", "false").lower() == "true", samesite="lax", max_age=SESSION_TTL, path="/")
    return {"ok": True, "user": {"id": user_id, "email": email, "display_name": data.display_name}}

@app.post("/api/login")
def login(data: AuthInput, response: Response):
    email = data.email.strip().lower()
    with db() as con:
        user = con.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    if not user or not password_matches(data.password, user["password_hash"]):
        raise HTTPException(401, "E-mailadres of wachtwoord klopt niet.")
    response.set_cookie(COOKIE_NAME, sign_session(user["id"]), httponly=True, secure=os.getenv("COOKIE_SECURE", "false").lower() == "true", samesite="lax", max_age=SESSION_TTL, path="/")
    return {"ok": True, "user": {"id": user["id"], "email": user["email"], "display_name": user["display_name"]}}

@app.post("/api/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"ok": True}

@app.get("/api/me")
def me(user=Depends(current_user)):
    with db() as con:
        progress = con.execute("SELECT xp,streak FROM progress WHERE user_id=?", (user["id"],)).fetchone()
    return {"user": user, "progress": dict(progress) if progress else {"xp": 0, "streak": 0}}

@app.post("/api/xp")
def add_xp(request: Request, user=Depends(current_user)):
    amount = min(max(int(request.query_params.get("amount", "10")), 1), 50)
    with db() as con:
        con.execute("UPDATE progress SET xp=xp+? WHERE user_id=?", (amount, user["id"]))
        row = con.execute("SELECT xp,streak FROM progress WHERE user_id=?", (user["id"],)).fetchone()
    return dict(row)

@app.get("/api/books")
async def search_books(q: str, user=Depends(current_user)):
    q = q.strip()[:160]
    if len(q) < 2:
        return {"results": [], "message": "Typ minstens twee tekens."}
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            r = await client.get("https://openlibrary.org/search.json", params={"q": q, "limit": 8, "fields": "key,title,author_name,first_publish_year,isbn,cover_i,subject"})
            r.raise_for_status()
            docs = r.json().get("docs", [])
        results = []
        for item in docs:
            results.append({
                "id": item.get("key", ""),
                "title": item.get("title", "Onbekende titel"),
                "authors": item.get("author_name", [])[:3],
                "year": item.get("first_publish_year"),
                "isbn": (item.get("isbn") or [None])[0],
                "cover": f"https://covers.openlibrary.org/b/id/{item['cover_i']}-M.jpg" if item.get("cover_i") else None,
                "subjects": (item.get("subject") or [])[:3],
                "source": "Open Library"
            })
        return {"results": results, "message": "Boekgegevens komen van Open Library. Niet ieder Nederlands schoolboek staat erin."}
    except (httpx.HTTPError, ValueError):
        raise HTTPException(502, "Boeken zoeken lukt nu niet. Probeer het straks opnieuw.")

@app.post("/api/chat")
async def chat(data: ChatInput, user=Depends(current_user)):
    if not AI_API_KEY:
        raise HTTPException(503, "De AI is nog niet gekoppeld. Stel AI_API_KEY, AI_BASE_URL en AI_MODEL in op de hostingomgeving.")
    system_prompt = (
        "Je bent StudyNova, een vriendelijke, enthousiaste Nederlandstalige huiswerkcoach voor leerlingen van basisschool en middelbare school. "
        "Leg dingen duidelijk uit op het opgegeven niveau. Help de leerling leren in plaats van alleen antwoorden over te nemen. "
        "Bij uitleg: begin simpel, werk stap voor stap, geef een kort voorbeeld en eindig met een controlevraag. "
        "Bij hint: geef eerst alleen een bruikbare hint, niet meteen de volledige oplossing. "
        "Bij oefenen: maak één passende oefenvraag en wacht op het antwoord. "
        "Wees eerlijk als je iets niet zeker weet. Verzin geen inhoud uit schoolboeken. "
        "Gebruik geen lange letterlijke passages uit auteursrechtelijk beschermde boeken. "
        "Schoolniveau: " + data.school_level + ". Vak: " + data.subject + ". Modus: " + data.mode + "."
    )
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            r = await client.post(
                AI_BASE_URL.rstrip("/") + "/chat/completions",
                headers={"Authorization": f"Bearer {AI_API_KEY}", "Content-Type": "application/json"},
                json={"model": AI_MODEL, "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": data.message}], "temperature": 0.6}
            )
            r.raise_for_status()
            payload = r.json()
        answer = payload["choices"][0]["message"]["content"]
        return {"answer": answer, "mode": data.mode, "model": AI_MODEL}
    except httpx.HTTPStatusError as e:
        raise HTTPException(502, f"De AI-provider gaf een foutmelding (HTTP {e.response.status_code}). Controleer model en API-instellingen.")
    except (httpx.HTTPError, KeyError, IndexError, ValueError):
        raise HTTPException(502, "De AI kon nu geen antwoord geven. Probeer het opnieuw.")

@app.get("/api/progress")
def progress(user=Depends(current_user)):
    with db() as con:
        row = con.execute("SELECT xp,streak FROM progress WHERE user_id=?", (user["id"],)).fetchone()
    return dict(row) if row else {"xp": 0, "streak": 0}

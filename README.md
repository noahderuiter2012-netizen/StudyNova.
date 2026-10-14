# StudyNova — MVP

Een speels AI-huiswerkplatform voor basisschool en middelbare school.

## In deze eerste versie
- Account aanmaken, inloggen en uitloggen (accounts zijn verplicht voor de app-functies).
- Wachtwoorden worden gehasht met PBKDF2; sessiecookie is HttpOnly.
- Boeken zoeken via de Open Library Search API.
- AI-huiswerkcoach met modi **Uitleg**, **Hint** en **Oefenen** via een OpenAI-compatible chat-completions API.
- XP bij quiz-/leeracties en een basis dashboard.
- FastAPI backend en SQLite voor lokale ontwikkeling.

## Lokaal starten
1. Python 3.11+ installeren.
2. `python -m venv .venv` en de omgeving activeren.
3. `pip install -r requirements.txt`
4. Kopieer `.env.example` naar `.env` en zet minstens `SESSION_SECRET` als omgevingsvariabele.
5. Stel AI-providerinstellingen in als je de echte AI-chat wilt gebruiken.
6. `uvicorn main:app --reload`

Voorbeeld om een secret te genereren:
`python -c "import secrets; print(secrets.token_urlsafe(48))"`

De app start op `http://127.0.0.1:8000`.

## Deployen
- Push de bestanden naar een GitHub-repository.
- Maak een Web Service aan op Render, of gebruik `render.yaml`.
- Stel `SESSION_SECRET` in als geheime environment variable. Gebruik HTTPS en `COOKIE_SECURE=true`.
- Stel `AI_API_KEY`, `AI_BASE_URL` en `AI_MODEL` in voor een echte AI-provider.
- Gebruik een persistente disk voor SQLite, of migreer naar PostgreSQL voordat je de site publiek gaat gebruiken.

## Belangrijke MVP-beperkingen
- Open Library is een catalogus, geen complete database van Nederlandse schoolboeken. Zoeken kan dus resultaten missen.
- Dit prototype heeft nog geen e-mailverificatie, wachtwoord reset, rate limiting, ouder-/schoolbeheer, moderatie, upload van foto's, of volledige AVG/privacy-review. Zet het niet open voor een brede groep kinderen voordat die onderdelen zijn beoordeeld.
- AI is niet actief totdat je zelf een geldige API-sleutel configureert. Zonder sleutel geeft de interface een duidelijke foutmelding; er zijn geen nep-antwoorden.
- XP is alleen een eenvoudige voortgangsdemonstratie, nog geen anti-cheat of compleet gamificatiesysteem.

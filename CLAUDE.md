# CLAUDE.md

Leitfaden für KI-Agenten (Claude, Cursor etc.), die in diesem Repository arbeiten.

## Projektüberblick

Backend-Service für die K&S-App. Ein minimaler Express-Server, der einen
HTTP-Endpunkt bereitstellt, um Texte mit OpenAI (`gpt-4o`) grammatikalisch zu
korrigieren und sachlich-technisch umzuformulieren.

**Wichtige Regel:** Die Sprache des Eingabetextes wird immer beibehalten
(Deutsch → Deutsch, Englisch → Englisch). Es wird nie übersetzt. Diese Regel ist
im System-Prompt in `backend/index.js` verankert und darf nicht aufgeweicht
werden.

## Struktur

```
.
├── README.md
├── CLAUDE.md
└── backend/
    ├── index.js         # Express-Server + OpenAI-Integration (gesamte Logik)
    ├── package.json
    ├── package-lock.json
    └── test.py          # manueller HTTP-Test-Client
```

Die komplette Anwendungslogik liegt in `backend/index.js`. Es gibt (bewusst)
keine weitere Struktur, kein Framework darüber und keine Datenbank.

## Befehle

```bash
cd backend
npm install     # Abhängigkeiten installieren
npm start       # Server auf http://localhost:3000 starten
python test.py  # Test-Request senden
```

## Umgebungsvariablen

- `OPENAI_API_KEY` – erforderlich, in `backend/.env` bzw. in der
  Render-Umgebung hinterlegt. Niemals committen.

## API

- `POST /korrigiere` – Body `{ "text": string }`, Antwort
  `{ "original": string, "technisch": string }`.
- Fehler: `400` bei ungültigem/fehlendem Text, `500` bei OpenAI-Fehlern.

## Konventionen & Arbeitsweise

- **Sprache:** Code-Kommentare und benutzerseitige Strings (Fehlermeldungen,
  Logs) sind auf Deutsch – bei Änderungen beibehalten.
- **Einfachheit:** Das Projekt ist bewusst minimal. Keine spekulativen
  Abstraktionen, Frameworks oder Features hinzufügen, die nicht angefragt wurden.
- **Chirurgische Änderungen:** Nur anfassen, was für die Aufgabe nötig ist.
  Bestehenden Stil übernehmen.
- **Deployment:** Läuft auf Render (`https://k-s-app-backend.onrender.com`).
  Änderungen an `index.js` wirken erst nach einem Deploy.

## Was hier NICHT liegt

Die LOP-/Report-Generierung, PDF-/DOCX-Export und die App-UI sind **nicht** in
diesem Repo. Hier existiert ausschließlich der `/korrigiere`-Endpunkt.

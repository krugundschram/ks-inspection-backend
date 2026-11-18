# K-S-App-Backend

Backend-Service für das K&S-Dashboard (LOP Tracking). Stellt einen
HTTP-Endpunkt bereit, der Kommentare mithilfe von Claude Opus 5.5
(`claude-opus-5-5`) grammatikalisch korrigiert und in eine sachlich-technische
Sprache umformuliert. Die Ausgabe erfolgt immer in der Projektsprache (Deutsch
oder Englisch); Texte in einer anderen Sprache werden dabei übersetzt.

## Tech-Stack

- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) `^5.1.0`
- [Anthropic TypeScript/JavaScript SDK](https://www.npmjs.com/package/@anthropic-ai/sdk) `^1.10.0`
- [dotenv](https://www.npmjs.com/package/dotenv) `^16.4.7`

## Voraussetzungen

- Node.js (empfohlen: LTS)
- Ein Anthropic-API-Schlüssel

## Setup

```bash
cd backend
npm install
```

Lege im Ordner `backend/` eine `.env`-Datei an:

```env
ANTHROPIC_API_KEY=dein_anthropic_api_key
```

## Starten

```bash
cd backend
npm start
```

Der Server läuft anschließend auf `http://localhost:3000`.

## API

### `POST /correct`

Korrigiert und formuliert einen Text um. Die Antwort ist immer in der
übergebenen Projektsprache.

Erfordert ein gültiges Supabase-Access-Token des Dashboards im Header
`Authorization: Bearer <token>`; das Backend prüft es bei Supabase
(`GET /auth/v1/user`). Browser-Aufrufe sind per CORS nur von
`https://krugundschram.org`, `https://www.krugundschram.org` und
`http://localhost:5173` erlaubt.

**Request-Body (JSON):**

| Feld       | Typ              | Beschreibung                                  |
| ---------- | ---------------- | --------------------------------------------- |
| `text`     | `string`         | Der zu korrigierende Text (max. 5000 Zeichen) |
| `language` | `"de"` \| `"en"` | Projektsprache, in der die Ausgabe erfolgt    |

**Beispiel-Request:**

```bash
curl -X POST http://localhost:3000/correct \
  -H "Authorization: Bearer <supabase-access-token>" \
  -H "Content-Type: application/json" \
  -d '{"text": "wechselrichter 3 geht nicht, display schwarz", "language": "de"}'
```

**Beispiel-Antwort (200):**

```json
{
  "corrected": "..."
}
```

**Fehlerantworten** (Body jeweils `{ "error": "<Meldung>" }`):

| Status | Bedingung                                                          |
| ------ | ------------------------------------------------------------------ |
| `400`  | `text` leer, kein String oder zu lang; `language` nicht `de`/`en`  |
| `401`  | Token fehlt oder ist ungültig                                      |
| `422`  | Das Modell hat die Anfrage abgelehnt                               |
| `429`  | Rate-Limit bei Anthropic                                           |
| `502`  | Antwort abgeschnitten oder leer, Anthropic nicht erreichbar oder 5xx |
| `500`  | Sonstiger Fehler beim Verarbeiten                                  |

## Test

```bash
cd backend
npm test
```

Die Tests (`backend/index.test.js`, `node:test`) ersetzen das Anthropic-SDK und
die Token-Prüfung durch Stubs und machen keine echten API-Aufrufe.

## Deployment

Der Service ist auf [Vercel](https://vercel.com/) deployt (`backend/vercel.json`).
Der `ANTHROPIC_API_KEY` muss dort als Environment-Variable hinterlegt sein.
Im Vercel-Projekt Fluid Compute aktivieren bzw. die Function-Dauer auf mindestens 30 s setzen (Supabase-Prüfung bis 5 s + Claude-Aufruf bis 25 s, ohne Retry).

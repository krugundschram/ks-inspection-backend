# K-S-App-Backend

Backend-Service für die K&S-App. Stellt einen HTTP-Endpunkt bereit, der Texte
mithilfe von OpenAI (`gpt-4o`) grammatikalisch korrigiert und in eine
sachlich-technische Sprache umformuliert. Die Sprache des Eingabetextes wird
dabei beibehalten (Deutsch bleibt Deutsch, Englisch bleibt Englisch).

## Tech-Stack

- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) `^5.1.0`
- [OpenAI Node SDK](https://www.npmjs.com/package/openai) `^4.92.0`
- [dotenv](https://www.npmjs.com/package/dotenv) `^16.4.7`

## Voraussetzungen

- Node.js (empfohlen: LTS)
- Ein OpenAI-API-Schlüssel

## Setup

```bash
cd backend
npm install
```

Lege im Ordner `backend/` eine `.env`-Datei an:

```env
OPENAI_API_KEY=dein_openai_api_key
```

## Starten

```bash
cd backend
npm start
```

Der Server läuft anschließend auf `http://localhost:3000`.

## API

### `POST /korrigiere`

Korrigiert und formuliert einen Text um. Die Antwortsprache entspricht immer der
Sprache des Eingabetextes.

**Request-Body (JSON):**

| Feld   | Typ      | Beschreibung              |
| ------ | -------- | ------------------------- |
| `text` | `string` | Der zu korrigierende Text |

**Beispiel-Request:**

```bash
curl -X POST http://localhost:3000/korrigiere \
  -H "Content-Type: application/json" \
  -d '{"text": "Das ist so ein Ding, das man einfach so machen kann."}'
```

**Beispiel-Antwort (200):**

```json
{
  "original": "Das ist so ein Ding, das man einfach so machen kann.",
  "technisch": "..."
}
```

**Fehlerantworten:**

| Status | Bedingung                          | Body                                            |
| ------ | ---------------------------------- | ----------------------------------------------- |
| `400`  | `text` fehlt oder ist kein String  | `{ "error": "Kein gültiger Text übergeben." }`  |
| `500`  | Fehler bei der Anfrage an OpenAI   | `{ "error": "Fehler beim Verarbeiten des Textes." }` |

## Test

Ein einfacher Test-Client liegt unter `backend/test.py` und richtet sich
standardmäßig gegen das Deployment auf Render:

```bash
python backend/test.py
```

## Deployment

Der Service ist auf [Render](https://render.com/) deployt:
`https://k-s-app-backend.onrender.com`

Der `OPENAI_API_KEY` muss dort als Environment-Variable hinterlegt sein.

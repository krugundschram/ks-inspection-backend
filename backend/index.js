require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');

const app = express();
const port = 3000;

app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/korrigiere', async (req, res) => {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Kein gültiger Text übergeben.' });
    }

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'Du bist ein technischer Redakteur. Korrigiere den gegebenen Text grammatikalisch und formuliere ihn in einer sachlich-technischen Sprache um. Behalte dabei zwingend die Sprache des Eingabetextes bei: Antworte auf Deutsch, wenn die Eingabe auf Deutsch ist, und auf Englisch, wenn die Eingabe auf Englisch ist. Übersetze den Text niemals in eine andere Sprache.',
                },
                {
                    role: 'user',
                    content: text,
                }
            ],
            temperature: 0.7,
        });

        const output = completion.choices[0].message.content;

        res.json({
            original: text,
            technisch: output,
        });
    } catch (error) {
        console.error('Fehler bei der Anfrage an OpenAI:', error.message);
        res.status(500).json({ error: 'Fehler beim Verarbeiten des Textes.' });
    }
});

app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const Anthropic = require('@anthropic-ai/sdk').default;
const app = require('./index');

let server;
let baseURL;
let calls;
let nextResult;

before(async () => {
    app.locals.verifyUser = async (token) => token === 'valid';
    app.locals.anthropic = {
        beta: {
            messages: {
                create: async (params) => {
                    calls.push(params);
                    return nextResult();
                },
            },
        },
    };
    await new Promise((resolve) => { server = app.listen(0, resolve); });
    baseURL = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

beforeEach(() => {
    calls = [];
    nextResult = () => ({
        stop_reason: 'end_turn',
        content: [
            { type: 'thinking', thinking: '' },
            { type: 'text', text: 'Der Wechselrichter ist defekt.' },
        ],
    });
});

function correct(body, token = 'valid') {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    return fetch(`${baseURL}/correct`, { method: 'POST', headers, body: JSON.stringify(body) });
}

test('liefert den korrigierten Text mit den erwarteten Request-Parametern', async () => {
    const res = await correct({ text: 'wechselrichter kaputt', language: 'de' });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { corrected: 'Der Wechselrichter ist defekt.' });

    assert.equal(calls.length, 1);
    const params = calls[0];
    assert.equal(params.model, 'claude-opus-5-5');
    assert.equal(params.max_tokens, 4000);
    assert.deepEqual(params.output_config, { effort: 'low' });
    assert.equal(params.fallbacks, 'default');
    assert.deepEqual(params.betas, ['server-side-fallback-2026-07-01']);
    assert.equal('temperature' in params, false);
    assert.equal('thinking' in params, false);
    assert.deepEqual(params.messages, [{ role: 'user', content: 'wechselrichter kaputt' }]);
    assert.match(params.system, /ausschließlich auf Deutsch/);
});

test('verwendet für englische Projekte Englisch als Zielsprache', async () => {
    const res = await correct({ text: 'Wechselrichter kaputt', language: 'en' });
    assert.equal(res.status, 200);
    assert.match(calls[0].system, /ausschließlich auf Englisch/);
});

test('lehnt ungültige Eingaben mit 400 ab', async () => {
    for (const body of [
        {},
        { text: '', language: 'de' },
        { text: '   ', language: 'de' },
        { text: 42, language: 'de' },
        { text: 'a'.repeat(5001), language: 'de' },
        { text: 'Text', language: 'fr' },
        { text: 'Text' },
    ]) {
        const res = await correct(body);
        assert.equal(res.status, 400, JSON.stringify(body).slice(0, 40));
    }
    assert.equal(calls.length, 0);
});

test('lehnt fehlende oder ungültige Tokens mit 401 ab', async () => {
    assert.equal((await correct({ text: 'Text', language: 'de' }, null)).status, 401);
    assert.equal((await correct({ text: 'Text', language: 'de' }, 'invalid')).status, 401);
    assert.equal(calls.length, 0);
});

test('meldet eine Ablehnung des Modells mit 422', async () => {
    nextResult = () => ({ stop_reason: 'refusal', stop_details: { category: 'cyber' }, content: [] });
    const res = await correct({ text: 'Text', language: 'de' });
    assert.equal(res.status, 422);
    assert.ok((await res.json()).error);
});

test('meldet abgeschnittene Antworten mit 502', async () => {
    nextResult = () => ({ stop_reason: 'max_tokens', content: [{ type: 'text', text: 'Der Wech' }] });
    assert.equal((await correct({ text: 'Text', language: 'de' })).status, 502);
});

test('bildet SDK-Fehler auf 429, 502 und 500 ab', async (t) => {
    t.mock.method(console, 'error', () => {});
    const cases = [
        [new Anthropic.RateLimitError(429, undefined, 'rate limited', new Headers()), 429],
        [new Anthropic.APIConnectionError({ message: 'offline' }), 502],
        [new Anthropic.InternalServerError(529, undefined, 'overloaded', new Headers()), 502],
        [new Anthropic.BadRequestError(400, undefined, 'bad', new Headers()), 500],
    ];
    for (const [error, status] of cases) {
        nextResult = () => { throw error; };
        assert.equal((await correct({ text: 'Text', language: 'de' })).status, status, error.constructor.name);
    }
});

test('erlaubt den CORS-Preflight nur für freigegebene Origins', async () => {
    const allowed = await fetch(`${baseURL}/correct`, {
        method: 'OPTIONS',
        headers: { origin: 'https://krugundschram.org', 'access-control-request-method': 'POST' },
    });
    assert.equal(allowed.status, 204);
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://krugundschram.org');
    assert.equal(allowed.headers.get('access-control-allow-headers'), 'authorization, content-type');
    assert.equal(allowed.headers.get('access-control-allow-methods'), 'POST, OPTIONS');
    assert.equal(allowed.headers.get('vary'), 'Origin');

    const foreign = await fetch(`${baseURL}/correct`, {
        method: 'OPTIONS',
        headers: { origin: 'https://evil.example', 'access-control-request-method': 'POST' },
    });
    assert.equal(foreign.headers.get('access-control-allow-origin'), null);
});

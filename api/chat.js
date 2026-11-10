// Vercel serverless function: POST /api/chat  — powered by Google Gemini
// Set GEMINI_API_KEY in Vercel → Project → Settings → Environment Variables.
// Get a key at https://aistudio.google.com/apikey
// Optional: GEMINI_MODEL (defaults to "gemini-flash-latest", Google's alias for its newest Flash model).

const SYSTEM = `You are Atlas AI, the friendly crypto field guide on the Block Atlas website.
Answer simple, educational questions about cryptocurrency and blockchains in plain English.
Rules:
- Keep answers short: 2-5 sentences, or a short numbered list if steps help. No headings, no markdown tables.
- Explain jargon the first time you use it. Assume the reader is a curious beginner.
- Never give personalized financial advice, tell people what to buy or sell, or predict prices. If asked, say so kindly and offer to explain how to research it instead.
- The prices shown on the Block Atlas site are simulated for demonstration, not live data. You do not have live prices.
- Encourage safety: never share a seed phrase, beware of guaranteed returns and urgency.
- If a question is unrelated to crypto, blockchains, or staying safe online, politely steer back to crypto topics.
- If you aren't sure, say so rather than guessing.`;

const MAX_MSGS = 10;
const MAX_CHARS = 1200;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Accept common spellings of the variable name (Vercel env names are case-sensitive).
  const key = (process.env.GEMINI_API_KEY || process.env.Gemini_API_Key || process.env.GEMINI_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!key) return res.status(503).json({ error: 'Chat is not configured' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const raw = Array.isArray(body && body.messages) ? body.messages : [];

  // Sanitize: only user/assistant text, trimmed, capped, alternating, starting with user.
  let messages = raw
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }))
    .slice(-MAX_MSGS);
  while (messages.length && messages[0].role !== 'user') messages.shift();
  messages = messages.filter((m, i) => i === 0 || m.role !== messages[i - 1].role);
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Send a question' });
  }

  // Gemini uses "model" for assistant turns.
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents,
        generationConfig: { maxOutputTokens: 1024 }
      })
    });
    if (!r.ok) {
      console.error('Gemini API error', r.status, await r.text().catch(() => ''));
      return res.status(502).json({ error: 'Upstream error' });
    }
    const data = await r.json();
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const reply = parts.filter(p => typeof p.text === 'string' && !p.thought).map(p => p.text).join('').trim();
    if (!reply) {
      console.error('Gemini empty reply', JSON.stringify(data).slice(0, 500));
      return res.status(502).json({ error: 'Empty reply' });
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ reply });
  } catch (e) {
    console.error('Chat handler failed', e);
    return res.status(500).json({ error: 'Server error' });
  }
};

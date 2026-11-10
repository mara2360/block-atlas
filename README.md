# Block Atlas

A sci-fi crypto field guide: network profiles, an interactive research method, a manifesto quiz, and **Atlas AI**, a chat assistant for simple crypto questions powered by Google Gemini.

Static HTML/CSS/JS with one Vercel serverless function (`api/chat.js`).

## Deploy on Vercel
1. Import this repo in Vercel (Framework preset: **Other**, no build command).
2. Add the environment variable `GEMINI_API_KEY` (Project → Settings → Environment Variables).
3. Optional: `GEMINI_MODEL` to pin a specific model (defaults to `gemini-flash-latest`).

Without a key, the chat falls back to built-in answers.

Prices on the site are simulated. Educational content only, not financial advice.

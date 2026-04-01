# Scholaris — Pre-Submission Paper Review System

An AI-powered academic paper review tool that provides expert peer-review quality feedback before submission. Built with React + Vite, powered by Claude (Anthropic API).

## Features

- **Full Paper Analysis** — paste text or upload `.txt`/`.md` files
- **Dimensional Scoring** — clarity, novelty, methodology, completeness, citations
- **Section-by-Section Feedback** — annotated issues with severity levels and fix suggestions
- **Review Checklist** — 8-point research quality checklist
- **Ask the Reviewer** — conversational follow-up chat with the AI reviewer
- **Venue-aware** — tailored feedback for specific journals/conferences (NeurIPS, Nature, etc.)

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173 — enter your Anthropic API key when prompted.

## Deploy to Vercel

### Option A — Vercel CLI (fastest)
```bash
npm install -g vercel
vercel
```
Follow the prompts. Done — you'll get a live URL.

### Option B — Vercel Dashboard
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Framework: **Vite** (auto-detected)
5. Click **Deploy**

No environment variables needed — users enter their own Anthropic API key in the UI (stored in localStorage).

## Tech Stack

- React 18
- Vite 5
- Anthropic Claude API (`claude-sonnet-4-20250514`)
- No other dependencies

## Notes

- API key is stored only in the user's browser localStorage
- Paper text is sent directly to Anthropic's API — nothing is stored server-side
- First 8,000 characters of the paper are analyzed

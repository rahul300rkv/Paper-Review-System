# Scholaris — Pre-Submission Paper Review System

An AI-powered academic paper review tool that provides expert peer-review quality feedback before submission. Built with React + Vite, powered by Groq AI

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

Open http://localhost:5173 — enter your groq API key when prompted or use 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

## Tech Stack

- React 18
- Vite 5
- Groq API

## Notes

- API key is stored only in the user's browser localStorage
- Paper text is sent directly to Groq's API — nothing is stored server-side
- First 8,000 characters of the paper are analyzed

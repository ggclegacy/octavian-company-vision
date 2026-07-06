# Octavian Company Vision Builder

A Replit-ready Vite, React, TypeScript, and Tailwind CSS app for Neil to use in person with Octavian while building the first real blueprint for Octavian's barbecue company.

The app preserves Octavian's original answers, creates simple organized answer summaries, generates a deterministic company vision draft, supports Neil + Octavian collaborative review, finalizes a Vision Hub, and exports AI-ready prompts for later polishing in ChatGPT or Claude.

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

Production check:

```bash
npm run build
npm run preview
```

## Import Into Replit

1. Create or import a Replit project from this folder/repo.
2. Run `npm install` once in the Replit shell.
3. Use the Replit Run button or run:

```bash
npm run dev -- --host 0.0.0.0
```

This is a frontend-only localStorage app. There is no backend, database, auth, payment system, or AI API yet.

## Session Flow

1. Start at `/` and click **Start Answer Session**.
2. In `/session`, Octavian answers questions in his own words by typing or voice when supported.
3. Original answers are saved separately from organized answers.
4. Use **Organize Answer for Vision** to create a deterministic planning version without replacing the original answer.
5. Use **Skip for Now** or **Needs follow-up** when a question is not ready.
6. Open `/generate` to generate or update the vision draft.
7. Open `/review` to add Neil + Octavian feedback by section.
8. Finalize the Vision Hub at `/vision`.
9. Use `/present` for TV/laptop mirroring.
10. Use `/export` to copy prompts, download text files, and save a full session backup.

The working pages include a compact Session Control Center with status, last saved time, question progress, category progress, and quick links.

## Voice Input

Voice input uses browser `SpeechRecognition` or `webkitSpeechRecognition` when available. Chrome and Safari are the best candidates. If voice is unsupported, blocked, or fails, typing always works and typed text is preserved.

## Backup And Export

Use **Download Full Session Backup (.json)** on `/export` before clearing the session or moving devices. The backup includes session IDs, timestamps, original answers, organized answers, skipped/follow-up flags, generated draft, review feedback, and finalized vision.

Use `/import` to restore a backup JSON. Importing validates the basic session shape and asks for confirmation before replacing the local saved session.

Exports include:

- Original answers
- Organized answers
- Collaborative review feedback
- Final Company Vision
- AI prompt for polished final vision document
- AI prompt for website plan
- AI prompt for brand naming / identity
- AI prompt for future personal BBQ app
- Full session JSON backup

## Future Phases

- Real AI polishing
- Backend session saving
- Phone/laptop live sync
- PDF export
- Full personal BBQ OS

# Oakfire Vision Intake & Planning

A Replit-ready Vite, React, TypeScript, and Tailwind CSS app for Neil to use with Octavian during the Oakfire by Octavian intake and planning session.

This is intake and planning only. It captures Octavian's original answers, preserves his words, organizes the Oakfire business vision, supports Neil + Octavian review, creates an Oakfire Planning Brief, and exports source material/prompts for building a separate future personal OS later.

The future personal OS will be a separate app. Oakfire should be the main business module inside it, but the future app can also include personal planning, content, goals, finance, lifestyle, notes, weekly planning, and optional private reference modules. Names such as Eighth Flame, Aurelius, and Octavian OS remain options to review.

## Two-Part Intake

Part 1: **Oakfire Vision Intake** captures the barbecue company vision: story, food identity, business direction, website needs, catering goals, content strategy, and Oakfire roadmap.

Part 2: **Future Personal OS Intake** captures what Octavian wants from his future personal OS: business tools, lifestyle support, finance tracking, health goals, cannabis strain library, real estate support, AI concierge ideas, and weekly planning.

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

## Replit

The `.replit` file runs the app on port `3000`:

```bash
PORT=3000 npm run dev
```

This is a frontend-only localStorage app. There is no backend, database, auth, payment system, or AI API yet.

## Session Flow

1. Start at `/` and click **Start Answer Session**.
2. In `/session`, Octavian answers questions in his own words by typing or voice when supported.
3. Original answers are saved separately from organized answers.
4. Use **Organize Answer for Planning Brief** to create a deterministic planning version without replacing the original answer.
5. Use **Skip for Now** or **Needs follow-up** when a question is not ready.
6. Open `/generate` to generate or update the combined planning draft.
7. Open `/review` to add Neil + Octavian collaborative feedback by section.
8. Finalize the Oakfire Planning Brief at `/vision`.
9. Use `/present` for TV/laptop mirroring.
10. Use `/export` to copy prompts, download text files, and save a full session backup.

The working pages include a compact Session Control Center with stage, last saved time, question progress, category progress, next recommended action, and quick links.

## Future Personal OS Planning Outputs

Exports include:

- Original Answers
- Organized Answers
- Collaborative Review Feedback
- Oakfire Planning Brief
- Future Personal OS Blueprint
- Future App Name Decision
- Questions to Ask Before Building Next App
- Source Material for Future Personal OS
- AI Prompt for Final Vision Document
- AI Prompt for Website Plan
- AI Prompt for Brand Naming / Identity
- AI Prompt for Future Personal OS Strategy
- Codex Prompt for Future Personal OS App Foundation
- Full Session Backup

The Codex foundation prompt is designed for the separate future personal OS app. It includes planned modules such as Personal Dashboard, Oakfire Command, Brand Builder, Catering System, Content Engine, Growth Roadmap, AI Concierge, Strain Library / Cannabis Explorer, Notes & Favorites, and Weekly Focus.

The Source Material export combines the Oakfire Planning Brief, Future Personal OS Blueprint, collaborative review feedback, open decisions, and smart questions to answer before Neil starts building the separate future app.

To use the generated Codex prompt later, open `/export`, copy **Codex Prompt for Future Personal OS App Foundation**, and paste it into a new Codex session for a separate project. That future project should be built separately from this intake/planning app.

## Voice Input

Voice input uses browser `SpeechRecognition` or `webkitSpeechRecognition` when available. Chrome and Safari are the best candidates. If voice is unsupported, blocked, or fails, typing always works and typed text is preserved.

## Backup And Export

Use **Download Full Session Backup (.json)** on `/export` before clearing the session or moving devices. The backup includes session IDs, timestamps, original answers, organized answers, skipped/follow-up flags, generated draft, review feedback, and the finalized planning brief.

Use `/import` to restore a backup JSON. Importing validates the basic session shape and asks for confirmation before replacing the local saved session.

## Future Phases

- Real AI polishing
- Backend session saving
- Phone/laptop live sync
- PDF export
- Separate Octavian personal OS foundation

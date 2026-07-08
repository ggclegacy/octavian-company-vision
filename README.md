# Oakfire Vision Intake & Planning

Oakfire Vision Intake & Planning is a Replit-ready React, TypeScript, Tailwind, and Express app for collecting Octavian's intake answers and turning them into planning source material for Neil.

This is not the final Eighth Flame app. Eighth Flame will be a future separate personal OS for Octavian, guided by Orion.

## Two Sides

- **Octavian's public intake side:** Octavian completes Part 1 and Part 2, reviews his answers, and submits the intake.
- **Neil's admin/planning side:** Neil opens `/admin` to review saved submissions, generate planning outputs, copy prompts, and download source material.

There is no authentication yet, so do not share `/admin` publicly.

## Public Intake Flow

1. Welcome page.
2. Part 1: Oakfire Vision Intake.
3. Part 2: Eighth Flame Personal OS Intake.
4. Review Answers.
5. Submit.
6. Completion screen.

Draft answers autosave in localStorage before submit. Final submit saves to backend file storage.

## Oakfire x Legacy Sanctum

Part 1 includes **Oakfire x Legacy Sanctum** after Business Model & Goals and before Website & Digital Presence.

This section teaches the partnership concept before asking questions. It frames Oakfire as the food, hospitality, and community-experience layer inside Legacy Sanctum, not random BBQ inside a barbershop.

The planning outputs summarize the opportunity, including first event models, food formats, premium experience factors, operating needs, 30-day success metrics, and partnership vision.

## Backend Storage

The Express server provides:

- `GET /api/health`
- `POST /api/submissions`
- `GET /api/submissions`
- `GET /api/submissions/:id`
- `POST /api/submissions/:id/generate`

Submissions are saved to `data/submissions.json`. The server creates the file if missing and safely resets an empty or malformed file instead of crashing.

This is file storage only for now. There is no auth yet, no email yet, and no database yet. A future upgrade could add database storage, auth, email notifications, and richer admin permissions.

## Neil Admin

Open `/admin` after a submission is completed.

Admin includes:

- Submission list
- Submission detail
- Raw answers
- Organized answers
- Skipped and needs-follow-up status inside the answer exports
- Oakfire Planning Brief
- Eighth Flame Personal OS Blueprint
- Oakfire x Legacy Sanctum Opportunity
- Source Material for Future Eighth Flame App
- AI prompts
- Codex prompt for the future Eighth Flame foundation
- Copy and download tools
- Full Submission JSON download

## Run Locally

```bash
npm install
npm run dev
```

`npm run dev` starts the Express backend and Vite-powered frontend together. API routes are available in development at the same origin.

Production check:

```bash
npm run build
npm run start
```

`npm run start` runs the Express server, serves API routes, and serves the built frontend from `dist`.

## Full Workflow Test

1. Open the public app and confirm the Oakfire logo loads.
2. Start the intake, answer at least one Oakfire question, one Oakfire x Legacy Sanctum question, and one Eighth Flame question.
3. Refresh the page and confirm draft answers restore from localStorage.
4. Review answers, submit, and confirm the completion screen appears.
5. Open `/admin`, confirm the submission appears, and open its detail page.
6. Click Generate / Refresh Planning Outputs.
7. Confirm the Oakfire Planning Brief, Oakfire x Legacy Sanctum Opportunity, Eighth Flame Blueprint, source material, AI prompts, Codex prompt, and Full Submission JSON are available for copy/download.
8. Stop and restart the server, reopen `/admin`, and confirm the submission persists.
9. Run `npm run build` and `npm run start`, then refresh `/`, `/admin`, and `/admin/submissions/:id`.

## Replit

The `.replit` file builds the app and starts the Express server. React routes such as `/admin` and `/admin/submissions/:id` work on refresh after build because Express falls back to `dist/index.html`.

## Future App Notes

Eighth Flame is the future separate app. Orion is the future AI concierge. The Codex prompt output gives Neil a starting prompt for that later project, but this repo should remain the Oakfire Vision Intake & Planning app.

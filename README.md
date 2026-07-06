# Octavian Company Vision Builder

A Replit-ready Vite, React, TypeScript, and Tailwind CSS app for an in-person company vision session with Octavian.

The app is designed around one important rule: Octavian's answers stay Octavian's answers. The app preserves the original responses, creates simple organized versions for planning, generates a deterministic first vision draft, then lets Neil and Octavian review that draft together before exporting AI-ready materials.

## Run It

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Product Flow

1. Start at `/` and click **Start Answer Session**.
2. In `/session`, Octavian answers questions in his own words by typing or using supported browser voice input.
3. Original answers are saved separately from organized answers.
4. Use **Organize Answer for Vision** to create a simple deterministic planning version without replacing the original answer.
5. Open `/generate` to review completion and generate the first vision draft.
6. Open `/review` to add Neil + Octavian feedback by vision section.
7. Use the three structured review prompts: what feels right, what needs to change, and what should be stronger or clearer.
8. Click **Finalize Vision Hub** to create `/vision`.
9. Use `/present` for a larger, cleaner view when mirroring the vision to a TV.
10. Open `/export` to copy or download original answers, organized answers, review feedback, final vision, AI prompts, or the full JSON session.

The main working pages include a compact Session Control Center with the current status, last saved timestamp, question progress, category progress, and quick links for continuing the answer session, updating the vision draft, reviewing together, opening the final hub, and exporting.

## Voice Input Notes

Voice input uses the browser `SpeechRecognition` or `webkitSpeechRecognition` API when available. Chrome-based browsers usually provide the best support. If voice is unsupported, the app shows a fallback message and typing still works.

## Local Storage

The app stores the full session in browser localStorage:

- session id
- created and updated timestamps
- current question index
- original answers
- organized answers
- generated vision draft
- review feedback
- finalized vision
- skipped questions
- needs-follow-up flags
- last saved timestamp

Refreshing the browser restores the session. The **Clear Session** button requires confirmation before deleting local saved data from the device.

## Session Backup And Import

Use **Download Full Session Backup (.json)** on `/export` before clearing the device, switching devices, or ending the in-person session. The backup includes the session id, timestamps, original answers, organized answers, skipped/follow-up flags, generated draft, review feedback, and finalized vision.

Use `/import` to restore a backup JSON. Importing validates the basic backup shape and asks for confirmation before replacing the local saved session on the device.

## In-Person Session Safety

During `/session`, Neil and Octavian can:

- Type answers or use supported browser voice input
- Mark a question as **Needs follow-up**
- Use **Skip for Now** when an answer is not available yet
- Regenerate the vision draft later using the latest saved answers

Voice input includes readable error messages for blocked microphone permission, no speech detected, and stopped capture. Typing always remains available.

## Export Workflow

The export page includes:

- Original answers grouped by category
- Organized answers grouped by category
- Review feedback grouped by vision section
- Final Vision Hub
- Copy-ready AI prompt for ChatGPT or Claude
- Website plan prompt
- Brand naming / identity prompt
- Future personal BBQ app prompt
- `.txt` downloads for each major output
- Full session `.json` download

The Final Vision Hub and Export page also include a **Before Octavian Leaves** checklist so Neil can confirm the important decisions and download a backup before wrapping up.

## Vision Outputs

The deterministic generator creates richer, presentation-ready sections with:

- Business-focused section wording
- Strategic read notes grounded in saved answers
- Text-based completeness markers
- Practical 30-day first moves
- Useful follow-up questions based on missing or weak areas
- A three-phase Future Build Roadmap

## Future Phase

Later versions could add:

- Backend session saving
- Multiple saved sessions
- AI-generated writing with an optional API integration
- Replit deployment configuration
- Brand identity and logo direction tools
- Catering inquiry system
- Menu and package builder
- Quote calculator
- Customer follow-up system
- Personal BBQ command app
- AI concierge

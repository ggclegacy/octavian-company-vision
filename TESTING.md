# Oakfire Intake Live-Session Test Checklist

1. Run `npm install`.
2. Run `npm run dev`.
3. Open the app and confirm `/` loads with Oakfire branding.
4. Start the answer session.
5. Confirm `/session` allows switching between **Oakfire Intake** and **Personal OS Intake**.
6. Confirm both intake parts show the current question, why it matters, original answer box, voice controls or voice fallback, and planning brief controls.
7. Type an Oakfire answer and save it.
8. Type a future personal OS answer and save it.
9. Refresh the page and confirm answers restore.
10. Use **Organize Answer for Planning Brief** in both intake parts and confirm original answers remain unchanged.
11. Test **Skip for Now**.
12. Test **Needs Follow-Up**.
13. Generate or update the planning draft from `/generate`.
14. Confirm `/generate` summarizes Oakfire Intake and Future Personal OS Intake separately.
15. Confirm `/review` shows Oakfire planning sections, Future Personal OS blueprint sections, source answers, feedback fields, and visible saved feedback status.
16. Add feedback to at least two sections.
17. Finalize the Oakfire Planning Brief.
18. Confirm `/vision` displays **Oakfire Planning Brief**, Future Personal OS Blueprint, Future App Name Decision, Questions to Ask Before Building the Future App, Open Decisions, and Before Octavian Leaves checklist.
19. Open `/export` and confirm outputs are grouped into Session Records, Planning Outputs, and Build Prompts.
20. Copy and download **Source Material for Future Personal OS**.
21. Copy and download **Codex Prompt for Future Personal OS App Foundation**.
22. Download the full session backup JSON.
23. Clear session only after confirming the backup exists.
24. Import the backup and confirm session restores.
25. Run `npm run build`.

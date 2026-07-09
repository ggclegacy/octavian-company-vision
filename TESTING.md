# FINAL END-TO-END TEST CHECKLIST

## CRITICAL SUBMISSION SAVE TEST

1. Run `npm run dev`.
2. Open the public intake.
3. Start the intake.
4. Enter a unique phrase in one Oakfire answer: `UNIQUE_OAKFIRE_TEST_123`.
5. Enter a unique phrase in one Oakfire x Legacy Sanctum answer: `UNIQUE_SANCTUM_TEST_123`.
6. Enter a unique phrase in one Eighth Flame answer: `UNIQUE_EIGHTH_FLAME_TEST_123`.
7. Review answers.
8. Submit the intake.
9. Confirm completion screen appears.
10. Open `/admin`.
11. Confirm the new `REAL` submission appears.
12. Open the submission.
13. Expand raw answers if needed.
14. Confirm all three unique phrases appear.
15. Click `Generate / Refresh Planning Outputs`.
16. Confirm `Executive Summary` appears.
17. Confirm `Oakfire Planning Brief` appears.
18. Confirm `Oakfire x Legacy Sanctum Opportunity` appears.
19. Confirm `Eighth Flame Blueprint` appears.
20. Confirm `Copy-Ready Master Prompt` appears.
21. Copy Master Prompt.
22. Download Full Submission JSON.
23. Confirm downloaded JSON includes the unique phrases.
24. Restart server.
25. Reopen `/admin` and confirm submission still exists.

## DETERMINISTIC BACKEND TEST

Run `npm run test:e2e`.

This script starts the Express app with a temporary data directory, posts a realistic backend submission with unique Oakfire, Legacy Sanctum, and Eighth Flame phrases, verifies the submission appears in list/detail routes, generates planning outputs from the saved submission, verifies test-submission cleanup deletes only test data, confirms persistence across a server restart, and removes its temporary data afterward.

1. Run npm install.
2. Run npm run dev.
3. Open public app.
4. Confirm Oakfire logo loads.
5. Start intake.
6. Answer at least one Oakfire question.
7. Answer one Oakfire x Legacy Sanctum question.
8. Switch to Eighth Flame OS intake.
9. Answer at least one Eighth Flame question.
10. Test voice fallback or voice input.
11. Refresh and confirm draft answers restore.
12. Review answers.
13. Submit intake.
14. Confirm completion screen appears.
15. Confirm public side shows no admin tools.
16. Open /admin.
17. Confirm submission appears.
18. Open submission detail.
19. Confirm Oakfire answers appear.
20. Confirm Eighth Flame answers appear.
21. Click Generate / Refresh Planning Outputs.
22. Confirm Oakfire Planning Brief appears.
23. Confirm Oakfire x Legacy Sanctum Opportunity appears.
24. Confirm Eighth Flame Blueprint appears.
25. Copy Oakfire Planning Brief.
26. Copy Codex Prompt.
27. Download Full Submission JSON.
28. Stop and restart server.
29. Reopen /admin and confirm submission persists.
30. Run npm run build.
31. Run npm run start.
32. Confirm public route works.
33. Confirm /admin works.
34. Confirm /admin/submissions/:id works on refresh.

## API Checks

1. Open `/api/health`.
2. Submit a public intake and confirm `data/submissions.json` is created.
3. Confirm a second submission appends instead of replacing the first.
4. Confirm `/api/submissions` returns the submission list.
5. Confirm `/api/submissions/:id` returns one submission.
6. Confirm `/api/submissions/:id/generate` updates planning outputs without deleting original answers.
7. Confirm an empty `data/submissions.json` resets safely to an empty list.
8. Confirm malformed JSON resets safely to an empty list.

## Expected Submission Fields

Each saved submission should include:

- `id`
- `createdAt`
- `updatedAt`
- `completedAt`
- `submitterName`
- `status`
- `oakfireAnswers`
- `personalOsAnswers`
- `organizedOakfireAnswers`
- `organizedPersonalOsAnswers`
- `skippedQuestions`
- `needsFollowUpQuestions`
- `oakfirePlanningBrief`
- `oakfireLegacySanctumOpportunity`
- `eighthFlameBlueprint`
- `sourceMaterialForFutureApp`
- `aiPrompts`
- `codexPrompt`
- `rawSessionBackup`

Do not clear local drafts until the backend submission appears in `/admin`.

## BACKEND SUBMISSION TEST

1. Run npm run dev.
2. Open the public intake in a browser.
3. Fill in a unique test phrase in an Oakfire answer, such as “UNIQUE OAKFIRE TEST 123.”
4. Fill in a unique test phrase in an Eighth Flame answer, such as “UNIQUE EIGHTH FLAME TEST 456.”
5. Submit the intake.
6. Confirm completion screen appears.
7. Open /admin in a separate browser tab or different browser.
8. Confirm the new submission appears.
9. Open the submission detail page.
10. Confirm “UNIQUE OAKFIRE TEST 123” appears in the saved answers.
11. Confirm “UNIQUE EIGHTH FLAME TEST 456” appears in the saved answers.
12. Click Generate / Refresh Planning Outputs.
13. Confirm generated outputs reference or include the submitted information where appropriate.
14. Download Full Submission JSON.
15. Confirm the unique test phrases are in the JSON.
16. Restart the server.
17. Reopen /admin and confirm the submission still appears.

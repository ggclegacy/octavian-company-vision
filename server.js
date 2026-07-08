import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const isDev = process.argv.includes("--dev");
const dataDir = path.join(__dirname, "data");
const submissionsPath = path.join(dataDir, "submissions.json");

app.use(express.json({ limit: "10mb" }));

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(submissionsPath);
  } catch {
    await fs.writeFile(submissionsPath, "[]\n", "utf8");
  }
}

async function readSubmissions() {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(submissionsPath, "utf8");
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    try {
      const raw = await fs.readFile(submissionsPath, "utf8");
      if (raw.trim()) {
        const backupPath = path.join(dataDir, `submissions.malformed-${Date.now()}.json`);
        await fs.writeFile(backupPath, raw, "utf8");
        console.warn(`Malformed submissions file backed up to ${backupPath}. Resetting submissions.json.`);
      }
    } catch {
      console.warn("Could not back up malformed submissions file. Resetting submissions.json.");
    }
    await fs.writeFile(submissionsPath, "[]\n", "utf8");
    return [];
  }
}

async function writeSubmissions(submissions) {
  await ensureDataFile();
  await fs.writeFile(submissionsPath, `${JSON.stringify(submissions, null, 2)}\n`, "utf8");
}

function now() {
  return new Date().toISOString();
}

function createId() {
  return `submission-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function answerCount(session) {
  return Object.values(session?.answers || {}).filter((answer) => String(answer?.originalAnswer || "").trim()).length;
}

function splitAnswers(session) {
  const answers = session?.answers || {};
  const entries = Object.entries(answers);
  const oakfireEntries = entries.filter(([questionId]) => !questionId.startsWith("os-"));
  const personalEntries = entries.filter(([questionId]) => questionId.startsWith("os-"));
  return {
    oakfireAnswers: Object.fromEntries(oakfireEntries),
    personalOsAnswers: Object.fromEntries(personalEntries),
    organizedOakfireAnswers: Object.fromEntries(oakfireEntries.map(([questionId, answer]) => [questionId, answer?.organizedAnswer || ""])),
    organizedPersonalOsAnswers: Object.fromEntries(personalEntries.map(([questionId, answer]) => [questionId, answer?.organizedAnswer || ""])),
    skippedQuestions: entries
      .filter(([, answer]) => answer?.skippedAt)
      .map(([questionId, answer]) => ({ questionId, questionText: answer?.questionText || questionId, skippedAt: answer?.skippedAt })),
    needsFollowUpQuestions: entries
      .filter(([, answer]) => answer?.followUpNeeded)
      .map(([questionId, answer]) => ({ questionId, questionText: answer?.questionText || questionId })),
  };
}

function basicPlanningOutputs(session) {
  const answers = session?.answers || {};
  const answerLines = Object.values(answers).map((answer) => {
    const status = [
      answer?.skippedAt ? "skipped" : "",
      answer?.followUpNeeded ? "needs follow-up" : "",
    ].filter(Boolean).join(", ");
    return `Q: ${answer?.questionText || answer?.questionId || "Unknown question"}\nA: ${answer?.originalAnswer || "Needs follow-up"}${status ? `\nStatus: ${status}` : ""}`;
  });
  const sanctumAnswers = Object.values(answers).filter((answer) => String(answer?.questionId || "").startsWith("sanctum-"));
  const sanctumLines = sanctumAnswers.length
    ? sanctumAnswers.map((answer) => `${answer.questionText}: ${answer.organizedAnswer || answer.originalAnswer || "Needs follow-up"}`)
    : ["Needs follow-up."];

  return {
    generatedAt: now(),
    oakfirePlanningBrief: answerLines.join("\n\n") || "Needs follow-up.",
    eighthFlameBlueprint:
      "Eighth Flame is a future separate personal OS guided by Orion. Use the completed intake answers to define Oakfire Command, personal planning, finance, health, content, mature private strain notes, and AI concierge needs.",
    oakfireLegacySanctumOpportunity: sanctumLines.join("\n"),
    sourceMaterialForFutureEighthFlameApp:
      "Use the Oakfire Planning Brief, Oakfire x Legacy Sanctum Opportunity, and Eighth Flame intake answers as source material for a separate future app.",
    prompts: {
      oakfireFinalVision:
        "Create an Oakfire Planning Brief from the submitted answers. Include Oakfire x Legacy Sanctum as the food, hospitality, and community-experience layer inside Legacy Sanctum. Do not invent answers; mark unknowns as Needs follow-up.",
      oakfireWebsitePlan: "Create a practical Oakfire website plan from the submitted answers. Do not invent missing details.",
      oakfireBrandIdentity: "Create a brand naming and identity brief from the submitted answers. Do not invent missing details.",
      eighthFlameStrategy:
        "Create an Eighth Flame personal OS strategy from the submitted answers, keeping it separate from the intake app.",
      codexFoundation:
        "Build a separate Eighth Flame personal OS foundation. Include Oakfire x Sanctum inside Oakfire Command with event ideas, plate drop planning, tasting night checklists, partnership roadmap, lead tracking, content capture checklist, and 30-day test metrics.",
    },
  };
}

function buildStoredSubmission({ id = createId(), timestamp = now(), submitterName = "Octavian", session, planningOutputs }) {
  const safeSession = session && typeof session === "object" ? session : { answers: {} };
  const completedSession = {
    ...safeSession,
    stage: "Completed",
    completedAt: safeSession.completedAt || timestamp,
    updatedAt: safeSession.updatedAt || timestamp,
    lastSavedAt: safeSession.lastSavedAt || timestamp,
  };
  const outputs = {
    ...basicPlanningOutputs(completedSession),
    ...(planningOutputs && typeof planningOutputs === "object" ? planningOutputs : {}),
  };
  const split = splitAnswers(completedSession);
  return {
    id,
    submitterName,
    status: "completed",
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: completedSession.completedAt,
    answeredCount: answerCount(completedSession),
    oakfireAnswerCount: Object.values(split.oakfireAnswers).filter((answer) => String(answer?.originalAnswer || "").trim()).length,
    personalOsAnswerCount: Object.values(split.personalOsAnswers).filter((answer) => String(answer?.originalAnswer || "").trim()).length,
    ...split,
    oakfirePlanningBrief: outputs.oakfirePlanningBrief || "Needs follow-up.",
    oakfireLegacySanctumOpportunity: outputs.oakfireLegacySanctumOpportunity || "Needs follow-up.",
    eighthFlameBlueprint: outputs.eighthFlameBlueprint || "Needs follow-up.",
    sourceMaterialForFutureApp: outputs.sourceMaterialForFutureEighthFlameApp || outputs.sourceMaterialForFutureApp || "Needs follow-up.",
    aiPrompts: outputs.prompts || {},
    codexPrompt: outputs.prompts?.codexFoundation || outputs.codexPrompt || "Needs follow-up.",
    rawSessionBackup: completedSession,
    session: completedSession,
    planningOutputs: outputs,
  };
}

function buildTestSession() {
  const ts = new Date().toISOString();
  const answer = (questionId, questionText, originalAnswer) => ({
    questionId,
    questionText,
    originalAnswer,
    organizedAnswer: originalAnswer,
    skippedAt: null,
    followUpNeeded: false,
  });
  return {
    sessionId: `test-session-${Date.now()}`,
    createdAt: ts,
    updatedAt: ts,
    stage: "Completed",
    currentQuestionIndex: 0,
    completedAt: ts,
    lastSavedAt: ts,
    generatedVisionDraft: [],
    generatedVisionDraftUpdatedAt: null,
    reviewFeedback: {},
    finalizedVision: [],
    finalizedAt: null,
    answers: {
      // Story
      "story-love": answer("story-love", "What made you fall in love with BBQ?", "I grew up watching my grandfather tend his pit every Sunday. The smell of hickory smoke, the patience required, the way the whole family gathered — it was never just food. It was connection. The moment I cooked my first full brisket and watched people's faces, I knew this was what I was meant to do."),
      "story-inspired": answer("story-inspired", "Who taught you or inspired you?", "My grandfather was the foundation. He never measured anything — just felt it. Then Aaron Franklin's documentary showed me that BBQ could be elevated into something world-class without losing its soul. Those two forces shaped how I approach every cook."),
      "story-meaning": answer("story-meaning", "What does cooking BBQ mean to you personally?", "It means slowing down in a world that moves too fast. It means craft over convenience. When I'm at the pit, I'm present — no distractions, just fire, meat, and time. That focus is something I want people to feel when they eat Oakfire food."),
      "story-feeling": answer("story-feeling", "What do you want people to feel when they eat your food?", "I want them to feel like they're somewhere special. Like someone genuinely cared about what ended up on that plate. Not fast food energy. I want them to slow down, close their eyes on that first bite, and just feel at home."),
      "story-memory": answer("story-memory", "Is there a personal story, family story, faith element, nickname, place, or memory that matters to this brand?", "My grandfather called his backyard setup 'the holy ground.' Said the smoke carried prayers up. That spiritual-but-grounded energy is something I want woven into Oakfire. The name itself came from a vision — oak wood, open fire, something ancient and intentional."),
      // Name
      "name-current": answer("name-current", "What name are you using right now?", "Oakfire by Octavian"),
      "name-choice": answer("name-choice", "Do you want to keep Pit Bull Barbecue, improve it, or explore new names?", "Oakfire by Octavian is the name. I moved away from Pit Bull Barbecue. It felt generic and didn't carry the weight I wanted. Oakfire feels premium, intentional, and personal."),
      "name-like": answer("name-like", "What do you like about the current name?", "Oakfire connects to the craft — oak wood is one of the best smoking woods, and fire is central to everything I do. Adding 'by Octavian' makes it personal without being a gimmick. It sounds like a real brand."),
      "name-dislike": answer("name-dislike", "What do you not love about the current name?", "Nothing at this point. I'm committed to Oakfire by Octavian. The only thing I'm still figuring out is how to shorten it for casual reference — Oakfire alone works well."),
      "name-inspiration": answer("name-inspiration", "Are there any words, nicknames, family names, places, sayings, or personal references that could inspire a better name?", "My grandfather's sayings, the idea of something burning slow and steady, the oak tree as a symbol of strength and endurance. Octavian is my real name — it carries history and gravity."),
      // Brand
      "brand-colors": answer("brand-colors", "What colors do you imagine for the brand?", "Deep blacks, charcoal, rich gold or amber, and ember red. Dark and premium, like a high-end steakhouse meets a smokehouse that actually has soul."),
      "brand-clear-colors": answer("brand-clear-colors", "Since you are colorblind, what colors usually look best or clearest to you?", "High contrast combinations work best — black and white, black and gold, dark backgrounds with bright highlights. The amber/gold on black is something I can see clearly and it already looks premium."),
      "brand-colorblindness": answer("brand-colorblindness", "Do you know what type of colorblindness you have?", "Red-green colorblindness. I sometimes can't distinguish between certain shades of red and green, but bold high-contrast colors read clearly."),
      "brand-feel": answer("brand-feel", "Should the brand feel backyard and rugged, clean and professional, bold and loud, premium smokehouse, family/community focused, old-school Southern BBQ, modern food truck style, or something else?", "Premium smokehouse with soul. I don't want it to feel corporate or cold, but it should absolutely feel elevated. Think high-end restaurant vibes with the authenticity of a family cook. Premium but approachable."),
      "brand-lead": answer("brand-lead", "Should the brand be built more around you as the pitmaster, the food itself, the story, the culture/community, or a mix?", "A mix — but the story and the pitmaster are the foundation. The food speaks for itself once people try it. What pulls them in is who made it and why. Oakfire by Octavian is as much about me as it is about the craft."),
      // Food
      "food-meats": answer("food-meats", "What meats do you cook best?", "Brisket is my signature. I'm also strong on beef ribs, smoked chicken thighs, and pulled pork. Brisket is where I put the most work — low and slow, 12-14 hours, oak smoke. That's the hero."),
      "food-sides": answer("food-sides", "What are your best sides?", "Smoked mac and cheese is a crowd favorite. Also jalapeño cornbread, smoked beans, and coleslaw. The mac gets more attention than almost anything — people ask for it separately."),
      "food-compliments": answer("food-compliments", "What do people compliment the most?", "The brisket bark and the smoke ring. People say they've never had brisket like that outside of Texas BBQ joints. The mac and cheese comes in second consistently. And the tenderness — people are shocked at how it just falls apart."),
      "food-plate": answer("food-plate", "What is one plate you would proudly put in front of anybody?", "The Oakfire Signature Plate — sliced brisket with the full bark, a scoop of smoked mac, jalapeño cornbread, and smoked beans. That plate represents everything Oakfire is about."),
      "food-different": answer("food-different", "What makes your BBQ different from other local BBQ?", "The patience and the wood. I only use oak and take the time the meat actually needs — no shortcuts, no rushing the smoker. Most local BBQ is good but it's not at this level of intentionality. I also bring a visual standard — the plates look as good as they taste."),
      // Goals
      "goals-six-months": answer("goals-six-months", "What do you want this BBQ business to become in the next 6 months?", "A known name in the local market with a clear brand, a working website, at least two catering bookings, and a consistent content presence on YouTube and Instagram. I want people to know Oakfire exists and already see it as premium."),
      "goals-two-years": answer("goals-two-years", "What do you want it to become in the next 1-2 years?", "A real catering and plate-drop business generating consistent income alongside my day job. Oakfire connected to Legacy Sanctum with regular events. A YouTube channel with real subscribers who follow the brand story. And a food truck or pop-up presence being explored seriously."),
      "goals-dream": answer("goals-dream", "What long-term dream would be amazing if everything went right?", "A brick-and-mortar Oakfire location. My own smokehouse — maybe attached to Legacy Sanctum or a standalone space. A national brand that started here, in this city, from one man and one pit. Oakfire becoming synonymous with premium craft BBQ the way Franklin's is synonymous with Texas brisket."),
      "goals-paths": answer("goals-paths", "Which paths interest you most: catering, plate lunches, pop-ups, food truck, festivals, private parties, business lunches, YouTube/content, competitions, restaurant, merch, or something else?", "Catering and plate drops first — that's the fastest path to real revenue without massive overhead. Then Legacy Sanctum events. Then YouTube growing the audience. Merch when the brand has enough identity. Food truck is a longer-term goal."),
      "goals-real-business": answer("goals-real-business", "What would make you say, \"Okay, this is becoming a real business\"?", "When I have three consistent catering clients, a website that gets real inquiries, and income that I can actually count on each month. When I'm turning down clients because I'm booked — that's when it becomes real."),
      // Sanctum
      "sanctum-exciting": answer("sanctum-exciting", "When Neil brought up Oakfire being connected to Legacy Sanctum, what made the idea feel exciting to you?", "The built-in audience. Legacy Sanctum already has men coming through the door who care about quality, lifestyle, and community. That's exactly who Oakfire is for. I don't have to start from zero — I can plug into something that already exists."),
      "sanctum-unclear-before": answer("sanctum-unclear-before", "Before this idea, what were you unsure about with the BBQ business?", "How to get in front of the right people without spending money I don't have. Marketing felt like the hardest part — the food is already there, but nobody knows it yet. Legacy Sanctum solves part of that problem."),
      "sanctum-imagine": answer("sanctum-imagine", "When you picture Oakfire inside or connected to Legacy Sanctum, what do you imagine?", "A dedicated Oakfire corner or setup inside Legacy Sanctum where people know on certain nights, the food is Oakfire. Premium plates, branded packaging, the logo visible. The barbershop becomes the pickup point and the gathering space. People associate getting their haircut with getting great food from Oakfire."),
      "sanctum-starting-model": answer("sanctum-starting-model", "Which starting model feels most realistic first?", "Private tasting night first — small, controlled, invite-only. Get the feedback, get the content, test the demand. Then monthly Oakfire nights once we know what works."),
      "sanctum-food-fit": answer("sanctum-food-fit", "What kind of Oakfire food would fit Legacy Sanctum best?", "Brisket plates and smoked chicken are the anchors. Sampler trays for events where people want variety. Sliders or sandwiches for casual pickup. Premium tasting menu for special nights."),
      "sanctum-premium": answer("sanctum-premium", "What would make Oakfire at Legacy Sanctum feel premium and not random?", "Branded packaging — every box, tray, and napkin has the Oakfire logo. Pre-announced events so people know it's coming. Consistent quality so every plate is the same standard. Photography and video captured every time so the content feeds the brand."),
      "sanctum-frequency": answer("sanctum-frequency", "How often could you realistically support Oakfire events or plate drops while working full-time?", "Once or twice a month to start. I cook on weekends anyway. One dedicated Oakfire event or plate drop per month is very manageable. Two if demand is there."),
      "sanctum-operation-model": answer("sanctum-operation-model", "Would you rather cook offsite and bring food in, cook onsite if possible, use Legacy Sanctum as pickup/event space, or decide later?", "Cook offsite and bring it in for now. I have my setup at home, it's dialed in, and I know how to manage transport and holding temps. Legacy Sanctum is the pickup and event space."),
      "sanctum-needs": answer("sanctum-needs", "What equipment, prep space, storage, or serving setup would you need to make the first version work?", "My current smoker handles everything I need for small events. I'd need proper food-grade transport containers and branded packaging. Warming equipment on-site would be ideal. Storage isn't a concern for small runs."),
      "sanctum-first-test": answer("sanctum-first-test", "What would be the easiest first test event?", "A private invite-only tasting night — maybe 15-20 people. Close connections, no pressure, get feedback, get photos, capture content. Keep the menu tight: brisket, mac, cornbread, one drink option."),
      "sanctum-30-day-success": answer("sanctum-30-day-success", "What would success look like after the first 30 days of testing Oakfire with Legacy Sanctum?", "At least one successful tasting event with real feedback. Two or three catering inquiries generated from word of mouth. Content from the event posted and getting traction. A list of at least 10 people who said they'd come back or buy again."),
      "sanctum-reputation": answer("sanctum-reputation", "If Oakfire and Legacy Sanctum partnered together, what would you want people to say about the experience?", "That it's the best food they've ever had at a barbershop event. That Oakfire and Legacy Sanctum together feel like a lifestyle brand, not just two separate businesses in the same space. That you come for the cut and stay for the food — and you tell everyone about both."),
      // Website
      "web-job": answer("web-job", "What should a website help you do?", "Build credibility and generate catering inquiries. When someone Googles Oakfire by Octavian, I want them to land on a site that instantly communicates premium quality and makes them want to reach out."),
      "web-goal": answer("web-goal", "Should the main goal be catering requests, menu viewing, social growth, YouTube promotion, telling your story, preorder requests, or something else?", "Catering requests are number one. Then the story and menu to build trust. YouTube and Instagram links to show the work. Preorder requests once the plate-drop model is running."),
      "web-next-step": answer("web-next-step", "What would you want someone to do after visiting your website?", "Contact me about catering or sign up for the list to get notified when plate drops happen. Every page should be moving them toward one of those two actions."),
      "web-social": answer("web-social", "What social pages or YouTube links matter right now?", "YouTube channel for the cook content. Instagram for the food photography and brand moments. Those are the two main platforms. TikTok is a possibility later but not the focus now."),
      "web-success": answer("web-success", "What would make the website feel successful to you?", "Getting at least one real catering inquiry per month from someone who found me through the website. Having people tell me they checked out the site before reaching out. Looking as professional as any high-end local restaurant."),
      // Catering
      "cat-events": answer("cat-events", "What types of events do you want to cook for?", "Private parties, corporate lunches, family reunions, graduation parties, birthday celebrations, and eventually wedding rehearsal dinners. Those are the high-value events where people are willing to pay for quality."),
      "cat-size": answer("cat-size", "What size event can you realistically handle right now?", "Up to 50 people comfortably with my current setup. I could push to 75 with some extra prep time. For 100+, I'd need to plan further out and potentially get help."),
      "cat-equipment": answer("cat-equipment", "What equipment do you currently use?", "A full-size offset smoker that handles large briskets and multiple racks of ribs at once. Portable warming equipment. Full food-service packaging and transport setup. I'm well equipped for the current scale."),
      "cat-costs": answer("cat-costs", "Do you know your food costs and pricing yet?", "I have a general sense but haven't built a formal pricing sheet. I know my per-pound costs for brisket and ribs, and I've priced jobs manually. Building a proper catering calculator is something I need to do."),
      "cat-stress": answer("cat-stress", "What part of catering feels most confusing or stressful?", "Pricing confidently. I second-guess myself on whether I'm charging enough, especially for bigger events. And following up with leads — I get interested people but don't always have a clean system to track them and close."),
      // Content
      "content-start": answer("content-start", "What made you start the YouTube channel?", "I wanted to document the craft and build something real over time. BBQ content has a huge audience and I knew the quality of what I was cooking deserved to be seen. Starting the channel was about building proof while I build the business."),
      "content-filming": answer("content-filming", "Do you enjoy filming your cooks?", "Yes — I like capturing the process. The fire, the prep, the reveal. It's natural because I'm already doing the cook. The editing is where I slow down, but filming feels like part of the ritual now."),
      "content-kind": answer("content-kind", "What kind of content do you want to make?", "Long-form cook videos that show the full process and the story behind it. Short clips for Instagram and TikTok showing the best moments — the bark, the smoke ring, the pull. Behind-the-scenes of catering events and Oakfire moments at Legacy Sanctum."),
      "content-frequency": answer("content-frequency", "How often could you realistically post?", "One YouTube video per month minimum. Short-form content two to three times a week if I have help planning and batching it. I don't want to force content — I want it to feel like documentation of something real."),
      "content-help": answer("content-help", "Would you want help turning cooks into video ideas, titles, captions, reels, and posts?", "Absolutely. That's one of the things I'd most want from a system or AI tool — take the raw cook content and help me turn it into captions, titles, descriptions, and post ideas without having to think too hard about it every time."),
      // AI
      "ai-help": answer("ai-help", "What business or digital things would you want help with most?", "Pricing and catering quotes automatically. Content ideas and captions from my existing footage. Email follow-up templates. A way to track leads and inquiries without using a complicated CRM."),
      "ai-app-interest": answer("ai-app-interest", "Would you be interested later in a simple personal OS built around you?", "Yes — as long as it's actually built for how I think and live. I don't want something that becomes another thing I have to manage. If it simplifies my life and business, absolutely."),
      "ai-app-jobs": answer("ai-app-jobs", "What would you want that app to help you with?", "Oakfire catering management, content planning, personal health tracking, cannabis strain notes for my own use, and an AI concierge I can just talk to and get real guidance from."),
      "ai-hardest": answer("ai-hardest", "What part of growing the business while working full time feels hardest?", "Finding time to do both well. After a full day of work, I don't always have the mental bandwidth to also be marketing, following up with clients, creating content, and planning events. Systems and AI could absorb a lot of that friction."),
      "ai-first": answer("ai-first", "If AI could help with one thing immediately, what would it be?", "Catering quotes. Give me a tool where I punch in the headcount and menu, and it spits out a professional quote I can send immediately. That alone would save time and make me look more professional."),
      // Final
      "final-understand": answer("final-understand", "If Neil could help you build this the right way, what would you want him to understand most about your vision?", "That Oakfire is not a side hustle. This is the beginning of something I intend to build into a real brand and business over the next decade. Everything we build now — the website, the systems, the content, the Legacy Sanctum connection — should be built like it's going to last. I'm not in a hurry, but I'm serious. Build it like it matters, because it does."),
      // Personal OS
      "os-purpose-help": answer("os-purpose-help", "If Neil built you a personal app, what would you want it to help you with most?", "Oakfire business management, personal planning, and having one place where everything I need to track actually lives. Right now I have things scattered across notes apps, texts, and my head."),
      "os-purpose-focus": answer("os-purpose-focus", "Would you want the app to be mostly business-focused, personal-life-focused, or a balance of both?", "A balance — but Oakfire is the business center. I want my personal health, habits, and finances in there too, because they all affect how well I can build the business."),
      "os-purpose-weekly": answer("os-purpose-weekly", "What would make you actually open and use the app every week?", "If it showed me exactly what I need to do for Oakfire that week, what I should be working on for content, and how my personal goals are tracking. If it's a useful daily snapshot, I'll open it."),
      "os-purpose-avoid": answer("os-purpose-avoid", "What do you not want the app to become?", "Another thing I feel guilty for not using. It can't be overwhelming or feature-heavy from day one. Start simple, make it genuinely useful, and grow from there."),
      "os-purpose-hardest": answer("os-purpose-hardest", "What feels hardest for you to keep organized right now?", "Catering leads and follow-ups. I lose track of who reached out and where the conversation ended. Second hardest is content — I have footage I never edit because I don't have a system."),
      "os-daily-week": answer("os-daily-week", "What does a normal week look like for you right now?", "Full-time job Monday through Friday. Cooking on weekends — sometimes a full-day cook on Saturday or Sunday. Occasional content filming worked into the cooks. Not a lot of downtime, but the weekends are where Oakfire gets built."),
      "os-daily-track": answer("os-daily-track", "What do you usually have to keep track of?", "Work schedule and projects, Oakfire catering inquiries and bookings, content ideas and what I've filmed, personal appointments, and health goals."),
      "os-daily-reminders": answer("os-daily-reminders", "What do you wish you had reminders or guidance for?", "Following up with catering leads. Posting content consistently. Hydration and workout consistency. Upcoming Oakfire events or prep deadlines."),
      "os-daily-goals": answer("os-daily-goals", "What goals are you trying to stay more consistent with?", "Working out at least three times a week, drinking enough water, posting Oakfire content consistently, and making at least one business-building move every week."),
      "os-daily-planning": answer("os-daily-planning", "Would weekly planning, daily priorities, or simple reminders help you?", "Weekly planning to start — a Monday check-in that sets the Oakfire and personal priorities for the week. Daily reminders for habit-based things like workouts and water."),
      "os-work-projects": answer("os-work-projects", "What jobs, side hustles, or business projects should the app support?", "Oakfire by Octavian is the main project. Full-time job stays separate. Real estate is on pause but might come back. Oakfire is the focus."),
      "os-work-real-estate": answer("os-work-real-estate", "Are you still doing real estate or realtor work? If yes, what would you want the app to help with?", "Not actively right now. I got my license but it's on hold while Oakfire is the priority. Might revisit in a year or two, so I'd want the app to have room for it."),
      "os-work-other-income": answer("os-work-other-income", "Besides Oakfire, are there any other business goals or income ideas you care about?", "Merch is a potential future income stream once the brand is stronger. Collaborations and partnerships — like the Legacy Sanctum model — where Oakfire is the food layer of something bigger."),
      "os-work-leads": answer("os-work-leads", "Would lead tracking, follow-ups, task lists, or client notes help you?", "Lead tracking and follow-ups are the most important. I lose catering leads because I don't have a system. Even a simple list with status and last contact date would change everything."),
      "os-work-avoid": answer("os-work-avoid", "What business stuff do you usually put off or forget?", "Following up. Sending catering quotes on time. Posting content after I've filmed it. Those three things are the biggest gaps."),
      "os-oakfire-first": answer("os-oakfire-first", "What part of building Oakfire would you want the app to help with first?", "Catering management — quote generation, lead tracking, event checklist. That's the revenue engine and it needs to work cleanly."),
      "os-oakfire-tools": answer("os-oakfire-tools", "Would you use tools for catering quotes, prep checklists, menu ideas, or customer follow-ups?", "All of them — but catering quotes and customer follow-ups are the most urgent. Prep checklists would save mental energy on event days."),
      "os-oakfire-content": answer("os-oakfire-content", "Would you want the app to help you plan content for YouTube, reels, and posts?", "Yes — especially generating caption ideas and post concepts from what I've already cooked. I don't need the app to be a full content studio, just a smart assistant for content planning."),
      "os-oakfire-recipes": answer("os-oakfire-recipes", "Would you want the app to help track ideas for sauces, rubs, recipes, or signature plates?", "Yes — I have ideas and variations I don't want to lose. A simple recipe and rub notes section would be useful."),
      "os-oakfire-useful": answer("os-oakfire-useful", "What would make the Oakfire module feel useful immediately?", "A catering quote calculator and a lead tracker. Those two things working well would make me open the app every single week."),
      "os-money-scope": answer("os-money-scope", "Would you want the app to help track personal money, business money, or both?", "Both, but separately. Oakfire business expenses need to be tracked clearly for tax and profitability reasons. Personal budgeting is secondary but still useful."),
      "os-money-tools": answer("os-money-tools", "Would budgeting, savings goals, expense tracking, or income tracking help you?", "Savings goals and income tracking for personal. Expense tracking for Oakfire — every supply run, packaging cost, and fuel expense."),
      "os-money-oakfire-expenses": answer("os-money-oakfire-expenses", "Would you want a simple Oakfire expense tracker?", "Yes — something I can log quickly after a supply run or cook. Nothing complicated."),
      "os-money-catering-profit": answer("os-money-catering-profit", "Would you want help estimating catering profits or food costs?", "Absolutely. That's tied to the catering calculator idea — I want to punch in a job and see a rough profit estimate after food costs."),
      "os-money-first": answer("os-money-first", "What financial area would be most useful to organize first?", "Oakfire revenue and expenses. Understanding whether Oakfire is actually profitable on each job is the most important financial insight I need right now."),
      "os-health-support": answer("os-health-support", "Would you want the app to help with health, energy, sleep, workouts, food, hydration, or recovery?", "Workouts, hydration, and sleep are the big three. I feel better and perform better — at work, at the pit, everywhere — when those are consistent."),
      "os-health-goals": answer("os-health-goals", "What health or lifestyle goals matter to you right now?", "Getting stronger and leaner, improving sleep quality, and drinking more water consistently. Nothing extreme — just showing up for the fundamentals every day."),
      "os-health-habits": answer("os-health-habits", "Would simple habit tracking help you?", "Yes — just a simple daily check-in. Did I work out, did I hit my water goal, how did I sleep. Seeing the streak is motivating."),
      "os-health-reminders": answer("os-health-reminders", "Would reminders for meals, water, supplements, or workouts help?", "Water and workout reminders would actually help. I forget to drink water when I'm deep into a project or a cook."),
      "os-health-difference": answer("os-health-difference", "What lifestyle area would make the biggest difference if it were more organized?", "Sleep and recovery. If my sleep is consistent, everything else is better — creativity, energy, patience. That's the foundation."),
      "os-cannabis-interest": answer("os-cannabis-interest", "Would you want a private cannabis strain library inside the future app?", "Yes — completely private, mature, and useful. Not a public-facing feature. Just my personal notes on strains I've tried and what worked."),
      "os-cannabis-info": answer("os-cannabis-info", "What strain information do you like to look up?", "Effects, THC/CBD levels, terpene profiles, and whether it's more indica or sativa leaning. I look up flavor notes too."),
      "os-cannabis-save": answer("os-cannabis-save", "Would you want to save favorite strains, effects, flavors, terpenes, ratings, or notes?", "Yes — a simple card per strain with my own rating, notes on how it felt, and whether I'd use it for creativity, relaxation, or sleep."),
      "os-cannabis-effects": answer("os-cannabis-effects", "Would you want to track what strains helped with relaxing, sleep, creativity, appetite, focus, or pain?", "Relaxing and sleep are the main ones. Creativity is useful for content days. Appetite for cook days when I want to test my own food more thoroughly."),
      "os-cannabis-better": answer("os-cannabis-better", "What would make this feature better than just searching random websites?", "My own personal notes and ratings — tailored to how things actually affected me, not generic reviews. And it stays private and in context with the rest of my life in the app."),
      "os-learning-orion-teach": answer("os-learning-orion-teach", "What would you want a future AI concierge to teach or explain to you?", "Business fundamentals — pricing, marketing, brand strategy. How to grow a food business intelligently. How to use content to build an audience. Practical knowledge, not generic advice."),
      "os-learning-lessons": answer("os-learning-lessons", "Would you want simple business lessons, brand lessons, content lessons, or AI/tool lessons?", "Business and brand lessons tied to Oakfire. Teach me while I'm building — don't give me abstract theory. Give me examples I can apply to what I'm actually doing."),
      "os-learning-style": answer("os-learning-style", "Do you prefer short answers, step-by-step guidance, or deeper explanations?", "Short answers with a clear action step. Give me the insight and the next move, not a lecture. I'll ask follow-ups when I want more depth."),
      "os-learning-oakfire": answer("os-learning-oakfire", "What do you want to understand better about building Oakfire?", "Pricing strategy — am I leaving money on the table? Brand positioning — how do I stand out from every other BBQ guy? And content strategy — what kind of content actually converts followers into customers?"),
      "os-learning-action": answer("os-learning-action", "What kind of advice would actually help you take action?", "Advice that's specific to my situation. Not generic business tips. Tell me: given where Oakfire is right now, what's the highest-leverage thing I should do this week?"),
      "os-orion-ask": answer("os-orion-ask", "What would you want to ask a future AI concierge most often?", "What should I work on today? How do I price this catering job? What should I post this week? Is this a good decision for Oakfire? Quick, practical questions I'd normally have to figure out alone."),
      "os-orion-role": answer("os-orion-role", "Should the AI concierge feel more like a business coach, personal assistant, strategist, or simple helper?", "Strategist and business coach. I don't need someone to schedule my meetings — I need someone who actually understands the vision and can help me think through decisions."),
      "os-orion-tone": answer("os-orion-tone", "What tone should the AI concierge have: direct, encouraging, funny, serious, calm, or a mix?", "Direct and calm. Don't sugarcoat things or give me empty hype. I want honest, grounded guidance. Occasionally encouraging when it fits, but always real."),
      "os-orion-voice": answer("os-orion-voice", "Would voice input be helpful for talking to the AI concierge?", "Yes — especially during cooks when my hands are full. Being able to just talk to Orion while I'm monitoring the smoker would be incredibly useful."),
      "os-orion-never": answer("os-orion-never", "What should the AI concierge never do or never sound like?", "Never generic. Never give me the same advice you'd give anyone else. Never sound like a customer service bot. And never make me feel like I'm talking to something that doesn't know who I am."),
      "os-feel-style": answer("os-feel-style", "Should the future app feel dark, premium, simple, bold, luxury, rugged, or something else?", "Dark and premium — like the Oakfire brand itself. Black interface, gold accents, clean typography. It should feel like a tool built for someone serious about what they're building."),
      "os-feel-oakfire": answer("os-feel-oakfire", "Would you want the design connected to Oakfire's colors and logo?", "Yes — I want the two to feel like they belong together. Not identical, but clearly from the same world. The Eighth Flame app should feel like the command center behind the Oakfire brand."),
      "os-feel-must": answer("os-feel-must", "What features would be must-have for version one?", "Oakfire catering management, lead tracker, personal habit tracking, cannabis strain library, and Orion AI concierge. Those are the five things I'd use from day one."),
      "os-feel-later": answer("os-feel-later", "What features would be cool later, but not needed first?", "Real estate tools, advanced financial dashboards, full CRM functionality, social media scheduling integration, and inventory management. Great ideas — just not for the first version."),
      "os-feel-three": answer("os-feel-three", "If Neil could only build three things first, what should they be?", "One: Oakfire Command with catering calculator and lead tracker. Two: Orion AI concierge. Three: Personal dashboard with habit tracking and a weekly focus summary."),
    },
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: "oakfire-vision-intake", time: now() });
});

app.post("/api/submissions/test", async (req, res) => {
  try {
    const timestamp = now();
    const session = buildTestSession();
    const submissions = await readSubmissions();
    const submission = buildStoredSubmission({
      timestamp,
      submitterName: "Test Octavian",
      session,
    });
    submission.isTest = true;
    submissions.push(submission);
    await writeSubmissions(submissions);
    res.status(201).json(submission);
  } catch (err) {
    console.error("Test submission error:", err);
    res.status(500).json({ error: "Could not create test submission." });
  }
});

app.post("/api/submissions", async (req, res) => {
  try {
    const timestamp = now();
    const session = req.body?.session;
    if (!session || typeof session !== "object" || !session.answers || typeof session.answers !== "object") {
      res.status(400).json({ error: "Submission must include a session with answers." });
      return;
    }
    const submissions = await readSubmissions();
    const submission = buildStoredSubmission({
      timestamp,
      submitterName: req.body?.submitterName || "Octavian",
      session,
      planningOutputs: req.body?.planningOutputs,
    });
    submissions.push(submission);
    await writeSubmissions(submissions);
    res.status(201).json(submission);
  } catch {
    res.status(500).json({ error: "Could not save submission. Your local draft was not cleared." });
  }
});

app.get("/api/submissions", async (_req, res) => {
  try {
    const submissions = await readSubmissions();
    res.json(
      [...submissions]
        .sort((a, b) => new Date(b.completedAt || b.createdAt || 0).getTime() - new Date(a.completedAt || a.createdAt || 0).getTime())
        .map((submission) => ({
        id: submission.id,
        submitterName: submission.submitterName || "Octavian",
        status: submission.status || "completed",
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        completedAt: submission.completedAt,
        answeredCount: submission.answeredCount || answerCount(submission.session),
        oakfireAnswerCount: submission.oakfireAnswerCount ?? Object.keys(submission.oakfireAnswers || {}).length,
        personalOsAnswerCount: submission.personalOsAnswerCount ?? Object.keys(submission.personalOsAnswers || {}).length,
        hasPlanningOutputs: Boolean(submission.planningOutputs?.generatedAt),
        isTest: Boolean(submission.isTest),
      })),
    );
  } catch {
    res.status(500).json({ error: "Could not load submissions." });
  }
});

app.get("/api/submissions/:id", async (req, res) => {
  try {
    const submissions = await readSubmissions();
    const submission = submissions.find((item) => item.id === req.params.id);
    if (!submission) {
      res.status(404).json({ error: "Submission not found." });
      return;
    }
    res.json(submission);
  } catch {
    res.status(500).json({ error: "Could not load submission." });
  }
});

app.post("/api/submissions/:id/generate", async (req, res) => {
  try {
    const submissions = await readSubmissions();
    const index = submissions.findIndex((item) => item.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: "Submission not found." });
      return;
    }
    const timestamp = now();
    const rebuilt = buildStoredSubmission({
      id: submissions[index].id,
      timestamp: submissions[index].createdAt,
      submitterName: submissions[index].submitterName || "Octavian",
      session: submissions[index].session || submissions[index].rawSessionBackup || {
        answers: {
          ...(submissions[index].oakfireAnswers || {}),
          ...(submissions[index].personalOsAnswers || {}),
        },
      },
      planningOutputs: {
        ...(req.body?.planningOutputs && typeof req.body.planningOutputs === "object" ? req.body.planningOutputs : {}),
        generatedAt: timestamp,
      },
    });
    submissions[index] = {
      ...rebuilt,
      updatedAt: timestamp,
    };
    await writeSubmissions(submissions);
    res.json(submissions[index]);
  } catch {
    res.status(500).json({ error: "Could not generate planning outputs." });
  }
});

if (isDev) {
  const vite = await import("vite");
  const viteServer = await vite.createServer({
    server: { middlewareMode: true, hmr: false },
    environments: {
      client: {
        dev: {
          hmr: false,
          createEnvironment(name, config, context) {
            return new vite.DevEnvironment(name, config, {
              ...context,
              hot: false,
              disableFetchModule: true,
            });
          },
        },
      },
    },
    appType: "spa",
  });
  app.use(viteServer.middlewares);
  app.use(/.*/, async (req, res, next) => {
    try {
      const template = await fs.readFile(path.join(__dirname, "index.html"), "utf8");
      const html = await viteServer.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (error) {
      viteServer.ssrFixStacktrace(error);
      next(error);
    }
  });
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Oakfire Vision Intake ${isDev ? "dev" : "production"} server running on port ${port}`);
});

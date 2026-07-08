export type Question = {
  id: string;
  text: string;
  why: string;
};

export type Category = {
  id: string;
  name: string;
  purpose: string;
  questions: Question[];
};

export const categories: Category[] = [
  {
    id: "story",
    name: "The Story",
    purpose:
      "A strong food brand is not just about the plate. It is about the person, the story, and why people should care.",
    questions: [
      {
        id: "story-love",
        text: "What made you fall in love with BBQ?",
        why: "The story gives the brand heart and makes people care beyond the food.",
      },
      {
        id: "story-inspired",
        text: "Who taught you or inspired you?",
        why: "Family, mentors, culture, and personal history can shape the brand identity.",
      },
      {
        id: "story-meaning",
        text: "What does cooking BBQ mean to you personally?",
        why: "This helps define the deeper purpose behind the business.",
      },
      {
        id: "story-feeling",
        text: "What do you want people to feel when they eat your food?",
        why: "Great brands are built around the feeling people remember.",
      },
      {
        id: "story-memory",
        text: "Is there a personal story, family story, faith element, nickname, place, or memory that matters to this brand?",
        why: "These details can lead to stronger names, visuals, and messaging.",
      },
    ],
  },
  {
    id: "name",
    name: "Business Name Direction",
    purpose:
      "A business name should be able to grow with the company. It should work for catering, YouTube, merch, a food truck, events, and maybe one day a restaurant.",
    questions: [
      {
        id: "name-current",
        text: "What name are you using right now?",
        why: "This gives us the starting point.",
      },
      {
        id: "name-choice",
        text: "Do you want to keep Pit Bull Barbecue, improve it, or explore new names?",
        why: "The name needs to fit the long-term direction, not just what was picked quickly.",
      },
      {
        id: "name-like",
        text: "What do you like about the current name?",
        why: "We want to keep anything that already feels meaningful.",
      },
      {
        id: "name-dislike",
        text: "What do you not love about the current name?",
        why: "Weaknesses in the current name tell us what needs to change.",
      },
      {
        id: "name-inspiration",
        text: "Are there any words, nicknames, family names, places, sayings, or personal references that could inspire a better name?",
        why: "The strongest brand names usually come from something real.",
      },
    ],
  },
  {
    id: "brand",
    name: "Brand Look & Feel",
    purpose:
      "The brand's look should match the food, the personality, and the future. It needs to feel real enough for catering, content, shirts, menus, a website, and bigger opportunities.",
    questions: [
      {
        id: "brand-colors",
        text: "What colors do you imagine for the brand?",
        why: "Color sets the first emotional impression.",
      },
      {
        id: "brand-clear-colors",
        text: "Since you are colorblind, what colors usually look best or clearest to you?",
        why: "The brand should look good to customers and to you.",
      },
      {
        id: "brand-colorblindness",
        text: "Do you know what type of colorblindness you have?",
        why: "This helps build a color system that is accessible and still looks strong.",
      },
      {
        id: "brand-feel",
        text: "Should the brand feel backyard and rugged, clean and professional, bold and loud, premium smokehouse, family/community focused, old-school Southern BBQ, modern food truck style, or something else?",
        why: "This defines the creative direction.",
      },
      {
        id: "brand-lead",
        text: "Should the brand be built more around you as the pitmaster, the food itself, the story, the culture/community, or a mix?",
        why: "This helps define what the brand leads with.",
      },
    ],
  },
  {
    id: "food",
    name: "Food Identity",
    purpose:
      "This section helps find what the brand should become known for. The goal is to identify the signature items and the food people already remember you for.",
    questions: [
      { id: "food-meats", text: "What meats do you cook best?", why: "These may become your signature offers." },
      { id: "food-sides", text: "What are your best sides?", why: "Sides can separate a BBQ brand from the crowd." },
      {
        id: "food-compliments",
        text: "What do people compliment the most?",
        why: "Customers often reveal the strongest positioning.",
      },
      {
        id: "food-plate",
        text: "What is one plate you would proudly put in front of anybody?",
        why: "This can become the hero plate for the brand.",
      },
      {
        id: "food-different",
        text: "What makes your BBQ different from other local BBQ?",
        why: "Differentiation is what makes the business easier to market.",
      },
    ],
  },
  {
    id: "goals",
    name: "Business Model & Goals",
    purpose:
      "There are different ways to grow a BBQ business. The right first step may not be a food truck. It might be catering, plate drops, pop-ups, content, private events, or a mix.",
    questions: [
      {
        id: "goals-six-months",
        text: "What do you want this BBQ business to become in the next 6 months?",
        why: "This defines the first realistic milestone.",
      },
      {
        id: "goals-two-years",
        text: "What do you want it to become in the next 1-2 years?",
        why: "This shows the bigger direction.",
      },
      {
        id: "goals-dream",
        text: "What long-term dream would be amazing if everything went right?",
        why: "The long-term dream helps shape the brand foundation now.",
      },
      {
        id: "goals-paths",
        text: "Which paths interest you most: catering, plate lunches, pop-ups, food truck, festivals, private parties, business lunches, YouTube/content, competitions, restaurant, merch, or something else?",
        why: "This helps choose the smartest first revenue path.",
      },
      {
        id: "goals-real-business",
        text: "What would make you say, \"Okay, this is becoming a real business\"?",
        why: "This defines what success feels like.",
      },
    ],
  },
  {
    id: "website",
    name: "Website & Digital Presence",
    purpose:
      "A good website is not just a digital flyer. It should help people understand who you are, trust your food, see what you offer, and take the next step.",
    questions: [
      { id: "web-job", text: "What should a website help you do?", why: "The website needs a job, not just a design." },
      {
        id: "web-goal",
        text: "Should the main goal be catering requests, menu viewing, social growth, YouTube promotion, telling your story, preorder requests, or something else?",
        why: "The main call-to-action shapes the whole website.",
      },
      {
        id: "web-next-step",
        text: "What would you want someone to do after visiting your website?",
        why: "Every page should point people toward the next step.",
      },
      {
        id: "web-social",
        text: "What social pages or YouTube links matter right now?",
        why: "Existing content and platforms can become part of the brand foundation.",
      },
      {
        id: "web-success",
        text: "What would make the website feel successful to you?",
        why: "This defines how we measure whether the site is doing its job.",
      },
    ],
  },
  {
    id: "catering",
    name: "Catering & Operations",
    purpose:
      "To grow catering without chaos, you need simple systems: headcount, portions, pricing, prep lists, follow-ups, and profit.",
    questions: [
      {
        id: "cat-events",
        text: "What types of events do you want to cook for?",
        why: "Different events need different packages and messaging.",
      },
      {
        id: "cat-size",
        text: "What size event can you realistically handle right now?",
        why: "The offer has to match current capacity.",
      },
      {
        id: "cat-equipment",
        text: "What equipment do you currently use?",
        why: "Capacity and menu depend on the tools you have.",
      },
      {
        id: "cat-costs",
        text: "Do you know your food costs and pricing yet?",
        why: "Profit matters. Good food alone is not enough.",
      },
      {
        id: "cat-stress",
        text: "What part of catering feels most confusing or stressful?",
        why: "These are the first systems Neil can help build.",
      },
    ],
  },
  {
    id: "content",
    name: "Content & YouTube",
    purpose:
      "Your cooks can become content. Content can build trust, attract customers, and make the brand feel alive before it is even full time.",
    questions: [
      {
        id: "content-start",
        text: "What made you start the YouTube channel?",
        why: "This shows what kind of content will feel natural.",
      },
      {
        id: "content-filming",
        text: "Do you enjoy filming your cooks?",
        why: "The content plan has to match what you will actually do.",
      },
      {
        id: "content-kind",
        text: "What kind of content do you want to make?",
        why: "Different content builds different audiences.",
      },
      {
        id: "content-frequency",
        text: "How often could you realistically post?",
        why: "Consistency only works if it fits your real life.",
      },
      {
        id: "content-help",
        text: "Would you want help turning cooks into video ideas, titles, captions, reels, and posts?",
        why: "AI and systems can make content easier.",
      },
    ],
  },
  {
    id: "ai",
    name: "AI Tools & Future Systems",
    purpose:
      "The goal is not to make things complicated. The goal is to build simple tools that help you think, plan, price, post, follow up, and grow while still working full time.",
    questions: [
      {
        id: "ai-help",
        text: "What business or digital things would you want help with most?",
        why: "This shows where AI can actually be useful.",
      },
      {
        id: "ai-app-interest",
        text: "Would you be interested later in a simple personal OS built around you?",
        why: "The future app should be built around your life, Oakfire, and the systems you would actually use.",
      },
      {
        id: "ai-app-jobs",
        text: "What would you want that app to help you with?",
        why: "This defines the first useful features.",
      },
      {
        id: "ai-hardest",
        text: "What part of growing the business while working full time feels hardest?",
        why: "The system should reduce friction, not add pressure.",
      },
      {
        id: "ai-first",
        text: "If AI could help with one thing immediately, what would it be?",
        why: "This identifies the highest-leverage first tool.",
      },
    ],
  },
  {
    id: "final",
    name: "Final Vision",
    purpose: "This is the most important question. The details matter, but the bigger vision matters more.",
    questions: [
      {
        id: "final-understand",
        text: "If Neil could help you build this the right way, what would you want him to understand most about your vision?",
        why: "This captures what may not fit neatly into the other sections.",
      },
    ],
  },
];

export const flatQuestions = categories.flatMap((category) =>
  category.questions.map((question) => ({ ...question, category })),
);

export const personalOsCategories: Category[] = [
  {
    id: "os-purpose",
    name: "Personal App Purpose",
    purpose: "This section helps define what the future personal OS should actually do for Octavian, beyond just Oakfire.",
    questions: [
      { id: "os-purpose-help", text: "If Neil built you a personal app, what would you want it to help you with most?", why: "This identifies the most useful first job for the future app." },
      { id: "os-purpose-focus", text: "Would you want the app to be mostly business-focused, personal-life-focused, or a balance of both?", why: "The app needs a clear center of gravity." },
      { id: "os-purpose-weekly", text: "What would make you actually open and use the app every week?", why: "A useful personal OS has to fit real behavior." },
      { id: "os-purpose-avoid", text: "What do you not want the app to become?", why: "Boundaries help keep the first version simple." },
      { id: "os-purpose-hardest", text: "What feels hardest for you to keep organized right now?", why: "The hardest friction points are the best first targets." },
    ],
  },
  {
    id: "os-daily",
    name: "Daily Life & Priorities",
    purpose: "A personal OS should fit real life, not create more work.",
    questions: [
      { id: "os-daily-week", text: "What does a normal week look like for you right now?", why: "This helps the future app match Octavian's real schedule." },
      { id: "os-daily-track", text: "What do you usually have to keep track of?", why: "The app should support existing responsibilities." },
      { id: "os-daily-reminders", text: "What do you wish you had reminders or guidance for?", why: "Reminder needs shape the dashboard and weekly focus tools." },
      { id: "os-daily-goals", text: "What goals are you trying to stay more consistent with?", why: "Consistency goals define useful personal tracking." },
      { id: "os-daily-planning", text: "Would weekly planning, daily priorities, or simple reminders help you?", why: "This chooses the right planning rhythm." },
    ],
  },
  {
    id: "os-business-work",
    name: "Business & Work",
    purpose: "The future personal OS should support the work and business areas that actually matter to Octavian.",
    questions: [
      { id: "os-work-projects", text: "What jobs, side hustles, or business projects should the app support?", why: "This keeps the future app bigger than Oakfire when needed." },
      { id: "os-work-real-estate", text: "Are you still doing real estate or realtor work? If yes, what would you want the app to help with?", why: "Real estate support should only be included if it matters now." },
      { id: "os-work-other-income", text: "Besides Oakfire, are there any other business goals or income ideas you care about?", why: "The app should leave room for relevant income paths." },
      { id: "os-work-leads", text: "Would lead tracking, follow-ups, task lists, or client notes help you?", why: "This clarifies whether CRM-like tools belong in the first version." },
      { id: "os-work-avoid", text: "What business stuff do you usually put off or forget?", why: "Repeated friction points can become simple app workflows." },
    ],
  },
  {
    id: "os-oakfire-support",
    name: "Oakfire Support Inside Future OS",
    purpose: "Oakfire will be the main business module inside the future app.",
    questions: [
      { id: "os-oakfire-first", text: "What part of building Oakfire would you want the app to help with first?", why: "This identifies the first useful Oakfire Command feature." },
      { id: "os-oakfire-tools", text: "Would you use tools for catering quotes, prep checklists, menu ideas, or customer follow-ups?", why: "This clarifies practical Oakfire tools." },
      { id: "os-oakfire-content", text: "Would you want the app to help you plan content for YouTube, reels, and posts?", why: "Content planning may be part of Oakfire Command or Content Engine." },
      { id: "os-oakfire-recipes", text: "Would you want the app to help track ideas for sauces, rubs, recipes, or signature plates?", why: "Recipe and offer ideas can become saved planning assets." },
      { id: "os-oakfire-useful", text: "What would make the Oakfire module feel useful immediately?", why: "Immediate usefulness should drive the MVP." },
    ],
  },
  {
    id: "os-money",
    name: "Money & Planning",
    purpose: "This section helps decide whether the future personal OS should include finance and planning tools.",
    questions: [
      { id: "os-money-scope", text: "Would you want the app to help track personal money, business money, or both?", why: "Finance tools need the right scope." },
      { id: "os-money-tools", text: "Would budgeting, savings goals, expense tracking, or income tracking help you?", why: "This identifies simple first finance features." },
      { id: "os-money-oakfire-expenses", text: "Would you want a simple Oakfire expense tracker?", why: "Oakfire costs may need lightweight tracking early." },
      { id: "os-money-catering-profit", text: "Would you want help estimating catering profits or food costs?", why: "Profit estimates can support catering decisions." },
      { id: "os-money-first", text: "What financial area would be most useful to organize first?", why: "This prioritizes finance without overbuilding." },
    ],
  },
  {
    id: "os-health",
    name: "Health, Energy & Lifestyle",
    purpose: "The app can support the man building the brand, not just the brand itself.",
    questions: [
      { id: "os-health-support", text: "Would you want the app to help with health, energy, sleep, workouts, food, hydration, or recovery?", why: "Personal support should be useful without becoming a health app." },
      { id: "os-health-goals", text: "What health or lifestyle goals matter to you right now?", why: "This shows which goals deserve tracking." },
      { id: "os-health-habits", text: "Would simple habit tracking help you?", why: "Habit tools should stay lightweight." },
      { id: "os-health-reminders", text: "Would reminders for meals, water, supplements, or workouts help?", why: "Reminders can support energy and consistency." },
      { id: "os-health-difference", text: "What lifestyle area would make the biggest difference if it were more organized?", why: "The highest-impact area should guide the first version." },
    ],
  },
  {
    id: "os-cannabis",
    name: "Cannabis / Strain Library",
    purpose: "This is a personal module only. It should be mature, private, and useful, not the center of the app.",
    questions: [
      { id: "os-cannabis-interest", text: "Would you want a private cannabis strain library inside the future app?", why: "This confirms whether the feature belongs at all." },
      { id: "os-cannabis-info", text: "What strain information do you like to look up?", why: "This defines useful strain details." },
      { id: "os-cannabis-save", text: "Would you want to save favorite strains, effects, flavors, terpenes, ratings, or notes?", why: "Saved details shape the data model." },
      { id: "os-cannabis-effects", text: "Would you want to track what strains helped with relaxing, sleep, creativity, appetite, focus, or pain?", why: "Personal effect notes make the library more useful than search." },
      { id: "os-cannabis-better", text: "What would make this feature better than just searching random websites?", why: "This identifies the personal value of the module." },
    ],
  },
  {
    id: "os-learning",
    name: "Learning & Guidance",
    purpose: "The future personal OS should help Octavian learn and build without overwhelming him.",
    questions: [
      { id: "os-learning-orion-teach", text: "What would you want a future AI concierge to teach or explain to you?", why: "This defines the teaching role." },
      { id: "os-learning-lessons", text: "Would you want simple business lessons, brand lessons, content lessons, or AI/tool lessons?", why: "This selects learning tracks." },
      { id: "os-learning-style", text: "Do you prefer short answers, step-by-step guidance, or deeper explanations?", why: "Guidance style should match Octavian." },
      { id: "os-learning-oakfire", text: "What do you want to understand better about building Oakfire?", why: "This keeps learning grounded in the business." },
      { id: "os-learning-action", text: "What kind of advice would actually help you take action?", why: "Advice should lead to movement, not overwhelm." },
    ],
  },
  {
    id: "os-orion",
    name: "AI Concierge",
    purpose: "This section defines whether a future AI concierge belongs in the personal OS.",
    questions: [
      { id: "os-orion-ask", text: "What would you want to ask a future AI concierge most often?", why: "This defines common use cases." },
      { id: "os-orion-role", text: "Should the AI concierge feel more like a business coach, personal assistant, strategist, or simple helper?", why: "Role clarity shapes the AI experience." },
      { id: "os-orion-tone", text: "What tone should the AI concierge have: direct, encouraging, funny, serious, calm, or a mix?", why: "Tone makes the tool feel built for Octavian." },
      { id: "os-orion-voice", text: "Would voice input be helpful for talking to the AI concierge?", why: "Voice may matter for real use." },
      { id: "os-orion-never", text: "What should the AI concierge never do or never sound like?", why: "Boundaries make the AI concierge safer and more trusted." },
    ],
  },
  {
    id: "os-feel",
    name: "App Feel & Must-Haves",
    purpose: "The future app should feel built for Octavian, not like generic software.",
    questions: [
      { id: "os-feel-style", text: "Should the future app feel dark, premium, simple, bold, luxury, rugged, or something else?", why: "This defines the product atmosphere." },
      { id: "os-feel-oakfire", text: "Would you want the design connected to Oakfire's colors and logo?", why: "This decides how closely the future app should borrow Oakfire identity." },
      { id: "os-feel-must", text: "What features would be must-have for version one?", why: "MVP must-haves prevent overbuilding." },
      { id: "os-feel-later", text: "What features would be cool later, but not needed first?", why: "Later ideas should not clutter the foundation." },
      { id: "os-feel-three", text: "If Neil could only build three things first, what should they be?", why: "This forces the clearest first build priorities." },
    ],
  },
];

export const flatPersonalOsQuestions = personalOsCategories.flatMap((category) =>
  category.questions.map((question) => ({ ...question, category })),
);

export const allQuestions = [...flatQuestions, ...flatPersonalOsQuestions];

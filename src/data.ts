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
    name: "AI Tools & Future Personal App",
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
        text: "Would you be interested later in a simple personal BBQ app built around you?",
        why: "The future app should be built around your life, not generic business advice.",
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

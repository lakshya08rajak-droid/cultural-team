/**
 * CULTURAL TEAM — CONFIGURATION & SUPABASE INTEGRATION
 */

const CONFIG = {
  // Supabase Cloud Configuration
  supabaseUrl: (typeof window !== "undefined" && window.__SUPABASE_ENV__?.url) || "https://mrdvxgcrdhnfaxradzoo.supabase.co",
  supabaseKey: (typeof window !== "undefined" && window.__SUPABASE_ENV__?.key) || "sb_publishable_ttEcjraLqZg9y8qWKhan3w_kXPt4-i9",

  // Production Domain
  productionUrl: "https://cultural-team-git-main-culturalteam.vercel.app",
  qrCodeImage: "assets/cultural-qr-code.jpg",

  // Brand Metadata
  brand: {
    name: "Cultural Team",
    heroHeadline: "SOMETHING AMAZING IS COMING SOON!!!!",
    heroSubheadline: "DO YOU WANNA GUESS WHAT?",
    tagline: "College Arts & Cultural Committee",
    callToAction: "SHARE YOUR IDEAS",
    mysteryTheme: "The Vault of Curiosity",
    year: "2026"
  },

  // Allowed Categories
  categories: [
    "Cultural Events",
    "Music and Dance",
    "Competitions",
    "Parties and Celebrations",
    "Workshops",
    "Other Ideas"
  ],

  // Form Validation & Anti-Spam Rules
  rules: {
    minTitleLength: 2,
    maxTitleLength: 100,
    maxDescriptionLength: 350,
    submissionCooldownSeconds: 5
  },

  // Live Halloween Event Countdown Configuration
  // Event: Freshers' Halloween Party
  // Target: Friday, 30 October 2026, 6:00:00 PM IST (Asia/Kolkata, UTC+05:30)
  countdown: {
    eventName: "Freshers' Halloween Party",
    targetIso: "2026-10-30T18:00:00+05:30",
    timeZone: "Asia/Kolkata",
    targetLabel: "Friday, 30 October 2026, 6:00 PM IST",
    completionMessage: "THE PARTY STARTS NOW!"
  }
};

if (typeof window !== "undefined") {
  window.APP_CONFIG = CONFIG;
}

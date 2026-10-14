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

  // Live Reveal Countdown Configuration
  // Target: 15 October 2026, 1:45:00 PM IST (Asia/Kolkata, UTC+05:30)
  // Activation: 15 October 2026, 12:00:00 AM IST (Midnight)
  countdown: {
    targetIso: "2026-10-15T13:45:00+05:30",
    activationIso: "2026-10-15T00:00:00+05:30",
    timeZone: "Asia/Kolkata",
    targetLabel: "15 October 2026, 1:45 PM IST"
  }
};

if (typeof window !== "undefined") {
  window.APP_CONFIG = CONFIG;
}

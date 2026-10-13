/**
 * CULTURAL TEAM — CONFIGURATION & SUPABASE INTEGRATION
 */

const CONFIG = {
  // Supabase Cloud Configuration
  supabaseUrl: (typeof window !== "undefined" && window.__SUPABASE_ENV__?.url) || "https://mrdvxgcrdhnfaxradzoo.supabase.co",
  supabaseKey: (typeof window !== "undefined" && window.__SUPABASE_ENV__?.key) || "sb_publishable_ttEcjraLqZg9y8qWKhan3w_kXPt4-i9",

  // Production Domain (used for QR code generation and sharing)
  productionUrl: "https://cultural-team.vercel.app",

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

  // Organizer Default Passcode
  adminPasscode: "cultural2026"
};

if (typeof window !== "undefined") {
  window.APP_CONFIG = CONFIG;
}

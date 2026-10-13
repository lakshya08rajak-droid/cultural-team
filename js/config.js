/**
 * CULTURAL TEAM — CONFIGURATION & DATABASE SETTINGS
 * 
 * To connect your Supabase project:
 * 1. Go to https://supabase.com and create or open your project.
 * 2. In Project Settings > API, copy your "Project URL" and "anon public" API Key.
 * 3. Replace the values below or set window.__SUPABASE_ENV__ in your deployment.
 * 4. Run `supabase/schema.sql` in your Supabase SQL Editor to initialize tables & RLS policies.
 */

const CONFIG = {
  // SUPABASE CLOUD DATABASE CONFIGURATION
  // Place your real Supabase credentials here or provide them via window.__SUPABASE_ENV__
  supabaseUrl: (typeof window !== "undefined" && window.__SUPABASE_ENV__?.url) || "",
  supabaseAnonKey: (typeof window !== "undefined" && window.__SUPABASE_ENV__?.anonKey) || "",

  // Production Domain (used for QR code generation and sharing)
  // When deployed on Vercel, this is auto-detected from window.location.href
  productionUrl: "https://cultural-team.vercel.app",

  // Cultural Team Brand Identity
  brand: {
    name: "CULTURAL TEAM",
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

  // Form Validation & Spam Rules
  rules: {
    minTitleLength: 2,
    maxTitleLength: 100,
    maxDescriptionLength: 350,
    submissionCooldownSeconds: 25 // Prevent spamming submissions
  }
};

if (typeof window !== "undefined") {
  window.APP_CONFIG = CONFIG;
}

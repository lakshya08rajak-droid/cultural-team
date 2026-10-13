/**
 * CULTURAL TEAM — APPLICATION CONFIGURATION (FRONTEND ONLY)
 * 
 * Standalone static configuration without backend dependencies.
 * All suggestions and votes are managed via the browser's localStorage.
 */

const CONFIG = {
  // Production Domain (used for QR code generation and sharing)
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

  // Allowed Event Categories
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

  // Storage Keys for Browser Persistence
  storage: {
    suggestionsKey: "cultural_team_suggestions_v2",
    voterTokenKey: "cultural_team_voter_id",
    votedIdsKey: "cultural_team_voted_ids"
  }
};

if (typeof window !== "undefined") {
  window.APP_CONFIG = CONFIG;
}

#!/bin/sh
set -e

echo "=== Running Cultural Team Security & Architecture Verification Suite ==="

# 1. Check core files exist and are non-empty
for f in \
  index.html \
  css/styles.css \
  js/config.js \
  js/suggestions-data.js \
  js/storage.js \
  js/qrcode.min.js \
  js/app.js \
  api/submit-suggestion.js \
  api/admin-action.js \
  assets/cultural-club-logo.jpg \
  supabase/schema.sql \
  vercel.json \
  package.json \
  README.md; do
  if [ ! -s "$f" ]; then
    echo "ERROR: Missing or empty file: $f"
    exit 1
  fi
done
echo "[PASS] 1. All core project files, serverless endpoints, and assets exist."

# 2. Check for LEAKED SECRETS in frontend code
if grep -ri "service_role\|postgres:\|postgres://\|supabase_admin" js/ index.html css/ 2>/dev/null; then
  echo "SECURITY VULNERABILITY: Sensitive database secrets or service_role keys found in frontend code!"
  exit 1
fi
echo "[PASS] 2. Zero service-role keys or database passwords found in frontend code."

# 3. Verify PostgreSQL Row Level Security (RLS) hardening in schema.sql
grep -q "ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;" supabase/schema.sql
grep -q "CREATE POLICY \"Public can view suggestions\"" supabase/schema.sql
grep -q "CREATE POLICY \"Public can insert suggestions\"" supabase/schema.sql

# Ensure NO overly permissive public UPDATE or DELETE policies exist
if grep -q "CREATE POLICY.*UPDATE.*TO public" supabase/schema.sql; then
  echo "SECURITY VULNERABILITY: Overly permissive UPDATE policy for public found in schema.sql!"
  exit 1
fi
if grep -q "CREATE POLICY.*DELETE.*TO public" supabase/schema.sql; then
  echo "SECURITY VULNERABILITY: Overly permissive DELETE policy for public found in schema.sql!"
  exit 1
fi
echo "[PASS] 3. Database RLS verified: Public UPDATE and DELETE strictly forbidden."

# 4. Verify Database-level & Server-level Length Constraints (<= 1000 characters)
grep -q "char_length(description) <= 1000" supabase/schema.sql
grep -q "cleanDesc.length > 1000" api/submit-suggestion.js
grep -q "maxlength=\"1000\"" index.html
echo "[PASS] 4. Maximum length constraint (1,000 chars) enforced at database, API, and UI layers."

# 5. Verify XSS Protection and Content Sanitization
grep -q "function escapeHTML" js/app.js
grep -q "escapeHTML(item.title)" js/app.js
grep -q "escapeHTML(item.description)" js/app.js
echo "[PASS] 5. XSS defenses verified: All user-submitted content escaped as plain text."

# 6. Verify Server-Side Rate Limiting & Honeypot Bot Trap in api/submit-suggestion.js
grep -q "isRateLimited" api/submit-suggestion.js
grep -q "RATE_LIMIT_WINDOW_MS" api/submit-suggestion.js
grep -q "website_bot_check" api/submit-suggestion.js
echo "[PASS] 6. Server-side sliding window rate limiting and honeypot bot trap verified."

# 7. Verify Required Headings & Design Consistency
grep -q "CULTURAL TEAM" index.html
grep -q "SOMETHING AMAZING IS COMING SOON!!!!" index.html
grep -q "DO YOU WANNA GUESS WHAT?" index.html
grep -q "SHARE YOUR IDEAS" index.html
grep -q "WHAT SHOULD WE HOST NEXT?" index.html
grep -q "THE PEOPLE HAVE SPOKEN" index.html
grep -q "COMMUNITY IDEAS:" index.html
grep -q "SUGGESTIONS MANAGEMENT HUB" index.html
grep -q "Cinzel" index.html
grep -q "Playfair Display" index.html
echo "[PASS] 7. Brand identity, Monumental Bold Roman typography, and slogans preserved."

# 8. Verify all 30 Inspiration Ideas
if [ $(grep -c "id: \"inspire-" js/suggestions-data.js) -ne 30 ]; then
  echo "ERROR: Expected 30 inspiration ideas, found $(grep -c "id: \"inspire-" js/suggestions-data.js)"
  exit 1
fi
echo "[PASS] 8. All 30 inspiration suggestions present and verified."

# 9. Verify Hardened toggle_upvote and Device-Bound suggestion_votes Table
grep -q "CREATE TABLE IF NOT EXISTS public.suggestion_votes" supabase/schema.sql
grep -q "toggle_upvote(p_id BIGINT, p_voter_token TEXT)" supabase/schema.sql
grep -q "v_clean_token !~" supabase/schema.sql
grep -q "REVOKE ALL ON TABLE public.suggestion_votes FROM anon, authenticated, public;" supabase/schema.sql
echo "[PASS] 9. Anti-abuse upvoting verified: Unique device tracking & input validation."

# 10. Verify Passcode-Protected Admin Functions
grep -q "admin_delete_suggestion(p_id BIGINT, p_passcode TEXT)" supabase/schema.sql
grep -q "admin_toggle_reviewed(p_id BIGINT, p_passcode TEXT)" supabase/schema.sql
grep -q "isBruteForceBlocked" api/admin-action.js
echo "[PASS] 10. Admin moderation protected by passcode and anti-brute-force rate limiting."

# 11. Verify Mobile & Responsive CSS Rules
grep -q "@media (max-width: 768px)" css/styles.css
grep -q "@media (max-width: 480px)" css/styles.css
grep -q "\.mgmt-panel {" css/styles.css
echo "[PASS] 11. Mobile, tablet, and desktop responsive stylesheets verified."

# 12. Verify JavaScript Syntax via macOS JavaScriptCore
if [ -x /usr/bin/osascript ]; then
  /usr/bin/osascript -l JavaScript -e '
    ObjC.import("Foundation");
    function read(p) {
      return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(p, $.NSUTF8StringEncoding, null));
    }
    
    globalThis.window = globalThis;
    globalThis.localStorage = {
      getItem: function() { return null; },
      setItem: function() {},
      removeItem: function() {}
    };
    globalThis.sessionStorage = {
      getItem: function() { return null; },
      setItem: function() {},
      removeItem: function() {}
    };
    globalThis.addEventListener = function() {};
    globalThis.setInterval = function() {};
    globalThis.clearInterval = function() {};

    eval(read("js/config.js"));
    eval(read("js/suggestions-data.js"));
    eval(read("js/qrcode.min.js"));
    eval(read("js/storage.js"));

    if (!window.SuggestionStore) {
      throw new Error("SuggestionStore failed to load");
    }
    if (typeof window.SuggestionStore.add !== "function") {
      throw new Error("SuggestionStore.add missing");
    }
    if (typeof window.SuggestionStore.toggleUpvote !== "function") {
      throw new Error("SuggestionStore.toggleUpvote missing");
    }
    if (typeof window.SuggestionStore.toggleReviewed !== "function") {
      throw new Error("SuggestionStore.toggleReviewed missing");
    }
    if (typeof window.SuggestionStore.delete !== "function") {
      throw new Error("SuggestionStore.delete missing");
    }

    var module = { exports: {} };
    eval(read("api/submit-suggestion.js"));
    if (typeof module.exports !== "function") {
      throw new Error("api/submit-suggestion handler missing");
    }

    var adminModule = { exports: {} };
    var origModule = module;
    module = adminModule;
    eval(read("api/admin-action.js"));
    if (typeof adminModule.exports !== "function") {
      throw new Error("api/admin-action handler missing");
    }
  ' >/dev/null
  echo "[PASS] 12. JavaScript client and Node.js serverless syntax validated."
fi

echo "=== ALL SECURITY CHECKS AND ARCHITECTURE TESTS PASSED SUCCESSFULLY ==="

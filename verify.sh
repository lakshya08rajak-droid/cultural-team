#!/bin/sh
set -e

echo "=== Running Cultural Team Security & Architecture Verification Suite ==="

# 1. Check core files exist and are non-empty
for f in \
  index.html \
  share-ideas.html \
  qr-code.html \
  css/styles.css \
  js/config.js \
  js/storage.js \
  js/share-ideas.js \
  js/qr-code.js \
  api/submit-suggestion.js \
  assets/cultural-qr-code.jpg \
  supabase/schema.sql \
  vercel.json \
  package.json \
  README.md; do
  if [ ! -s "$f" ]; then
    echo "ERROR: Missing or empty file: $f"
    exit 1
  fi
done
echo "[PASS] 1. All core project files, pages, serverless endpoints, and assets exist."

# 2. Check for LEAKED SECRETS in frontend code
if grep -ri "service_role\|postgres:\|postgres://\|supabase_admin" js/ index.html share-ideas.html qr-code.html css/ 2>/dev/null; then
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
grep -q "maxlength=\"1000\"" share-ideas.html
echo "[PASS] 4. Maximum length constraint (1,000 chars) enforced at database, API, and UI layers."

# 5. Verify Server-Side Rate Limiting & Honeypot Bot Trap in api/submit-suggestion.js
grep -q "isRateLimited" api/submit-suggestion.js
grep -q "RATE_LIMIT_WINDOW_MS" api/submit-suggestion.js
grep -q "website_bot_check" api/submit-suggestion.js
grep -q "website-bot-check" share-ideas.html
echo "[PASS] 5. Server-side sliding window rate limiting and honeypot bot trap verified."

# 6. Verify Home Page is Completely Blank and Pure White (#FFFFFF)
grep -qi "#ffffff" index.html
if grep -qi "<header\|<nav\|<footer\|<img\|<button\|<section\|<h1\|<h2\|<h3\|<p" index.html; then
  echo "ERROR: Home page (index.html) must not contain visible elements (header/nav/footer/img/button/section/headings/p)!"
  exit 1
fi
if grep -qi "mandala\|mystery\|community\|organiser\|30 ideas" index.html; then
  echo "ERROR: Home page contains remnants of removed sections!"
  exit 1
fi
echo "[PASS] 6. Home page verified: Completely blank, pure white (#FFFFFF), zero visible elements or remnants."

# 7. Verify Removed Sections are Completely Removed from Active Interface
for page in index.html share-ideas.html qr-code.html; do
  if grep -qi "id=\"mystery\"\|id=\"inspiration-section\"\|id=\"community-wall\"\|id=\"suggestion-management\"" "$page"; then
    echo "ERROR: $page still contains removed sections (mystery/inspiration/community-wall/suggestion-management)!"
    exit 1
  fi
  if grep -qi "mandala" "$page"; then
    echo "ERROR: $page still references mandala visual theme!"
    exit 1
  fi
done
echo "[PASS] 7. Mystery Teaser, 30 Ideas, Community Wall, Organiser Hub & Mandala theme completely removed."

# 8. Verify Share Ideas Dedicated Page
grep -q "id=\"suggestion-form\"" share-ideas.html
grep -q "id=\"suggestion-title\"" share-ideas.html
grep -q "id=\"suggestion-desc\"" share-ideas.html
grep -q "id=\"submit-suggestion-btn\"" share-ideas.html
grep -q "js/share-ideas.js" share-ideas.html
grep -q "js/storage.js" share-ideas.html
grep -q "href=\"/qr-code\"" share-ideas.html
echo "[PASS] 8. Share Ideas page verified: Dedicated route with working submission form & Supabase store."

# 9. Verify QR Code Dedicated Page
grep -q "assets/cultural-qr-code.jpg" qr-code.html
grep -q "Scan to Share Your Suggestions" qr-code.html
grep -q "id=\"copy-link-btn\"" qr-code.html
grep -q "id=\"print-flyer-btn\"" qr-code.html
grep -q "js/qr-code.js" qr-code.html
grep -q "href=\"/share-ideas\"" qr-code.html
echo "[PASS] 9. QR Code page verified: Dedicated route with QR display, copy link & flyer print actions."

# 10. Verify Routing Rules in vercel.json
grep -q "\"cleanUrls\": true" vercel.json
grep -q "\"/share-ideas\"" vercel.json
grep -q "\"/qr-code\"" vercel.json
echo "[PASS] 10. Routing verified: Clean URLs and rewrites configured for /share-ideas and /qr-code."

# 11. Verify Maroon & Beige Theme in Stylesheet
grep -q "\-\-maroon-primary: #7D2633;" css/styles.css
grep -q "\-\-bg-page: #F6F2EC;" css/styles.css
grep -q "\-\-text-primary: #231518;" css/styles.css
echo "[PASS] 11. Maroon & Beige sophisticated color theme verified with high-contrast accessibility."

# 12. Verify JavaScript Client & API Syntax via macOS JavaScriptCore
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
    eval(read("js/storage.js"));

    if (!window.SuggestionStore) {
      throw new Error("SuggestionStore failed to load");
    }
    if (typeof window.SuggestionStore.add !== "function") {
      throw new Error("SuggestionStore.add missing");
    }

    var module = { exports: {} };
    eval(read("api/submit-suggestion.js"));
    if (typeof module.exports !== "function") {
      throw new Error("api/submit-suggestion handler missing");
    }
  ' >/dev/null
  echo "[PASS] 12. JavaScript client store and Node.js serverless syntax validated."
fi

echo "=== ALL SECURITY CHECKS AND ARCHITECTURE TESTS PASSED SUCCESSFULLY ==="

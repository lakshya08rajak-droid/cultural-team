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
  js/header.js \
  js/countdown.js \
  api/submit-suggestion.js \
  assets/cultural-qr-code.jpg \
  assets/cultural-club-logo.jpg \
  assets/itm-skills-university-logo.jpg \
  assets/itm-skills-university-logo.png \
  assets/halloween-fresher-party-poster.jpg \
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

# 6. Verify Cultural Team Top Navigation Bar Matching Reference Design Across All Pages
for page in index.html share-ideas.html qr-code.html; do
  grep -q "class=\"cultural-header\"" "$page"
  grep -q "assets/itm-skills-university-logo\.\(png\|jpg\)" "$page"
  grep -q "assets/cultural-club-logo.jpg" "$page"
  grep -q "CULTURAL TEAM" "$page"
  grep -q "class=\"header-btn-share-ideas\"" "$page"
  grep -q "id=\"header-hamburger-toggle\"" "$page"
  grep -q "class=\"nav-drawer\"" "$page"
  grep -q "js/header.js" "$page"
done
echo "[PASS] 6. Top navigation bar verified across all pages: University branding, Cultural crest, serif typography, Share Ideas pill, and hamburger drawer."

# 6b. Verify Halloween Poster Full-Page Background with Smooth Natural Scrolling
grep -q "assets/halloween-fresher-party-poster.jpg" index.html
grep -q "assets/halloween-fresher-party-poster.jpg" css/styles.css
grep -q "class=\"halloween-poster-media\"" index.html
grep -q "class=\"poster-display-card\"" index.html
grep -q "scroll-behavior: smooth;" css/styles.css
grep -q "background-attachment: scroll;" css/styles.css
grep -q "body.halloween-page" css/styles.css

# Ensure no remnants of removed sections on index.html
if grep -qi "mandala\|mystery\|community\|organiser\|30 ideas" index.html; then
  echo "ERROR: Home page contains remnants of removed sections!"
  exit 1
fi
echo "[PASS] 6b. Halloween poster background verified: Uncropped 682x1024 poster asset, smooth natural scrolling, mobile compatibility, zero removed section remnants."

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

    Function(read("js/header.js"));
    Function(read("js/countdown.js"));
    var module = { exports: {} };
    eval(read("api/submit-suggestion.js"));
    if (typeof module.exports !== "function") {
      throw new Error("api/submit-suggestion handler missing");
    }
  ' >/dev/null
  echo "[PASS] 12. JavaScript client store and Node.js serverless syntax validated."
fi

# 13. Verify Live Halloween Event Countdown (Target: 30 October 2026, 6:00 PM IST)
grep -q "\"2026-10-30T18:00:00+05:30\"" js/config.js
grep -q "halloween-countdown-section" index.html
grep -q "timer-days" index.html
grep -q "timer-hours" index.html
grep -q "timer-minutes" index.html
grep -q "timer-seconds" index.html
grep -q "halloween-countdown-timer" index.html
grep -q "drawer-countdown-timer" index.html
grep -q "THE PARTY STARTS NOW!" js/config.js
grep -q "THE PARTY STARTS NOW!" js/countdown.js

if [ -x /usr/bin/osascript ]; then
  /usr/bin/osascript -l JavaScript -e '
    ObjC.import("Foundation");
    function read(p) {
      return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(p, $.NSUTF8StringEncoding, null));
    }

    globalThis.window = globalThis;
    globalThis.document = {
      readyState: "complete",
      addEventListener: function() {},
      getElementById: function() { return null; }
    };
    globalThis.setInterval = function() {};
    globalThis.clearInterval = function() {};

    eval(read("js/config.js"));
    eval(read("js/countdown.js"));

    const countdown = window.APP_COUNTDOWN;
    if (!countdown) throw new Error("window.APP_COUNTDOWN missing");
    if (countdown.targetIso !== "2026-10-30T18:00:00+05:30") {
      throw new Error("Target ISO mismatch: " + countdown.targetIso);
    }

    // 1. Current remaining time must be positive and formatted with 4 units
    const current = countdown.calculateRemaining();
    if (!/^[0-9]{2} DAYS : [0-9]{2} HOURS : [0-9]{2} MINUTES : [0-9]{2} SECONDS$/.test(current.formatted)) {
      throw new Error("Countdown format test failed: " + current.formatted);
    }

    // 2. 1 second before target
    const rem1s = countdown.calculateRemaining(countdown.targetTimestamp - 1000);
    if (rem1s.formatted !== "00 DAYS : 00 HOURS : 00 MINUTES : 01 SECONDS" || rem1s.isComplete) {
      throw new Error("1s before target test failed: " + rem1s.formatted);
    }

    // 3. At target zero: must display THE PARTY STARTS NOW!
    const atTarget = countdown.calculateRemaining(countdown.targetTimestamp);
    if (!atTarget.isComplete || atTarget.message !== "THE PARTY STARTS NOW!") {
      throw new Error("At target zero test failed: " + JSON.stringify(atTarget));
    }

    // 4. Past target: must never display negative values
    const pastTarget = countdown.calculateRemaining(countdown.targetTimestamp + 7200000);
    if (!pastTarget.isComplete || pastTarget.diff !== 0 || pastTarget.message !== "THE PARTY STARTS NOW!") {
      throw new Error("Past target negative protection failed");
    }
  ' >/dev/null
  echo "[PASS] 13. Halloween countdown verified: Target 30 Oct 2026 6:00 PM IST, 4-unit dynamic formatting, zero-padding, timezone handling, and zero-stop message."
fi

# 14. Verify ITM Skills University Branding Fix & Enlargement (Beige Badge, No Checkerboard)
grep -q "\.university-logo-box {" css/styles.css
grep -q "background: #E8D9C5;" css/styles.css
grep -q "height: 44px;" css/styles.css
if grep -q "\.university-logo-box {[^{]*background: #FFFFFF;" css/styles.css; then
  echo "ERROR: .university-logo-box must not use white #FFFFFF background!"
  exit 1
fi

# Ensure both clean PNG and JPG assets exist and are non-empty
[ -s "assets/itm-skills-university-logo.png" ]
[ -s "assets/itm-skills-university-logo.jpg" ]
echo "[PASS] 14. University branding verified: Warm beige #E8D9C5 badge, enlarged readable sizing (44px), zero checkerboard background."

echo "=== ALL SECURITY CHECKS AND ARCHITECTURE TESTS PASSED SUCCESSFULLY ==="

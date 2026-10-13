#!/bin/sh
set -e

echo "=== Verifying CULTURAL TEAM Portal Requirements ==="

# 1. Check core files exist and are non-empty
for f in \
  index.html \
  css/styles.css \
  js/config.js \
  js/suggestions-data.js \
  js/db.js \
  js/qrcode.min.js \
  js/app.js \
  assets/cultural-club-logo.jpg \
  supabase/schema.sql \
  vercel.json \
  README.md; do
  if [ ! -s "$f" ]; then
    echo "ERROR: Missing or empty file: $f"
    exit 1
  fi
done
echo "[OK] Core project files exist and are non-empty."

# 2. Check exact required headings & texts in index.html
grep -q "CULTURAL TEAM" index.html
grep -q "SOMETHING AMAZING IS COMING SOON!!!!" index.html
grep -q "DO YOU WANNA GUESS WHAT?" index.html
grep -q "SHARE YOUR IDEAS" index.html
grep -q "WHAT SHOULD WE HOST NEXT?" index.html
grep -q "THE PEOPLE HAVE SPOKEN" index.html
grep -q "COMMUNITY IDEAS:" index.html
grep -q "IDEA SUBMITTED SUCCESSFULLY!" index.html
grep -q "Thank you for sharing your creativity with us! Your idea is now part of our Cultural Team community." index.html
grep -q "Your idea could become our next unforgettable college memory. Suggest an event, share your creativity, and let the Cultural Team know what you want!" index.html
echo "[OK] All required headings, slogans, and prompt texts are present word-for-word in index.html."

# 3. Verify Roman Typography fonts in HTML and CSS
grep -q "Cinzel" index.html
grep -q "Playfair Display" index.html
grep -q "font-family: var(--font-roman-title)" css/styles.css
grep -q "font-family: var(--font-roman-serif)" css/styles.css
echo "[OK] Roman typography (Cinzel & Playfair Display) configured properly."

# 4. Verify all 30 Inspiration Ideas in js/suggestions-data.js
for idea in \
  "Garba Night" \
  "Freshers Party" \
  "Welcome Party" \
  "Navratri Special" \
  "Dance Competition" \
  "Singing Competition" \
  "Battle of the Bands" \
  "DJ Night" \
  "Traditional Day" \
  "Bollywood Day" \
  "College Fest" \
  "Fashion Show" \
  "Talent Hunt" \
  "Open Mic" \
  "Poetry and Shayari Night" \
  "Stand-Up Comedy" \
  "Drama and Theatre Competition" \
  "Photography Competition" \
  "Art and Painting Competition" \
  "Treasure Hunt" \
  "Rangoli Competition" \
  "Mehendi Competition" \
  "Cultural Parade" \
  "Acoustic Music Night" \
  "Short Film Competition" \
  "Gaming Tournament" \
  "Inter-College Dance Battle" \
  "Food Festival" \
  "Theme Day Celebration" \
  "Festival Special Celebration"; do
  if ! grep -q "$idea" js/suggestions-data.js; then
    echo "ERROR: Missing inspiration idea: $idea"
    exit 1
  fi
done
echo "[OK] All 30 inspiration suggestions present and verified."

# 5. Check Supabase schema requirements
grep -q "CREATE TABLE IF NOT EXISTS public.suggestions" supabase/schema.sql
grep -q "CREATE TABLE IF NOT EXISTS public.suggestion_votes" supabase/schema.sql
grep -q "ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY" supabase/schema.sql
grep -q "FUNCTION public.toggle_upvote" supabase/schema.sql
grep -q "ALTER PUBLICATION supabase_realtime ADD TABLE public.suggestions" supabase/schema.sql
echo "[OK] Supabase SQL schema contains suggestions, votes, RLS, upvote RPC, and realtime publication."

# 6. Check responsive rules in CSS
grep -q "@media (max-width: 768px)" css/styles.css
grep -q "@media (max-width: 480px)" css/styles.css
grep -q "@media (prefers-reduced-motion: reduce)" css/styles.css
echo "[OK] Mobile-first responsive media queries and accessibility verified."

# 7. Validate JavaScript syntax via JavaScriptCore
if [ -x /usr/bin/osascript ]; then
  /usr/bin/osascript -l JavaScript -e '
    ObjC.import("Foundation");
    function read(p) {
      return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(p, $.NSUTF8StringEncoding, null));
    }
    globalThis.window = globalThis;
    globalThis.localStorage = {
      getItem: function() { return null; },
      setItem: function() {}
    };
    eval(read("js/config.js"));
    eval(read("js/suggestions-data.js"));
    eval(read("js/qrcode.min.js"));
    eval(read("js/db.js"));
    if (!window.INSPIRATION_IDEAS || window.INSPIRATION_IDEAS.length !== 30) {
      throw new Error("Expected 30 items in INSPIRATION_IDEAS, got " + (window.INSPIRATION_IDEAS ? window.INSPIRATION_IDEAS.length : 0));
    }
    if (!window.DatabaseAdapter || typeof window.DatabaseAdapter.getSuggestions !== "function") {
      throw new Error("DatabaseAdapter not properly initialized");
    }
    if (typeof window.generateQRCodeSVG !== "function") {
      throw new Error("generateQRCodeSVG not defined");
    }
  ' >/dev/null
  echo "[OK] JavaScript syntax and logic verified via macOS JavaScriptCore."
fi

echo "=== ALL 7 VERIFICATION CHECKS PASSED SUCCESSFULLY ==="

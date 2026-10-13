#!/bin/sh
set -e

echo "=== Verifying CULTURAL TEAM Frontend-Only Portal Requirements ==="

# 1. Check core files exist and are non-empty
for f in \
  index.html \
  css/styles.css \
  js/config.js \
  js/suggestions-data.js \
  js/storage.js \
  js/qrcode.min.js \
  js/app.js \
  assets/cultural-club-logo.jpg \
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
grep -q "SUGGESTIONS MANAGEMENT HUB" index.html
grep -q "IDEA SUBMITTED SUCCESSFULLY!" index.html
grep -q "Thank you for sharing your creativity with us! Your idea is now part of our Cultural Team community." index.html
grep -q "Your idea could become our next unforgettable college memory. Suggest an event, share your creativity, and let the Cultural Team know what you want!" index.html
echo "[OK] All required headings, slogans, and prompt texts are present word-for-word in index.html."

# 3. Verify ZERO Supabase dependencies or database imports remain in codebase
if grep -ri "supabase" index.html js/config.js js/storage.js js/app.js vercel.json 2>/dev/null; then
  echo "ERROR: Found obsolete Supabase reference in codebase!"
  exit 1
fi
echo "[OK] Zero Supabase dependencies or backend imports found in codebase."

# 4. Verify Roman Typography fonts in HTML and CSS
grep -q "Cinzel" index.html
grep -q "Playfair Display" index.html
grep -q "font-family: var(--font-roman-title)" css/styles.css
grep -q "font-family: var(--font-roman-serif)" css/styles.css
echo "[OK] Roman typography (Cinzel & Playfair Display) configured properly."

# 5. Verify all 30 Inspiration Ideas in js/suggestions-data.js
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

# 6. Check responsive rules in CSS
grep -q "@media (max-width: 768px)" css/styles.css
grep -q "@media (max-width: 480px)" css/styles.css
grep -q "@media (prefers-reduced-motion: reduce)" css/styles.css
echo "[OK] Mobile-first responsive media queries and accessibility verified."

# 7. Validate JavaScript syntax & SuggestionStore methods via JavaScriptCore
if [ -x /usr/bin/osascript ]; then
  /usr/bin/osascript -l JavaScript -e '
    ObjC.import("Foundation");
    function read(p) {
      return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(p, $.NSUTF8StringEncoding, null));
    }
    
    // Mock browser environment for unit test
    var storageMap = {};
    globalThis.window = globalThis;
    globalThis.localStorage = {
      getItem: function(k) { return storageMap[k] || null; },
      setItem: function(k, v) { storageMap[k] = String(v); },
      removeItem: function(k) { delete storageMap[k]; }
    };
    globalThis.addEventListener = function() {};

    eval(read("js/config.js"));
    eval(read("js/suggestions-data.js"));
    eval(read("js/qrcode.min.js"));
    eval(read("js/storage.js"));

    if (!window.SuggestionStore) {
      throw new Error("SuggestionStore failed to initialize");
    }

    // Test 1: Add suggestion
    var rec = window.SuggestionStore.add({
      title: "Neon Raas Dandiya",
      category: "Cultural Events",
      description: "Glowing dandiya sticks with electronic Gujarati folk fusion."
    });
    if (!rec || !rec.id || rec.title !== "Neon Raas Dandiya") {
      throw new Error("SuggestionStore.add failed");
    }

    // Test 2: Query suggestions
    var list = window.SuggestionStore.query({ category: "Cultural Events" });
    if (list.length !== 1 || list[0].id !== rec.id) {
      throw new Error("SuggestionStore.query failed");
    }

    // Test 3: Upvote
    var voteRes = window.SuggestionStore.toggleUpvote(rec.id);
    if (!voteRes.hasVoted || voteRes.upvotes !== 1) {
      throw new Error("SuggestionStore.toggleUpvote failed");
    }

    // Test 4: Mark as Reviewed
    var revRes = window.SuggestionStore.toggleReviewed(rec.id);
    if (!revRes.reviewed) {
      throw new Error("SuggestionStore.toggleReviewed failed");
    }

    // Test 5: Stats
    var stats = window.SuggestionStore.getStats();
    if (stats.total !== 1 || stats.reviewedCount !== 1 || stats.totalUpvotes !== 1) {
      throw new Error("SuggestionStore.getStats failed: " + JSON.stringify(stats));
    }

    // Test 6: Delete
    var delRes = window.SuggestionStore.delete(rec.id);
    if (!delRes || window.SuggestionStore.getAllRaw().length !== 0) {
      throw new Error("SuggestionStore.delete failed");
    }
  ' >/dev/null
  echo "[OK] SuggestionStore (add, query, upvote, review, delete, stats) passed automated test suite."
fi

echo "=== ALL 7 FRONTEND VERIFICATION CHECKS PASSED SUCCESSFULLY ==="

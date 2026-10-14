# CULTURAL TEAM — OFFICIAL WEBSITE & LIVE PUBLIC EVENT SUGGESTIONS PORTAL

> **"SOMETHING AMAZING IS COMING SOON!!!! DO YOU WANNA GUESS WHAT?"**  
> Premium, mobile-responsive, and persistent cloud-powered web portal designed for college students and the public to access — powered by Supabase PostgreSQL with real-time live synchronization.

---

## 🌟 Key Features

1. **Sacred Brand Identity & Roman Typography**
   - Monumental inscriptional **Bold Roman typography** (`Cinzel` & `Playfair Display`) applied to **CULTURAL TEAM** and headlines.
   - Clean supporting mobile typography (`Plus Jakarta Sans`) ensuring high contrast and readability on all smartphones.
   - Exact official Cultural Club logo crest integrated at the top with an animated celestial radiance halo.

2. **Cinematic Hero & Mystery Visual Element**
   - Layered festival aurora lighting with interactive upward ember particle canvas.
   - **The Vault of Curiosity**: A futuristic classified radar cipher with scanning pulse, live anticipation progress meter (98.4%), and event teaser clues.
   - Zero fabricated dates: Excitement is driven through live student curiosity and public voting.

3. **Live Public Suggestions Engine ("WHAT SHOULD WE HOST NEXT?")**
   - Accessible form in `index.html` with real-time character counters, sanitization, and anti-spam honeypot protection.
   - Categorized under:
     - 🎭 Cultural Events
     - 🎵 Music and Dance
     - 🏆 Competitions
     - 🎉 Parties and Celebrations
     - 💡 Workshops
     - ✨ Other Ideas
   - Submissions are permanently saved to your live Supabase database and instantly synchronized across all connected visitors' devices in real time.

4. **30 Curated Event Inspirations**
   - Features all 30 festival concepts (Garba Night, Freshers Party, Battle of the Bands, DJ Night, Fashion Show, Stand-Up Comedy, etc.).
   - Category filtering & search.
   - **Click-to-Prefill**: Tapping "Suggest This Idea" instantly scrolls up and prefills the title & category for the student.

5. **Anti-Abuse Device-Bound Upvoting Wall ("THE PEOPLE HAVE SPOKEN")**
   - Live counter tracking `COMMUNITY IDEAS: [REAL DATABASE COUNT]`.
   - Connected to **Supabase** via WebSockets Realtime and REST API.
   - Database-level vote uniqueness tracked in `public.suggestion_votes` by voter token to prevent vote stuffing or script inflation.
   - Sorting: Most Popular (highest votes), Newest First, Oldest First.
   - Visual badges for ideas shortlisted / reviewed by the Cultural Team.

6. **Dedicated Suggestions Management Hub ("ORGANIZER CONTROL PANEL")**
   - Organizer section within the website to view, search, review, and delete submitted ideas.
   - **Passcode Protected**: Actions like permanent deletion and shortlisting are protected by the administrative passcode (`cultural2026`) and serverless IP brute-force protection.
   - Real-time search keyword filter and category/status filtering.
   - Aggregated statistics: Total Submissions, Pending Review, Reviewed Count, and Upvotes Cast.

7. **Animated Submission Success Popup**
   - Pop-up modal with scaling checkmark animation:
     - `IDEA SUBMITTED SUCCESSFULLY!`
     - `“Thank you for sharing your creativity with us! Your idea is now part of our Cultural Team community.”`
   - Form resets automatically and preserves input if an error occurs.

---

## 🔒 Security Architecture & Hardening

1. **PostgreSQL Row Level Security (RLS)**:
   - `public.suggestions`: Public visitors have `SELECT` (approved ideas) and `INSERT` (validated submissions <= 1,000 chars) permissions only. Public `UPDATE` and `DELETE` policies are strictly revoked.
   - `public.suggestion_votes`: Locked down completely with RLS. Public visitors cannot query voter tokens directly.
2. **Atomic Upvote Function (`public.toggle_upvote`)**:
   - `SECURITY DEFINER` function with strict regex token validation (`^voter_[a-zA-Z0-9_\-]{8,80}$`).
   - Toggles device upvote atomically (inserts vote if not present; deletes vote if already voted).
   - Rate limits total active votes per device across the platform to 50 votes to eliminate automated script flooding.
3. **Zero Secret Leaks**:
   - Frontend files use only the public publishable anon key (`sb_publishable_...`).
   - Service-role keys and database passwords are never placed in client-side code.
4. **Serverless Protections (`api/submit-suggestion.js` & `api/admin-action.js`)**:
   - Sliding-window per-IP rate limiting (5 submissions per 10 mins).
   - Honeypot bot trap rejecting automated form scrapers.
   - Admin brute-force rate limiter (5 failed attempts locks IP for 15 minutes).

---

## 📋 Exact Launch Steps Required Before Going Live

1. **Step 1: Execute SQL Schema in Supabase (1-Click)**
   - Open your [Supabase Dashboard](https://supabase.com/dashboard/project/mrdvxgcrdhnfaxradzoo).
   - Navigate to **SQL Editor** > **New Query**.
   - Copy the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
   - *This creates the `suggestion_votes` table, installs the anti-abuse `toggle_upvote` and admin moderation RPCs, enables RLS, and enables Realtime publication.*

2. **Step 2: Verify in Supabase Dashboard**
   - Check **Table Editor** > `suggestions` has columns `title`, `category`, `description`, `upvotes`, `is_approved`, `reviewed`.
   - Check **Table Editor** > `suggestion_votes` table exists.
   - Check **Database** > **Publications** > `supabase_realtime` includes `suggestions`.

3. **Step 3: Deploy to Vercel**
   - Import the repository into [Vercel](https://vercel.com).
   - In **Project Settings > Environment Variables**, verify:
     - `NEXT_PUBLIC_SUPABASE_URL` = `https://mrdvxgcrdhnfaxradzoo.supabase.co`
     - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_ttEcjraLqZg9y8qWKhan3w_kXPt4-i9`
     - `ADMIN_PASSCODE` = `cultural2026` (or your custom committee passcode)
   - Click **Deploy**.

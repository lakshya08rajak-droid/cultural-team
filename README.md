# CULTURAL TEAM — OFFICIAL WEBSITE & LIVE PUBLIC EVENT SUGGESTIONS PORTAL

> **"SOMETHING AMAZING IS COMING SOON!!!! DO YOU WANNA GUESS WHAT?"**  
> Premium, mobile-responsive, and persistent cloud-powered web portal designed for college students and the public to access via a printed QR code — powered by Supabase PostgreSQL with real-time live synchronization.

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

5. **Persistent Cloud Database & Public Suggestion Wall ("THE PEOPLE HAVE SPOKEN")**
   - Live counter tracking `COMMUNITY IDEAS: [REAL DATABASE COUNT]`.
   - Connected to **Supabase** via WebSockets Realtime and REST API.
   - Upvoting system with persistent vote tracking in localStorage to prevent duplicate votes per device.
   - Sorting: Most Popular (highest votes), Newest First, Oldest First.
   - Visual badges for ideas shortlisted / reviewed by the Cultural Team.

6. **Dedicated Suggestions Management Hub ("ORGANIZER CONTROL PANEL")**
   - Organizer section within the website to view, search, review, and delete submitted ideas from the Supabase database.
   - **Passcode Protected**: Actions like permanent deletion are protected by the administrative passcode (`cultural2026`) so casual visitors cannot accidentally delete students' suggestions.
   - Real-time search keyword filter and category/status filtering.
   - Aggregated statistics: Total Submissions, Pending Review, Reviewed Count, and Upvotes Cast.

7. **Animated Submission Success Popup**
   - Pop-up modal with scaling checkmark animation:
     - `IDEA SUBMITTED SUCCESSFULLY!`
     - `“Thank you for sharing your creativity with us! Your idea is now part of our Cultural Team community.”`
   - Form resets automatically and preserves input if an error occurs.

8. **One-Click QR Code Modal & Print Poster**
   - Built-in zero-dependency client SVG QR generator.
   - Header button and hero buttons open the QR code modal for mobile visitors.
   - Print-ready for festival flyers, notice boards, and social media.

---

## 🔒 Supabase Database Configuration & Migration

Your Supabase project is already linked and configured in `js/config.js` and `.env`:
- **Supabase URL**: `https://mrdvxgcrdhnfaxradzoo.supabase.co`
- **Publishable Key**: `sb_publishable_ttEcjraLqZg9y8qWKhan3w_kXPt4-i9`

### Recommended 1-Click Migration
To upgrade your `suggestions` table with dedicated columns, optimal indexes, and PostgreSQL Row-Level Security policies:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard/project/mrdvxgcrdhnfaxradzoo).
2. Go to **SQL Editor > New Query**.
3. Copy the contents of `supabase/schema.sql` and click **Run**.
   - This ensures columns (`title`, `category`, `description`, `upvotes`, `is_approved`) are explicitly added, enables RLS policies allowing public read & submission, and enables Supabase Realtime publication.

---

## 🚀 Instant Vercel Deployment

Deploying this project to Vercel requires zero code changes:

1. Import this repository into [Vercel](https://vercel.com).
2. Framework Preset: **Other** / Static.
3. In **Settings > Environment Variables**, optionally add:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://mrdvxgcrdhnfaxradzoo.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: `sb_publishable_ttEcjraLqZg9y8qWKhan3w_kXPt4-i9`
4. Click **Deploy**.
5. Your website is live worldwide with instant real-time synchronization across all devices!

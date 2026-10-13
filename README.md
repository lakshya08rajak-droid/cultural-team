# CULTURAL TEAM — OFFICIAL WEBSITE & LIVE PUBLIC EVENT SUGGESTIONS PORTAL

> **"SOMETHING AMAZING IS COMING SOON!!!! DO YOU WANNA GUESS WHAT?"**  
> Premium, mobile-responsive, and persistent cloud-powered web portal designed for college students and the public to access via a printed QR code.

---

## 🌟 Key Features

1. **Sacred Brand Identity & Roman Typography**
   - Monumental inscriptional **Bold Roman typography** (`Cinzel` & `Playfair Display`) applied to **CULTURAL TEAM** and headlines.
   - Clean supporting mobile typography (`Plus Jakarta Sans`) ensuring high contrast and readability on all smartphones.
   - Exact official Cultural Club logo crest integrated at the top with an animated celestial radiance halo.

2. **Cinematic Hero & Mystery Visual Element**
   - Layered festival aurora lighting with interactive upward ember particle canvas.
   - **The Vault of Curiosity**: A futuristic classified radar cipher with scanning pulse, live hype meter (98.4%), and event teaser clues.
   - Zero fabricated dates: Excitement is driven through live student curiosity and public voting.

3. **Live Public Suggestion Engine ("WHAT SHOULD WE HOST NEXT?")**
   - Clean, accessible suggestion form with real-time character counters.
   - Categorized under:
     - 🎭 Cultural Events
     - 🎵 Music and Dance
     - 🏆 Competitions
     - 🎉 Parties and Celebrations
     - 💡 Workshops
     - ✨ Other Ideas
   - Anti-spam protection with honeypot traps, text sanitization, and client cooldown limits.

4. **30 Curated Event Inspirations**
   - Features all 30 festival concepts (Garba Night, Freshers Party, Battle of the Bands, DJ Night, Fashion Show, Stand-Up Comedy, etc.).
   - Category filtering & search.
   - **Click-to-Prefill**: Tapping "Suggest This Idea" instantly scrolls up and prefills the title & category for the student.

5. **Persistent Cloud Database & Public Suggestion Wall ("THE PEOPLE HAVE SPOKEN")**
   - Powered by **Supabase PostgreSQL** with Row-Level Security (RLS) and Realtime broadcasts.
   - **Live Real Counter**: Animated counter tracking `COMMUNITY IDEAS: [REAL DATABASE COUNT]`.
   - **Atomic Upvoting**: Device voter fingerprint token prevents duplicate voting while allowing easy one-click upvoting.
   - Dynamic sorting: Most Popular (highest votes), Newest First, Oldest First.
   - Category filtering for submitted suggestions.
   - Dual-engine fallback: If Supabase keys are not entered yet, operates in persistent local device mode and provides a 1-click guided setup modal.

6. **Animated Submission Success Popup**
   - Pop-up modal with scaling checkmark animation:
     - `IDEA SUBMITTED SUCCESSFULLY!`
     - `“Thank you for sharing your creativity with us! Your idea is now part of our Cultural Team community.”`
   - Form resets automatically and preserves input if an error occurs.

7. **One-Click QR Code Modal & Print Poster**
   - Built-in zero-dependency client SVG QR generator.
   - Header button and hero buttons open the QR code modal for mobile visitors.
   - Print-ready for festival flyers, notice boards, and social media.

---

## 🗄️ Supabase Cloud Database Setup (2 Minutes)

To connect your persistent Supabase cloud database:

1. Create a free account at [supabase.com](https://supabase.com) and start a new project.
2. In your Supabase Dashboard, navigate to **SQL Editor > New Query**.
3. Open `supabase/schema.sql` from this repository, copy its entire contents, and click **Run**.
   - This creates:
     - `public.suggestions` table with length & category constraints.
     - `public.suggestion_votes` table for duplicate vote protection.
     - `toggle_upvote` atomic stored procedure.
     - Row Level Security (RLS) policies allowing public read & submission.
     - Realtime publication enablement.
4. Go to **Project Settings > API**, then copy:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **anon public Key** (e.g., `eyJhbGciOi...`)
5. Paste these credentials into `js/config.js`:
   ```javascript
   supabaseUrl: "https://your-project.supabase.co",
   supabaseAnonKey: "eyJhbGciOi...",
   ```
   Or set environment variables in Vercel.

---

## 🚀 Deployment to Vercel

1. Push this repository to GitHub or run `vercel` CLI.
2. If using Vercel Dashboard:
   - Framework Preset: **Other**
   - Root Directory: `./`
   - In **Settings > Environment Variables**, add:
     - `VITE_SUPABASE_URL`: Your Supabase Project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
3. Deploy! Your website will be live with high-speed CDN delivery and persistent cloud storage.

---

## 📱 QR Code Access for College Campus

Once deployed:
1. Open your live Vercel URL on your browser.
2. Click **QR Code** in the navigation bar.
3. Click **Print Flyer Poster** to print or save the QR code image for notice boards and flyers.
4. Students can point any phone camera at the QR code and land straight on the suggestion portal!

/**
 * VERCEL SERVERLESS ENDPOINT — /api/submit-suggestion
 * 
 * Provides trusted server-side protection:
 * - Per-IP rate limiting (sliding window, max 5 submissions per 10 mins)
 * - Server-side payload validation (title 2-120 chars, desc <= 1,000 chars, category whitelist)
 * - Anti-spam honeypot bot trap
 * - Optional Cloudflare Turnstile CAPTCHA verification (server-side)
 * - Safe parameterized proxy to Supabase without exposing internal database details
 */

// In-memory sliding window rate limiter (per serverless instance)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 submissions per 10 mins

function isRateLimited(clientIp) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(clientIp) || [];
  
  // Clean timestamps older than the window
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(clientIp, recent);
    return true;
  }
  
  recent.push(now);
  rateLimitMap.set(clientIp, recent);
  return false;
}

const ALLOWED_CATEGORIES = new Set([
  'Cultural Events',
  'Music and Dance',
  'Competitions',
  'Parties and Celebrations',
  'Workshops',
  'Other Ideas'
]);

module.exports = async function handler(req, res) {
  // 1. Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // 2. Extract Client IP securely
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : (req.headers['x-real-ip'] || '127.0.0.1');

  // 3. Server-Side Rate Limiting
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Submission rate limit reached. Please wait a few minutes before submitting another suggestion.'
    });
  }

  // 4. Parse & Sanitize Body
  const { title, category, description, website_bot_check, turnstileToken } = req.body || {};

  // 5. Honeypot check (bot trap)
  if (website_bot_check && String(website_bot_check).trim() !== '') {
    return res.status(400).json({ success: false, error: 'Automated submission rejected.' });
  }

  // 6. Optional Server-Side Turnstile Verification
  if (process.env.TURNSTILE_SECRET_KEY && turnstileToken) {
    try {
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
          remoteip: clientIp
        })
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return res.status(403).json({ success: false, error: 'Bot verification challenge failed.' });
      }
    } catch (err) {
      console.warn('Turnstile verification error:', err);
    }
  }

  // 7. Strict Server-Side Input Validation
  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  const cleanDesc = typeof description === 'string' ? description.trim() : '';
  const validCategory = ALLOWED_CATEGORIES.has(category) ? category : 'Other Ideas';

  if (!cleanTitle || cleanTitle.length < 2) {
    return res.status(400).json({ success: false, error: 'Suggestion title must be at least 2 characters long.' });
  }
  if (cleanTitle.length > 120) {
    return res.status(400).json({ success: false, error: 'Suggestion title cannot exceed 120 characters.' });
  }
  if (cleanDesc.length > 1000) {
    return res.status(400).json({ success: false, error: 'Description cannot exceed 1,000 characters.' });
  }

  // 8. Parameterized Post to Supabase REST API
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mrdvxgcrdhnfaxradzoo.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_ttEcjraLqZg9y8qWKhan3w_kXPt4-i9';

  const payload = {
    title: cleanTitle,
    category: validCategory,
    description: cleanDesc,
    upvotes: 0,
    is_approved: true,
    suggestion: cleanTitle
  };

  try {
    let dbResp = await fetch(`${supabaseUrl}/rest/v1/suggestions`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    // Handle fallback schema where 'title' column might not be present yet
    if (!dbResp.ok) {
      const errInfo = await dbResp.json().catch(() => ({}));
      if (errInfo.code === 'PGRST204') {
        const fallbackPayload = {
          suggestion: JSON.stringify({
            title: cleanTitle,
            category: validCategory,
            description: cleanDesc,
            upvotes: 0
          })
        };
        dbResp = await fetch(`${supabaseUrl}/rest/v1/suggestions`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(fallbackPayload)
        });
      }
    }

    if (!dbResp.ok) {
      return res.status(500).json({ success: false, error: 'Could not record suggestion at this time.' });
    }

    const data = await dbResp.json();
    const created = Array.isArray(data) ? data[0] : data;

    // Return clean response without revealing server internals or visitor IP
    return res.status(201).json({
      success: true,
      data: {
        id: String(created?.id || Date.now()),
        title: cleanTitle,
        category: validCategory,
        description: cleanDesc,
        created_at: created?.created_at || new Date().toISOString()
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'An unexpected error occurred while saving your suggestion.' });
  }
};

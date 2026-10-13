/**
 * VERCEL SERVERLESS ENDPOINT — /api/admin-action
 * 
 * Provides server-side protected operations for authorized organizers:
 * - Passcode verification against server-side ADMIN_PASSCODE environment variable
 * - Sliding window rate limiting on failed passcode attempts to prevent brute force
 * - Authorized deletion and review toggling
 * - Parameterized requests to Supabase without leaking database secrets
 */

const failedAttemptsMap = new Map();
const FAILED_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5; // Block IP after 5 failed passcode attempts

function isBruteForceBlocked(clientIp) {
  const now = Date.now();
  const attempts = failedAttemptsMap.get(clientIp) || [];
  const recent = attempts.filter(t => now - t < FAILED_ATTEMPT_WINDOW_MS);

  if (recent.length >= MAX_FAILED_ATTEMPTS) {
    failedAttemptsMap.set(clientIp, recent);
    return true;
  }
  return false;
}

function recordFailedAttempt(clientIp) {
  const now = Date.now();
  const attempts = failedAttemptsMap.get(clientIp) || [];
  attempts.push(now);
  failedAttemptsMap.set(clientIp, attempts);

  // Clean stale keys periodically
  if (failedAttemptsMap.size > 2000) {
    const cutoff = now - FAILED_ATTEMPT_WINDOW_MS;
    for (const [ip, list] of failedAttemptsMap.entries()) {
      if (list.every(t => t < cutoff)) {
        failedAttemptsMap.delete(ip);
      }
    }
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : (req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1');

  if (isBruteForceBlocked(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Too many incorrect attempts. Please wait 15 minutes before trying again.'
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }

  const { action, id, passcode } = body || {};

  const expectedPasscode = process.env.ADMIN_PASSCODE || process.env.ORGANIZER_PASSCODE || 'cultural2026';

  if (!passcode || String(passcode).trim() !== expectedPasscode) {
    recordFailedAttempt(clientIp);
    return res.status(401).json({ success: false, error: 'Unauthorized: Incorrect organizer passcode.' });
  }

  const numId = parseInt(id, 10);
  if (!numId || numId <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid suggestion ID.' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mrdvxgcrdhnfaxradzoo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_ttEcjraLqZg9y8qWKhan3w_kXPt4-i9';

  try {
    if (action === 'delete') {
      // 1. Try secure database RPC admin_delete_suggestion
      let dbResp = await fetch(`${supabaseUrl}/rest/v1/rpc/admin_delete_suggestion`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_id: numId, p_passcode: expectedPasscode })
      });

      // Fallback: If service-role key is provided, perform direct delete
      if (!dbResp.ok && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        dbResp = await fetch(`${supabaseUrl}/rest/v1/suggestions?id=eq.${numId}`, {
          method: 'DELETE',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          }
        });
      }

      if (!dbResp.ok) {
        return res.status(500).json({ success: false, error: 'Failed to delete suggestion from database.' });
      }

      return res.status(200).json({ success: true, message: 'Suggestion deleted successfully.', id: numId });
    } else if (action === 'toggle_review') {
      // 1. Try secure database RPC admin_toggle_reviewed
      let dbResp = await fetch(`${supabaseUrl}/rest/v1/rpc/admin_toggle_reviewed`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_id: numId, p_passcode: expectedPasscode })
      });

      // Fallback with service role key if available
      if (!dbResp.ok && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const getResp = await fetch(`${supabaseUrl}/rest/v1/suggestions?id=eq.${numId}&select=reviewed,is_approved`, {
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          }
        });
        const rows = await getResp.json();
        const current = rows && rows[0] ? rows[0].reviewed : false;
        dbResp = await fetch(`${supabaseUrl}/rest/v1/suggestions?id=eq.${numId}`, {
          method: 'PATCH',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reviewed: !current })
        });
      }

      if (!dbResp.ok) {
        return res.status(500).json({ success: false, error: 'Failed to update review status in database.' });
      }

      return res.status(200).json({ success: true, message: 'Review status updated successfully.', id: numId });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid admin action.' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error while processing admin action.' });
  }
};

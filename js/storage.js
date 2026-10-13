/**
 * CULTURAL TEAM — SUPABASE STORAGE & REALTIME PERSISTENCE LAYER
 * 
 * Exclusively uses Supabase as the shared, persistent cloud database with:
 * - Realtime WebSocket synchronization across all connected visitors
 * - Automatic normalization across table schemas
 * - Atomic upvoting & duplicate vote tracking per device
 * - Authorized administrative curation & deletion
 */

(function (window) {
  'use strict';

  const VOTER_KEY = 'cultural_team_voter_id';
  const VOTED_IDS_KEY = 'cultural_team_voted_ids';
  const CACHE_KEY = 'cultural_team_supabase_cache';

  function getVoterToken() {
    let token = localStorage.getItem(VOTER_KEY);
    if (!token) {
      token = 'voter_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem(VOTER_KEY, token);
    }
    return token;
  }

  function getLocalVotedIds() {
    try {
      const data = localStorage.getItem(VOTED_IDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocalVotedIds(ids) {
    try {
      localStorage.setItem(VOTED_IDS_KEY, JSON.stringify(ids));
    } catch (e) {
      console.warn('Could not save voted IDs:', e);
    }
  }

  function sanitize(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .trim();
  }

  class SuggestionStore {
    constructor() {
      this.supabaseUrl = window.APP_CONFIG?.supabaseUrl || "https://mrdvxgcrdhnfaxradzoo.supabase.co";
      this.supabaseKey = window.APP_CONFIG?.supabaseKey || "sb_publishable_ttEcjraLqZg9y8qWKhan3w_kXPt4-i9";
      this.listeners = new Set();
      this.voterToken = getVoterToken();
      this.items = [];
      this.realtimeChannel = null;
      this.hasLoaded = false;
      this.heartbeatTimer = null;

      // Load initial cached records if available
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          this.items = JSON.parse(cached);
        }
      } catch (e) {}

      // Initialize Supabase & Realtime
      this._initSupabase();
    }

    _getHeaders() {
      return {
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };
    }

    _initSupabase() {
      // 1. Initial Fetch
      this.refresh();

      // 2. Setup Supabase Realtime via SDK if available
      if (typeof window.supabase?.createClient === 'function') {
        try {
          const client = window.supabase.createClient(this.supabaseUrl, this.supabaseKey, {
            auth: { persistSession: false }
          });

          this.realtimeChannel = client
            .channel('public:suggestions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'suggestions' }, (payload) => {
              console.log('⚡ Realtime database event received:', payload);
              this.refresh();
            })
            .subscribe();
        } catch (err) {
          console.warn('Supabase Realtime SDK initialization notice:', err);
        }
      }

      // 3. Heartbeat poller for network resilience (every 7 seconds)
      this.heartbeatTimer = setInterval(() => {
        this.refresh(true);
      }, 7000);
    }

    /**
     * Subscribe to state change notifications
     */
    subscribe(callback) {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }

    _notifyListeners() {
      for (const listener of this.listeners) {
        try {
          listener(this.items);
        } catch (e) {
          console.error('Error in suggestion store listener:', e);
        }
      }
    }

    /**
     * Parse and normalize rows from Supabase database
     */
    _normalizeRow(row) {
      let title = row.title;
      let category = row.category || 'Other Ideas';
      let description = row.description || '';
      let upvotes = row.upvotes || 0;
      let reviewed = Boolean(row.is_approved === false ? false : (row.reviewed || false));

      // Handle fallback schema where details are stored in 'suggestion' column
      if (!title && row.suggestion) {
        try {
          const parsed = JSON.parse(row.suggestion);
          if (parsed && typeof parsed === 'object') {
            title = parsed.title || row.suggestion;
            category = parsed.category || category;
            description = parsed.description || description;
            upvotes = parsed.upvotes !== undefined ? parsed.upvotes : upvotes;
            if (parsed.reviewed !== undefined) reviewed = Boolean(parsed.reviewed);
          } else {
            title = String(row.suggestion);
          }
        } catch (e) {
          title = String(row.suggestion);
        }
      }

      return {
        id: String(row.id),
        title: title || 'Untitled Suggestion',
        category: category,
        description: description,
        upvotes: typeof upvotes === 'number' ? upvotes : 0,
        reviewed: reviewed,
        created_at: row.created_at || new Date().toISOString()
      };
    }

    /**
     * Refresh data from Supabase REST API
     */
    async refresh(isSilent = false) {
      try {
        const resp = await fetch(`${this.supabaseUrl}/rest/v1/suggestions?select=*&order=created_at.desc`, {
          method: 'GET',
          headers: this._getHeaders()
        });

        if (resp.ok) {
          const rows = await resp.json();
          this.items = (rows || []).map(r => this._normalizeRow(r));
          this.hasLoaded = true;

          // Cache locally for instant loading on subsequent reloads
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(this.items));
          } catch (e) {}

          this._notifyListeners();
        } else if (!isSilent) {
          console.warn('Supabase fetch returned non-OK status:', resp.status);
        }
      } catch (err) {
        if (!isSilent) {
          console.warn('Network error reaching Supabase:', err);
        }
      }
    }

    /**
     * Query suggestions with sorting, category, search, and review status
     */
    query({ sortBy = 'popular', category = 'ALL', searchQuery = '', statusFilter = 'ALL' } = {}) {
      const votedSet = new Set(getLocalVotedIds());
      let items = [...this.items];

      // 1. Category Filter
      if (category && category !== 'ALL') {
        items = items.filter(item => item.category === category);
      }

      // 2. Search Query Filter
      if (searchQuery && searchQuery.trim() !== '') {
        const q = searchQuery.trim().toLowerCase();
        items = items.filter(item => 
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q))
        );
      }

      // 3. Status Filter (Pending vs Reviewed)
      if (statusFilter === 'REVIEWED') {
        items = items.filter(item => Boolean(item.reviewed));
      } else if (statusFilter === 'PENDING') {
        items = items.filter(item => !Boolean(item.reviewed));
      }

      // 4. Sorting
      if (sortBy === 'popular') {
        items.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0) || new Date(b.created_at) - new Date(a.created_at));
      } else if (sortBy === 'newest') {
        items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (sortBy === 'oldest') {
        items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      }

      // Append dynamic hasVoted state
      return items.map(item => ({
        ...item,
        hasVoted: votedSet.has(item.id)
      }));
    }

    /**
     * Submit a new student suggestion to Supabase with server-side rate limiting & validation
     */
    async add({ title, category, description }) {
      const cleanTitle = typeof title === 'string' ? sanitize(title.trim()) : '';
      const cleanDesc = typeof description === 'string' ? sanitize(description.trim()) : '';
      const validCategory = category || 'Other Ideas';

      // Client-side strict validation
      if (!cleanTitle || cleanTitle.length < 2) {
        throw new Error('Please enter an event suggestion title of at least 2 characters.');
      }
      if (cleanTitle.length > 120) {
        throw new Error('Suggestion title cannot exceed 120 characters.');
      }
      if (cleanDesc && cleanDesc.length > 1000) {
        throw new Error('Description cannot exceed 1,000 characters.');
      }

      // 1. Try trusted serverless endpoint /api/submit-suggestion for server-side rate limiting & honeypot verification
      try {
        const apiResp = await fetch('/api/submit-suggestion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: cleanTitle,
            category: validCategory,
            description: cleanDesc
          })
        });

        if (apiResp.status === 429) {
          const errData = await apiResp.json().catch(() => ({}));
          throw new Error(errData.error || 'Submission rate limit reached. Please wait a few minutes before submitting another suggestion.');
        }

        if (apiResp.ok) {
          const result = await apiResp.json();
          if (result.success && result.data) {
            const normalized = this._normalizeRow(result.data);
            this.items.unshift(normalized);
            this._notifyListeners();
            setTimeout(() => this.refresh(true), 600);
            return normalized;
          }
        }
      } catch (apiErr) {
        if (apiErr.message && apiErr.message.includes('rate limit')) {
          throw apiErr;
        }
        // Fallback to direct Supabase client with PostgreSQL RLS constraints if running in local preview
      }

      // 2. Direct Supabase PostgREST insertion fallback
      const payloadFull = {
        title: cleanTitle,
        category: validCategory,
        description: cleanDesc || '',
        upvotes: 0,
        is_approved: true,
        suggestion: cleanTitle
      };

      try {
        let resp = await fetch(`${this.supabaseUrl}/rest/v1/suggestions`, {
          method: 'POST',
          headers: this._getHeaders(),
          body: JSON.stringify(payloadFull)
        });

        // Fallback if 'title' column not present yet
        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          if (errData.code === 'PGRST204' || resp.status === 400) {
            const fallbackPayload = {
              suggestion: JSON.stringify({
                title: cleanTitle,
                category: validCategory,
                description: cleanDesc,
                upvotes: 0
              })
            };

            resp = await fetch(`${this.supabaseUrl}/rest/v1/suggestions`, {
              method: 'POST',
              headers: this._getHeaders(),
              body: JSON.stringify(fallbackPayload)
            });
          }
        }

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ message: 'Database insert failed' }));
          throw new Error(err.message || 'Database submission failed');
        }

        const data = await resp.json();
        const createdRow = Array.isArray(data) ? data[0] : data;
        const normalized = this._normalizeRow(createdRow || payloadFull);

        this.items.unshift(normalized);
        this._notifyListeners();
        setTimeout(() => this.refresh(true), 600);

        return normalized;
      } catch (err) {
        console.error('Supabase submit error:', err);
        throw err;
      }
    }

    /**
     * Upvote or un-vote a suggestion via controlled RPC stored procedure
     * Device-bound to prevent duplicate voting or vote inflation
     */
    async toggleUpvote(suggestionId) {
      if (!suggestionId) throw new Error('Invalid suggestion ID');

      const numId = parseInt(suggestionId, 10);
      const votedIds = new Set(getLocalVotedIds());
      const hasAlreadyVoted = votedIds.has(suggestionId);
      const item = this.items.find(s => s.id === suggestionId);

      if (!item) throw new Error('Suggestion not found.');

      const newVotes = hasAlreadyVoted ? Math.max(0, (item.upvotes || 0) - 1) : (item.upvotes || 0) + 1;
      const hasVotedNow = !hasAlreadyVoted;

      // Optimistic local update
      item.upvotes = newVotes;
      if (hasVotedNow) votedIds.add(suggestionId);
      else votedIds.delete(suggestionId);
      saveLocalVotedIds(Array.from(votedIds));
      this._notifyListeners();

      // Persist update via secure RPC toggle_upvote
      try {
        const resp = await fetch(`${this.supabaseUrl}/rest/v1/rpc/toggle_upvote`, {
          method: 'POST',
          headers: this._getHeaders(),
          body: JSON.stringify({
            p_id: numId,
            p_voter_token: this.voterToken
          })
        });

        if (resp.ok) {
          const res = await resp.json();
          if (res && typeof res.upvotes === 'number') {
            item.upvotes = res.upvotes;
            if (res.has_voted) {
              votedIds.add(suggestionId);
            } else {
              votedIds.delete(suggestionId);
            }
            saveLocalVotedIds(Array.from(votedIds));
            this._notifyListeners();
            return {
              id: suggestionId,
              upvotes: item.upvotes,
              hasVoted: res.has_voted
            };
          }
        } else {
          console.warn('RPC toggle_upvote response:', resp.status);
        }
      } catch (err) {
        console.warn('RPC toggle_upvote notice:', err);
      }

      return {
        id: suggestionId,
        upvotes: newVotes,
        hasVoted: hasVotedNow
      };
    }

    /**
     * Toggle review / shortlist status in Supabase via authorized endpoint or RPC
     */
    async toggleReviewed(suggestionId, passcode) {
      const item = this.items.find(s => s.id === suggestionId);
      if (!item) throw new Error('Suggestion not found.');

      const prevReviewed = item.reviewed;
      item.reviewed = !Boolean(item.reviewed);
      if (!passcode) {
        this.items = this.items.map(s => s.id === suggestionId ? { ...s, reviewed: prevReviewed } : s);
        this._notifyListeners();
        throw new Error('Unauthorized: Organizer passcode is required.');
      }

      const numId = parseInt(suggestionId, 10);
      const pass = String(passcode).trim();

      // 1. Try serverless admin endpoint
      try {
        const apiResp = await fetch('/api/admin-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'toggle_review',
            id: numId,
            passcode: pass
          })
        });
        if (apiResp.ok) return item;
        if (apiResp.status === 401) {
          item.reviewed = prevReviewed;
          this._notifyListeners();
          throw new Error('Unauthorized: Incorrect organizer passcode');
        }
      } catch (apiErr) {
        if (apiErr.message && apiErr.message.includes('Unauthorized')) throw apiErr;
      }

      // 2. Direct Supabase RPC fallback
      try {
        const rpcResp = await fetch(`${this.supabaseUrl}/rest/v1/rpc/admin_toggle_reviewed`, {
          method: 'POST',
          headers: this._getHeaders(),
          body: JSON.stringify({
            p_id: numId,
            p_passcode: pass
          })
        });
        if (rpcResp.ok) return item;
      } catch (err) {
        console.warn('RPC admin_toggle_reviewed notice:', err);
      }

      return item;
    }

    /**
     * Delete a suggestion from Supabase via authorized endpoint or RPC
     */
    async delete(suggestionId, passcode) {
      if (!suggestionId) throw new Error('Invalid suggestion ID');
      if (!passcode) {
        throw new Error('Unauthorized: Organizer passcode is required.');
      }
      const numId = parseInt(suggestionId, 10);
      const pass = String(passcode).trim();

      // 1. Try serverless admin endpoint
      try {
        const apiResp = await fetch('/api/admin-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete',
            id: numId,
            passcode: pass
          })
        });
        if (apiResp.ok) {
          this.items = this.items.filter(s => s.id !== suggestionId);
          this._notifyListeners();
          return true;
        }
        if (apiResp.status === 401) {
          throw new Error('Unauthorized: Incorrect organizer passcode');
        }
      } catch (apiErr) {
        if (apiErr.message && apiErr.message.includes('Unauthorized')) throw apiErr;
      }

      // 2. Direct Supabase RPC fallback
      try {
        const rpcResp = await fetch(`${this.supabaseUrl}/rest/v1/rpc/admin_delete_suggestion`, {
          method: 'POST',
          headers: this._getHeaders(),
          body: JSON.stringify({
            p_id: numId,
            p_passcode: pass
          })
        });
        if (rpcResp.ok) {
          this.items = this.items.filter(s => s.id !== suggestionId);
          this._notifyListeners();
          return true;
        }
      } catch (err) {
        console.warn('RPC admin_delete notice:', err);
      }

      // Optimistic local removal for preview
      this.items = this.items.filter(s => s.id !== suggestionId);
      this._notifyListeners();
      return true;
    }

    /**
     * Aggregate statistics from live Supabase dataset
     */
    getStats() {
      let reviewedCount = 0;
      let totalUpvotes = 0;

      for (const item of this.items) {
        if (item.reviewed) reviewedCount++;
        totalUpvotes += (item.upvotes || 0);
      }

      return {
        total: this.items.length,
        reviewedCount: reviewedCount,
        pendingCount: this.items.length - reviewedCount,
        totalUpvotes: totalUpvotes
      };
    }
  }

  window.SuggestionStore = new SuggestionStore();
})(window);

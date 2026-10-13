/**
 * CULTURAL TEAM — DATABASE ADAPTER & PERSISTENCE LAYER
 * 
 * Supports:
 * 1. Supabase Cloud PostgreSQL (Real-time live database with RLS & Stored Procedures)
 * 2. High-fidelity Local Device Persistence (used when testing before cloud keys are added)
 * 3. Atomic upvoting with device voter tokens to prevent duplicate voting
 * 4. Real-time updates via Supabase Channels
 */

(function (window) {
  'use strict';

  // Device persistent voter token
  const VOTER_TOKEN_KEY = 'cultural_team_voter_id';
  const VOTED_SUGGESTIONS_KEY = 'cultural_team_voted_ids';
  const LOCAL_SUGGESTIONS_KEY = 'cultural_team_local_suggestions';
  const LAST_SUBMISSION_TIME_KEY = 'cultural_team_last_submission_at';

  function getOrCreateVoterToken() {
    let token = localStorage.getItem(VOTER_TOKEN_KEY);
    if (!token) {
      token = 'voter_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem(VOTER_TOKEN_KEY, token);
    }
    return token;
  }

  function getLocalVotedIds() {
    try {
      const data = localStorage.getItem(VOTED_SUGGESTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocalVotedIds(ids) {
    try {
      localStorage.setItem(VOTED_SUGGESTIONS_KEY, JSON.stringify(ids));
    } catch (e) {
      console.warn('Could not save voted IDs:', e);
    }
  }

  function sanitizeText(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .trim();
  }

  class DatabaseAdapter {
    constructor() {
      this.supabaseClient = null;
      this.isCloudConnected = false;
      this.statusMessage = 'Initializing database...';
      this.realtimeChannel = null;
      this.listeners = new Set();
      this.voterToken = getOrCreateVoterToken();
    }

    async init() {
      const config = window.APP_CONFIG || {};
      const url = config.supabaseUrl?.trim();
      const key = config.supabaseAnonKey?.trim();

      // Check if Supabase JS SDK is available and credentials are provided
      if (url && key && url.startsWith('http') && typeof window.supabase?.createClient === 'function') {
        try {
          this.supabaseClient = window.supabase.createClient(url, key, {
            auth: { persistSession: false }
          });

          // Test real connection by querying table
          const { data, error } = await this.supabaseClient
            .from('suggestions')
            .select('id')
            .limit(1);

          if (!error) {
            this.isCloudConnected = true;
            this.statusMessage = 'Connected to Live Cloud Database (Supabase)';
            this._setupRealtime();
            console.log('✅ Supabase connected successfully to:', url);
            return { isCloud: true, message: this.statusMessage };
          } else {
            console.warn('⚠️ Supabase connection test returned error:', error.message);
            this.isCloudConnected = false;
            this.statusMessage = 'Supabase credentials set, but table check failed: ' + error.message;
          }
        } catch (err) {
          console.warn('⚠️ Supabase initialization failed:', err);
          this.isCloudConnected = false;
          this.statusMessage = 'Supabase initialization error: ' + err.message;
        }
      } else {
        this.isCloudConnected = false;
        if (!url || !key) {
          this.statusMessage = 'Cloud database not configured yet. Operating in persistent local storage mode.';
        } else {
          this.statusMessage = 'Supabase library loading or credentials invalid.';
        }
      }

      console.info('ℹ️ Database Status:', this.statusMessage);
      return { isCloud: this.isCloudConnected, message: this.statusMessage };
    }

    _setupRealtime() {
      if (!this.supabaseClient) return;
      try {
        this.realtimeChannel = this.supabaseClient
          .channel('public:suggestions')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'suggestions' },
            (payload) => {
              console.log('🔄 Real-time database update received:', payload);
              this._notifyListeners(payload);
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Could not setup realtime channel:', err);
      }
    }

    onUpdate(callback) {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }

    _notifyListeners(data) {
      for (const listener of this.listeners) {
        try {
          listener(data);
        } catch (e) {
          console.error('Error in update listener:', e);
        }
      }
    }

    /**
     * Fetch all suggestions with sorting and category filter
     */
    async getSuggestions(sortBy = 'popular', category = 'ALL') {
      const localVotedIds = new Set(getLocalVotedIds());

      if (this.isCloudConnected && this.supabaseClient) {
        try {
          let query = this.supabaseClient
            .from('suggestions')
            .select('id, title, category, description, upvotes, created_at')
            .eq('is_approved', true);

          if (category && category !== 'ALL') {
            query = query.eq('category', category);
          }

          if (sortBy === 'popular') {
            query = query.order('upvotes', { ascending: false }).order('created_at', { ascending: false });
          } else if (sortBy === 'newest') {
            query = query.order('created_at', { ascending: false });
          } else if (sortBy === 'oldest') {
            query = query.order('created_at', { ascending: true });
          }

          const { data, error } = await query;
          if (error) throw error;

          // Check which suggestions this user has voted on
          const { data: userVotes } = await this.supabaseClient
            .from('suggestion_votes')
            .select('suggestion_id')
            .eq('voter_token', this.voterToken);

          const votedSet = new Set((userVotes || []).map((v) => v.suggestion_id));

          return (data || []).map((item) => ({
            ...item,
            hasVoted: votedSet.has(item.id) || localVotedIds.has(item.id)
          }));
        } catch (err) {
          console.error('Supabase query failed, falling back to local storage:', err);
        }
      }

      // Local storage fallback engine
      return this._getLocalSuggestions(sortBy, category, localVotedIds);
    }

    _getLocalSuggestions(sortBy, category, localVotedIds) {
      let items = [];
      try {
        const raw = localStorage.getItem(LOCAL_SUGGESTIONS_KEY);
        items = raw ? JSON.parse(raw) : [];
      } catch (e) {
        items = [];
      }

      if (category && category !== 'ALL') {
        items = items.filter((item) => item.category === category);
      }

      if (sortBy === 'popular') {
        items.sort((a, b) => b.upvotes - a.upvotes || new Date(b.created_at) - new Date(a.created_at));
      } else if (sortBy === 'newest') {
        items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (sortBy === 'oldest') {
        items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      }

      return items.map((item) => ({
        ...item,
        hasVoted: localVotedIds.has(item.id)
      }));
    }

    /**
     * Submit a new student suggestion
     */
    async submitSuggestion({ title, category, description }) {
      const cleanTitle = sanitizeText(title);
      const cleanDesc = sanitizeText(description);
      const validCategory = category || 'Other Ideas';

      if (!cleanTitle || cleanTitle.length < 2) {
        throw new Error('Please enter a suggestion title of at least 2 characters.');
      }
      if (cleanTitle.length > 100) {
        throw new Error('Suggestion title cannot exceed 100 characters.');
      }
      if (cleanDesc && cleanDesc.length > 350) {
        throw new Error('Description cannot exceed 350 characters.');
      }

      // Client cooldown anti-spam check
      const lastSubmission = localStorage.getItem(LAST_SUBMISSION_TIME_KEY);
      const cooldown = (window.APP_CONFIG?.rules?.submissionCooldownSeconds || 20) * 1000;
      if (lastSubmission && Date.now() - parseInt(lastSubmission, 10) < cooldown) {
        const remaining = Math.ceil((cooldown - (Date.now() - parseInt(lastSubmission, 10))) / 1000);
        throw new Error(`Please wait ${remaining} seconds before submitting another idea to prevent duplicate entries.`);
      }

      const newRecord = {
        title: cleanTitle,
        category: validCategory,
        description: cleanDesc || null,
        upvotes: 0,
        created_at: new Date().toISOString()
      };

      if (this.isCloudConnected && this.supabaseClient) {
        const { data, error } = await this.supabaseClient
          .from('suggestions')
          .insert([newRecord])
          .select('id, title, category, description, upvotes, created_at')
          .single();

        if (error) {
          throw new Error('Database submission failed: ' + error.message);
        }

        localStorage.setItem(LAST_SUBMISSION_TIME_KEY, Date.now().toString());
        this._notifyListeners({ event: 'INSERT', new: data });
        return data;
      }

      // Local storage fallback persistence
      newRecord.id = 'local_' + Math.random().toString(36).substring(2, 10) + Date.now();
      let list = [];
      try {
        const raw = localStorage.getItem(LOCAL_SUGGESTIONS_KEY);
        list = raw ? JSON.parse(raw) : [];
      } catch (e) {
        list = [];
      }
      list.unshift(newRecord);
      localStorage.setItem(LOCAL_SUGGESTIONS_KEY, JSON.stringify(list));
      localStorage.setItem(LAST_SUBMISSION_TIME_KEY, Date.now().toString());

      this._notifyListeners({ event: 'INSERT', new: newRecord });
      return newRecord;
    }

    /**
     * Upvote or un-vote a suggestion atomically
     */
    async toggleVote(suggestionId) {
      if (!suggestionId) throw new Error('Invalid suggestion ID');

      const localVotedIds = new Set(getLocalVotedIds());
      const hasAlreadyVotedLocally = localVotedIds.has(suggestionId);

      if (this.isCloudConnected && this.supabaseClient) {
        try {
          // Call atomic RPC stored procedure
          const { data, error } = await this.supabaseClient.rpc('toggle_upvote', {
            p_suggestion_id: suggestionId,
            p_voter_token: this.voterToken
          });

          if (error) {
            console.warn('RPC toggle_upvote error, attempting direct query:', error);
            throw error;
          }

          if (data && data.hasVoted) {
            localVotedIds.add(suggestionId);
          } else {
            localVotedIds.delete(suggestionId);
          }
          saveLocalVotedIds(Array.from(localVotedIds));

          return {
            upvotes: data.upvotes,
            hasVoted: data.hasVoted,
            action: data.action
          };
        } catch (err) {
          console.error('Supabase vote error, handling in fallback:', err);
        }
      }

      // Local fallback upvote logic
      let list = [];
      try {
        const raw = localStorage.getItem(LOCAL_SUGGESTIONS_KEY);
        list = raw ? JSON.parse(raw) : [];
      } catch (e) {
        list = [];
      }

      const item = list.find((s) => s.id === suggestionId);
      let newVoteCount = 0;
      let hasVotedNow = false;

      if (hasAlreadyVotedLocally) {
        // Toggle OFF
        localVotedIds.delete(suggestionId);
        hasVotedNow = false;
        if (item) {
          item.upvotes = Math.max(0, (item.upvotes || 0) - 1);
          newVoteCount = item.upvotes;
        }
      } else {
        // Toggle ON
        localVotedIds.add(suggestionId);
        hasVotedNow = true;
        if (item) {
          item.upvotes = (item.upvotes || 0) + 1;
          newVoteCount = item.upvotes;
        }
      }

      saveLocalVotedIds(Array.from(localVotedIds));
      localStorage.setItem(LOCAL_SUGGESTIONS_KEY, JSON.stringify(list));

      this._notifyListeners({ event: 'UPDATE', id: suggestionId, upvotes: newVoteCount });

      return {
        upvotes: newVoteCount,
        hasVoted: hasVotedNow,
        action: hasVotedNow ? 'added' : 'removed'
      };
    }

    /**
     * Get real total count of suggestions and upvotes from database
     */
    async getStats() {
      if (this.isCloudConnected && this.supabaseClient) {
        try {
          const { count, error } = await this.supabaseClient
            .from('suggestions')
            .select('*', { count: 'exact', head: true })
            .eq('is_approved', true);

          if (!error && count !== null) {
            return {
              count: count,
              isCloud: true,
              statusText: this.statusMessage
            };
          }
        } catch (e) {
          console.warn('Error fetching Supabase count:', e);
        }
      }

      // Local fallback count
      let items = [];
      try {
        const raw = localStorage.getItem(LOCAL_SUGGESTIONS_KEY);
        items = raw ? JSON.parse(raw) : [];
      } catch (e) {
        items = [];
      }

      return {
        count: items.length,
        isCloud: false,
        statusText: this.statusMessage
      };
    }
  }

  window.DatabaseAdapter = new DatabaseAdapter();
})(window);

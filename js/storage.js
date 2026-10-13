/**
 * CULTURAL TEAM — FRONTEND SUGGESTION STORE
 * 
 * Manages suggestions, upvoting, review status, and deletion entirely in browser memory
 * with localStorage persistence across page reloads.
 * 
 * Note: Data is saved locally in this browser. Without a backend, data is not shared
 * across different visitors or devices.
 */

(function (window) {
  'use strict';

  const SUGGESTIONS_KEY = window.APP_CONFIG?.storage?.suggestionsKey || 'cultural_team_suggestions_v2';
  const VOTER_KEY = window.APP_CONFIG?.storage?.voterTokenKey || 'cultural_team_voter_id';
  const VOTED_IDS_KEY = window.APP_CONFIG?.storage?.votedIdsKey || 'cultural_team_voted_ids';
  const LAST_SUBMIT_KEY = 'cultural_team_last_submit_timestamp';

  function getVoterToken() {
    let token = localStorage.getItem(VOTER_KEY);
    if (!token) {
      token = 'voter_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
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
      this.listeners = new Set();
      this.voterToken = getVoterToken();

      // Listen to cross-tab storage events
      window.addEventListener('storage', (e) => {
        if (e.key === SUGGESTIONS_KEY || e.key === VOTED_IDS_KEY) {
          this._notifyListeners({ action: 'storage_sync' });
        }
      });
    }

    /**
     * Subscribe to state change notifications
     */
    subscribe(callback) {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }

    _notifyListeners(payload) {
      for (const listener of this.listeners) {
        try {
          listener(payload);
        } catch (e) {
          console.error('Error in suggestion store listener:', e);
        }
      }
    }

    /**
     * Get all raw suggestions from localStorage
     */
    getAllRaw() {
      try {
        const raw = localStorage.getItem(SUGGESTIONS_KEY);
        if (raw) {
          return JSON.parse(raw);
        }
      } catch (e) {
        console.warn('Error reading suggestions from localStorage:', e);
      }
      return [];
    }

    _saveAll(list) {
      try {
        localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(list));
      } catch (e) {
        console.error('Error writing suggestions to localStorage:', e);
      }
    }

    /**
     * Query suggestions with sorting, category, search, and review status
     */
    query({ sortBy = 'popular', category = 'ALL', searchQuery = '', statusFilter = 'ALL' } = {}) {
      const votedSet = new Set(getLocalVotedIds());
      let items = this.getAllRaw();

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

      // Append dynamic hasVoted state for current browser
      return items.map(item => ({
        ...item,
        hasVoted: votedSet.has(item.id)
      }));
    }

    /**
     * Submit a new student suggestion
     */
    add({ title, category, description }) {
      const cleanTitle = sanitize(title);
      const cleanDesc = sanitize(description);
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

      // Check anti-spam cooldown
      const lastSubmit = localStorage.getItem(LAST_SUBMIT_KEY);
      const cooldownSecs = window.APP_CONFIG?.rules?.submissionCooldownSeconds || 5;
      if (lastSubmit) {
        const elapsed = (Date.now() - parseInt(lastSubmit, 10)) / 1000;
        if (elapsed < cooldownSecs) {
          const waitTime = Math.ceil(cooldownSecs - elapsed);
          throw new Error(`Please wait ${waitTime}s before submitting another idea.`);
        }
      }

      const newRecord = {
        id: 'sug_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
        title: cleanTitle,
        category: validCategory,
        description: cleanDesc || '',
        upvotes: 0,
        reviewed: false,
        reviewed_at: null,
        created_at: new Date().toISOString()
      };

      const list = this.getAllRaw();
      list.unshift(newRecord);
      this._saveAll(list);
      localStorage.setItem(LAST_SUBMIT_KEY, Date.now().toString());

      this._notifyListeners({ action: 'create', data: newRecord });
      return newRecord;
    }

    /**
     * Upvote or un-vote a suggestion
     */
    toggleUpvote(suggestionId) {
      if (!suggestionId) throw new Error('Invalid suggestion ID');

      const votedIds = new Set(getLocalVotedIds());
      const hasAlreadyVoted = votedIds.has(suggestionId);
      const list = this.getAllRaw();
      const item = list.find(s => s.id === suggestionId);

      if (!item) {
        throw new Error('Suggestion not found.');
      }

      let newVoteCount = item.upvotes || 0;
      let hasVotedNow = false;

      if (hasAlreadyVoted) {
        // Toggle OFF
        votedIds.delete(suggestionId);
        newVoteCount = Math.max(0, newVoteCount - 1);
        hasVotedNow = false;
      } else {
        // Toggle ON
        votedIds.add(suggestionId);
        newVoteCount = newVoteCount + 1;
        hasVotedNow = true;
      }

      item.upvotes = newVoteCount;
      this._saveAll(list);
      saveLocalVotedIds(Array.from(votedIds));

      this._notifyListeners({ action: 'upvote', id: suggestionId, upvotes: newVoteCount, hasVoted: hasVotedNow });

      return {
        id: suggestionId,
        upvotes: newVoteCount,
        hasVoted: hasVotedNow
      };
    }

    /**
     * Mark or unmark a suggestion as reviewed by website owner
     */
    toggleReviewed(suggestionId) {
      const list = this.getAllRaw();
      const item = list.find(s => s.id === suggestionId);

      if (!item) {
        throw new Error('Suggestion not found.');
      }

      item.reviewed = !Boolean(item.reviewed);
      item.reviewed_at = item.reviewed ? new Date().toISOString() : null;

      this._saveAll(list);
      this._notifyListeners({ action: 'review', id: suggestionId, reviewed: item.reviewed });

      return item;
    }

    /**
     * Delete a suggestion
     */
    delete(suggestionId) {
      let list = this.getAllRaw();
      const initialLength = list.length;
      list = list.filter(s => s.id !== suggestionId);

      if (list.length === initialLength) {
        throw new Error('Suggestion not found or already deleted.');
      }

      this._saveAll(list);

      // Also remove from voted list if present
      const votedIds = new Set(getLocalVotedIds());
      votedIds.delete(suggestionId);
      saveLocalVotedIds(Array.from(votedIds));

      this._notifyListeners({ action: 'delete', id: suggestionId });
      return true;
    }

    /**
     * Get aggregate statistics
     */
    getStats() {
      const list = this.getAllRaw();
      let reviewedCount = 0;
      let totalUpvotes = 0;

      for (const item of list) {
        if (item.reviewed) reviewedCount++;
        totalUpvotes += (item.upvotes || 0);
      }

      return {
        total: list.length,
        reviewedCount: reviewedCount,
        pendingCount: list.length - reviewedCount,
        totalUpvotes: totalUpvotes
      };
    }
  }

  window.SuggestionStore = new SuggestionStore();
})(window);

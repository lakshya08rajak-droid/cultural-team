/**
 * CULTURAL TEAM — MAIN APPLICATION CONTROLLER (FRONTEND ONLY)
 * 
 * Handles:
 * - Particle Canvas Atmosphere
 * - Real-Time Suggestion Submission & Instant Display
 * - Community Wall Upvoting & Dynamic Sorting
 * - Dedicated Suggestions Management Hub (Review & Delete)
 * - Shared Reactive State Synchronization
 * - 30 Inspiration Ideas Gallery & Click-to-Prefill
 * - Instant Feedback & Modals
 */

(function () {
  'use strict';

  // DOM Elements
  const header = document.getElementById('site-header');


  // Suggestion Form Elements
  const suggestionForm = document.getElementById('suggestion-form');
  const titleInput = document.getElementById('suggestion-title');
  const categoryChips = document.querySelectorAll('.category-chip');
  const categoryHidden = document.getElementById('suggestion-category-hidden');
  const descInput = document.getElementById('suggestion-desc');
  const titleCharCount = document.getElementById('title-char-count');
  const descCharCount = document.getElementById('desc-char-count');
  const submitBtn = document.getElementById('submit-suggestion-btn');
  const formAlert = document.getElementById('form-alert');
  const formAlertMsg = document.getElementById('form-alert-msg');
  const honeypotInput = document.getElementById('website-bot-check');

  // Public Community Wall Elements
  const communityWallGrid = document.getElementById('community-wall-grid');
  const communityCounterEl = document.getElementById('community-counter-number');
  const wallSortSelect = document.getElementById('wall-sort-select');
  const wallCategorySelect = document.getElementById('wall-category-select');

  // Dedicated Management Hub Elements
  const mgmtGrid = document.getElementById('mgmt-grid');
  const mgmtSearchInput = document.getElementById('mgmt-search-input');
  const mgmtStatusTabs = document.querySelectorAll('.mgmt-tab-btn');
  const mgmtCategorySelect = document.getElementById('mgmt-category-select');
  const mgmtSortSelect = document.getElementById('mgmt-sort-select');
  const mgmtStatTotal = document.getElementById('mgmt-stat-total');
  const mgmtStatPending = document.getElementById('mgmt-stat-pending');
  const mgmtStatReviewed = document.getElementById('mgmt-stat-reviewed');
  const mgmtStatUpvotes = document.getElementById('mgmt-stat-upvotes');

  // Inspiration Gallery Elements
  const inspirationGrid = document.getElementById('inspiration-grid');
  const inspirationFilterBtns = document.querySelectorAll('.filter-btn');

  // Modals & Notifications
  const successModal = document.getElementById('success-modal');
  const successModalClose = document.getElementById('success-modal-close');
  const successExploreBtn = document.getElementById('success-explore-btn');
  const successPreviewTitle = document.getElementById('success-preview-title');
  const successPreviewCategory = document.getElementById('success-preview-category');

  const qrModal = document.getElementById('qr-modal');
  const qrModalClose = document.getElementById('qr-modal-close');
  const qrOpenBtns = document.querySelectorAll('[data-open-qr]');
  const qrContainer = document.getElementById('qr-code-canvas-container');
  const qrUrlDisplay = document.getElementById('qr-url-display');
  const copyLinkBtn = document.getElementById('copy-link-btn');

  const toastNotice = document.getElementById('toast-notice');
  const toastText = document.getElementById('toast-text');
  const toastIcon = document.getElementById('toast-icon');
  let toastTimer = null;

  // Application State
  let wallSort = 'popular';
  let wallCategory = 'ALL';

  let mgmtSort = 'newest';
  let mgmtCategory = 'ALL';
  let mgmtSearch = '';
  let mgmtStatus = 'ALL';

  let inspirationCategory = 'ALL';

  // ============================================================================
  // 1. INITIALIZATION
  // ============================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initParticlesCanvas();
    setupMobileNav();
    setupQRModal();
    renderInspirationGrid();
    setupCategoryChipSelectors();
    setupCharCounters();
    setupQuickIdeas();
    setupFormSubmission();
    setupManagementControls();
    setupModals();

    // Initial render of both the Public Wall and the Management Hub
    syncAllViews();

    // Subscribe to reactive store changes
    if (window.SuggestionStore) {
      window.SuggestionStore.subscribe(() => {
        syncAllViews();
      });
    }
  });

  function syncAllViews() {
    renderCommunityWall();
    renderManagementHub();
  }



  // ============================================================================
  // 3. INSPIRATION SUGGESTIONS (30 CURATED EVENT CONCEPTS)
  // ============================================================================
  function renderInspirationGrid() {
    if (!inspirationGrid || !window.INSPIRATION_IDEAS) return;

    let items = window.INSPIRATION_IDEAS;
    if (inspirationCategory !== 'ALL') {
      items = items.filter(i => i.category === inspirationCategory);
    }

    inspirationGrid.innerHTML = items.map(item => `
      <article class="inspire-card" data-category="${item.category}">
        <div>
          <div class="inspire-card-top">
            <span class="inspire-icon" aria-hidden="true">${item.icon}</span>
            <span class="badge-category">${item.category}</span>
          </div>
          <h4 class="inspire-title">${escapeHTML(item.title)}</h4>
          <p class="inspire-tagline">${escapeHTML(item.tagline)}</p>
        </div>
        <button type="button" class="inspire-btn-prefill" data-title="${escapeAttr(item.title)}" data-category="${escapeAttr(item.category)}">
          <span>Suggest This Idea</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </article>
    `).join('');

    // Click-to-prefill buttons
    inspirationGrid.querySelectorAll('.inspire-btn-prefill').forEach(btn => {
      btn.addEventListener('click', () => {
        const title = btn.getAttribute('data-title');
        const cat = btn.getAttribute('data-category');
        prefillSuggestionForm(title, cat);
      });
    });
  }

  // Category filter tabs for Inspiration Section
  inspirationFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      inspirationFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      inspirationCategory = btn.getAttribute('data-filter') || 'ALL';
      renderInspirationGrid();
    });
  });

  function prefillSuggestionForm(title, category) {
    if (!titleInput) return;
    titleInput.value = title;
    if (categoryHidden) categoryHidden.value = category;

    // Highlight matching category chip
    categoryChips.forEach(chip => {
      if (chip.getAttribute('data-category') === category) {
        chip.classList.add('active');
        chip.setAttribute('aria-checked', 'true');
      } else {
        chip.classList.remove('active');
        chip.setAttribute('aria-checked', 'false');
      }
    });

    // Tactile focus animation
    titleInput.classList.remove('field-highlight');
    void titleInput.offsetWidth;
    titleInput.classList.add('field-highlight');

    updateCharCounts();

    const formSection = document.getElementById('suggestions-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
    setTimeout(() => {
      descInput?.focus();
    }, 450);
  }

  // ============================================================================
  // 4. SUGGESTION FORM INTERACTIONS & VALIDATION
  // ============================================================================
  function setupCategoryChipSelectors() {
    categoryChips.forEach(chip => {
      chip.addEventListener('click', () => {
        categoryChips.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-checked', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-checked', 'true');
        const selectedCat = chip.getAttribute('data-category');
        if (categoryHidden) categoryHidden.value = selectedCat;
      });
    });
  }

  function setupCharCounters() {
    titleInput?.addEventListener('input', updateCharCounts);
    descInput?.addEventListener('input', updateCharCounts);
  }

  function updateCharCounts() {
    if (titleInput && titleCharCount) {
      titleCharCount.textContent = `${titleInput.value.length} / 120`;
    }
    if (descInput && descCharCount) {
      descCharCount.textContent = `${descInput.value.length} / 1000`;
    }
  }

  function setupQuickIdeas() {
    const chips = document.querySelectorAll('.example-suggestion-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const title = chip.getAttribute('data-title');
        const category = chip.getAttribute('data-category');
        if (!title) return;

        if (titleInput) {
          titleInput.value = title;
          titleInput.classList.remove('field-highlight');
          void titleInput.offsetWidth;
          titleInput.classList.add('field-highlight');
        }
        if (categoryHidden && category) {
          categoryHidden.value = category;
        }

        // Highlight matching category chip in the form
        if (category) {
          categoryChips.forEach(c => {
            if (c.getAttribute('data-category') === category) {
              c.classList.add('active');
              c.setAttribute('aria-checked', 'true');
            } else {
              c.classList.remove('active');
              c.setAttribute('aria-checked', 'false');
            }
          });
        }

        updateCharCounts();
        hideFormAlert();

        // Subtle micro-feedback animation on clicked chip
        chip.style.transform = 'scale(0.95)';
        setTimeout(() => { chip.style.transform = ''; }, 180);

        showToast(`Loaded "${title}" — feel free to customize or submit!`, 'success');

        // Scroll smoothly to form and focus description
        const formCard = document.querySelector('.suggestion-form-card');
        if (formCard) {
          formCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        setTimeout(() => {
          if (descInput) descInput.focus();
          else if (titleInput) titleInput.focus();
        }, 300);
      });
    });
  }

  function setupFormSubmission() {
    if (!suggestionForm) return;

    let lastSubmittedTitle = '';
    let lastSubmitTime = 0;

    suggestionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideFormAlert();

      // Bot honeypot verification
      if (honeypotInput && honeypotInput.value.trim() !== '') {
        console.warn('Bot submission ignored.');
        return;
      }

      const title = titleInput?.value.trim();
      const category = categoryHidden?.value || 'Other Ideas';
      const description = descInput?.value.trim();

      if (!title || title.length < 2) {
        showFormAlert('Please enter an event suggestion title (at least 2 characters).');
        titleInput?.focus();
        return;
      }

      const now = Date.now();
      if (title.toLowerCase() === lastSubmittedTitle.toLowerCase() && (now - lastSubmitTime < 15000)) {
        showFormAlert('You just submitted this idea! Please wait a moment before submitting it again.');
        return;
      }

      setSubmitLoading(true);

      try {
        const newRecord = await window.SuggestionStore.add({
          title,
          category,
          description
        });

        lastSubmittedTitle = title;
        lastSubmitTime = Date.now();

        // SUCCESS: Show popup modal
        openSuccessModal(newRecord.title, newRecord.category);
        showToast('Idea submitted and synced to community wall!', 'success');

        // Reset form
        suggestionForm.reset();
        categoryChips.forEach((c, idx) => {
          if (idx === 0) c.classList.add('active');
          else c.classList.remove('active');
        });
        if (categoryHidden) categoryHidden.value = 'Cultural Events';
        updateCharCounts();
      } catch (err) {
        showFormAlert(err.message || 'Submission could not be completed. Please try again.');
      } finally {
        setSubmitLoading(false);
      }
    });
  }

  function setSubmitLoading(isLoading) {
    if (!submitBtn) return;
    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
        </svg>
        <span>Saving to Cloud...</span>
      `;
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span>Submit Suggestion</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      `;
    }
  }

  function showFormAlert(msg) {
    if (!formAlert || !formAlertMsg) return;
    formAlertMsg.textContent = msg;
    formAlert.classList.add('error');
    formAlert.style.display = 'flex';
  }

  function hideFormAlert() {
    if (!formAlert) return;
    formAlert.classList.remove('error');
    formAlert.style.display = 'none';
  }

  // ============================================================================
  // 5. PUBLIC COMMUNITY WALL
  // ============================================================================
  function renderCommunityWall() {
    if (!communityWallGrid || !window.SuggestionStore) return;

    const items = window.SuggestionStore.query({
      sortBy: wallSort,
      category: wallCategory
    });

    const stats = window.SuggestionStore.getStats();
    animateCounter(communityCounterEl, stats.total || 0);

    const totalVotesEl = document.getElementById('wall-total-votes');
    if (totalVotesEl) animateCounter(totalVotesEl, stats.totalUpvotes || 0);

    const activeIdeasEl = document.getElementById('wall-active-ideas');
    if (activeIdeasEl) animateCounter(activeIdeasEl, stats.activeVotedCount || 0);

    if (!window.SuggestionStore.hasLoaded && items.length === 0) {
      communityWallGrid.innerHTML = `
        <div class="wall-empty-state">
          <div class="wall-empty-icon" style="font-size: 2.2rem;">⏳</div>
          <h4 class="wall-empty-title">Fetching Real Community Ideas...</h4>
          <p class="wall-empty-sub">Connecting to Supabase to synchronize live student suggestions and votes.</p>
        </div>
      `;
      return;
    }

    if (items.length === 0) {
      communityWallGrid.innerHTML = `
        <div class="wall-empty-state">
          <div class="wall-empty-icon">💡</div>
          <h4 class="wall-empty-title">Be The First Voice!</h4>
          <p class="wall-empty-sub">No student suggestions have been submitted yet. Your creative idea could become the main event at our next college fest!</p>
          <a href="#suggestions-section" class="btn btn-gold btn-sm">Suggest an Event Now</a>
        </div>
      `;
      return;
    }

    communityWallGrid.innerHTML = items.map(item => `
      <article class="community-card" data-id="${item.id}">
        <div>
          <div class="community-card-top">
            <span class="badge-category">${escapeHTML(item.category)}</span>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              ${item.reviewed ? '<span class="wall-reviewed-tag" title="Shortlisted by Cultural Team">✓ Shortlisted</span>' : ''}
              <span class="community-date">${formatRelativeTime(item.created_at)}</span>
            </div>
          </div>
          <h4 class="community-title">${escapeHTML(item.title)}</h4>
          ${item.description ? `<p class="community-desc">${escapeHTML(item.description)}</p>` : ''}
        </div>
        <div class="community-card-bottom">
          <button 
            type="button" 
            class="btn-upvote ${item.hasVoted ? 'has-voted' : ''}" 
            data-id="${item.id}"
            aria-label="Upvote ${escapeAttr(item.title)}"
          >
            <svg class="heart-icon" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span class="upvote-count">${item.upvotes || 0}</span>
          </button>
          <span class="community-date">${item.hasVoted ? '✓ Upvoted' : 'Tap to Upvote'}</span>
        </div>
      </article>
    `).join('');

    // Upvote Button Click Handlers
    communityWallGrid.querySelectorAll('.btn-upvote').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        btn.disabled = true;
        try {
          const res = await window.SuggestionStore.toggleUpvote(id);
          if (res && res.hasVoted) {
            btn.classList.add('heart-burst');
            setTimeout(() => btn.classList.remove('heart-burst'), 600);
          }
          showToast(res.hasVoted ? 'Upvote recorded in cloud!' : 'Upvote removed', 'success');
        } catch (err) {
          console.warn('Vote failed:', err);
          showToast(err.message || 'Voting temporarily unavailable', 'danger');
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  wallSortSelect?.addEventListener('change', (e) => {
    wallSort = e.target.value;
    renderCommunityWall();
  });

  wallCategorySelect?.addEventListener('change', (e) => {
    wallCategory = e.target.value;
    renderCommunityWall();
  });

  // ============================================================================
  // 6. DEDICATED SUGGESTIONS MANAGEMENT HUB (REVIEW & DELETE)
  // ============================================================================
  function setupManagementControls() {
    // Search input with real-time filtering
    mgmtSearchInput?.addEventListener('input', (e) => {
      mgmtSearch = e.target.value;
      renderManagementHub();
    });

    // Status filter tabs (All, Pending, Reviewed)
    mgmtStatusTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        mgmtStatusTabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mgmtStatus = btn.getAttribute('data-status') || 'ALL';
        renderManagementHub();
      });
    });

    // Category dropdown
    mgmtCategorySelect?.addEventListener('change', (e) => {
      mgmtCategory = e.target.value;
      renderManagementHub();
    });

    // Sort dropdown
    mgmtSortSelect?.addEventListener('change', (e) => {
      mgmtSort = e.target.value;
      renderManagementHub();
    });
  }

  function renderManagementHub() {
    if (!mgmtGrid || !window.SuggestionStore) return;

    // Update aggregate stats
    const stats = window.SuggestionStore.getStats();
    if (mgmtStatTotal) mgmtStatTotal.textContent = stats.total;
    if (mgmtStatPending) mgmtStatPending.textContent = stats.pendingCount;
    if (mgmtStatReviewed) mgmtStatReviewed.textContent = stats.reviewedCount;
    if (mgmtStatUpvotes) mgmtStatUpvotes.textContent = stats.totalUpvotes;

    // Query filtered suggestions for management
    const items = window.SuggestionStore.query({
      sortBy: mgmtSort,
      category: mgmtCategory,
      searchQuery: mgmtSearch,
      statusFilter: mgmtStatus
    });

    if (items.length === 0) {
      mgmtGrid.innerHTML = `
        <div class="wall-empty-state" style="padding: 2.5rem 1rem;">
          <div class="wall-empty-icon" style="font-size: 2.2rem;">📂</div>
          <h4 class="wall-empty-title" style="font-size: 1.15rem;">No Suggestions Match Current Filters</h4>
          <p class="wall-empty-sub">Try searching for a different keyword or switch to another category or status tab.</p>
        </div>
      `;
      return;
    }

    mgmtGrid.innerHTML = items.map(item => `
      <article class="mgmt-card ${item.reviewed ? 'is-reviewed' : ''}" data-id="${item.id}">
        <div class="mgmt-card-header">
          <div class="mgmt-card-meta">
            <span class="badge-category">${escapeHTML(item.category)}</span>
            <span class="badge-status ${item.reviewed ? 'reviewed' : 'pending'}">
              ${item.reviewed ? '✓ Shortlisted' : '⏳ Pending Review'}
            </span>
            <span class="community-date">Submitted ${formatRelativeTime(item.created_at)}</span>
          </div>
          <span class="mgmt-votes-pill">
            ❤️ <strong>${item.upvotes || 0}</strong> Upvotes
          </span>
        </div>

        <div>
          <h4 class="mgmt-card-title">${escapeHTML(item.title)}</h4>
          ${item.description ? `<p class="mgmt-card-desc">${escapeHTML(item.description)}</p>` : ''}
        </div>

        <div class="mgmt-card-footer">
          <span class="community-date" style="font-family: monospace;">ID: #${item.id}</span>
          <div class="mgmt-actions-group">
            <button 
              type="button" 
              class="btn-review-toggle ${item.reviewed ? 'action-unmark' : 'action-mark'}" 
              data-id="${item.id}"
              aria-label="${item.reviewed ? 'Unmark review' : 'Mark as reviewed'} for ${escapeAttr(item.title)}"
            >
              ${item.reviewed ? '↩️ Revert Shortlist' : '✓ Shortlist Idea'}
            </button>
            <button 
              type="button" 
              class="btn-delete-card" 
              data-id="${item.id}"
              data-title="${escapeAttr(item.title)}"
              aria-label="Delete suggestion ${escapeAttr(item.title)}"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </article>
    `).join('');

    function getOrPromptAdminPasscode(customPrompt) {
      let pass = sessionStorage.getItem('cultural_admin_pass');
      if (pass) return pass;
      pass = prompt(customPrompt || 'Authorized Action: Enter Organizer Passcode:', '');
      if (pass !== null && pass.trim()) {
        sessionStorage.setItem('cultural_admin_pass', pass.trim());
        return pass.trim();
      }
      return null;
    }

    // Attach Review Toggle Button Listeners
    mgmtGrid.querySelectorAll('.btn-review-toggle').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const pass = getOrPromptAdminPasscode('Authorized Action: Enter Organizer Passcode to shortlist this idea:');
        if (!pass) return;
        try {
          const updated = await window.SuggestionStore.toggleReviewed(id, pass);
          showToast(
            updated.reviewed ? 'Suggestion shortlisted!' : 'Review status reverted to pending',
            'success'
          );
        } catch (e) {
          sessionStorage.removeItem('cultural_admin_pass');
          showToast(e.message || 'Review action failed', 'danger');
        }
      });
    });

    // Attach Delete Button Listeners (Protected by Organizer Passcode)
    mgmtGrid.querySelectorAll('.btn-delete-card').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const title = btn.getAttribute('data-title');
        const pass = getOrPromptAdminPasscode(`Authorized Action: Enter Organizer Passcode to delete "${title}":`);
        if (!pass) return;
        try {
          await window.SuggestionStore.delete(id, pass);
          showToast(`"${title}" removed from database`, 'danger');
        } catch (e) {
          sessionStorage.removeItem('cultural_admin_pass');
          showToast(e.message || 'Delete operation failed', 'danger');
        }
      });
    });
  }

  // ============================================================================
  // 7. TOAST NOTIFICATION HELPER
  // ============================================================================
  function showToast(message, type = 'success') {
    if (!toastNotice || !toastText) return;
    if (toastTimer) clearTimeout(toastTimer);

    toastText.textContent = message;
    toastNotice.className = `toast-notice show ${type}`;
    if (toastIcon) {
      toastIcon.textContent = type === 'danger' ? '🗑️' : '✓';
    }

    toastTimer = setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 3200);
  }

  // ============================================================================
  // 8. MODAL WINDOWS
  // ============================================================================
  function setupModals() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllModals();
      }
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeAllModals();
        }
      });
    });
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('is-active'));
  }

  function openSuccessModal(title, category) {
    if (successPreviewTitle) successPreviewTitle.textContent = title;
    if (successPreviewCategory) successPreviewCategory.textContent = category;
    successModal?.classList.add('is-active');
  }

  successModalClose?.addEventListener('click', () => {
    successModal?.classList.remove('is-active');
  });

  successExploreBtn?.addEventListener('click', () => {
    successModal?.classList.remove('is-active');
    const wall = document.getElementById('community-wall');
    if (wall) wall.scrollIntoView({ behavior: 'smooth' });
  });

  function getShareableUrl() {
    return window.APP_CONFIG?.productionUrl || 'https://cultural-team-git-main-culturalteam.vercel.app';
  }

  // QR Code Public Modal
  function setupQRModal() {
    qrOpenBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof window.closeMobileNav === 'function') {
          window.closeMobileNav();
        }
        openQRModal();
      });
    });

    qrModalClose?.addEventListener('click', () => {
      qrModal?.classList.remove('is-active');
    });

    copyLinkBtn?.addEventListener('click', () => {
      const url = getShareableUrl();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          copyLinkBtn.textContent = '✓ Link Copied!';
          setTimeout(() => {
            copyLinkBtn.textContent = 'Copy Public Link';
          }, 2000);
        }).catch(() => {
          fallbackCopyText(url);
        });
      } else {
        fallbackCopyText(url);
      }
    });
  }

  function fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      if (copyLinkBtn) {
        copyLinkBtn.textContent = '✓ Link Copied!';
        setTimeout(() => {
          copyLinkBtn.textContent = 'Copy Public Link';
        }, 2000);
      }
    } catch (_) {}
    document.body.removeChild(ta);
  }

  function openQRModal() {
    const targetUrl = getShareableUrl();
    if (qrUrlDisplay) qrUrlDisplay.textContent = targetUrl;

    if (qrContainer) {
      const qrImageSrc = window.APP_CONFIG?.qrCodeImage || 'assets/cultural-qr-code.jpg';
      qrContainer.innerHTML = `
        <img 
          src="${qrImageSrc}" 
          alt="QR Code — Scan to Share Your Suggestions" 
          class="qr-code-img" 
          width="918" 
          height="918" 
          loading="eager" 
          decoding="async"
        />
      `;
    }

    qrModal?.classList.add('is-active');
  }

  // ============================================================================
  // 9. MOBILE NAVIGATION DRAWER
  // ============================================================================
  function setupMobileNav() {
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
    const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
    const mobileNavBackdrop = document.getElementById('mobile-nav-backdrop');
    const mobileDrawerClose = document.getElementById('mobile-drawer-close');
    const mobileNavLinks = document.querySelectorAll(
      '.mobile-drawer-link, .mobile-drawer-announcement-card, .mobile-drawer-cta-btn'
    );

    if (!mobileNavToggle || !mobileNavDrawer) return;

    function openMobileNav() {
      mobileNavToggle.classList.add('is-active');
      mobileNavToggle.setAttribute('aria-expanded', 'true');
      mobileNavDrawer.classList.add('is-open');
      mobileNavDrawer.removeAttribute('inert');
      mobileNavDrawer.setAttribute('aria-hidden', 'false');
      if (mobileNavBackdrop) {
        mobileNavBackdrop.classList.add('is-active');
        mobileNavBackdrop.setAttribute('aria-hidden', 'false');
      }
      document.body.style.overflow = 'hidden';
    }

    function closeMobileNav() {
      mobileNavToggle.classList.remove('is-active');
      mobileNavToggle.setAttribute('aria-expanded', 'false');
      mobileNavDrawer.classList.remove('is-open');
      mobileNavDrawer.setAttribute('inert', '');
      mobileNavDrawer.setAttribute('aria-hidden', 'true');
      if (mobileNavBackdrop) {
        mobileNavBackdrop.classList.remove('is-active');
        mobileNavBackdrop.setAttribute('aria-hidden', 'true');
      }
      document.body.style.overflow = '';
    }

    // Toggle button click/tap
    mobileNavToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = mobileNavDrawer.classList.contains('is-open');
      if (isOpen) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });

    // Close button inside drawer
    mobileDrawerClose?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMobileNav();
    });

    // Backdrop click
    mobileNavBackdrop?.addEventListener('click', () => {
      closeMobileNav();
    });

    // Close on selecting any navigation link
    mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        closeMobileNav();
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNavDrawer.classList.contains('is-open')) {
        closeMobileNav();
        mobileNavToggle.focus();
      }
    });

    // Close on outside tap
    document.addEventListener('click', (e) => {
      if (
        mobileNavDrawer.classList.contains('is-open') &&
        !mobileNavDrawer.contains(e.target) &&
        !mobileNavToggle.contains(e.target)
      ) {
        closeMobileNav();
      }
    });

    // Automatically close mobile nav when resizing to desktop/tablet (>= 768px)
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768 && mobileNavDrawer.classList.contains('is-open')) {
        closeMobileNav();
      }
    });

    window.closeMobileNav = closeMobileNav;
    window.openMobileNav = openMobileNav;
  }

  function animateCounter(el, target) {
    if (!el) return;
    const start = parseInt(el.textContent || '0', 10) || 0;
    if (start === target) {
      el.textContent = target;
      return;
    }
    const duration = 500;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(start + (target - start) * progress);
      el.textContent = current;
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target;
      }
    }
    requestAnimationFrame(update);
  }

  function formatRelativeTime(dateStr) {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // ============================================================================
  // 9. AMBIENT PARTICLES CANVAS
  // ============================================================================
  function initParticlesCanvas() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    // Accessibility: Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.style.display = 'none';
      return;
    }

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }, { passive: true });

    const colors = [
      'rgba(232, 216, 196, 0.75)',
      'rgba(199, 183, 163, 0.7)',
      'rgba(109, 41, 50, 0.65)',
      'rgba(86, 28, 36, 0.6)',
      'rgba(255, 251, 245, 0.8)'
    ];

    const particleCount = window.innerWidth < 768 ? 14 : 36;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.35,
        vy: -Math.random() * 0.6 - 0.2,
        alpha: Math.random() * 0.8 + 0.2
      });
    }

    let isVisible = true;
    let animId = null;

    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
      if (isVisible && !animId) {
        animId = requestAnimationFrame(animate);
      }
    });

    function animate() {
      if (!isVisible) {
        animId = null;
        return;
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);
  }

  // ============================================================================
  // 10. SANITIZATION UTILITIES
  // ============================================================================
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
})();

/**
 * CULTURAL TEAM — MAIN APPLICATION CONTROLLER
 * Handles: Particle Canvas, Real Database Integration, Suggestion Form,
 * Upvoting Engine, Live Counters, QR Code Generator, and Modal Dialogs.
 */

(function () {
  'use strict';

  // DOM Elements
  const header = document.getElementById('site-header');
  const dbStatusBadge = document.getElementById('db-status-badge');
  const dbStatusDot = document.getElementById('db-status-dot');
  const dbStatusText = document.getElementById('db-status-text');

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

  // Community Wall Elements
  const communityWallGrid = document.getElementById('community-wall-grid');
  const communityCounterEl = document.getElementById('community-counter-number');
  const wallSortSelect = document.getElementById('wall-sort-select');
  const wallCategorySelect = document.getElementById('wall-category-select');

  // Inspiration Gallery Elements
  const inspirationGrid = document.getElementById('inspiration-grid');
  const inspirationFilterBtns = document.querySelectorAll('.filter-btn');

  // Modals
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

  const dbModal = document.getElementById('db-modal');
  const dbModalClose = document.getElementById('db-modal-close');

  // State
  let currentSort = 'popular';
  let currentWallCategory = 'ALL';
  let currentInspirationCategory = 'ALL';

  // ============================================================================
  // 1. INITIALIZATION
  // ============================================================================
  document.addEventListener('DOMContentLoaded', async () => {
    initParticlesCanvas();
    initHeaderScroll();
    renderInspirationGrid();
    setupCategoryChipSelectors();
    setupCharCounters();
    setupFormSubmission();
    setupQRModal();
    setupDBModal();
    setupModals();

    // Initialize Database
    try {
      const dbStatus = await window.DatabaseAdapter.init();
      updateDBStatusUI(dbStatus);
    } catch (err) {
      console.warn('DB initialization notice:', err);
    }

    // Initial load of community suggestions
    await loadCommunitySuggestions();

    // Listen for live realtime updates
    window.DatabaseAdapter.onUpdate(() => {
      loadCommunitySuggestions();
    });
  });

  // ============================================================================
  // 2. HEADER SCROLL & STATUS BADGE
  // ============================================================================
  function initHeaderScroll() {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header?.classList.add('scrolled');
      } else {
        header?.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  function updateDBStatusUI(status) {
    if (!dbStatusBadge || !dbStatusText || !dbStatusDot) return;

    if (status.isCloud) {
      dbStatusDot.className = 'db-status-dot';
      dbStatusText.textContent = 'Cloud Database Connected';
      dbStatusBadge.title = 'Real-time Supabase Database is active.';
    } else {
      dbStatusDot.className = 'db-status-dot local-mode';
      dbStatusText.textContent = 'Local Testing Mode (Setup Cloud DB)';
      dbStatusBadge.title = 'Click to view Supabase connection guide.';
    }
  }

  // ============================================================================
  // 3. INSPIRATION SUGGESTIONS (30 CURATED EVENT CONCEPTS)
  // ============================================================================
  function renderInspirationGrid() {
    if (!inspirationGrid || !window.INSPIRATION_IDEAS) return;

    let items = window.INSPIRATION_IDEAS;
    if (currentInspirationCategory !== 'ALL') {
      items = items.filter(i => i.category === currentInspirationCategory);
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

    // Attach click-to-prefill listeners
    inspirationGrid.querySelectorAll('.inspire-btn-prefill').forEach(btn => {
      btn.addEventListener('click', (e) => {
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
      currentInspirationCategory = btn.getAttribute('data-filter') || 'ALL';
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
      } else {
        chip.classList.remove('active');
      }
    });

    updateCharCounts();

    // Smooth scroll to form and focus description
    const formSection = document.getElementById('suggestions-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
    setTimeout(() => {
      descInput?.focus();
    }, 500);
  }

  // ============================================================================
  // 4. SUGGESTION FORM INTERACTIONS & VALIDATION
  // ============================================================================
  function setupCategoryChipSelectors() {
    categoryChips.forEach(chip => {
      chip.addEventListener('click', () => {
        categoryChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
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
      titleCharCount.textContent = `${titleInput.value.length} / 100`;
    }
    if (descInput && descCharCount) {
      descCharCount.textContent = `${descInput.value.length} / 350`;
    }
  }

  function setupFormSubmission() {
    if (!suggestionForm) return;

    suggestionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideFormAlert();

      // Anti-spam honeypot verification
      if (honeypotInput && honeypotInput.value.trim() !== '') {
        console.warn('Bot submission blocked.');
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

      setSubmitLoading(true);

      try {
        const result = await window.DatabaseAdapter.submitSuggestion({
          title,
          category,
          description
        });

        // SUCCESS: Show animated popup modal
        openSuccessModal(result.title, result.category);

        // Reset form
        suggestionForm.reset();
        categoryChips.forEach((c, idx) => {
          if (idx === 0) c.classList.add('active');
          else c.classList.remove('active');
        });
        if (categoryHidden) categoryHidden.value = 'Cultural Events';
        updateCharCounts();

        // Refresh community list immediately
        await loadCommunitySuggestions();
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
        <span>Saving Idea...</span>
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
  // 5. COMMUNITY SUGGESTION WALL & REALTIME STATS
  // ============================================================================
  async function loadCommunitySuggestions() {
    if (!communityWallGrid) return;

    try {
      const items = await window.DatabaseAdapter.getSuggestions(currentSort, currentWallCategory);
      const stats = await window.DatabaseAdapter.getStats();

      // Update Live Database Counter
      animateCounter(communityCounterEl, stats.count || 0);

      if (!items || items.length === 0) {
        communityWallGrid.innerHTML = `
          <div class="wall-empty-state">
            <div class="wall-empty-icon">💡</div>
            <h4 class="wall-empty-title">Be The First Voice!</h4>
            <p class="wall-empty-sub">No suggestions have been submitted in this category yet. Your creative idea could become the main event at our next college fest!</p>
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
              <span class="community-date">${formatRelativeTime(item.created_at)}</span>
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

      // Attach Upvote Click Handlers
      communityWallGrid.querySelectorAll('.btn-upvote').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          await handleUpvote(btn, id);
        });
      });
    } catch (err) {
      console.error('Failed to load community wall:', err);
    }
  }

  async function handleUpvote(btn, suggestionId) {
    const countEl = btn.querySelector('.upvote-count');
    const wasVoted = btn.classList.contains('has-voted');
    const currentCount = parseInt(countEl?.textContent || '0', 10);

    // Optimistic UI update
    btn.classList.toggle('has-voted');
    const optimisticCount = wasVoted ? Math.max(0, currentCount - 1) : currentCount + 1;
    if (countEl) countEl.textContent = optimisticCount;

    try {
      const res = await window.DatabaseAdapter.toggleVote(suggestionId);
      if (countEl) countEl.textContent = res.upvotes;
      if (res.hasVoted) btn.classList.add('has-voted');
      else btn.classList.remove('has-voted');
    } catch (err) {
      // Rollback on error
      console.warn('Vote failed, reverting:', err);
      btn.classList.toggle('has-voted', wasVoted);
      if (countEl) countEl.textContent = currentCount;
    }
  }

  // Sorting and Filtering Controls
  wallSortSelect?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    loadCommunitySuggestions();
  });

  wallCategorySelect?.addEventListener('change', (e) => {
    currentWallCategory = e.target.value;
    loadCommunitySuggestions();
  });

  // Animated Counter
  function animateCounter(el, target) {
    if (!el) return;
    const start = parseInt(el.textContent || '0', 10) || 0;
    if (start === target) {
      el.textContent = target;
      return;
    }
    const duration = 600;
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

  // Relative Timestamp Formatter
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
  // 6. MODALS MANAGEMENT (SUCCESS, QR CODE, DB GUIDE)
  // ============================================================================
  function setupModals() {
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllModals();
      }
    });

    // Close on backdrop click
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

  // QR Code Modal
  function setupQRModal() {
    qrOpenBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openQRModal();
      });
    });

    qrModalClose?.addEventListener('click', () => {
      qrModal?.classList.remove('is-active');
    });

    copyLinkBtn?.addEventListener('click', () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        copyLinkBtn.textContent = '✓ Link Copied!';
        setTimeout(() => {
          copyLinkBtn.textContent = 'Copy Public Link';
        }, 2000);
      });
    });
  }

  function openQRModal() {
    const currentUrl = window.location.href.split('#')[0];
    if (qrUrlDisplay) qrUrlDisplay.textContent = currentUrl;

    if (qrContainer && typeof window.generateQRCodeSVG === 'function') {
      qrContainer.innerHTML = window.generateQRCodeSVG(currentUrl, 220);
    }

    qrModal?.classList.add('is-active');
  }

  // Database Connection Guide Modal
  function setupDBModal() {
    dbStatusBadge?.addEventListener('click', (e) => {
      e.preventDefault();
      dbModal?.classList.add('is-active');
    });

    dbModalClose?.addEventListener('click', () => {
      dbModal?.classList.remove('is-active');
    });
  }

  // ============================================================================
  // 7. PARTICLES BACKGROUND CANVAS
  // ============================================================================
  function initParticlesCanvas() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }, { passive: true });

    // Festive ember particle colors (Gold, Magenta, Violet, Cyan, Coral)
    const colors = [
      'rgba(245, 158, 11, 0.65)',
      'rgba(236, 72, 153, 0.65)',
      'rgba(139, 92, 246, 0.6)',
      'rgba(6, 182, 212, 0.6)',
      'rgba(251, 191, 36, 0.7)'
    ];

    const particleCount = window.innerWidth < 768 ? 24 : 45;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.7 - 0.2, // Drift upward like concert sparks
        alpha: Math.random() * 0.8 + 0.2
      });
    }

    let isVisible = true;
    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
    });

    function animate() {
      if (isVisible) {
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
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.fill();
        }
      }
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  // ============================================================================
  // 8. UTILITY SANITIZERS
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

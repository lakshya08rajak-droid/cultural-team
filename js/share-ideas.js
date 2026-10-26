/**
 * CULTURAL TEAM — SHARE IDEAS CONTROLLER
 * 
 * Handles:
 * - Predefined event idea chips (click-to-prefill)
 * - Category selector radio chips
 * - Dynamic character counting
 * - Honeypot anti-spam check
 * - Submission through window.SuggestionStore.add() (Supabase cloud + local fallback)
 * - Success modal & toast notification
 */

(function () {
  'use strict';

  // DOM Elements
  const form = document.getElementById('suggestion-form');
  const titleInput = document.getElementById('suggestion-title');
  const descInput = document.getElementById('suggestion-desc');
  const categoryHidden = document.getElementById('suggestion-category-hidden');
  const categoryChips = document.querySelectorAll('.category-chip');
  const exampleChips = document.querySelectorAll('.example-chip');
  const titleCharCount = document.getElementById('title-char-count');
  const descCharCount = document.getElementById('desc-char-count');
  const submitBtn = document.getElementById('submit-suggestion-btn');
  const formAlert = document.getElementById('form-alert');
  const formAlertMsg = document.getElementById('form-alert-msg');
  const honeypotInput = document.getElementById('website-bot-check');

  // Success Modal Elements
  const successModal = document.getElementById('success-modal');
  const successModalClose = document.getElementById('success-modal-close');
  const successModalAnother = document.getElementById('success-modal-another');
  const successPreviewTitle = document.getElementById('success-preview-title');
  const successPreviewCategory = document.getElementById('success-preview-category');

  // Toast Notification Elements
  const toastNotice = document.getElementById('toast-notice');
  const toastText = document.getElementById('toast-text');
  const toastIcon = document.getElementById('toast-icon');
  let toastTimer = null;

  // Anti-Spam State
  let lastSubmittedTitle = '';
  let lastSubmitTime = 0;

  document.addEventListener('DOMContentLoaded', () => {
    setupCategoryChips();
    setupExampleChips();
    setupCharCounters();
    setupFormSubmission();
    setupModals();
  });

  // 1. Category Selector Radio Chips
  function setupCategoryChips() {
    if (!categoryChips || !categoryHidden) return;

    categoryChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const cat = chip.getAttribute('data-category');
        categoryHidden.value = cat;

        categoryChips.forEach(c => {
          const isCurrent = c === chip;
          c.classList.toggle('active', isCurrent);
          c.setAttribute('aria-checked', isCurrent ? 'true' : 'false');
        });
      });
    });
  }

  // 2. Predefined Example Chips (Quick-Fill)
  function setupExampleChips() {
    if (!exampleChips) return;

    exampleChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const title = chip.getAttribute('data-title');
        const category = chip.getAttribute('data-category');

        if (titleInput && title) {
          titleInput.value = title;
          titleInput.focus();
        }

        if (category && categoryHidden) {
          categoryHidden.value = category;
          categoryChips.forEach(c => {
            const matches = c.getAttribute('data-category') === category;
            c.classList.toggle('active', matches);
            c.setAttribute('aria-checked', matches ? 'true' : 'false');
          });
        }

        updateCharCounts();
        hideFormAlert();

        // Tactile micro-animation
        chip.style.transform = 'scale(0.96)';
        setTimeout(() => { chip.style.transform = ''; }, 150);
      });
    });
  }

  // 3. Dynamic Character Counting
  function setupCharCounters() {
    if (titleInput && titleCharCount) {
      titleInput.addEventListener('input', updateCharCounts);
    }
    if (descInput && descCharCount) {
      descInput.addEventListener('input', updateCharCounts);
    }
    updateCharCounts();
  }

  function updateCharCounts() {
    if (titleInput && titleCharCount) {
      const len = titleInput.value.length;
      titleCharCount.textContent = `${len} / 120`;
      titleCharCount.style.color = len >= 115 ? 'var(--maroon-primary)' : 'var(--text-muted)';
    }
    if (descInput && descCharCount) {
      const len = descInput.value.length;
      descCharCount.textContent = `${len} / 1000`;
      descCharCount.style.color = len >= 950 ? 'var(--maroon-primary)' : 'var(--text-muted)';
    }
  }

  // 4. Form Submission & Validation
  function setupFormSubmission() {
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideFormAlert();

      // Bot honeypot check
      if (honeypotInput && honeypotInput.value.trim() !== '') {
        console.warn('Bot detected by honeypot.');
        showToast('Thank you for your suggestion!', 'success');
        form.reset();
        return;
      }

      const title = titleInput ? titleInput.value.trim() : '';
      const category = categoryHidden ? categoryHidden.value : 'Cultural Events';
      const description = descInput ? descInput.value.trim() : '';

      // Validation
      if (!title || title.length < 2) {
        showFormAlert('Please enter an event suggestion title (at least 2 characters).');
        titleInput?.focus();
        return;
      }

      if (title.length > 120) {
        showFormAlert('Suggestion title cannot exceed 120 characters.');
        titleInput?.focus();
        return;
      }

      if (description.length > 1000) {
        showFormAlert('Description cannot exceed 1,000 characters.');
        descInput?.focus();
        return;
      }

      // Duplicate / Rapid Submission Guard
      const now = Date.now();
      if (title.toLowerCase() === lastSubmittedTitle.toLowerCase() && (now - lastSubmitTime < 15000)) {
        showFormAlert('You just submitted this idea! Please wait a moment before submitting it again.');
        return;
      }

      setSubmitLoading(true);

      try {
        let result = null;
        if (window.SuggestionStore && typeof window.SuggestionStore.add === 'function') {
          result = await window.SuggestionStore.add({
            title,
            category,
            description
          });
        } else {
          // Direct fallback if store not loaded
          const resp = await fetch('/api/submit-suggestion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, category, description })
          });
          result = await resp.json();
          if (!resp.ok) {
            throw new Error(result.error || 'Submission could not be completed.');
          }
        }

        lastSubmittedTitle = title;
        lastSubmitTime = Date.now();

        // Show Success Modal
        openSuccessModal(title, category);
        showToast('Idea submitted successfully!', 'success');

        // Reset form
        form.reset();
        categoryChips.forEach((c, idx) => {
          c.classList.toggle('active', idx === 0);
          c.setAttribute('aria-checked', idx === 0 ? 'true' : 'false');
        });
        if (categoryHidden) categoryHidden.value = 'Cultural Events';
        updateCharCounts();
      } catch (err) {
        console.warn('Submission error:', err);
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

  // 5. Success Modal Handling
  function setupModals() {
    if (successModalClose) {
      successModalClose.addEventListener('click', closeSuccessModal);
    }
    if (successModalAnother) {
      successModalAnother.addEventListener('click', closeSuccessModal);
    }
    if (successModal) {
      successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
          closeSuccessModal();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && successModal && successModal.classList.contains('is-active')) {
        closeSuccessModal();
      }
    });
  }

  function openSuccessModal(title, category) {
    if (successPreviewTitle) successPreviewTitle.textContent = title;
    if (successPreviewCategory) successPreviewCategory.textContent = category;
    if (successModal) successModal.classList.add('is-active');
  }

  function closeSuccessModal() {
    if (successModal) successModal.classList.remove('is-active');
  }

  // 6. Toast Notification Helper
  function showToast(message, type = 'success') {
    if (!toastNotice || !toastText) return;

    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }

    toastText.textContent = message;
    if (toastIcon) {
      toastIcon.textContent = type === 'success' ? '✓' : 'ℹ';
    }

    toastNotice.className = `toast-notice ${type} show`;

    toastTimer = setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 3500);
  }

  window.showToast = showToast;
})();

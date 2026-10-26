/**
 * CULTURAL TEAM — QR CODE PAGE CONTROLLER
 * 
 * Handles:
 * - Dynamic QR URL resolution
 * - Clipboard copying with automatic fallback
 * - Visual feedback states & toast notification
 * - Flyer printing action
 */

(function () {
  'use strict';

  const copyBtn = document.getElementById('copy-link-btn');
  const printBtn = document.getElementById('print-flyer-btn');
  const qrUrlDisplay = document.getElementById('qr-url-display');
  const toastNotice = document.getElementById('toast-notice');
  const toastText = document.getElementById('toast-text');
  const toastIcon = document.getElementById('toast-icon');
  let toastTimer = null;

  document.addEventListener('DOMContentLoaded', () => {
    initQRUrl();
    setupCopyButton();
    setupPrintButton();
  });

  function getTargetUrl() {
    return window.APP_CONFIG?.productionUrl || 'https://cultural-team-git-main-culturalteam.vercel.app';
  }

  function initQRUrl() {
    const url = getTargetUrl();
    if (qrUrlDisplay) {
      qrUrlDisplay.textContent = url;
    }
  }

  function setupCopyButton() {
    if (!copyBtn) return;

    copyBtn.addEventListener('click', () => {
      const url = getTargetUrl();

      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(url).then(() => {
          showCopySuccess();
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
      showCopySuccess();
    } catch (e) {
      showToast('Could not copy automatically. Please copy the URL manually.', 'danger');
    }
    document.body.removeChild(ta);
  }

  function showCopySuccess() {
    if (copyBtn) {
      const origText = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>✓ Link Copied!</span>
      `;
      copyBtn.classList.add('copied');

      setTimeout(() => {
        copyBtn.innerHTML = origText;
        copyBtn.classList.remove('copied');
      }, 2200);
    }
    showToast('Public link copied to clipboard!', 'success');
  }

  function setupPrintButton() {
    if (!printBtn) return;
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

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

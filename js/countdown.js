/**
 * CULTURAL TEAM — LIVE FRESHERS' HALLOWEEN PARTY COUNTDOWN
 * 
 * Target Deadline: Friday, 30 October 2026, 6:00:00 PM IST (Asia/Kolkata, UTC+05:30)
 * Exact Target ISO: "2026-10-30T18:00:00+05:30"
 * 
 * Format:
 * "03 DAYS : 18 HOURS : 24 MINUTES : 45 SECONDS"
 * 
 * Behavior:
 * - Dynamic calculation using real-time Date.now()
 * - Updates every 1000ms
 * - Clean teardown & visibility handling
 * - Timezone-agnostic calculation (target in absolute ms)
 * - Zero-padded numbers for all units
 * - At zero: displays "THE PARTY STARTS NOW!" and stops timer
 * - Never restarts or displays negative values
 */

(function () {
  'use strict';

  const TARGET_ISO = (typeof window !== 'undefined' && window.APP_CONFIG?.countdown?.targetIso) || '2026-10-30T18:00:00+05:30';
  const TARGET_TIMESTAMP = Date.parse(TARGET_ISO); // 1793363400000 ms
  const COMPLETION_MSG = (typeof window !== 'undefined' && window.APP_CONFIG?.countdown?.completionMessage) || 'THE PARTY STARTS NOW!';

  let timerInterval = null;
  let isComplete = false;

  function getNow() {
    if (typeof window !== 'undefined' && typeof window.__mockNow === 'number') {
      return window.__mockNow;
    }
    return Date.now();
  }

  function pad(n) {
    return String(Math.max(0, Math.floor(n))).padStart(2, '0');
  }

  function calculateRemaining(targetMs, nowMs) {
    const diff = targetMs - nowMs;
    if (diff <= 0) {
      return {
        isComplete: true,
        diff: 0,
        days: '00',
        hours: '00',
        minutes: '00',
        seconds: '00',
        formatted: '00 DAYS : 00 HOURS : 00 MINUTES : 00 SECONDS',
        message: COMPLETION_MSG
      };
    }

    const totalSec = Math.floor(diff / 1000);
    const seconds = totalSec % 60;
    const totalMinutes = Math.floor(totalSec / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;
    const days = Math.floor(totalHours / 24);

    const formatted = `${pad(days)} DAYS : ${pad(hours)} HOURS : ${pad(minutes)} MINUTES : ${pad(seconds)} SECONDS`;

    return {
      isComplete: false,
      diff,
      days: pad(days),
      hours: pad(hours),
      minutes: pad(minutes),
      seconds: pad(seconds),
      formatted,
      message: null
    };
  }

  function updateDOM() {
    const now = getNow();
    const remaining = calculateRemaining(TARGET_TIMESTAMP, now);

    // Target elements
    const daysEl = document.getElementById('timer-days');
    const hoursEl = document.getElementById('timer-hours');
    const minutesEl = document.getElementById('timer-minutes');
    const secondsEl = document.getElementById('timer-seconds');
    const fullTimerEl = document.getElementById('halloween-countdown-timer');
    const announcementTimerEl = document.getElementById('announcement-countdown-timer');
    const drawerTimerEl = document.getElementById('drawer-countdown-timer');
    const displayContainer = document.getElementById('halloween-countdown-display');
    const sectionContainer = document.getElementById('halloween-countdown-section');

    if (remaining.isComplete) {
      if (!isComplete) {
        isComplete = true;
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
      }

      if (displayContainer) {
        displayContainer.innerHTML = `<div class="countdown-complete-msg" id="countdown-complete-msg">${COMPLETION_MSG}</div>`;
      }
      if (fullTimerEl) {
        fullTimerEl.textContent = COMPLETION_MSG;
        fullTimerEl.classList.add('is-complete');
      }
      if (announcementTimerEl) {
        announcementTimerEl.textContent = COMPLETION_MSG;
      }
      if (drawerTimerEl) {
        drawerTimerEl.textContent = COMPLETION_MSG;
      }
      if (sectionContainer) {
        sectionContainer.classList.add('is-complete');
      }
      return;
    }

    // Update individual units
    if (daysEl) daysEl.textContent = remaining.days;
    if (hoursEl) hoursEl.textContent = remaining.hours;
    if (minutesEl) minutesEl.textContent = remaining.minutes;
    if (secondsEl) secondsEl.textContent = remaining.seconds;

    // Update formatted text elements
    if (fullTimerEl) fullTimerEl.textContent = remaining.formatted;
    if (announcementTimerEl) announcementTimerEl.textContent = remaining.formatted;
    if (drawerTimerEl) drawerTimerEl.textContent = remaining.formatted;
  }

  function initCountdown() {
    updateDOM();

    if (!timerInterval && !isComplete) {
      timerInterval = setInterval(updateDOM, 1000);
    }

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('focus', updateDOM);
    }
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) updateDOM();
      });
    }
  }

  // Export to global for testing & interoperability
  if (typeof window !== 'undefined') {
    window.APP_COUNTDOWN = {
      targetIso: TARGET_ISO,
      targetTimestamp: TARGET_TIMESTAMP,
      calculateRemaining: (nowMs) => calculateRemaining(TARGET_TIMESTAMP, typeof nowMs === 'number' ? nowMs : getNow()),
      update: updateDOM,
      stop: () => {
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
      },
      init: initCountdown
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initCountdown);
    } else {
      initCountdown();
    }
  }
})();

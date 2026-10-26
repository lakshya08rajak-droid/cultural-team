/**
 * CULTURAL TEAM — TOP NAVIGATION & DRAWER CONTROLLER
 * 
 * Handles:
 * - Hamburger toggle button
 * - Navigation drawer open/close
 * - Outside click / backdrop dismiss
 * - Keyboard Escape accessibility
 */

(function () {
  'use strict';

  function initHeader() {
    const toggleBtn = document.getElementById('header-hamburger-toggle');
    const drawer = document.getElementById('nav-drawer');
    const backdrop = document.getElementById('nav-drawer-backdrop');
    const closeBtn = document.getElementById('drawer-close-btn');

    if (!toggleBtn || !drawer) return;

    function openDrawer() {
      drawer.classList.add('is-open');
      if (backdrop) backdrop.classList.add('is-open');
      drawer.removeAttribute('inert');
      toggleBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';

      // Focus close button for accessibility
      if (closeBtn) closeBtn.focus();
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      if (backdrop) backdrop.classList.remove('is-open');
      drawer.setAttribute('inert', '');
      toggleBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      toggleBtn.focus();
    }

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (drawer.classList.contains('is-open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeDrawer);
    }

    if (backdrop) {
      backdrop.addEventListener('click', closeDrawer);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });

    // Close on navigation click
    const navLinks = drawer.querySelectorAll('.drawer-nav-item, .drawer-cta-btn');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        closeDrawer();
      });
    });

    // Mark current active link
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href === currentPath || (currentPath === '' && href === '/'))) {
        link.classList.add('is-active');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeader);
  } else {
    initHeader();
  }
})();

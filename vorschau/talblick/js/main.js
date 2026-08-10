'use strict';

// ── Footer year ─────────────────────────────────────
(function () {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
})();

// ── Mobile nav toggle ────────────────────────────────
(function () {
  const toggle = document.getElementById('nav-toggle');
  const menu   = document.getElementById('nav-menu');
  const nav    = document.getElementById('main-nav');
  if (!toggle || !menu) return;

  let isOpen = false;

  function openMenu() {
    isOpen = true;
    menu.classList.add('nav__menu--open');
    menu.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Navigation schließen');
    document.body.style.overflow = 'hidden';
    const bars = toggle.querySelectorAll('.nav__toggle-bar');
    if (bars[0]) bars[0].style.transform = 'translateY(7px) rotate(45deg)';
    if (bars[1]) bars[1].style.opacity   = '0';
    if (bars[2]) bars[2].style.transform = 'translateY(-7px) rotate(-45deg)';
  }

  function closeMenu() {
    isOpen = false;
    menu.classList.remove('nav__menu--open');
    menu.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Navigation öffnen');
    document.body.style.overflow = '';
    const bars = toggle.querySelectorAll('.nav__toggle-bar');
    if (bars[0]) bars[0].style.transform = '';
    if (bars[1]) bars[1].style.opacity   = '';
    if (bars[2]) bars[2].style.transform = '';
  }

  toggle.addEventListener('click', () => isOpen ? closeMenu() : openMenu());

  // Close on any anchor link click
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) { closeMenu(); toggle.focus(); }
  });

  // Close on click outside menu and toggle
  document.addEventListener('click', e => {
    if (isOpen && nav && !nav.contains(e.target) && !menu.contains(e.target)) closeMenu();
  });
})();

// ── Smooth scroll with combined offset ──────────────
(function () {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
      const id     = this.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();

      const emergencyH = document.getElementById('emergency-banner')?.offsetHeight || 44;
      const navH       = document.getElementById('main-nav')?.offsetHeight          || 72;
      const offset     = emergencyH + navH + 12;
      const top        = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

// ── Scroll reveal ─────────────────────────────────────
(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  function observeAll() {
    const items = document.querySelectorAll('.reveal:not(.reveal--visible)');
    if (prefersReduced) { items.forEach(el => el.classList.add('reveal--visible')); return; }
    items.forEach(el => obs.observe(el));
  }

  observeAll();
  // Expose so cms-content.js can re-observe elements it renders after this runs
  window.cmsObserveReveal = observeAll;
})();

// ── Nav active link scroll spy ───────────────────────
(function () {
  const allNavLinks = document.querySelectorAll('.nav__link[href^="#"]');
  if (!allNavLinks.length) return;

  // Build unique section → link map
  const sectionMap = new Map();
  allNavLinks.forEach(link => {
    const id      = link.getAttribute('href').slice(1);
    const section = document.getElementById(id);
    if (section && !sectionMap.has(section)) sectionMap.set(section, []);
    if (section) sectionMap.get(section).push(link);
  });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const links = sectionMap.get(entry.target);
      if (!links) return;
      if (entry.isIntersecting) {
        allNavLinks.forEach(l => l.classList.remove('nav__link--active'));
        links.forEach(l => l.classList.add('nav__link--active'));
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sectionMap.forEach((_, section) => obs.observe(section));
})();

// ── Contact form validation ──────────────────────────
(function () {
  const form    = document.getElementById('contact-form');
  const success = document.getElementById('cf-success');
  const submit  = document.getElementById('cf-submit');
  if (!form || !success || !submit) return;

  function setError(groupId, hasError) {
    const grp = document.getElementById(groupId);
    if (grp) grp.classList.toggle('has-error', hasError);
  }

  function clearError(input) {
    input.closest('.cf-group')?.classList.remove('has-error');
  }

  // Real-time error clearing on input
  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input',  () => clearError(el));
    el.addEventListener('change', () => clearError(el));
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Clear previous errors
    form.querySelectorAll('.cf-group').forEach(g => g.classList.remove('has-error'));

    const name  = document.getElementById('cf-name');
    const phone = document.getElementById('cf-phone');
    const type  = document.getElementById('cf-type');

    let valid = true;
    if (!name?.value.trim())  { setError('grp-name',  true); valid = false; }
    if (!phone?.value.trim()) { setError('grp-phone', true); valid = false; }
    if (!type?.value)         { setError('grp-type',  true); valid = false; }

    if (!valid) {
      form.querySelector('.has-error input, .has-error select')?.focus();
      return;
    }

    // Submit state
    const origHTML  = submit.innerHTML;
    const errorEl   = document.getElementById('cf-error-general');
    submit.disabled = true;
    submit.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Wird gesendet …';
    if (errorEl) errorEl.hidden = true;

    // Design-Beispiel: kein echter Versand, nur UI-Demo.
    setTimeout(() => {
      form.hidden    = true;
      success.hidden = false;
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
  });
})();

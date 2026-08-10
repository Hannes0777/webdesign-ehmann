'use strict';

/* =====================================================
   SEEBLICK WALDSCHÄNKE & BOOTSVERLEIH — main.js (Design-Beispiel)
   ===================================================== */

// ── Dynamic values ────────────────────────────────────
(function () {
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const dateEl = document.getElementById('f-date');
  if (dateEl) dateEl.min = new Date().toISOString().split('T')[0];
})();

// ── Sticky navigation ─────────────────────────────────
(function () {
  const nav  = document.getElementById('main-nav');
  const hero = document.getElementById('hero');
  if (!nav || !hero) return;

  new IntersectionObserver(
    ([e]) => nav.classList.toggle('nav--scrolled', !e.isIntersecting),
    { threshold: 0.05 }
  ).observe(hero);
})();

// ── Mobile menu ───────────────────────────────────────
(function () {
  const toggle = document.getElementById('nav-toggle');
  const menu   = document.getElementById('nav-menu');
  const nav    = document.getElementById('main-nav');
  if (!toggle || !menu) return;

  let isOpen = false;

  function open() {
    isOpen = true;
    menu.classList.add('nav__menu--open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Navigation schließen');
    document.body.style.overflow = 'hidden';

    // Animate bars to X
    const bars = toggle.querySelectorAll('.nav__toggle-bar');
    if (bars[0]) bars[0].style.transform = 'translateY(7px) rotate(45deg)';
    if (bars[1]) bars[1].style.opacity   = '0';
    if (bars[2]) bars[2].style.transform = 'translateY(-7px) rotate(-45deg)';

    // Focus first link
    const firstLink = menu.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function close() {
    isOpen = false;
    menu.classList.remove('nav__menu--open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Navigation öffnen');
    document.body.style.overflow = '';

    const bars = toggle.querySelectorAll('.nav__toggle-bar');
    if (bars[0]) bars[0].style.transform = '';
    if (bars[1]) bars[1].style.opacity   = '';
    if (bars[2]) bars[2].style.transform = '';
  }

  toggle.addEventListener('click', () => isOpen ? close() : open());

  // Close on link click
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) { close(); toggle.focus(); }
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (isOpen && nav && !nav.contains(e.target)) close();
  });
})();

// ── Smooth scroll with nav offset ─────────────────────
(function () {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
      const id     = this.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();
      const navH = document.getElementById('main-nav')?.offsetHeight || 72;
      const top  = target.getBoundingClientRect().top + window.scrollY - navH - 8;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

// ── Scroll reveal ─────────────────────────────────────
(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('.reveal');

  if (prefersReduced) {
    items.forEach(el => el.classList.add('reveal--visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  items.forEach(el => observer.observe(el));
})();

// ── Nav scroll spy ────────────────────────────────────
(function () {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav__link[href^="#"]');
  if (!sections.length || !links.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(link => {
          link.classList.toggle(
            'nav__link--active',
            link.getAttribute('href') === '#' + entry.target.id
          );
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => observer.observe(s));
})();

// ── Form validation ───────────────────────────────────
(function () {
  const form      = document.getElementById('contact-form');
  const submitBtn = document.getElementById('form-submit-btn');
  const resultEl  = document.getElementById('form-result');
  if (!form) return;

  const rules = {
    'f-name':    {
      test: v => v.trim().length >= 2,
      msg:  'Bitte geben Sie Ihren Namen ein (mind. 2 Zeichen).'
    },
    'f-email':   {
      test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      msg:  'Bitte eine gültige E-Mail-Adresse eingeben.'
    },
    'f-date':    {
      test: v => {
        if (!v) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(v) >= today;
      },
      msg: 'Bitte ein Datum ab heute wählen.'
    },
    'f-boat':    {
      test: v => v !== '',
      msg:  'Bitte einen Bootstyp auswählen.'
    },
    'f-persons': {
      test: v => {
        const n = parseInt(v, 10);
        return !isNaN(n) && n >= 1 && n <= 250;
      },
      msg: 'Bitte Anzahl der Personen angeben (1–250).'
    }
  };

  function getGroup(field) { return field.closest('.form-group'); }

  function setError(field, msg) {
    const group   = getGroup(field);
    const errorEl = document.getElementById(field.id + '-error');
    group?.classList.add('form-group--error');
    group?.classList.remove('form-group--success');
    if (errorEl) errorEl.textContent = msg;
    field.setAttribute('aria-invalid', 'true');
    return false;
  }

  function clearError(field) {
    const group   = getGroup(field);
    const errorEl = document.getElementById(field.id + '-error');
    group?.classList.remove('form-group--error');
    group?.classList.add('form-group--success');
    if (errorEl) errorEl.textContent = '';
    field.setAttribute('aria-invalid', 'false');
    return true;
  }

  function validate(id) {
    const field = document.getElementById(id);
    if (!field) return true;
    const rule = rules[id];
    return rule.test(field.value) ? clearError(field) : setError(field, rule.msg);
  }

  // Validate on blur
  Object.keys(rules).forEach(id => {
    const field = document.getElementById(id);
    if (!field) return;
    field.addEventListener('blur',   () => validate(id));
    field.addEventListener('change', () => validate(id));
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    // Honeypot
    const hp = form.querySelector('#f-website');
    if (hp && hp.value) { showSuccess(); return; }

    // Validate all
    let valid = true;
    let firstBad = null;

    Object.keys(rules).forEach(id => {
      if (!validate(id)) {
        valid = false;
        if (!firstBad) firstBad = document.getElementById(id);
      }
    });

    if (!valid) { firstBad?.focus(); return; }

    // Loading state
    submitBtn.disabled = true;
    const btnText = submitBtn.querySelector('.btn__text');
    if (btnText) btnText.textContent = 'Wird gesendet …';

    // Design-Beispiel: kein echter Versand, nur UI-Demo.
    setTimeout(() => {
      showSuccess();
      form.reset();
      form.querySelectorAll('.form-group--success, .form-group--error')
        .forEach(g => g.classList.remove('form-group--success', 'form-group--error'));
    }, 500);
  });

  function resetButton() {
    submitBtn.disabled = false;
    const btnText = submitBtn.querySelector('.btn__text');
    if (btnText) btnText.textContent = 'Anfrage absenden';
  }

  function showSuccess() {
    resetButton();
    if (!resultEl) return;
    resultEl.textContent = 'Vielen Dank! Ihre Anfrage ist eingegangen. Wir melden uns so schnell wie möglich bei Ihnen.';
    resultEl.className   = 'form-result form-result--success';
    resultEl.hidden      = false;
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    setTimeout(() => { resultEl.hidden = true; }, 9000);
  }

  function showError() {
    resetButton();
    if (!resultEl) return;
    resultEl.textContent = 'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es später erneut oder rufen Sie uns an.';
    resultEl.className   = 'form-result form-result--error';
    resultEl.hidden      = false;
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
})();

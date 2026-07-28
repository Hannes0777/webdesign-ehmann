/* ============================================================
   NAVIGATION: scrolled state + mobile toggle
   ============================================================ */
const nav = document.getElementById('main-nav');
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
const navBackdrop = document.getElementById('nav-backdrop');

function setScrolled() {
  const scrolled = window.scrollY > 40;
  nav.classList.toggle('nav--scrolled', scrolled);
}
setScrolled();
window.addEventListener('scroll', setScrolled, { passive: true });

/* Hintergrund-Scroll sperren, solange das Menü offen ist. Nur
   overflow:hidden reicht auf iOS Safari nicht zuverlässig - body wird
   zusätzlich fixiert und die Scroll-Position beim Öffnen/Schließen
   ausgeglichen, damit die Seite nicht springt. */
let navScrollY = 0;

function openNavMenu() {
  navScrollY = window.scrollY;
  document.body.style.top = `-${navScrollY}px`;
  document.body.classList.add('nav-open');
  navMenu.classList.add('is-open');
  if (navBackdrop) navBackdrop.classList.add('is-open');
  navToggle.setAttribute('aria-expanded', 'true');
  navToggle.setAttribute('aria-label', 'Navigation schließen');
}

function closeNavMenu() {
  document.body.classList.remove('nav-open');
  document.body.style.top = '';
  window.scrollTo(0, navScrollY);
  navMenu.classList.remove('is-open');
  if (navBackdrop) navBackdrop.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Navigation öffnen');
}

navToggle.addEventListener('click', () => {
  if (navMenu.classList.contains('is-open')) {
    closeNavMenu();
  } else {
    openNavMenu();
  }
});

navMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeNavMenu);
});

if (navBackdrop) {
  navBackdrop.addEventListener('click', closeNavMenu);
}

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealEls.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );
  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

/* ============================================================
   LEISTUNGEN — CMS-Karte per Klick "aufplobben" lassen und beide
   CTAs zu einem gemeinsamen Button verschmelzen
   ============================================================ */
const leistungSection = document.getElementById('leistungen');
const leistungAddon = document.getElementById('leistung-addon');
const leistungConnector = document.querySelector('.leistung-connector');
const leistungCmsBtn = leistungAddon ? leistungAddon.querySelector('.btn') : null;
const leistungCombinedBtn = document.getElementById('leistung-combined-btn');
const cmsSelect = document.getElementById('f-cms');

function setLeistungExpanded(expanded) {
  if (!leistungAddon) return;
  leistungAddon.classList.toggle('is-expanded', expanded);
  if (leistungSection) leistungSection.classList.toggle('leistungen--expanded', expanded);
  if (leistungConnector) leistungConnector.classList.toggle('is-active', expanded);
}

function goToKontaktMitCms() {
  setLeistungExpanded(true);
  if (cmsSelect) cmsSelect.value = 'Ja, mit CMS-System';
  window.setTimeout(() => {
    const kontakt = document.getElementById('kontakt');
    if (kontakt) kontakt.scrollIntoView({ behavior: 'smooth' });
  }, 500);
}

if (leistungConnector) {
  leistungConnector.addEventListener('click', () => {
    setLeistungExpanded(!leistungAddon.classList.contains('is-expanded'));
  });
  leistungConnector.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setLeistungExpanded(!leistungAddon.classList.contains('is-expanded'));
  });
}

if (leistungCmsBtn) {
  leistungCmsBtn.addEventListener('click', (event) => {
    event.preventDefault();
    goToKontaktMitCms();
  });
}

if (leistungCombinedBtn) {
  leistungCombinedBtn.addEventListener('click', (event) => {
    event.preventDefault();
    goToKontaktMitCms();
  });
}

/* ============================================================
   CONTACT FORM
   ============================================================ */
const form = document.getElementById('contact-form');
const success = document.getElementById('form-success');
const errorEl = document.getElementById('form-error-general');

const WORKER_URL = 'https://contact-form-webdesign-ehmann.ehmann-hannes07.workers.dev';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = form.querySelector('#f-email');
    if (email && email.value && !isValidEmail(email.value)) {
      email.focus();
      return;
    }

    const btn = form.querySelector('[type="submit"]');
    const btnText = btn.querySelector('.btn__text');
    const originalText = btnText.textContent;
    btnText.textContent = 'Wird gesendet…';
    btn.disabled = true;
    if (errorEl) errorEl.hidden = true;

    const data = Object.fromEntries(new FormData(form).entries());

    fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((res) => res.json().then((body) => ({ ok: res.ok && body.ok, body })))
      .then(({ ok, body }) => {
        if (!ok) throw new Error(body && body.error ? body.error : 'Versand fehlgeschlagen');
        form.hidden = true;
        success.hidden = false;
      })
      .catch(() => {
        btnText.textContent = originalText;
        btn.disabled = false;
        if (errorEl) errorEl.hidden = false;
      });
  });
}

/* ============================================================
   FOOTER YEAR
   ============================================================ */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

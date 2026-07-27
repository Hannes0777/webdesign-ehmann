/* ============================================================
   NAVIGATION: scrolled state + mobile toggle
   ============================================================ */
const nav = document.getElementById('main-nav');
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

function setScrolled() {
  const scrolled = window.scrollY > 40;
  nav.classList.toggle('nav--scrolled', scrolled);
}
setScrolled();
window.addEventListener('scroll', setScrolled, { passive: true });

navToggle.addEventListener('click', () => {
  const open = navMenu.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Navigation schließen' : 'Navigation öffnen');
});

navMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

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

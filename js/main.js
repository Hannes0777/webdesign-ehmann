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
  navToggle.setAttribute('aria-expanded', 'true');
  navToggle.setAttribute('aria-label', 'Navigation schließen');
}

function closeNavMenu() {
  document.body.classList.remove('nav-open');
  document.body.style.top = '';
  window.scrollTo(0, navScrollY);
  navMenu.classList.remove('is-open');
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

/* ============================================================
   CURSOR-GLOW — site-weiter Licht-Punkt, folgt der Maus über die
   ganze Seite (nicht nur die Hero-Karte). Nur auf Geräten mit
   echtem Maus-Zeiger und ohne prefers-reduced-motion; position:fixed
   im CSS sorgt dafür, dass er auch während der gepinnten Hero-Scroll-
   Animation sichtbar bleibt.

   Bewegt sich die Maus länger nicht, übernimmt ein sanftes Eigenleben:
   der Punkt driftet langsam zu wechselnden Zielen über die Fläche,
   bis die Maus sich wieder bewegt (dann sofort zurück auf direktes
   Tracking).
   ============================================================ */
const cursorGlow = document.getElementById('cursor-glow');
const gridSpotlights = document.querySelectorAll('.grid-spotlight');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

if ((cursorGlow || gridSpotlights.length) && hasFinePointer && !prefersReducedMotion) {
  const IDLE_DELAY_MS = 2500;
  const DRIFT_RETARGET_MS = 4500;
  const DRIFT_EASE_PER_MS = 0.0006;

  let currentX = window.innerWidth / 2;
  let currentY = window.innerHeight / 2;
  let driftTargetX = currentX;
  let driftTargetY = currentY;
  let idleTimeoutId = null;
  let driftRafId = null;
  let driftRetargetId = null;
  let lastDriftFrame = 0;

  function setSpotlightPosition(x, y) {
    document.documentElement.style.setProperty('--mx', `${x}px`);
    document.documentElement.style.setProperty('--my', `${y}px`);
  }

  function activateSpotlights() {
    if (cursorGlow) cursorGlow.classList.add('is-active');
    gridSpotlights.forEach((el) => el.classList.add('is-active'));
  }

  function pickDriftTarget() {
    const margin = 140;
    driftTargetX = margin + Math.random() * Math.max(1, window.innerWidth - margin * 2);
    driftTargetY = margin + Math.random() * Math.max(1, window.innerHeight - margin * 2);
  }

  function driftFrame(now) {
    const dt = lastDriftFrame ? now - lastDriftFrame : 16;
    lastDriftFrame = now;
    const ease = Math.min(1, DRIFT_EASE_PER_MS * dt);
    currentX += (driftTargetX - currentX) * ease;
    currentY += (driftTargetY - currentY) * ease;
    setSpotlightPosition(currentX, currentY);
    driftRafId = requestAnimationFrame(driftFrame);
  }

  function startDrifting() {
    if (driftRafId) return;
    pickDriftTarget();
    lastDriftFrame = 0;
    activateSpotlights();
    driftRafId = requestAnimationFrame(driftFrame);
    driftRetargetId = setInterval(pickDriftTarget, DRIFT_RETARGET_MS);
  }

  function stopDrifting() {
    if (driftRafId) {
      cancelAnimationFrame(driftRafId);
      driftRafId = null;
    }
    if (driftRetargetId) {
      clearInterval(driftRetargetId);
      driftRetargetId = null;
    }
  }

  function scheduleIdleDrift() {
    clearTimeout(idleTimeoutId);
    idleTimeoutId = setTimeout(startDrifting, IDLE_DELAY_MS);
  }

  let moveRafId = null;
  window.addEventListener(
    'mousemove',
    (event) => {
      stopDrifting();
      scheduleIdleDrift();
      if (moveRafId) return;
      moveRafId = requestAnimationFrame(() => {
        moveRafId = null;
        currentX = event.clientX;
        currentY = event.clientY;
        setSpotlightPosition(currentX, currentY);
        activateSpotlights();
      });
    },
    { passive: true }
  );

  scheduleIdleDrift();
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
   LEISTUNGEN — Paket-CTAs wählen das Paket im Kontaktformular vor
   (Kontakt ist eine eigene Seite: Paket wird als URL-Parameter
   mitgegeben und dort ausgelesen, siehe unten)
   ============================================================ */
function goToKontaktMitPaket(paketName) {
  const url = paketName ? 'kontakt.html?paket=' + encodeURIComponent(paketName) : 'kontakt.html';
  window.location.href = url;
}

document.querySelectorAll('.pricing-card__cta').forEach((btn) => {
  btn.addEventListener('click', (event) => {
    event.preventDefault();
    goToKontaktMitPaket(btn.dataset.paket);
  });
});

const leistungCombinedBtn = document.getElementById('leistung-combined-btn');
if (leistungCombinedBtn) {
  leistungCombinedBtn.addEventListener('click', (event) => {
    event.preventDefault();
    goToKontaktMitPaket('');
  });
}

/* ── Kontaktseite: Paket aus URL-Parameter vorwählen ───────── */
const paketSelect = document.getElementById('f-paket');
if (paketSelect) {
  const params = new URLSearchParams(window.location.search);
  const paket = params.get('paket');
  if (paket) paketSelect.value = paket;
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

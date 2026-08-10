/* ============================================================
   LANDMETZGEREI SONNENHOF — main.js (Design-Beispiel)
   ============================================================ */

/* ── Year ─────────────────────────────────────────────────── */
document.getElementById('year').textContent = new Date().getFullYear();

/* ── GSAP Registration ────────────────────────────────────── */
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  initGSAP();
} else {
  initFallbackAnimations();
}

/* ============================================================
   GSAP ANIMATIONS
   ============================================================ */
function initGSAP() {

  /* ── Hero entrance ────────────────────────────────────── */
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  heroTl
    .from('.hero__bg', { scale: 1.1, duration: 1.8 }, 0)
    .to('.hero__eyebrow', { opacity: 1, y: 0, duration: .9 }, .3)
    .from('.hero__title-line:nth-child(1)', { y: 80, opacity: 0, duration: 1 }, .5)
    .from('.hero__title-line:nth-child(2)', { y: 80, opacity: 0, duration: 1 }, .7)
    .to('.hero__subtitle', { opacity: 1, y: 0, duration: .8 }, .9)
    .to('.hero__ctas', { opacity: 1, y: 0, duration: .8 }, 1.05)
    .to('.hero__badge--1', { opacity: 1, duration: .6 }, 1.3)
    .to('.hero__badge--2', { opacity: 1, duration: .6 }, 1.5);

  /* ── Hero parallax ────────────────────────────────────── */
  gsap.to('.hero__bg', {
    yPercent: 30,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });

  /* ── Stat counters ────────────────────────────────────── */
  document.querySelectorAll('.stat-card__number').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    el.textContent = '0';
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter() {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2,
          ease: 'power2.out',
          onUpdate() { el.textContent = Math.round(obj.val); }
        });
      }
    });
  });

  /* ── Scroll-reveal (all [data-animate]) ─────────────── */
  // Group elements by their parent so we can stagger siblings
  const animGroups = {};
  gsap.utils.toArray('[data-animate]').forEach(el => {
    const parentKey = el.parentElement ? el.parentElement.className : 'root';
    if (!animGroups[parentKey]) animGroups[parentKey] = [];
    animGroups[parentKey].push(el);
  });

  gsap.utils.toArray('[data-animate]').forEach(el => {
    // Delay aus data-delay wird gestaucht, damit gestaffelte Gruppen
    // nicht bei schnellem Scrollen spürbar hinterherhängen.
    const delay = Math.min(parseFloat(el.dataset.delay || 0), 0.3) * 0.5;
    const dir   = el.dataset.animate;
    const init  = { opacity: 0 };
    if (dir === 'fade-up')    init.y = 20;
    if (dir === 'fade-right') init.x = -20;
    if (dir === 'fade-left')  init.x = 20;

    // gsap.set overrides the CSS opacity:0 rule with an inline style
    gsap.set(el, init);

    // gsap.to animates to fully visible. onComplete fügt .visible hinzu
    // UND clearProps entfernt danach das Inline-transform:
    // [data-animate] hat als CSS-Fallback (für Browser ohne JS)
    // "transform: translateY(40px)" - ohne .visible-Klasse fällt das
    // Element auf genau diesen Versatz zurück, sobald kein Inline-Style
    // mehr vorhanden ist. Mit .visible (transform:translate(0)) ist der
    // korrekte Ruhezustand auch ohne Inline-Style definiert - dadurch
    // kann das Inline-transform gefahrlos entfernt werden, was wiederum
    // nötig ist, damit CSS-:hover-transforms oder eigenes JS (z.B.
    // Stat-Card-Tilt) danach nicht mit einem alten Inline-Wert kollidieren.
    gsap.to(el, {
      opacity: 1, x: 0, y: 0,
      duration: .45,
      delay,
      ease: 'power3.out',
      clearProps: 'transform',
      onComplete() { el.classList.add('visible'); },
      scrollTrigger: {
        trigger: el,
        start: 'top 100%',
        once: true
      }
    });
  });

  /* ── Timeline items ──────────────────────────────────── */
  gsap.from('.timeline-item', {
    x: -30, opacity: 0,
    duration: .5,
    stagger: .12,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.ueber-uns__timeline',
      start: 'top 97%',
      once: true
    }
  });

  /* ── Quality badges in intro ─────────────────────────── */
  gsap.from('.quality-badge', {
    scale: .8, opacity: 0,
    duration: .4,
    stagger: .06,
    ease: 'back.out(1.7)',
    scrollTrigger: {
      trigger: '.intro-statement__badges',
      start: 'top 97%',
      once: true
    }
  });

  /* ── Partyservice features ───────────────────────────── */
  gsap.from('.ps-feature', {
    x: -30, opacity: 0,
    duration: .5,
    stagger: .1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.partyservice__info',
      start: 'top 97%',
      once: true
    }
  });

  /* ── Section big title character reveal ─────────────── */
  if (typeof SplitText !== 'undefined') {
    document.querySelectorAll('.section-title').forEach(el => {
      const split = new SplitText(el, { type: 'chars,words' });
      gsap.from(split.chars, {
        opacity: 0,
        y: 30,
        rotateX: -40,
        stagger: .015,
        duration: .5,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 97%', once: true }
      });
    });
  }

  /* ── Hours rows ──────────────────────────────────────── */
  gsap.from('.hours-row', {
    x: -20, opacity: 0,
    duration: .4,
    stagger: .05,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.hours-grid',
      start: 'top 97%',
      once: true
    }
  });

  /* ── Value items ─────────────────────────────────────── */
  gsap.from('.value-item', {
    scale: .9, opacity: 0,
    duration: .5,
    stagger: .08,
    ease: 'back.out(1.5)',
    scrollTrigger: {
      trigger: '.ueber-uns__values',
      start: 'top 97%',
      once: true
    }
  });

  /* ── Generation badge spin-in ────────────────────────── */
  gsap.from('.gen-badge', {
    scale: 0, rotation: -180,
    duration: .7,
    ease: 'back.out(2)',
    scrollTrigger: {
      trigger: '.gen-badge',
      start: 'top 97%',
      once: true
    }
  });

  /* ── Form card slide up ──────────────────────────────── */
  gsap.from('.form-card', {
    y: 60, opacity: 0,
    duration: .7,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.form-card',
      start: 'top 97%',
      once: true
    }
  });

}

/* ============================================================
   FALLBACK (no GSAP)
   ============================================================ */
function initFallbackAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
  animateCounters();
}

function animateCounters() {
  const counters = document.querySelectorAll('.stat-card__number');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.count, 10);
      let current = 0;
      const step = Math.ceil(target / 60);
      const tick = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current;
        if (current >= target) clearInterval(tick);
      }, 25);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => obs.observe(el));
}


/* ============================================================
   NAVIGATION
   ============================================================ */
const nav    = document.getElementById('main-nav');
const toggle = document.getElementById('nav-toggle');
const menu   = document.getElementById('nav-menu');

/* Scroll state */
window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 60);
}, { passive: true });

/* Mobile toggle */
toggle.addEventListener('click', () => {
  const open = toggle.classList.toggle('open');
  menu.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

/* Close on link click */
menu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    toggle.classList.remove('open');
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

/* Aktiver Nav-Link: Mehrseiten-Setup, daher statisch pro Seite im HTML
   gesetzt (nav__link--active) statt per Scroll-Position ermittelt. */


/* ============================================================
   RESPONSIVE INTERNE LINKS
   Handy: eigene Unterseiten (produkte.html, kontakt.html, ...).
   PC: eine lange Seite mit Ankern (index.html#produkte, ...) - wie vor
   der Mehrseiten-Umstellung. Jeder Link mit [data-section] bekommt sein
   href je nach Bildschirmbreite gesetzt statt fest im HTML zu stehen,
   damit ein und dieselbe Seite auf beiden Geräten passend verlinkt.
   Breakpoint deckt sich mit dem Nav-Umbruch in style.css (1024px).
   ============================================================ */
const RESPONSIVE_BREAKPOINT = 1024;
const SECTION_PAGES = {
  produkte: 'produkte.html',
  aktuelles: 'aktuelles.html',
  kontakt: 'kontakt.html',
  'ueber-uns': 'ueber-uns.html',
  partyservice: 'partyservice.html',
};

function isDesktopViewport() {
  return window.innerWidth > RESPONSIVE_BREAKPOINT;
}

function resolveInternalLinks() {
  const onSinglePage = !!document.getElementById('hero'); // nur index.html hat den Hero-Bereich
  const desktop = isDesktopViewport();

  document.querySelectorAll('[data-section]').forEach(a => {
    const section = a.dataset.section;
    const page = SECTION_PAGES[section];
    if (!page) return;
    const anchor = a.dataset.anchor || section;

    if (desktop) {
      a.href = onSinglePage ? `#${anchor}` : `index.html#${anchor}`;
    } else {
      a.href = page + (a.dataset.anchor ? `#${a.dataset.anchor}` : '');
    }
  });
}

resolveInternalLinks();
document.addEventListener('cms-ready', resolveInternalLinks);

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resolveInternalLinks, 150);
});


/* ============================================================
   PROGRESS BAR
   ============================================================ */
const fill = document.getElementById('progress-fill');
window.addEventListener('scroll', () => {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  fill.style.width = `${(window.scrollY / total) * 100}%`;
}, { passive: true });


/* ============================================================
   BACK TO TOP
   ============================================================ */
const btt = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
  btt.classList.toggle('visible', window.scrollY > 500);
}, { passive: true });
btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));


/* ============================================================
   SMOOTH SCROLL (anchor links)
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const offset = 72; // nav height
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});


/* ============================================================
   PARTYSERVICE FORM VALIDATION
   ============================================================ */
const form    = document.getElementById('partyservice-form');
const success = document.getElementById('form-success');

if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (validateForm()) submitForm();
  });

  // Live validation
  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('error')) validateField(field);
    });
  });
}

function validateField(field) {
  const group = field.closest('.form-group');
  if (!group) return true;
  const errorEl = group.querySelector('.form-error');
  let msg = '';

  if (field.type === 'checkbox') {
    if (!field.checked) msg = 'Bitte stimmen Sie zu.';
  } else if (field.required && !field.value.trim()) {
    msg = 'Dieses Feld ist erforderlich.';
  } else if (field.type === 'email' && field.value && !isValidEmail(field.value)) {
    msg = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
  } else if (field.type === 'tel' && field.value && !/^[\d\s\+\-\(\)]{6,20}$/.test(field.value)) {
    msg = 'Bitte geben Sie eine gültige Telefonnummer ein.';
  } else if (field.type === 'date' && field.required && field.value) {
    const chosen = new Date(field.value);
    if (chosen < new Date()) msg = 'Das Datum muss in der Zukunft liegen.';
  } else if (field.type === 'number' && field.value && parseInt(field.value) < 1) {
    msg = 'Mindestens 1 Person.';
  }

  if (errorEl) errorEl.textContent = msg;
  field.classList.toggle('error', !!msg);
  return !msg;
}

function validateForm() {
  let valid = true;
  form.querySelectorAll('input[required], select[required], textarea[required]').forEach(f => {
    if (!validateField(f)) valid = false;
  });
  const consent = form.querySelector('#f-consent');
  if (consent && !validateField(consent)) valid = false;
  return valid;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function submitForm() {
  const btn = form.querySelector('[type="submit"]');
  const btnText = btn.querySelector('.btn__text');
  const errorEl = document.getElementById('form-error-general');
  const originalBtnText = btnText.textContent;
  btnText.textContent = 'Wird gesendet…';
  btn.disabled = true;
  if (errorEl) errorEl.hidden = true;

  // Design-Beispiel: kein echter Versand, nur UI-Demo.
  setTimeout(() => {
    form.style.display = 'none';
    success.hidden = false;
    if (typeof gsap !== 'undefined') {
      gsap.from(success, { opacity: 0, scale: .9, duration: .5, ease: 'back.out(1.5)' });
    }
  }, 500);
}


/* ============================================================
   IMAGE PLACEHOLDER FALLBACK
   Ensure placeholder text shows when img fails
   ============================================================ */
document.querySelectorAll('.produkt-card__img').forEach(img => {
  img.addEventListener('error', () => {
    const wrap = img.closest('.produkt-card__img-wrap');
    if (wrap) wrap.classList.add('img-error');
  });
});


/* ============================================================
   HOVER TILT on stat cards (subtle)
   ============================================================ */
document.querySelectorAll('.stat-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - .5) * 8;
    const y = ((e.clientY - rect.top) / rect.height - .5) * -8;
    card.style.transform = `perspective(600px) rotateY(${x}deg) rotateX(${y}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

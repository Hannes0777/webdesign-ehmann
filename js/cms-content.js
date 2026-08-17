/* ============================================================
   cms-content.js – Loads JSON content files and populates the
   Webdesign Ehmann pages at runtime.
   The CMS (Sveltia) edits these JSON files via GitHub; the host
   (GitHub Pages) serves the static result.

   Design note: this site animates the hero and Design-Stile
   sections with GSAP ScrollTrigger tied to the elements present at
   page load. To avoid breaking those animations, content here is
   updated IN PLACE (existing DOM nodes, text/attributes only)
   rather than rebuilt from scratch, except for list-like content
   (package bullet points) where the array length can genuinely
   change.
   ============================================================ */
'use strict';

(async function () {

  async function fetchJSON(path) {
    try {
      const r = await fetch(path);
      if (!r.ok) throw new Error(r.status);
      return r.json();
    } catch (e) {
      console.warn('[CMS] Could not load', path, e.message);
      return null;
    }
  }

  const [siteinfo, hero, pakete, uebermich, kontakt, rechtliches, cmsErklaerung, marketing, rezensionen] = await Promise.all([
    fetchJSON('content/siteinfo.json'),
    fetchJSON('content/hero.json'),
    fetchJSON('content/pakete.json'),
    fetchJSON('content/uebermich.json'),
    fetchJSON('content/kontakt.json'),
    fetchJSON('content/rechtliches.json'),
    fetchJSON('content/cms-erklaerung.json'),
    fetchJSON('content/marketing.json'),
    fetchJSON('content/rezensionen.json'),
  ]);

  // ── 1. Seiteninfos ────────────────────────────────────────
  // Seitentitel/Meta-Beschreibung aus dem CMS gelten nur für die Startseite
  // (erkennbar am Hero-Bereich #cine-hero) - Impressum/Datenschutz haben
  // ihren eigenen, fest im HTML stehenden <title>/<meta name="description">.
  if (siteinfo && document.getElementById('cine-hero')) {
    if (siteinfo.site_title) document.title = siteinfo.site_title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc && siteinfo.meta_description) desc.setAttribute('content', siteinfo.meta_description);
  }

  // ── 2. Hero ───────────────────────────────────────────────
  if (hero) {
    const line1 = document.getElementById('cine-line-1');
    if (line1 && hero.title_line1) line1.textContent = hero.title_line1;
    const line2 = document.getElementById('cine-line-2');
    if (line2 && hero.title_line2) line2.textContent = hero.title_line2;

    const cardHeading = document.querySelector('#cine-card-text h3');
    if (cardHeading && hero.card_heading) cardHeading.textContent = hero.card_heading;
    const cardText = document.querySelector('#cine-card-text p');
    if (cardText && hero.card_text) cardText.textContent = hero.card_text;

    if (Array.isArray(hero.badges)) {
      hero.badges.forEach((b, i) => {
        const badge = document.getElementById('cine-badge-' + (i + 1));
        if (!badge || !b) return;
        const icon = badge.querySelector('.cine-badge__icon');
        const titel = badge.querySelector('.cine-badge__title');
        const sub = badge.querySelector('.cine-badge__sub');
        if (icon && b.icon) icon.textContent = b.icon;
        if (titel && b.titel) titel.textContent = b.titel;
        if (sub && b.text) sub.textContent = b.text;
      });
    }
  }

  // ── 3. Leistungen (3 Pakete + Zusatz-Hinweise) ────────────
  if (pakete) {
    const offer = document.getElementById('offer-banner');
    if (offer && pakete.sonderangebot_hinweis) offer.textContent = pakete.sonderangebot_hinweis;
    const hint = document.getElementById('pricing-hint');
    if (hint && pakete.preis_hinweis) hint.textContent = pakete.preis_hinweis;

    const cards = document.querySelectorAll('.pricing-card');
    if (Array.isArray(pakete.pakete)) {
      pakete.pakete.forEach((p, i) => {
        const card = cards[i];
        if (!card || !p) return;
        const name = card.querySelector('.pricing-card__name');
        if (name && p.name) name.textContent = p.name;
        const price = card.querySelector('.pricing-card__price');
        if (price) {
          if (p.preis_text) {
            price.textContent = p.preis_text;
            price.classList.add('pricing-card__price--onrequest');
          } else if (p.ab_preis) {
            price.innerHTML = '<span class="pricing-card__price-prefix">ab</span> ' + p.ab_preis + '&nbsp;€';
            price.classList.remove('pricing-card__price--onrequest');
          }
        }
        const tagline = card.querySelector('.pricing-card__tagline');
        if (tagline && p.tagline) tagline.textContent = p.tagline;
        const ul = card.querySelector('.pricing-card__list');
        if (ul && Array.isArray(p.leistungen)) {
          ul.innerHTML = p.leistungen.map((l) => '<li>' + l + '</li>').join('');
        }
        const cta = card.querySelector('.pricing-card__cta');
        if (cta && p.name) {
          cta.textContent = p.name + ' anfragen';
          cta.dataset.paket = p.name;
        }
        card.classList.toggle('pricing-card--featured', !!p.empfohlen);
        let badge = card.querySelector('.pricing-card__badge');
        if (p.empfohlen && !badge) {
          badge = document.createElement('span');
          badge.className = 'pricing-card__badge';
          badge.textContent = 'Empfohlen';
          card.prepend(badge);
        } else if (!p.empfohlen && badge) {
          badge.remove();
        }
      });
    }

    if (pakete.marketing_addon) {
      const box = document.getElementById('pricing-addon-marketing');
      if (box) {
        const title = box.querySelector('.pricing-addon__title');
        if (title && pakete.marketing_addon.titel) title.textContent = pakete.marketing_addon.titel;
        const text = box.querySelector('.pricing-addon__text');
        if (text && pakete.marketing_addon.text) text.textContent = pakete.marketing_addon.text;
      }
    }
  }

  // ── 4. Über mich ──────────────────────────────────────────
  if (uebermich) {
    if (uebermich.foto) {
      const photo = document.getElementById('about-photo');
      const initials = document.getElementById('about-initials');
      if (photo) {
        if (uebermich.foto_ausschnitt) photo.style.objectPosition = uebermich.foto_ausschnitt;
        // Falls das Foto nicht lädt (kaputter Pfad, gelöschte Datei),
        // zurück zur Kürzel-Kachel statt eines kaputten Bild-Icons.
        photo.onerror = () => {
          photo.hidden = true;
          if (initials) initials.hidden = false;
        };
        photo.src = uebermich.foto;
        photo.hidden = false;
      }
      if (initials) initials.hidden = true;
    }

    const paras = document.querySelectorAll('#ueber-mich .about__text');
    if (paras[0] && uebermich.absatz1) paras[0].textContent = uebermich.absatz1;
    if (paras[1] && uebermich.absatz2) paras[1].textContent = uebermich.absatz2;
    if (paras[2] && uebermich.werdegang) paras[2].textContent = uebermich.werdegang;

    const quote = document.querySelector('#about-quote p');
    if (quote && uebermich.zitat) quote.textContent = '„' + uebermich.zitat + '"';

    const steps = document.querySelectorAll('.steps__item');
    if (Array.isArray(uebermich.schritte)) {
      uebermich.schritte.forEach((s, i) => {
        const item = steps[i];
        if (!item || !s) return;
        const titel = item.querySelector('h3');
        const text = item.querySelector('p');
        if (titel && s.titel) titel.textContent = s.titel;
        if (text && s.text) text.textContent = s.text;
      });
    }
  }

  // ── 4b. CMS-Erklärung ──────────────────────────────────────
  if (cmsErklaerung) {
    const titel = document.getElementById('cms-titel');
    if (titel && cmsErklaerung.titel) titel.textContent = cmsErklaerung.titel;
    const text = document.getElementById('cms-text');
    if (text && cmsErklaerung.text) text.textContent = cmsErklaerung.text;
    const ul = document.getElementById('cms-vorteile');
    if (ul && Array.isArray(cmsErklaerung.vorteile)) {
      ul.innerHTML = cmsErklaerung.vorteile.map((p) => '<li>' + p + '</li>').join('');
    }
  }

  // ── 4c. Marketing-Leistungen ───────────────────────────────
  if (marketing) {
    const titel = document.getElementById('marketing-titel');
    if (titel && marketing.titel) titel.textContent = marketing.titel;
    const text = document.getElementById('marketing-text');
    if (text && marketing.text) text.textContent = marketing.text;
    const cards = document.querySelectorAll('#marketing-grid .marketing-card');
    if (Array.isArray(marketing.leistungen)) {
      marketing.leistungen.forEach((l, i) => {
        const card = cards[i];
        if (!card || !l) return;
        const h3 = card.querySelector('h3');
        const p = card.querySelector('p');
        if (h3 && l.titel) h3.textContent = l.titel;
        if (p && l.text) p.textContent = l.text;
      });
    }
  }

  // ── 4d. Rezensionen (auf jeder Seite über dem Footer) ─────
  // Karten liegen per CSS-Grid-Stacking übereinander (siehe
  // .review-card in style.css); JS schaltet nur .is-active um
  // und rotiert bei mehreren Einträgen automatisch weiter.
  if (rezensionen && Array.isArray(rezensionen.eintraege)) {
    const stage = document.getElementById('reviews-stage');
    if (stage) {
      const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      }[c]));
      const eintraege = rezensionen.eintraege.filter((r) => r && r.name && r.text);

      stage.innerHTML = eintraege.map((r, i) => {
        const sterne = Math.min(5, Math.max(1, Number(r.sterne) || 5));
        const stars = '★'.repeat(sterne) + '☆'.repeat(5 - sterne);
        const initiale = r.name.trim().charAt(0).toUpperCase();
        return '<blockquote class="review-card' + (i === 0 ? ' is-active' : '') + '">'
          + '<div class="review-card__stars" aria-label="' + sterne + ' von 5 Sternen">' + stars + '</div>'
          + '<p class="review-card__text">' + escapeHtml(r.text) + '</p>'
          + '<footer class="review-card__foot">'
          + '<span class="review-card__avatar review-card__avatar--' + (i % 3) + '" aria-hidden="true">' + initiale + '</span>'
          + '<span class="review-card__name">' + escapeHtml(r.name) + '</span>'
          + '</footer>'
          + '</blockquote>';
      }).join('');

      const dotsWrap = document.getElementById('reviews-dots');
      if (dotsWrap && eintraege.length > 1) {
        dotsWrap.innerHTML = eintraege.map((_, i) =>
          '<button type="button" class="reviews__dot' + (i === 0 ? ' is-active' : '') + '" aria-label="Rezension ' + (i + 1) + ' von ' + eintraege.length + ' anzeigen"></button>'
        ).join('');
      }

      if (eintraege.length > 1) {
        const cards = stage.querySelectorAll('.review-card');
        const dots = dotsWrap ? dotsWrap.querySelectorAll('.reviews__dot') : [];
        let active = 0;
        let timer = null;

        const show = (i) => {
          cards[active].classList.remove('is-active');
          if (dots[active]) dots[active].classList.remove('is-active');
          active = i;
          cards[active].classList.add('is-active');
          if (dots[active]) dots[active].classList.add('is-active');
        };

        const stopTimer = () => { if (timer) clearInterval(timer); };
        const startTimer = () => {
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
          timer = setInterval(() => show((active + 1) % cards.length), 7000);
        };

        dots.forEach((dot, i) => dot.addEventListener('click', () => {
          show(i);
          stopTimer();
          startTimer();
        }));

        stage.addEventListener('mouseenter', stopTimer);
        stage.addEventListener('mouseleave', startTimer);
        stage.addEventListener('focusin', stopTimer);
        stage.addEventListener('focusout', startTimer);

        startTimer();
      }
    }
  }

  // ── 5. Kontakt (E-Mail-Adresse überall ersetzen) ──────────
  if (kontakt && kontakt.email) {
    document.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
      a.href = 'mailto:' + kontakt.email;
      a.textContent = kontakt.email;
    });
  }

  // ── 6. Rechtliches (Impressum/Datenschutz-Platzhalter) ────
  // Wirkt nur, wenn die jeweilige ID auf der aktuellen Seite existiert.
  // Bleibt ein Feld im CMS leer, bleibt der auffällig gestylte
  // Platzhalter aus dem HTML unverändert stehen.
  function fillLegalField(id, value) {
    const el = document.getElementById(id);
    if (!el || !value || !String(value).trim()) return;
    el.textContent = value;
    el.classList.remove('legal-placeholder');
  }
  if (rechtliches) {
    fillLegalField('legal-strasse', rechtliches.strasse);
    fillLegalField('legal-ort', rechtliches.ort);
    fillLegalField('legal-telefon', rechtliches.telefon);
    fillLegalField('legal-ustid', rechtliches.ustid);
  }

  // ── Signal other scripts that content is in the DOM ──────
  document.dispatchEvent(new CustomEvent('cms-ready'));

})();

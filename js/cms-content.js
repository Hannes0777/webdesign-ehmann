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

  const [siteinfo, hero, pakete, uebermich, kontakt, rechtliches, cmsErklaerung] = await Promise.all([
    fetchJSON('content/siteinfo.json'),
    fetchJSON('content/hero.json'),
    fetchJSON('content/pakete.json'),
    fetchJSON('content/uebermich.json'),
    fetchJSON('content/kontakt.json'),
    fetchJSON('content/rechtliches.json'),
    fetchJSON('content/cms-erklaerung.json'),
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
        if (price && p.ab_preis) {
          price.innerHTML = '<span class="pricing-card__price-prefix">ab</span> ' + p.ab_preis + '&nbsp;€';
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

    if (pakete.cms_addon) {
      const box = document.getElementById('pricing-addon-cms');
      if (box) {
        const title = box.querySelector('.pricing-addon__title');
        if (title && pakete.cms_addon.titel) title.textContent = pakete.cms_addon.titel;
        const text = box.querySelector('.pricing-addon__text');
        if (text && pakete.cms_addon.text) text.textContent = pakete.cms_addon.text;
      }
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

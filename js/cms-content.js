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

  const [siteinfo, hero, pakete, uebermich, kontakt, rechtliches] = await Promise.all([
    fetchJSON('content/siteinfo.json'),
    fetchJSON('content/hero.json'),
    fetchJSON('content/pakete.json'),
    fetchJSON('content/uebermich.json'),
    fetchJSON('content/kontakt.json'),
    fetchJSON('content/rechtliches.json'),
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

  // ── 3. Leistungen (Grundleistung & CMS-Erweiterung) ───────
  if (pakete) {
    const core = pakete.grundleistung;
    const coreCard = document.getElementById('leistung-core');
    if (core && coreCard) {
      const h3 = coreCard.querySelector('h3');
      if (h3 && core.titel) h3.textContent = core.titel;
      const tagline = coreCard.querySelector('.leistung-card__tagline');
      if (tagline && core.tagline) tagline.textContent = core.tagline;
      const texts = coreCard.querySelectorAll('.leistung-card__text');
      if (texts[0] && core.absatz1) texts[0].textContent = core.absatz1;
      if (texts[1] && core.absatz2) texts[1].textContent = core.absatz2;
      const intro = coreCard.querySelector('.leistung-card__intro');
      if (intro && core.punkte_intro) intro.textContent = core.punkte_intro;
      const ul = coreCard.querySelector('.leistung-checklist');
      if (ul && Array.isArray(core.punkte)) {
        ul.innerHTML = core.punkte.map((p) => '<li>' + p + '</li>').join('');
      }
    }

    const addon = pakete.cms_erweiterung;
    const addonCard = document.getElementById('leistung-addon');
    if (addon && addonCard) {
      const h3 = addonCard.querySelector('h3');
      if (h3 && addon.titel) h3.textContent = addon.titel;
      const tagline = addonCard.querySelector('.leistung-card__tagline');
      if (tagline && addon.tagline) tagline.textContent = addon.tagline;
      const text = addonCard.querySelector('.leistung-card__text');
      if (text && addon.beschreibung) text.textContent = addon.beschreibung;
      const intro = addonCard.querySelector('.leistung-card__intro');
      if (intro && addon.vorteile_intro) intro.textContent = addon.vorteile_intro;
      const ul = addonCard.querySelector('.leistung-checklist');
      if (ul && Array.isArray(addon.vorteile)) {
        ul.innerHTML = addon.vorteile.map((p) => '<li>' + p + '</li>').join('');
      }
      const note = addonCard.querySelector('.leistung-card__note');
      if (note && addon.hinweis) note.textContent = addon.hinweis;
    }
  }

  // ── 4. Über mich ──────────────────────────────────────────
  if (uebermich) {
    const paras = document.querySelectorAll('#ueber-mich .about__content > p');
    if (paras[0] && uebermich.absatz1) paras[0].textContent = uebermich.absatz1;
    if (paras[1] && uebermich.absatz2) paras[1].textContent = uebermich.absatz2;

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

/* ============================================================
   DESIGN-STILE: gepinnte Scroll-Bühne, die zwischen beliebig
   vielen Design-Richtungen überblendet (Text links, Vorschau
   rechts als echte, per iframe eingebettete Beispiel-Website,
   vollflächiger Farb-Crossfade im Hintergrund).

   Die Anzahl der Design-Beispiele kommt aus content/design-stile.json
   (CMS-pflegbar, siehe js/cms-content.js) - Panels/Mockups/Dots
   werden dort dynamisch erzeugt, deshalb wartet dieses Skript auf
   das "cms-ready"-Event, statt beim Laden fest verdrahtete IDs
   ("#dstyles-text-1" .. "-4") anzusteuern.

   Nur auf Desktop (die gepinnte Bühne braucht Platz für Text +
   Vorschau nebeneinander). Nur bei verfügbarem GSAP/ScrollTrigger
   und ohne reduced-motion - sonst bleibt die gestapelte
   Grundfassung stehen, die cms-content.js immer erzeugt.
   ============================================================ */
(function () {
  const FRAME_W = 1440;
  const FRAME_H = 900;

  /* ---------- Vorschau-Iframes proportional auf Containergröße
     skalieren (unabhängig von der Crossfade-Bühne, läuft immer) ---------- */
  function scaleFrame(wrap) {
    const iframe = wrap.querySelector(".dstyles__frame");
    if (!iframe) return;
    const w = wrap.clientWidth;
    if (!w) return;
    // Immer auf die volle Breite skalieren (nicht "cover" per max(w,h)) -
    // sonst wird bei einem im Vergleich zu 1440x900 schmalen/hohen
    // Container seitlich stark zugeschnitten und man sieht nur einen
    // Ausschnitt der Seite statt der vollen Breite inkl. Navigation.
    iframe.style.transform = "scale(" + (w / FRAME_W) + ")";
  }

  function setupFrameScaling() {
    const wraps = document.querySelectorAll(".dstyles__frame-wrap");
    if (!wraps.length) return;

    function scaleAll() {
      wraps.forEach(scaleFrame);
    }

    scaleAll();
    window.addEventListener("resize", scaleAll);
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(scaleAll);
      wraps.forEach((w) => ro.observe(w));
    }
  }

  /* ---------- Gepinnte Crossfade-Bühne (nur Desktop, N Panels) ---------- */
  function setupCrossfade() {
    const section = document.getElementById("dstyles");
    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
    if (window.innerWidth < 1024) return;

    const panels = Array.from(document.querySelectorAll(".dstyles__panel"));
    const mockups = Array.from(document.querySelectorAll(".dstyles__mockup"));
    const dots = document.querySelectorAll("#dstyles-dots .dstyles__dot");
    const n = panels.length;
    if (n < 2 || mockups.length !== n) return;

    gsap.registerPlugin(ScrollTrigger);

    try {
      const bg = "#dstyles-bg";
      const bgColors = panels.map((p) => p.dataset.bgColor || "#0d1210");

      // Zeitliche Taktung 1:1 zur ursprünglichen 4-Panel-Bühne übernommen:
      // Übergang k (1-basiert) beginnt bei Position 4k-1 und dauert 1 Einheit,
      // 1 Einheit entspricht 40vh Scrollstrecke -> Bühnenhöhe = 160vh je Übergang.
      const UNIT_VH = 40;
      const STEP = 4;
      const totalUnits = STEP * (n - 1);
      section.style.setProperty("--dstyles-height", totalUnits * UNIT_VH + "vh");

      function setActiveDot(index) {
        dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
      }
      setActiveDot(0);

      // Ein Panel gilt als "aktiv" sobald der Zeitpunkt in der Timeline die
      // Mitte seines Übergangs (Startposition + halbe Blenddauer) erreicht.
      const dotThresholds = [];
      for (let i = 0; i < n - 1; i++) dotThresholds.push(STEP * (i + 1) - 1 + 0.5);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          onUpdate: (self) => {
            const t = self.progress * totalUnits;
            let idx = 0;
            for (let i = 0; i < dotThresholds.length; i++) {
              if (t >= dotThresholds[i]) idx = i + 1;
            }
            setActiveDot(idx);
          },
        },
      });

      for (let i = 0; i < n - 1; i++) {
        const pos = STEP * (i + 1) - 1;
        tl.to(bg, { backgroundColor: bgColors[i + 1], duration: 1, ease: "none" }, pos)
          .to(panels[i], { autoAlpha: 0, duration: 1 }, pos)
          .to(mockups[i], { autoAlpha: 0, duration: 1 }, pos)
          .to(panels[i + 1], { autoAlpha: 1, duration: 1 }, pos)
          .to(mockups[i + 1], { autoAlpha: 1, duration: 1 }, pos);
      }

      section.classList.add("dstyles--active");
      gsap.set(panels[0], { autoAlpha: 1 });
      gsap.set(mockups[0], { autoAlpha: 1 });
      ScrollTrigger.refresh();
    } catch (err) {
      console.error("Design-Stile-Crossfade konnte nicht gestartet werden, Fallback bleibt aktiv.", err);
    }
  }

  function init() {
    setupFrameScaling();
    setupCrossfade();
  }

  // cms-content.js baut die Panels/Mockups erst asynchron auf und
  // meldet sich danach mit "cms-ready" - erst dann existieren die
  // DOM-Knoten, auf denen diese Bühne aufsetzt.
  if (document.getElementById("dstyles-grid") && !document.getElementById("dstyles-grid").children.length) {
    document.addEventListener("cms-ready", init, { once: true });
  } else {
    init();
  }
})();

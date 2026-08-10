/* ============================================================
   DESIGN-STILE: gepinnte Scroll-Bühne, die zwischen 3 Design-
   Richtungen überblendet (Text links, Vorschau rechts als echte,
   per iframe eingebettete Beispiel-Website, vollflächiger Farb-
   Crossfade im Hintergrund).

   Nur auf Desktop (die gepinnte Bühne braucht Platz für Text +
   Vorschau nebeneinander). Nur bei verfügbarem GSAP/ScrollTrigger
   und ohne reduced-motion - sonst bleibt die im CSS sichtbare,
   gestapelte Grundfassung stehen.
   ============================================================ */
/* ---------- Vorschau-Iframes proportional auf Containergröße
   skalieren (unabhängig von der Crossfade-Bühne, läuft immer) ---------- */
(function () {
  const FRAME_W = 1440;
  const FRAME_H = 900;
  const wraps = document.querySelectorAll(".dstyles__frame-wrap");
  if (!wraps.length) return;

  function scaleFrame(wrap) {
    const iframe = wrap.querySelector(".dstyles__frame");
    if (!iframe) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (!w || !h) return;
    const scale = Math.max(w / FRAME_W, h / FRAME_H);
    iframe.style.transform = "scale(" + scale + ")";
  }

  function scaleAll() {
    wraps.forEach(scaleFrame);
  }

  scaleAll();
  window.addEventListener("resize", scaleAll);
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(scaleAll);
    wraps.forEach((w) => ro.observe(w));
  }
})();

(function () {
  const section = document.getElementById("dstyles");
  if (!section) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) return;
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Gepinnte Crossfade-Bühne (nur Desktop) ---------- */
  if (window.innerWidth < 1024) return;

  try {
    const bg = "#dstyles-bg";
    const text1 = "#dstyles-text-1";
    const text2 = "#dstyles-text-2";
    const text3 = "#dstyles-text-3";
    const mockup1 = "#dstyles-mockup-1";
    const mockup2 = "#dstyles-mockup-2";
    const mockup3 = "#dstyles-mockup-3";
    const dots = document.querySelectorAll("#dstyles-dots .dstyles__dot");

    const COLOR_1 = "#0d1210";
    const COLOR_2 = "#efefef";
    const COLOR_3 = "#f2a668";

    function setActiveDot(index) {
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
    }
    setActiveDot(0);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
          const p = self.progress;
          setActiveDot(p < 0.4 ? 0 : p < 0.75 ? 1 : 2);
        },
      },
    });

    tl.to(bg, { backgroundColor: COLOR_2, duration: 1, ease: "none" }, 3)
      .to(text1, { autoAlpha: 0, duration: 1 }, 3)
      .to(mockup1, { autoAlpha: 0, duration: 1 }, 3)
      .to(text2, { autoAlpha: 1, duration: 1 }, 3)
      .to(mockup2, { autoAlpha: 1, duration: 1 }, 3)
      .to(bg, { backgroundColor: COLOR_3, duration: 1, ease: "none" }, 7)
      .to(text2, { autoAlpha: 0, duration: 1 }, 7)
      .to(mockup2, { autoAlpha: 0, duration: 1 }, 7)
      .to(text3, { autoAlpha: 1, duration: 1 }, 7)
      .to(mockup3, { autoAlpha: 1, duration: 1 }, 7);

    section.classList.add("dstyles--active");
    ScrollTrigger.refresh();
  } catch (err) {
    console.error("Design-Stile-Crossfade konnte nicht gestartet werden, Fallback bleibt aktiv.", err);
  }
})();

/* ============================================================
   CINEMATIC HERO: Text löst sich auf, eine Premium-Karte fährt
   hoch und öffnet sich zur Bühne für ein Handy-Mockup samt
   Badges, zieht sich danach zur Anfrage-CTA zurück.

   Auf schmalen Bildschirmen (<1024px) läuft eine leichtere,
   nicht gepinnte Variante: die gepinnte Vollbild-Bühne mit allen
   5 Badges passt dort nicht (Badges überlappen sich/den Text, das
   Wordmark gerät unter die fixierte Kopfzeile) - stattdessen fädet
   die Karte einmalig beim Reinscrollen ein, inklusive der kleinen
   "Website wird gebaut"-Animation im Laptop-Mockup.

   Läuft nur, wenn GSAP/ScrollTrigger verfügbar sind und
   reduced-motion aus ist - sonst bleibt die im CSS sichtbare,
   statische Fassung stehen (siehe .cine-hero--active in style.css).
   ============================================================ */
(function () {
  const heroSection = document.getElementById("cine-hero");
  const stage = document.getElementById("cine-stage");
  const card = document.getElementById("cine-card");

  if (!heroSection || !stage || !card) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) return;
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  try {
    gsap.registerPlugin(ScrollTrigger);

    const line1 = "#cine-line-1";
    const line2 = "#cine-line-2";
    const buildNav = "#build-nav";
    const buildLine1 = "#build-line1";
    const buildLine2 = "#build-line2";
    const buildCursor = "#build-cursor";
    const buildBtn = "#build-btn";
    const buildCards = ["#build-card-0", "#build-card-1", "#build-card-2", "#build-card-3"];

    gsap.set([buildNav, buildLine1, buildLine2, buildBtn], { scaleX: 0 });
    gsap.set(buildCards, { autoAlpha: 0, y: 6 });
    gsap.set(buildCursor, { autoAlpha: 0 });

    /* ---------- Intro: Zeilen lösen sich beim Laden ein (alle Breiten) ---------- */
    gsap.set([line1, line2], {
      autoAlpha: 0,
      y: 40,
      scale: 0.92,
      filter: "blur(14px)",
    });
    gsap
      .timeline({ delay: 0.3 })
      .to(line1, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 1,
        ease: "expo.out",
      })
      .to(
        line2,
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 1,
          ease: "expo.out",
        },
        "-=0.7"
      );

    /* ============================================================
       SCHMALE BILDSCHIRME (<1024px): leichte, nicht gepinnte Reveal-
       Animation statt der gepinnten Vollbild-Bühne.
       ============================================================ */
    if (window.innerWidth < 1024) {
      const badge1 = "#cine-badge-1";
      const badge2 = "#cine-badge-2";

      gsap.set(card, { autoAlpha: 0, y: 50, scale: 0.94 });
      gsap.set([badge1, badge2], { autoAlpha: 0, y: 20, scale: 0.9 });

      /* Scrub statt einmaligem Trigger: die Karte sitzt auf dem Handy
         oft schon knapp unterhalb des ersten Bildschirms, ein "spielt
         ab, sobald sichtbar"-Trigger wäre also sofort beim Laden
         erfüllt. Mit scrub hängt die Animation an den ersten ~500px
         Scrollweg, startet also garantiert bei 0. */
      const mobileTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroSection,
          start: "top top",
          end: "+=500",
          scrub: 0.5,
        },
      });

      mobileTl
        .to(card, { autoAlpha: 1, y: 0, scale: 1, ease: "power2.out", duration: 1 }, 0)
        .to(buildNav, { scaleX: 1, ease: "power2.out", duration: 0.3 }, 0.3)
        .to(buildLine1, { scaleX: 1, ease: "power2.out", duration: 0.4 }, 0.5)
        .to(buildCursor, { autoAlpha: 1, duration: 0.15 }, 0.9)
        .to(buildLine2, { scaleX: 1, ease: "power2.out", duration: 0.3 }, 1.0)
        .to(buildCursor, { autoAlpha: 0, duration: 0.15 }, 1.3)
        .to(buildBtn, { scaleX: 1, ease: "power2.out", duration: 0.25 }, 1.4)
        .to(buildCards[0], { autoAlpha: 1, y: 0, duration: 0.2, ease: "power2.out" }, 1.5)
        .to(buildCards[1], { autoAlpha: 1, y: 0, duration: 0.2, ease: "power2.out" }, 1.58)
        .to(buildCards[2], { autoAlpha: 1, y: 0, duration: 0.2, ease: "power2.out" }, 1.66)
        .to(buildCards[3], { autoAlpha: 1, y: 0, duration: 0.2, ease: "power2.out" }, 1.74)
        .to(badge1, { autoAlpha: 1, y: 0, scale: 1, ease: "back.out(1.4)", duration: 0.6 }, 0.4)
        .to(badge2, { autoAlpha: 1, y: 0, scale: 1, ease: "back.out(1.4)", duration: 0.6 }, 0.6);

      ScrollTrigger.refresh();
      return;
    }

    /* ============================================================
       DESKTOP (>=1024px): gepinnte Cinematic-Bühne mit allen 5
       Badges, Vollbild-Ausbau und Rückzug zur Anfrage-CTA.
       ============================================================ */
    const textWrapper = "#cine-text-wrapper";
    const ctaWrapper = "#cine-cta-wrapper";
    const brand = "#cine-card-brand";
    const mockup = "#cine-mockup";
    const laptop = "#cine-laptop";
    const cardText = "#cine-card-text";
    const badge1 = "#cine-badge-1";
    const badge2 = "#cine-badge-2";
    const badge3 = "#cine-badge-3";
    const badge4 = "#cine-badge-4";
    const badge5 = "#cine-badge-5";
    const buildMouse = "#build-mouse";

    gsap.set(buildMouse, { autoAlpha: 0, x: -40, y: -30 });

    /* ---------- Maus-Sheen + leichte 3D-Neigung des Handys ---------- */
    let rafId = null;
    function onMouseMove(e) {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const rect = card.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        card.style.setProperty("--mx", `${mx}px`);
        card.style.setProperty("--my", `${my}px`);

        const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
        const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
        gsap.to(laptop, {
          rotationY: xVal * 8,
          rotationX: -yVal * 8,
          ease: "power3.out",
          duration: 1,
        });
      });
    }
    window.addEventListener("mousemove", onMouseMove);

    /* ---------- Haupt-Sequenz, an den Scroll gekoppelt ---------- */
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroSection,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
      },
    });

    tl.to(textWrapper, { autoAlpha: 0, scale: 1.08, filter: "blur(10px)", ease: "power1.in", duration: 1.2 }, 0)
      .to(card, { y: 0, ease: "power2.out", duration: 1.6 }, 0.4)
      .to(card, { width: "100vw", height: "100vh", borderRadius: "0px", ease: "power2.inOut", duration: 1.5 }, 1.8)
      .fromTo(
        brand,
        { autoAlpha: 0, x: 40 },
        { autoAlpha: 1, x: 0, ease: "power3.out", duration: 1.2 },
        2.8
      )
      .fromTo(
        cardText,
        { autoAlpha: 0, x: -40 },
        { autoAlpha: 1, x: 0, ease: "power3.out", duration: 1.2 },
        2.8
      )
      .fromTo(
        mockup,
        { autoAlpha: 0, y: 60, scale: 0.7, rotationX: 25 },
        { autoAlpha: 1, y: 0, scale: 1, rotationX: 0, ease: "expo.out", duration: 2 },
        3.0
      )
      .to(buildNav, { scaleX: 1, ease: "power2.out", duration: 0.3 }, 3.3)
      .to(buildLine1, { scaleX: 1, ease: "power2.out", duration: 0.4 }, 3.55)
      .to(buildCursor, { autoAlpha: 1, duration: 0.15 }, 3.95)
      .to(buildLine2, { scaleX: 1, ease: "power2.out", duration: 0.35 }, 4.1)
      .to(buildCursor, { autoAlpha: 0, duration: 0.15 }, 4.45)
      .to(buildBtn, { scaleX: 1, ease: "power2.out", duration: 0.3 }, 4.55)
      .to(buildCards[0], { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, 4.75)
      .to(buildCards[1], { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, 4.85)
      .to(buildCards[2], { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, 4.95)
      .to(buildCards[3], { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, 5.05)
      .to(buildMouse, { autoAlpha: 1, x: 0, y: 0, duration: 0.5, ease: "power2.inOut" }, 4.55)
      .to(buildMouse, { scale: 0.8, duration: 0.12, yoyo: true, repeat: 1 }, 5.1)
      .to(buildMouse, { autoAlpha: 0, duration: 0.3 }, 5.4)
      .fromTo(
        badge1,
        { autoAlpha: 0, y: 30, scale: 0.85 },
        { autoAlpha: 1, y: 0, scale: 1, ease: "back.out(1.4)", duration: 1 },
        4.3
      )
      .fromTo(
        badge2,
        { autoAlpha: 0, y: 30, scale: 0.85 },
        { autoAlpha: 1, y: 0, scale: 1, ease: "back.out(1.4)", duration: 1 },
        4.55
      )
      .fromTo(
        badge3,
        { autoAlpha: 0, y: 30, scale: 0.85 },
        { autoAlpha: 1, y: 0, scale: 1, ease: "back.out(1.4)", duration: 1 },
        4.8
      )
      .fromTo(
        badge4,
        { autoAlpha: 0, y: 30, scale: 0.85 },
        { autoAlpha: 1, y: 0, scale: 1, ease: "back.out(1.4)", duration: 1 },
        5.0
      )
      .fromTo(
        badge5,
        { autoAlpha: 0, y: 30, scale: 0.85 },
        { autoAlpha: 1, y: 0, scale: 1, ease: "back.out(1.4)", duration: 1 },
        5.2
      )
      .to(
        [brand, cardText, mockup, badge1, badge2, badge3, badge4, badge5],
        { autoAlpha: 0, y: -30, scale: 0.94, ease: "power1.in", duration: 1.1 },
        7.3
      )
      .to(card, { autoAlpha: 0, ease: "power1.in", duration: 1 }, 7.6)
      .fromTo(
        ctaWrapper,
        { autoAlpha: 0, scale: 0.92 },
        { autoAlpha: 1, scale: 1, ease: "power2.out", duration: 1.2 },
        8.7
      );

    /* Aktivieren: Grundzustand -> gepinnte Cinematic-Bühne */
    heroSection.classList.add("cine-hero--active");
    ScrollTrigger.refresh();
  } catch (err) {
    console.error("Cinematic Hero konnte nicht gestartet werden, Fallback bleibt aktiv.", err);
  }
})();

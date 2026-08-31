/* ============================================================
   Dachwerk Lindenhof – Design-Beispiel (fiktiver Betrieb)
   Nav-Scroll-Status, mobiles Menue, Scroll-Wipe-Hero, Reveal-on-
   Scroll, Kontaktformular (rein clientseitige Validierung, kein
   echter Versand - fiktive Firma ohne echten Empfaenger).
   ============================================================ */

(function () {
  const nav = document.getElementById("main-nav");
  if (!nav) return;
  function onScroll() {
    nav.classList.toggle("nav--scrolled", window.scrollY > 12);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

(function () {
  const toggle = document.getElementById("nav-toggle");
  const mobile = document.getElementById("nav-mobile");
  if (!toggle || !mobile) return;
  toggle.addEventListener("click", () => {
    const isOpen = toggle.classList.toggle("is-open");
    mobile.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
  mobile.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      toggle.classList.remove("is-open");
      mobile.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
})();

/* ---------- Scroll-Wipe-Hero: Vorher/Nachher-Dach ----------
   Die "Nachher"-Ebene liegt ueber der "Vorher"-Ebene und wird
   per clip-path von rechts nach links freigegeben, gebunden an
   den Scroll-Fortschritt der gepinnten .hero-pin-Sektion (kein
   Video, kein Autoplay - direkt scrubbar wie im Referenzvorbild). */
(function () {
  const pin = document.getElementById("hero-pin");
  const after = document.getElementById("hero-after");
  if (!pin || !after) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReducedMotion) {
    after.style.clipPath = "inset(0 0 0 0)";
    return;
  }

  let ticking = false;

  function update() {
    ticking = false;
    const rect = pin.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    if (total <= 0) return;
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    const progress = scrolled / total;
    const remaining = (1 - progress) * 100;
    after.style.clipPath = "inset(0 " + remaining + "% 0 0)";
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
})();

/* ---------- Reveal-on-scroll ---------- */
(function () {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("reveal--visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal--visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  items.forEach((el) => io.observe(el));
})();

/* ---------- Kontaktformular: nur clientseitige Validierung ----------
   Design-Beispiel fuer eine fiktive Firma - es gibt keinen echten
   Empfaenger, daher kein Versand-Endpunkt/Worker angebunden. */
(function () {
  const form = document.getElementById("contact-form");
  if (!form) return;

  function setError(field, message) {
    const err = form.querySelector('[data-error-for="' + field.name + '"]');
    if (err) err.textContent = message || "";
  }

  function validate() {
    let valid = true;
    const name = form.querySelector("#cf-name");
    const email = form.querySelector("#cf-email");
    const message = form.querySelector("#cf-message");

    if (!name.value.trim()) {
      setError(name, "Bitte Namen angeben.");
      valid = false;
    } else {
      setError(name, "");
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.value.trim())) {
      setError(email, "Bitte gueltige E-Mail-Adresse angeben.");
      valid = false;
    } else {
      setError(email, "");
    }

    if (!message.value.trim()) {
      setError(message, "Bitte kurze Nachricht angeben.");
      valid = false;
    } else {
      setError(message, "");
    }

    return valid;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validate()) return;
    const success = document.getElementById("cf-success");
    form.hidden = true;
    if (success) success.hidden = false;
  });
})();

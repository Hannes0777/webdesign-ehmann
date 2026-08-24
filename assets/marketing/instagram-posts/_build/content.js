// Slide-Inhalte für die 6 neuen Instagram-Carousel-Posts.
// Jede Slide hat ein "kind":
//   cover           – NUR Slide 1: zentriert, große Headline, Divider, Subtext
//                      (optional: big:true = vertikal mittig, noch größere Headline — Eyecatcher-Variante)
//   cover-photo     – NUR Slide 1: wie cover, aber mit gekipptem Foto-Beweisstück
//                      über der Headline (Hook-Bild ganz am Anfang, z.B. echter Screenshot)
//   hero-left       – Icon-Badge, Kicker, große Headline, Subtext — alles linksbündig
//   reason          – Icon-Badge, Kicker, Subheadline, große Zahl, fette Kernaussage,
//                      Fließtext, optionale Quellenangabe — linksbündig (Modell: „Tipp Baukasten“)
//   mockup-compare  – Kicker+Headline links, zwei Browser-Mockups (Vorher/Nachher)
//   mockup-form     – Kicker+Headline links, Formular-Mockup
//   flyer-compare   – Kicker+Headline links, zwei Flyer-Mockups (generisch vs. gestaltet)
//   checklist       – Kicker+Headline links, Liste mit Check-Icons
//   showcase-photo  – Icon-Badge, Kicker, Headline, Subtext links + echtes Foto/
//                      Screenshot (NUR eigenes Material — Flyer/Logo/eigene Posts,
//                      KEINE fremden/echten Kunden-Websites), groß + mittig, nicht
//                      gekippt (photo: Pfad relativ zu _build/, photoW/photoH optional,
//                      caption optional)
//   mockup-site     – wie showcase-photo, aber ein rein abstrakt/fiktiv gezeichnetes
//                      Website-Mockup (kein echter Screenshot) — für Fälle, in denen
//                      keine reale Kunden-Website gezeigt werden soll
//   mockup-form     – Kicker+Headline links, abstraktes/fiktives Formular-Mockup,
//                      groß + mittig (subtext optional)
//   cta             – Kicker+Headline+Subtext links, umrandeter Button (letzte Slide)

const ICONS = {
  check: `<path d="M4 12.5l5 5L20 6.5"/>`,
  arrowRight: `<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>`,
  spark: `<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>`,
  warning: `<path d="M12 4 3 20h18L12 4Z"/><path d="M12 10v5"/><circle cx="12" cy="17.5" r=".6" fill="currentColor" stroke="none"/>`,
  phone: `<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M10.5 18.5h3"/>`,
  target: `<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>`,
  bell: `<path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z"/><path d="M10 19a2 2 0 0 0 4 0"/>`,
  shield: `<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"/><path d="M9 12l2 2 4-4"/>`,
  mailOff: `<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/><path d="M4 20 20 4" stroke-width="1.6"/>`,
  form: `<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8.5h8M8 12h8M8 15.5h5"/>`,
  compass: `<circle cx="12" cy="12" r="8.5"/><path d="M15 9l-2 6-4 2 2-6 4-2Z"/>`,
  trend: `<path d="M3 17l6-6 4 4 8-8"/><path d="M15 6h6v6"/>`,
  refresh: `<path d="M4 12a8 8 0 0 1 13.6-5.7M20 12a8 8 0 0 1-13.6 5.7"/><path d="M17.5 3.5v3.3h-3.3M6.5 20.5v-3.3h3.3"/>`,
  users: `<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="9.5" r="2.3"/><path d="M15.5 14.2c2.3.3 4 2.1 4 4.8"/>`,
  chat: `<path d="M4 5.5h16v10H9l-4 3.5v-3.5H4Z"/><path d="M8 9.5h8M8 12.5h5"/>`,
};

const POSTS = [
  {
    folder: "Beispielprojekt Vorher-Nachher",
    slides: [
      {
        kind: "cover",
        big: true,
        kicker: "DESIGN-BEISPIEL · FIKTIVER BETRIEB",
        headline: ["Schreinerei", "<span class=\"accent\">Vogt</span>"],
        subtext: "So könnte ein Website-Relaunch aussehen.",
      },
      {
        kind: "hero-left",
        icon: "warning",
        kicker: "SCHRITT 1",
        headline: "Die Ausgangslage",
        subtext: "Eine Seite, ein Bild, keine Struktur — Öffnungszeiten und Kontakt sind nicht auf den ersten Blick zu finden, die Ladezeit auf dem Handy ist lang.",
      },
      {
        kind: "mockup-compare",
        icon: "compass",
        kicker: "SCHRITT 2",
        headline: "Vorher. Nachher.",
        beforeLabel: "VORHER",
        afterLabel: "NACHHER",
      },
      {
        kind: "hero-left",
        icon: "target",
        kicker: "SCHRITT 3",
        headline: "Kleinigkeiten, die zählen",
        subtext: "Klickbare Telefonnummer, Anfahrt mit Karte, jedes Bild komprimiert — nichts bremst die Seite aus.",
      },
      {
        kind: "cta",
        kicker: "ERGEBNIS",
        headline: "So könnte deine Website aussehen",
        subtext: "Schreib mir — wir schauen uns dein Beispiel gemeinsam an.",
        button: "JETZT SCHREIBEN →",
      },
    ],
  },
  {
    folder: "Mobile Realitaetscheck",
    slides: [
      {
        kind: "cover",
        big: true,
        kicker: "MOBILE-CHECK",
        headline: ["Über die Hälfte kommt", "vom <span class=\"accent\">Handy</span>"],
        subtext: "Hast du deine eigene Website schon mal selbst auf dem Smartphone getestet?",
      },
      {
        kind: "hero-left",
        icon: "warning",
        kicker: "PROBLEM",
        headline: "Klein, verdeckt, kaum klickbar",
        subtext: "Telefonnummer nicht anklickbar, Menü verdeckt Inhalte, Text zu klein zum Lesen.",
      },
      {
        kind: "hero-left",
        icon: "bell",
        kicker: "TIPP",
        headline: "Der Sticky-Anruf-Button",
        subtext: "Gerade für Handwerksbetriebe: ein Button, der immer sichtbar bleibt — „Jetzt anrufen“.",
      },
      {
        kind: "reason",
        icon: "phone",
        kicker: "FAKT",
        subheadline: "Anrufen muss einfach sein",
        number: "70%",
        bold: "der Smartphone-Nutzer haben schon den „Anrufen“-Button direkt in der Google-Suche genutzt.",
        regular: "Ein sichtbarer, sticky Anruf-Button auf deiner Website macht genau das leichter.",
        source: "Quelle: Ipsos / Google",
      },
      {
        kind: "cta",
        kicker: "MACH DEN TEST",
        headline: "Öffne deine Website mal auf dem Handy",
        subtext: "Oder lass mich das für dich prüfen — kostenlos und unverbindlich.",
        button: "JETZT ANFRAGEN →",
      },
    ],
  },
  {
    folder: "Cookie Banner Mythos 2",
    slides: [
      {
        kind: "cover",
        big: true,
        kicker: "DATENSCHUTZ-MYTHOS · TEIL 2",
        headline: ["Warum ich auf", "Cookie-Banner <span class=\"accent\">verzichte</span>"],
        subtext: "Kein Trick, keine Ausnahme — bei jedem einzelnen Projekt.",
      },
      {
        kind: "hero-left",
        icon: "bell",
        kicker: "DIE GEWOHNHEIT",
        headline: "„Ein Banner gehört einfach dazu“",
        subtext: "So denken viele — dabei brauchen die wenigsten Websites überhaupt einen.",
      },
      {
        kind: "hero-left",
        icon: "shield",
        kicker: "MEINE REGEL",
        headline: "Kein Tracking. Kein Banner nötig.",
        subtext: "Ich binde keine Analyse- oder Tracking-Skripte ein, die eine Cookie-Zustimmung brauchen würden.",
      },
      {
        kind: "reason",
        icon: "spark",
        kicker: "MEINE BILANZ",
        subheadline: "Schneller ohne Banner",
        number: "0",
        bold: "Tracking- oder Analyse-Skripte auf jeder Website, die ich baue.",
        regular: "Keine Bannerfläche, kein Klick, den Besucher erst wegklicken muss.",
        source: null,
      },
      {
        kind: "cta",
        kicker: "BEI JEDEM PROJEKT",
        headline: "So arbeite ich — von Anfang an",
        subtext: "Fragen zum Datenschutz auf deiner Website? Schreib mir einfach.",
        button: "JETZT FRAGEN →",
      },
    ],
  },
  {
    folder: "Tipp Kontaktformular",
    slides: [
      {
        kind: "cover",
        big: true,
        kicker: "TIPP",
        headline: ["Warum ein „mailto:“-", "Link <span class=\"accent\">schadet</span>"],
        subtext: "Kleines Detail, großer Unterschied für deine Kunden.",
      },
      {
        kind: "hero-left",
        icon: "mailOff",
        kicker: "PROBLEM 1",
        headline: "Spam-Bots lesen mit",
        subtext: "Steht deine E-Mail-Adresse im Klartext im Code, sammeln Bots sie automatisch ein.",
      },
      {
        kind: "hero-left",
        icon: "phone",
        kicker: "PROBLEM 2",
        headline: "Öffnet oft gar nichts",
        subtext: "Ohne eingerichtetes Mailprogramm passiert beim Klick auf dem Handy — nichts.",
      },
      {
        kind: "mockup-form",
        icon: "form",
        kicker: "LÖSUNG",
        headline: "Ein echtes Kontaktformular",
        subtext: "So läuft es bei mir ab: Name, E-Mail, Nachricht — direkt an dich, ohne Umweg über eine Mail-App.",
      },
      {
        kind: "cta",
        kicker: "SO BAUE ICH ES",
        headline: "Bei jedem Projekt Standard",
        subtext: "Auch für deine Website? Schreib mir.",
        button: "JETZT KONTAKT AUFNEHMEN →",
      },
    ],
  },
  {
    folder: "Warum Website 2026",
    slides: [
      {
        kind: "cover",
        big: true,
        kicker: "WARUM JETZT",
        headline: ["Kein <span class=\"accent\">Nice-to-have</span>", "mehr"],
        subtext: "2026 informieren sich Kunden zuerst online — vor dem ersten Anruf.",
      },
      {
        kind: "reason",
        icon: "compass",
        kicker: "DIE REALITÄT",
        subheadline: "Der erste Eindruck entsteht online",
        number: "76%",
        bold: "der Verbraucher informieren sich online über einen Betrieb, bevor sie ihn besuchen oder kontaktieren.",
        regular: "Ohne Website fehlst du an genau diesem ersten Kontaktpunkt.",
        source: "Quelle: Visual Objects, Search Engine Marketing Survey",
      },
      {
        kind: "hero-left",
        icon: "warning",
        kicker: "DIE FOLGE",
        headline: "Keine Website, keine Chance",
        subtext: "Ohne Auftritt oder mit veralteter Seite verlierst du Anfragen, ohne es zu merken.",
      },
      {
        kind: "reason",
        icon: "shield",
        kicker: "IMMER GEÖFFNET",
        subheadline: "Rund um die Uhr erreichbar",
        number: "24/7",
        bold: "arbeitet deine Website für dich — auch wenn du selbst geschlossen hast.",
        regular: "Kein Feierabend, kein Urlaub, keine Pause.",
        source: null,
      },
      {
        kind: "cta",
        kicker: "JETZT STARTEN",
        headline: "Lieber heute als nächstes Jahr",
        subtext: "Lass uns unverbindlich über deinen Betrieb sprechen.",
        button: "JETZT SPRECHEN →",
      },
    ],
  },
  {
    folder: "Nach Dem Livegang",
    slides: [
      {
        kind: "cover",
        big: true,
        kicker: "NACH DEM LIVEGANG",
        headline: ["Eine Website", "ist nie wirklich", "<span class=\"accent\">fertig</span>"],
        subtext: "Und das ist auch gut so.",
      },
      {
        kind: "hero-left",
        icon: "refresh",
        kicker: "WARUM",
        headline: "Betriebe verändern sich",
        subtext: "Neue Öffnungszeiten, neue Leistungen, neue Fotos — die Website sollte mitwachsen.",
      },
      {
        kind: "checklist",
        icon: "shield",
        kicker: "WAS ICH ÜBERNEHME",
        headline: "Läuft im Hintergrund mit",
        items: ["Updates & Sicherheit", "Neue Inhalte & Fotos", "Erweiterungen nach Bedarf"],
      },
      {
        kind: "mockup-site",
        icon: "users",
        kicker: "ANSPRECHPARTNER",
        headline: "Du erreichst mich auch danach",
        subtext: "Kein anonymes Ticket-System — du schreibst mir direkt, und deine Seite wird laufend weiter gepflegt.",
        photoW: 420,
        photoH: 540,
      },
      {
        kind: "cta",
        kicker: "LANGFRISTIG GEDACHT",
        headline: "Ein Begleiter, kein abgeschlossenes Projekt",
        subtext: "Lass uns über deine Website sprechen — auch über den Start hinaus.",
        button: "JETZT SCHREIBEN →",
      },
    ],
  },
  {
    folder: "KI Flyer Vergleich",
    slides: [
      {
        kind: "cover-photo",
        kicker: "MAL EHRLICH",
        photo: "compare/alt-flyer.png",
        headline: ["Kostenlos erstellt.", "<span class=\"accent\">Nichts gebracht.</span>"],
        subtext: "Genau so sehen die meisten KI-Flyer aus. Vielleicht auch deiner.",
      },
      {
        kind: "hero-left",
        icon: "users",
        kicker: "DAS PROBLEM",
        headline: "Das macht mittlerweile jeder",
        subtext: "Gleiche KI-Tools, gleiche Vorlagen, gleicher Look — dein Flyer verschwindet in der Masse, bevor er überhaupt gesehen wird.",
      },
      {
        kind: "flyer-compare",
        icon: "compass",
        kicker: "DER BEWEIS",
        headline: "Gleiche Botschaft. Anderer Eindruck.",
        beforeLabel: "ALT",
        afterLabel: "NEU",
        beforeImage: "compare/alt-flyer.png",
        afterImage: "compare/neu-flyer.png",
      },
      {
        kind: "hero-left",
        icon: "target",
        kicker: "WARUM DAS WICHTIG IST",
        headline: "Auffallen bringt Kunden. Gleich aussehen nicht.",
        subtext: "Ein Flyer, der aussieht wie hundert andere, bleibt nicht im Kopf — und landet im Papierkorb, egal wie viel „KI“ drinsteckt.",
      },
      {
        kind: "cta",
        kicker: "MEINE ARBEIT",
        headline: "Handarbeit statt Vorlage",
        subtext: "Ich nutze KI auch — aber als Werkzeug, nicht als Autopilot. Für einen Flyer, der wirklich auffällt.",
        button: "JETZT ANFRAGEN →",
      },
    ],
  },
  {
    folder: "Ablauf",
    slides: [
      {
        kind: "cover",
        big: true,
        kicker: "ABLAUF",
        headline: ["So läuft ein", "<span class=\"accent\">Projekt</span> bei mir ab"],
        subtext: "Vom ersten Gespräch bis zur fertigen Website.",
      },
      {
        kind: "hero-left",
        icon: "chat",
        kicker: "SCHRITT 1",
        headline: "Kennenlernen",
        subtext: "Kurzes Gespräch, telefonisch oder persönlich — was brauchst du, was soll die Seite können?",
      },
      {
        kind: "mockup-site",
        icon: "spark",
        kicker: "SCHRITT 2",
        headline: "Der erste Entwurf",
        subtext: "Individuell für deinen Betrieb entworfen — kein Baukasten-Template.",
        photoW: 420,
        photoH: 540,
      },
      {
        kind: "checklist",
        icon: "shield",
        kicker: "SCHRITT 3",
        headline: "Immer inklusive",
        items: ["Feinschliff nach deinem Feedback", "SEO-Grundausstattung", "Echtes Kontaktformular"],
      },
      {
        kind: "hero-left",
        icon: "compass",
        kicker: "SCHRITT 4",
        headline: "Übergabe",
        subtext: "Kurze Einweisung — danach pflegst du deine Inhalte selbst, ganz ohne Programmierkenntnisse.",
      },
      {
        kind: "cta",
        kicker: "DEIN PROJEKT",
        headline: "Bereit für Schritt 1?",
        subtext: "Schreib mir kurz — unverbindlich und ohne Verkaufsgespräch.",
        button: "JETZT KONTAKT AUFNEHMEN →",
      },
    ],
  },
  {
    folder: "serie-marketing",
    slides: [
      {
        kind: "cover",
        big: true,
        kicker: "MARKETING · SERIE TEIL 3",
        headline: ["Ein Auftritt.", "<span class=\"accent\">Überall.</span>"],
        subtext: "Social Media, Flyer und Logo — auf Wunsch übernehme ich auch das, im selben Design wie deine Website.",
      },
      {
        kind: "showcase-photo",
        icon: "chat",
        kicker: "SOCIAL-MEDIA-BETREUUNG",
        headline: "Beiträge, die zu dir passen",
        subtext: "Instagram & Facebook, im gleichen Look wie deine Website — hier ein echter Post aus meiner eigenen Serie.",
        photo: "real/post-beispiel-serie-seo.png",
        photoW: 360,
        photoH: 450,
        caption: "ECHTER POST · WEBDESIGN EHMANN",
      },
      {
        kind: "showcase-photo",
        icon: "form",
        kicker: "FLYER-DESIGN",
        headline: "Für Aktionen & Veranstaltungen",
        subtext: "Ein Flyer im selben Design wie deine Website — druckfertig. Das ist mein eigener, kein Mockup.",
        photo: "compare/neu-flyer.png",
        photoW: 360,
        photoH: 450,
        caption: "ECHTER FLYER · WEBDESIGN EHMANN",
      },
      {
        kind: "showcase-photo",
        icon: "compass",
        kicker: "LOGO-DESIGN",
        headline: "Ein Erkennungszeichen, das bleibt",
        subtext: "Grundlage für Website, Social Media, Flyer und alles, was noch dazukommt — mein eigenes Logo als Beispiel.",
        photo: "real/logo-webdesign-ehmann.webp",
        photoW: 340,
        photoH: 340,
        caption: "ECHTES LOGO · WEBDESIGN EHMANN",
      },
      {
        kind: "hero-left",
        icon: "target",
        kicker: "ALLES AUS EINER HAND",
        headline: "Ein einheitlicher Auftritt",
        subtext: "Website, Social Media und Print im selben Design — Kunden erkennen dich überall wieder.",
      },
      {
        kind: "cta",
        kicker: "DEIN PROJEKT",
        headline: "Auch Social Media & Co. aus einer Hand?",
        subtext: "Schreib mir — wir besprechen gemeinsam, was zu deinem Betrieb passt.",
        button: "UNVERBINDLICHES ANGEBOT ANFRAGEN →",
      },
    ],
  },
];

module.exports = { POSTS, ICONS };

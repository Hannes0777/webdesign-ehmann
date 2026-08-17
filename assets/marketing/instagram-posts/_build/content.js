// Slide-Inhalte für die 6 neuen Instagram-Carousel-Posts.
// Jeder Post: slides[0] = Cover-Layout (zentriert, Divider, kein Icon).
// slides[1..] = Content-Layout (Icon-Badge, linksbündig, kein Divider).

const ICONS = {
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
        kicker: "BEISPIEL",
        headline: ["Einmal Vorher,", "einmal <span class=\"accent\">Nachher</span>"],
        subtext: "Ein frei erfundenes Beispiel, wie aus einer Website mehr wird — kein echtes Kundenprojekt.",
      },
      {
        icon: "warning",
        kicker: "AUSGANGSLAGE",
        headline: "Eine Seite. Ein Bild.<br>Keine Struktur.",
        subtext: "So sehen viele erste Websites aus: keine klare Struktur, lange Ladezeit, auf dem Handy kaum bedienbar.",
      },
      {
        icon: "compass",
        kicker: "DIE LÖSUNG",
        headline: "Klar aufgebaut.<br>Von Grund auf.",
        subtext: "Eigene Struktur statt Vorlage, echtes Kontaktformular, schnelle Ladezeit, auf jedem Gerät geprüft.",
      },
      {
        icon: "target",
        kicker: "DETAIL",
        headline: "Kleinigkeiten,<br>die zählen",
        subtext: "Klickbare Telefonnummer, Anfahrt mit Karte, jedes Bild komprimiert — nichts bremst die Seite aus.",
      },
      {
        icon: "trend",
        kicker: "ERGEBNIS",
        headline: "So könnte deine<br>Website aussehen",
        subtext: "Schreib mir — wir schauen uns dein Beispiel gemeinsam an.",
      },
    ],
  },
  {
    folder: "Mobile Realitaetscheck",
    slides: [
      {
        kicker: "MOBILE-CHECK",
        headline: ["Über die Hälfte kommt", "vom <span class=\"accent\">Handy</span>"],
        subtext: "Hast du deine eigene Website schon mal selbst auf dem Smartphone getestet?",
      },
      {
        icon: "warning",
        kicker: "PROBLEM",
        headline: "Klein, verdeckt,<br>kaum klickbar",
        subtext: "Telefonnummer nicht anklickbar, Menü verdeckt Inhalte, Text zu klein zum Lesen.",
      },
      {
        icon: "phone",
        kicker: "LÖSUNG",
        headline: "Für den Daumen<br>gebaut",
        subtext: "Große Buttons, klickbare Rufnummer, ein Formular statt Fließtext-E-Mail.",
      },
      {
        icon: "bell",
        kicker: "TIPP",
        headline: "Der Sticky-<br>Anruf-Button",
        subtext: "Gerade für Handwerksbetriebe: ein Button, der immer sichtbar bleibt — „Jetzt anrufen“.",
      },
      {
        icon: "target",
        kicker: "MACH DEN TEST",
        headline: "Öffne deine Website<br>mal auf dem Handy",
        subtext: "Oder lass mich das für dich prüfen — kostenlos und unverbindlich.",
      },
    ],
  },
  {
    folder: "Cookie Banner Mythos 2",
    slides: [
      {
        kicker: "DATENSCHUTZ-MYTHOS · TEIL 2",
        headline: ["Warum ich auf", "Cookie-Banner <span class=\"accent\">verzichte</span>"],
        subtext: "Kein Trick, keine Ausnahme — bei jedem einzelnen Projekt.",
      },
      {
        icon: "bell",
        kicker: "DIE GEWOHNHEIT",
        headline: "„Ein Banner gehört<br>einfach dazu“",
        subtext: "So denken viele — dabei brauchen die wenigsten Websites überhaupt einen.",
      },
      {
        icon: "shield",
        kicker: "MEINE REGEL",
        headline: "Kein Tracking.<br>Kein Banner nötig.",
        subtext: "Ich binde keine Analyse- oder Tracking-Skripte ein, die eine Cookie-Zustimmung brauchen würden.",
      },
      {
        icon: "spark",
        kicker: "VORTEIL FÜR DICH",
        headline: "Schneller, schlanker,<br>rechtssicherer",
        subtext: "Keine Bannerfläche, kein Klick, den Besucher erst wegklicken müssen.",
      },
      {
        icon: "chat",
        kicker: "BEI JEDEM PROJEKT",
        headline: "So arbeite ich —<br>von Anfang an",
        subtext: "Fragen zum Datenschutz auf deiner Website? Schreib mir einfach.",
      },
    ],
  },
  {
    folder: "Tipp Kontaktformular",
    slides: [
      {
        kicker: "TIPP",
        headline: ["Warum ein „mailto:“-", "Link <span class=\"accent\">schadet</span>"],
        subtext: "Kleines Detail, großer Unterschied für deine Kunden.",
      },
      {
        icon: "mailOff",
        kicker: "PROBLEM 1",
        headline: "Spam-Bots<br>lesen mit",
        subtext: "Steht deine E-Mail-Adresse im Klartext im Code, sammeln Bots sie automatisch ein.",
      },
      {
        icon: "phone",
        kicker: "PROBLEM 2",
        headline: "Öffnet oft<br>gar nichts",
        subtext: "Ohne eingerichtetes Mailprogramm passiert beim Klick auf dem Handy — nichts.",
      },
      {
        icon: "form",
        kicker: "LÖSUNG",
        headline: "Ein echtes<br>Kontaktformular",
        subtext: "Validierung, sicherer Versand im Hintergrund, deine Adresse bleibt geschützt.",
      },
      {
        icon: "target",
        kicker: "SO BAUE ICH ES",
        headline: "Bei jedem Projekt<br>Standard",
        subtext: "Auch für deine Website? Schreib mir.",
      },
    ],
  },
  {
    folder: "Warum Website 2026",
    slides: [
      {
        kicker: "WARUM JETZT",
        headline: ["Kein <span class=\"accent\">Nice-to-have</span>", "mehr"],
        subtext: "2026 informieren sich Kunden zuerst online — vor dem ersten Anruf.",
      },
      {
        icon: "compass",
        kicker: "DIE REALITÄT",
        headline: "Der erste Eindruck<br>entsteht online",
        subtext: "Bevor jemand anruft oder vorbeikommt, wird meistens erst gegoogelt.",
      },
      {
        icon: "warning",
        kicker: "DIE FOLGE",
        headline: "Keine Website,<br>keine Chance",
        subtext: "Ohne Auftritt oder mit veralteter Seite verlierst du Anfragen, ohne es zu merken.",
      },
      {
        icon: "shield",
        kicker: "DIE CHANCE",
        headline: "Wer da ist,<br>gewinnt Vertrauen",
        subtext: "Eine klare, schnelle Website zeigt: Hier arbeitet jemand seriös.",
      },
      {
        icon: "trend",
        kicker: "JETZT STARTEN",
        headline: "Lieber heute als<br>nächstes Jahr",
        subtext: "Lass uns unverbindlich über deinen Betrieb sprechen.",
      },
    ],
  },
  {
    folder: "Nach Dem Livegang",
    slides: [
      {
        kicker: "NACH DEM LIVEGANG",
        headline: ["Eine Website ist nie", "wirklich <span class=\"accent\">fertig</span>"],
        subtext: "Und das ist auch gut so.",
      },
      {
        icon: "refresh",
        kicker: "WARUM",
        headline: "Betriebe<br>verändern sich",
        subtext: "Neue Öffnungszeiten, neue Leistungen, neue Fotos — die Website sollte mitwachsen.",
      },
      {
        icon: "shield",
        kicker: "WAS ICH ÜBERNEHME",
        headline: "Updates,<br>Erweiterungen, Support",
        subtext: "Auf Wunsch kümmere ich mich dauerhaft um Hosting, Pflege und Änderungen.",
      },
      {
        icon: "users",
        kicker: "ANSPRECHPARTNER",
        headline: "Du erreichst<br>mich auch danach",
        subtext: "Kein anonymes Ticket-System — du schreibst mir direkt.",
      },
      {
        icon: "chat",
        kicker: "LANGFRISTIG GEDACHT",
        headline: "Ein Begleiter,<br>kein abgeschlossenes Projekt",
        subtext: "Lass uns über deine Website sprechen — auch über den Start hinaus.",
      },
    ],
  },
];

module.exports = { POSTS, ICONS };

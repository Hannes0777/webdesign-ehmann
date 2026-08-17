// Slide-Inhalte für die 6 neuen Instagram-Carousel-Posts.
// Jede Slide hat ein "kind":
//   hero            – zentriert, große Headline, Divider, Subtext (Standard, auf JEDER Slide)
//   stat            – zentriert, große Zahl statt Fließtext
//   mockup-compare  – zwei Browser-Mockups nebeneinander (Vorher/Nachher)
//   mockup-form     – ein Formular-Mockup
//   checklist       – kurze Liste mit Check-Icons statt Fließtext

const ICONS = {
  check: `<path d="M4 12.5l5 5L20 6.5"/>`,
};

const POSTS = [
  {
    folder: "Beispielprojekt Vorher-Nachher",
    slides: [
      {
        kind: "hero",
        kicker: "DESIGN-BEISPIEL · FIKTIVER BETRIEB",
        headline: ["Schreinerei", "<span class=\"accent\">Vogt</span>"],
        subtext: "So könnte ein Website-Relaunch aussehen.",
      },
      {
        kind: "hero",
        kicker: "SCHRITT 1",
        headline: "Die Ausgangslage",
        subtext: "Eine Seite, ein Bild, keine Struktur — Öffnungszeiten und Kontakt sind nicht auf den ersten Blick zu finden, die Ladezeit auf dem Handy ist lang.",
      },
      {
        kind: "mockup-compare",
        kicker: "SCHRITT 2",
        headline: "Vorher. Nachher.",
        beforeLabel: "VORHER",
        afterLabel: "NACHHER",
      },
      {
        kind: "hero",
        kicker: "SCHRITT 3",
        headline: "Kleinigkeiten, die zählen",
        subtext: "Klickbare Telefonnummer, Anfahrt mit Karte, jedes Bild komprimiert — nichts bremst die Seite aus.",
      },
      {
        kind: "hero",
        kicker: "ERGEBNIS",
        headline: "So könnte deine Website aussehen",
        subtext: "Schreib mir — wir schauen uns dein Beispiel gemeinsam an.",
      },
    ],
  },
  {
    folder: "Mobile Realitaetscheck",
    slides: [
      {
        kind: "hero",
        kicker: "MOBILE-CHECK",
        headline: ["Über die Hälfte kommt", "vom <span class=\"accent\">Handy</span>"],
        subtext: "Hast du deine eigene Website schon mal selbst auf dem Smartphone getestet?",
      },
      {
        kind: "hero",
        kicker: "PROBLEM",
        headline: "Klein, verdeckt, kaum klickbar",
        subtext: "Telefonnummer nicht anklickbar, Menü verdeckt Inhalte, Text zu klein zum Lesen.",
      },
      {
        kind: "stat",
        kicker: "MEIN ANSPRUCH",
        number: "&lt;1 Sek.",
        label: "Ladezeit, die ich für mobile Websites anstrebe.",
      },
      {
        kind: "hero",
        kicker: "TIPP",
        headline: "Der Sticky-Anruf-Button",
        subtext: "Gerade für Handwerksbetriebe: ein Button, der immer sichtbar bleibt — „Jetzt anrufen“.",
      },
      {
        kind: "hero",
        kicker: "MACH DEN TEST",
        headline: "Öffne deine Website mal auf dem Handy",
        subtext: "Oder lass mich das für dich prüfen — kostenlos und unverbindlich.",
      },
    ],
  },
  {
    folder: "Cookie Banner Mythos 2",
    slides: [
      {
        kind: "hero",
        kicker: "DATENSCHUTZ-MYTHOS · TEIL 2",
        headline: ["Warum ich auf", "Cookie-Banner <span class=\"accent\">verzichte</span>"],
        subtext: "Kein Trick, keine Ausnahme — bei jedem einzelnen Projekt.",
      },
      {
        kind: "hero",
        kicker: "DIE GEWOHNHEIT",
        headline: "„Ein Banner gehört einfach dazu“",
        subtext: "So denken viele — dabei brauchen die wenigsten Websites überhaupt einen.",
      },
      {
        kind: "hero",
        kicker: "MEINE REGEL",
        headline: "Kein Tracking. Kein Banner nötig.",
        subtext: "Ich binde keine Analyse- oder Tracking-Skripte ein, die eine Cookie-Zustimmung brauchen würden.",
      },
      {
        kind: "stat",
        kicker: "MEINE BILANZ",
        number: "0",
        label: "Tracking-Skripte auf jeder Website, die ich baue.",
      },
      {
        kind: "hero",
        kicker: "BEI JEDEM PROJEKT",
        headline: "So arbeite ich — von Anfang an",
        subtext: "Fragen zum Datenschutz auf deiner Website? Schreib mir einfach.",
      },
    ],
  },
  {
    folder: "Tipp Kontaktformular",
    slides: [
      {
        kind: "hero",
        kicker: "TIPP",
        headline: ["Warum ein „mailto:“-", "Link <span class=\"accent\">schadet</span>"],
        subtext: "Kleines Detail, großer Unterschied für deine Kunden.",
      },
      {
        kind: "hero",
        kicker: "PROBLEM 1",
        headline: "Spam-Bots lesen mit",
        subtext: "Steht deine E-Mail-Adresse im Klartext im Code, sammeln Bots sie automatisch ein.",
      },
      {
        kind: "hero",
        kicker: "PROBLEM 2",
        headline: "Öffnet oft gar nichts",
        subtext: "Ohne eingerichtetes Mailprogramm passiert beim Klick auf dem Handy — nichts.",
      },
      {
        kind: "mockup-form",
        kicker: "LÖSUNG",
        headline: "Ein echtes Kontaktformular",
      },
      {
        kind: "hero",
        kicker: "SO BAUE ICH ES",
        headline: "Bei jedem Projekt Standard",
        subtext: "Auch für deine Website? Schreib mir.",
      },
    ],
  },
  {
    folder: "Warum Website 2026",
    slides: [
      {
        kind: "hero",
        kicker: "WARUM JETZT",
        headline: ["Kein <span class=\"accent\">Nice-to-have</span>", "mehr"],
        subtext: "2026 informieren sich Kunden zuerst online — vor dem ersten Anruf.",
      },
      {
        kind: "hero",
        kicker: "DIE REALITÄT",
        headline: "Der erste Eindruck entsteht online",
        subtext: "Bevor jemand anruft oder vorbeikommt, wird meistens erst gegoogelt.",
      },
      {
        kind: "hero",
        kicker: "DIE FOLGE",
        headline: "Keine Website, keine Chance",
        subtext: "Ohne Auftritt oder mit veralteter Seite verlierst du Anfragen, ohne es zu merken.",
      },
      {
        kind: "stat",
        kicker: "IMMER GEÖFFNET",
        number: "24/7",
        label: "Deine Website arbeitet für dich, auch wenn du geschlossen hast.",
      },
      {
        kind: "hero",
        kicker: "JETZT STARTEN",
        headline: "Lieber heute als nächstes Jahr",
        subtext: "Lass uns unverbindlich über deinen Betrieb sprechen.",
      },
    ],
  },
  {
    folder: "Nach Dem Livegang",
    slides: [
      {
        kind: "hero",
        kicker: "NACH DEM LIVEGANG",
        headline: ["Eine Website ist nie", "wirklich <span class=\"accent\">fertig</span>"],
        subtext: "Und das ist auch gut so.",
      },
      {
        kind: "hero",
        kicker: "WARUM",
        headline: "Betriebe verändern sich",
        subtext: "Neue Öffnungszeiten, neue Leistungen, neue Fotos — die Website sollte mitwachsen.",
      },
      {
        kind: "checklist",
        kicker: "WAS ICH ÜBERNEHME",
        headline: "Läuft im Hintergrund mit",
        items: ["Updates & Sicherheit", "Neue Inhalte & Fotos", "Erweiterungen nach Bedarf"],
      },
      {
        kind: "hero",
        kicker: "ANSPRECHPARTNER",
        headline: "Du erreichst mich auch danach",
        subtext: "Kein anonymes Ticket-System — du schreibst mir direkt.",
      },
      {
        kind: "hero",
        kicker: "LANGFRISTIG GEDACHT",
        headline: "Ein Begleiter, kein abgeschlossenes Projekt",
        subtext: "Lass uns über deine Website sprechen — auch über den Start hinaus.",
      },
    ],
  },
];

module.exports = { POSTS, ICONS };

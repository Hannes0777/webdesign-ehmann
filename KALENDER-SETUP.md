# Apple- & Google-Kalender im Dashboard – Einrichtung

Das Business-Dashboard (`admin/business-dashboard.html`, Reiter **📅
Kalender**) zeigt Termine aus deinem Google-Kalender und deinem
Apple/iCloud-Kalender gemeinsam an – Google-Termine grün, Apple-Termine
violett markiert. Ein GitHub-Actions-Workflow (`.github/workflows/calendar-fetch.yml`)
holt dafür alle 15 Minuten beide Kalender über ihre **private iCal-Adresse**
(`.ics`) ab und schreibt sie nach `content/calendar-events.json`. Es ist
keine App-Anmeldung oder OAuth nötig – beide Kalender-Anbieter bieten dafür
einen fertigen Freigabe-Link.

## 1. Google-Kalender-Adresse holen

1. [Google Kalender](https://calendar.google.com) öffnen
2. Links bei „Meine Kalender" den gewünschten Kalender auswählen → auf die
   drei Punkte daneben → **Einstellungen und Freigabe**
3. Ganz unten bei **„Geheime Adresse im iCal-Format"** die Adresse
   kopieren (beginnt mit `https://calendar.google.com/calendar/ical/...`)

**Wichtig:** Diese Adresse gewährt Lesezugriff auf den ganzen Kalender –
nicht öffentlich teilen. Nur privat gehaltene Kalender sollten sie nutzen,
das Repo behandelt sie als Geheimnis (siehe Schritt 3).

## 2. Apple/iCloud-Kalender-Adresse holen

1. Auf [icloud.com/calendar](https://www.icloud.com/calendar) anmelden
   (oder in der Kalender-App auf dem Mac)
2. Den gewünschten Kalender in der Seitenleiste auswählen → auf das
   Freigabe-Symbol daneben klicken
3. **„Öffentlichen Kalender"** aktivieren → die angezeigte Adresse
   kopieren (beginnt mit `webcal://...`)

Die Adresse darf mit `webcal://` beginnen – der Workflow wandelt das
automatisch in `https://` um.

**Hinweis:** iCloud bietet dafür nur „öffentliche" Freigabe an (kein
geheimer Link wie bei Google). Der Link ist zwar praktisch nicht erratbar,
aber technisch für jeden mit dieser Adresse lesbar. Für einen rein privaten
Termin-Kalender reicht das im Alltag aus; bei sensiblen Terminen ggf. einen
eigenen, separaten Kalender nur für die im Dashboard sichtbaren Termine
anlegen und freigeben.

## 3. Secrets in GitHub hinterlegen

Im Repository **webdesign-ehmann** unter **Settings → Secrets and
variables → Actions → New repository secret** folgende Secrets anlegen:

| Name              | Wert                                          |
|--------------------|-----------------------------------------------|
| `ICS_GOOGLE_URL`   | Geheime iCal-Adresse aus Schritt 1             |
| `ICS_APPLE_URL`    | `webcal://`-Adresse aus Schritt 2              |

Es reicht, nur eines der beiden Secrets zu setzen, wenn nur ein Kalender
angebunden werden soll – der jeweils fehlende Kalender liefert dann einfach
keine Termine, der Workflow läuft trotzdem durch.

## 4. Verwenden

Der Workflow „Kalender-Termine abrufen" läuft automatisch alle 15 Minuten
(nur auf dem `master`-Branch aktiv) und committet Änderungen an
`content/calendar-events.json`. Im Dashboard erscheinen die Termine dann
sowohl auf der Übersichtsseite („Nächste Termine") als auch im
Monatskalender-Reiter, dort mit Punktfarbe nach Quelle (grün = Google,
violett = Apple).

Manuell testen lässt sich der Workflow über den Reiter **Actions** im
Repository → „Kalender-Termine abrufen" → **Run workflow**.

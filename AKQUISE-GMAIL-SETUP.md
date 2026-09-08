# Akquise: Gmail-Versand automatisch mit Apple Reminders abgleichen – Einrichtung

Ein GitHub-Actions-Workflow (`.github/workflows/akquise-gmail-sync.yml`) prüft
alle 15 Minuten deine gesendeten Gmail-Mails. Erkennt er eine **neue**
Erstkontakt-Mail an eine Firma, die noch in keiner deiner drei
Reminders-Listen steht, legt er automatisch eine neue Erinnerung in der
Liste **„Angeschrieben"** an – mit Firmenname (aus der Mail) und der
E-Mail-Adresse in der Notiz.

**Was die Automatik bewusst NICHT macht:** Sie verschiebt keine Einträge von
„Angeschrieben" nach „In Kontakt" oder „Abgelehnt". Ob eine Antwort positiv,
negativ oder gar keine war, lässt sich aus einer E-Mail nicht zuverlässig
automatisch erkennen – das bleibt weiterhin manuell in der Reminders-App.

Antworten auf einen bestehenden E-Mail-Verlauf (du schreibst innerhalb eines
Threads noch einmal) lösen **keine** neue Erinnerung aus – nur der erste
Kontakt zu einer neuen Adresse zählt. Mails an private Adressen (Gmail, GMX,
Web.de, Outlook, iCloud, ...) werden ignoriert, da das keine Firmen sind.

Zwei getrennte Zugänge sind einmalig einzurichten: **Gmail** (lesend, um
gesendete Mails zu sehen) und **iCloud/Apple Reminders** (schreibend, um
Erinnerungen anzulegen).

## Teil 1: Gmail-Zugang einrichten

### 1. Google-Cloud-Projekt erstellen

1. Auf [console.cloud.google.com](https://console.cloud.google.com) anmelden
2. Oben ein **neues Projekt** erstellen (z.B. „Webdesign Ehmann Akquise")
3. Im Menü **„APIs & Dienste" → „Bibliothek"** → nach **„Gmail API"** suchen
   → **Aktivieren**

### 2. OAuth-Zustimmungsbildschirm einrichten

1. **„APIs & Dienste" → „OAuth-Zustimmungsbildschirm"**
2. Nutzertyp: **„Extern"** (reicht, da nur du selbst dich anmeldest)
3. App-Namen vergeben (z.B. „Akquise Sync"), deine E-Mail als
   Support-/Entwickler-Kontakt eintragen, speichern
4. Unter **„Testnutzer"** deine eigene Gmail-Adresse (`ehmann.hannes07@gmail.com`)
   hinzufügen (App bleibt im Testmodus, das reicht für den Eigengebrauch)

### 3. OAuth-Client-Zugangsdaten erstellen

1. **„APIs & Dienste" → „Anmeldedaten"** → **„+ Anmeldedaten erstellen"** →
   **„OAuth-Client-ID"**
2. Anwendungstyp: **„Desktop-App"**
3. Erstellen → **Client-ID** und **Client-Secret** notieren
   (`GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET`)

### 4. Refresh-Token holen (einmalig, über OAuth Playground)

Ein Refresh-Token ist nötig, damit der Workflow dauerhaft ohne erneutes
Einloggen auf Gmail zugreifen kann.

1. [developers.google.com/oauthplayground](https://developers.google.com/oauthplayground)
   öffnen
2. Oben rechts auf das **Zahnrad** → **„Use your own OAuth credentials"**
   anhaken → Client-ID und Client-Secret aus Schritt 3 eintragen
3. Links im Bereich **„Gmail API v1"** den Scope
   `https://www.googleapis.com/auth/gmail.readonly` auswählen → **„Authorize
   APIs"**
4. Mit `ehmann.hannes07@gmail.com` anmelden und bestätigen (Warnung „Diese
   App ist nicht verifiziert" → **„Erweitert" → „Weiter (unsicher)"**, das
   ist normal bei einer nur für dich selbst genutzten App)
5. Zurück im Playground: **„Exchange authorization code for tokens"**
   klicken
6. Das angezeigte **Refresh token** kopieren (`GMAIL_REFRESH_TOKEN`)

## Teil 2: iCloud/Apple-Reminders-Zugang einrichten

### 1. App-spezifisches Passwort erstellen

1. Auf [appleid.apple.com](https://appleid.apple.com) anmelden
2. **„Anmelden und Sicherheit" → „App-spezifische Passwörter"** → **„+"**
3. Namen vergeben (z.B. „Akquise Sync"), erstellen, **Passwort kopieren**
   (wird nur einmal angezeigt) → das ist `ICLOUD_APP_PASSWORD`
4. `ICLOUD_APPLE_ID` ist einfach deine normale Apple-ID-E-Mail-Adresse

### 2. Reminders-Listen bereithalten

Die drei Listen müssen in der Reminders-App bereits existieren und exakt so
heißen (Groß-/Kleinschreibung egal an Bedeutung, aber Schreibweise muss
übereinstimmen):

- **Angeschrieben**
- **In Kontakt**
- **Abgelehnt**

Falls deine Listen anders heißen, kein Problem – dann bei den Secrets
zusätzlich `ICLOUD_LIST_ANGESCHRIEBEN`, `ICLOUD_LIST_IN_KONTAKT` bzw.
`ICLOUD_LIST_ABGELEHNT` mit dem jeweils exakten Namen setzen (siehe unten).

## Teil 3: Secrets in GitHub hinterlegen

Im Repository **webdesign-ehmann** unter **Settings → Secrets and
variables → Actions → New repository secret**:

| Name                   | Wert                                          |
|-------------------------|-----------------------------------------------|
| `GMAIL_CLIENT_ID`       | Client-ID aus Teil 1, Schritt 3                |
| `GMAIL_CLIENT_SECRET`   | Client-Secret aus Teil 1, Schritt 3            |
| `GMAIL_REFRESH_TOKEN`   | Refresh-Token aus Teil 1, Schritt 4            |
| `ICLOUD_APPLE_ID`       | Deine Apple-ID (E-Mail-Adresse)                |
| `ICLOUD_APP_PASSWORD`   | App-spezifisches Passwort aus Teil 2, Schritt 1 |

Optional, nur falls deine Reminders-Listen anders heißen als oben:

| Name                          | Wert                          |
|--------------------------------|--------------------------------|
| `ICLOUD_LIST_ANGESCHRIEBEN`   | Exakter Name deiner Liste       |
| `ICLOUD_LIST_IN_KONTAKT`      | Exakter Name deiner Liste       |
| `ICLOUD_LIST_ABGELEHNT`       | Exakter Name deiner Liste       |

## Verwenden

Der Workflow **„Akquise – Gmail-Versand mit Apple Reminders abgleichen"**
läuft automatisch alle 15 Minuten. Manuell testen: im Repo auf **Actions** →
den Workflow auswählen → **„Run workflow"**. Im Log siehst du, ob und welche
Erinnerungen angelegt wurden.

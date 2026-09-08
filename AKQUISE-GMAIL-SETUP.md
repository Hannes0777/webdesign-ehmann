# Akquise: Gmail-Labels automatisch mit Apple Reminders abgleichen – Einrichtung

Ein GitHub-Actions-Workflow (`.github/workflows/akquise-gmail-sync.yml`) prüft
alle 15 Minuten deine gesendeten Gmail-Mails mit den Labels
**„Firmen-Anfragen"** und **„In_Kontakt"** und gleicht das mit deinen
Apple/iCloud-Reminders-Listen ab:

- Mail mit Label **„Firmen-Anfragen"** gesendet, Firma noch nicht erfasst
  → neue Erinnerung in der Liste **„Anfrage"**
- Mail zusätzlich mit Label **„In_Kontakt"** gesendet
  → der Eintrag wird automatisch von **„Anfrage"** nach **„In Kontakt"**
  verschoben (bzw. direkt dort angelegt, falls noch nicht erfasst)

**„Kunden Ablehnung" bleibt bewusst manuell** – dafür gibt es kein
Gmail-Label, und ob eine Antwort eine Absage ist, lässt sich aus dem
Mailtext nicht zuverlässig automatisch entscheiden. Das Label
**„KI-Agent-Firmen"** wird komplett ignoriert (anderes Projekt).

So markierst du im Alltag eine Mail: einfach beim Verfassen/Senden das
Label **„Firmen-Anfragen"** setzen. Bekommst du eine Antwort und schreibst
zurück, zusätzlich **„In_Kontakt"** setzen – der Rest läuft automatisch.

Zwei getrennte Zugänge sind einmalig einzurichten: **Gmail** (lesend, um
gesendete Mails und ihre Labels zu sehen) und **iCloud/Apple Reminders**
(schreibend, um Erinnerungen anzulegen/zu verschieben).

## Teil 1: Gmail-Zugang einrichten

### 1. Google-Cloud-Projekt / bestehendes Projekt nutzen

1. Auf [console.cloud.google.com](https://console.cloud.google.com) anmelden
2. Ein Projekt auswählen (neu oder bestehend)
3. **„APIs & Services" → „Library"** → **„Gmail API"** suchen → **Aktivieren**

### 2. OAuth-Zustimmungsbildschirm einrichten

1. **„APIs & Services" → „OAuth consent screen"** (dt. „Zielgruppe")
2. Nutzertyp: **„Extern"** (Workspace-Konten hätten zusätzlich „Intern",
   für ein normales Gmail-Konto ist nur „Extern" verfügbar)
3. App-Namen vergeben, deine E-Mail als Support-/Entwickler-Kontakt
4. Unter **„Testnutzer"** die Gmail-Adresse eintragen, mit der du die
   Firmen anschreibst

### 3. OAuth-Client-Zugangsdaten erstellen

1. **„APIs & Services" → „Credentials"** (dt. „Clients") → **„+ Create
   credentials"** → **„OAuth client ID"**
2. Anwendungstyp: **„Web application"** (wichtig – nicht „Desktop app",
   sonst funktioniert der nächste Schritt mit dem OAuth Playground nicht)
3. Bei **„Authorized redirect URIs"** hinzufügen:
   `https://developers.google.com/oauthplayground`
4. Erstellen → **Client-ID** und **Client-Secret** notieren
   (`GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET`)

### 4. Refresh-Token holen (einmalig, über OAuth Playground)

1. [developers.google.com/oauthplayground](https://developers.google.com/oauthplayground)
   öffnen
2. Zahnrad oben rechts → **„Use your own OAuth credentials"** anhaken →
   Client-ID/Secret aus Schritt 3 eintragen → schließen
3. Links **„Gmail API v1"** → Scope
   `https://www.googleapis.com/auth/gmail.readonly` auswählen →
   **„Authorize APIs"**
4. Mit der Gmail-Adresse aus Schritt 2 (Testnutzer) anmelden, bei der
   „nicht verifiziert"-Warnung auf **„Erweitert" → „Weiter (unsicher)"**
5. Zurück im Playground: **„Exchange authorization code for tokens"**
6. **Refresh token** kopieren (`GMAIL_REFRESH_TOKEN`)

## Teil 2: iCloud/Apple-Reminders-Zugang einrichten

1. Auf [appleid.apple.com](https://appleid.apple.com) anmelden
2. **„Anmeldung und Sicherheit" → „Anwendungsspezifische Passwörter"** →
   **„+"** → Namen vergeben → erstellen → **Passwort kopieren**
   (`ICLOUD_APP_PASSWORD`, wird nur einmal angezeigt)
3. `ICLOUD_APPLE_ID` ist deine Apple-ID-Anmeldeadresse

Die Listen **„Anfrage"** und **„In Kontakt"** müssen in der Reminders-App
bereits genau so heißen (sind bei dir schon vorhanden).

## Teil 3: Secrets in GitHub hinterlegen

Im Repository **webdesign-ehmann** unter **Settings → Secrets and
variables → Actions → New repository secret**:

| Name                   | Wert                                          |
|-------------------------|-----------------------------------------------|
| `GMAIL_CLIENT_ID`       | Client-ID aus Teil 1, Schritt 3                |
| `GMAIL_CLIENT_SECRET`   | Client-Secret aus Teil 1, Schritt 3            |
| `GMAIL_REFRESH_TOKEN`   | Refresh-Token aus Teil 1, Schritt 4            |
| `ICLOUD_APPLE_ID`       | Deine Apple-ID (`ehmann.hannes07@icloud.com`)  |
| `ICLOUD_APP_PASSWORD`   | App-spezifisches Passwort aus Teil 2            |

Alles andere (Listennamen „Anfrage"/„In Kontakt", Label-Namen
„Firmen-Anfragen"/„In_Kontakt") ist bereits als Standardwert im Skript
hinterlegt und muss nicht extra gesetzt werden. Nur falls sich diese Namen
mal ändern sollten, lassen sie sich per zusätzlichem Secret/Variable
überschreiben: `ICLOUD_LIST_ANFRAGE`, `ICLOUD_LIST_IN_KONTAKT`,
`GMAIL_LABEL_ANFRAGE`, `GMAIL_LABEL_IN_KONTAKT`.

## Verwenden

Der Workflow **„Akquise – Gmail-Labels mit Apple Reminders abgleichen"**
läuft automatisch alle 15 Minuten. Manuell testen: im Repo auf **Actions**
→ den Workflow auswählen → **„Run workflow"**. Im Log siehst du, welche
Erinnerungen angelegt oder verschoben wurden.

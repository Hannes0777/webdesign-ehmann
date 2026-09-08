# Akquise: Gmail-Labels automatisch mit dem Dashboard abgleichen – Einrichtung

Ein GitHub-Actions-Workflow (`.github/workflows/akquise-gmail-sync.yml`) prüft
alle 15 Minuten deine gesendeten Gmail-Mails mit den Labels
**„Firmen-Anfragen"** und **„Firmen-Anfragen/In_Kontakt"** und pflegt daraus
automatisch Einträge in der **Akquise-Liste** (`content/akquise/`) – dieselbe
Liste, die im CMS unter „🤝 Akquise-Tracking" und im Business-Dashboard unter
„Akquise" zu sehen ist:

- Mail mit Label **„Firmen-Anfragen"** gesendet, Firma noch nicht erfasst
  → neuer Akquise-Eintrag mit Status **„Kontaktiert"**
- Mail zusätzlich mit Label **„In_Kontakt"** gesendet
  → der Eintrag bekommt ein Antwort-Datum + eine Notiz-Zeile (bzw. wird
  neu angelegt, falls noch nicht erfasst)

**Absagen bleiben bewusst manuell** – dafür gibt es kein Gmail-Label, und ob
eine Antwort eine Absage ist, lässt sich aus dem Mailtext nicht zuverlässig
automatisch erkennen. Im CMS/Dashboard einfach den Status auf „Verworfen"
setzen, sobald eine Absage kommt.

*Hinweis zur Vorgeschichte:* Ursprünglich sollte das automatisch in Apple
Reminders schreiben. iCloud liefert für Reminders über die
Standard-CalDAV-Schnittstelle aber keine Inhalte mehr zurück, sobald
„Erweiterter Datenschutz" (Advanced Data Protection) aktiv ist – das ist bei
diesem Account der Fall. Daher landen die Einträge stattdessen im ohnehin
vorhandenen Akquise-Tracking im Dashboard.

So markierst du im Alltag eine Mail: einfach beim Verfassen/Senden das
Label **„Firmen-Anfragen"** setzen. Bekommst du eine Antwort und schreibst
zurück, zusätzlich **„In_Kontakt"** setzen – der Rest läuft automatisch.

## Gmail-Zugang einrichten

### 1. Google-Cloud-Projekt / bestehendes Projekt nutzen

1. Auf [console.cloud.google.com](https://console.cloud.google.com) anmelden
2. Ein Projekt auswählen (neu oder bestehend)
3. **„APIs & Services" → „Library"** → **„Gmail API"** suchen → **Aktivieren**

### 2. OAuth-Zustimmungsbildschirm einrichten

1. **„APIs & Services" → „OAuth consent screen"** (dt. „Zielgruppe")
2. Nutzertyp: **„Extern"**
3. App-Namen vergeben, deine E-Mail als Support-/Entwickler-Kontakt
4. Unter **„Testnutzer"** die Gmail-Adresse eintragen, mit der du die
   Firmen anschreibst

### 3. OAuth-Client-Zugangsdaten erstellen

1. **„APIs & Services" → „Credentials"** (dt. „Clients") → **„+ Create
   credentials"** → **„OAuth client ID"**
2. Anwendungstyp: **„Web application"** (wichtig – nicht „Desktop app")
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

## Secrets in GitHub hinterlegen

Im Repository **webdesign-ehmann** unter **Settings → Secrets and
variables → Actions**:

| Name                   | Wert                                          |
|-------------------------|-----------------------------------------------|
| `GMAIL_CLIENT_ID`       | Client-ID aus Schritt 3                        |
| `GMAIL_CLIENT_SECRET`   | Client-Secret aus Schritt 3                    |
| `GMAIL_REFRESH_TOKEN`   | Refresh-Token aus Schritt 4                    |

Diese drei sind bereits gesetzt (aus der ursprünglichen Einrichtung) – für
den Dashboard-Weg werden keine Apple-/iCloud-Secrets mehr gebraucht.

## Verwenden

Der Workflow **„Akquise – Gmail-Labels mit Dashboard abgleichen"** läuft
automatisch alle 15 Minuten. Manuell testen: im Repo auf **Actions** → den
Workflow auswählen → **„Run workflow"**. Neue/aktualisierte Einträge
erscheinen danach im Business-Dashboard unter „Akquise" und im CMS unter
„🤝 Akquise-Tracking".

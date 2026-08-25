# Facebook & Instagram automatisch posten – Einrichtung

Diese Website kann geplante Beiträge automatisch auf Facebook und Instagram
veröffentlichen. Ein GitHub-Actions-Workflow prüft alle 5 Minuten
`content/social-posts/` auf fällige Beiträge und postet sie über die
Meta Graph API.

**Wichtig zum Verständnis:** Die Bilder werden nicht auf die eigentliche
Homepage hochgeladen. Facebook bekommt das Bild direkt als Datei-Upload
(kein Hosting nötig). Instagram verlangt von Meta aus zwingend eine
öffentlich erreichbare Bild-URL (kein Datei-Upload möglich) – dafür wird
das Bild kurz in das separate, eigenständige Repo
[`social-media-bilder`](https://github.com/Hannes0777/social-media-bilder)
gelegt, von Instagram abgeholt, und direkt danach automatisch wieder
gelöscht. Auf der Homepage selbst ändert sich dadurch nichts.

Damit das funktioniert, sind einmalig folgende Schritte nötig (nur du kannst
das tun, da dafür der Login in dein Facebook-Konto nötig ist):

## 1. Voraussetzungen

- Eine **Facebook-Seite** (kein privates Profil)
- Ein **Instagram-Business- oder Creator-Konto**, verknüpft mit dieser
  Facebook-Seite (Instagram-App → Einstellungen → Konto → verknüpfte Konten)

## 2. Meta-App erstellen

1. Auf https://developers.facebook.com/apps anmelden (ggf. erst oben rechts
   auf „Los geht's" klicken, um dich als Entwickler zu registrieren) und
   **App erstellen**
2. App-Typ: **Andere** → **Unternehmen**
3. Unter **Anwendungsfälle** (Filter „Content-Management") ankreuzen:
   - **„Messaging und Content auf Instagram verwalten"**
   - **„Alles auf deiner Seite verwalten"**

## 3. Facebook-Seiten-Token erzeugen

1. Im [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
   deine App auswählen, **„Generate Access Token"** klicken
2. Auf der App-Dashboard-Seite unter dem Anwendungsfall **„Alles auf deiner
   Seite verwalten" → Personalisieren** die Berechtigungen `pages_show_list`,
   `pages_read_engagement`, `pages_manage_posts` hinzufügen
3. Im Graph API Explorer den generierten **User Token** kopieren, im
   [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
   einfügen, **„Fehlerbehebung"** und dann **„Zugriffstoken erweitern"**
   klicken → langlebiger Token (60 Tage)
4. Mit diesem langlebigen Token im Browser aufrufen:
   `https://graph.facebook.com/v21.0/me/accounts?access_token=DEIN_LANGLEBIGER_TOKEN`
   → in der Antwort bei deiner Seite: `"id"` = **Facebook-Seiten-ID**,
   `"access_token"` = **Page Access Token** (läuft praktisch nicht ab,
   solange die App aktiv bleibt)

## 4. Instagram-Zugriff einrichten

Instagram läuft über einen eigenen Ablauf, getrennt von der Facebook-Seite:

1. App-Dashboard → Anwendungsfall **„Messaging und Content auf Instagram
   verwalten" → Personalisieren** → im Menü **„API-Einrichtung mit
   Instagram-Login"**
2. Unter „1. Erforderliche Messaging-Berechtigungen hinzufügen" auf **„Add
   all required permissions"** klicken; zusätzlich unter „Berechtigungen
   und Features" die Berechtigung `instagram_business_content_publish`
   hinzufügen (wird zum Veröffentlichen gebraucht)
3. Links im Menü auf **„App-Rollen" → „Rollen"** gehen, dein
   Instagram-Konto als **Instagram-Tester** hinzufügen
4. In Instagram (Browser: `instagram.com/accounts/manage_access/`, oder
   App → Einstellungen → Website-Berechtigungen) die Tester-Einladung
   annehmen
5. Zurück zu „API-Einrichtung mit Instagram-Login" → bei „2. Zugriffstokens
   generieren" → **„Konto hinzufügen"**, mit Instagram bestätigen
6. Dort erscheint dein Konto mit einer Zahl darunter → das ist die
   **Instagram-Nutzer-ID** (`META_IG_USER_ID`)
7. Auf **„Token generieren"** klicken → das ist der **Instagram Access
   Token** (`META_IG_ACCESS_TOKEN`), komplett getrennt vom Facebook-Token
   aus Schritt 3

## 5. Zugriffs-Token für das Bilder-Repo erzeugen

Damit der Workflow kurzzeitig ein Bild in `social-media-bilder` ablegen
(und danach wieder löschen) kann, braucht er ein eigenes GitHub-Token –
unabhängig vom Facebook/Instagram-Token aus Schritt 3.

1. Auf https://github.com/settings/personal-access-tokens/new gehen
2. **Nur** das Repo `social-media-bilder` auswählen (nicht die Homepage!)
3. Berechtigung **Contents: Read and write** setzen, sonst nichts
4. Token erzeugen und kopieren (wird nur einmal angezeigt)

## 6. Secrets in GitHub hinterlegen

Im Repository **webdesign-ehmann** unter **Settings → Secrets and
variables → Actions → New repository secret** folgende Secrets anlegen:

| Name                        | Wert                                          |
|------------------------------|-------------------------------------------------|
| `META_PAGE_ACCESS_TOKEN`     | Page Access Token aus Schritt 3                |
| `META_PAGE_ID`                | Facebook-Seiten-ID aus Schritt 3               |
| `META_IG_USER_ID`             | Instagram-Nutzer-ID aus Schritt 4              |
| `META_IG_ACCESS_TOKEN`        | Instagram Access Token aus Schritt 4           |
| `SOCIAL_MEDIA_ASSETS_TOKEN`   | Token aus Schritt 5 (Zugriff auf social-media-bilder) |

Die Secrets sind verschlüsselt und für niemanden einsehbar, auch nicht für
dich selbst nach dem Speichern (nur überschreibbar).

## 7. Verwenden

Im CMS unter **„📱 Facebook & Instagram – Beiträge planen"** einen neuen
Eintrag anlegen: Bild für Facebook (genau eins) und/oder Bilder für
Instagram (eins oder mehrere, mehrere ergeben ein Karussell) hochladen,
gemeinsamen Text schreiben, Zeitpunkt wählen, Plattform(en) auswählen,
speichern. Der Workflow läuft automatisch alle
5 Minuten (Zeitplan nur auf dem `master`-Branch aktiv) und veröffentlicht
fällige Beiträge. Der Status wechselt danach automatisch auf
„veroeffentlicht" bzw. bei einem Problem auf „fehler" mit Fehlermeldung.

Manuell testen lässt sich der Workflow über den Reiter **Actions** im
Repository → „Social-Media-Beiträge veröffentlichen" → **Run workflow**.

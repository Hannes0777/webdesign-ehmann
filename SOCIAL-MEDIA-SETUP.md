# Facebook & Instagram automatisch posten – Einrichtung

Diese Website kann geplante Beiträge automatisch auf Facebook und Instagram
veröffentlichen. Ein GitHub-Actions-Workflow prüft alle 15 Minuten
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

1. Auf https://developers.facebook.com/apps anmelden und **App erstellen**
2. App-Typ: **Andere** → **Unternehmen**
3. Unter **Anwendungsfälle** die Produkte **„Facebook Login"** und
   **„Instagram Graph API"** hinzufügen (bzw. „Seiten-API")

## 3. Access Token mit den nötigen Rechten erzeugen

1. Im [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
   deine App auswählen
2. **User Access Token** erzeugen mit den Berechtigungen:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
3. Diesen Token gegen einen **langlebigen Token** tauschen (60 Tage) über
   den [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
   → „Zugriffstoken erweitern"
4. Mit dem langlebigen User-Token folgenden Aufruf machen, um den
   **Page Access Token** zu bekommen (im Browser oder mit curl):
   `https://graph.facebook.com/v21.0/me/accounts?access_token=DEIN_LANGLEBIGER_TOKEN`
   → in der Antwort die passende Seite suchen, `access_token` daraus ist der
   **Page Access Token**. Dieser läuft nicht ab, solange die App aktiv bleibt.

## 4. IDs herausfinden

- **Facebook-Seiten-ID**: steht in der Antwort aus Schritt 3 (`id`-Feld der
  Seite), oder auf der Seite selbst unter „Info"
- **Instagram-Business-Account-ID**: Aufruf
  `https://graph.facebook.com/v21.0/{SEITEN_ID}?fields=instagram_business_account&access_token=DEIN_PAGE_TOKEN`

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
| `META_PAGE_ID`                | Facebook-Seiten-ID aus Schritt 4               |
| `META_IG_USER_ID`             | Instagram-Business-Account-ID aus Schritt 4    |
| `SOCIAL_MEDIA_ASSETS_TOKEN`   | Token aus Schritt 5 (Zugriff auf social-media-bilder) |

Die Secrets sind verschlüsselt und für niemanden einsehbar, auch nicht für
dich selbst nach dem Speichern (nur überschreibbar).

## 7. Verwenden

Im CMS unter **„📱 Facebook & Instagram – Beiträge planen"** einen neuen
Eintrag anlegen: Bild hochladen, Text schreiben, Zeitpunkt wählen,
Plattform(en) auswählen, speichern. Der Workflow läuft automatisch alle
15 Minuten (Zeitplan nur auf dem `master`-Branch aktiv) und veröffentlicht
fällige Beiträge. Der Status wechselt danach automatisch auf
„veroeffentlicht" bzw. bei einem Problem auf „fehler" mit Fehlermeldung.

Manuell testen lässt sich der Workflow über den Reiter **Actions** im
Repository → „Social-Media-Beiträge veröffentlichen" → **Run workflow**.

# BeeWise auf GitHub Pages veröffentlichen

Ziel: eine feste HTTPS-Adresse, die du am Handy öffnest und als **App mit eigenem Symbol**
auf den Startbildschirm legst. Kosten: 0 €. Eine eigene Domain kostet nur die Domain selbst
(etwa 10–15 € im Jahr), das Hosting bleibt kostenlos.

---

## 1. Repository anlegen und Dateien hochladen

1. Auf github.com oben rechts **+ → New repository**.
2. Name z. B. `beewise`. **Public** wählen (Pages ist bei privaten Repos nur im
   Bezahltarif verfügbar). Kein README ankreuzen.
3. **Create repository**.
4. Auf der leeren Repo-Seite: **uploading an existing file**.
5. Den **Inhalt** des entpackten Ordners hineinziehen – also `index.html`, die Ordner `css`,
   `js`, `icons`, dazu `manifest.webmanifest`, `sw.js`, `.nojekyll`.
   Wichtig: nicht den Ordner `beewise` selbst hochladen, sondern das, was darin liegt.
   `index.html` muss ganz oben im Repository liegen.
6. Unten **Commit changes**.

Mit Git auf der Kommandozeile geht es genauso:

```bash
cd beewise
git init && git branch -M main
git add . && git commit -m "BeeWise"
git remote add origin https://github.com/<DEIN-NAME>/beewise.git
git push -u origin main
```

## 2. Pages einschalten

> **Die häufigste Verwechslung:** GitHub hat *zwei* Seiten namens „Pages".
>
> * `github.com/settings/pages` → das sind die **Kontoeinstellungen**. Dort steht nur
>   „Verified domains". **Falsch** – hier lässt sich Pages nicht einschalten.
> * `github.com/<DEIN-NAME>/beewise/settings/pages` → die **Repository-Einstellungen**.
>   **Richtig.**
>
> Der Unterschied im Bildschirm: das Zahnrad **Settings** oben rechts neben deinem
> Profilbild führt zum Konto. Du brauchst den Reiter **Settings** *innerhalb des
> Repositorys* – in der Zeile mit *Code · Issues · Pull requests · Actions · Projects ·
> Wiki · Security · Insights · **Settings***.

1. Repository öffnen: `github.com/<DEIN-NAME>/beewise`
2. Ganz rechts in der Reiterzeile des Repositorys auf **Settings**.
   (Der schnellste Weg: die Adresse direkt eintippen –
   `github.com/<DEIN-NAME>/beewise/settings/pages`)
3. Linke Spalte, Abschnitt *Code and automation* → **Pages**.
4. Unter *Build and deployment* → *Source*: **Deploy from a branch**.
5. Branch: **main**, Ordner: **/ (root)** → **Save**.
6. Ein bis zwei Minuten warten, Seite neu laden. Oben steht dann:
   `Your site is live at https://<DEIN-NAME>.github.io/beewise/`

**Wenn der Reiter Settings im Repository fehlt:** dann bist du nicht der Eigentümer des
Repositorys oder in einer fremden Organisation.
**Wenn unter Pages steht, das Feature sei nicht verfügbar:** das Repository ist privat.
Entweder auf *Public* umstellen (Settings → ganz unten *Change repository visibility*)
oder GitHub Pro nutzen.

Diese Adresse ist ab jetzt deine App. Jeder weitere Upload aktualisiert sie automatisch.

> Die Datei `.nojekyll` liegt schon im Projekt. Sie sorgt dafür, dass GitHub die Dateien
> unverändert ausliefert und nicht durch seinen Blog-Generator schickt.

## 3. Aufs Handy holen – als echtes App-Symbol

Die Adresse **im Handy-Browser** öffnen (nicht in einer App-internen Browseransicht):

**Android / Chrome**
- Menü ⋮ → **App installieren** (oder „Zum Startbildschirm hinzufügen")
- alternativ: in BeeWise unter *Mehr → Als App installieren* den Knopf drücken

**iPhone / Safari** (muss Safari sein, Chrome auf iOS kann es nicht)
- Teilen-Symbol ⬆️ → nach unten scrollen → **Zum Home-Bildschirm** → *Hinzufügen*

Danach hast du:

* ein Bienenbeuten-Symbol auf dem Startbildschirm
* Vollbild ohne Browserleiste
* Offline-Betrieb am Bienenstand (die App wird beim ersten Start zwischengespeichert)
* Daten bleiben auf dem Gerät

Das ist eine „progressive Web-App". Für dich fühlt sie sich an wie eine normale App.
Der einzige echte Unterschied zu einer Play-Store-App: Erinnerungen kann sie nur zeigen,
solange sie zwischendurch geöffnet wird – siehe unten.

### Nach einem Update

Die App aktualisiert sich beim nächsten Start selbst. Falls nicht: App schließen und neu
öffnen, oder im Browser einmal neu laden. Deine Daten bleiben dabei erhalten.

---

## 3b. Änderungen einspielen – die Routine

Egal ob du selbst etwas änderst oder eine neue Fassung bekommst: es ist immer derselbe
Dreischritt.

### Weg A – über die Website (ohne zusätzliche Programme)

1. Repository öffnen → **Add file** → **Upload files**.
2. Die geänderten Dateien hineinziehen. Gleichnamige Dateien werden ersetzt.
   Im Zweifel einfach *alle* Dateien nochmal hochladen – GitHub speichert nur, was sich
   wirklich geändert hat.
   **Achtung bei Unterordnern:** Ziehst du `js/app.js` einzeln hinein, landet sie im
   Wurzelverzeichnis. Entweder den **ganzen Ordner** `js` hineinziehen oder unten im Feld
   *„Name your file…"* den Pfad `js/app.js` von Hand angeben.
3. Unten eine kurze Beschreibung eintippen (z. B. „Kartenfehler behoben") →
   **Commit changes**.

### Weg B – mit GitHub Desktop (angenehmer ab der zweiten Änderung)

Einmalig: [desktop.github.com](https://desktop.github.com) installieren, anmelden,
*File → Clone repository → beewise* auf die Festplatte holen.

Danach bei jeder Änderung:

1. Neue Dateien in den geklonten Ordner kopieren und Nachfrage mit *Ersetzen* bestätigen.
2. In GitHub Desktop stehen links alle Änderungen. Unten links eine Beschreibung
   eintippen → **Commit to main**.
3. Oben **Push origin** drücken.

Weg B hat zwei Vorteile: du siehst vor dem Übertragen genau, was sich geändert hat, und
Unterordner können nicht verrutschen.

### Was danach passiert

* GitHub baut die Seite neu. Im Reiter **Actions** siehst du den Lauf
  *„pages build and deployment"* – ist er grün, ist die Änderung live. Dauert ein bis
  zwei Minuten.
* **Am PC:** Seite neu laden. Kommt noch die alte Fassung, einmal Strg + Umschalt + R.
* **Am Handy:** die installierte App vollständig schließen (aus der App-Übersicht wischen)
  und neu öffnen. BeeWise liefert beim Start die gespeicherte Fassung aus und lädt die neue
  im Hintergrund – beim übernächsten Start ist sie aktiv. Zweimal öffnen, dann ist alles da.
* **Deine Daten bleiben.** Völker, Durchsichten und Erledigungen liegen in der Datenbank
  des Browsers, nicht in den hochgeladenen Dateien. Ein Update rührt sie nicht an.

### Zwei Regeln, die Ärger ersparen

1. **Vor größeren Updates einmal sichern:** *Mehr → Sicherung exportieren*. Kostet zehn
   Sekunden und rettet dich, falls etwas schiefgeht.
2. **Nicht an zwei Stellen gleichzeitig bearbeiten.** Entweder im Browser auf github.com
   oder lokal mit GitHub Desktop – sonst überschreibst du dir selbst etwas. Wenn du doch
   beides nutzt: in GitHub Desktop vor dem Arbeiten **Fetch origin** / **Pull** drücken.

---

## 4. Eigene Domain (optional)

1. Domain kaufen, z. B. `imkerei-settler.de` (Namecheap, INWX, Netcup, Strato – ca. 10–15 €/Jahr).
2. Beim Anbieter im DNS eintragen:

   **Für `www.deine-domain.de`** – ein CNAME:
   ```
   www    CNAME    <DEIN-NAME>.github.io
   ```

   **Für die Domain ohne www** (`deine-domain.de`) – vier A-Einträge:
   ```
   @   A   185.199.108.153
   @   A   185.199.109.153
   @   A   185.199.110.153
   @   A   185.199.111.153
   ```

3. In GitHub: **Settings → Pages → Custom domain** die Domain eintragen, **Save**.
   GitHub legt automatisch eine Datei `CNAME` im Repository an.
4. Warten, bis „DNS check successful" erscheint (Minuten bis wenige Stunden), dann
   **Enforce HTTPS** ankreuzen. Das Zertifikat stellt GitHub kostenlos aus.

Danach läuft BeeWise unter deiner Adresse. Wer die App schon installiert hat, sollte sie
einmal neu installieren, damit sie auf die neue Adresse zeigt.

---

## 5. Abgleich zwischen Handy und PC einrichten

Der übliche Ablauf: am Bienenstand mit dem Handy erfassen, zu Hause am PC auswerten und
Protokolle drucken. Dafür braucht BeeWise keinen Server – es nutzt ein **privates
GitHub-Repository** als Ablage. Kostenlos, und jede Übertragung ist ein Commit: du hast
nebenbei eine Versionsgeschichte mit Wiederherstellungspunkten.

1. **Zweites, privates Repository anlegen**, z. B. `beewise-daten`.
   Wichtig: **Private**, nicht Public – da liegen deine Betriebsdaten drin.
2. **Zugriffsschlüssel erzeugen:** github.com → Settings (dein Profil, nicht das Repo) →
   Developer settings → Personal access tokens → **Fine-grained tokens** → *Generate new token*
   * Repository access: **Only select repositories** → `beewise-daten`
   * Permissions → Repository permissions → **Contents: Read and write**
   * Ablaufdatum nach Geschmack (bei Ablauf einfach einen neuen erzeugen)
   * Token kopieren – er wird nur einmal angezeigt
3. In BeeWise: **Mehr → Abgleich zwischen Geräten → Einrichten**
   * Repository: `deinname/beewise-daten`
   * Zugriffsschlüssel: der kopierte Token
   * Name dieses Geräts: „Handy" bzw. „PC"
   * **Verbindung prüfen** → dann **Speichern**
4. Dasselbe auf dem zweiten Gerät eintragen.
5. Auf beiden Geräten **Jetzt abgleichen** drücken – fertig.

**Wie das Zusammenführen funktioniert:** Beim Abgleich holt BeeWise zuerst den Stand von
GitHub, führt ihn datensatzweise mit dem lokalen zusammen und schreibt erst dann zurück.
Bei jedem einzelnen Datensatz gewinnt die jüngere Änderung; Gelöschtes bleibt gelöscht.
Dadurch gehen Einträge des anderen Geräts nicht verloren, auch wenn beide am selben Tag
etwas erfasst haben. Nur wenn ihr **denselben Datensatz** auf beiden Geräten ändert,
gewinnt der spätere – das ist der einzige Fall, in dem etwas überschrieben wird.

**Praxisregel:** vor dem Losfahren einmal abgleichen, nach der Durchsicht wieder. Dann sind
beide Geräte immer gleich.

**Sicherheit:** Der Schlüssel liegt unverschlüsselt auf dem Gerät – wie in jeder App, die
sich irgendwo anmeldet. Deshalb der fein abgestufte Token, der nur auf dieses eine private
Repository und nur auf Dateiinhalte zugreifen darf. Geht ein Gerät verloren, widerrufst du
ihn auf github.com, und der Zugriff ist sofort weg.

**Ohne GitHub geht es auch:** *Mehr → Sicherung exportieren* legt eine JSON-Datei ab, die du
über einen Cloud-Ordner auf das andere Gerät bringst und dort einspielst. Das ersetzt
allerdings die lokalen Daten, statt sie zusammenzuführen – für den regelmäßigen Wechsel
zwischen zwei Geräten ist der GitHub-Abgleich der bessere Weg.

---

## 6. Und wenn es doch eine APK sein soll?

Brauchst du nur für zwei Dinge: Verteilung über den Play Store und **echte zeitgesteuerte
Erinnerungen**, die auch aufpoppen, wenn die App wochenlang nicht geöffnet wurde.

Der Weg ist vorbereitet:

* `.github/workflows/apk.yml` baut bei jedem Push eine Debug-APK. Nach dem Push:
  Reiter **Actions** → letzter Lauf → unten **Artifacts** → `beewise-debug-apk` herunterladen,
  auf dem Handy öffnen, Installation aus unbekannten Quellen erlauben.
* Für den Play Store zusätzlich: Entwicklerkonto (einmalig 25 US-$), signiertes Bundle
  (`./gradlew bundleRelease`), Datenschutzerklärung, Store-Grafiken.

Für den Eigengebrauch und zum Weitergeben an Imkerkollegen reicht die installierte
Web-App vollständig.

---

## Kurzfassung

| Was | Wie | Kosten |
|---|---|---|
| Adresse im Netz | GitHub Pages, Deploy from branch `main` / root | 0 € |
| App-Symbol am Handy | Browsermenü → installieren / Zum Home-Bildschirm | 0 € |
| Offline am Stand | passiert automatisch beim ersten Start | 0 € |
| Eigene Domain | DNS-Einträge + Settings → Pages → Custom domain | Domain ~12 €/Jahr |
| APK | GitHub-Action „Android-APK bauen", Artefakt herunterladen | 0 € |
| Play Store | signiertes Bundle + Entwicklerkonto | einmalig 25 US-$ |

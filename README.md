# BeeWise

Digitale Stockkarte für Imkerinnen und Imker: Völker und Standorte führen, Durchsichten
protokollieren – und vor allem: **Aufgaben, die sich selbst terminieren**, nach Tracht,
Wetter und tatsächlich erledigter Vorarbeit.

Eine einzige Codebasis für beide Ziele:

* **Web** – statische Dateien, laufen auf jedem Webspace unter eigener Domain, installierbar als PWA
* **Android** – dieselben Dateien, mit Capacitor in eine APK verpackt, Play-Store-fähig

Kein Backend, kein Konto, keine laufenden Kosten. Alle Daten liegen auf dem Gerät.

---

## Schnellstart

```bash
# lokal ausprobieren – irgendein statischer Server, ES-Module brauchen http://
python3 -m http.server 8080
# → http://localhost:8080
```

Beim ersten Start: „Beispieldaten laden" drücken, dann sieht man das Verhalten sofort.
Zum Zurücksetzen: Mehr → Alles löschen.

---

## Wie die Terminierung funktioniert

Das ist der Kern. **Aufgaben werden nicht gespeichert, sondern jedes Mal neu berechnet.**
Gespeichert werden nur Erledigungen. Verschiebt sich eine Arbeit, verschiebt sich der
ganze Rest der Kette automatisch mit.

Jede Regel in `js/regeln.js` hängt an einem von vier Ankern:

| Anker | Bedeutung | Beispiel |
|---|---|---|
| `datum` | festes Kalenderfenster | Völker melden, 1.12. – 15.1. |
| `bluete` | relativ zu Blühbeginn/-ende am Standort | Honigraum aufsetzen, ab Rapsblühbeginn − 10 Tage |
| `nachAufgabe` | relativ zum **tatsächlichen** Erledigungsdatum einer anderen Aufgabe | Sommerbehandlung 2 = Behandlung 1 + 14 bis 21 Tage |
| `wetter` | relativ zu einem aus Temperaturdaten abgeleiteten Ereignis | Restentmilbung = 3 Wochen nach Beginn der ersten Frostperiode |

Dazu:

* `fenster: [a, b]` – frühestens a, spätestens b Tage nach dem Anker
* `wiederholung: {min, max}` – Abstand zur **eigenen letzten Erledigung**, nicht zum
  Kalender. Die Schwarmkontrolle ist damit immer „7 bis 9 Tage seit deiner letzten
  Kontrolle", nicht „jeden Dienstag".
* `benoetigt: [regelId]` – harte Vorbedingung. Fehlt sie, steht die Aufgabe auf
  „wartet auf …" statt fällig zu werden, mit sichtbarem Grund.
* `saisonEnde`, `haerteFrist` – Klammern, damit nichts in die falsche Jahreszeit rutscht
  (z. B. Auffütterung spätestens 20.9., egal wie spät die Ernte war).

Die Beispielkette, an der man das Prinzip sieht:

```
Lindenblüte endet  →  Sommertracht ernten
                        ├─ +1…10 Tage  → Sommerbehandlung 1
                        │                   ├─ +14…21 Tage → Sommerbehandlung 2
                        │                   │                  └─ +7…24 → Erfolgskontrolle
                        │                   └─ +0…14 Tage  → Auffüttern beginnen
                        │                                      └─ +14…35, spätestens 20.9.
                        │                                         → Auffütterung abschließen
                        └─ +2…30 Tage  → Rühren und Abfüllen
```

Erntet man zehn Tage später, rücken alle acht Folgetermine mit. Erntet man gar nicht,
stehen sie als „wartet auf: Sommertracht ernten" mit Prognosedatum da.

Zustände: `überfällig` · `fällig` · `bald` (21 Tage Vorschau) · `wartet` · `verpasst`.
Ab 21 Tagen Überfälligkeit mahnt die App nicht weiter – ein im Mai versäumter Baurahmen
soll im August nicht mehr die Liste verstopfen.

---

## Woher die Trachtdaten kommen

Drei Ebenen, in dieser Rangfolge:

**1. Deine Bestätigung.** Wenn das Modell den Blühbeginn in den nächsten zehn Tagen
erwartet, fragt die App auf dem Heute-Schirm genau einmal nach: „Blüht der Raps am Stand
Hausgarten schon?" Antwort „Ja" setzt das Datum hart, „Noch nicht" schiebt das Modell
nach hinten. Gefragt wird nur nach Arten, an denen wirklich ein Termin hängt.

**2. Wärmesummen-Modell aus echten Temperaturdaten** ([Open-Meteo](https://open-meteo.com),
kostenfrei für nicht-kommerzielle Nutzung, kein Schlüssel, CORS-fähig, direkt aus dem
Browser abrufbar).

Das Modell ist **selbstkalibrierend**, es gibt keine gepflegte Schwellenwerttabelle:

1. Für jeden Standort werden zehn Jahre Wetterarchiv geholt und daraus die örtliche
   Klimatologie der Wärmesumme (Gradtage über 5 °C ab 1. Januar) berechnet.
2. Die Wärmesumme, die dort im langjährigen Mittel bis zum typischen Blühbeginn einer Art
   zusammenkommt, **ist** die Schwelle dieser Art an diesem Ort.
3. Im laufenden Jahr wird geschaut, wann diese Schwelle erreicht wird – aus Messwerten,
   16 Tagen Vorhersage und, darüber hinaus, der örtlichen Klimatologie.

Dadurch stimmen Höhenlage, Nord-Süd-Gefälle und Stadtwärme automatisch. Ein um 1,5 K zu
warmes Jahr verschiebt die Blüte im Test korrekt um rund elf Tage nach vorn.

Ausgenommen: Hasel und Erle (deren Blüte steuert die Tageslänge, nicht die Wärme) sowie
Waldtracht/Honigtau (nicht vorhersagbar – wird nur als Erfahrungsfenster angezeigt).

**3. Kalendermittel**, wenn kein Netz da ist. Die App funktioniert am Bienenstand
vollständig offline; Wetterdaten werden gecacht.

### Bleibt das über Jahre genau?

Ja – die App wird sogar besser, statt zu veralten:

* Die **Klimatologie trägt die Jahreszahl im Cache-Schlüssel**. Im Januar rechnet die App sie
  automatisch mit dem dann aktuellen 10-Jahres-Fenster neu. Die Datengrundlage schiebt sich
  also jedes Jahr mit, ohne dass jemand daran denken muss.
* **Jede bestätigte Blüte wird zur Kalibrierung.** Wenn du meldest „Raps blüht seit heute",
  speichert die App nicht nur das Datum, sondern auch die **an diesem Tag erreichte Wärmesumme**.
  Im Folgejahr ist der Mittelwert deiner eigenen Beobachtungen die Schwelle für diese Art an
  diesem Standort – nicht mehr das bundesweite Kalendermittel. In der Trachtansicht steht dann
  „Modell, kalibriert an 2 Beobachtungen".

Nach zwei, drei Jahren rechnet die App also mit deinen Blühterminen an deinem Stand.

### Warum nicht der DWD?

Der Deutsche Wetterdienst veröffentlicht unter
`opendata.dwd.de/climate_environment/CDC/observations_germany/phenology/immediate_reporters/`
**tagesaktuelle echte Blühmeldungen** der Sofortmelder – Salweide, Löwenzahn, Robinie,
Sommerlinde, Raps und weitere, frei nutzbar. Das ist die genauere Quelle und wäre die
natürliche Ausbaustufe.

Es geht nur nicht direkt aus dem Browser: der DWD-Server setzt keine CORS-Header, und die
Dateien sind stationsweise Textdateien, die man parsen und der nächstgelegenen Station
zuordnen muss. Dafür braucht es einen kleinen Server-Proxy (eine Cloud-Function genügt,
die einmal täglich die Dateien einliest und pro Station JSON ausliefert).

Das Trachtmodul ist dafür vorbereitet: `js/tracht.js` kapselt die Quelle vollständig.
Ein DWD-Provider muss nur dasselbe Ergebnisformat liefern
(`{art, start, ende, status, quelle, prognose}`), dann rechnet die Engine unverändert weiter.

---

## Aufbau

```
index.html              Gerüst, Tabbar
css/app.css             Design-Tokens, Hell/Dunkel automatisch
js/util.js              Datums- und Formathelfer (lokale Zeit, keine UTC-Fallen)
js/db.js                IndexedDB + Export/Import + vorbereiteter Sync
js/tracht.js            Wetterabruf, Klimatologie, Wärmesummen-Modell,
                        Stundenvorhersage und imkerliche Wetterbewertung
js/regeln.js            Regelkatalog – hier steht das imkerliche Wissen
js/engine.js            Fälligkeitsberechnung, Abhängigkeiten, Trachtfragen
js/aufgaben.js          eigene und automatisch ausgelöste Aufgaben
js/karte.js             Luftbildkarte ohne Fremdbibliothek, Adresssuche
js/bilder.js            Trachtbilder über die Wikipedia-Schnittstelle
js/hilfe.js             Videohilfe (kanalgebundene Suchlinks)
js/kalenderexport.js    .ics-Export, nach Stichtag gebündelt
js/stand.js             Stand-Modus: Durchgang Volk für Volk
js/koeniginnen.js       Königinnen, Jahrgänge, Abstammung
js/fotos.js             Fotos zu Durchsichten (verkleinern, Speicher im Blick)
js/qr.js                QR-Erzeugung (Byte-Modus, Fehlerkorrektur M, Version 1–10)
js/etiketten.js         Aufkleberbogen für die Beuten
js/pdf.js               kleiner PDF-Schreiber (A4, Helvetica, Tabellen)
js/berichte.js          Behandlungsprotokoll und Volkshistorie als PDF
js/sync.js              Geräteabgleich über ein privates GitHub-Repository
js/i18n.js              Mehrsprachigkeit (Schlüssel = deutsche Originaltexte)
js/lang/en.js           englisches Sprachpaket
js/ui.js                Bottom-Sheet, Toast, Formularfelder
js/app.js               Ansichten und Interaktion
sw.js                   Service Worker (Hülle offline, Wetter network-first)
build-einzeldatei.py    baut alles zu einer HTML-Datei für schnelle Tests
```

Kein Build-Schritt, keine Abhängigkeiten, keine Frameworks. Reine ES-Module – das hält die
App klein, macht sie in fünf Jahren noch wartbar und lässt sich unverändert in Capacitor
verpacken.

### Datenmodell

Alle Datensätze tragen eine Sync-Hülle: `id`, `updatedAt`, `deletedAt` (Tombstone statt
echtem Löschen), `rev`, `dirty`.

| Store | Inhalt |
|---|---|
| `standorte` | Name, Koordinaten, Notiz |
| `voelker` | Name, Standort, Königinnenjahrgang, Beute, Zargen, Herkunft |
| `durchsichten` | Wabengassen, Brutbild, Königin, Weiselzellen, Futter, Milbenfall, Notiz |
| `erledigungen` | regelId, Ziel, Datum, Status, erfasste Werte – **die Wahrheit für die Terminierung** |
| `tracht` | Blühmeldungen des Imkers samt erreichter Wärmesumme (Kalibrierung) |
| `aufgaben` | eigene und automatisch ausgelöste Aufgaben |
| `wanderungen` | Standortwechsel eines Volkes mit Datum und Notiz |
| `meta` | Einstellungen, Wetter-Caches |

### Abgleich zwischen Geräten

Eingebaut: `js/sync.js` gleicht über ein **privates GitHub-Repository** ab – kostenlos, ohne
Server, direkt aus dem Browser (die GitHub-Schnittstelle erlaubt CORS). Ablauf: holen →
datensatzweise zusammenführen (`db.mischeEin`, jüngeres `updatedAt` gewinnt, Löschmarken
bleiben) → zurückschreiben. Jede Übertragung ist ein Commit, also eine Versionsgeschichte
gratis dazu. Einrichtung: `HOSTING.md`, Abschnitt 5.

### Eigenes Sync-Backend nachrüsten

`db.Sync` ist vorbereitet. Es fehlt nur ein Adapter mit `push(records)` und `pull(seit)`:

```js
db.Sync.adapter = {
  async push(records) { await fetch('/api/sync', {method:'POST', body: JSON.stringify(records)}); },
  async pull(seit)    { return (await fetch('/api/sync?seit=' + (seit || ''))).json(); },
};
await db.Sync.syncNow();
```

Konfliktregel ist derzeit Last-Write-Wins über `updatedAt`. Für Mehrgeräte-Betrieb mit
zwei Imkern am selben Volk wäre feldweises Mergen besser.

---

## Bedienung – was wo passiert

| Reiter | Inhalt |
|---|---|
| **Heute** | Durchgang starten, Kennzahlen, Trachtrückfragen, Aufgaben nach Dringlichkeit gruppiert, Kategorienfilter, eigene Aufgabe anlegen, Kalenderexport, aufklappbarer Aufgabenkatalog |
| **Kalender** | Monatsraster; jede offene Aufgabe steht an genau einem Tag – ihrem nächsten Arbeitstag – und rückt weiter, solange sie liegen bleibt. Tag antippen zeigt die Liste |
| **Völker** | nach Standort gruppiert, mit Luftbild oder eigenem Foto; Detailseite mit Aufgaben, Saisonbilanz, Volksstärkekurve und vollständigem Verlauf |
| **Tracht** | je Standort einklappbar, Art antippen zeigt Bild und Beschreibung, Blüte bestätigen |
| **Mehr** | Stände, Völkerverwaltung, PDF-Berichte, Geräteabgleich, Sicherung, Erinnerungen |

### Stand-Modus – der Durchgang

Der Rest der App ist zum Auswerten gebaut, dieser Teil zum Erfassen: ein Volk je Bildschirm,
große Flächen, wenige Angaben, sofort gespeichert.

* **Heute → „Durchgang am Bienenstand"** (oder in *Völker* je Stand). Bei mehreren Ständen
  fragt die App zuerst, wo du stehst.
* Je Volk: die offenen Aufgaben als große Kästen zum Antippen (der Knopf rechts öffnet das
  ausführliche Fenster, wenn Erntemenge oder Präparat dazugehören), darunter der Kurzbefund –
  besetzte Wabengassen, Weiselzustand, Schwarmstimmung, Futter, Sanftmut, Notiz.
* **„Ohne Befund"** trägt in einem Griff ein, was der Normalfall ist (weiselrichtig, keine
  Schwarmstimmung, keine Weiselzellen), und blättert weiter. Was dabei gespeichert wird, steht
  ausdrücklich darunter – die App erfindet nichts, was du nicht gesehen hast.
* Gespeichert wird bei jedem Blättern – über die Pfeile **oder durch Wischen** nach links und
  rechts. Ein leerer Akku kostet höchstens das Volk, an dem du gerade stehst.
* **Foto je Durchsicht:** ein Bild sagt bei Brutbildern und Krankheitsverdacht mehr als jede
  Notiz. Wichtig für die Umsetzung: der Dateidialog muss **innerhalb der Nutzergeste** geöffnet
  werden – ein einziges `await` davor (etwa auf eine Einstellung aus der Datenbank) und Handy-
  Browser blocken ihn ohne Fehlermeldung. Die Bildgröße wird deshalb beim Start gelesen und
  gehalten; `capture` setzt die App nicht, damit auch die Galerie zur Auswahl steht. Aufgenommen wird mit der Kamera, gespeichert die längste Kante mit 1024 Punkten
  (etwa 100 kB je Bild, einstellbar). Fotos bleiben auf dem Gerät und gehen in die
  Sicherungsdatei mit, aber **nicht in den Geräteabgleich** – sonst wüchse das Sync-Repository
  mit jeder Woche. Unter *Mehr → Daten* steht, wie viel Platz sie belegen, und alte Jahrgänge
  lassen sich löschen. Größenordnung: zehn Völker, acht Durchsichten im Jahr, je ein Bild
  ≈ 10 MB im Jahr.
* Eine Durchsicht mit Angabe zur Schwarmstimmung hakt eine fällige Schwarmkontrolle gleich mit
  ab; Milbenfall, Weisellosigkeit oder knappes Futter lösen wie sonst automatisch Aufgaben aus.
* Am Ende eine Bilanz und die Aufgaben, die dem Stand selbst gelten (Flugloch, Mäusegitter).

**Freitext diktieren:** das Notizfeld ist ein normales Textfeld – die Mikrofontaste der
Bildschirmtastatur diktiert hinein. Android und iPhone bringen ihre Diktierfunktion mit, sie
arbeitet auf neueren Geräten direkt am Gerät und damit auch ohne Netz. BeeWise fängt Sprache
bewusst **nicht** selbst ab und versucht auch nicht, Gesagtes in Felder zu zerlegen: Wörter wie
„Wabengassen", „Spielnäpfchen" oder „weiselrichtig" erkennt keine allgemeine Spracherkennung
verlässlich, im Browser braucht sie eine Netzverbindung, und in der auf den Startbildschirm
gelegten Fassung arbeitet sie auf iOS nicht zuverlässig. Ein Tippfeld, das immer funktioniert,
ist am Stand mehr wert als eine Sprachsteuerung, die zweimal von drei Malen klappt.

### Königinnen und Abstammung

Am Volk stand bisher nur ein Jahrgang. Jetzt gibt es je Königin einen eigenen Datensatz mit
Anfang und Ende:

* **Königinnenkarte** in der Volksansicht: Jahrgang mit Zeichenfarbe nach dem internationalen
  Code, Saison (»3. Saison«), Herkunft (Standbegattung, Belegstelle, künstlich besamt, gekauft,
  Nachschaffung, Schwarm), Rasse, Züchter oder Belegstelle, Muttervolk, im Volk seit.
* **Umweiseln** in einem Gang: die alte Königin wird mit Datum und Grund abgeschlossen und
  bleibt im Verlauf, die neue kommt als eigener Eintrag dazu. Dazu legt BeeWise automatisch die
  Kontrolle »Legebeginn prüfen« in drei Wochen an.
* **Umweiselaufgabe ab der dritten Saison** – aber nur bei den Völkern, deren Königin wirklich
  alt ist. Dafür können Regeln jetzt eine `bedingung(ziel, ctx)` tragen; ohne sie stünde die
  Aufgabe bei jedem Volk und würde ignoriert.
* Rückwärtsverträglich: `volk.koeniginJahr` wird weiter mitgeschrieben, damit Farbpunkt,
  Aufkleber und PDF-Berichte unverändert funktionieren – auch für Völker, deren Königin nie
  erfasst wurde.

### Ableger werden echte Völker

Beim Abhaken von »Ableger bilden« fragt BeeWise, ob daraus Völker werden sollen. Jeder Ableger
bekommt eine eigene Stockkarte, den Verweis auf das Muttervolk, das Bildungsdatum – und damit
den **Jungvolkstatus**: im Jahr der Bildung rechnet der Futterrechner mit weniger Winterfutter.
Zusätzlich entsteht je Ableger die Kontrolle »Legebeginn prüfen« nach drei bis vier Wochen.

### QR-Aufkleber an der Beute

Unter *Mehr → Berichte* (klein verlinkt) erzeugt BeeWise einen Aufkleberbogen: je Volk ein
QR-Code mit Name, Stand und Königinnenjahrgang. Kamera draufhalten – die Stockkarte dieses
Volkes geht auf. Gescannt wird mit der **normalen Kamera-App**; iPhone und Android erkennen
QR-Codes von sich aus, deshalb braucht BeeWise keine Kameraberechtigung und keinen eigenen
Scanner. Die Adresse im Code ist im Fenster sichtbar und änderbar – sie muss die
veröffentlichte sein, nicht die Datei auf dem PC.

Der QR-Erzeuger (`js/qr.js`) ist selbst geschrieben, damit keine Fremdbibliothek dazukommt:
Byte-Modus, Fehlerkorrektur M, Versionen 1–10. Geprüft gegen eine Referenzimplementierung und
gegen einen echten Decoder.

Details, die im Alltag zählen:

* **Gleiche Aufgabe über mehrere Völker** wird zu einer Zeile zusammengefasst; im Sheet wählt
  man ab, welche Völker erledigt sind.
* **„Danach: …"** – eine kleine Zeile im Aufgabenfenster nennt, was an dieser Aufgabe hängt,
  mit dem Abstand in Tagen („Sommerbehandlung 1 (1–10 Tage später)"). Nach dem Abhaken sagt die
  Meldung konkret, was nachgerückt ist. Bewusst grau und höchstens zwei Nachfolger: es ist
  Einordnung, keine zweite Aufgabenliste.
* **Automatische Folgeaufgaben:** Milbenfall über der Monatsschwelle (Mai/Juni 1, Juli 5,
  August 10 pro Tag), weiselloses Volk, verdeckelte Weiselzellen oder knappes Futter erzeugen
  sofort eine eigene, terminierte Aufgabe – sichtbar am Vermerk „automatisch".
* **Futterrechner** in der Einfütterungsaufgabe: Zielvorrat nach Beute, korrigiert nach
  Wabengassen und Jungvolk, minus vorhandenem Vorrat; vorbelegt aus der letzten Durchsicht,
  Ergebnis in kg Fertigsirup bzw. Zucker plus Wasser.
* **Einheiten stehen an jedem Feld**, dazu Richtwerte im Kleingedruckten (z. B. Ameisensäure
  Schwammtuch ≈ 1 ml je Liter Beutenvolumen, Oxalsäure 5 ml je besetzter Wabengasse).
* **Gläser** werden beim Abfüllen aus Menge und Glasgröße (Vorgabe 500 g) berechnet und lassen
  sich überschreiben.
* **Videohilfe** in jedem Aufgabenfenster – kanalgebundene Suchlinks auf die Playlist
  „Tipps und Tricks für Imker" (Land.Schafft.Bayern), plus eine allgemeine Suche.
* **Wanderung / Umzug:** ein Volk auf einen anderen Stand setzen; der Wechsel steht im
  Verlauf, die Historie bleibt beim Volk, Tracht und Wetter rechnen ab sofort für den neuen
  Standort. Beim Löschen eines Standes fragt BeeWise, ob die Völker umziehen oder mit weg sollen.
* **PDF-Berichte** ohne Fremdbibliothek (`js/pdf.js`): Behandlungsprotokoll eines Jahres für
  die Bestandsdokumentation und die vollständige Stockkarte eines Volkes.
* **Kalenderexport:** ein Sammeltermin je Stichtag („Imkereiaufgaben offen (3)"), nicht ein
  Eintrag je Aufgabe – sonst wäre der Kalender unbrauchbar. Details stehen in der App.
* **Wetter je Bienenstand:** eine kompakte Zeile mit Lage, Temperatur und Wind, dazu eine
  Bewertung („gut / mäßig / ungünstig / gereizt") auf *Heute* und *Völker*. Antippen öffnet
  die nächsten 24 Stunden, die nächsten Tage und die betroffenen Aufgaben.
* **Wetter terminiert mit:** Aufgaben tragen einen Wetteranspruch (`oeffnen`, `as`, `os`,
  `trocken`). Passt die Lage nicht, steht am Kärtchen ein Hinweis wie „Bienen wahrscheinlich
  gereizt · besser morgen früh, ab 6 Uhr"; im Aufgabenfenster stehen die Gründe.
* **Zurück kommt man immer:** Fenster haben oben einen Zurück-Knopf und ein Kreuz, reagieren
  auf Escape, auf Wischen nach unten, auf Tippen daneben und auf die Zurück-Taste des Geräts.
  Aus der Volksansicht führt der Pfeil in der Kopfzeile zur Liste.
* **Pollenfarbe je Tracht:** beim Aufklappen einer Art steht, wie ihr Pollen in der Zelle
  aussieht – Farbtupfer nach Bestimmungstafel plus Beschreibung (Löwenzahn leuchtend orange,
  Phacelia schiefergrau-blau, Springkraut weiß). Fotos einzelner Pollenfarben in der Wabe
  gibt es frei lizenziert praktisch nicht; ein falsch zugeordnetes Foto wäre schlechter als
  eine saubere Farbangabe.
* **Trachtbilder:** echte Fotos aus Wikipedia, klein neben dem Namen, groß beim Aufklappen.
  Botanische Zeichnungen werden automatisch aussortiert; die Bilder werden vollständig
  angezeigt statt beschnitten.

## Auf dem Handy testen – kostenlos

Drei Wege, aufsteigend nach Aufwand:

1. **Im selben WLAN** (Sekunden, nichts einzurichten):
   ```bash
   python3 -m http.server 8080     # im Projektordner
   ```
   Dann am Handy `http://<IP-des-Rechners>:8080` öffnen. Achtung: ohne HTTPS laufen
   Service Worker und GPS nicht – zum Anschauen reicht es, zum Installieren nicht.

2. **GitHub Pages** (dauerhaft, kostenlos, HTTPS): Repository anlegen, Dateien hineinlegen,
   unter *Settings → Pages* die Quelle auf den Hauptzweig stellen. Die App liegt dann unter
   `https://<name>.github.io/<repo>/` – am Handy öffnen, „Zum Startbildschirm hinzufügen",
   fertig. Damit ist auch die spätere eigene Domain nur noch eine DNS-Einstellung.

3. **Netlify Drop** (`app.netlify.com/drop`): Ordner ins Browserfenster ziehen, sofort eine
   HTTPS-Adresse. Praktisch für schnelle Zwischenstände.

Für die APK ohne installiertes Android Studio: der mitgelieferte GitHub-Workflow baut sie
bei jedem Push (siehe unten).

## Ins Netz stellen

**Ausführliche Anleitung für GitHub Pages, Handy-Installation und eigene Domain:
[HOSTING.md](HOSTING.md).** Kurzfassung: Dateien ins Repository, Settings → Pages →
Deploy from branch `main` / root, fertig – die App liegt unter
`https://<name>.github.io/<repo>/` und lässt sich am Handy als App mit eigenem Symbol
installieren.

### Andere Wege

Es sind statische Dateien. Alles, was HTTPS kann, reicht:

```bash
# Beispiel Netlify
npx netlify deploy --prod --dir .

# Beispiel: eigener Webspace
rsync -av --delete ./ user@server:/var/www/stockkarte/
```

HTTPS ist Pflicht, sonst laufen Service Worker und Geolocation nicht. Ein Unterverzeichnis
funktioniert, weil alle Pfade relativ sind.

Danach ist die Seite im Handy-Browser über „Zum Startbildschirm hinzufügen" installierbar
und läuft im Vollbild wie eine App.

---

## Als Android-App (APK / Play Store)

```bash
npm install
npx cap add android
npx cap sync
npx cap open android        # baut in Android Studio
```

Debug-APK ohne Android Studio:

```bash
npx cap sync android
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

Diese Datei kann man direkt verteilen (Nutzer muss „Installation aus unbekannten Quellen"
erlauben). Für den Play Store stattdessen ein signiertes Bundle:

```bash
cd android && ./gradlew bundleRelease
```

Der mitgelieferte GitHub-Workflow (`.github/workflows/apk.yml`) baut die Debug-APK bei
jedem Push und hängt sie als Artefakt an – damit hat man den Download-Link ohne lokale
Android-Installation.

### Was für die Store-Version noch dazugehört

* **Echte Erinnerungen.** Im Browser kann die App nur benachrichtigen, während sie offen
  ist bzw. beim Öffnen. Für zeitgesteuerte Erinnerungen ohne offene App:
  `@capacitor/local-notifications` einbinden und in `erinnern()` (js/app.js) statt der
  Web-`Notification` die Plugin-API rufen – die Aufgabenberechnung dafür ist schon da.
* Datenschutzerklärung (die App sendet Koordinaten an Open-Meteo – das muss drinstehen),
  Store-Grafiken, Signaturschlüssel, Zielversion nach aktueller Play-Vorgabe.
* Open-Meteo ist nur nicht-kommerziell frei. Eine kostenpflichtige App braucht dort einen
  kommerziellen Tarif oder eine eigene Datenquelle.

---

## Sprachen

Standard ist **Englisch**; beim ersten Start fragt BeeWise einmal nach, danach steht die
Einstellung unter *Mehr → Sprache*. Vollständig übersetzt sind Englisch und Deutsch –
Bedienoberfläche, alle 25 Aufgabenregeln samt Erklärungen, Trachtpflanzen, Meldungen und die
PDF-Berichte.

Die Umsetzung nutzt die **deutschen Originaltexte als Schlüssel** (`js/i18n.js`). Das hat zwei
praktische Folgen: der Quelltext bleibt lesbar, und eine vergessene Stelle zeigt Deutsch statt
eines kryptischen Platzhalters. Übersetzt wird auf zwei Wegen – `t('…')` für Meldungen und
zusammengesetzte Sätze, und ein Durchlauf über den fertig aufgebauten Bildschirm für die
vielen Beschriftungen in den HTML-Vorlagen.

**Eine Sprache ergänzen** braucht keine Programmierung: `js/lang/en.js` kopieren, die rechte
Seite übersetzen, die Datei in `js/i18n.js` unter `PAKETE` eintragen. Fehlende Einträge fallen
automatisch auf Deutsch zurück, eine unvollständige Übersetzung ist also unproblematisch.

## Benachrichtigungen

Unter *Mehr → Benachrichtigungen* lässt sich einzeln einstellen, wofür BeeWise sich melden
darf: fällige und überfällige Aufgaben, automatische Warnungen (Varroaschwelle, weisellos,
Schwarmstimmung, Futter knapp), Trachtfragen und eine Vorwarnung vor kritischen Terminen mit
einstellbarem Vorlauf. Höchstens eine Meldung pro Tag; eine Probemeldung gibt es auf Knopfdruck.

Ehrliche Einschränkung: im Browser kann eine Web-App nur melden, während sie zwischendurch
geöffnet wird. Für Meldungen bei geschlossener App braucht es die Android-Fassung mit
`@capacitor/local-notifications` – die Berechnung dahinter ist fertig.

## Fremddienste, Kosten und Lizenzen

Alles, was die App nutzt, ist kostenfrei und ohne Schlüssel erreichbar. Für eine
veröffentlichte oder gar kostenpflichtige App gilt aber:

| Dienst | Wofür | Bedingung |
|---|---|---|
| Open-Meteo | Temperaturarchiv und Vorhersage | frei für nicht-kommerzielle Nutzung; kommerziell Tarif nötig |
| Esri World Imagery | Luftbildkacheln | Voreinstellung, ohne Schlüssel; für eine veröffentlichte App auf `maptiler` umstellen (kostenloses Konto, 100.000 Kacheln/Monat frei) |
| Nominatim (OSM) | Adresssuche | Fair Use, höchstens eine Anfrage pro Sekunde – die App fragt nur auf Knopfdruck |
| Wikipedia REST | Trachtbilder und Kurztexte | frei, Bilder sind lizenziert (Quelle wird verlinkt) |

Wechselt man einen Dienst, ist das jeweils eine Datei: `js/tracht.js`, `js/karte.js`,
`js/bilder.js`.

### Kachelquelle umstellen

Warum überhaupt? Nicht technisch, sondern rechtlich: Luftbilder sind teuer erhoben, und jeder
Anbieter regelt in seinen Nutzungsbedingungen, wer sie in welchem Rahmen einbinden darf. Fürs
Entwickeln und den privaten Gebrauch ist der Esri-Dienst unproblematisch; sobald die App
öffentlich verteilt wird, gehört ein Anbieter mit eigenem Konto darunter. Das ist keine
Umbaustelle, sondern zwei Zeilen am Kopf von `js/karte.js`:

```js
export const ANBIETER = 'maptiler';          // 'esri' | 'maptiler' | 'osm'
export const SCHLUESSEL = 'DEIN_SCHLUESSEL'; // nur bei maptiler
```

MapTiler: kostenloses Konto, 100.000 Kacheln im Monat frei – das reicht für eine
Imkerei-App mit einigen hundert Nutzern locker. `osm` ist der auflagenfreie Rückfall,
allerdings ohne Luftbild.

## Wetter und Aufgaben

Neben der Klimatologie für die Blühtermine holt BeeWise je Standort eine **Stundenvorhersage**
(Open-Meteo, `forecast_days=3`, stündlich neu). Daraus entstehen zwei Dinge:

**Arbeitseignung.** Jede Stunde bekommt eine Punktzahl aus Temperatur, Wind und Böen,
Niederschlag und Regenwahrscheinlichkeit, Bewölkung, Gewitter und Tageslicht. Die Schwellen
hängen an der Art der Arbeit:

| Profil | wofür | Kernwerte |
|---|---|---|
| `oeffnen` | Volk aufmachen, Waben ziehen | ab 12 °C, gut 15–30 °C, Wind < 25 km/h, trocken, hell |
| `as` | Ameisensäure | gut 15–25 °C – darunter wirkt sie kaum, darüber wird sie scharf |
| `os` | Oxalsäure im brutfreien Volk | 0–8 °C, trocken |
| `trocken` | Arbeit von außen (Mäusegitter, Windel, Futter) | nur Regen und Sturm stören |

**Reizlage.** Zusätzlich zur Eignung prüft die App, ob die Bienen wahrscheinlich stechlustig sind:
Gewitter in den nächsten Stunden, rasch fallender Luftdruck (≥ 3 hPa in sechs Stunden),
kühl und bedeckt (die gesamte Flugbiene sitzt dann im Stock), starker Wind, Regen, Schwüle
und Trachtlücke.

Eignung und Reizlage werden in **einem** Satz zusammengefasst, damit sich die Auskunft nicht
selbst widerspricht: „Das Wetter selbst wäre in Ordnung – die Bienen dürften aber gereizt sein."
Passt es nicht, sucht BeeWise das nächste zusammenhängende Fenster, in dem sowohl die Werte
stimmen als auch keine Reizlage zu erwarten ist, und nennt es: „besser morgen früh, ab 6 Uhr".
Gibt es keines (etwa bei einer Trachtlücke, die nicht vom Wetter abhängt), sagt die App das
ebenfalls, statt einen Termin zu versprechen. Die Termine selbst verschiebt das Wetter nicht –
die Entscheidung bleibt beim Imker.

## Zur Futtergabe vor der Sommerbehandlung

Die übliche Reihenfolge ist Ernte → erste Varroabehandlung → Auffüttern. Nach der Ernte ist der
Vorrat aber aus dem Volk heraus, und draußen herrscht meist Trachtlücke. Deshalb gibt es die
freiwillige Aufgabe **»Wenn nötig: erste kleine Futtergabe«** direkt nach der Ernte: zwei bis
fünf Kilo, wenn ein Volk auffällig leicht wiegt. Nicht voll auffüttern – die Ameisensäure
braucht Platz zum Verdunsten –, abends geben, und die Behandlung deswegen nicht verschieben.
Die Hauptmenge kommt wie bisher nach der ersten Behandlung.

## Was bewusst noch fehlt

* Mehrbenutzerbetrieb: zwei Imker führen dieselbe Imkerei gleichzeitig
* Wabenalter je Rähmchen
* Honigbilanz und Kassenbuch

---

## Haftung

Die Termine sind eine Orientierung, kein Ersatz für Sachkunde und regionale Beratung.
Zulassung, Dosierung und Wartezeiten von Behandlungsmitteln richten sich nach der
Packungsbeilage und den Empfehlungen des zuständigen Bienengesundheitsdienstes.
Melde- und Anzeigepflichten sind Ländersache.

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
js/vergleich.js         Volksvergleich am Stand
js/packliste.js         Packliste: was die fälligen Arbeiten an Material brauchen
js/varroa.js            Milbenverlauf je Volk (Kurve, Monatsschwelle, Behandlungen)
js/kasse.js             Honigbilanz und Kassenbuch (Chargen, Verkäufe, Ausgaben, Lager)
js/waben.js             Wabenalter je Volk (Jahrgänge, Ausschmelz-Vorschlag)
js/winter.js            Ein- und Auswinterung, Verlustrate je Saison und Stand
js/gewicht.js           Wägungen: Nullpunkt, Differenzen, Futterstand, Winterzehrung
js/futter.js            Futtergaben: Umrechnung Liter → kg, Summe gegen Zielvorrat
js/bildschau.js         Bilder ansehen: zoomen, schieben, in die Galerie sichern
js/waben.js             STILLGELEGT: Wabenalter (Ausbaustufe, nicht eingebunden)
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
| `abfuellungen` | Charge: Sorte, Glasgröße, Stückzahl, Los-Nummer, MHD |
| `verkaeufe` | verkaufte Gläser mit Preis, Betrag, Verkaufsart und Kunde |
| `ausgaben` | Zucker, Gläser, Behandlungsmittel, Gebühren … |
| `waben` | Wabenalter: Jahrgang und Stückzahl je Volk, Abgänge beim Ausschmelzen |
| `winterung` | Ein- und Auswinterung je Volk und Saison, Verlustgrund |
| `wiegungen` | Gewicht je Volk mit Wägeart und Nullpunktmarke |
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

### Volksvergleich am Stand

Unter *Völker* trägt jeder Stand eine einklappbare Karte **„Vergleich am Stand"**. Die Kopfzeile
sagt schon das Wesentliche („5–11 Gassen · Median 10 · 1 fällt ab"), aufgeklappt stehen die
Völker mit Balken für die besetzten Wabengassen, daneben Ernte, Milbenfall und Sanftmut.

Zwei Gestaltungsentscheidungen mit Absicht:

* **Ein Maß bekommt Balken, alles andere Zahlen.** Zwei Größenordnungen in einem Diagramm
  (Gassen und Kilo) wären nicht vergleichbar.
* **Alle Balken in derselben Farbe.** Eine Färbung nach Rang würde behaupten, die App bewerte
  die Völker. Bezugsgröße ist der **Median** des Standes, nicht der Mittelwert – ein einzelnes
  sehr schwaches Volk soll die Messlatte nicht verschieben. Auffälligkeiten stehen als Text
  („fällt ab"), nie als Farbe allein.

In der Volksansicht steht dazu eine Zeile: „5 Gassen – am Stand liegt der Median bei 10. Dieses
Volk hängt deutlich zurück." Bei Jungvölkern ergänzt die App den naheliegenden Grund. Eingeordnet
wird erst ab drei Völkern mit Daten und einem Median von mindestens vier Gassen – vorher ist die
Aussage nicht belastbar.

### Packliste – Schritt 0 des Durchgangs

Das Ärgerliche am Bienenstand ist selten die Arbeit, sondern die vergessene Zarge. Was mitmuss,
weiß die App aber schon: aus den an diesem Stand fälligen Aufgaben lässt sich das Material
ableiten. Die Liste steht deshalb **als erster Schritt im Stand-Modus**, vor dem ersten Volk –
also genau dann, wenn man noch am Auto steht und laden kann.

* Oben **„Für die heutigen Arbeiten"**: je Posten das Stück, klein und farbig die Aufgabe, aus
  der er kommt („3 × saubere Stockwindel · Varroa-Befall messen"). Stückzahlen wachsen mit der
  Zahl der betroffenen Völker, wo das sinnvoll ist – bei einer Zarge ist es der ganze Witz, bei
  der Schutzbrille wäre es albern.
* Darunter die **Grundausrüstung**, die immer mitkommt (Stockmeißel, Smoker, Schleier …).
* Die Haken sind **absichtlich flüchtig** und werden nicht gespeichert: die Liste ist eine
  Ladehilfe, kein Protokoll. Es wäre eine Scheingenauigkeit, das Laden des Autos zu archivieren.
* „Los geht's" führt zum ersten Volk. Ist am Stand nichts fällig, sagt die Karte genau das –
  keine leere Liste, die man erst deuten muss.

Steht nichts an, taucht die Liste trotzdem auf: sie ist ein Schritt des Durchgangs, kein
Warnhinweis. Wer sie überspringen will, wischt oder tippt einmal.

### Milbenverlauf je Volk

Die Milbenzahlen standen bisher einzeln im Verlauf – und dort nützen sie am wenigsten. Die Frage
des Imkers ist nicht „wie viele waren es am 25. Juli", sondern **„hat die Behandlung gewirkt"**.
Das ist nur im Vergleich vorher/nachher und im Verhältnis zur Schwelle zu beantworten, die im
Jahr wandert (Mai 1, Juli 5, August 10 Milben je Tag).

Deshalb drei Dinge in einem Bild, in der Volksansicht unter **„Varroa \<Jahr\>"**:

1. die Messwerte als Linie mit Punkten,
2. die **Monatsschwelle** als gestufte, gestrichelte Linie – Kurve darüber heißt handeln,
3. die **Behandlungen** als senkrechte Marken, direkt beschriftet („SB1 180 ml"); biotechnische
   Maßnahmen (Drohnenbrut, Ableger) mit feinerer Strichelung.

Darunter ein Satz, der die Frage beantwortet: *„Nach ‚Sommerbehandlung 1' fiel der Wert von 9 auf
1,5 – etwa 83 % weniger."* Bei geringer Wirkung steht dort stattdessen der Hinweis, Anwendung und
Menge zu prüfen – bei Ameisensäure ist eine schwache Wirkung fast immer eine Frage von Temperatur
und Verdunstung, nicht des Mittels.

Bewusst **eine** Datenreihe mit Bezugslinie statt zweier Achsen: Milben je Tag und Milliliter
Säure haben nichts miteinander zu tun, also bekommt die Menge auch keine Achse, sondern steht als
Text an der Marke. Ohne Messwert erscheint die Karte gar nicht – ein leeres Diagramm ist
schlechter als keines.

### Wetterwarnungen mit Handlungsbezug

Auf *Heute* stehen ganz oben Warnungen, die aus der Stundenvorhersage der nächsten 48 Stunden
entstehen – jede mit dem Handgriff, der dazugehört, nicht nur mit der Wetterlage:

| Auslöser | Handlung |
|---|---|
| Böen ab 60 km/h | Deckel beschweren, Beuten gegen Umfallen sichern |
| Nachtfrost ≤ 0 °C (ab September) | Mäusegitter und Fluglochkeil einhängen, Futtergeschirr raus |
| ab 34 °C | Schatten und Wasser, Flugloch weit offen |
| ab 25 mm Regen am Tag | Standplatz auf Staunässe ansehen, Beuten nach vorn neigen |

Zwei Knöpfe je Zeile: **„Als Aufgabe"** legt sie als eigene Aufgabe am Stand an (mit Frist bis zum
Tag nach dem Ereignis, damit sie nicht liegen bleibt), **✕** blendet sie aus. Wetter ist regional,
also fasst die App gleiche Warnungen für mehrere Stände zu **einer** Zeile zusammen und nennt die
betroffenen Stände – drei gleichlautende Sturmwarnungen wären Lärm. Der Frost hat absichtlich eine
Jahreszeit: eine Frostmeldung im Mai betrifft die Blüte, nicht das Mäusegitter.

### Sicherungs-Erinnerung

Alle Daten liegen im Browser des Geräts. Das ist gut für die Unabhängigkeit und schlecht für den
Fall, dass das Handy in den Honigeimer fällt. Sind vier Wochen ohne Sicherung (Export **oder**
Geräteabgleich – was jünger ist) vergangen, erinnert eine Karte auf *Heute* daran, mit dem
Sicherungsknopf direkt darin. „Später" schiebt sie um eine Woche auf; nach einem Export
verschwindet sie von selbst. Sie erscheint erst, wenn überhaupt Völker angelegt sind – vor dem
ersten Volk gibt es nichts zu verlieren.

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
* **Der Hintergrund bleibt stehen,** solange ein Fenster offen ist: der Rumpf wird festgesetzt
  und die Scrollhöhe danach wiederhergestellt. `overflow:hidden` allein genügt auf iOS nicht.
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

## Honigbilanz und Kassenbuch

Unter *Mehr → Kassenbuch*. Eigene Ansicht statt Unterpunkt, weil das Abendarbeit am Tisch ist
und nicht Arbeit am Stand – deshalb steht es auch nicht in der Tabbar.

Der Weg des Honigs hat vier Stationen, und genau so ist es gebaut:

| Station | Woher die Zahl kommt |
|---|---|
| geerntet | aus den abgehakten Ernteaufgaben (kg je Volk) – **nichts wird doppelt erfasst** |
| abgefüllt | eigener Datensatz je Charge, mit Los-Nummer und MHD |
| verkauft | Gläser raus, Geld rein (Stück, Preis je Glas, Betrag, Verkaufsart, optional Kunde) |
| im Lager | Rechnung: abgefüllt minus verkauft, je Sorte und Glasgröße |

Zwei Rechenregeln, die man leicht falsch macht und die hier bewusst so stehen:

* **Der Lagerbestand ist nicht jahresbezogen.** Honig vom Vorjahr steht im Januar noch im Regal,
  also läuft der Bestand über alle Jahre – Erlöse und Ausgaben dagegen jahresweise.
* **Kilo und Gläser sind nicht dasselbe.** Gerechnet wird immer über die Füllmenge
  (ein 500-g-Glas = 0,5 kg), nie über ein Bruttogewicht.

Die Kopfzeile zeigt sechs Zahlen: geerntet, abgefüllt, eingenommen, ausgegeben, Überschuss und
**Erlös je Kilo** – die letzte ist die, die man beim Preisgespräch im Kopf haben will. Bleibt ein
Teil der Ernte ohne Abfüllung, sagt die App das ausdrücklich („24,5 kg sind noch nicht als
Abfüllung gebucht") statt es als Lücke stehen zu lassen. Bewusst **keine Balken** in dieser
Karte: Kilo, Gläser und Euro sind nicht vergleichbar, ein gemeinsames Diagramm wäre Unsinn.

Ausgaben sind imkerlich benannt (Zucker und Futter, Behandlungsmittel, Gläser und Deckel,
Mittelwände und Wachs …), nicht nach Kontenklassen: beim Erfassen weiß man, dass man Zucker
gekauft hat. Zuordnen kann man später immer noch.

Export: **Jahresübersicht als PDF** (ein Blatt mit Summen und allen Buchungen) und **CSV** mit
Semikolon und BOM, damit Excel es ohne Rückfrage und mit richtigen Umlauten öffnet.

Was BeeWise ausdrücklich **nicht** tut: Umsatzsteuer, Abschreibung, Konten, Bewertung des
Lagerbestands. Es sammelt die Zahlen so, wie sie beim Imkern anfallen – was daraus steuerlich
folgt, entscheidet niemand in einer Imkerei-App.

### Los-Nummer und MHD beim Abfüllen

Beides gehört zur **Charge**, nicht zum Glas – deshalb ein eigener Datensatz und nicht ein Feld
irgendwo an der Aufgabe. Die Aufgabe „Rühren, abfüllen, etikettieren" führt nach dem Abhaken
direkt in die Charge und bringt Glasgröße und Stückzahl mit; die Sorte schlägt die App aus der
letzten Ernte vor. So wird einmal erfasst, was einmal passiert ist.

* **Los-Nummer**: Vorschlag `L` + Datum + laufende Nummer des Tages (`L260820-1`). Sinn der
  Nummer ist die Rückverfolgbarkeit – von einem Glas zurück auf den Abfülltag und damit auf die
  Eimer. Deshalb steht das Datum drin und kein Zufallsschlüssel. Änderbar, denn maßgeblich ist,
  was auf dem Glas klebt.
* **MHD**: Vorschlag zwei Jahre ab Abfüllung, Eingabe und Anzeige als `MM/JJJJ`, gespeichert als
  `JJJJ-MM` (damit sich sortieren lässt). Rechtlicher Hinweis im Fenster: steht das Datum mit
  **Tag**, Monat und Jahr auf dem Glas, ersetzt es die Los-Nummer – mit Monat und Jahr, wie hier
  vorgeschlagen, braucht man die Nummer zusätzlich.
* **Aufkleberbogen**: 4 × 12 kleine Etiketten je A4-Blatt mit Sorte, Füllmenge, Los und MHD –
  zum Ergänzen gekaufter Etiketten, auf denen Name und Anschrift schon stehen.
* Im Lagerbestand warnt die App, wenn bei einer Charge das MHD näher rückt und rechnerisch noch
  Gläser da sind. Zugeordnet wird nach „wer zuerst abgefüllt wurde, geht zuerst weg" – eine
  glasgenaue Verfolgung wäre Scheingenauigkeit, weil beim Verkauf niemand die Charge notiert.

### Mehrfach ernten und Ernte nachtragen

Wer die App mitten in der Saison anfängt, hat die Frühtracht schon im Eimer – und über das
Abhaken der Aufgabe kommt er nicht mehr dran, weil deren Zeitfenster längst zu ist. Im
Kassenbuch steht deshalb **Ernte nachtragen**: Ernteart wählen (Früh- oder Sommertracht), Datum,
optional der Wassergehalt, und darunter eine Zeile je Volk mit einem Feld für die Kilo. „Auf alle
übertragen" füllt alle Zeilen mit derselben Zahl – wer nur die Gesamtmenge weiß, teilt sie durch
die Zahl der Völker.

Entscheidend ist, **was** dabei geschrieben wird: eine ganz normale **Erledigung der Ernteregel**,
kein Sonderdatensatz. Damit sieht das Kassenbuch die Ernte, die Volkshistorie zeigt sie, die
Gewichtskurve setzt ihre Marke – und die **Folgetermine rechnen damit**. Trägt man die
Sommertracht nach, steht die erste Sommerbehandlung sofort im Plan, denn genau an diesem Datum
hängt die halbe zweite Saisonhälfte.

**Mehrfach ernten ist der Normalfall**, nicht die Ausnahme: Raps, dann Robinie; Juni-Tracht, dann
späte Linde. Zwei Dinge folgen daraus:

* **Zugeordnet wird nach Tag, nicht nach Jahr.** Ein neues Datum legt eine weitere Ernte an, ein
  bereits erfasstes Datum bearbeitet die vorhandene. Oben im Fenster stehen alle Ernten des
  Jahres mit Datum und Menge; ein Tipp darauf lädt sie zum Ändern. So kann eine nachgetragene
  Juni-Ernte die Ernte vom August nicht überschreiben – vorher tat sie es, weil der Schlüssel
  nur aus Regel, Volk und Jahr bestand.
* **Auch die Aufgabe kommt wieder.** `fruehtracht` und `sommertracht` haben `wiederholung`
  (12–40 Tage) und `wiederholungFreiwillig: true`: die erste Ernte ist Pflicht, jede weitere ein
  Angebot – erkennbar an der Marke „nur wenn nötig" und einem Satz im Fenster. Begrenzt wird das
  durch `saisonEnde` (Frühtracht 10. Juli, Sommertracht 10. August), damit im Herbst nichts mehr
  nachrückt. Die Folgetermine hängen an der **jüngsten** Ernte (`erledigungenVon` sortiert
  absteigend), eine spätere Ernte verschiebt die Sommerbehandlung also richtig nach hinten –
  behandelt wird nach der letzten Ernte.

Im Kassenbuch stehen bei mehr als einer Ernte die **einzelnen Termine** mit Datum, Sorte,
Völkerzahl und Menge; ein Feld leeren heißt löschen, aber nur den Eintrag dieses Tages.

## Schutz und Gesundheit – zwei neue Kategorien

Anlass war ein Satz des Imkerpaten: „Verenge die Fluglöcher." Dafür gab es in der App keine
Entsprechung – und dahinter steckte eine ganze Klasse von Arbeiten, die weder Vermehrung noch
Ernte noch Behandlung sind: die **Verteidigungsfähigkeit** des Volkes und der Platz, auf dem es
steht. Zwei Kategorien kamen dazu, damit diese Aufgaben im Kalender eine eigene Farbe haben:
**Schutz** (Flugloch, Räuberei, Wespen und Hornissen, Wasser, Bewuchs) und **Gesundheit**
(Wabenlager, Faulbrutverdacht).

| Neu | Wann | Kern |
|---|---|---|
| **Fluglöcher verengen** | 0–7 Tage nach der letzten Ernte, bis 30.9. | Handbreit bei starken, Bienenbreite bei schwachen Völkern. Ausnahme: während die Ameisensäure verdunstet, bleibt es offen. Immer der ganze Stand auf einmal. |
| **Räuberei stoppen** | sofort, automatisch ausgelöst | Erkennungsmerkmale, Sofortmaßnahmen, und der Hinweis, dass ein beräubertes Volk fast immer schwach oder weisellos ist |
| **Wespen und Hornissen beobachten** | 1.8.–31.10., alle 10–21 Tage, freiwillig | Unterschied heimische Hornisse / Asiatische Hornisse, Meldewege sind Ländersache, Nester nie selbst entfernen |
| **Wassertränke einrichten** | erster Warmtag, 0–14 Tage | Bienen prägen sich die Quelle ein – wer im Juni anfängt, kommt zu spät |
| **Stand freischneiden** | 15.4.–30.9., alle 45–75 Tage, freiwillig | Bewuchs bremst den Anflug und ist die Aufstiegshilfe für Mäuse |
| **Waben mottensicher einlagern** | 0–21 Tage nach der letzten Ernte | Kühl, hell, luftig im Durchzug schlägt jedes dichte Verpacken; B401 wo nötig |
| **Mäusegitter abnehmen** | 0–21 Tage nach der ersten Durchsicht | Das fehlende Gegenstück zum Mäuseschutz: Höschen werden abgestreift, Drohnen bleiben stecken |
| **Ableger im brutfreien Fenster entmilben** | 21–32 Tage nach der Ablegerbildung | Das eine Fenster im Jahr, in dem eine einzige Oxalsäuregabe fast alles erwischt |
| **Legebeginn der neuen Königin prüfen** | 8–14 Tage nach dem Umweiseln | Stifte suchen, nicht die Königin; Weiselprobe als sicherer Test |
| **Vor der Ernte Material besorgen** | ab Lindenblüte | Säure, Verdunster, Dochte, Futter, Gläser – der Bedarf entsteht schlagartig am Tag der letzten Ernte |
| **Faulbrutverdacht** | sofort, automatisch ausgelöst | Anzeigepflicht: Amt anrufen, nichts mehr bewegen. Die App nennt bewusst kein Verfahren – das legt das Veterinäramt fest |

Dazu ein Feld **„Aufgefallen"** in der Durchsicht (Kalkbrutmumien, Kotspritzer, buckelige Brut,
löchriges Brutbild, verkrüppelte Flügel, ungewöhnlicher Geruch, Räuberei). Es macht Krankheiten
erfassbar, ohne jeder eine eigene Aufgabe zu geben – und zwei der Einträge lösen selbstständig
eine Aufgabe aus. **Räuberei und Faulbrutverdacht hängen dabei am Stand, nicht am Volk**: ein
einzelnes offenes Nachbarvolk macht die Arbeit sonst zunichte, und ein Seuchenverdacht betrifft
den ganzen Platz. Dafür können Auslöser jetzt `ziel: 'stand'` setzen.

Fachliche Vorlage war ein eigens beauftragter Durchgang „was fehlt einem Jungimker im ersten
Jahr" – samt einer Liste dessen, was ausdrücklich **nicht** aufgenommen wurde: Königinnenzucht
als Regelkette (eigenes Handwerk mit tagesgenauem Plan), wöchentliches Wiegen (der Nutzen liegt
in der Kurve, nicht im Termin), Frühjahrsfütterung nach Kalender (entscheidet der Vorrat, nicht
das Datum), Wespenfallen (fangen überwiegend Nichtzielarten), Beutendesinfektion ohne Anlass,
Volksstärke in Prozent (Scheingenauigkeit neben den Wabengassen).

## Behandlungen wiederholen und nachtragen

Eine Ameisensäurebehandlung ist keine einmalige Handlung, sondern eine Serie: fällt zu wenig
Milbe, wird nachgelegt. **Sommerbehandlung 1 und 2 wiederholen sich** deshalb 5–21 Tage nach der
letzten Anwendung – als Angebot mit der Marke „nur wenn nötig", begrenzt auf den 15. September,
weil es danach für eine verlässliche Verdunstung zu kalt wird. Die Folgetermine hängen an der
jüngsten Anwendung.

Und in der **Varroa-Karte** steht jede Behandlung als antippbare Zeile: Datum, Präparat,
Anwendung, Menge. Antippen ändert oder löscht, „Behandlung erfassen" trägt eine weitere nach –
auch rückwirkend und auch dann, wenn die Aufgabe nicht mehr im Plan steht. Geschrieben wird
dieselbe Art Datensatz wie beim Abhaken, damit Kurve, Behandlungsprotokoll und Folgetermine
dasselbe sehen. Ohne Mengenvorschlag: für Menge und Anwendung gilt die Gebrauchsinformation des
Präparats.

## Wabenalter – gebaut, geprüft, stillgelegt

Die Funktion zählte Rähmchen je Volk und Jahrgang und schlug Waben ab drei Jahren zum
Ausschmelzen vor. Sie ist nach dem Feldtest **wieder ausgebaut** worden, und der Einwand dahinter
ist gut genug, um ihn aufzuschreiben:

> Waben wandern. Honigräume kommen nach der letzten Ernte weg, einzelne Waben werden aus der
> Brutzarge in den Honigraum gehängt, Ableger bekommen Waben aus anderen Völkern. Welche Wabe
> wann geht oder kommt, lässt sich am offenen Volk nicht buchen.

Ohne diese Buchungen ist eine Jahrgangsrechnung je Volk nicht bloß ungenau, sondern falsch – und
eine falsche Zahl ist schlechter als keine, weil man sich danach richtet. Dazu kam ein praktischer
Mangel: erfasst wurden nur Zu- und Abgänge, eine falsch eingetragene Stückzahl ließ sich nicht
einfach korrigieren.

`js/waben.js` bleibt als **Ausbaustufe** im Projekt (nicht eingebunden, nicht im Bündel), der
Speicher `waben` bleibt in `db.js`, damit bereits erfasste Einträge und Sicherungen unversehrt
sind. Im Dateikopf steht, was es zum Wiederbeleben bräuchte: entweder wabengenaue Verfolgung mit
Kennzeichnung am Rähmchen – realistisch nur bei wenigen Völkern – oder ein Maß, das ohne
Wanderungen auskommt: die **Erneuerungsrate** („wie viele neue Mittelwände habe ich dieses Jahr
eingehängt, gemessen an der Wabenzahl im Betrieb", Ziel etwa ein Drittel im Jahr). Die braucht nur
zwei Zahlen je Jahr und behauptet nicht, einzelne Waben zu kennen.

## Foto am Bienenstand

Jeder Stand kann jetzt ein eigenes Foto tragen (*Mehr → Stand antippen* oder *Völker → Stand
bearbeiten*, dann auf das Bild tippen). Es ersetzt in den Listen und in der Standwahl des
Durchgangs das Luftbild: das Luftbild zeigt die Lage, das Foto den Platz – bei Wanderständen
erkennt man am Foto in einer Sekunde, welcher Stand gemeint ist. Fällt kein Foto vor, bleibt es
beim Luftbild.

Technisch dasselbe wie beim Volksfoto: verkleinert auf die eingestellte Kantenlänge, im
Datensatz des Standortes gespeichert, damit auf dem Gerät und in der Sicherung – und der
Dateidialog wird **synchron in der Nutzergeste** geöffnet, sonst blocken ihn Handy-Browser
stillschweigend.

## Bilder ansehen

Ein Brutbild ist nur etwas wert, wenn man hineingehen kann – auf die Zelle, auf die Made, auf den
Zellrand. Ein Bild in fester Größe in einem Fenster ist dafür wertlos. Antippen öffnet deshalb
eine **bildschirmfüllende Bildschau** mit eigener Gestensteuerung (`js/bildschau.js`):

* zwei Finger auseinander – stufenlos zoomen bis 6×, doppelt tippen springt auf 2,5×
* im gezoomten Bild ziehen, begrenzt auf den Bildrand (kein Wegziehen ins Leere)
* bei 1× nach unten ziehen schließt, Escape und ✕ ebenso
* am Rechner: Mausrad und Ziehen mit der Maus

Warum das die App selbst macht und nicht der Browser: BeeWise fängt waagerechte Wischgesten ab
(sonst zieht die Zurück-Geste des Systems das ganze Bild zur Seite) und hat das Doppeltipp-Zoom
abgeschaltet (sonst zoomt man beim schnellen Erfassen versehentlich hinein). In der Liste ist
beides richtig, im Bild wäre es falsch – die Bildschau ist deshalb ausdrücklich davon ausgenommen
(`data-gesten`, `touch-action: none`).

**„Sichern / Teilen"** reicht das Bild an das Teilen-Menü des Geräts weiter; auf dem iPhone steht
dort „Bild sichern" und es landet in Fotos, auf Android „Speichern". Eine App im Browser darf
nicht selbst in die Galerie schreiben – das ist der einzige Weg dorthin, und er ist einen
Fingertipp lang. Fehlt die Schnittstelle, lädt die App das Bild als Datei herunter.

**Auflösung:** Zum Hineinzoomen sind 1024 Punkte zu wenig. Unter *Mehr → Daten* gibt es jetzt
zusätzlich **1600** (~300 kB) und **2048** (~500 kB), und die JPEG-Güte ist von 0,72 auf 0,82
angehoben – bei starkem Zoom werden sonst die Artefakte sichtbar, bevor die Auflösung endet. Die
Einstellung gilt für neue Fotos; bereits gespeicherte Bilder bleiben, wie sie sind.

## Fachliche Rückfragen – warum (noch) kein Chatbot

Naheliegender Wunsch: eine Frage eintippen („Darf ich vor der ersten Sommerbehandlung schon ein
wenig füttern?“) und eine Antwort bekommen. Bewusst nicht eingebaut, aus drei Gründen:

* **Offline und ohne Server.** BeeWise braucht am Stand kein Netz. Ein Sprachmodell im Gerät ist
  zu groß, eines in der Cloud braucht Netz, einen Schlüssel und laufende Kosten.
* **Der Schaden ist einseitig.** Eine erfundene Menge Ameisensäure oder ein falsches Fenster
  kostet Völker. Für Mengen und Anwendung gilt ohnehin die Gebrauchsinformation des zugelassenen
  Präparats – nicht der Rat einer Software.
* **Regionalität.** Trachtende und Behandlungsfenster verschieben sich um Wochen. Dafür sind der
  Imkerpate, der Verein und die Infobriefe der Bieneninstitute die besseren Quellen.

Was stattdessen trägt und geplant ist: eine **durchsuchbare Fragen-und-Antworten-Sammlung**
(offline, kuratiert, je Antwort eine Quelle und ein Verweis auf die betroffene Regel). Die
Erklärtexte in `js/regeln.js` sind die Grundlage – sie beantworten heute schon viele Fragen, aber
nur, wenn die Aufgabe gerade fällig ist. Ein Sprachmodell wäre erst danach sinnvoll: als Aufsatz,
der **aus** dieser Sammlung antwortet, freiwillig, mit eigenem Schlüssel und gekennzeichnet als
ungeprüft – nie für Dosierungen.

Und der Teil, den keine Antwort ersetzt: die App macht Fehler **sichtbar**. Die Milbenkurve zeigt,
ob eine Behandlung gewirkt hat; das ist mehr wert als eine Auskunft vorab.

## Ein- und Auswinterungsbilanz

Die Winterverlustrate ist die einzige Zahl, an der man über Jahre sieht, ob die eigene
Betriebsweise trägt – und die einzige, die man sich nicht schönrechnen darf. Zu finden unter
*Mehr → Winterbilanz*.

**Eine Saison heißt nach ihrem Anfangsjahr:** `2026/27`. Umgeschaltet wird im August, weil dann
die Einwinterung beginnt (letzte Ernte, Behandlung, Auffüttern) – nicht im Januar.

* **Ein Datensatz je Volk und Winter.** Nur so lässt sich später fragen, *woran* die Völker
  gestorben sind; eine Quote ohne Ursachen ist eine Zahl zum Ärgern, keine zum Lernen. Die
  Gründe sind die, die man wirklich sieht: Varroa/Zusammenbruch, verhungert, weisellos,
  Nosema/Ruhr, Räuberei, Mäuse oder Umsturz, zu schwach eingewintert, unbekannt.
* **Erfassung fällt nebenbei an.** Wer im Herbst *Auffüttern abschließen*, *Wintersitz*,
  *Mäusegitter* oder *Restentmilbung* abhakt, hat eingewintert – der Eintrag entsteht von selbst.
  Und wer im Frühjahr die *erste Durchsicht* abhakt, sagt damit: dieses Volk lebt. Für den Rest
  gibt es zwei Knöpfe: *Einwinterung erfassen* (Liste mit Häkchen, alle vorbelegt) und
  *Auswinterung erfassen* (je Volk drei große Knöpfe, bei „verloren" der Grund).
* **„Schwach" zählt als durchgekommen** – das Volk lebt. Es wird aber getrennt ausgewiesen.
* **Die Rate wird nur aus bewerteten Völkern gerechnet.** Solange die Auswinterung offen ist,
  steht dort keine Quote, sondern die Aufforderung, sie zu erfassen. Sonst wären offene Völker
  stillschweigend „durchgekommen" – die Statistik würde sich selbst beschönigen.
* **Verlorene Völker gehen aus dem Bestand** (`status: 'aufgeloest'`, mit Datum und Grund), auf
  Wunsch automatisch beim Erfassen. Der Verlauf bleibt vollständig erhalten – es entstehen nur
  keine neuen Aufgaben mehr, und die Bestandslisten bleiben sauber. Unter *Mehr → Völker
  verwalten* stehen sie weiterhin, gekennzeichnet mit „nicht mehr im Bestand".
* **Frühere Jahre von Hand:** zwei Zahlen je Saison (eingewintert, verloren) für die Zeit vor
  BeeWise. Sie erscheinen getrennt als „von Hand erfasst" – man soll sehen, welche Werte aus
  Erfassung und welche aus Erinnerung stammen.
* **Reihe über die Jahre** als Balken: ein Maß (Verlustrate), eine Farbe. Ein einzelner Winter
  sagt wenig, die Reihe sagt viel.

## Fütterung: viele kleine Gaben, eine Summe

Wer mit **2-Liter-Ballons** und Zuckerwasser füttert, gibt nicht einmal 16 kg, sondern zehnmal
anderthalb. Drei Entscheidungen folgen daraus:

**Eine Gabe ist ein Datensatz mit Datum und Menge** – geschrieben als Erledigung der Futterregel,
genau wie beim Abhaken. Es gibt also nicht „Aufgaben hier, Nachträge dort", sondern eine Reihe, in
die beide Wege schreiben. Der Grund ist nicht Ästhetik: zwei Eingabewege für dieselbe Sache führen
zu doppelt oder gar nicht erfassten Gaben, und die Summe ist beim Einwintern das Einzige, worauf
es ankommt. Aus demselben Grund heißt das Feld in *Auffütterung abschließen* jetzt **„Letzte
Gabe"** und nicht mehr „Insgesamt gegeben" – ein Summenfeld neben Einzelgaben hätte jede Bilanz
doppelt gezählt.

**Die Aufgaben wiederholen sich.** `anfuettern` (2–10 Tage) und `auffuettern` (3–21 Tage) kommen
nach jeder Gabe wieder, bis `saisonEnde` (20. September) – als Angebot, nicht als Mahnung
(`wiederholungFreiwillig`, Marke „nur wenn nötig"). *Auffütterung abschließen* bleibt der eine
Abschluss und zeigt oben die Summe aller Gaben samt Fehlbetrag.

**Erfasst wird in Litern, gerechnet in Kilo Winterfutter.** Der Imker denkt in Ballons, die Regel
denkt in Kilo. Die Umrechnung steht in `js/regeln.js` (dort liegt das imkerliche Wissen) und wird
in `js/futter.js` weitergegeben – an einer Stelle, damit Aufgabe, Futterkarte und Rechner dieselbe
Zahl verwenden. Grundlage: 1 kg Zucker ergibt rund 1 kg Winterfutter.

| Futtermittel | je Liter bzw. Kilo |
|---|---|
| Fertigsirup (Invertzucker), ~73 % Zucker bei 1,4 kg/l | 1,0 kg |
| Zuckerwasser 3:2 (3 kg Zucker auf 2 l Wasser) | 0,77 kg |
| Zuckerwasser 1:1 (1 kg Zucker auf 1 l Wasser) | 0,61 kg |
| Futterteig | 1,0 kg je kg |

Ein 2-Liter-Ballon 3:2 bringt also **rund 1,5 kg** – zwei Ballons etwa 3 kg. Bis 16 kg Zielvorrat
sind das gut zehn Gaben; genau deshalb muss mehrfaches Füttern der Normalfall sein und nicht die
Ausnahme. Die errechneten Kilo lassen sich in jedem Fenster überschreiben: Faustwerte bleiben
Faustwerte.

**Die Futterkarte im Volk** zeigt einen Balken (erreichtes Winterfutter gegen den Zielvorrat aus
`futterBedarf`), die Sätze dazu („5 Gaben, zusammen 18,8 kg … es fehlen noch 4 kg – das sind etwa
3 Ballons") und alle Gaben mit Datum, Ballons, Futtermittel und Kilo. Jede Zeile lässt sich
antippen, ändern oder löschen; „Futtergabe erfassen" trägt eine neue nach.

**Anfüttern zählt getrennt.** Die kleine Gabe vor der ersten Behandlung wird zum Teil wieder
verbraucht; sie auf den Zielvorrat anzurechnen wäre geschönt. Sie steht deshalb neben, nicht in
der Wintersumme – und die Karte sagt das auch so.

## Gewicht über das Jahr

Handwägungen mit der Kofferwaage taugen für **Differenzen**, nicht für Absolutwerte. Die Methode
streut ±0,5 bis 1 kg (Ansatzpunkt, Kippwinkel, nasses Holz, fliegende Bienen). Alles darunter ist
Rauschen – und die App sagt das auch so, statt eine Zahl zu deuten, die nichts bedeutet.

Damit lohnt es sich für **Winterfutter und Zehrung** (Zielspannen sind 3–5 kg breit, und im
Dezember darf man nicht öffnen), aber **nicht** für den Trachtverlauf: dafür braucht es tägliche
Werte, also eine echte Stockwaage unter einem Volk je Stand.

**Nullpunkt statt Tara-Tabelle.** Das Zargenproblem (Honigraum drauf, Ernte runter) löst die App
nicht mit Leergewichten je Zarge – Beuten wiegen je nach Holz und Alter anders –, sondern mit
einem Bezugspunkt **direkt nach der letzten Ernte**: da ist fast kein Vorrat im Volk, alles
Weitere ist Futter. Beim Wiegen lässt sich der Nullpunkt ausdrücklich setzen; sonst gilt die
erste Wägung nach der letzten Ernte.

**Kippprobe wird umgerechnet.** Wer hinten anhebt, misst grob die Hälfte einer
Gewichtsänderung. Ohne Umrechnung wäre der Vergleich mit dem Zielvorrat irreführend („es fehlen
14 kg", obwohl drei fehlen), deshalb rechnet die App mit dem Faktor 2 – und mit **deinem** eigenen
Verhältnis, sobald du einmal am selben Tag beides gewogen hast (Kippprobe und ganze Beute).
Welcher Weg gerechnet wurde, steht im Satz dabei.

**Nur gleiche Wägeart vergleichen.** Kippprobe und ganze Beute sind zwei Maßstäbe; sie werden
getrennt gezeichnet und getrennt gerechnet. Wurde beides benutzt, sagt die App es.

Erfassen geht an vier Stellen, überall optional und leer vorbelegt: im **Durchgang** (letztes
Feld), in der **Durchsicht**, über den Knopf **Wiegen** im Volk und in der Aufgabe *Futtervorrat
prüfen*. Vier bis sechs Wägungen im Jahr genügen: nach der letzten Ernte (Nullpunkt), nach jeder
Futtergabe, im Oktober, im Dezember, im Februar. Bei jedem Durchgang zu wiegen bringt nur
Rauschen und verleitet zum Überdeuten.

Ausgewertet wird in der Volksansicht: Kurve mit Nullpunktlinie und Marken für Ernte, Zarge und
Futtergabe (damit ein Sprung erklärt ist), darunter Sätze im Klartext – „Seit 20. Dez. minus
2,5 kg in 69 Tagen, also gut 1,1 kg im Monat", „Gegeben wurden 18 kg, davon dürften rund 15 kg
als Winterfutter hängen bleiben", „Ziel für diese Beute: 16 kg – rechnerisch fehlen 8 kg".

**Die Winterwarnung** ist der Punkt, an dem die Sache Völker retten kann: reicht der Vorrat bei
der gemessenen Zehrung nicht bis Mitte März, steht das Volk von Oktober bis März auf *Heute* mit
der konkreten Handlung („Futterteig direkt über den Sitz legen, kein Zuckerwasser").

Eine Ungenauigkeit bleibt bewusst stehen: am Nullpunkt ist der Vorrat nicht genau null – im
Brutnest hängen meist zwei bis vier Kilo. Die Rechnung unterschätzt den Vorrat also leicht. Das
ist die sichere Richtung.

## Nur senkrecht scrollen

Ein Daumen wischt nie exakt gerade. Ohne Gegenmaßnahme genügt diese kleine Drift, um beim
Scrollen die ganze Seite seitwärts mitzuziehen – es reicht, wenn irgendein Element ein paar Pixel
zu breit ist (eine fünfspaltige Tabelle bei großer Systemschrift zum Beispiel), damit das Dokument
waagerecht scrollbar wird. Drei Maßnahmen dagegen:

* `html, body { overflow-x: clip }` (mit `hidden` als Rückfall) plus `overscroll-behavior-x: none`:
  das Dokument lässt sich überhaupt nicht mehr seitlich schieben.
* Tabellen bekommen `table-layout: fixed` und dürfen umbrechen, damit gar nichts erst zu breit
  wird und geklippt werden müsste.
* **Kein Bereich blättert mehr waagerecht.** Die zwei, die es taten, sind umgebaut: die
  Filterchips über der Aufgabenliste **umbrechen** jetzt in zwei Zeilen, und das Stundenband im
  Wetterfenster ist ein **Raster** aus 24 Kacheln statt eines Schiebestreifens. Beide saßen genau
  dort, wo der Daumen zum Scrollen ansetzt – jede Drift zog sie mit, und das sah aus, als
  verrutsche das Bild. Nebenbei sieht man die 24 Stunden jetzt alle auf einmal; ein Streifen, den
  man schieben muss, wird ohnehin oft nicht entdeckt.
* Das **Fenster** (Bottom-Sheet) hat `overflow: hidden auto` – es scrollt senkrecht und kann
  seitwärts nicht wandern, was auch immer an Inhalt hineinkommt.
* Und der eigentliche Übeltäter im geöffneten Fenster: die **Zurück-Wischgeste des Systems**.
  Solange ein Fenster offen ist, liegt ein Eintrag im Verlauf (das braucht die Zurück-Taste) –
  und damit zieht ein seitliches Wischen das *ganze* Bild mit, samt feststehendem Fenster.
  `overscroll-behavior` hilft dagegen nicht. Die **Achsensperre** in `js/ui.js` entscheidet
  deshalb nach den ersten 8 px: überwiegt die waagerechte Richtung, wird die Geste mit
  `preventDefault()` abgefangen und das System bekommt sie nicht mehr; überwiegt die senkrechte,
  bleibt alles unberührt. Ausgenommen sind Eingabefelder (Textmarkierung, Datumsrad) und
  `[data-querscroll]`. Der Durchgang braucht keine Ausnahme, weil sein Wischen `touchend`
  auswertet.
* Dazu `touch-action: manipulation` auf `html`: das **Doppeltipp-Zoom** ist abgeschaltet. In
  einer App, die viel und schnell angetippt wird, zoomt es sonst versehentlich hinein – und im
  gezoomten Zustand verschiebt jede Bewegung die ganze Anzeige. Bewusstes Zusammenziehen bleibt
  möglich; `maximum-scale=1` ist aus dem Viewport-Tag entfernt (iOS ignoriert es ohnehin und
  Zoom zu verbieten wäre eine Barriere). Unter *Mehr → Diagnose* steht der aktuelle Zoomwert –
  damit lässt sich „verrutscht" von „hineingezoomt" unterscheiden.

Das **Wischen im Durchgang** ist die einzige gewollte Seitwärtsbewegung und verlangt deshalb eine
eindeutige Geste: mindestens 70 px waagerecht, höchstens 55 px senkrechte Drift, mindestens
doppelt so weit waagerecht wie senkrecht – und die Seite darf während der Bewegung nicht
gescrollt worden sein. Wer gescrollt hat, wollte lesen, nicht blättern.

## Prüfstand

Alle Läufe arbeiten mit fest gestellter Uhr und gemocktem Open-Meteo und laufen gegen **drei
Fassungen**: den Ordner, die Einzeldatei und das entpackte `beewise-web.zip`.

| Lauf | prüft |
|---|---|
| `test_wetter.py` | Wetterbewertung, Reizlage, widerspruchsfreie Texte, Sprachwechsel |
| `test_stand.py` | Durchgang, Packliste als Schritt 0, QR-Aufkleber, Tiefenlink |
| `test_koenigin.py` | Königinnen, Umweiseln, Ableger als eigene Völker |
| `test_kette.py` | Abhängigkeitskette der Regeln über die Saison |
| `test_neu.py` | Milbenkurve, Wetterwarnungen, Sicherungs-Erinnerung |
| `test_kasse.py` | Kassenbuch, Los-Nummer, MHD, Lagerbestand, PDF/CSV/Etiketten |
| `test_bilder.py` | Bildschau (Zoom, Ziehen, Grenzen, Mausrad, Schließen), Bildgrößen, Standfoto über echten Dateidialog |
| `test_winter.py` | Ein- und Auswinterung, Verlustgründe, Auflösen, Mehrjahresreihe |
| `test_gewicht.py` | Nullpunkt, Differenzen, Futterrechnung, Zehrung, Winterwarnung |
| `test_gesamt.py` | leerer Start, alle Ansichten und Fenster, Sicherung hin und zurück, Neuladen, Sprachreste, 320/390/768 px, Zurück-Taste |
| `test_achse.py` | echte Touch-Gesten über das Chrome-Protokoll: waagerechte werden abgefangen, senkrechte scrollen, Eingabefelder bleiben frei, Wischen im Durchgang blättert weiter |
| `pruef_quer.py` | sucht mit echten Wetterdaten **jede** waagerecht scrollbare Stelle in allen Ansichten und Fenstern |
| `test_schutz.py` | neue Schutz- und Gesundheitsaufgaben, Räuberei- und Faulbrut-Auslöser, wiederholbare Behandlung, Behandlung erfassen/ändern/löschen |
| `test_futter.py` | Ballon-Umrechnung, viele Gaben an verschiedenen Tagen, Summe, Ändern und Löschen, wiederkehrende Aufgabe, Stand im Abschluss-Fenster |
| `test_migration.py` | **alte Datenbank (Version 4) aktualisieren** ohne Datenverlust und **Offline-Betrieb** über den Service Worker |

Dazu bei jedem Bau: `node --check` für jede Datei **und** für das erzeugte Bündel (fängt
gleichnamige Deklarationen aus verschiedenen Modulen), eine Prüfung auf doppelte Schlüssel im
Sprachpaket und eine Prüfung, dass jeder deutsche Text im Englischen einen Eintrag hat.

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

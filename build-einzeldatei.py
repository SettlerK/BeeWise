#!/usr/bin/env python3
"""Baut aus dem Projekt eine einzige HTML-Datei.

Zweck: zum Ausprobieren per Doppelklick (ohne Webserver) und zum Verschicken.
Die normale Version (index.html + js/) bleibt die Grundlage für Hosting und APK.
"""
import re, base64, pathlib

W = pathlib.Path(__file__).parent
MODULE = ['lang/en.js', 'i18n.js', 'util.js', 'db.js', 'tracht.js', 'regeln.js', 'engine.js', 'aufgaben.js',
          'karte.js', 'bilder.js', 'hilfe.js', 'kalenderexport.js', 'qr.js', 'pdf.js', 'etiketten.js',
          'berichte.js', 'koeniginnen.js', 'fotos.js', 'vergleich.js', 'varroa.js',
          'packliste.js', 'kasse.js', 'winter.js', 'gewicht.js', 'futter.js', 'bildschau.js', 'stand.js', 'sync.js', 'ui.js', 'app.js']

NAMENSRAUM = {'db.js': 'db', 'sync.js': 'sync', 'koeniginnen.js': 'koe', 'fotos.js': 'fotos',
              'kasse.js': 'kasse', 'winter.js': 'winter', 'gewicht.js': 'gewicht', 'futter.js': 'futter'}

def namensraum(datei, alias):
    """Baut `const alias = { ... }` aus allen Ausfuhren einer Datei."""
    text = (W / 'js' / datei).read_text(encoding='utf-8')
    namen = re.findall(r'^export\s+(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)',
                       text, flags=re.M)
    for block in re.findall(r'^export\s*\{([^}]*)\};', text, flags=re.M):
        for teil in block.split(','):
            name = teil.split(' as ')[-1].strip()
            if name:
                namen.append(name)
    einmalig = list(dict.fromkeys(namen))
    if not einmalig:
        raise SystemExit(f'Keine Ausfuhren in {datei} gefunden – Namensraum {alias} wäre leer.')
    return f'const {alias} = {{ ' + ', '.join(einmalig) + ' };'


def entkerne(text):
    text = re.sub(r'^import\s[\s\S]*?from\s+[\'"][^\'"]+[\'"];\s*$', '', text, flags=re.M)
    text = re.sub(r'^import\s+[\'"][^\'"]+[\'"];\s*$', '', text, flags=re.M)
    text = re.sub(r'^export\s+(const|let|function|async function|class)\b', r'\1', text, flags=re.M)
    text = re.sub(r'^export\s*\{[^}]*\};\s*$', '', text, flags=re.M)
    return text

# Umbenennende Einfuhren (`import { a as b }`) überleben das Entkernen nicht –
# die Einfuhrzeile fällt ja weg. Deshalb werden sie eingesammelt und nach dem
# Modul, das den Namen bereitstellt, als schlichte Zuweisung ergänzt.
def aliase():
    treffer = {}
    for datei in W.glob('js/**/*.js'):
        text = datei.read_text(encoding='utf-8')
        for block in re.finditer(r'import\s*\{([^}]*)\}\s*from\s+[\'"]\./([^\'"]+)[\'"]', text):
            quelle = block.group(2).replace('./', '')
            for teil in block.group(1).split(','):
                if ' as ' not in teil:
                    continue
                a, b = (x.strip() for x in teil.split(' as '))
                if (a, b) not in treffer.setdefault(quelle, []):
                    treffer[quelle].append((a, b))
    return treffer

ALIASE = aliase()

js = []
for m in MODULE:
    js.append(f'\n// ===== {m} ' + '=' * (66 - len(m)) + '\n')
    js.append(entkerne((W / 'js' / m).read_text(encoding='utf-8')))
    for a, b in ALIASE.get(m, []):
        js.append(f'\nconst {b} = {a};\n')
    if m == 'lang/en.js':
        js.append('\n')
    # Namensraum-Attrappen für `import * as x from ...`. Die Namen werden aus
    # den Dateien gelesen, nicht gepflegt – sonst fehlt irgendwann eine neue
    # Funktion und fällt erst beim Benutzen auf.
    if m in NAMENSRAUM:
        js.append('\n' + namensraum(m, NAMENSRAUM[m]) + '\n')

html = (W / 'index.html').read_text(encoding='utf-8')
css = (W / 'css' / 'app.css').read_text(encoding='utf-8')
icon = base64.b64encode((W / 'icons' / 'icon-192.png').read_bytes()).decode()

html = html.replace('<link rel="stylesheet" href="css/app.css">', f'<style>\n{css}\n</style>')
html = html.replace('<link rel="manifest" href="manifest.webmanifest">', '')
html = html.replace('<link rel="icon" href="icons/icon.svg" type="image/svg+xml">',
                    f'<link rel="icon" href="data:image/png;base64,{icon}">')
html = html.replace('<link rel="apple-touch-icon" href="icons/icon-192.png">', '')
# In der Einzeldatei gibt es kein sw.js daneben: die Registrierung wuerde nur
# einen 404 in der Konsole erzeugen. Sie wird deshalb entfernt – und der Bauer
# bricht ab, wenn sich der Aufruf in app.js aendert.
SW_ALT = ("  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {\n"
          "    navigator.serviceWorker.register('sw.js').catch(() => {});\n"
          "  }")
sw_treffer = sum(1 for teil in js if SW_ALT in teil)
if sw_treffer != 1:
    raise SystemExit('Registrierung des Service Workers in js/app.js nicht gefunden '
                     '(Bauskript anpassen).')
js = [teil.replace(SW_ALT, '  // (Einzeldatei: kein Service Worker)') for teil in js]

html = html.replace('<script type="module" src="js/app.js"></script>',
                    '<script type="module">\n' + ''.join(js) + '\n</script>')
html = html.replace("icon: 'icons/icon-192.png',", f"icon: 'data:image/png;base64,{icon}',")
# Auch das Bild in der Sprachabfrage: die Einzeldatei hat keinen Ordner neben sich.
html = html.replace('src="icons/icon-192.png"', f'src="data:image/png;base64,{icon}"')
if 'icons/' in html:
    raise SystemExit('Verweis auf den Ordner icons/ ist in der Einzeldatei ubrig geblieben.')

ziel = W.parent / 'beewise-einzeldatei.html'
ziel.write_text(html, encoding='utf-8')

# Sicherheitsnetz: im Bündel teilen sich alle Module einen Namensraum. Zwei
# gleichnamige Deklarationen aus verschiedenen Dateien fallen erst beim Laden
# auf – deshalb wird das Ergebnis hier sofort geprüft.
import subprocess, tempfile
skript = html.split('<script type="module">')[1].split('</script>')[0]
with tempfile.NamedTemporaryFile('w', suffix='.mjs', delete=False, encoding='utf-8') as f:
    f.write(skript)
    pruef = f.name
lauf = subprocess.run(['node', '--check', pruef], capture_output=True, text=True)
if lauf.returncode:
    print('FEHLER im Bündel:\n' + lauf.stderr[:1200])
    raise SystemExit(1)

print(f'{ziel}  ({len(html)/1024:.0f} kB)  – Bündel geprüft')

#!/usr/bin/env python3
"""Baut aus dem Projekt eine einzige HTML-Datei.

Zweck: zum Ausprobieren per Doppelklick (ohne Webserver) und zum Verschicken.
Die normale Version (index.html + js/) bleibt die Grundlage für Hosting und APK.
"""
import re, base64, pathlib

W = pathlib.Path(__file__).parent
MODULE = ['lang/en.js', 'i18n.js', 'util.js', 'db.js', 'tracht.js', 'regeln.js', 'engine.js', 'aufgaben.js',
          'karte.js', 'bilder.js', 'hilfe.js', 'kalenderexport.js', 'qr.js', 'pdf.js', 'etiketten.js',
          'berichte.js', 'stand.js', 'sync.js', 'ui.js', 'app.js']

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
    if m == 'db.js':
        # app.js spricht die Datenschicht als Namensraum `db` an
        js.append('\nconst db = { STORES, open, alle, hole, schreibe, loesche, entferne, leere,'
                  ' metaLies, metaSchreibe, exportAlles, importAlles, mischeEin, Sync,'
                  ' nurFluechtig, letzterFehler, zuruecksetzen };\n')
    if m == 'sync.js':
        js.append('\nconst sync = { einstellungen, einstellungenSpeichern, pruefen, abgleichen };\n')

html = (W / 'index.html').read_text(encoding='utf-8')
css = (W / 'css' / 'app.css').read_text(encoding='utf-8')
icon = base64.b64encode((W / 'icons' / 'icon-192.png').read_bytes()).decode()

html = html.replace('<link rel="stylesheet" href="css/app.css">', f'<style>\n{css}\n</style>')
html = html.replace('<link rel="manifest" href="manifest.webmanifest">', '')
html = html.replace('<link rel="icon" href="icons/icon.svg" type="image/svg+xml">',
                    f'<link rel="icon" href="data:image/png;base64,{icon}">')
html = html.replace('<link rel="apple-touch-icon" href="icons/icon-192.png">', '')
html = html.replace('<script type="module" src="js/app.js"></script>',
                    '<script type="module">\n' + ''.join(js) + '\n</script>')
html = html.replace("icon: 'icons/icon-192.png',", f"icon: 'data:image/png;base64,{icon}',")

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

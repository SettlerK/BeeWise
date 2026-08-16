#!/usr/bin/env python3
"""Baut aus dem Projekt eine einzige HTML-Datei.

Zweck: zum Ausprobieren per Doppelklick (ohne Webserver) und zum Verschicken.
Die normale Version (index.html + js/) bleibt die Grundlage für Hosting und APK.
"""
import re, base64, pathlib

W = pathlib.Path(__file__).parent
MODULE = ['lang/en.js', 'i18n.js', 'util.js', 'db.js', 'tracht.js', 'regeln.js', 'engine.js', 'aufgaben.js',
          'karte.js', 'bilder.js', 'hilfe.js', 'kalenderexport.js', 'pdf.js', 'berichte.js',
          'sync.js', 'ui.js', 'app.js']

def entkerne(text):
    text = re.sub(r'^import\s[\s\S]*?from\s+[\'"][^\'"]+[\'"];\s*$', '', text, flags=re.M)
    text = re.sub(r'^import\s+[\'"][^\'"]+[\'"];\s*$', '', text, flags=re.M)
    text = re.sub(r'^export\s+(const|let|function|async function|class)\b', r'\1', text, flags=re.M)
    text = re.sub(r'^export\s*\{[^}]*\};\s*$', '', text, flags=re.M)
    return text

js = []
for m in MODULE:
    js.append(f'\n// ===== {m} ' + '=' * (66 - len(m)) + '\n')
    js.append(entkerne((W / 'js' / m).read_text(encoding='utf-8')))
    if m == 'lang/en.js':
        js.append('\n')
    if m == 'db.js':
        # app.js spricht die Datenschicht als Namensraum `db` an
        js.append('\nconst db = { STORES, open, alle, hole, schreibe, loesche, entferne, leere,'
                  ' metaLies, metaSchreibe, exportAlles, importAlles, mischeEin, Sync };\n')
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
print(f'{ziel}  ({len(html)/1024:.0f} kB)')

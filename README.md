# Doxxing – Website & LED-Wand

Texte lesen, Bilder ansehen – und je nachdem, welcher Text gerade im Bild ist, laufen auf den LED-Panels andere Animationen.
Unten links wechselt man zwischen **Texte** und **Panels** (Steuerpult) sowie **Light** und **Dark**.

## Ordner

```
content/          ← hier kommen alle Inhalte hin
  01-coldplay-konzert/
    text.md       ← Text + Projektinformationen
    bilder/       ← Bilder für die Spalte «Bilder» (jpg, png, webp, gif)
    led/          ← Animationen für die Panels
  _definition/    ← Sonderseiten (Ordner mit _ am Anfang), klappen in der Navigation auf
    text.md       ← Text, der beim Aufklappen erscheint
  _praevention/
    text.md       ← optional: Text beim Aufklappen
    seiten/       ← Seiten als Bilder; Klick auf die «Please share»-Kachel öffnet sie (Seite 1/4 …)
    praevention.pdf   ← zum Herunterladen in der Seitenansicht
site/             ← die Website selbst (index.html, Schrift, zeromq)
build.js          ← fasst alles zusammen (läuft automatisch auf Vercel)
```

Die Reihenfolge der Projekte ergibt sich aus `nr:` im Text (sonst aus der Zahl am Anfang des Ordnernamens).

## Neues Projekt anlegen

1. Ordner in `content/` anlegen, z. B. `12-hongkong-proteste`.
2. Darin `text.md` erstellen:

```markdown
---
nr: 12
titel: Hongkong Proteste
autorin: Max Mustermann
datum: 2019
quelle: https://…
---

Erster Absatz …

Zweiter Absatz. Ein [Link](https://…), **fett**, *kursiv*.
```

3. Bilder in `bilder/`, Animationen in `led/` legen.
4. Committen & pushen → Vercel baut die Seite neu (ca. 1 Minute).

Das geht auch direkt im GitHub-Webinterface: «Add file» → «Upload files» bzw. «Create new file».

## LED-Animationen zuordnen

**Einfach:** Dateien in `led/` so benennen wie den Screen – dann ist keine weitere Angabe nötig:

| Datei | Screen | Grösse |
|---|---|---|
| `wand.gif` / `wand.mp4` | 4er-Wand (grosse Panels, 10.42.0.12) | 64 × 128 |
| `e1.gif` … `e4.gif` | Einzel 1–4 (kleine Panels, 10.42.0.1) | 64 × 32 |

**Frei benannt:** im Kopfteil von `text.md` zuordnen. Dieselbe Datei darf mehrfach vorkommen, `schwarz` schaltet einen Screen ab:

```yaml
led:
  wand: turm.mp4
  e1: blinken.gif
  e2: blinken.gif
  e3: schwarz
  e4: logo.png
```

Gibt es für einen Screen keine Datei, bleibt er schwarz.
Erlaubt sind GIF, PNG/APNG, JPG, WebP, MP4 (H.264) und WebM. Am besten gleich in der Zielgrösse exportieren – dann sind die Dateien winzig und nichts wird abgeschnitten.

Auch `_definition` und `_praevention` können einen Ordner `led/` haben; die Animationen laufen dann, solange die Seite offen ist.

## Ausstellungsrechner

Gesendet wird nur aus einem Browser, der dafür freigeschaltet ist – sonst würde jeder Besucher der öffentlichen Seite versuchen, die Panels zu erreichen.

1. Einmal `https://<deine-seite>.vercel.app/?led` öffnen (oder unter **Panels** «Dieser Browser steuert die Panels» anhaken). Der Browser merkt sich das.
2. Chrome blockiert ws:// auf einer https-Seite: Schloss-Symbol → Website-Einstellungen → «Unsichere Inhalte» → «Zulassen», neu laden. Fragt Chrome nach dem lokalen Netzwerk: erlauben.
3. Beide LED-Server auf **4 Panels** (256 × 32) einstellen.
4. Den Tab sichtbar lassen – im Hintergrund bremst Chrome die Animationen.

Unter **Panels** lassen sich die Screens auch von Hand bespielen (Medien anklicken oder auf einen Screen ziehen). Sobald man zurück zu **Texte** wechselt, folgen die Panels wieder dem Text.

## Lokal ansehen

```
node build.js
cd dist && python3 -m http.server 8000     # oder: npx serve dist
```
→ http://localhost:8000

`build.js` meldet fehlende Dateien (z. B. eine LED-Datei, die im Text steht, aber nicht im Ordner liegt).

## Schrift

Antique Legacy Book liegt in `site/font/` und ist in `site/index.html` (`@font-face` und `--font`) eingebunden.

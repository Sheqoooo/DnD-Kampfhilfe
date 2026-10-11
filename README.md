# Initiative — DnD-Kampfhilfe

Deutschsprachiger Kampftisch mit illustriertem Anime-Fantasy-Hintergrund.

## Spieler und Kämpfe

Spielercharaktere stehen prominent über dem Kampftisch und werden dauerhaft mit HP, maximalen HP, Klasse, Level, Rüstungsklasse, Initiative-Bonus, Zuständen und Notizen gespeichert. HP-Änderungen im aktiven Kampf aktualisieren den Charakter. Ein neuer Kampf übernimmt ausgewählte Spieler mit ihren aktuellen Werten. Über den Kampfverlauf lassen sich frühere Kämpfe mit ihrer damaligen Karte, HP, Runde und Zugfolge wieder öffnen. Das Öffnen eines alten Kampfes verändert den aktuellen Charakterstand nicht.

Bestehende Browserdaten werden automatisch aus der ersten Version übernommen. Alle Daten liegen ausschließlich im Browser; es gibt keine Geräte-Synchronisation. Sichern exportiert Spieler und den gesamten Verlauf. Laden akzeptiert vollständige Sicherungen und alte einzelne Kampfsicherungen.

## Zeichnen und Initiative

Helden und Gegner hinzufügen, HP verändern, Initiative sortieren, Runden weiterschalten, Rückgängig. Raster mit verschiebbaren Figuren; Freihandlinien werden vereinfacht, geschlossene Rechtecke und Ovale zu sauberen Räumen.

## Starten und testen

Statische App ohne Build oder JavaScript-Abhängigkeiten. Für lokale Nutzung aus dem Repository: `python3 -m http.server 4173 --bind 127.0.0.1 --directory dist` und dann http://127.0.0.1:4173 öffnen.

Tests: `node --test tests/*.test.js`. Die GitHub-Pages-Veröffentlichung prüft die Tests und stellt die App sowohl an der Projektwurzel als auch unter /dist/ bereit.

## Assets

`dist/adventure-world.png`: eigenes generiertes Anime-Fantasy-Landschaftsbild mit sonniger Wiese, Bergen, Burgen und Drachen. Erstellt mit dem eingebauten Imagegen-Werkzeug. Prompt: Original anime fantasy background painting, bright daytime meadow with flowers, distant medieval castles, layered blue-green mountains, clouds and two flying dragons; hand-painted animation background, no text or UI.

Die Dateien im Ordner outputs sind ältere Exporte der ersten App-Version. Aktueller App-Quellcode befindet sich in dist.

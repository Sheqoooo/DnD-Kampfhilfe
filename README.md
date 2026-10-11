# Initiative — Dein Kampftisch

Eine deutschsprachige, browserbasierte Hilfe für spontane DnD-Kämpfe.

## Funktionen

- Helden und Gegner mit Namen, HP und Initiative hinzufügen; mehrere Gegner auf einmal.
- Initiative absteigend sortieren, Runden und aktive Figur verfolgen; Gleichstände behalten Einfügereihenfolge.
- Schaden und Heilung mit frei wählbarem Betrag. Figuren bei 0 HP bleiben für Todesrettungswürfe etc. in der Zugfolge.
- SVG-Kampffeld mit Raster, geraden Wänden, Rechtecken, Ovalen und Freihand-Formerkennung.
- Figuren verschieben; Tastatur-Pfeile bewegen fokussierte Figuren.
- Rückgängig für die letzten 60 Änderungen, lokale Speicherung, JSON-Export und validierter Import.

## Lokal starten

`python3 -m http.server 4173 --bind 127.0.0.1 --directory dist`

Anschließend `http://127.0.0.1:4173` im Browser öffnen.

## Tests

`node --test tests/core.test.js`

Kein Build und keine JavaScript-Abhängigkeiten erforderlich. `dist/` kann von jedem statischen Webhost bereitgestellt werden. `.openai/hosting.json` enthält die Sites-Projektzuordnung; diese beim Umzug zu einem anderen Anbieter nicht übernehmen.

## Daten und Grenzen

Alle Kampf- und Kartendaten liegen im localStorage des jeweiligen Browsers und der jeweiligen Website-Adresse. Keine geräteübergreifende Synchronisierung, keine Mehrspielerfunktion. Mit „Sichern“ regelmäßig exportieren; über „Laden“ lassen sich Daten auch von der lokalen Vorschau zur veröffentlichten App übertragen. Browserdatenlöschung entfernt lokale Kämpfe. Rückgängig-Verlauf endet beim Neuladen.

Freihand-Erkennung arbeitet geometrisch, ohne KI-Dienst: einfache annähernd geschlossene Rechtecke/Ovale werden zu Räumen, offene Linien werden vereinfacht und optional am Raster ausgerichtet. Keine Erkennung komplexer Grundrisse oder künstlerische Kartengenerierung.

Schriften werden aktuell von Google Fonts geladen; bei fehlender Verbindung werden Systemschriften verwendet.

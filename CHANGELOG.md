# Änderungen

Neue Einträge stehen oben. Dieses Protokoll beschreibt Änderungen an der App; die Git-Historie enthält die einzelnen Codeänderungen. Frühere Arbeiten sind hier nachträglich zusammengefasst. Ausführliche technische Prüfergebnisse stehen in [dist/DESIGN.md](dist/DESIGN.md).

## 2026-10-25

### Eigenständige Spielfeldsammlung

- **Spielfelder** als eigene Sammlung ergänzt: Aktuelle Karte benennen und getrennt von Kämpfen speichern.
- Gespeichert werden nur Gebäude, Gelände, Wände, Türen und Kartenausschnitt. Helden, Gegner, HP, Runde und Zugfolge gehören nicht zur Vorlage.
- Karten suchen, laden, umbenennen, duplizieren, aktualisieren und entfernen. Beim Laden bleiben Beteiligte und Kampfstand erhalten; die Karte wird als unabhängige Kopie eingesetzt.
- Laden und Änderungen an der Sammlung nutzen den bestehenden Rückgängig-/Wiederholen-Verlauf.
- Spielfeldsammlung in lokale Speicherung, vollständige JSON-Sicherungen und Importprüfung aufgenommen; ältere Sicherungen bleiben gültig.
- 124 Tests bestanden, einschließlich unabhängiger Kartenkopien, Erhalt des Kampfstands, Rückgängig, Sicherungen und ungültiger Daten.

## 2026-10-24

### Freie Zeichnungen und tolerantere Flächenverarbeitung

- Fehler „Die Geländeform passt nicht zu ihrer Grundfläche“ an der Modellgrenze behoben: Bei freien Wasser-/Geländeflächen ergeben sich die Begrenzungen aus den gezeichneten Punkten. Fehlende oder widersprüchliche zusätzliche Rechteckangaben führen nicht mehr zur Ablehnung.
- Beliebige geschlossene Polygone, Rechtecke und Ellipsen sowie geschlossene Linien ergänzt. Das Modell kann eigene Motive aus Grundformen zusammensetzen, ohne dafür einen benannten Geländetyp zu benötigen.
- Eigene Objektnamen mit gültigen Punkten werden als freie Konturen interpretiert. Punkte in Objektform werden ebenfalls übernommen.
- Über den Referenzausschnitt hinausreichende Pläne werden gemeinsam proportional eingepasst. Anschlüsse und relative Abstände bleiben erhalten; einzelne Konturen werden nicht abgeschnitten.
- Spielraum für größere Pläne und längere Linien erweitert; das Antwortbudget des Modells wurde erhöht. Die Darstellung bleibt eine grobe Umrisskarte.
- 119 Tests bestanden, darunter widersprüchliche Wasser-Rechtecke, fehlende Begrenzungsangaben, freies Zeichnen außerhalb des Referenzausschnitts, Anschlüsse, eigene Motive und längere Konturen.

### Kartenchat als grobe Umrisskarte

- Systemprompt auf eine sparsame Draufsicht mit offenen Konturen, begehbaren Durchgängen und sinnvollen Abständen umgestellt. Der vom Nutzer betonte Bereich bestimmt den Kartenausschnitt.
- Neue KI-Karten erhalten einfache Linien statt gefüllter Felsen, Berge, Böden oder dekorativer Details. Wasser bleibt leicht blau eingefärbt. Gespeicherte Karten und manuelle Geländegeneratoren behalten ihre bisherige Darstellung.
- Offene Konturlinien und Treppen als eigene Planungsbausteine ergänzt. Treppen werden zu wenigen parallelen, einzeln bearbeitbaren Stufenlinien.
- Karten werden proportional in den sichtbaren Ausschnitt eingepasst, damit Breiten und Abstände nicht durch ein anderes Seitenverhältnis verzerrt werden.
- 116 Tests bestanden, einschließlich offener Durchgänge, Stufenabstände, Speicherung der Darstellung, proportionaler Platzierung und unveränderter manueller Geländedarstellung.

### Behoben

- Kartenchat lehnte Szenen mit mehrfach verwendeten Objektkennungen vollständig ab, etwa mehrere Felsen mit der Kennung `rock`. Solche Kennungen werden jetzt eindeutig ergänzt; alle Objekte und ihre Geometrie bleiben erhalten.
- Der Kartenplan wird vor der Vorschau vollständig geprüft. Bei ungültigen Modellantworten gibt es einmalig einen automatischen Korrekturversuch mit konkreter Fehlerrückmeldung. Abbruch beendet auch diesen Ablauf.
- Der automatische Systemprompt erklärt wiederholte Objekte und erlaubte Typnamen deutlicher.
- Die Zeitüberschreitung beim Verbindungstest fordert nicht mehr zu einer einfacheren Szene auf, sondern nennt die lokale API und Browserfreigabe als Prüfpunkte.
- Modellabfrage ohne API-Schlüssel sendet keinen unnötigen Content-Type-Header.

### Neu

- Allgemeiner Kartenchat unter **Generator ＋** mit automatischem Systemprompt und lokaler Strata-Anbindung.
- Freie Ortsbeschreibungen, Vorschau, bearbeitbare Kartenelemente und nachträgliche Änderungswünsche. Die vorherige KI-Szene kann ersetzt werden, ohne andere Zeichnungen oder Beteiligte zu verändern.
- Unterstützte Bausteine: Wasser, Sand, Wege, Stege, Berge, Bäume, Felsen, Wände, Räume und Türen sowie Haus- und Geländegeneratoren.
- Lokale Modellauswahl, optionaler nicht dauerhaft gespeicherter API-Schlüssel und Abbruch laufender Anfragen.
- README auf den aktuellen Stand von Mini Mind Theater gebracht und dieses Änderungsprotokoll eingeführt.

### Geprüft

- 113 automatisierte Tests, darunter die echte zuvor problematische Qwen-Antwort, doppelte und fehlende Kennungen, automatische Korrektur und Abbruch.
- Höhleneingangs-Prompt mit Qwen3.8-Flash-Next Q2_0 im Browser: Vorschau mit elf bearbeitbaren Elementen.
- Frühere Kartenchat-Prüfung: Szene übernehmen, nur den Teich ändern, vorherige Szene ersetzen und mit Rückgängig den ursprünglichen Karten- und HP-Stand wiederherstellen.

## 2026-10-21

- **Orte & Kämpfe**: Vorbereitungen erstellen, aktuelle Szenen speichern, unabhängig bearbeiten, suchen, duplizieren und wiederverwenden.
- Vorbereitete Kämpfe mit gewählten Helden und aktuellen oder vorbereiteten Werten starten; Vorlagen bleiben erhalten und werden in JSON-Sicherungen aufgenommen.
- Beteiligte direkt über × in der Zugfolge entfernen. Die nächste Figur übernimmt, wenn die aktive Figur entfernt wird; Charakter- und Gegnerbibliotheken bleiben erhalten. Rückgängig stellt den Zustand wieder her.

## 2026-10-19 bis 2026-10-20

- Generatoren für Höhlen, Ruinen, Wälder/Lichtungen, Flüsse mit Brücke oder Furt und Felsfelder ergänzt.
- Gemeinsamer Ablauf mit Flächenwahl, Optionen, Vorschau, Varianten und Übernahme in einem Rückgängig-Schritt.
- Wälder bereinigt: Lichtungen sind freie Flächen zwischen Bäumen; störende grüne Kreise und rechteckige Wege entfallen.
- Starre 6×6–40×40-Grenze entfernt; passende Größen werden anhand der tatsächlichen Geometrie geprüft.
- **Spielfeld leeren** mit optionalem Entfernen der sichtbaren Figuren und Rückgängig ergänzt.
- Gegnerliste dauerhaft sichtbar, ohne Ein- und Ausklappen.

## 2026-10-17

- Hausgenerator mit wählbarer Raumanzahl, Eingang, verbundenen Innenräumen, Türen und Vorschau.
- Anbauten über Griffe an geeigneten Außenwänden per Klick, Ziehen oder zwei Klicks ergänzen. Gemeinsame Wände und Verbindungstüren bleiben sinnvoll erhalten.
- Gegnernummern auf den jeweiligen Kampf begrenzt; neue Kämpfe übernehmen keine hohen Nummern aus früheren Kämpfen.

## 2026-10-14

- Kartenoberfläche verdichtet: Titel und Zugfolgen-Steuerung zusammengeführt, kompakte Bedienleiste und optionale Hilfetexte statt zusätzlicher voller Zeilen.
- Mehr Höhe für das Spielfeld; Zugfolge auf sehr schmalen Bildschirmen zunächst eingeklappt.
- Trackpad-Bedienung mit Verschieben, Pinch-Zoom und Zeichnen durch zwei Klicks verbessert.

## Früherer Stand bis 2026-10-13

- Alte Gestaltung durch Holzspieltisch, Pergament-Panels und gelieferte Fantasy-Assets ersetzt; Dark-Mode entfernt.
- Leerer Tisch statt eingebrannter Deko, separate responsive Motive und Dekogruppen, passende Schattenpaare, Vignette sowie Karten-, Werkzeug- und Scrollbar-Rahmen integriert. Größen, Gruppierung, Abstände und Beschnitt mehrfach verfeinert.
- Digitale Würfel und verpflichtende Initiative-Eingabe aus dem Ablauf entfernt. Nummerierte Zugfolge mit Ziehgriff, direkter Sortiervorschau und Tastaturalternative; aktive und zuletzt ausgewählte Figur unterschiedlich markiert.
- Wiederverwendbare Gegnervorlagen mit Suche, Drag-and-drop und eigenen HP je Kopie; eindeutige Namen und Tokenkennungen für gleiche Gegner.
- Zeichnen und Bearbeiten von Wänden, Räumen und Türen, automatisches Verbinden, Mehrfachauswahl, gemeinsames Skalieren/Löschen sowie Rückgängig und Wiederholen.
- Zoom und vergrößerte Zeichenwelt, Verschieben der Ansicht mit dem Auswahlwerkzeug und kompaktere Kartenwerkzeuge.
- Dauerhafte Charaktere, Kampfverlauf, lokale Speicherung und vollständige JSON-Sicherungen.

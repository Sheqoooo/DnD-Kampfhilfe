# Mini Mind Theater — Dein DnD-Kampftisch

Deutschsprachige DnD-Kampfhilfe mit interaktiver Karte, manuell sortierter Zugfolge und einem Fantasy-Spieltisch aus Holz und Pergament. Gewürfelt wird am Tisch mit echten Würfeln.

**[App öffnen](https://sheqoooo.github.io/DnD-Kampfhilfe/dist/)** · **[Änderungsprotokoll](CHANGELOG.md)**

## Charaktere und Kämpfe

- Spielercharaktere dauerhaft mit HP, Klasse, Level, Rüstungsklasse, Zuständen und Notizen verwalten.
- Gegner als wiederverwendbare Vorlagen speichern, suchen und per Drag-and-drop oder ＋ zum Kampf hinzufügen. Jede Kopie hat eigene HP; gleiche Gegner erhalten eindeutige Nummern.
- Zugfolge nach den am Tisch gewürfelten Ergebnissen am Griff ziehen und mit direkter Vorschau sortieren. Alternativ funktionieren Alt und die Pfeiltasten. Es gibt keine digitalen Würfel und keine verpflichtende Initiative-Eingabe.
- Deutlich nummerierte Plätze, rote Markierung für die aktive Figur und goldene Markierung für die zuletzt ausgewählte Figur.
- Schaden und Heilung mit frei wählbarem Betrag, Runden verfolgen und Beteiligte direkt aus dem aktuellen Kampf entfernen. Gespeicherte Charaktere und Gegnervorlagen bleiben erhalten.
- Frühere Kämpfe über den Kampfverlauf wieder öffnen. Der aktuelle Stand der gespeicherten Helden wird dabei nicht zurückgesetzt.

## Interaktives Kampffeld

- Wände, rechteckige und runde Räume, Türen und Freihandformen zeichnen. Linien werden geglättet, geschlossene einfache Formen erkannt und passende Gebäude verbunden.
- Räume innerhalb eines Gebäudes ergänzen oder über die Griffe an Außenwänden anbauen.
- Figuren und Formen auswählen, verschieben, gemeinsam skalieren und löschen. Änderungen lassen sich rückgängig machen und wiederholen.
- Heraus- und hineinzoomen, die Ansicht auf leerer Fläche mit dem Auswahlwerkzeug ziehen und das MacBook-Trackpad zum Verschieben und Zoomen verwenden. Ziehen oder Platzieren mit zwei Klicks erleichtert das Zeichnen.
- Häuser mit Räumen und Türen sowie Höhlen, Ruinen, Wälder mit freier Lichtung, Flüsse mit Übergängen und Felsfelder generieren. Vor dem Platzieren gibt es eine Vorschau und alternative Varianten.
- Das Spielfeld komplett oder nur die Zeichnungen leeren; Figuren lassen sich separat wieder einblenden.

## Orte und Kämpfe vorbereiten

Unter **Orte & Kämpfe** lassen sich leere Vorbereitungen anlegen oder die aktuelle Karte mit Gegnern, Helden, Positionen und Zugfolge speichern. Vorbereitungen können unabhängig bearbeitet, dupliziert und als neuer Kampf gestartet werden. Beim Start stehen aktuelle oder vorbereitete Heldenwerte zur Auswahl; die Vorlage bleibt wiederverwendbar.

## Kartenchat mit lokalem Modell

Unter **Generator ＋ → Kartenchat** einen beliebigen Ort beschreiben. Die App schickt automatisch einen Systemprompt mit Zeichenregeln, verfügbaren Elementen und Vorgaben für zusammenhängende, spielbare Karten mit. Das Modell plant eine grobe Draufsicht mit Umrissen, offenen Durchgängen und nachvollziehbaren Abständen. Die App wandelt den Plan in normale, bearbeitbare Kartenelemente um. Neue KI-Karten verwenden einfache Linien ohne Flächenmalerei oder dekorative Details; nur Wasser wird dezent blau eingefärbt. Treppen bestehen aus wenigen parallelen Stufenlinien. Beim Einfügen bleiben die Größenverhältnisse erhalten. Bereits gespeicherte Karten behalten ihre Darstellung.

1. Strata auf demselben Rechner starten, ein Modell laden und die lokale API aktivieren.
2. Im Kartenchat die API-Adresse eintragen, standardmäßig `http://127.0.0.1:47831/v1`, und **Verbindung prüfen** wählen. Modell und gegebenenfalls API-Schlüssel auswählen bzw. eintragen.
3. Ort beschreiben, Vorschau prüfen und **Auf Karte übernehmen** wählen. Weitere Nachrichten können die Szene verändern, etwa „Teich größer, mehr Deckung links“.

Getestet mit Qwen3.8-Flash-Next Q2_0. Der Client verwendet die lokalen Endpunkte `/v1/models` und `/v1/chat/completions`. Für den Zugriff von der veröffentlichten App kann eine lokale Netzwerkfreigabe im Browser nötig sein. Strata und das Modell müssen während der Generierung laufen.

Doppelte Objektkennungen werden automatisch eindeutig gemacht. Ungültige Pläne erhalten höchstens einen automatischen Korrekturversuch mit konkreter Fehlerrückmeldung an das Modell. Unbekannte Typen und ungültige Geometrie werden weiterhin geprüft; eine fehlerhafte Antwort verändert die Karte nicht. Die Qualität der Anordnung hängt vom Modell ab, und nicht jedes gewünschte Detail hat einen eigenen Zeichentyp.

Die Übernahme ist ein einzelner rückgängig machbarer Schritt. Folgeänderungen können nur die vorherige KI-Szene ersetzen; andere Zeichnungen, Figuren und HP bleiben erhalten. Chatkontext besteht nur während der geöffneten App-Sitzung. Übernommene Karten werden wie normale Zeichnungen gespeichert.

## Gestaltung und Assets

Die Oberfläche verwendet den leeren Tisch `dist/assets/desk-clean.webp`, skalierbare Pergament-Panels, echte HTML-Schaltflächen mit Asset-Rahmen und responsive Dekoration. Dekogruppen verwenden die gelieferten Objekt-/Schattenpaare; Dekoration fängt keine Klicks ab. Auf schmalen Bildschirmen werden Elemente reduziert oder Panels gestapelt. Ein Dark-Mode gehört nicht mehr zum aktuellen Design.

Die gelieferten Asset-Pakete und deren Hinweise bleiben im Projekt erhalten. Technische Gestaltungs- und Prüfhistorie: [dist/DESIGN.md](dist/DESIGN.md).

## Speicherung und Sicherungen

Charaktere, Gegnervorlagen, Kämpfe, Karten und Vorbereitungen liegen im lokalen Browserspeicher der jeweiligen Website-Adresse. Es gibt keine Geräte-Synchronisierung oder Mehrspielerfunktion. Die lokale Vorschau und GitHub Pages haben getrennte Datenbestände.

**Sichern** exportiert die vollständigen Daten als JSON; **Laden** importiert geprüfte Sicherungen, einschließlich unterstützter älterer Formate. Browserdatenlöschung entfernt die dort gespeicherten Daten. Der Rückgängig-Verlauf endet beim Neuladen. Ein GitHub-Commit sichert den App-Code, nicht die im Browser gespeicherten Kämpfe.

Die Kartenbeschreibung wird erst beim Generieren an die eingestellte lokale Modell-API geschickt. Adresse und Modell werden gemerkt, der optionale API-Schlüssel wird nicht dauerhaft gespeichert. Beim bloßen Seitenaufruf wird keine Modellanfrage ausgelöst. Schriften werden über Google Fonts geladen; bei fehlender Verbindung greifen Ersatzschriften.

## Entwickeln und veröffentlichen

Statische App ohne Build und ohne JavaScript-Abhängigkeiten. Aktueller Quellcode: `dist/`.

```sh
npm start
npm test
```

Die lokale App läuft standardmäßig unter `http://127.0.0.1:4173`. Der vollständige Testlauf umfasst aktuell 116 Tests. Die GitHub-Pages-Veröffentlichung führt die Tests aus und stellt die App an der Projektwurzel und unter `/dist/` bereit.

Bei jeder funktionalen Änderung oder Fehlerkorrektur wird [CHANGELOG.md](CHANGELOG.md) ergänzt. Ändern sich Bedienung oder Funktionsumfang, wird zusätzlich diese README aktualisiert. Git-Commits halten die einzelnen Codeänderungen fest; ältere Stände lassen sich darüber wiederherstellen.

# Hexfront 39–45

Rundenbasiertes Hex-Strategiespiel im Zweiten Weltkrieg. Läuft komplett im Browser, ohne Build und ohne Abhängigkeiten.

## Starten

`index.html` im Browser öffnen (Doppelklick genügt). Alternativ lokal ausliefern:

```sh
python3 -m http.server 8765
# → http://localhost:8765
```

## Spiel

- **Achsenmächte** (Deutschland, Italien, Japan) gegen **Alliierte** (USA, Großbritannien, Sowjetunion). Jede Nation hat eigene Einheitennamen und einen Bonus.
- Mensch gegen Computer, Hotseat (zwei Menschen) oder Computer gegen Computer.
- Zufällige, punktsymmetrische Karten in zwei Größen (mittel, groß) mit Straßennetz zwischen HQs und Städten; ein Seed reproduziert die Karte.
- 11 Einheitentypen: Infanterie, Aufklärung, LKW, Halbkettenfahrzeug, Panzer, Schwerer Panzer, Panzerabwehr, Artillerie, Leichte Flak, Schwere Flak, Jagdbomber – jeweils mit NATO-Symbol und Silhouetten-Icon.
- Nebel des Krieges (abschaltbar): Jeder Typ hat eine Sichtweite, Aufklärer und Flugzeuge sehen in Wälder. Nur aufgeklärte Gegner sind sichtbar und angreifbar; unentdeckte Gegner führen zu Hinterhalten.
- Leichte Flak (1–3 Felder) ist auch gegen weiche Ziele stark, schwere Flak wie die 8,8 cm (2–5 Felder) auch gegen Panzer. Artillerie schießt 2–5 Felder weit.
- Artillerie und Flak sind gezogen und bewegen sich nur mit LKW oder Halbkettenfahrzeug (Ausnahme: US-Flakpanzer M16). Auch Infanterie kann mitfahren. Ein Fahrzeug lädt eine Einheit; wird es beladen vernichtet, ist die Ladung verloren.
- Straßen: jedes Feld kostet 1 Bewegungspunkt. Abseits bremst das Gelände, Radfahrzeuge stärker als Ketten. Sümpfe sind nur für Infanterie passierbar.
- Artillerie und Panzerabwehr können keine Flugzeuge angreifen; andere Bodeneinheiten außer Flak haben gegen Flugzeuge nur 80 % Angriffskraft.
- Bewegung kostet Angriffskraft: −10 % je in diesem Zug gezogenem Feld.
- Wer in einen Hinterhalt läuft, ist überrascht und hat bis zum Ende des gegnerischen Zuges 60 % weniger Angriffskraft.
- Beschädigte Einheiten werden in eigenen Städten und im HQ repariert (+3 Stärke pro Runde).
- Ziel: alle Städte erobern (beide Hauptquartiere zählen mit). Wer alle hält, gewinnt; nach 50 Runden entscheiden Städte und Truppenstärke.

Die vollständigen Regeln stehen im Startbildschirm unter „Spielregeln“.

**Bedienung:** Einheit anklicken → blaues Feld zum Ziehen → rot markiertes Ziel zum Angreifen. Eigene leere Stadt anklicken, um Truppen auszuheben. Zum Verladen Fahrzeug und Einheit nebeneinander stellen und nacheinander anklicken; nach der Fahrt ein gelbes Feld zum Absetzen anklicken. `N` nächste Einheit, `E` Zug beenden, `U` Ladung absetzen, `Esc`/Rechtsklick Auswahl aufheben.

## Einheiten anpassen

Alle Einheitenwerte (Bewegung, Angriff, Verteidigung, Reichweite, Sicht, Kosten, Fähigkeiten) stehen in [`config/einheiten.js`](config/einheiten.js). Werte ändern, speichern, Spiel neu laden – die Änderungen gelten ab dem nächsten Spiel. Die Datei erklärt jedes Attribut. Bei Tippfehlern oder ungültigen Werten zeigt das Spiel beim Start eine Fehlerliste statt des Menüs.

Für die Online-Version müssen Änderungen committet und gepusht werden.

## Code

| Datei | Inhalt |
|---|---|
| `config/einheiten.js` | Einheitenwerte zum Anpassen |
| `js/data.js` | Gelände, Nationen und Boni; prüft die Einheiten-Konfiguration |
| `js/hex.js` | Hex-Koordinaten, Distanzen, Zufallsgenerator |
| `js/map.js` | Kartengenerator |
| `js/game.js` | Spielregeln (ohne DOM) |
| `js/ai.js` | Computergegner |
| `js/render.js` | Canvas-Darstellung und Animationen |
| `js/ui.js` | Bedienung, Seitenleiste, Dialoge |

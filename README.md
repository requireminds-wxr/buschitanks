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
- Zufällige, punktsymmetrische Karten in drei Größen; ein Seed reproduziert die Karte.
- 8 Einheitentypen: Infanterie, Aufklärung, Panzer, Schwerer Panzer, Panzerabwehr, Artillerie, Flak, Jagdbomber.
- Sieg durch Eroberung des feindlichen Hauptquartiers oder Vernichtung aller feindlichen Einheiten; nach 40 Runden entscheiden Städte und Truppenstärke.

Die vollständigen Regeln stehen im Startbildschirm unter „Spielregeln“.

**Bedienung:** Einheit anklicken → blaues Feld zum Ziehen → rot markiertes Ziel zum Angreifen. Eigene leere Stadt anklicken, um Truppen auszuheben. `N` nächste Einheit, `E` Zug beenden, `Esc`/Rechtsklick Auswahl aufheben.

## Code

| Datei | Inhalt |
|---|---|
| `js/data.js` | Gelände, Einheitentypen, Nationen und Boni |
| `js/hex.js` | Hex-Koordinaten, Distanzen, Zufallsgenerator |
| `js/map.js` | Kartengenerator |
| `js/game.js` | Spielregeln (ohne DOM) |
| `js/ai.js` | Computergegner |
| `js/render.js` | Canvas-Darstellung und Animationen |
| `js/ui.js` | Bedienung, Seitenleiste, Dialoge |

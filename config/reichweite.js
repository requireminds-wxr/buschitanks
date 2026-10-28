// ============================================================================
//  Hexfront 39–45 – Reichweite und Schaden von Waffen je Entfernung
// ============================================================================
//
//  NOCH NICHT AKTIV: Diese Datei ist vorbereitet, aber noch leer und wird vom
//  Spiel noch nicht geladen. Bis dahin gelten Reichweite (range) und
//  Angriffswerte (soft, hard) aus config/einheiten.js – mit gleicher Wirkung
//  auf jede Entfernung.
//
//  Idee: Die Leistung von Waffen nimmt mit der Entfernung ab. Für jede Waffe
//  (Schlüssel = Einheitentyp wie in config/einheiten.js, z. B. art, hflak,
//  lflak, at, tank) steht hier:
//
//    range   Reichweite [min, max] in Feldern, gezählt vom Feld des Schützen
//            bis zum Feld des Ziels (1 = Nachbarfeld). Ist die Waffe hier
//            eingetragen, ersetzt dieser Wert range aus config/einheiten.js.
//    soft    Schadenspunkte gegen weiche Ziele (Infanterie, Geschütze, LKW)
//            je Entfernung: { Entfernung: Schadenspunkte, … }
//    hard    Schadenspunkte gegen harte Ziele (Panzer) je Entfernung:
//            { Entfernung: Schadenspunkte, … }
//
//  Hinweise:
//  - Für jede Entfernung von min bis max sollte ein Wert in soft und hard
//    stehen. 0 = gegen diese Zielart auf diese Entfernung wirkungslos.
//  - Leicht gepanzerte Ziele (armor 0.5, z. B. Aufklärer, Halbkette) erhalten
//    wie bisher eine Mischung aus soft und hard.
//  - Nationsabweichungen aus config/nationen.js (z. B. hard: -3) kommen auf
//    jede Entfernung oben drauf.
//  - Angriffe gegen Flugzeuge (air) stehen weiter in config/einheiten.js.
//  - Nicht eingetragene Waffen behalten die Werte aus config/einheiten.js.
//
//  Beispiel (nicht aktiv):
//    hflak: {
//      range: [2, 5],
//      soft: { 2: 4, 3: 4, 4: 3, 5: 2 },
//      hard: { 2: 9, 3: 8, 4: 6, 5: 4 },
//    },
// ============================================================================

const RANGE_CONFIG = {

};

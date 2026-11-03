// ============================================================================
//  Hexfront 39–45 – Reichweite, Sicht und Schießen
// ============================================================================
//
//  Werte ändern, Datei speichern, Spiel neu laden – fertig. Bei einem
//  Tippfehler zeigt das Spiel beim Start eine Fehlermeldung.
//
//  Die Reichweite einer Waffe (range) und ihre Angriffswerte (soft, hard, air)
//  stehen bei der Einheit in config/einheiten.js bzw. beim Modell in
//  config/modelle.js. Ebenso dort je Einheit:
//    precision   Treffgenauigkeit auf Entfernung (0–1): mindert den
//                Schadensabfall unten, z. B. 0.5 = halb so stark
//    moveFire    Angriffskraft, wenn die Einheit vor dem Schuss gezogen ist
//                (0–1), z. B. 0.5 = halbe Kraft (Pak nach Stellungswechsel).
//                Ersetzt für diese Einheit den Abzug moveAttackPenalty.
//
//  Hier stehen die Regeln, die für alle Einheiten gelten.
//
//  Zahlenwerte (Anteile, 0.1 = 10 %):
//    falloff           Schadensabfall bei direktem Feuer je Feld über 1 hinaus
//                      (0.15: auf 3 Felder −30 %)
//    falloffIndirect   dasselbe für indirektes Feuer (Artillerie)
//    minMul            Untergrenze: so viel Schaden bleibt mindestens (0.3 = 30 %)
//    moveAttackPenalty Abzug je in diesem Zug gezogenem Feld (0.1 = −10 % je Feld)
//    ambushAttackMul   Angriffskraft einer in einen Hinterhalt geratenen Einheit
//    groundVsAirMul    Angriffskraft von Bodeneinheiten ohne Flak gegen Flugzeuge
//
//  Gelände (Schlüssel: plain, forest, hills, mountain, swamp, water, city, hq):
//    blocksLineOfFire  blockiert direktes Feuer
//    reducesRange      verkürzt die Reichweite bei direktem Feuer um 1 je Feld
//                      auf der Linie (auch das Zielfeld)
//    blocksVision      Bodeneinheiten sehen nicht dahinter (das Feld selbst ist
//                      sichtbar); Flugzeuge sehen darüber hinweg
//
//  Gegen und für Flugzeuge gelten Schadensabfall und Sichtlinie nicht.
// ============================================================================

const RANGE_RULES = {
  falloff: 0.15,
  falloffIndirect: 0.08,
  minMul: 0.3,
  moveAttackPenalty: 0.1,
  ambushAttackMul: 0.4,
  groundVsAirMul: 0.8,

  blocksLineOfFire: ['mountain', 'city', 'hq'],
  reducesRange: ['forest', 'hills'],
  blocksVision: ['mountain'],
};

// ----------------------------------------------------------------------------
//  NOCH NICHT AKTIV: Schaden je Entfernung als Tabelle statt Abfall in Prozent.
//  Je Waffe (Schlüssel wie in config/einheiten.js, z. B. hflak, at, art):
//    range   Reichweite [min, max]; ersetzt range aus config/einheiten.js
//    soft    Schaden gegen weiche Ziele je Entfernung: { Entfernung: Wert, … }
//    hard    Schaden gegen harte Ziele je Entfernung:  { Entfernung: Wert, … }
//  Beispiel:
//    hflak: {
//      range: [2, 5],
//      soft: { 2: 4, 3: 4, 4: 3, 5: 2 },
//      hard: { 2: 9, 3: 8, 4: 6, 5: 4 },
//    },
// ----------------------------------------------------------------------------

const RANGE_CONFIG = {

};

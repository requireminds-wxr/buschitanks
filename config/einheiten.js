// ============================================================================
//  Hexfront 39–45 – Einheiten-Konfiguration
// ============================================================================
//
//  Hier stehen die Grundwerte aller Einheitentypen. Werte ändern, Datei
//  speichern, Spiel im Browser neu laden (bei Bedarf Cmd+Shift+R) – fertig.
//  Ein laufendes Spiel übernimmt die Änderungen erst nach dem Neuladen.
//
//  Nationsboni (z. B. Tiger +1 Angriff, T-34 +1 Bewegung) kommen zusätzlich
//  oben drauf; sie stehen in js/data.js unter NATIONS.
//
//  Regeln für Änderungen:
//  - Die Schlüssel (inf, recon, tank, …) nicht umbenennen, löschen oder neue
//    hinzufügen – Symbole, Icons und KI kennen genau diese elf Typen.
//  - Komma am Zeilenende nicht vergessen. Bei einem Tippfehler zeigt das Spiel
//    beim Start eine Fehlermeldung mit der betroffenen Stelle.
//
//  Attribute:
//    label         Typbezeichnung in der Anzeige
//    moveType      Fortbewegungsart: 'foot' (zu Fuß), 'wheel' (Räder),
//                  'track' (Ketten/Halbketten), 'air' (Luft). Bestimmt die
//                  Geländekosten. Sumpf ist nur für 'foot' passierbar.
//    move          Bewegungspunkte pro Zug
//    soft          Angriff gegen ungepanzerte Ziele (Infanterie, Geschütze)
//    hard          Angriff gegen gepanzerte Ziele (Panzer)
//    air           Angriff gegen Flugzeuge (0 = kann keine Flugzeuge angreifen).
//                  Bodeneinheiten ohne aa wirken gegen Flugzeuge nur mit 80 %.
//    def           Verteidigung
//    armor         Panzerung: 0 = weich, 0.5 = leicht gepanzert, 1 = Panzer.
//                  Mischt soft/hard des Angreifers; Panzer erhalten nur halbe
//                  Geländedeckung.
//    range         Reichweite [min, max] in Feldern, z. B. [2, 5]
//    vision        Sichtweite in Feldern (Nebel des Krieges)
//    cost          Kaufpreis (vor Nationsrabatt/-aufschlag)
//
//  Schalter (true / false):
//    capture       kann Städte und HQ erobern
//    spotter       sieht in Wälder hinein (bis zur vollen Sichtweite)
//    aa            Flak: volle Wirkung gegen Flugzeuge
//    isAir         Flugzeug: ignoriert Gelände und Kontrollzonen
//    noCounter     schlägt nicht zurück und wird nicht erwidert
//    noMoveAndFire darf nicht im selben Zug ziehen und feuern
//    towed         gezogenes Geschütz: braucht ein Transportfahrzeug (move: 0)
//    transport     Transportfahrzeug: lädt genau eine Einheit (gezogen oder transportable)
//    transportable kann von einem Transportfahrzeug mitgenommen werden (Infanterie)
//
//  Geländekosten (Bewegungspunkte je Feld) stehen in js/data.js unter TERRAIN.
//  Auf einer Straße kostet jedes Feld 1 Punkt.
// ============================================================================

const UNIT_CONFIG = {

  truck: {
    label: 'LKW',
    moveType: 'wheel', move: 6,
    soft: 0, hard: 0, air: 0,
    def: 2, armor: 0,
    range: [1, 1], vision: 2, cost: 60,
    transport: true,
  },

  halftrack: {
    label: 'Halbkettenfahrzeug',
    moveType: 'track', move: 5,
    soft: 3, hard: 1, air: 1,
    def: 3, armor: 0.5,
    range: [1, 1], vision: 2, cost: 120,
    transport: true,
  },

  inf: {
    label: 'Infanterie',
    moveType: 'foot', move: 3,
    soft: 6, hard: 2, air: 1,
    def: 5, armor: 0,
    range: [1, 1], vision: 2, cost: 100,
    capture: true, transportable: true,
  },

  recon: {
    label: 'Aufklärung',
    moveType: 'wheel', move: 6,
    soft: 5, hard: 2, air: 3,
    def: 3, armor: 0.5,
    range: [1, 1], vision: 4, cost: 150,
    spotter: true,
  },

  tank: {
    label: 'Panzer',
    moveType: 'track', move: 4,
    soft: 7, hard: 7, air: 1,
    def: 7, armor: 1,
    range: [1, 1], vision: 2, cost: 300,
  },

  heavy: {
    label: 'Schwerer Panzer',
    moveType: 'track', move: 3,
    soft: 8, hard: 10, air: 1,
    def: 10, armor: 1,
    range: [1, 1], vision: 2, cost: 500,
  },

  at: {
    label: 'Panzerabwehr',
    moveType: 'foot', move: 3,
    soft: 2, hard: 9, air: 0,
    def: 5, armor: 0,
    range: [1, 1], vision: 2, cost: 200,
  },

  art: {
    label: 'Artillerie',
    moveType: 'wheel', move: 0,
    soft: 9, hard: 5, air: 0,
    def: 2, armor: 0,
    range: [2, 5], vision: 1, cost: 250,
    noCounter: true, noMoveAndFire: true, towed: true,
  },

  lflak: {
    label: 'Leichte Flak',
    moveType: 'wheel', move: 0,
    soft: 7, hard: 2, air: 9,
    def: 3, armor: 0,
    range: [1, 3], vision: 2, cost: 200,
    aa: true, towed: true,
  },

  hflak: {
    label: 'Schwere Flak',
    moveType: 'wheel', move: 0,
    soft: 4, hard: 9, air: 10,
    def: 4, armor: 0,
    range: [2, 5], vision: 2, cost: 350,
    aa: true, noMoveAndFire: true, towed: true,
  },

  air: {
    label: 'Jagdbomber',
    moveType: 'air', move: 8,
    soft: 7, hard: 6, air: 6,
    def: 4, armor: 0,
    range: [1, 1], vision: 3, cost: 400,
    isAir: true, spotter: true,
  },

};

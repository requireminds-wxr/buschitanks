// ============================================================================
//  Hexfront 39–45 – Einheiten-Konfiguration (Klassen)
// ============================================================================
//
//  Hier stehen die Einheitenklassen mit ihren Grundwerten. Werte ändern, Datei
//  speichern, Spiel im Browser neu laden (bei Bedarf Cmd+Shift+R) – fertig.
//  Ein laufendes Spiel übernimmt die Änderungen erst nach dem Neuladen.
//
//  Zwei Arten von Klassen:
//  - Allgemeine Klassen (Infanterie, Aufklärung, LKW, Halbkette, Pak,
//    Artillerie, Flak) sind direkt baubar. Jede Nation gibt ihnen nur einen
//    eigenen Namen und kleine Abweichungen (config/nationen.js).
//  - Modellklassen (modelsOnly: true – Panzer, Jagdpanzer, Flakpanzer,
//    Flugzeuge) sind nicht direkt baubar. Gebaut werden die konkreten Modelle
//    aus config/modelle.js (z. B. Panzer IV, T-34/85, P-51D). Die Werte hier
//    gelten für ein Modell nur, wenn es selbst keinen Wert angibt.
//
//  Regeln für Änderungen:
//  - Die Schlüssel (inf, recon, tank, …) nicht umbenennen oder löschen – sie
//    bestimmen NATO-Symbol, Silhouette und KI-Verhalten.
//  - Komma am Zeilenende nicht vergessen. Bei einem Tippfehler zeigt das Spiel
//    beim Start eine Fehlermeldung mit der betroffenen Stelle.
//
//  Attribute:
//    class         Einheitenklasse, hier immer gleich dem Schlüssel
//    label         Klassenbezeichnung in der Anzeige
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
//    towed         gezogen (true) oder selbstfahrend (false). Gezogene Einheiten
//                  können von einem Transportfahrzeug geladen werden; mit
//                  move: 0 bewegen sie sich nur so.
//    fire          Feuerart:
//                  'direct'   direktes Feuer – braucht freie Sicht aufs Ziel: Gebirge,
//                             Städte (auch HQ) und (sichtbare) Bodeneinheiten
//                             zwischen Schütze und Ziel blockieren den Schuss. Jedes
//                             Wald- oder Hügelfeld auf der Linie – auch das Feld des
//                             Ziels – verkürzt die Reichweite um 1 (Nachbarfeld geht
//                             immer). Gegen Flugzeuge und für Flugzeuge gilt das nicht.
//                  'indirect' indirektes Feuer (Steilfeuer) – trifft auch über
//                             Einheiten, Städte, Gebirge und Wald hinweg.
//    range         Feuerentfernung [min, max] in Feldern, gezählt vom Feld des
//                  Schützen bis zum Feld des Ziels: 1 = Nachbarfeld (kein Feld
//                  dazwischen), 3 = zwei Felder dazwischen.
//    vision        Sichtweite in Feldern (Nebel des Krieges)
//    cost          Kaufpreis
//
//  Weitere Schalter (true / false, fehlend = false):
//    modelsOnly    nur über Modelle aus config/modelle.js baubar
//    capture       kann Städte und HQ erobern
//    spotter       sieht in Wälder hinein (bis zur vollen Sichtweite)
//    aa            Flak: volle Wirkung gegen Flugzeuge
//    isAir         Flugzeug: ignoriert Gelände und Kontrollzonen
//    noCounter     schlägt nicht zurück und wird nicht erwidert
//    noMoveAndFire darf nicht im selben Zug ziehen und feuern
//    transport     Transportfahrzeug: lädt genau eine Einheit (gezogen oder transportable)
//    transportable kann von einem Transportfahrzeug mitgenommen werden (Infanterie)
//
//  Geländekosten (Bewegungspunkte je Feld) stehen in js/data.js unter TERRAIN.
//  Auf einer Straße kostet jedes Feld 1 Punkt.
// ============================================================================

const UNIT_CONFIG = {

  inf: {
    class: 'inf',
    label: 'Infanterie',
    moveType: 'foot', move: 3,
    soft: 3, hard: 1, air: 1,
    def: 5, armor: 0,
    towed: false, fire: 'direct', range: [1, 1],
    vision: 2, cost: 100,
    capture: true, transportable: true,
  },

  recon: {
    class: 'recon',
    label: 'Aufklärung',
    moveType: 'wheel', move: 6,
    soft: 5, hard: 2, air: 2,
    def: 3, armor: 0.5,
    towed: false, fire: 'direct', range: [1, 1],
    vision: 4, cost: 150,
    spotter: true,
  },

  truck: {
    class: 'truck',
    label: 'LKW',
    moveType: 'wheel', move: 6,
    soft: 0, hard: 0, air: 0,
    def: 2, armor: 0,
    towed: false, fire: 'direct', range: [1, 1],
    vision: 2, cost: 60,
    transport: true,
  },

  halftrack: {
    class: 'halftrack',
    label: 'Halbkettenfahrzeug',
    moveType: 'track', move: 5,
    soft: 3, hard: 1, air: 1,
    def: 3, armor: 0.5,
    towed: false, fire: 'direct', range: [1, 1],
    vision: 2, cost: 120,
    transport: true,
  },

  light: {
    class: 'light',
    label: 'Leichter Panzer',
    moveType: 'track', move: 6,
    soft: 3, hard: 4, air: 1,
    def: 4, armor: 1,
    towed: false, fire: 'direct', range: [1, 1],
    vision: 2, cost: 180,
    modelsOnly: true,
  },

  tank: {
    class: 'tank',
    label: 'Mittlerer Panzer',
    moveType: 'track', move: 5,
    soft: 4, hard: 7, air: 1,
    def: 7, armor: 1,
    towed: false, fire: 'direct', range: [1, 1],
    vision: 2, cost: 300,
    modelsOnly: true,
  },

  heavy: {
    class: 'heavy',
    label: 'Schwerer Panzer',
    moveType: 'track', move: 3,
    soft: 4, hard: 14, air: 1,
    def: 10, armor: 1,
    towed: false, fire: 'direct', range: [1, 1],
    vision: 2, cost: 500,
    modelsOnly: true,
  },

  td: {
    class: 'td',
    label: 'Jagdpanzer',
    moveType: 'track', move: 4,
    soft: 2, hard: 12, air: 0,
    def: 7, armor: 1,
    towed: false, fire: 'direct', range: [1, 2],
    vision: 2, cost: 350,
    modelsOnly: true,
  },

  at: {
    class: 'at',
    label: 'Panzerabwehr',
    moveType: 'foot', move: 3,
    soft: 2, hard: 12, air: 0,
    def: 5, armor: 0,
    towed: true, fire: 'direct', range: [1, 3],
    vision: 3, cost: 200,
    noCounter: true, noMoveAndFire: true,
  },

  art: {
    class: 'art',
    label: 'Artillerie',
    moveType: 'wheel', move: 4,
    soft: 12, hard: 4, air: 0,
    def: 2, armor: 0,
    towed: false, fire: 'indirect', range: [2, 3],
    vision: 1, cost: 250,
    noCounter: true, noMoveAndFire: true,
  },

  lflak: {
    class: 'lflak',
    label: 'Leichte Flak',
    moveType: 'wheel', move: 7,
    soft: 10, hard: 2, air: 10,
    def: 3, armor: 0,
    towed: false, fire: 'direct', range: [1, 2],
    vision: 2, cost: 200,
    aa: true,
  },

  hflak: {
    class: 'hflak',
    label: 'Schwere Flak',
    moveType: 'wheel', move: 2,
    soft: 1, hard: 10, air: 12,
    def: 4, armor: 0,
    towed: false, fire: 'direct', range: [2, 3],
    vision: 2, cost: 350,
    aa: true, noMoveAndFire: true,
  },

  spaa: {
    class: 'spaa',
    label: 'Flakpanzer',
    moveType: 'track', move: 5,
    soft: 8, hard: 2, air: 10,
    def: 4, armor: 0.5,
    towed: false, fire: 'direct', range: [1, 2],
    vision: 2, cost: 250,
    aa: true, modelsOnly: true,
  },

  fighter: {
    class: 'fighter',
    label: 'Jagdflugzeug',
    moveType: 'air', move: 9,
    soft: 3, hard: 1, air: 9,
    def: 4, armor: 0,
    towed: false, fire: 'direct', range: [1, 1],
    vision: 3, cost: 320,
    isAir: true, spotter: true, modelsOnly: true,
  },

  attack: {
    class: 'attack',
    label: 'Schlachtflugzeug',
    moveType: 'air', move: 8,
    soft: 7, hard: 6, air: 4,
    def: 4, armor: 0,
    towed: false, fire: 'direct', range: [1, 1],
    vision: 3, cost: 380,
    isAir: true, spotter: true, modelsOnly: true,
  },

};

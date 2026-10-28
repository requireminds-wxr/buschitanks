// ============================================================================
//  Hexfront 39–45 – Einheiten-Konfiguration
// ============================================================================
//
//  Hier stehen die Grundwerte aller Einheitentypen. Werte ändern, Datei
//  speichern, Spiel im Browser neu laden (bei Bedarf Cmd+Shift+R) – fertig.
//  Ein laufendes Spiel übernimmt die Änderungen erst nach dem Neuladen.
//
//  Die Abweichungen der Nationen (z. B. Tiger +2 Angriff, T-34 +1 Bewegung)
//  kommen zusätzlich oben drauf; sie stehen in config/nationen.js.
//
//  Aufbau: Jeder Eintrag ist ein Modell (Schlüssel, z. B. tank) und gehört zu
//  einer generischen Einheitenklasse (class). Die Klasse bestimmt NATO-Symbol,
//  Silhouette und KI-Verhalten; das Modell bestimmt die Werte. Vorbereitet für
//  später: weitere Modelle derselben Klasse mit eigenen Werten, z. B.
//  pz4 und panther (class: 'tank') oder art75, art105, art150 (class: 'art'),
//  auch je Nation.
//
//  Regeln für Änderungen:
//  - Die Schlüssel (inf, recon, tank, …) nicht umbenennen, löschen oder neue
//    hinzufügen – weitere Modelle werden erst in einem späteren Schritt
//    freigeschaltet.
//  - Komma am Zeilenende nicht vergessen. Bei einem Tippfehler zeigt das Spiel
//    beim Start eine Fehlermeldung mit der betroffenen Stelle.
//
//  Attribute:
//    class         Einheitenklasse (generischer Schlüssel):
//                    inf (Infanterie), recon (Aufklärung), truck (LKW),
//                    halftrack (Halbkettenfahrzeug), tank (mittlerer Panzer),
//                    heavy (schwerer Panzer), at (Panzerabwehr),
//                    art (Artillerie), lflak (leichte Flak),
//                    hflak (schwere Flak), air (Flugzeug)
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
//    towed         gezogen (true) oder selbstfahrend (false). Gezogene Einheiten
//                  bewegen sich nur mit einem Transportfahrzeug (move: 0).
//    fire          Feuerart:
//                  'direct'   direktes Feuer – braucht freies Schussfeld: Auf den
//                             Feldern zwischen Schütze und Ziel darf keine
//                             (sichtbare) Bodeneinheit stehen und kein Gebirge
//                             liegen. Gegen Flugzeuge und für Flugzeuge gilt das nicht.
//                  'indirect' indirektes Feuer (Steilfeuer) – trifft auch über
//                             eigene oder gegnerische Einheiten und Gebirge hinweg.
//    range         Feuerentfernung [min, max] in Feldern, gezählt vom Feld des
//                  Schützen bis zum Feld des Ziels: 1 = Nachbarfeld (kein Feld
//                  dazwischen), 3 = zwei Felder dazwischen. Beispiel [2, 5]:
//                  nicht auf Nachbarfelder, höchstens 4 Felder dazwischen.
//    vision        Sichtweite in Feldern (Nebel des Krieges)
//    cost          Kaufpreis (vor Nationsrabatt/-aufschlag)
//
//  Weitere Schalter (true / false, fehlend = false):
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

  tank: {
    class: 'tank',
    label: 'Panzer',
    moveType: 'track', move: 5,
    soft: 4, hard: 7, air: 1,
    def: 7, armor: 1,
    towed: false, fire: 'direct', range: [1, 1],
    vision: 2, cost: 300,
  },

  heavy: {
    class: 'heavy',
    label: 'Schwerer Panzer',
    moveType: 'track', move: 3,
    soft: 4, hard: 14, air: 1,
    def: 10, armor: 1,
    towed: false, fire: 'direct', range: [1, 1],
    vision: 2, cost: 500,
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

  air: {
    class: 'air',
    label: 'Jagdbomber',
    moveType: 'air', move: 8,
    soft: 7, hard: 6, air: 6,
    def: 4, armor: 0,
    towed: false, fire: 'direct', range: [1, 1],
    vision: 3, cost: 400,
    isAir: true, spotter: true,
  },

};

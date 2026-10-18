// ============================================================================
//  Hexfront 39–45 – Gelände und Mobilität
// ============================================================================
//
//  NOCH NICHT AKTIV: Diese Datei ist vorbereitet, aber noch leer und wird vom
//  Spiel noch nicht geladen. Bis dahin gelten die Geländewerte aus js/data.js
//  (TERRAIN, ROAD_COST).
//
//  Idee: Hier steht, wie stark jedes Gelände die Bewegung bremst – getrennt
//  nach Fortbewegungsart.
//
//  Geländearten (Schlüssel): plain (Ebene), forest (Wald), hills (Hügel),
//  mountain (Gebirge), swamp (Sumpf), water (Wasser), city (Stadt),
//  hq (Hauptquartier), road (Straße – gilt für jedes Feld mit Straße).
//
//  Attribute je Geländeart:
//    cost          Bewegungspunkte je Feld je Fortbewegungsart:
//                  { foot, wheel, track, air }   99 = unpassierbar
//    def           Deckungsbonus auf die Verteidigung (optional)
//
//  Beispiel (nicht aktiv):
//    forest: {
//      cost: { foot: 1, wheel: 3, track: 2, air: 1 },
//      def: 2,
//    },
// ============================================================================

const TERRAIN_CONFIG = {

};

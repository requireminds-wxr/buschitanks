// ============================================================================
//  Hexfront 39–45 – Beschusswirkung
// ============================================================================
//
//  NOCH NICHT AKTIV: Diese Datei ist vorbereitet, aber noch leer und wird vom
//  Spiel noch nicht geladen. Bis dahin gelten die Kampfregeln aus js/game.js.
//
//  Idee: Hier steht, was ein Treffer beim Ziel zusätzlich zum Stärkeverlust
//  auslöst, je angreifendem Einheitentyp (Schlüssel wie in config/einheiten.js).
//
//  Attribute je Einheitentyp (Vorschläge, werden beim Aktivieren festgelegt):
//    suppress      Niederhalten: Angriffsverlust des Ziels bis zum nächsten
//                  eigenen Zug, z. B. 0.2 = −20 %
//    pin           Ziel kann im nächsten Zug nicht ziehen (true/false)
//    vsSoft        Schadensfaktor gegen ungepanzerte Ziele, z. B. 1.2
//    vsHard        Schadensfaktor gegen gepanzerte Ziele, z. B. 0.8
//    counterMul    Faktor für das Zurückschlagen des Ziels, z. B. 0.5
//
//  Beispiel (nicht aktiv):
//    art: {
//      suppress: 0.2,
//      pin: false,
//    },
// ============================================================================

const SHOT_CONFIG = {

};

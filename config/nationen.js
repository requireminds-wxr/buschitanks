// ============================================================================
//  Hexfront 39–45 – Nationen-Konfiguration
// ============================================================================
//
//  Hier stehen die sechs Nationen: Namen, Farben, Wirtschaft, Einheitennamen
//  und die Abweichungen ihrer Einheiten von den Grundwerten aus
//  config/einheiten.js. Werte ändern, speichern, Spiel neu laden – fertig.
//
//  Regeln für Änderungen:
//  - Die Schlüssel (de, it, jp, us, uk, su) nicht umbenennen oder löschen.
//  - Komma am Zeilenende nicht vergessen. Bei einem Tippfehler zeigt das Spiel
//    beim Start eine Fehlermeldung mit der betroffenen Stelle.
//
//  Attribute:
//    name, short   voller und kurzer Name
//    side          'axis' (Achsenmächte) oder 'allies' (Alliierte)
//    color, dark, text   Farben des Spielsteins (Grund, Rand, Schrift) als '#rrggbb'
//    costMul       Preisfaktor für alle Einheiten, z. B. 0.9 = 10 % billiger
//    incomeMul     Einkommensfaktor, z. B. 1.25 = 25 % mehr Einkommen
//    bonus         Beschreibung im Startbildschirm (wird nicht ausgewertet –
//                  bei Änderungen an mods bitte von Hand anpassen)
//    units         Name jeder Einheit dieser Nation
//    mods          Abweichungen je Einheitentyp, werden zu den Grundwerten addiert:
//                    soft, hard, air, def, move   z. B. hard: -3
//                    costMul        Preisfaktor nur für diesen Typ, z. B. 1.2
//                    moveType       ersetzt die Fortbewegungsart, z. B. 'track'
//                    towed          ersetzt den Schalter „gezogen“ (true/false)
//                  Ergebnisse unter 0 werden als 0 gewertet.
//
//  Die Abweichungen orientieren sich an der historischen Ausrüstung:
//  Durchschlag der Kanone → hard, Frontpanzerung → def, Tempo → move.
// ============================================================================

const NATION_CONFIG = {

  de: {
    name: 'Deutsches Reich', short: 'Deutschland', side: 'axis',
    color: '#7b828b', dark: '#2a2e33', text: '#f2f2f2',
    costMul: 1.05, incomeMul: 1,
    bonus: 'Qualität: Panzer IV, Tiger, Pak 40 und Acht-Acht stärker, Puma mit 5-cm-Kanone, Stuka als Panzerknacker – dafür alles 5 % teurer.',
    units: { inf: 'Grenadiere', recon: 'Sd.Kfz. 234 Puma', truck: 'Opel Blitz', halftrack: 'Sd.Kfz. 7', tank: 'Panzer IV', heavy: 'Tiger I', at: 'Pak 40', art: 'leFH 18', lflak: 'Flak 38 (2 cm)', hflak: 'Flak 36 (8,8 cm)', air: 'Ju 87 Stuka' },
    mods: {
      recon: { hard: 3 },
      tank:  { soft: 1, hard: 1, def: 1 },
      heavy: { soft: 2, hard: 2, def: 2 },
      at:    { hard: 1 },
      hflak: { hard: 1 },
      air:   { hard: 2, air: -2 },
    },
  },

  it: {
    name: 'Königreich Italien', short: 'Italien', side: 'axis',
    color: '#3f6ea8', dark: '#1a2c44', text: '#f2f2f2',
    costMul: 0.85, incomeMul: 1,
    bonus: 'Günstig, aber leicht: 15 % billiger, P26/40 +1 Bewegung, starke 90/53-Flak und G.55-Jäger; Panzer und 47/32-Pak schwach gepanzert und bewaffnet.',
    units: { inf: 'Fanteria', recon: 'AB 41', truck: 'Fiat 626', halftrack: 'Breda 61', tank: 'M13/40', heavy: 'P26/40', at: 'Cannone 47/32', art: 'Obice 75/18', lflak: 'Breda 20/65', hflak: 'Cannone 90/53', air: 'Fiat G.55' },
    mods: {
      recon: { hard: 1 },
      tank:  { hard: -3, def: -2 },
      heavy: { hard: -3, def: -3, move: 1 },
      at:    { hard: -4 },
      hflak: { hard: 1 },
      air:   { soft: -2, hard: -3, air: 2 },
    },
  },

  jp: {
    name: 'Kaiserreich Japan', short: 'Japan', side: 'axis',
    color: '#d3b043', dark: '#4a3c12', text: '#1d1a10',
    costMul: 1, incomeMul: 1,
    bonus: 'Banzai: Infanterie +2 Angriff, Zero als schneller Jäger, Chi-He +1 Bewegung; Panzer, Pak und Te-Ke schwach.',
    units: { inf: 'Infanterie (IJA)', recon: 'Typ 97 Te-Ke', truck: 'Isuzu Typ 94', halftrack: 'Typ 1 Ho-Ha', tank: 'Typ 97 Chi-Ha', heavy: 'Typ 1 Chi-He', at: 'Typ 1 47-mm-Pak', art: 'Typ 91 Haubitze', lflak: 'Typ 98 20-mm-Flak', hflak: 'Typ 88 75-mm-Flak', air: 'A6M Zero' },
    mods: {
      inf:   { soft: 2 },
      recon: { move: -2 },
      tank:  { hard: -2, def: -2 },
      heavy: { hard: -4, def: -3, move: 1 },
      at:    { hard: -3 },
      hflak: { hard: -1 },
      air:   { soft: -2, hard: -3, air: 2, move: 1 },
    },
  },

  us: {
    name: 'Vereinigte Staaten', short: 'USA', side: 'allies',
    color: '#5f6b2f', dark: '#23280f', text: '#f2f2f2',
    costMul: 1, incomeMul: 1.25,
    bonus: 'Arsenal der Demokratie: +25 % Einkommen, Sherman und Pershing +1 Bewegung, starke P-47 und Artillerie, M16 fährt selbst.',
    units: { inf: 'GI-Infanterie', recon: 'M8 Greyhound', truck: 'GMC CCKW', halftrack: 'M3 Halbkette', tank: 'M4 Sherman', heavy: 'M26 Pershing', at: '57-mm-Pak M1', art: 'M2A1 Haubitze', lflak: 'M16 Flakpanzer', hflak: '90-mm-Flak M1', air: 'P-47 Thunderbolt' },
    mods: {
      recon: { hard: 2 },
      tank:  { move: 1 },
      heavy: { hard: 1, move: 1 },
      at:    { hard: -1 },
      art:   { soft: 1 },
      lflak: { soft: 2, hard: -1, move: 5, moveType: 'track', towed: false },
      hflak: { hard: 1 },
      air:   { hard: 1, def: 1 },
    },
  },

  uk: {
    name: 'Vereinigtes Königreich', short: 'Großbritannien', side: 'allies',
    color: '#9a7448', dark: '#3a2a16', text: '#f7f0e4',
    costMul: 1, incomeMul: 1,
    bonus: 'Bulldogge: Infanterie +1 Verteidigung, Churchill sehr stark gepanzert, Cromwell +1 Bewegung, Artillerie, Flak und Typhoon stärker.',
    units: { inf: 'Infanterie', recon: 'Daimler Armoured Car', truck: 'Bedford QL', halftrack: 'M5 Halbkette', tank: 'Cromwell', heavy: 'Churchill', at: '6-Pfünder-Pak', art: '25-Pfünder', lflak: 'Bofors 40 mm', hflak: 'QF 3,7 Zoll', air: 'Hawker Typhoon' },
    mods: {
      inf:   { def: 1 },
      recon: { hard: 2 },
      tank:  { move: 1 },
      heavy: { hard: -3, def: 2 },
      art:   { soft: 1, hard: 1 },
      lflak: { hard: 1, air: 1 },
      hflak: { air: 1 },
      air:   { soft: 1, hard: 1, air: -1 },
    },
  },

  su: {
    name: 'Sowjetunion', short: 'Sowjetunion', side: 'allies',
    color: '#a33d2c', dark: '#3d130c', text: '#f7ece8',
    costMul: 0.9, incomeMul: 1,
    bonus: 'Masse: alles 10 % billiger, Infanterie 30 % billiger, T-34 +1 Bewegung, IS-2 und Il-2 schwer gepanzert; BA-64 nur mit MG.',
    units: { inf: 'Schützen', recon: 'BA-64', truck: 'GAZ-AA', halftrack: 'Komsomolez', tank: 'T-34/76', heavy: 'IS-2', at: 'ZiS-3', art: 'M-30 Haubitze', lflak: '61-K (37 mm)', hflak: '52-K (85 mm)', air: 'Il-2 Sturmowik' },
    mods: {
      inf:   { costMul: 0.7 },
      recon: { hard: -1 },
      tank:  { move: 1 },
      heavy: { soft: 2, hard: 1, def: 1 },
      at:    { soft: 2, hard: -1 },
      art:   { soft: 1 },
      air:   { soft: 1, def: 2, air: -3 },
    },
  },

};

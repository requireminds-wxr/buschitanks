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
//                  (Standard 1 – der Ausgleich läuft über die Preise je Modell)
//    incomeMul     Einkommensfaktor, z. B. 1.25 = 25 % mehr Einkommen (Standard 1)
//    bonus         Beschreibung im Startbildschirm (wird nicht ausgewertet –
//                  bei Änderungen an mods bitte von Hand anpassen)
//    units         Name der allgemeinen Einheiten dieser Nation (Infanterie, Pak,
//                  Artillerie, schwere Flak, Fahrzeuge). Panzer, Jagdpanzer, mobile Flak, Flakpanzer
//                  und Flugzeuge stehen als eigene Modelle in config/modelle.js.
//    mods          Abweichungen je allgemeiner Klasse, werden zu den Grundwerten addiert:
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
    costMul: 1, incomeMul: 1,
    bonus: 'Qualität: Pak 40 und Acht-Acht stärker, Puma mit 5-cm-Kanone; Panzer von Panzer II bis Tiger II, Flugzeuge von Bf 109 bis Fw 190.',
    units: { inf: 'Grenadiere', recon: 'Sd.Kfz. 234 Puma', truck: 'Opel Blitz', halftrack: 'Sd.Kfz. 7', at: 'Pak 40', art: 'leFH 18', hflak: 'Flak 36 (8,8 cm)' },
    mods: {
      recon: { hard: 3 },
      at:    { hard: 1 },
      hflak: { hard: 1 },
    },
  },

  it: {
    name: 'Königreich Italien', short: 'Italien', side: 'axis',
    color: '#3f6ea8', dark: '#1a2c44', text: '#f2f2f2',
    costMul: 1, incomeMul: 1,
    bonus: 'Leichte Ausrüstung: 47/32-Pak schwach, starke 90/53-Flak; Panzer von L3/35 bis P26/40, Jäger von CR.42 bis G.55.',
    units: { inf: 'Fanteria', recon: 'AB 41', truck: 'Fiat 626', halftrack: 'Breda 61', at: 'Cannone 47/32', art: 'Obice 75/18', hflak: 'Cannone 90/53' },
    mods: {
      recon: { hard: 1 },
      at:    { hard: -4 },
      hflak: { hard: 1 },
    },
  },

  jp: {
    name: 'Kaiserreich Japan', short: 'Japan', side: 'axis',
    color: '#d3b043', dark: '#4a3c12', text: '#1d1a10',
    costMul: 1, incomeMul: 1,
    bonus: 'Banzai: Infanterie +2 Angriff, Pak schwach; leichte Panzer von Ha-Go bis Chi-Nu, wendige Jäger von Zero bis Ki-84.',
    units: { inf: 'Infanterie (IJA)', recon: 'Typ 97 Te-Ke', truck: 'Isuzu Typ 94', halftrack: 'Typ 1 Ho-Ha', at: 'Typ 1 47-mm-Pak', art: 'Typ 91 Haubitze', hflak: 'Typ 88 75-mm-Flak' },
    mods: {
      inf:   { soft: 2 },
      recon: { move: -2 },
      at:    { hard: -3 },
      hflak: { hard: -1 },
    },
  },

  us: {
    name: 'Vereinigte Staaten', short: 'USA', side: 'allies',
    color: '#5f6b2f', dark: '#23280f', text: '#f2f2f2',
    costMul: 1, incomeMul: 1,
    bonus: 'Arsenal der Demokratie: starke Artillerie und Aufklärer; Panzer von Stuart bis Pershing, Flugzeuge von P-40 bis P-51D.',
    units: { inf: 'GI-Infanterie', recon: 'M8 Greyhound', truck: 'GMC CCKW', halftrack: 'M3 Halbkette', at: '57-mm-Pak M1', art: 'M2A1 Haubitze', hflak: '90-mm-Flak M1' },
    mods: {
      recon: { hard: 2 },
      at:    { hard: -1 },
      art:   { soft: 1 },
      hflak: { hard: 1 },
    },
  },

  uk: {
    name: 'Vereinigtes Königreich', short: 'Großbritannien', side: 'allies',
    color: '#9a7448', dark: '#3a2a16', text: '#f7f0e4',
    costMul: 1, incomeMul: 1,
    bonus: 'Bulldogge: Infanterie +1 Verteidigung, Artillerie und Flak stärker; Panzer von Matilda bis Comet, Flugzeuge von Hurricane bis Typhoon.',
    units: { inf: 'Infanterie', recon: 'Daimler Armoured Car', truck: 'Bedford QL', halftrack: 'M5 Halbkette', at: '6-Pfünder-Pak', art: '25-Pfünder', hflak: 'QF 3,7 Zoll' },
    mods: {
      inf:   { def: 1 },
      recon: { hard: 2 },
      art:   { soft: 1, hard: 1 },
      hflak: { air: 1 },
    },
  },

  su: {
    name: 'Sowjetunion', short: 'Sowjetunion', side: 'allies',
    color: '#a33d2c', dark: '#3d130c', text: '#f7ece8',
    costMul: 1, incomeMul: 1,
    bonus: 'Masse: Infanterie 30 % billiger, starke Haubitzen; Panzer von T-26 bis IS-2, Flugzeuge von I-16 bis La-7.',
    units: { inf: 'Schützen', recon: 'BA-64', truck: 'GAZ-AA', halftrack: 'Komsomolez', at: 'ZiS-3', art: 'M-30 Haubitze', hflak: '52-K (85 mm)' },
    mods: {
      inf:   { costMul: 0.7 },
      recon: { hard: -1 },
      at:    { soft: 2, hard: -1 },
      art:   { soft: 1 },
    },
  },

};

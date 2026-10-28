// ============================================================================
//  Hexfront 39–45 – Epochen und Modelle
// ============================================================================
//
//  Werte ändern, Datei speichern, Spiel neu laden – fertig.
//
//  EPOCHEN (ERA_CONFIG): Das Spiel läuft durch drei Epochen. Ab der genannten
//  Runde sind die Modelle der neuen Epoche baubar – für beide Seiten
//  gleichzeitig. So treffen nur Fahrzeuge und Flugzeuge aufeinander, die zur
//  selben Zeit im Einsatz waren. Bereits gebaute Einheiten bleiben im Spiel.
//    key       interner Name ('early', 'mid', 'late')
//    name      Anzeige, z. B. '1942–43'
//    fromTurn  ab dieser Runde gilt die Epoche (die erste muss 1 sein)
//
//  MODELLE (MODEL_CONFIG): konkrete Panzer, Jagdpanzer, Flakpanzer und
//  Flugzeuge je Nation. Schlüssel frei wählbar, aber eindeutig (z. B. de_panther).
//    nation    'de', 'it', 'jp', 'us', 'uk' oder 'su'
//    class     Einheitenklasse aus config/einheiten.js:
//                light (leichter Panzer), tank (mittlerer Panzer),
//                heavy (schwerer Panzer), td (Jagdpanzer/Sturmgeschütz),
//                spaa (Flakpanzer), fighter (Jagdflugzeug),
//                attack (Schlachtflugzeug/Sturzkampfbomber)
//    name      Anzeigename
//    eras      Epochen, in denen das Modell gebaut werden kann, z. B. ['mid', 'late']
//    sprite    optional: Grafik einer anderen Klasse verwenden, z. B. 'halftrack'
//    Werte     move, soft, hard, air, def, armor, range, vision, cost, moveType,
//              fire, towed und alle Schalter wie in config/einheiten.js. Fehlt
//              ein Wert, gilt der Wert der Klasse.
//
//  Anhaltspunkte für die Werte (historische Daten, gerundet):
//    hard  ≈ Durchschlag der Kanone auf 500 m in cm (100 mm → 10)
//    def   ≈ wirksame Frontpanzerung (30 mm → 3, 80 mm → 7, 150 mm → 13)
//    soft  ≈ Sprengwirkung (kurze 7,5 cm → 6, 12,2 cm → 8)
//    range 1 = kurze Kanone, [1, 2] = lange Kanone, [1, 3] = sehr lange Kanone
//          (8,8 cm, 7,5 cm L/70, 17-Pfünder, 90 mm, 100 mm, 122 mm)
//    air   bei Flugzeugen: Luftkampfstärke
// ============================================================================

const ERA_CONFIG = [
  { key: 'early', name: '1939–41', fromTurn: 1 },
  { key: 'mid',   name: '1942–43', fromTurn: 9 },
  { key: 'late',  name: '1944–45', fromTurn: 17 },
];

const MODEL_CONFIG = {

  // ---------- Deutschland ----------
  de_pz2: { nation: 'de', class: 'light', name: 'Panzer II', eras: ['early'],
    move: 6, soft: 3, hard: 3, air: 1, def: 3, armor: 1, range: [1, 1], cost: 200 },
  de_pz3: { nation: 'de', class: 'tank', name: 'Panzer III F', eras: ['early'],
    move: 5, soft: 4, hard: 5, air: 1, def: 4, armor: 1, range: [1, 1], cost: 240 },
  de_pz4d: { nation: 'de', class: 'tank', name: 'Panzer IV D', eras: ['early'],
    move: 5, soft: 6, hard: 4, air: 1, def: 4, armor: 1, range: [1, 1], cost: 240 },
  de_pzjg1: { nation: 'de', class: 'td', name: 'Panzerjäger I', eras: ['early'],
    move: 5, soft: 2, hard: 6, air: 0, def: 2, armor: 0.5, range: [1, 2], cost: 240 },
  de_pz3m: { nation: 'de', class: 'tank', name: 'Panzer III M', eras: ['mid'],
    move: 5, soft: 4, hard: 6, air: 1, def: 6, armor: 1, range: [1, 2], cost: 320 },
  de_pz4h: { nation: 'de', class: 'tank', name: 'Panzer IV H', eras: ['mid', 'late'],
    move: 5, soft: 5, hard: 9, air: 1, def: 7, armor: 1, range: [1, 2], cost: 400 },
  de_tiger: { nation: 'de', class: 'heavy', name: 'Tiger I', eras: ['mid', 'late'],
    move: 3, soft: 6, hard: 12, air: 1, def: 10, armor: 1, range: [1, 3], cost: 490 },
  de_stug: { nation: 'de', class: 'td', name: 'StuG III G', eras: ['mid', 'late'],
    move: 4, soft: 5, hard: 9, air: 0, def: 7, armor: 1, range: [1, 2], cost: 380 },
  de_panther: { nation: 'de', class: 'tank', name: 'Panther', eras: ['late'],
    move: 5, soft: 5, hard: 14, air: 1, def: 11, armor: 1, range: [1, 3], cost: 560 },
  de_tiger2: { nation: 'de', class: 'heavy', name: 'Tiger II', eras: ['late'],
    move: 3, soft: 6, hard: 17, air: 1, def: 14, armor: 1, range: [1, 3], cost: 620 },
  de_jagdpanther: { nation: 'de', class: 'td', name: 'Jagdpanther', eras: ['late'],
    move: 4, soft: 5, hard: 17, air: 0, def: 11, armor: 1, range: [1, 3], cost: 580 },
  de_wirbelwind: { nation: 'de', class: 'spaa', name: 'Wirbelwind', eras: ['late'],
    move: 5, soft: 8, hard: 2, air: 10, def: 5, armor: 1, range: [1, 2], cost: 360 },
  de_bf109e: { nation: 'de', class: 'fighter', name: 'Bf 109 E', eras: ['early'],
    move: 9, soft: 2, hard: 1, air: 8, def: 4, cost: 290 },
  de_ju87b: { nation: 'de', class: 'attack', name: 'Ju 87 B Stuka', eras: ['early'],
    move: 7, soft: 8, hard: 5, air: 2, def: 3, cost: 280 },
  de_bf109g: { nation: 'de', class: 'fighter', name: 'Bf 109 G', eras: ['mid'],
    move: 10, soft: 2, hard: 1, air: 9, def: 4, cost: 350 },
  de_fw190a: { nation: 'de', class: 'fighter', name: 'Fw 190 A', eras: ['mid'],
    move: 9, soft: 4, hard: 2, air: 10, def: 5, cost: 420 },
  de_ju87g: { nation: 'de', class: 'attack', name: 'Ju 87 G Stuka', eras: ['mid'],
    move: 7, soft: 4, hard: 10, air: 1, def: 3, cost: 300 },
  de_fw190d: { nation: 'de', class: 'fighter', name: 'Fw 190 D-9', eras: ['late'],
    move: 10, soft: 4, hard: 2, air: 11, def: 5, cost: 440 },
  de_fw190f: { nation: 'de', class: 'attack', name: 'Fw 190 F', eras: ['late'],
    move: 9, soft: 8, hard: 7, air: 6, def: 5, cost: 470 },

  // ---------- Italien ----------
  it_l335: { nation: 'it', class: 'light', name: 'L3/35', eras: ['early'],
    move: 6, soft: 3, hard: 1, air: 1, def: 2, armor: 0.5, range: [1, 1], cost: 140 },
  it_m1139: { nation: 'it', class: 'tank', name: 'M11/39', eras: ['early'],
    move: 4, soft: 2, hard: 4, air: 1, def: 3, armor: 1, range: [1, 1], cost: 160 },
  it_m1340: { nation: 'it', class: 'tank', name: 'M13/40', eras: ['early', 'mid'],
    move: 4, soft: 3, hard: 4, air: 1, def: 3, armor: 1, range: [1, 1], cost: 170 },
  it_m1441: { nation: 'it', class: 'tank', name: 'M14/41', eras: ['mid'],
    move: 4, soft: 3, hard: 4, air: 1, def: 3, armor: 1, range: [1, 1], cost: 180 },
  it_m1542: { nation: 'it', class: 'tank', name: 'M15/42', eras: ['mid'],
    move: 4, soft: 3, hard: 5, air: 1, def: 4, armor: 1, range: [1, 1], cost: 200 },
  it_sem7518: { nation: 'it', class: 'td', name: 'Semovente 75/18', eras: ['mid'],
    move: 4, soft: 7, hard: 5, air: 0, def: 5, armor: 1, range: [1, 1], cost: 240 },
  it_p26: { nation: 'it', class: 'heavy', name: 'P26/40', eras: ['late'],
    move: 4, soft: 5, hard: 7, air: 1, def: 6, armor: 1, range: [1, 2], cost: 290 },
  it_sem7546: { nation: 'it', class: 'td', name: 'Semovente 75/46', eras: ['late'],
    move: 4, soft: 4, hard: 9, air: 0, def: 7, armor: 1, range: [1, 2], cost: 320 },
  it_cr42: { nation: 'it', class: 'fighter', name: 'Fiat CR.42', eras: ['early'],
    move: 8, soft: 2, hard: 1, air: 5, def: 3, cost: 190 },
  it_g50: { nation: 'it', class: 'fighter', name: 'Fiat G.50', eras: ['early'],
    move: 9, soft: 2, hard: 1, air: 6, def: 4, cost: 220 },
  it_mc202: { nation: 'it', class: 'fighter', name: 'Macchi MC.202', eras: ['mid'],
    move: 10, soft: 2, hard: 1, air: 9, def: 4, cost: 320 },
  it_ju87: { nation: 'it', class: 'attack', name: 'Ju 87 Picchiatello', eras: ['mid'],
    move: 7, soft: 8, hard: 5, air: 2, def: 3, cost: 280 },
  it_g55: { nation: 'it', class: 'fighter', name: 'Fiat G.55', eras: ['late'],
    move: 10, soft: 3, hard: 1, air: 10, def: 5, cost: 340 },
  it_mc205: { nation: 'it', class: 'fighter', name: 'Macchi MC.205', eras: ['late'],
    move: 10, soft: 2, hard: 1, air: 10, def: 4, cost: 320 },

  // ---------- Japan ----------
  jp_hago: { nation: 'jp', class: 'light', name: 'Typ 95 Ha-Go', eras: ['early', 'mid'],
    move: 6, soft: 2, hard: 3, air: 1, def: 2, armor: 1, range: [1, 1], cost: 180 },
  jp_chiha: { nation: 'jp', class: 'tank', name: 'Typ 97 Chi-Ha', eras: ['early'],
    move: 5, soft: 5, hard: 2, air: 1, def: 3, armor: 1, range: [1, 1], cost: 180 },
  jp_shinhoto: { nation: 'jp', class: 'tank', name: 'Shinhoto Chi-Ha', eras: ['mid'],
    move: 5, soft: 4, hard: 5, air: 1, def: 3, armor: 1, range: [1, 1], cost: 230 },
  jp_chihe: { nation: 'jp', class: 'tank', name: 'Typ 1 Chi-He', eras: ['late'],
    move: 5, soft: 4, hard: 5, air: 1, def: 5, armor: 1, range: [1, 1], cost: 250 },
  jp_chinu: { nation: 'jp', class: 'tank', name: 'Typ 3 Chi-Nu', eras: ['late'],
    move: 5, soft: 5, hard: 7, air: 1, def: 5, armor: 1, range: [1, 2], cost: 320 },
  jp_honi: { nation: 'jp', class: 'td', name: 'Typ 1 Ho-Ni', eras: ['late'],
    move: 4, soft: 5, hard: 7, air: 0, def: 3, armor: 1, range: [1, 2], cost: 260 },
  jp_a6m2: { nation: 'jp', class: 'fighter', name: 'A6M2 Zero', eras: ['early'],
    move: 11, soft: 2, hard: 1, air: 9, def: 2, cost: 310 },
  jp_d3a: { nation: 'jp', class: 'attack', name: 'D3A Val', eras: ['early', 'mid'],
    move: 8, soft: 7, hard: 4, air: 2, def: 3, cost: 260 },
  jp_ki43: { nation: 'jp', class: 'fighter', name: 'Ki-43 Hayabusa', eras: ['mid'],
    move: 10, soft: 2, hard: 1, air: 8, def: 2, cost: 290 },
  jp_ki61: { nation: 'jp', class: 'fighter', name: 'Ki-61 Hien', eras: ['mid'],
    move: 10, soft: 2, hard: 1, air: 9, def: 4, cost: 340 },
  jp_ki84: { nation: 'jp', class: 'fighter', name: 'Ki-84 Hayate', eras: ['late'],
    move: 11, soft: 3, hard: 1, air: 11, def: 4, cost: 400 },
  jp_n1k2: { nation: 'jp', class: 'fighter', name: 'N1K2 Shiden-Kai', eras: ['late'],
    move: 10, soft: 3, hard: 1, air: 11, def: 4, cost: 380 },

  // ---------- USA ----------
  us_m3stuart: { nation: 'us', class: 'light', name: 'M3 Stuart', eras: ['early', 'mid'],
    move: 6, soft: 3, hard: 5, air: 1, def: 5, armor: 1, range: [1, 1], cost: 260 },
  us_m3lee: { nation: 'us', class: 'tank', name: 'M3 Lee', eras: ['early'],
    move: 5, soft: 6, hard: 7, air: 1, def: 6, armor: 1, range: [1, 1], cost: 320 },
  us_m4: { nation: 'us', class: 'tank', name: 'M4 Sherman', eras: ['mid', 'late'],
    move: 5, soft: 6, hard: 7, air: 1, def: 8, armor: 1, range: [1, 2], cost: 340 },
  us_m10: { nation: 'us', class: 'td', name: 'M10 Wolverine', eras: ['mid'],
    move: 5, soft: 3, hard: 10, air: 0, def: 7, armor: 1, range: [1, 2], cost: 360 },
  us_m16: { nation: 'us', class: 'spaa', name: 'M16', eras: ['mid', 'late'], sprite: 'halftrack',
    move: 5, soft: 8, hard: 1, air: 9, def: 3, armor: 0.5, range: [1, 2], cost: 270 },
  us_m4a3e8: { nation: 'us', class: 'tank', name: 'M4A3E8 Sherman (76 mm)', eras: ['late'],
    move: 5, soft: 5, hard: 10, air: 1, def: 8, armor: 1, range: [1, 2], cost: 380 },
  us_m26: { nation: 'us', class: 'heavy', name: 'M26 Pershing', eras: ['late'],
    move: 4, soft: 6, hard: 13, air: 1, def: 11, armor: 1, range: [1, 3], cost: 480 },
  us_m18: { nation: 'us', class: 'td', name: 'M18 Hellcat', eras: ['late'],
    move: 6, soft: 3, hard: 10, air: 0, def: 3, armor: 1, range: [1, 2], cost: 300 },
  us_p40: { nation: 'us', class: 'fighter', name: 'P-40 Warhawk', eras: ['early'],
    move: 9, soft: 4, hard: 2, air: 7, def: 5, cost: 340 },
  us_p38: { nation: 'us', class: 'fighter', name: 'P-38 Lightning', eras: ['mid'],
    move: 10, soft: 4, hard: 3, air: 9, def: 5, cost: 380 },
  us_p47: { nation: 'us', class: 'attack', name: 'P-47 Thunderbolt', eras: ['mid'],
    move: 9, soft: 7, hard: 6, air: 8, def: 6, cost: 460 },
  us_p51: { nation: 'us', class: 'fighter', name: 'P-51D Mustang', eras: ['late'],
    move: 11, soft: 3, hard: 2, air: 12, def: 5, cost: 420 },
  us_p47d: { nation: 'us', class: 'attack', name: 'P-47D Thunderbolt', eras: ['late'],
    move: 9, soft: 8, hard: 7, air: 8, def: 6, cost: 480 },

  // ---------- Großbritannien ----------
  uk_matilda: { nation: 'uk', class: 'heavy', name: 'Matilda II', eras: ['early'],
    move: 3, soft: 2, hard: 5, air: 1, def: 9, armor: 1, range: [1, 1], cost: 240 },
  uk_a13: { nation: 'uk', class: 'light', name: 'Cruiser A13', eras: ['early'],
    move: 6, soft: 2, hard: 5, air: 1, def: 3, armor: 1, range: [1, 1], cost: 220 },
  uk_crusader: { nation: 'uk', class: 'tank', name: 'Crusader', eras: ['early'],
    move: 5, soft: 2, hard: 5, air: 1, def: 4, armor: 1, range: [1, 1], cost: 220 },
  uk_valentine: { nation: 'uk', class: 'tank', name: 'Valentine', eras: ['mid'],
    move: 4, soft: 2, hard: 6, air: 1, def: 7, armor: 1, range: [1, 1], cost: 240 },
  uk_churchill3: { nation: 'uk', class: 'heavy', name: 'Churchill III', eras: ['mid'],
    move: 3, soft: 3, hard: 8, air: 1, def: 10, armor: 1, range: [1, 2], cost: 330 },
  uk_sherman: { nation: 'uk', class: 'tank', name: 'Sherman', eras: ['mid'],
    move: 5, soft: 6, hard: 7, air: 1, def: 8, armor: 1, range: [1, 2], cost: 350 },
  uk_cromwell: { nation: 'uk', class: 'tank', name: 'Cromwell', eras: ['late'],
    move: 5, soft: 6, hard: 7, air: 1, def: 7, armor: 1, range: [1, 2], cost: 360 },
  uk_firefly: { nation: 'uk', class: 'tank', name: 'Sherman Firefly', eras: ['late'],
    move: 5, soft: 3, hard: 15, air: 1, def: 8, armor: 1, range: [1, 3], cost: 500 },
  uk_churchill7: { nation: 'uk', class: 'heavy', name: 'Churchill VII', eras: ['late'],
    move: 3, soft: 6, hard: 7, air: 1, def: 13, armor: 1, range: [1, 2], cost: 400 },
  uk_comet: { nation: 'uk', class: 'tank', name: 'Comet', eras: ['late'],
    move: 5, soft: 5, hard: 13, air: 1, def: 9, armor: 1, range: [1, 2], cost: 470 },
  uk_crusaderaa: { nation: 'uk', class: 'spaa', name: 'Crusader AA', eras: ['late'],
    move: 5, soft: 7, hard: 2, air: 9, def: 4, armor: 1, range: [1, 2], cost: 320 },
  uk_hurricane: { nation: 'uk', class: 'fighter', name: 'Hurricane I', eras: ['early'],
    move: 9, soft: 2, hard: 1, air: 7, def: 4, cost: 270 },
  uk_spitfire1: { nation: 'uk', class: 'fighter', name: 'Spitfire I', eras: ['early'],
    move: 10, soft: 2, hard: 1, air: 8, def: 4, cost: 300 },
  uk_spitfire9: { nation: 'uk', class: 'fighter', name: 'Spitfire IX', eras: ['mid'],
    move: 10, soft: 2, hard: 1, air: 10, def: 4, cost: 330 },
  uk_hurricane2d: { nation: 'uk', class: 'attack', name: 'Hurricane IID', eras: ['mid'],
    move: 8, soft: 4, hard: 8, air: 4, def: 4, cost: 320 },
  uk_spitfire14: { nation: 'uk', class: 'fighter', name: 'Spitfire XIV', eras: ['late'],
    move: 11, soft: 3, hard: 1, air: 12, def: 5, cost: 440 },
  uk_typhoon: { nation: 'uk', class: 'attack', name: 'Hawker Typhoon', eras: ['late'],
    move: 9, soft: 8, hard: 7, air: 6, def: 5, cost: 460 },

  // ---------- Sowjetunion ----------
  su_t26: { nation: 'su', class: 'light', name: 'T-26', eras: ['early'],
    move: 5, soft: 3, hard: 5, air: 1, def: 2, armor: 1, range: [1, 1], cost: 200 },
  su_bt7: { nation: 'su', class: 'light', name: 'BT-7', eras: ['early'],
    move: 6, soft: 3, hard: 5, air: 1, def: 2, armor: 1, range: [1, 1], cost: 230 },
  su_kv1: { nation: 'su', class: 'heavy', name: 'KW-1', eras: ['early', 'mid'],
    move: 3, soft: 5, hard: 6, air: 1, def: 9, armor: 1, range: [1, 1], cost: 310 },
  su_t34: { nation: 'su', class: 'tank', name: 'T-34/76', eras: ['early', 'mid'],
    move: 5, soft: 5, hard: 7, air: 1, def: 8, armor: 1, range: [1, 2], cost: 400 },
  su_t70: { nation: 'su', class: 'light', name: 'T-70', eras: ['mid'],
    move: 6, soft: 3, hard: 5, air: 1, def: 4, armor: 1, range: [1, 1], cost: 260 },
  su_su122: { nation: 'su', class: 'td', name: 'SU-122', eras: ['mid'],
    move: 4, soft: 8, hard: 7, air: 0, def: 7, armor: 1, range: [1, 2], cost: 370 },
  su_kv85: { nation: 'su', class: 'heavy', name: 'KW-85', eras: ['mid', 'late'],
    move: 3, soft: 5, hard: 10, air: 1, def: 10, armor: 1, range: [1, 2], cost: 440 },
  su_t3485: { nation: 'su', class: 'tank', name: 'T-34/85', eras: ['late'],
    move: 5, soft: 5, hard: 10, air: 1, def: 8, armor: 1, range: [1, 2], cost: 460 },
  su_is2: { nation: 'su', class: 'heavy', name: 'IS-2', eras: ['late'],
    move: 4, soft: 8, hard: 14, air: 1, def: 12, armor: 1, range: [1, 3], cost: 640 },
  su_su100: { nation: 'su', class: 'td', name: 'SU-100', eras: ['late'],
    move: 5, soft: 4, hard: 15, air: 0, def: 10, armor: 1, range: [1, 3], cost: 610 },
  su_zsu37: { nation: 'su', class: 'spaa', name: 'ZSU-37', eras: ['late'],
    move: 5, soft: 7, hard: 2, air: 9, def: 3, armor: 0.5, range: [1, 2], cost: 340 },
  su_i16: { nation: 'su', class: 'fighter', name: 'I-16', eras: ['early'],
    move: 9, soft: 2, hard: 1, air: 6, def: 3, cost: 250 },
  su_il2: { nation: 'su', class: 'attack', name: 'Il-2 Sturmowik', eras: ['early', 'mid'],
    move: 7, soft: 7, hard: 6, air: 2, def: 7, cost: 350 },
  su_yak9: { nation: 'su', class: 'fighter', name: 'Jak-9', eras: ['mid'],
    move: 10, soft: 2, hard: 1, air: 9, def: 4, cost: 350 },
  su_la7: { nation: 'su', class: 'fighter', name: 'La-7', eras: ['late'],
    move: 10, soft: 3, hard: 1, air: 11, def: 5, cost: 450 },
  su_il10: { nation: 'su', class: 'attack', name: 'Il-10', eras: ['late'],
    move: 8, soft: 8, hard: 7, air: 3, def: 8, cost: 470 },

};

// Motivbeschreibungen je Einheit (Schlüssel: <nation>.<typ>) für
// tools/generate-units.mjs. Fehlt ein Eintrag, wird aus dem Einheitennamen in
// config/nationen.js eine allgemeine Beschreibung gebaut.
// Bildvorgabe für Einheiten mit Rohr. tools/process-units.mjs sucht nur in
// Bildern, deren Prompt diesen Satz enthält, nach einem abtrennbaren Rohr.
export const BARREL_LAYOUT = 'The main gun barrel points exactly horizontally to the right, is fully visible along its whole length and stands free: transparent space directly above and below the protruding part of the barrel.';

export const UNIT_PROMPTS = {
  // --- Deutschland ---
  'de.inf': 'German Wehrmacht grenadiers of 1943 in field-grey M43 tunics and trousers with ankle boots and canvas gaiters, dark grey M35 steel helmets, Y-strap webbing with ammunition pouches and bread bags, Kar98k rifles, one with an MP 40 submachine gun and one carrying an MG 42 machine gun',
  'de.recon': 'German Sd.Kfz. 234/2 Puma eight-wheeled armoured car with its long angled hull, enclosed boat-shaped turret with the 5 cm KwK 39/1 gun and a small muzzle brake, eight large road wheels, dark yellow paint with olive green camouflage patches',
  'de.truck': 'German Opel Blitz 3-ton cargo truck with rounded bonnet and mudguards, closed steel cab, wooden cargo bed covered by a canvas tarpaulin on bows, dark yellow paint',
  'de.halftrack': 'German Sd.Kfz. 7 eight-ton half-track prime mover with a long bonnet, open crew compartment with three rows of bench seats and a folded canvas top, steerable front wheels and a long tracked run with interleaved road wheels, dark grey paint',
  'de.tank': 'German Panzer IV Ausf. H medium tank with the long 7.5 cm KwK 40 L/48 gun and its double-baffle muzzle brake, armour skirt plates (Schürzen) along the hull side and around the turret, eight small paired road wheels, dark yellow paint with olive green and red-brown camouflage',
  'de.heavy': 'German Tiger I heavy tank (Panzerkampfwagen VI Ausf. E, mid production 1943) with the long 8.8 cm KwK 36 gun and its double-baffle muzzle brake, boxy hull, interleaved road wheels, dark yellow (Dunkelgelb) paint with olive green and red-brown camouflage stripes',
  'de.at': 'German 7.5 cm Pak 40 towed anti-tank gun with its angled double-plate gun shield, long barrel with muzzle brake, split trail legs spread on the ground, two spoked wheels, dark grey paint',
  'de.art': 'German 10.5 cm leFH 18 light field howitzer in firing position, short thick barrel with the recuperator cylinder above it, small flat gun shield, split trail legs spread on the ground, two large wheels, dark grey paint',
  'de.lflak': 'German 2 cm Flak 38 light anti-aircraft gun on its low triangular ground platform, single slim barrel with a conical flash hider, small flat gun shield, gunner seat and ring sight, dark yellow paint',
  'de.hflak': 'German 8.8 cm Flak 36 anti-aircraft gun (the famous Acht-Acht) on its cruciform platform with outriggers lowered, very long slender barrel with recuperator cylinders above it, small gun shield, dark yellow paint',
  'de.air': 'German Junkers Ju 87 D Stuka dive bomber with inverted gull wings, fixed landing gear with streamlined spats, long glazed two-seat canopy, large radiator under the nose, a 500 kg bomb under the fuselage, dark green splinter camouflage on the upper surfaces and light blue underside',

  // --- Italien ---
  'it.inf': 'Italian Royal Army infantrymen of 1942 in grey-green wool uniforms with puttees, M33 steel helmets, leather ammunition pouches, Carcano M91 rifles, one carrying a Breda 30 light machine gun',
  'it.recon': 'Italian AB 41 four-wheeled armoured car with angled riveted hull, small turret with a 20 mm Breda cannon, four large wheels and spare wheels on the hull sides, sand-yellow desert paint',
  'it.truck': 'Italian Fiat 626 medium army truck with a flat cab-over-engine front, closed cab, canvas-covered cargo bed on bows, sand-yellow paint',
  'it.halftrack': 'Italian Breda 61 half-track artillery tractor with a long bonnet, open crew compartment with bench seats and a folded canvas top, steerable front wheels and a tracked run with interleaved road wheels, grey-green paint',
  'it.tank': 'Italian Fiat M13/40 medium tank with a riveted boxy hull, small riveted turret with the 47/32 gun, leaf-spring bogies with many small road wheels, sand-yellow desert paint',
  'it.heavy': 'Italian P26/40 heavy tank with sloped riveted armour, low turret with the 75/34 gun, many small road wheels on leaf-spring bogies, sand-yellow paint with green and red-brown camouflage blotches',
  'it.at': 'Italian Cannone da 47/32 light anti-tank gun, small and low, thin barrel, no gun shield, split trail legs spread on the ground, two small spoked wheels, grey-green paint',
  'it.art': 'Italian Obice da 75/18 mod. 35 howitzer in firing position, short barrel with recuperator, small gun shield, split trail legs spread on the ground, two spoked wheels, grey-green paint',
  'it.lflak': 'Italian Breda 20/65 mod. 35 light anti-aircraft gun on its low two-wheeled carriage lowered onto its legs, single barrel with a flash hider, small curved gun shield, grey-green paint',
  'it.hflak': 'Italian Cannone da 90/53 heavy anti-aircraft gun on its cruciform platform with outriggers lowered, very long slender barrel, small gun shield, grey-green paint',
  'it.air': 'Italian Fiat G.55 Centauro fighter with a slim pointed inline-engine nose, three-blade propeller, framed canopy, olive green upper surfaces with a light grey underside',

  // --- Japan ---
  'jp.inf': 'Imperial Japanese Army infantrymen in khaki Type 98 uniforms with puttees, Type 90 steel helmets covered with netting, leather ammunition pouches, Arisaka Type 99 rifles with long bayonets fixed, one carrying a Type 96 light machine gun',
  'jp.recon': 'Japanese Type 97 Te-Ke tankette, small riveted hull, small offset turret with a short 37 mm gun, four road wheels on bell-crank suspension, three-colour camouflage of brown, dark green and khaki',
  'jp.truck': 'Japanese Isuzu Type 94 six-wheeled army truck with a small rounded bonnet, open cab with a canvas roof, wooden slatted cargo bed, khaki-brown paint',
  'jp.halftrack': 'Japanese Type 1 Ho-Ha half-track armoured personnel carrier with an angular riveted armoured body, open top, steerable front wheels and a tracked rear, three-colour camouflage of brown, dark green and khaki',
  'jp.tank': 'Japanese Type 97 Shinhoto Chi-Ha medium tank with a riveted hull, enlarged turret with the 47 mm Type 1 gun, a horseshoe radio antenna rail around the turret, bell-crank suspension with six road wheels, three-colour camouflage of brown, dark green and khaki',
  'jp.heavy': 'Japanese Type 1 Chi-He medium tank with a welded angular hull, three-man turret with the 47 mm Type 1 gun, six road wheels, three-colour camouflage of brown, dark green and khaki',
  'jp.at': 'Japanese Type 1 47 mm anti-tank gun, low profile, long thin barrel, small flat gun shield, split trail legs spread on the ground, two wheels, olive-khaki paint',
  'jp.art': 'Japanese Type 91 10 cm howitzer in firing position, barrel with recuperator, flat gun shield, split trail legs spread on the ground, two large wooden-spoked wheels, olive-khaki paint',
  'jp.lflak': 'Japanese Type 98 20 mm anti-aircraft machine cannon lowered from its two-wheeled carriage onto three outrigger legs, single slim barrel with flash hider, no gun shield, olive-khaki paint',
  'jp.hflak': 'Japanese Type 88 75 mm anti-aircraft gun on its star-shaped platform with five outrigger legs, long barrel, olive-khaki paint',
  'jp.air': 'Japanese Mitsubishi A6M Zero fighter with a slender fuselage, radial engine with a black cowling, three-blade propeller, long framed greenhouse canopy, overall light grey-green finish',

  // --- USA ---
  'us.inf': 'US Army GI infantrymen of 1944 in olive drab M1941 field jackets and trousers with canvas leggings, M1 steel helmets with netting, cartridge belts, M1 Garand rifles, one with a Thompson submachine gun and one carrying a Browning Automatic Rifle',
  'us.recon': 'American M8 Greyhound six-wheeled armoured car with a low wide hull, open-topped round turret with the 37 mm gun, six large wheels, olive drab paint',
  'us.truck': 'American GMC CCKW 2½-ton six-wheeled cargo truck with an open cab and canvas top, canvas-covered cargo bed on bows, dual rear wheels, olive drab paint',
  'us.halftrack': 'American M3 half-track personnel carrier with a front roller bumper, armoured open-topped body, a .50 calibre machine gun on a pulpit mount, steerable front wheels and a rubber-band track at the rear, olive drab paint',
  'us.tank': 'American M4A3 Sherman medium tank with the 75 mm gun, tall hull with a sloped front plate, rounded cast turret, VVSS suspension with three bogie units per side, olive drab paint',
  'us.heavy': 'American M26 Pershing heavy tank with the long 90 mm M3 gun and its muzzle brake, low wide hull, large cast turret, torsion-bar suspension with six large road wheels, olive drab paint',
  'us.at': 'American 57 mm M1 anti-tank gun with a long barrel, flat double-plate gun shield, split trail legs spread on the ground, two wheels with tyres, olive drab paint',
  'us.art': 'American 105 mm M2A1 howitzer in firing position, barrel with the recuperator below it, flat gun shield, split trail legs spread on the ground, two wheels with tyres, olive drab paint',
  'us.lflak': 'American M16 multiple gun motor carriage: an M3 half-track carrying a Maxson M45 turret with four .50 calibre machine guns in the open rear compartment, the four gun barrels pointing horizontally forward over the cab, olive drab paint',
  'us.hflak': 'American 90 mm M1 anti-aircraft gun on its four-wheeled mount with the outriggers lowered, long barrel, olive drab paint',
  'us.air': 'American Republic P-47D Thunderbolt fighter-bomber, late "bubbletop" version: a clear teardrop-shaped bubble canopy without frames behind the pilot and a cut-down rear fuselage spine, massive radial engine cowling, four-blade propeller, bare polished aluminium finish with an olive drab anti-glare panel in front of the cockpit, a 500 lb bomb under the fuselage',

  // --- Großbritannien ---
  'uk.inf': 'British infantrymen of 1944 in khaki serge battledress, Mk II steel helmets with netting, 1937 pattern webbing with ammunition pouches, Lee-Enfield No. 4 rifles, one with a Sten gun and one carrying a Bren light machine gun',
  'uk.recon': 'British Daimler Armoured Car Mk I, four-wheeled, low rounded hull, small turret with the 2-pounder 40 mm gun, khaki-green paint',
  'uk.truck': 'British Bedford QL 3-ton four-wheel-drive army truck with a flat cab-over-engine front, canvas-covered cargo bed on bows, khaki-green paint',
  'uk.halftrack': 'American-built M5 half-track in British service, front roller bumper, armoured open-topped body, steerable front wheels and a rubber-band track at the rear, khaki-green paint',
  'uk.tank': 'British Cromwell IV cruiser tank with a boxy hull, slab-sided turret with the 75 mm gun, five large Christie road wheels, khaki-green paint',
  'uk.heavy': 'British Churchill Mk VII infantry tank with a long hull and tracks running over the top, many small road wheels, boxy turret with the 75 mm gun, side escape hatch, khaki-green paint',
  'uk.at': 'British Ordnance QF 6-pounder anti-tank gun with a long barrel, flat double-plate gun shield, split trail legs spread on the ground, two wheels with tyres, khaki-green paint',
  'uk.art': 'British Ordnance QF 25-pounder gun-howitzer in firing position on its round firing platform, gun shield, box trail, two wheels with tyres, khaki-green paint',
  'uk.lflak': 'British Bofors 40 mm light anti-aircraft gun on its four-wheeled carriage with the outriggers lowered, barrel with a conical flash hider, khaki-green paint',
  'uk.hflak': 'British QF 3.7-inch heavy anti-aircraft gun on its mobile mounting with the outriggers lowered, long barrel, khaki-green paint',
  'uk.air': 'British Hawker Typhoon Mk IB fighter-bomber with thick wings, deep chin radiator under the nose, three-blade propeller, bubble canopy, four 20 mm cannons protruding from the wing leading edge, dark green and ocean grey camouflage on top and light grey underside',

  // --- Sowjetunion ---
  'su.inf': 'Soviet Red Army riflemen of 1943 in khaki-brown gymnastyorka tunics, SSh-40 steel helmets painted green, rolled greatcoats across the shoulder, Mosin-Nagant rifles, one with a PPSh-41 submachine gun and one carrying a DP-27 light machine gun',
  'su.recon': 'Soviet BA-64 light four-wheeled armoured car with a small angular sloped body, small open-topped turret with a DT machine gun, dark green paint',
  'su.truck': 'Soviet GAZ-AA 1.5-ton army truck with a narrow bonnet, simple boxy wooden cab, low wooden cargo bed, dark green paint',
  'su.halftrack': 'Soviet T-20 Komsomolets small fully tracked armoured artillery tractor with an armoured front cab, two rows of rear bench seats under a folding canvas roof, four road wheels, dark green paint',
  'su.tank': 'Soviet T-34/76 Model 1943 medium tank with sloped armour, hexagonal turret with the 76 mm F-34 gun, five large road wheels, dark green paint',
  'su.heavy': 'Soviet IS-2 heavy tank with the long 122 mm D-25T gun and its large double-baffle muzzle brake, rounded cast turret, six road wheels, dark green paint',
  'su.at': 'Soviet 76 mm ZiS-3 divisional gun with a long barrel and muzzle brake, flat gun shield, split trail legs spread on the ground, two wheels with tyres, dark green paint',
  'su.art': 'Soviet 122 mm M-30 howitzer in firing position, barrel with recuperator, flat gun shield, split trail legs spread on the ground, two wheels with tyres, dark green paint',
  'su.lflak': 'Soviet 37 mm 61-K anti-aircraft gun on its four-wheeled carriage with the outriggers lowered, barrel with a flash hider, small gun shield, dark green paint',
  'su.hflak': 'Soviet 85 mm 52-K heavy anti-aircraft gun on its cruciform platform with outriggers lowered, long barrel with muzzle brake, dark green paint',
  'su.air': 'Soviet Ilyushin Il-2 Shturmovik ground-attack aircraft with an armoured nose and inline engine, two-seat canopy with a rear gunner, landing gear fairings under the wings, dark green and black-green camouflage on top and light blue underside',
};

import { Card } from '../models/card';

/**
 * Seed catalogue ported from the colleague's Python `cards.json` (real LF kit).
 * `locations` holds BEST-EFFORT default Fächer based on standard LF-20 / LF-KatS
 * beladung — every crew's truck differs, so correct these in the Admin editor.
 * Items can live in several Fächer (e.g. Feuerwehraxt in G1 and on the Dach).
 * `Schlauchtragekorb` taboo de-duplicated ("Schlauch" twice).
 */
export const SEED_CARDS: Card[] = [
  { id: 'c01', mode: 'Beschreiben', difficulty: 'Leicht', term: 'Feuerlöscher', taboo: ['Feuer', 'Löschen', 'Pulver', 'Schaum'], locations: ['G4'] },
  { id: 'c02', mode: 'Beschreiben', difficulty: 'Leicht', term: 'Funkgerät', taboo: ['Funken', 'Sprechen', 'Kanal', 'Nachricht'], locations: ['Fahrerkabine', 'Angriffstrupp', 'Bank hinten'] },
  { id: 'c03', mode: 'Beschreiben', difficulty: 'Leicht', term: 'Halligan Tool', taboo: ['Tür', 'Hebeln', 'Aufbrechen', 'Werkzeug'], locations: ['G5'] },
  { id: 'c04', mode: 'Beschreiben', difficulty: 'Leicht', term: 'Schlauchtragekorb', taboo: ['Schlauch', 'Korb', 'Tragen', 'C'], locations: ['G5'] },
  { id: 'c05', mode: 'Beschreiben', difficulty: 'Leicht', term: 'Standrohr', taboo: ['Hydrant', 'Wasser', 'Unterflur', 'Schlüssel'], locations: ['Haspel'] },
  { id: 'c06', mode: 'Beschreiben', difficulty: 'Leicht', term: 'Wärmebildkamera', taboo: ['Kamera', 'Wärme', 'Hitze', 'Bildschirm'], locations: ['Angriffstrupp'] },
  { id: 'c07', mode: 'Beschreiben', difficulty: 'Mittel', term: 'Hebeleisen', taboo: ['Polen', 'Einbruch', 'Brechwerkzeug'], locations: ['G1'] },
  { id: 'c08', mode: 'Beschreiben', difficulty: 'Mittel', term: 'Kabeltrommel', taboo: ['Strom', 'Elektrizität', 'Licht', 'Kurbel'], locations: ['G2'] },
  { id: 'c09', mode: 'Beschreiben', difficulty: 'Mittel', term: 'Krankenhausdecke', taboo: ['kalt', 'warm', 'Patient'], locations: ['Bank hinten'] },
  { id: 'c10', mode: 'Beschreiben', difficulty: 'Mittel', term: 'Tauchpumpe', taboo: ['Keller', 'Wasser', 'Pumpen', 'Überflutung'], locations: ['G1'] },
  { id: 'c11', mode: 'Beschreiben', difficulty: 'Mittel', term: 'Übergangsstück', taboo: ['Adapter', 'Kupplung', 'Verteiler', 'Schlauch'], locations: ['G5'] },
  { id: 'c12', mode: 'Beschreiben', difficulty: 'Schwer', term: 'CO2-Messgerät', taboo: ['Gas', 'Messen', 'Sauerstoff', 'Gefahr'], locations: ['Fahrerkabine'] },
  { id: 'c13', mode: 'Beschreiben', difficulty: 'Schwer', term: 'Hitzeschutzhandschuhe', taboo: ['Schornstein', 'Hände'], locations: ['G1'] },
  { id: 'c14', mode: 'Beschreiben', difficulty: 'Schwer', term: 'Rauchvorhang', taboo: ['Türrahmen', 'Abdichten', 'Stoff', 'Angriffstrupp'], locations: ['G5'] },
  { id: 'c15', mode: 'Beschreiben', difficulty: 'Schwer', term: 'Sammelstück', taboo: ['Verbinden', 'Zusammenführen', 'Leitung', 'Zwei', 'Hose'], locations: ['G1'] },
  { id: 'c16', mode: 'Beschreiben', difficulty: 'Schwer', term: 'Stützkrümmer', taboo: ['Standrohr', 'Hydrant', 'Abstützen', 'Bogen'], locations: ['G6'] },
  { id: 'c17', mode: 'Beschreiben', difficulty: 'Schwer', term: 'Zumischer', taboo: ['Schaum', 'Mischen', 'Schaummittel', 'Wasser'], locations: ['G6'] },
  { id: 'c18', mode: 'Zeichnen', difficulty: 'Leicht', term: 'Feuerwehraxt', taboo: [], locations: ['Angriffstrupp', 'G5', 'G3'] },
  { id: 'c19', mode: 'Zeichnen', difficulty: 'Leicht', term: 'Feuerwehrhelm', taboo: [], locations: ['Angriffstrupp', 'Bank hinten'] },
  { id: 'c20', mode: 'Zeichnen', difficulty: 'Leicht', term: 'Feuerwehrleine', taboo: [], locations: ['Angriffstrupp', 'Bank hinten', 'G3'] },
  { id: 'c21', mode: 'Zeichnen', difficulty: 'Leicht', term: 'Handlampe', taboo: [], locations: ['Fahrerkabine', 'Angriffstrupp'] },
  { id: 'c22', mode: 'Zeichnen', difficulty: 'Leicht', term: 'Verkehrsleitkegel', taboo: [], locations: ['G2'] },
  { id: 'c23', mode: 'Zeichnen', difficulty: 'Mittel', term: 'Bolzenschneider', taboo: [], locations: ['Angriffstrupp'] },
  { id: 'c24', mode: 'Zeichnen', difficulty: 'Mittel', term: 'Fender', taboo: [], locations: ['G4'] },
  { id: 'c25', mode: 'Zeichnen', difficulty: 'Mittel', term: 'FFP2 Masken', taboo: [], locations: ['Angriffstrupp'] },
  { id: 'c26', mode: 'Zeichnen', difficulty: 'Mittel', term: 'Kabeltrommel', taboo: [], locations: ['G2'] },
  { id: 'c27', mode: 'Zeichnen', difficulty: 'Mittel', term: 'Systemtrenner', taboo: [], locations: ['Haspel', 'G6'] },
  { id: 'c28', mode: 'Zeichnen', difficulty: 'Schwer', term: 'Bergetuch', taboo: [], locations: ['Bank hinten'] },
  { id: 'c29', mode: 'Zeichnen', difficulty: 'Schwer', term: 'Chemieschutzanzug', taboo: [], locations: ['Angriffstrupp'] },
  { id: 'c30', mode: 'Zeichnen', difficulty: 'Schwer', term: 'Kupplungsschlüssel', taboo: [], locations: ['G5'] },
  { id: 'c31', mode: 'Zeichnen', difficulty: 'Schwer', term: 'Schwimmweste', taboo: [], locations: ['G4'] },
  { id: 'c32', mode: 'Zeichnen', difficulty: 'Schwer', term: 'Schäkel', taboo: [], locations: ['Bank hinten'] },
  { id: 'c33', mode: 'Zeichnen', difficulty: 'Schwer', term: 'Stützkrümmer', taboo: [], locations: ['G6'] },
  { id: 'c34', mode: 'Pantomime', difficulty: 'Leicht', term: 'Atemschutztafel', taboo: [], locations: ['Fahrerkabine'] },
  { id: 'c35', mode: 'Pantomime', difficulty: 'Leicht', term: 'C-Schlauch', taboo: [], locations: ['G5'] },
  { id: 'c36', mode: 'Pantomime', difficulty: 'Leicht', term: 'Schachthaken', taboo: [], locations: ['G6'] },
  { id: 'c37', mode: 'Pantomime', difficulty: 'Leicht', term: 'Schlauchpaket', taboo: [], locations: ['Bank hinten'] },
  { id: 'c38', mode: 'Pantomime', difficulty: 'Leicht', term: 'Strahlrohr', taboo: [], locations: ['G6'] },
  { id: 'c39', mode: 'Pantomime', difficulty: 'Mittel', term: 'Klopapier', taboo: [], locations: ['G6'] },
  { id: 'c40', mode: 'Pantomime', difficulty: 'Mittel', term: 'Sicherheitstrupptasche', taboo: [], locations: ['G2'] },
  { id: 'c41', mode: 'Pantomime', difficulty: 'Mittel', term: 'Unterbaumaterial', taboo: [], locations: ['G1'] },
  { id: 'c42', mode: 'Pantomime', difficulty: 'Mittel', term: 'Verkehrskelle', taboo: [], locations: ['Fahrerkabine'] },
  { id: 'c43', mode: 'Pantomime', difficulty: 'Mittel', term: 'Warnblinkleuchte', taboo: [], locations: ['Bank hinten', 'G2'] },
  { id: 'c44', mode: 'Pantomime', difficulty: 'Schwer', term: '3Kant Schlüssel (Poller)', taboo: [], locations: ['Fahrerkabine', 'Haspel'] },
  { id: 'c45', mode: 'Pantomime', difficulty: 'Schwer', term: 'Abschleppseil', taboo: [], locations: ['Bank hinten'] },
  { id: 'c46', mode: 'Pantomime', difficulty: 'Schwer', term: 'Glassäge (Glasmaster)', taboo: [], locations: ['G1'] },
  { id: 'c47', mode: 'Pantomime', difficulty: 'Schwer', term: 'Schaumrohr', taboo: [], locations: ['G6'] },
  { id: 'c48', mode: 'Pantomime', difficulty: 'Schwer', term: 'Warndreieck', taboo: [], locations: ['Angriffstrupp', 'Bank hinten'] },
];

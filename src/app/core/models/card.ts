export const MODES = ['Beschreiben', 'Zeichnen', 'Pantomime'] as const;
export type Mode = (typeof MODES)[number];

/** Player-facing labels for the modes (the mime mode is shown as "Darstellen"). */
export const MODE_LABELS: Record<Mode, string> = {
  Beschreiben: 'Beschreiben',
  Zeichnen: 'Zeichnen',
  Pantomime: 'Darstellen',
};

export const DIFFICULTIES = ['Leicht', 'Mittel', 'Schwer'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Compartments of the LF (Fabian's truck). Order drives the on-screen sketch layout. */
export const COMPARTMENTS = [
  'G1', 'G2', 'G3', 'G4', 'G5', 'G6',
  'Fahrerkabine', 'Angriffstrupp', 'Bank hinten', 'Dach',
] as const;
export type Compartment = (typeof COMPARTMENTS)[number];

export interface Card {
  id: string;
  mode: Mode;
  difficulty: Difficulty;
  term: string;
  taboo: string[];
  /** Where the item lives on the LF — one or more Fächer (e.g. an axe in G1 and on the Dach). */
  locations?: Compartment[];
}

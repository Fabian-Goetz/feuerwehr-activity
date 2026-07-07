import { Difficulty, Mode } from './card';

/** How the phase-3 placement gate is resolved: at the real vehicle (moderator) or on the on-screen plan. */
export type Phase3Mode = 'vehicle' | 'plan';

export interface Settings {
  /** Countdown length per difficulty — shorter for harder cards makes Schwer a real gamble. */
  roundSeconds: Record<Difficulty, number>;
  points: Record<Difficulty, number>;
  /** When enabled, a correct guess only advances if the LF placement is also confirmed (gate). */
  phase3Enabled: boolean;
  phase3Mode: Phase3Mode;
}

export const DEFAULT_SETTINGS: Settings = {
  roundSeconds: { Leicht: 75, Mittel: 55, Schwer: 35 },
  points: { Leicht: 2, Mittel: 3, Schwer: 5 },
  phase3Enabled: true,
  phase3Mode: 'vehicle',
};

/** The 36-cell snake board, ported from the colleague's Python app. */
export const DEFAULT_BOARD: (Mode | 'Ziel')[] = [
  'Beschreiben', 'Zeichnen', 'Pantomime', 'Beschreiben', 'Pantomime', 'Zeichnen',
  'Zeichnen', 'Beschreiben', 'Pantomime', 'Zeichnen', 'Beschreiben', 'Pantomime',
  'Pantomime', 'Zeichnen', 'Beschreiben', 'Beschreiben', 'Pantomime', 'Zeichnen',
  'Beschreiben', 'Pantomime', 'Zeichnen', 'Pantomime', 'Beschreiben', 'Zeichnen',
  'Zeichnen', 'Pantomime', 'Beschreiben', 'Zeichnen', 'Beschreiben', 'Pantomime',
  'Beschreiben', 'Zeichnen', 'Pantomime', 'Beschreiben', 'Zeichnen', 'Ziel',
];

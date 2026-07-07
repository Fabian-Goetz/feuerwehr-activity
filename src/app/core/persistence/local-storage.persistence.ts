import { Card, Compartment, DIFFICULTIES, MODES } from '../models/card';
import { Settings, DEFAULT_SETTINGS } from '../models/settings';
import { LeaderboardEntry } from '../models/leaderboard';
import { SEED_CARDS } from '../seed/seed-cards';
import { PersistencePort } from './persistence.port';

const KEYS = {
  cards: 'fwa.cards',
  settings: 'fwa.settings',
  leaderboard: 'fwa.leaderboard',
} as const;

/** Renamed compartments — remap stored cards saved under old names. */
const LOCATION_ALIASES: Record<string, Compartment> = {
  'Fach unter Angriffstrupp': 'Angriffstrupp',
  'Fach hinten Mannschaftsraum': 'Bank hinten',
};

/** Migrate a stored card: legacy singular `location` → `locations[]`, remap renamed Fächer, default taboo. */
function normalizeCard(c: Card & { location?: Compartment }): Card {
  const raw = c.locations ?? (c.location ? [c.location] : undefined);
  const locations = raw?.map((l) => LOCATION_ALIASES[l] ?? l);
  const { location: _drop, ...rest } = c;
  return { ...rest, taboo: Array.isArray(rest.taboo) ? rest.taboo : [], ...(locations?.length ? { locations } : {}) };
}

const MODE_SET = new Set<string>(MODES);
const DIFF_SET = new Set<string>(DIFFICULTIES);

/** Keep only entries that look like cards (valid mode/difficulty/term), then normalize them. */
export function sanitizeCards(input: unknown): Card[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(
      (c): c is Card & { location?: Compartment } =>
        !!c &&
        typeof c === 'object' &&
        MODE_SET.has((c as { mode?: unknown }).mode as string) &&
        DIFF_SET.has((c as { difficulty?: unknown }).difficulty as string) &&
        typeof (c as { term?: unknown }).term === 'string',
    )
    .map(normalizeCard);
}

/** Fill any missing settings fields from the defaults (forward-compatible with new fields). */
export function mergeSettings(stored: Partial<Settings> | null | undefined): Settings {
  if (!stored) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    roundSeconds: { ...DEFAULT_SETTINGS.roundSeconds, ...stored.roundSeconds },
    points: { ...DEFAULT_SETTINGS.points, ...stored.points },
  };
}

export class LocalStoragePersistence implements PersistencePort {
  constructor(private readonly storage: Storage) {}

  loadCards(): Card[] {
    return (this.read<Card[]>(KEYS.cards) ?? SEED_CARDS).map(normalizeCard);
  }

  saveCards(cards: Card[]): void {
    this.write(KEYS.cards, cards);
  }

  loadSettings(): Settings {
    return mergeSettings(this.read<Partial<Settings>>(KEYS.settings));
  }

  saveSettings(settings: Settings): void {
    this.write(KEYS.settings, settings);
  }

  loadLeaderboard(): LeaderboardEntry[] {
    const entries = this.read<LeaderboardEntry[]>(KEYS.leaderboard) ?? [];
    return [...entries].sort((a, b) => a.rounds - b.rounds);
  }

  saveLeaderboard(entries: LeaderboardEntry[]): void {
    this.write(KEYS.leaderboard, entries);
  }

  private read<T>(key: string): T | null {
    const raw = this.storage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null; // corrupt value — fall back to seed/defaults rather than crashing bootstrap
    }
  }

  private write(key: string, value: unknown): void {
    this.storage.setItem(key, JSON.stringify(value));
  }
}

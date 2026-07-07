import { Card, Compartment } from '../models/card';
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

/** Migrate a stored card: legacy singular `location` → `locations[]`, and remap renamed Fächer. */
function normalizeCard(c: Card & { location?: Compartment }): Card {
  const raw = c.locations ?? (c.location ? [c.location] : undefined);
  const locations = raw?.map((l) => LOCATION_ALIASES[l] ?? l);
  const { location: _drop, ...rest } = c;
  return { ...rest, ...(locations?.length ? { locations } : {}) };
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
    return this.read<Settings>(KEYS.settings) ?? DEFAULT_SETTINGS;
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
    return raw === null ? null : (JSON.parse(raw) as T);
  }

  private write(key: string, value: unknown): void {
    this.storage.setItem(key, JSON.stringify(value));
  }
}

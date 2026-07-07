import { Card } from '../models/card';
import { Settings, DEFAULT_SETTINGS } from '../models/settings';
import { LeaderboardEntry } from '../models/leaderboard';
import { SEED_CARDS } from '../seed/seed-cards';
import { PersistencePort } from './persistence.port';

const KEYS = {
  cards: 'fwa.cards',
  settings: 'fwa.settings',
  leaderboard: 'fwa.leaderboard',
} as const;

export class LocalStoragePersistence implements PersistencePort {
  constructor(private readonly storage: Storage) {}

  loadCards(): Card[] {
    return this.read<Card[]>(KEYS.cards) ?? SEED_CARDS;
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

import { LocalStoragePersistence } from './local-storage.persistence';
import { SEED_CARDS } from '../seed/seed-cards';
import { DEFAULT_SETTINGS } from '../models/settings';
import { Settings } from '../models/settings';
import { LeaderboardEntry } from '../models/leaderboard';

function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
}

describe('LocalStoragePersistence', () => {
  it('round-trips cards, settings, and leaderboard through storage', () => {
    const p = new LocalStoragePersistence(fakeStorage());

    const cards = [SEED_CARDS[0], SEED_CARDS[1]];
    p.saveCards(cards);
    expect(p.loadCards()).toEqual(cards);

    const settings: Settings = { ...DEFAULT_SETTINGS, roundSeconds: { Leicht: 80, Mittel: 60, Schwer: 40 } };
    p.saveSettings(settings);
    expect(p.loadSettings()).toEqual(settings);

    const entries: LeaderboardEntry[] = [
      { id: 'e1', crew: 'Crew 1', rounds: 5, dateIso: '2026-07-07T00:00:00.000Z' },
    ];
    p.saveLeaderboard(entries);
    expect(p.loadLeaderboard()).toEqual(entries);
  });

  it('returns the seed cards and default settings when storage is empty', () => {
    const p = new LocalStoragePersistence(fakeStorage());
    expect(p.loadCards()).toEqual(SEED_CARDS);
    expect(p.loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(p.loadLeaderboard()).toEqual([]);
  });

  it('migrates renamed compartment names on load', () => {
    const p = new LocalStoragePersistence(fakeStorage());
    p.saveCards([
      { id: 'x', mode: 'Beschreiben', difficulty: 'Leicht', term: 'T', taboo: [], locations: ['Fach unter Angriffstrupp'] } as unknown as import('../models/card').Card,
    ]);
    expect(p.loadCards()[0].locations).toEqual(['Angriffstrupp']);
  });

  it('migrates a legacy single location field to a locations array', () => {
    const p = new LocalStoragePersistence(fakeStorage());
    p.saveCards([
      { id: 'y', mode: 'Zeichnen', difficulty: 'Leicht', term: 'T', taboo: [], location: 'Dach' } as unknown as import('../models/card').Card,
    ]);
    expect(p.loadCards()[0].locations).toEqual(['Dach']);
  });

  it('reads the leaderboard back sorted by fewest rounds', () => {
    const p = new LocalStoragePersistence(fakeStorage());
    p.saveLeaderboard([
      { id: 'e1', crew: 'Slow', rounds: 9, dateIso: '2026-07-01T00:00:00.000Z' },
      { id: 'e2', crew: 'Fast', rounds: 4, dateIso: '2026-07-02T00:00:00.000Z' },
      { id: 'e3', crew: 'Mid', rounds: 6, dateIso: '2026-07-03T00:00:00.000Z' },
    ]);
    expect(p.loadLeaderboard().map((e) => e.crew)).toEqual(['Fast', 'Mid', 'Slow']);
  });
});

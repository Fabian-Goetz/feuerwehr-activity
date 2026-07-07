import { LocalStoragePersistence, sanitizeCards, mergeSettings } from './local-storage.persistence';
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

  it('falls back to seed cards and defaults when stored JSON is corrupt', () => {
    const storage = fakeStorage();
    storage.setItem('fwa.cards', '{not valid json');
    storage.setItem('fwa.settings', 'oops');
    storage.setItem('fwa.leaderboard', '<<<');
    const p = new LocalStoragePersistence(storage);
    expect(p.loadCards()).toEqual(SEED_CARDS);
    expect(p.loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(p.loadLeaderboard()).toEqual([]);
  });

  it('merges stored settings over defaults so missing fields are filled in', () => {
    const storage = fakeStorage();
    storage.setItem('fwa.settings', JSON.stringify({ points: { Leicht: 9, Mittel: 3, Schwer: 5 } }));
    const p = new LocalStoragePersistence(storage);
    const s = p.loadSettings();
    expect(s.points.Leicht).toBe(9);
    expect(s.roundSeconds).toEqual(DEFAULT_SETTINGS.roundSeconds);
    expect(s.phase3Enabled).toBe(DEFAULT_SETTINGS.phase3Enabled);
    expect(s.phase3Mode).toBe(DEFAULT_SETTINGS.phase3Mode);
  });

  it('sanitizeCards drops malformed entries, defaults taboo, and normalizes legacy fields', () => {
    const result = sanitizeCards([
      { id: 'ok', mode: 'Beschreiben', difficulty: 'Leicht', term: 'A', taboo: [] },
      { id: 'legacy', mode: 'Zeichnen', difficulty: 'Leicht', term: 'B', location: 'Dach' },
      { id: 'bad-mode', mode: 'Nonsense', difficulty: 'Leicht', term: 'C' },
      { id: 'no-term', mode: 'Pantomime', difficulty: 'Mittel' },
      null,
      'garbage',
      { id: 'no-taboo', mode: 'Pantomime', difficulty: 'Mittel', term: 'D' },
    ]);
    expect(result.map((c) => c.id)).toEqual(['ok', 'legacy', 'no-taboo']);
    expect(result.find((c) => c.id === 'legacy')?.locations).toEqual(['Dach']);
    expect(result.find((c) => c.id === 'no-taboo')?.taboo).toEqual([]);
  });

  it('mergeSettings fills missing fields from defaults', () => {
    expect(mergeSettings(null)).toEqual(DEFAULT_SETTINGS);
    const merged = mergeSettings({ points: { Leicht: 9 } } as Partial<Settings>);
    expect(merged.points.Leicht).toBe(9);
    expect(merged.points.Mittel).toBe(DEFAULT_SETTINGS.points.Mittel);
    expect(merged.roundSeconds).toEqual(DEFAULT_SETTINGS.roundSeconds);
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

import { GameStore } from './game-store';
import { CardPicker } from './card-picker';
import { Card, Mode } from '../models/card';
import { Settings } from '../models/settings';

function card(id: string, mode: Mode, term: string): Card {
  return { id, mode, difficulty: 'Leicht', term, taboo: [] };
}

// Small deterministic board: indices 0-3 playable, 4 = Ziel.
const TEST_BOARD: (Mode | 'Ziel')[] = ['Beschreiben', 'Beschreiben', 'Beschreiben', 'Beschreiben', 'Ziel'];

const TEST_CARDS: Card[] = [
  card('a', 'Beschreiben', 'Feuerlöscher'),
  card('b', 'Beschreiben', 'Funkgerät'),
];

const SETTINGS: Settings = {
  roundSeconds: { Leicht: 75, Mittel: 55, Schwer: 35 },
  points: { Leicht: 3, Mittel: 4, Schwer: 5 },
  phase3Enabled: false,
  phase3Mode: 'vehicle',
};

function makeStore(board: (Mode | 'Ziel')[] = TEST_BOARD) {
  return new GameStore({
    picker: new CardPicker((options) => options[0]),
    cards: TEST_CARDS,
    board,
    settings: SETTINGS,
    shuffle: (order) => order, // deterministic turn order [0, 1, ...]
  });
}

// Longer board so a phase-3 bonus does not collide with the Ziel clamp.
const LONG_BOARD: (Mode | 'Ziel')[] = [
  ...Array<Mode>(9).fill('Beschreiben'),
  'Ziel',
];

describe('GameStore', () => {
  it('advances the current team by the card points when solved', () => {
    const store = makeStore();
    store.startGame(['A', 'B']);
    store.startRound('Leicht');
    store.solved();
    expect(store.positions()[0]).toBe(3);
  });

  it('marks a team finished and clamps to the goal when it reaches Ziel', () => {
    const store = makeStore();
    store.startGame(['A', 'B']);
    store.startRound('Schwer'); // 5 points, board last index is 4
    store.solved();
    expect(store.finished()).toContain(0);
    expect(store.positions()[0]).toBe(4);
  });

  it('skips a finished team when selecting the current team', () => {
    const store = makeStore();
    store.startGame(['A', 'B']);
    store.startRound('Schwer'); // team 0 reaches Ziel
    store.solved();
    expect(store.currentTeam()).toBe(1); // finished team 0 at turnIdx 0 is skipped
  });

  it('nextTurn cycles to the next team and wraps around', () => {
    const store = makeStore();
    store.startGame(['A', 'B']);
    expect(store.currentTeam()).toBe(0);
    store.nextTurn();
    expect(store.currentTeam()).toBe(1);
    store.nextTurn();
    expect(store.currentTeam()).toBe(0);
  });

  it('rotates fairly after a middle team finishes (no consecutive double turns)', () => {
    const store = makeStore(); // Ziel at index 4
    store.startGame(['A', 'B', 'C']); // deterministic order [0, 1, 2]

    // A plays, does not finish.
    expect(store.currentTeam()).toBe(0);
    store.startRound('Leicht');
    store.failRound();
    store.nextTurn();

    // B reaches Ziel in one Schwer solve (5 points ≥ goal index 4) and finishes.
    expect(store.currentTeam()).toBe(1);
    store.startRound('Schwer');
    store.solved();
    expect(store.finished()).toContain(1);
    store.nextTurn();

    // From here B must be skipped and A/C alternate — never the same team twice.
    const seq: (number | null)[] = [];
    for (let i = 0; i < 4; i++) {
      seq.push(store.currentTeam());
      store.nextTurn();
    }
    expect(seq).toEqual([0, 2, 0, 2]);
  });

  it('allows one skip per turn, swaps the card, and blocks a second skip', () => {
    const store = makeStore();
    store.startGame(['A', 'B']);
    store.startRound('Leicht');
    const first = store.currentCard();
    expect(store.skip()).toBe(true);
    expect(store.currentCard()?.term).not.toBe(first?.term); // card was swapped
    expect(store.skip()).toBe(false); // second skip rejected
  });

  it('records a solo result with the round count when the lone crew reaches Ziel', () => {
    const store = makeStore();
    store.startGame(['Crew 1']);
    store.startRound('Leicht'); // pos 0 -> 3
    store.solved();
    store.startRound('Leicht'); // pos 3 -> 6, clamped to Ziel (4)
    store.solved();
    expect(store.soloResult()).toEqual({ crew: 'Crew 1', rounds: 2 });
  });

  it('failRound counts a round without advancing position', () => {
    const store = makeStore();
    store.startGame(['Crew 1']);
    store.startRound('Leicht');
    store.failRound();
    expect(store.positions()[0]).toBe(0);
    store.startRound('Leicht'); // pos 0 -> 3
    store.solved();
    store.startRound('Leicht'); // pos 3 -> Ziel
    store.solved();
    expect(store.soloResult()?.rounds).toBe(3); // 1 failed + 2 solved
  });

  it('with phase 3 as a gate, a correct guess does not advance until placement is confirmed', () => {
    const store = makeStore(LONG_BOARD);
    store.startGame(['A', 'B'], { phase3Enabled: true });
    store.startRound('Leicht'); // 3 points
    store.solved();
    expect(store.positions()[0]).toBe(0); // gated — no movement yet
    store.confirmPhase3(true); // correct placement
    expect(store.positions()[0]).toBe(3); // now advances by the card points
  });

  it('with phase 3 as a gate, wrong placement means no movement that round', () => {
    const store = makeStore(LONG_BOARD);
    store.startGame(['A', 'B'], { phase3Enabled: true });
    store.startRound('Leicht');
    store.solved();
    store.confirmPhase3(false); // wrong placement
    expect(store.positions()[0]).toBe(0);
  });

  it('with phase 3 disabled, a correct guess advances immediately', () => {
    const store = makeStore(LONG_BOARD);
    store.startGame(['A', 'B'], { phase3Enabled: false });
    store.startRound('Mittel'); // 4 points
    store.solved();
    expect(store.positions()[0]).toBe(4);
  });

  it('clearRound drops the active card so a re-entered play screen has nothing to resume', () => {
    const store = makeStore();
    store.startGame(['A', 'B']);
    store.startRound('Leicht');
    expect(store.currentCard()).not.toBeNull();
    store.clearRound();
    expect(store.currentCard()).toBeNull();
  });

  it('tracks the number of Züge each team has taken', () => {
    const store = makeStore();
    store.startGame(['A', 'B']); // phase 3 off in test settings
    store.startRound('Leicht'); store.solved(); store.nextTurn(); // A
    store.startRound('Leicht'); store.failRound(); store.nextTurn(); // B
    store.startRound('Leicht'); store.solved(); // A again
    expect(store.turnsByTeam()).toEqual([2, 1]);
  });

  it('honours the phase-3 mode chosen at game start', () => {
    const store = makeStore();
    store.startGame(['A'], { phase3Enabled: true, phase3Mode: 'plan' });
    expect(store.phase3Mode).toBe('plan');
  });

  it('exposes the countdown length for the chosen difficulty', () => {
    const store = makeStore();
    store.startGame(['A', 'B']);
    store.startRound('Schwer');
    expect(store.currentRoundSeconds).toBe(35);
    store.startRound('Leicht');
    expect(store.currentRoundSeconds).toBe(75);
  });
});

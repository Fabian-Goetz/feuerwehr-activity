import { signal, computed, Signal } from '@angular/core';
import { Card, Difficulty, Mode } from '../models/card';
import { Settings, Phase3Mode } from '../models/settings';
import { SoloResult } from '../models/leaderboard';
import { CardPicker } from './card-picker';

export interface GameStoreDeps {
  picker: CardPicker;
  cards: Card[];
  board: (Mode | 'Ziel')[];
  settings: Settings;
  shuffle?: (order: number[]) => number[];
}

export class GameStore {
  private readonly picker: CardPicker;
  private cards: Card[];
  private readonly board: (Mode | 'Ziel')[];
  private settings: Settings;
  private readonly shuffle: (order: number[]) => number[];

  private readonly _teams = signal<string[]>([]);
  private readonly _positions = signal<number[]>([]);
  private readonly _turnOrder = signal<number[]>([]);
  private readonly _turnIdx = signal(0);
  private readonly _currentCard = signal<Card | null>(null);
  private readonly _currentPoints = signal(0);
  private readonly _finished = signal<number[]>([]);
  private readonly _roundsPlayed = signal(0);
  private readonly _turnsByTeam = signal<number[]>([]);
  private readonly _soloResult = signal<SoloResult | null>(null);
  private currentMode: Mode | null = null;
  private currentDifficulty: Difficulty | null = null;
  private skipUsed = false;
  private phase3Active: boolean;
  private phase3ModeActive: Phase3Mode;

  readonly teams: Signal<string[]> = this._teams.asReadonly();
  readonly positions: Signal<number[]> = this._positions.asReadonly();
  readonly currentCard: Signal<Card | null> = this._currentCard.asReadonly();
  readonly finished: Signal<number[]> = this._finished.asReadonly();
  readonly soloResult: Signal<SoloResult | null> = this._soloResult.asReadonly();
  readonly currentPoints: Signal<number> = this._currentPoints.asReadonly();
  /** Number of turns (Züge) each team has taken, by team index. */
  readonly turnsByTeam: Signal<number[]> = this._turnsByTeam.asReadonly();

  /** The current team's board cell (which mode they must play). */
  readonly currentCellMode = computed(() => {
    const team = this.currentTeam();
    if (team === null) return null;
    return this.board[this._positions()[team]];
  });

  readonly isSolo = computed(() => this._teams().length === 1);

  /** Versus game ends when every team has finished; solo ends when the result is recorded. */
  readonly isOver = computed(
    () => this._teams().length > 0 && (this.currentTeam() === null || this._soloResult() !== null),
  );

  get boardCells(): readonly (Mode | 'Ziel')[] {
    return this.board;
  }

  /** Countdown length for the round currently in progress (based on its difficulty). */
  get currentRoundSeconds(): number {
    return this.currentDifficulty ? this.settings.roundSeconds[this.currentDifficulty] : 60;
  }

  get phase3Enabled(): boolean {
    return this.phase3Active;
  }

  get phase3Mode(): Phase3Mode {
    return this.phase3ModeActive;
  }

  pointsFor(difficulty: Difficulty): number {
    return this.settings.points[difficulty];
  }

  private get goalIndex(): number {
    return this.board.length - 1;
  }

  readonly currentTeam = computed(() => {
    const order = this._turnOrder();
    if (order.length === 0) return null;
    const finished = this._finished();
    for (let i = 0; i < order.length; i++) {
      const team = order[(this._turnIdx() + i) % order.length];
      if (!finished.includes(team)) return team;
    }
    return null; // everyone finished
  });

  constructor(deps: GameStoreDeps) {
    this.picker = deps.picker;
    this.cards = deps.cards;
    this.board = deps.board;
    this.settings = deps.settings;
    this.shuffle = deps.shuffle ?? ((order) => order);
    this.phase3Active = this.settings.phase3Enabled;
    this.phase3ModeActive = this.settings.phase3Mode;
  }

  /** Refresh the catalogue/settings from persistence (e.g. after admin edits) before a new game. */
  configure(cards: Card[], settings: Settings): void {
    this.cards = cards;
    this.settings = settings;
    this.phase3Active = settings.phase3Enabled;
    this.phase3ModeActive = settings.phase3Mode;
  }

  startGame(teamNames: string[], options?: { phase3Enabled?: boolean; phase3Mode?: Phase3Mode }): void {
    this.phase3Active = options?.phase3Enabled ?? this.settings.phase3Enabled;
    this.phase3ModeActive = options?.phase3Mode ?? this.settings.phase3Mode;
    this._teams.set([...teamNames]);
    this._positions.set(teamNames.map(() => 0));
    this._turnOrder.set(this.shuffle(teamNames.map((_, i) => i)));
    this._turnIdx.set(0);
    this._finished.set([]);
    this._roundsPlayed.set(0);
    this._turnsByTeam.set(teamNames.map(() => 0));
    this._soloResult.set(null);
  }

  startRound(difficulty: Difficulty): void {
    const team = this.currentTeam();
    if (team === null) return;
    const mode = this.board[this._positions()[team]] as Mode;
    this.currentMode = mode;
    this.currentDifficulty = difficulty;
    this.skipUsed = false;
    this._currentCard.set(this.picker.pick(this.cards, mode, difficulty));
    this._currentPoints.set(this.settings.points[difficulty]);
  }

  skip(): boolean {
    if (this.skipUsed || this.currentMode === null || this.currentDifficulty === null) {
      return false;
    }
    const next = this.picker.pick(this.cards, this.currentMode, this.currentDifficulty);
    if (!next) return false;
    this.skipUsed = true;
    this._currentCard.set(next);
    return true;
  }

  nextTurn(): void {
    const order = this._turnOrder();
    if (order.length === 0) return;
    this._turnIdx.set((this._turnIdx() + 1) % order.length);
  }

  solved(): void {
    const team = this.currentTeam();
    if (team === null) return;
    this._roundsPlayed.update((r) => r + 1);
    this.countTurn(team);
    // With phase 3 as a gate, the guess only counts once placement is confirmed.
    if (!this.phase3Active) {
      this.advanceTeam(team, this._currentPoints());
    }
  }

  failRound(): void {
    const team = this.currentTeam();
    if (team === null) return;
    this._roundsPlayed.update((r) => r + 1);
    this.countTurn(team);
  }

  private countTurn(team: number): void {
    const turns = [...this._turnsByTeam()];
    turns[team] = (turns[team] ?? 0) + 1;
    this._turnsByTeam.set(turns);
  }

  /** Resolve the LF-placement gate: correct placement advances by the card points, wrong placement does not. */
  confirmPhase3(correct: boolean): void {
    if (!this.phase3Active) return;
    const team = this.currentTeam();
    if (team === null) return;
    if (correct) this.advanceTeam(team, this._currentPoints());
  }

  /** Move a team forward, clamping at Ziel and recording the finish (incl. solo result). */
  private advanceTeam(team: number, amount: number): void {
    const positions = [...this._positions()];
    positions[team] += amount;
    if (positions[team] >= this.goalIndex) {
      positions[team] = this.goalIndex;
      if (!this._finished().includes(team)) {
        this._finished.set([...this._finished(), team]);
        this.recordSoloFinish(team);
      }
    }
    this._positions.set(positions);
  }

  private recordSoloFinish(team: number): void {
    if (this._teams().length !== 1) return;
    this._soloResult.set({ crew: this._teams()[team], rounds: this._roundsPlayed() });
  }
}

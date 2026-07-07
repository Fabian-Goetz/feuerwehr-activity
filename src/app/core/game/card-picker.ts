import { Card, Difficulty, Mode } from '../models/card';

export type Selector = (options: Card[]) => Card;

export class CardPicker {
  private readonly recent = new Map<string, string[]>();

  constructor(
    private readonly select: Selector,
    private readonly recentLimit = 5,
  ) {}

  pick(cards: Card[], mode: Mode, difficulty: Difficulty): Card | null {
    const matches = cards.filter((c) => c.mode === mode && c.difficulty === difficulty);
    if (matches.length === 0) return null;

    const key = `${mode}|${difficulty}`;
    const recent = this.recent.get(key) ?? [];
    const fresh = matches.filter((c) => !recent.includes(c.term));
    const options = fresh.length > 0 ? fresh : matches;

    const chosen = this.select(options);
    this.recent.set(key, [...recent, chosen.term].slice(-this.recentLimit));
    return chosen;
  }
}

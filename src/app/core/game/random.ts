import { Card } from '../models/card';

/** Random card selector for the CardPicker (deterministic selectors are injected in tests). */
export function randomSelect(options: Card[]): Card {
  return options[Math.floor(Math.random() * options.length)];
}

/** Fisher–Yates shuffle producing a new turn order. */
export function shuffleOrder(order: number[]): number[] {
  const result = [...order];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

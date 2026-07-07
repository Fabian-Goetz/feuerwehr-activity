import { CardPicker } from './card-picker';
import { Card } from '../models/card';

function card(partial: Partial<Card> & Pick<Card, 'id' | 'mode' | 'difficulty' | 'term'>): Card {
  return { taboo: [], ...partial };
}

const CARDS: Card[] = [
  card({ id: '1', mode: 'Beschreiben', difficulty: 'Leicht', term: 'Feuerlöscher' }),
  card({ id: '2', mode: 'Beschreiben', difficulty: 'Leicht', term: 'Funkgerät' }),
  card({ id: '3', mode: 'Zeichnen', difficulty: 'Schwer', term: 'Bergetuch' }),
];

// Deterministic selector: always the first option.
const pickFirst = (options: Card[]) => options[0];

describe('CardPicker', () => {
  it('picks a card matching the requested mode and difficulty', () => {
    const picker = new CardPicker(pickFirst);
    const result = picker.pick(CARDS, 'Beschreiben', 'Leicht');
    expect(result?.mode).toBe('Beschreiben');
    expect(result?.difficulty).toBe('Leicht');
  });

  it('returns null when no card matches the mode and difficulty', () => {
    const picker = new CardPicker(pickFirst);
    expect(picker.pick(CARDS, 'Pantomime', 'Mittel')).toBeNull();
  });

  it('does not repeat a recently picked term for the same mode and difficulty', () => {
    const picker = new CardPicker(pickFirst);
    const first = picker.pick(CARDS, 'Beschreiben', 'Leicht');
    const second = picker.pick(CARDS, 'Beschreiben', 'Leicht');
    expect(first?.term).toBe('Feuerlöscher');
    expect(second?.term).toBe('Funkgerät');
  });

  it('falls back to the full set once every matching term is recently used', () => {
    const picker = new CardPicker(pickFirst);
    picker.pick(CARDS, 'Beschreiben', 'Leicht'); // Feuerlöscher
    picker.pick(CARDS, 'Beschreiben', 'Leicht'); // Funkgerät — both now recent
    const third = picker.pick(CARDS, 'Beschreiben', 'Leicht');
    expect(third).not.toBeNull();
    expect(['Feuerlöscher', 'Funkgerät']).toContain(third?.term);
  });
});

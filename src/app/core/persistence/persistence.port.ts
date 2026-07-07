import { InjectionToken } from '@angular/core';
import { Card } from '../models/card';
import { Settings } from '../models/settings';
import { LeaderboardEntry } from '../models/leaderboard';

/**
 * Storage seam. The app depends only on this interface; today it is backed by
 * localStorage, tomorrow by an HTTP adapter — swap the provider, nothing else.
 */
export interface PersistencePort {
  loadCards(): Card[];
  saveCards(cards: Card[]): void;
  loadSettings(): Settings;
  saveSettings(settings: Settings): void;
  loadLeaderboard(): LeaderboardEntry[];
  saveLeaderboard(entries: LeaderboardEntry[]): void;
}

export const PERSISTENCE = new InjectionToken<PersistencePort>('PersistencePort');

import { Injectable, inject, signal } from '@angular/core';
import { PERSISTENCE } from '../persistence/persistence.port';
import { LeaderboardEntry, SoloResult } from '../models/leaderboard';

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly persistence = inject(PERSISTENCE);
  private readonly _entries = signal<LeaderboardEntry[]>(this.persistence.loadLeaderboard());

  readonly entries = this._entries.asReadonly();

  /** Persist a finished solo run, stamping id + timestamp (kept out of the pure engine). */
  record(result: SoloResult): LeaderboardEntry {
    const entry: LeaderboardEntry = {
      id: crypto.randomUUID(),
      crew: result.crew,
      rounds: result.rounds,
      dateIso: new Date().toISOString(),
    };
    const next = [...this.persistence.loadLeaderboard(), entry];
    this.persistence.saveLeaderboard(next);
    this._entries.set(this.persistence.loadLeaderboard());
    return entry;
  }
}

export interface LeaderboardEntry {
  id: string;
  crew: string;
  rounds: number;
  dateIso: string;
}

/** Emitted by the game when a solo crew reaches Ziel; stamped with id/date by the leaderboard service. */
export interface SoloResult {
  crew: string;
  rounds: number;
}

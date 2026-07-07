import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LeaderboardService } from '../../core/game/leaderboard.service';

@Component({
  selector: 'fwa-leaderboard',
  imports: [RouterLink],
  template: `
    <main class="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-6">
      <header class="flex items-center gap-3">
        <a routerLink="/setup" class="text-subtle hover:text-ember">← Zurück</a>
        <h1 class="text-2xl font-extrabold">🏆 Bestenliste</h1>
      </header>
      <p class="text-sm text-muted">Solo-Läufe, sortiert nach wenigsten Runden bis zum Ziel.</p>

      @if (rows().length === 0) {
        <p class="mt-8 text-center text-subtle">Noch keine Einträge — spielt einen Solo-Lauf!</p>
      } @else {
        <ol class="flex flex-col gap-2">
          @for (e of rows(); track e.id) {
            <li class="flex items-center gap-3 rounded-xl border border-edge bg-card px-4 py-3">
              <span class="w-8 text-center text-xl font-black" [class.text-flame]="$index < 3">{{ medal($index) }}</span>
              <span class="flex-1 font-bold">{{ e.crew }}</span>
              <span class="text-right">
                <span class="text-lg font-extrabold text-ember-bright">{{ e.rounds }}</span>
                <span class="text-xs text-muted"> Runden</span>
                <span class="block text-xs text-muted">{{ e.date }}</span>
              </span>
            </li>
          }
        </ol>
      }
    </main>
  `,
})
export class Leaderboard {
  private readonly service = inject(LeaderboardService);

  readonly rows = computed(() =>
    [...this.service.entries()]
      .sort((a, b) => a.rounds - b.rounds)
      .map((e) => ({ ...e, date: new Date(e.dateIso).toLocaleDateString('de-DE') })),
  );

  medal(rank: number): string {
    return ['🥇', '🥈', '🥉'][rank] ?? `${rank + 1}`;
  }
}

import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GameStore } from '../../core/game/game-store';

@Component({
  selector: 'fwa-result',
  imports: [RouterLink],
  template: `
    <main class="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <div class="text-6xl">🏁</div>

      @if (store.isSolo()) {
        <h1 class="text-3xl font-extrabold text-ember-bright">Geschafft!</h1>
        <p class="text-lg">
          <span class="font-bold">{{ store.soloResult()?.crew }}</span> hat das Ziel in
          <span class="font-bold text-flame">{{ store.soloResult()?.rounds }}</span> Runden erreicht.
        </p>
        <p class="text-sm text-muted">Das Ergebnis steht jetzt in der Bestenliste.</p>
      } @else {
        <h1 class="text-3xl font-extrabold text-ember-bright">Spiel beendet</h1>
        @if (winner(); as w) {
          <p class="text-lg">🥇 <span class="font-bold">{{ w }}</span> war zuerst im Ziel!</p>
        }
        <ul class="w-full rounded-2xl border border-edge bg-card p-4 text-left">
          @for (t of ranking(); track t.name) {
            <li class="flex justify-between border-b border-edge/50 py-2 last:border-0">
              <span>{{ $index + 1 }}. {{ t.name }}</span>
              <span class="text-subtle">Feld {{ t.pos + 1 }}@if (t.done) { · ✓ }</span>
            </li>
          }
        </ul>
      }

      <div class="flex gap-3">
        <a routerLink="/setup" class="rounded-xl bg-ember px-6 py-3 font-bold text-white hover:bg-ember-bright">
          Neues Spiel
        </a>
        <a routerLink="/leaderboard" class="rounded-xl bg-input px-6 py-3 font-bold hover:bg-white/10">
          🏆 Bestenliste
        </a>
      </div>
    </main>
  `,
})
export class Result {
  readonly store = inject(GameStore);
  private readonly router = inject(Router);

  readonly winner = computed(() => {
    const first = this.store.finished()[0];
    return first === undefined ? null : this.store.teams()[first];
  });

  readonly ranking = computed(() =>
    this.store
      .teams()
      .map((name, i) => ({ name, pos: this.store.positions()[i], done: this.store.finished().includes(i) }))
      .sort((a, b) => b.pos - a.pos),
  );

  constructor() {
    if (this.store.teams().length === 0) this.router.navigate(['/setup']);
  }
}

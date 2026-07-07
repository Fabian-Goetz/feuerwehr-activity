import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameStore } from '../../core/game/game-store';
import { PERSISTENCE } from '../../core/persistence/persistence.port';
import { Card, Compartment } from '../../core/models/card';
import { LfSketch } from '../../shared/lf-sketch';

/** Fixed practice card — same for every game, does not count. */
const TEST_CARD: Card = {
  id: 'testrunde',
  mode: 'Beschreiben',
  difficulty: 'Leicht',
  term: '4-Teilige Steckleiter',
  taboo: ['Klettern', 'Balkon', 'Fenster', 'Menschenrettung', 'Hoch'],
  locations: ['Dach'],
};

@Component({
  selector: 'fwa-testrunde',
  imports: [LfSketch],
  template: `
    <div class="flex min-h-dvh flex-col">
      <header class="bg-mode-beschreiben px-4 py-4 text-center text-black">
        <p class="text-lg font-black">🎓 Testrunde · zählt nicht</p>
        <p class="text-sm opacity-80">So läuft eine Runde — Beschreiben · Leicht</p>
      </header>

      @if (phase() === 'guess') {
        <main class="flex flex-1 flex-col items-center justify-center gap-6 p-6">
          <div class="rounded-2xl border-2 px-10 py-5 text-center" [class.border-ember]="remaining() <= 5" [class.border-edge]="remaining() > 5">
            <div class="text-6xl font-black tabular-nums" [class.text-ember]="remaining() <= 5" [class.text-warn]="remaining() > 5 && remaining() <= 10">{{ remaining() }}</div>
            <div class="text-xs uppercase text-muted">Sekunden</div>
          </div>

          <div class="w-full max-w-xl rounded-2xl border border-edge bg-card px-8 py-8 text-center shadow-xl">
            <p class="text-3xl font-extrabold">{{ card.term }}</p>
            <hr class="my-4 border-edge" />
            <p class="text-xs font-bold uppercase text-muted">Tabu-Wörter</p>
            <p class="mt-1 text-lg text-subtle">{{ card.taboo.join(', ') }}</p>
          </div>

          <p class="max-w-md text-center text-sm text-muted">
            Beschreibt den Begriff, ohne eines der Tabu-Wörter zu sagen. Danach zeigt ihr den Lagerort am LF.
          </p>

          <div class="flex flex-wrap justify-center gap-3">
            <button class="rounded-xl bg-go px-7 py-3 text-lg font-bold text-white hover:brightness-110" (click)="phase.set('place')">Weiter zur Verortung →</button>
            <button class="rounded-xl bg-input px-5 py-3 text-sm font-bold text-subtle hover:bg-white/10" (click)="startGame()">Testrunde überspringen</button>
          </div>
        </main>
      } @else {
        <main class="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-4 landscape:flex-row landscape:gap-8">
          <fwa-lf-sketch class="w-full max-w-md landscape:flex-1" [picked]="picked()" [correct]="card.locations ?? []" [revealed]="picked() !== null" (pick)="picked.set($event)" />
          <div class="flex w-full max-w-sm flex-col items-center gap-3 text-center">
            <p class="text-xl font-bold">Wo liegt die <span class="text-ember-bright">4-Teilige Steckleiter</span>?</p>
            @if (picked() !== null) {
              <p class="text-2xl font-black" [class.text-go]="correct()" [class.text-ember]="!correct()">{{ correct() ? 'Richtig!' : 'Leider falsch' }}</p>
              <p class="text-sm text-subtle">Richtiger Platz: <b class="text-white">{{ card.locations?.join(', ') }}</b></p>
              <button class="rounded-xl bg-ember px-10 py-3 text-lg font-bold text-white hover:bg-ember-bright" (click)="startGame()">Spiel starten →</button>
            } @else {
              <p class="text-xs text-muted">Tippt das richtige Fach an — hier zählt es noch nicht.</p>
            }
          </div>
        </main>
      }
    </div>
  `,
})
export class Testrunde {
  private readonly store = inject(GameStore);
  private readonly router = inject(Router);
  private readonly persistence = inject(PERSISTENCE);

  readonly card = TEST_CARD;
  readonly phase = signal<'guess' | 'place'>('guess');
  readonly picked = signal<Compartment | null>(null);
  readonly remaining = signal(this.persistence.loadSettings().roundSeconds.Leicht);
  readonly correct = () => this.picked() !== null && (this.card.locations ?? []).includes(this.picked()!);

  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    if (this.store.teams().length === 0) {
      this.router.navigate(['/setup']);
      return;
    }
    this.timer = setInterval(() => {
      this.remaining.update((r) => r - 1);
      if (this.remaining() <= 0) {
        clearInterval(this.timer);
        this.phase.set('place');
      }
    }, 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(this.timer));
  }

  startGame(): void {
    clearInterval(this.timer);
    this.router.navigate(['/board']);
  }
}

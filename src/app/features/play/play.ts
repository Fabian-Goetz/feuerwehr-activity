import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameStore } from '../../core/game/game-store';
import { LeaderboardService } from '../../core/game/leaderboard.service';
import { Compartment } from '../../core/models/card';
import { LfSketch } from '../../shared/lf-sketch';

@Component({
  selector: 'fwa-play',
  imports: [LfSketch],
  template: `
    <div class="flex min-h-dvh flex-col">
      <header class="px-4 py-5 text-center text-white" [style.background]="modeColor()">
        <p class="text-lg font-bold">{{ currentName() }} ist dran</p>
        <p class="text-sm opacity-90">
          {{ store.currentCellMode() }} · {{ card()?.difficulty }} · {{ store.currentPoints() }} Punkte
        </p>
      </header>

      @if (phase() === 'guess') {
        <main class="flex flex-1 flex-col items-center justify-center gap-6 p-6">
          <div class="rounded-2xl border-2 px-10 py-6 text-center" [class.border-ember]="remaining() <= 5" [class.border-edge]="remaining() > 5">
            <div class="text-7xl font-black tabular-nums" [class.text-ember]="remaining() <= 5" [class.text-warn]="remaining() > 5 && remaining() <= 10">
              {{ remaining() }}
            </div>
            <div class="text-xs uppercase text-muted">Sekunden</div>
          </div>

          <div class="w-full max-w-xl rounded-2xl border border-edge bg-card px-8 py-10 text-center shadow-xl">
            <p class="text-4xl font-extrabold">{{ card()?.term }}</p>
            @if (card()?.taboo?.length) {
              <hr class="my-5 border-edge" />
              <p class="text-xs font-bold uppercase text-muted">Tabuwörter</p>
              <p class="mt-1 text-lg text-subtle">{{ card()?.taboo?.join(', ') }}</p>
            }
          </div>

          <div class="flex flex-wrap justify-center gap-3">
            <button class="rounded-xl bg-go px-7 py-3 text-lg font-bold text-white hover:brightness-110" (click)="solved()">Gelöst</button>
            <button class="rounded-xl bg-warn px-7 py-3 text-lg font-bold text-white hover:brightness-110 disabled:opacity-40" [disabled]="skipUsed()" (click)="skip()">Skip</button>
            <button class="rounded-xl bg-ember px-7 py-3 text-lg font-bold text-white hover:brightness-110" (click)="fail()">Nicht gelöst</button>
          </div>
        </main>
      } @else if (store.phase3Mode === 'plan') {
        <!-- ===== Am Plan: tap the Fach on the LF sketch (still on the clock) ===== -->
        <main class="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-3 p-6">
          <div class="text-center text-2xl font-black tabular-nums" [class.text-ember]="remaining() <= 5" [class.text-warn]="remaining() > 5 && remaining() <= 10">
            ⏱ {{ remaining() }}s
          </div>
          <p class="text-center text-xl font-bold">
            Wo liegt <span class="text-ember-bright">{{ card()?.term }}</span> auf dem LF?
          </p>

          <fwa-lf-sketch [picked]="picked()" [correct]="correctFachs()" [revealed]="picked() !== null" (pick)="pick($event)" />

          @if (picked() !== null) {
            @if (correctFachs().length) {
              <div class="text-center">
                <p class="text-2xl font-black" [class.text-go]="placedCorrect()" [class.text-ember]="!placedCorrect()">
                  {{ placedCorrect() ? 'Richtig!' : 'Leider falsch' }}
                </p>
                <p class="mt-1 text-sm text-subtle">
                  Richtiger Platz: <b class="text-white">{{ correctFachs().join(', ') }}</b> ·
                  {{ placedCorrect() ? store.currentPoints() + ' Felder' : 'kein Feld' }}
                </p>
                <button class="mt-3 rounded-xl bg-ember px-10 py-3 text-lg font-bold text-white hover:bg-ember-bright" (click)="resolvePlan()">Weiter</button>
              </div>
            } @else {
              <div class="text-center">
                <p class="text-sm text-muted">Gewählt: <b class="text-white">{{ picked() }}</b> — kein Platz hinterlegt, Schiedsrichter entscheidet.</p>
                <div class="mt-2 flex justify-center gap-4">
                  <button class="rounded-xl bg-go px-8 py-3 text-lg font-bold text-white hover:brightness-110" (click)="phase3Resolve(true)">Korrekt</button>
                  <button class="rounded-xl bg-input px-8 py-3 text-lg font-bold hover:bg-white/10" (click)="phase3Resolve(false)">Falsch</button>
                </div>
              </div>
            }
          } @else {
            <p class="text-center text-xs text-muted">Tippt das richtige Fach an — die Zeit läuft weiter.</p>
          }
        </main>
      } @else {
        <!-- ===== Am Fahrzeug: moderator confirms (still on the clock) ===== -->
        <main class="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
          <div class="text-3xl font-black tabular-nums" [class.text-ember]="remaining() <= 5" [class.text-warn]="remaining() > 5 && remaining() <= 10">
            ⏱ {{ remaining() }}s
          </div>
          <div class="text-6xl">🚒📍</div>
          <p class="max-w-md text-2xl font-bold">
            Wurde der Platz von <span class="text-ember-bright">{{ card()?.term }}</span> am Fahrzeug korrekt gezeigt?
          </p>
          <p class="text-sm text-muted">Ja → {{ store.currentPoints() }} Felder vorrücken · Nein → kein Feld</p>
          <div class="flex gap-4">
            <button class="rounded-xl bg-go px-10 py-4 text-xl font-bold text-white hover:brightness-110" (click)="phase3Resolve(true)">Ja, korrekt</button>
            <button class="rounded-xl bg-input px-10 py-4 text-xl font-bold hover:bg-white/10" (click)="phase3Resolve(false)">Nein</button>
          </div>
        </main>
      }
    </div>
  `,
})
export class Play {
  readonly store = inject(GameStore);
  private readonly router = inject(Router);
  private readonly leaderboard = inject(LeaderboardService);

  readonly card = this.store.currentCard;
  readonly phase = signal<'guess' | 'phase3'>('guess');
  readonly remaining = signal(this.store.currentRoundSeconds);
  readonly skipUsed = signal(false);
  readonly picked = signal<Compartment | null>(null);
  readonly correctFachs = computed(() => this.card()?.locations ?? []);
  readonly placedCorrect = computed(() => {
    const p = this.picked();
    return p !== null && this.correctFachs().includes(p);
  });

  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    if (!this.store.currentCard()) {
      this.router.navigate(['/board']);
      return;
    }
    this.startTimer();
    inject(DestroyRef).onDestroy(() => this.stopTimer());
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      this.remaining.update((r) => r - 1);
      if (this.remaining() <= 0) {
        this.stopTimer();
        // Timeout: failed guess, or ran out during placement (counts as no placement).
        if (this.phase() === 'guess') this.fail();
        else this.phase3Resolve(false);
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  currentName(): string {
    const t = this.store.currentTeam();
    return t === null ? '' : this.store.teams()[t];
  }

  modeColor(): string {
    return { Beschreiben: '#22c55e', Zeichnen: '#3b82f6', Pantomime: '#f97316' }[
      this.store.currentCellMode() as 'Beschreiben' | 'Zeichnen' | 'Pantomime'
    ] ?? '#ef4444';
  }

  skip(): void {
    if (this.store.skip()) {
      this.skipUsed.set(true);
      this.remaining.set(this.store.currentRoundSeconds);
    }
  }

  solved(): void {
    this.store.solved();
    // Phase 3 is part of the same round → keep the timer running into it.
    if (this.store.phase3Enabled && !this.store.isOver()) {
      this.phase.set('phase3');
    } else {
      this.stopTimer();
      this.endTurn();
    }
  }

  pick(fach: Compartment): void {
    this.stopTimer(); // the tap is the timed action; the reveal is not
    this.picked.set(fach);
  }

  resolvePlan(): void {
    this.phase3Resolve(this.placedCorrect());
  }

  phase3Resolve(correct: boolean): void {
    this.stopTimer();
    this.store.confirmPhase3(correct);
    this.endTurn();
  }

  fail(): void {
    this.stopTimer();
    this.store.failRound();
    this.endTurn();
  }

  private endTurn(): void {
    const solo = this.store.soloResult();
    if (solo) this.leaderboard.record(solo);
    this.store.nextTurn();
    this.router.navigate([this.store.isOver() ? '/result' : '/board']);
  }
}

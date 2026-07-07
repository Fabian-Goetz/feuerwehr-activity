import { Component, computed, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GameStore } from '../../core/game/game-store';
import { Difficulty, DIFFICULTIES, Mode } from '../../core/models/card';

const TEAM_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#14b8a6', '#f97316', '#6366f1'];

const MODE_BG: Record<Mode | 'Ziel', string> = {
  Beschreiben: 'bg-mode-beschreiben',
  Zeichnen: 'bg-mode-zeichnen',
  Pantomime: 'bg-mode-pantomime',
  Ziel: 'bg-mode-ziel',
};

const MODE_DISPLAY: Record<Mode, string> = {
  Beschreiben: 'Beschreiben',
  Zeichnen: 'Zeichnen',
  Pantomime: 'Darstellen',
};

const MODE_DOT: Record<Mode | 'Ziel', string> = {
  Beschreiben: '#22c55e',
  Zeichnen: '#3b82f6',
  Pantomime: '#f97316',
  Ziel: '#eab308',
};

const DIFF_DOT: Record<Difficulty, string> = { Leicht: '#22c55e', Mittel: '#eab308', Schwer: '#ef4444' };

type IconKey = 'start' | 'Beschreiben' | 'Zeichnen' | 'Pantomime' | 'Ziel';

interface Cell {
  index: number;
  cell: Mode | 'Ziel';
  icon: IconKey;
}

@Component({
  selector: 'fwa-board',
  imports: [RouterLink],
  template: `
    <div class="flex min-h-dvh flex-col lg:h-dvh lg:flex-row">
      <!-- ============ SIDEBAR ============ -->
      <aside class="order-2 flex flex-col gap-4 border-edge bg-ink p-4 lg:order-1 lg:h-dvh lg:w-[300px] lg:shrink-0 lg:overflow-y-auto lg:border-r">
        <!-- brand -->
        <div class="flex items-center gap-3 py-1">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-ember text-xl shadow-lg shadow-ember/30">🚒</div>
          <div>
            <h1 class="text-base font-bold leading-tight">Feuerwehr Activity</h1>
            <p class="text-xs text-muted">Einsatzbrett</p>
          </div>
        </div>

        <!-- team + difficulty -->
        <div class="rounded-2xl border border-edge bg-card p-4">
          <div class="flex items-start gap-3">
            <span class="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-black text-white" [style.background]="currentColor()">
              {{ (store.currentTeam() ?? 0) + 1 }}
            </span>
            <div class="min-w-0">
              <p class="truncate text-lg font-bold leading-tight">{{ currentName() }}</p>
              <p class="mt-0.5 flex items-center gap-1.5 text-sm text-subtle">
                <span class="inline-block h-2 w-2 rounded-full" [style.background]="aufgabeColor()"></span>
                Feld {{ currentPos() + 1 }} · {{ aufgabe() }}
              </p>
            </div>
          </div>

          <p class="mt-4 text-sm text-muted">Schwierigkeit wählen</p>
          <div class="mt-2 flex flex-col gap-2">
            @for (d of difficulties; track d) {
              <button
                class="flex items-center gap-3 rounded-xl bg-input px-4 py-4 text-left transition hover:bg-white/10"
                (click)="play(d)"
              >
                <span class="inline-block h-3 w-3 rounded-full" [style.background]="diffDot(d)"></span>
                <span class="flex-1 text-lg font-bold">{{ d }}</span>
                <span class="text-sm text-muted"><b class="text-white">{{ points(d) }}</b> Punkte</span>
              </button>
            }
          </div>
        </div>

        <!-- reihenfolge -->
        <div>
          <p class="px-1 text-xs uppercase tracking-wider text-muted">Reihenfolge</p>
          <ul class="mt-2 flex flex-col gap-1">
            @for (t of store.teams(); track $index) {
              <li class="flex items-center gap-2.5 rounded-lg bg-input/50 px-3 py-2 text-sm">
                <span class="text-muted">{{ $index + 1 }}</span>
                <span class="inline-block h-2.5 w-2.5 rounded-full" [style.background]="color($index)"></span>
                <span class="flex-1 font-medium" [class.text-muted]="isFinished($index)">{{ t }}</span>
                <span class="text-xs text-muted">{{ store.turnsByTeam()[$index] ?? 0 }} Züge</span>
                @if (isFinished($index)) { <span class="text-xs text-go">im Ziel</span> }
                @else if (store.currentTeam() === $index) { <span class="text-xs text-ember">am Zug</span> }
              </li>
            }
          </ul>
        </div>

        <div class="mt-auto flex gap-2 pt-2">
          <a routerLink="/leaderboard" class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-edge bg-input py-2.5 text-sm font-bold hover:bg-white/10">
            🏆 Wertung
          </a>
          <a routerLink="/setup" class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-ember py-2.5 text-sm font-bold text-white hover:bg-ember-bright">
            ↺ Neues Spiel
          </a>
        </div>
      </aside>

      <!-- ============ BOARD ============ -->
      <main class="order-1 flex-1 overflow-y-auto p-4 lg:order-2 lg:h-dvh lg:p-8">
        <div class="mx-auto max-w-3xl">
          <div class="mb-4 flex items-baseline justify-between text-sm">
            <p class="text-muted"><span class="font-semibold text-subtle">Einsatzroute</span> · Feld 1–{{ store.boardCells.length }}</p>
            <p class="text-muted">Position <b class="text-white">{{ currentPos() + 1 }}</b> / {{ store.boardCells.length }}</p>
          </div>

          <div class="grid grid-cols-6 gap-2 sm:gap-3">
            @for (c of cells(); track c.index) {
              <div class="relative aspect-square rounded-xl {{ bg(c.cell) }}" [style.boxShadow]="ring(c.index)">
                <span class="absolute left-1.5 top-1 text-[0.65rem] font-bold text-black/45 sm:text-xs">{{ pad(c.index + 1) }}</span>

                <div class="flex h-full items-center justify-center text-black/70">
                  @switch (c.icon) {
                    @case ('Beschreiben') {
                      <svg class="h-[42%] w-[42%]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    }
                    @case ('Zeichnen') {
                      <svg class="h-[42%] w-[42%]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
                      </svg>
                    }
                    @case ('Pantomime') {
                      <svg class="h-[46%] w-[46%]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="4" r="2" /><path d="M12 6v8M5 9l7 2 7-2M9 21l3-7 3 7" />
                      </svg>
                    }
                    @case ('start') {
                      <svg class="h-[46%] w-[46%]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 18h6M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z" />
                      </svg>
                    }
                    @case ('Ziel') {
                      <svg class="h-[52%] w-[52%]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
                      </svg>
                    }
                  }
                </div>

                @if (teamsAt(c.index).length > 1) {
                  <div class="absolute bottom-1 right-1 flex gap-0.5">
                    @for (ti of teamsAt(c.index); track ti) {
                      <span class="h-2 w-2 rounded-full ring-1 ring-white/70" [style.background]="color(ti)"></span>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- legend -->
          <div class="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-edge pt-4">
            @for (l of legend; track l.label) {
              <span class="flex items-center gap-2 text-sm text-subtle">
                <span class="inline-block h-3 w-3 rounded" [style.background]="l.color"></span>{{ l.label }}
              </span>
            }
          </div>
        </div>
      </main>
    </div>
  `,
})
export class Board {
  readonly store = inject(GameStore);
  private readonly router = inject(Router);
  readonly difficulties = DIFFICULTIES;

  readonly legend = [
    { label: 'Beschreiben', color: '#22c55e' },
    { label: 'Zeichnen', color: '#3b82f6' },
    { label: 'Darstellen', color: '#f97316' },
    { label: 'Start', color: '#22c55e' },
    { label: 'Ziel', color: '#eab308' },
  ];

  readonly cells = computed<Cell[]>(() => {
    const board = this.store.boardCells;
    const out: Cell[] = [];
    for (let r = 0; r < Math.ceil(board.length / 6); r++) {
      const row: Cell[] = [];
      for (let col = 0; col < 6; col++) {
        const index = r * 6 + col;
        if (index >= board.length) continue;
        const cell = board[index];
        const icon: IconKey = index === 0 ? 'start' : cell === 'Ziel' ? 'Ziel' : (cell as Mode);
        row.push({ index, cell, icon });
      }
      out.push(...(r % 2 === 1 ? row.reverse() : row));
    }
    return out;
  });

  constructor() {
    if (this.store.teams().length === 0) {
      this.router.navigate(['/setup']);
    }
    effect(() => {
      if (this.store.isOver()) this.router.navigate(['/result']);
    });
  }

  pad = (n: number) => String(n).padStart(2, '0');
  color = (team: number) => TEAM_COLORS[team % TEAM_COLORS.length];
  bg = (cell: Mode | 'Ziel') => MODE_BG[cell];
  diffDot = (d: Difficulty) => DIFF_DOT[d];
  points = (d: Difficulty) => this.store.pointsFor(d);
  isFinished = (team: number) => this.store.finished().includes(team);

  currentPos = () => this.store.positions()[this.store.currentTeam() ?? 0] ?? 0;
  currentColor = () => this.color(this.store.currentTeam() ?? 0);
  currentName = () => {
    const t = this.store.currentTeam();
    return t === null ? '—' : this.store.teams()[t];
  };
  aufgabe = () => {
    const m = this.store.currentCellMode();
    return m && m !== 'Ziel' ? MODE_DISPLAY[m as Mode] : 'Ziel';
  };
  aufgabeColor = () => MODE_DOT[this.store.currentCellMode() ?? 'Beschreiben'];

  teamsAt(index: number): number[] {
    return this.store.positions().flatMap((p, ti) => (p === index ? [ti] : []));
  }

  /** Ring an occupied cell in the occupant's colour (current team takes precedence). */
  ring(index: number): string | null {
    const teams = this.teamsAt(index);
    if (teams.length === 0) return null;
    const current = this.store.currentTeam();
    const team = current !== null && teams.includes(current) ? current : teams[0];
    return `0 0 0 3px ${this.color(team)}`;
  }

  play(d: Difficulty): void {
    this.store.startRound(d);
    this.router.navigate(['/play']);
  }
}

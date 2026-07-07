import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GameStore } from '../../core/game/game-store';
import { PERSISTENCE } from '../../core/persistence/persistence.port';

@Component({
  selector: 'fwa-setup',
  imports: [RouterLink],
  template: `
    <main class="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-6 p-6">
      <header class="text-center">
        <div class="text-6xl">🚒</div>
        <h1 class="mt-2 text-4xl font-extrabold text-ember-bright">Feuerwehr Activity</h1>
        <p class="mt-1 font-semibold text-flame">Freiwillige Feuerwehr Konstanz</p>
        <p class="mt-2 text-sm text-muted">Begriffe rund ums Löschfahrzeug — solo oder Team gegen Team</p>
      </header>

      <section class="w-full rounded-2xl border border-edge bg-card p-6 shadow-xl">
        <h2 class="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Teams</h2>
        <div class="flex flex-col gap-2">
          @for (name of teams(); track $index) {
            <div class="flex items-center gap-2">
              <span class="w-6 text-center text-lg">🚒</span>
              <input
                class="flex-1 rounded-lg border border-edge bg-input px-3 py-2.5 text-base outline-none focus:border-ember"
                [value]="name"
                (input)="rename($index, $event)"
                [attr.placeholder]="'Team ' + ($index + 1)"
              />
              @if (teams().length > 1) {
                <button
                  class="rounded-lg px-2 py-1 text-muted hover:text-ember"
                  (click)="remove($index)"
                  aria-label="Team entfernen"
                >
                  ✕
                </button>
              }
            </div>
          }
        </div>

        <button
          class="mt-3 w-full rounded-lg border border-dashed border-edge py-2 text-sm text-subtle hover:border-ember hover:text-ember"
          (click)="add()"
        >
          + Team hinzufügen
        </button>

        <div class="mt-5">
          <p class="mb-2 text-sm text-muted">Phase 3 — Platz auf dem LF</p>
          <div class="grid grid-cols-3 gap-2">
            @for (opt of phase3Options; track opt.value) {
              <button
                type="button"
                class="rounded-lg border px-2 py-2.5 text-sm font-semibold transition"
                [class.border-ember]="phase3() === opt.value"
                [class.bg-ember]="phase3() === opt.value"
                [class.text-white]="phase3() === opt.value"
                [class.border-edge]="phase3() !== opt.value"
                [class.bg-input]="phase3() !== opt.value"
                (click)="phase3.set(opt.value)"
              >
                {{ opt.label }}
              </button>
            }
          </div>
          <p class="mt-1.5 text-xs text-muted">{{ phase3Hint() }}</p>
        </div>

        @if (soloHint()) {
          <p class="mt-3 rounded-lg bg-input/60 px-3 py-2 text-xs text-subtle">
            Solo-Modus: erreicht euer Team das Ziel, wird die Rundenzahl in die Bestenliste eingetragen.
          </p>
        }

        <button
          class="mt-5 w-full rounded-xl bg-ember py-4 text-lg font-bold text-white shadow-lg transition hover:bg-ember-bright active:scale-[0.99]"
          (click)="start()"
        >
          Spiel starten
        </button>
      </section>

      <nav class="flex gap-4 text-sm text-subtle">
        <a routerLink="/leaderboard" class="hover:text-ember">🏆 Bestenliste</a>
        <a routerLink="/admin" class="hover:text-ember">⚙ Karten &amp; Einstellungen</a>
      </nav>
    </main>
  `,
})
export class Setup {
  private readonly store = inject(GameStore);
  private readonly router = inject(Router);
  private readonly persistence = inject(PERSISTENCE);

  readonly teams = signal<string[]>(['Team 1', 'Team 2']);
  readonly phase3 = signal<'off' | 'vehicle' | 'plan'>('vehicle');
  readonly soloHint = () => this.trimmed().length === 1;

  readonly phase3Options = [
    { value: 'off' as const, label: 'Aus' },
    { value: 'vehicle' as const, label: 'Am Fahrzeug' },
    { value: 'plan' as const, label: 'Am Plan' },
  ];
  readonly phase3Hint = () =>
    ({
      off: 'Nur raten — kein Platz zeigen.',
      vehicle: 'Am echten LF den Platz zeigen, Schiedsrichter bestätigt.',
      plan: 'Auf dem Bildschirm-Plan das richtige Fach antippen (automatisch geprüft).',
    })[this.phase3()];

  constructor() {
    // Pick up any admin edits made since bootstrap.
    this.store.configure(this.persistence.loadCards(), this.persistence.loadSettings());
    this.phase3.set(this.store.phase3Enabled ? this.store.phase3Mode : 'off');
  }

  rename(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.teams.update((t) => t.map((n, i) => (i === index ? value : n)));
  }

  add(): void {
    this.teams.update((t) => [...t, '']);
  }

  remove(index: number): void {
    this.teams.update((t) => t.filter((_, i) => i !== index));
  }

  private trimmed(): string[] {
    const seen = new Set<string>();
    return this.teams()
      .map((n) => n.trim())
      .filter((n) => n && !seen.has(n) && (seen.add(n), true));
  }

  start(): void {
    const names = this.trimmed();
    if (names.length === 0) return;
    const choice = this.phase3();
    this.store.startGame(names, {
      phase3Enabled: choice !== 'off',
      phase3Mode: choice === 'plan' ? 'plan' : 'vehicle',
    });
    this.router.navigate(['/testrunde']);
  }
}

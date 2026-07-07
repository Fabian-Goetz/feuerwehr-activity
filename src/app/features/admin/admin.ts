import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PERSISTENCE } from '../../core/persistence/persistence.port';
import { mergeSettings, sanitizeCards } from '../../core/persistence/local-storage.persistence';
import { Card, Compartment, DIFFICULTIES, Difficulty, MODES, Mode } from '../../core/models/card';
import { Phase3Mode, Settings } from '../../core/models/settings';
import { LfSketch } from '../../shared/lf-sketch';

const DIFF_BADGE: Record<Difficulty, string> = {
  Leicht: 'bg-go text-white',
  Mittel: 'bg-warn text-black',
  Schwer: 'bg-ember text-white',
};
const DIFF_DOT: Record<Difficulty, string> = { Leicht: '#22c55e', Mittel: '#eab308', Schwer: '#ef4444' };
const MODE_BG: Record<Mode, string> = {
  Beschreiben: 'bg-mode-beschreiben',
  Zeichnen: 'bg-mode-zeichnen',
  Pantomime: 'bg-mode-pantomime',
};

@Component({
  selector: 'fwa-admin',
  imports: [RouterLink, LfSketch],
  template: `
    <div class="mx-auto max-w-5xl p-4 sm:p-6">
      <!-- header -->
      <header class="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <a routerLink="/setup" class="flex items-center gap-1 text-sm text-subtle hover:text-ember">← Zurück</a>
        <div>
          <h1 class="text-2xl font-extrabold leading-tight">Karten &amp; Einstellungen</h1>
          <p class="text-sm text-muted">Löschfahrzeug LF · Verwaltung</p>
        </div>
        <div class="ml-auto inline-flex rounded-xl border border-edge bg-elevated p-1">
          @for (t of tabs; track t.id) {
            <button
              class="rounded-lg px-5 py-2 text-sm font-bold transition"
              [class.bg-card]="tab() === t.id"
              [class.text-white]="tab() === t.id"
              [class.text-muted]="tab() !== t.id"
              (click)="tab.set(t.id)"
            >{{ t.label }}</button>
          }
        </div>
      </header>

      @if (tab() === 'karten') {
        <div class="grid gap-4 lg:grid-cols-2">
          <!-- ===== card stack ===== -->
          <section class="rounded-2xl border border-edge bg-card">
            <div class="flex items-center justify-between border-b border-edge px-5 py-4">
              <h2 class="text-lg font-bold">Kartenstapel <span class="ml-1 text-sm font-normal text-muted">{{ cards().length }}</span></h2>
              <button class="flex items-center gap-1 rounded-lg bg-go px-3 py-1.5 text-sm font-bold text-white hover:brightness-110" (click)="resetDraft()">+ Neue Karte</button>
            </div>
            <div class="flex flex-wrap gap-2 px-5 py-3">
              @for (f of filters; track f) {
                <button
                  class="rounded-full px-3 py-1 text-xs font-bold transition"
                  [class.bg-ember]="filter() === f" [class.text-white]="filter() === f"
                  [class.bg-input]="filter() !== f" [class.text-subtle]="filter() !== f"
                  (click)="filter.set(f)"
                >{{ f }}</button>
              }
            </div>
            <ul class="max-h-[32rem] overflow-y-auto">
              @for (c of filtered(); track c.id) {
                <li>
                  <button
                    class="flex w-full items-center gap-3 border-b border-edge/50 px-5 py-3 text-left transition hover:bg-white/5"
                    [class.bg-white/10]="draftId() === c.id"
                    (click)="edit(c)"
                  >
                    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-black/70 {{ modeBg(c.mode) }}">
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        @switch (c.mode) {
                          @case ('Beschreiben') { <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> }
                          @case ('Zeichnen') { <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /> }
                          @case ('Pantomime') { <circle cx="12" cy="4" r="2" /><path d="M12 6v8M5 9l7 2 7-2M9 21l3-7 3 7" /> }
                        }
                      </svg>
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate font-bold">{{ c.term }}</span>
                      <span class="block truncate text-xs" [class.text-muted]="c.locations?.length" [class.text-ember]="!c.locations?.length">
                        {{ locLabel(c) }}
                      </span>
                    </span>
                    <span class="rounded px-2 py-0.5 text-[0.65rem] font-black uppercase {{ diffBadge(c.difficulty) }}">{{ c.difficulty }}</span>
                    @if (gCode(c); as g) {
                      <span class="rounded bg-input px-1.5 py-0.5 text-xs font-bold text-subtle">{{ g }}</span>
                    }
                  </button>
                </li>
              }
            </ul>
          </section>

          <!-- ===== editor ===== -->
          <section class="flex flex-col rounded-2xl border border-edge bg-card p-5">
            <h2 class="mb-4 text-lg font-bold">{{ draftId() ? 'Karte bearbeiten' : 'Neue Karte' }}</h2>

            <div class="grid grid-cols-2 gap-3">
              <label class="text-sm text-muted">Kategorie
                <select class="mt-1 w-full rounded-lg bg-input px-3 py-2.5 text-white" [value]="dMode()" (change)="dMode.set(pick($event))">
                  @for (m of modes; track m) { <option [value]="m">{{ m }}</option> }
                </select>
              </label>
              <label class="text-sm text-muted">Schwierigkeit
                <select class="mt-1 w-full rounded-lg bg-input px-3 py-2.5 text-white" [value]="dDiff()" (change)="dDiff.set(pickDiff($event))">
                  @for (d of difficulties; track d) { <option [value]="d">{{ d }}</option> }
                </select>
              </label>
            </div>

            <label class="mt-3 text-sm text-muted">Begriff
              <input class="mt-1 w-full rounded-lg bg-input px-3 py-2.5 text-white" [value]="dTerm()" (input)="dTerm.set(val($event))" />
            </label>

            @if (dMode() === 'Beschreiben') {
              <label class="mt-3 text-sm text-muted">Tabu-Wörter
                <input class="mt-1 w-full rounded-lg bg-input px-3 py-2.5 text-white" placeholder="Komma-getrennt" [value]="dTaboo()" (input)="dTaboo.set(val($event))" />
              </label>
            }

            <p class="mt-4 text-sm text-muted">Lagerort am LF — Fächer antippen (mehrfach möglich)</p>
            <fwa-lf-sketch [selected]="dLocs()" (pick)="toggleLoc($event)" />
            <p class="text-center text-sm text-subtle">Gewählt: <b class="text-white">{{ dLocs().length ? dLocs().join(', ') : 'keine' }}</b></p>

            <div class="mt-5 flex items-center gap-2 border-t border-edge pt-4">
              @if (draftId()) {
                <button class="flex items-center gap-1 rounded-lg bg-ember px-4 py-2.5 font-bold text-white hover:brightness-110" (click)="deleteCard()">🗑 Löschen</button>
              }
              <button class="ml-auto rounded-lg border border-edge bg-input px-4 py-2.5 font-bold hover:bg-white/10" (click)="resetDraft()">+ Neu</button>
              <button class="rounded-lg bg-go px-5 py-2.5 font-bold text-white hover:brightness-110" (click)="saveCard()">✓ Speichern</button>
            </div>
          </section>
        </div>
      } @else {
        <!-- ===== settings ===== -->
        <section class="rounded-2xl border border-edge bg-card">
          <h2 class="border-b border-edge px-5 py-4 text-lg font-bold">Einstellungen</h2>
          <div class="p-5">
            <p class="mb-2 font-bold">Zeit pro Stufe (Sekunden)</p>
            <div class="grid gap-3 sm:grid-cols-3">
              @for (d of difficulties; track d) {
                <div>
                  <p class="mb-1 flex items-center gap-1.5 text-sm">
                    <span class="inline-block h-2.5 w-2.5 rounded-full" [style.background]="diffDot(d)"></span>{{ d }}
                  </p>
                  <div class="flex items-center rounded-lg border border-edge bg-input pl-3">
                    <input type="number" min="5" class="w-full bg-transparent py-2.5 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" [value]="s().roundSeconds[d]" (input)="setTime(d, $event)" />
                    <span class="px-2 text-xs text-muted">Sek</span>
                    <div class="flex flex-col border-l border-edge">
                      <button class="px-2 text-xs leading-none text-muted hover:text-white" (click)="stepTime(d, 5)">▲</button>
                      <button class="px-2 text-xs leading-none text-muted hover:text-white" (click)="stepTime(d, -5)">▼</button>
                    </div>
                  </div>
                </div>
              }
            </div>

            <p class="mb-2 mt-5 font-bold">Punkte pro Stufe</p>
            <div class="grid gap-3 sm:grid-cols-3">
              @for (d of difficulties; track d) {
                <div>
                  <p class="mb-1 flex items-center gap-1.5 text-sm">
                    <span class="inline-block h-2.5 w-2.5 rounded-full" [style.background]="diffDot(d)"></span>{{ d }}
                  </p>
                  <div class="flex items-center rounded-lg border border-edge bg-input pl-3">
                    <input type="number" min="1" class="w-full bg-transparent py-2.5 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" [value]="s().points[d]" (input)="setPoints(d, $event)" />
                    <span class="px-2 text-xs text-muted">Pkt</span>
                    <div class="flex flex-col border-l border-edge">
                      <button class="px-2 text-xs leading-none text-muted hover:text-white" (click)="stepPoints(d, 1)">▲</button>
                      <button class="px-2 text-xs leading-none text-muted hover:text-white" (click)="stepPoints(d, -1)">▼</button>
                    </div>
                  </div>
                </div>
              }
            </div>

            <p class="mb-2 mt-6 font-bold">Spielregeln</p>
            <div class="flex items-start gap-3">
              <button
                role="switch" [attr.aria-checked]="s().phase3Enabled" (click)="togglePhase3()"
                class="relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors"
                [class.bg-go]="s().phase3Enabled" [class.bg-input]="!s().phase3Enabled"
              >
                <span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform" [style.transform]="s().phase3Enabled ? 'translateX(1.25rem)' : 'none'"></span>
              </button>
              <div>
                <p class="font-semibold">Phase 3 als Pflicht-Station</p>
                <p class="text-xs text-muted">Lagerort am LF anzeigen — sonst wird kein Fach eingeblendet.</p>
              </div>
            </div>

            @if (s().phase3Enabled) {
              <label class="mt-4 flex items-center gap-3 text-sm text-muted">
                Standard-Modus
                <select class="rounded-lg bg-input px-3 py-2 text-white" [value]="s().phase3Mode" (change)="setMode($event)">
                  <option value="vehicle">Am Fahrzeug (Schiedsrichter)</option>
                  <option value="plan">Am Plan (Fach antippen)</option>
                </select>
              </label>
            }

            <div class="mt-6 flex items-center gap-3 border-t border-edge pt-4">
              @if (savedMsg()) { <span class="text-sm text-go">{{ savedMsg() }}</span> }
              <button class="ml-auto rounded-lg bg-go px-5 py-2.5 font-bold text-white hover:brightness-110" (click)="saveSettings()">💾 Einstellungen speichern</button>
            </div>

            <!-- backup -->
            <div class="mt-6 border-t border-edge pt-4">
              <p class="mb-2 text-sm text-muted">Sichern &amp; Wiederherstellen</p>
              <div class="flex flex-wrap items-center gap-3">
                <button class="rounded-lg bg-sky px-4 py-2 font-bold text-white hover:brightness-110" (click)="exportJson()">⬇ Export (JSON)</button>
                <label class="rounded-lg border border-edge bg-input px-4 py-2 font-bold hover:bg-white/10">
                  ⬆ Import (JSON)
                  <input type="file" accept="application/json" class="hidden" (change)="importJson($event)" />
                </label>
                @if (importMsg()) { <span class="text-sm text-subtle">{{ importMsg() }}</span> }
              </div>
            </div>
          </div>
        </section>
      }
    </div>
  `,
})
export class Admin {
  private readonly persistence = inject(PERSISTENCE);
  readonly modes = MODES;
  readonly difficulties = DIFFICULTIES;
  readonly filters: ('Alle' | Mode)[] = ['Alle', ...MODES];
  readonly tabs = [
    { id: 'karten' as const, label: 'Karten' },
    { id: 'einstellungen' as const, label: 'Einstellungen' },
  ];

  readonly tab = signal<'karten' | 'einstellungen'>('karten');
  readonly s = signal<Settings>(this.persistence.loadSettings());
  readonly cards = signal<Card[]>(this.persistence.loadCards());
  readonly filter = signal<'Alle' | Mode>('Alle');
  readonly savedMsg = signal('');
  readonly importMsg = signal('');

  readonly draftId = signal<string | null>(null);
  readonly dMode = signal<Mode>('Beschreiben');
  readonly dDiff = signal<Difficulty>('Leicht');
  readonly dTerm = signal('');
  readonly dTaboo = signal('');
  readonly dLocs = signal<Compartment[]>([]);

  readonly filtered = computed(() => {
    const f = this.filter();
    return this.cards().filter((c) => f === 'Alle' || c.mode === f);
  });

  // ---- view helpers ----
  val = (e: Event) => (e.target as HTMLInputElement).value;
  pick = (e: Event) => (e.target as HTMLSelectElement).value as Mode;
  pickDiff = (e: Event) => (e.target as HTMLSelectElement).value as Difficulty;
  modeBg = (m: Mode) => MODE_BG[m];
  diffBadge = (d: Difficulty) => DIFF_BADGE[d];
  diffDot = (d: Difficulty) => DIFF_DOT[d];
  locLabel = (c: Card) =>
    c.locations?.length ? c.locations.map((l) => (/^G\d$/.test(l) ? 'Fach ' + l : l)).join(', ') : 'kein Fach';
  gCode = (c: Card): string | null => c.locations?.find((l) => /^G\d$/.test(l)) ?? null;
  toggleLoc(c: Compartment): void {
    this.dLocs.update((ls) => (ls.includes(c) ? ls.filter((x) => x !== c) : [...ls, c]));
  }

  // ---- settings ----
  setTime(d: Difficulty, e: Event): void {
    const n = Number(this.val(e));
    this.s.update((s) => ({ ...s, roundSeconds: { ...s.roundSeconds, [d]: isNaN(n) ? s.roundSeconds[d] : n } }));
  }
  stepTime(d: Difficulty, delta: number): void {
    this.s.update((s) => ({ ...s, roundSeconds: { ...s.roundSeconds, [d]: Math.max(5, s.roundSeconds[d] + delta) } }));
  }
  setPoints(d: Difficulty, e: Event): void {
    const n = Number(this.val(e));
    this.s.update((s) => ({ ...s, points: { ...s.points, [d]: isNaN(n) ? s.points[d] : n } }));
  }
  stepPoints(d: Difficulty, delta: number): void {
    this.s.update((s) => ({ ...s, points: { ...s.points, [d]: Math.max(1, s.points[d] + delta) } }));
  }
  togglePhase3(): void {
    this.s.update((s) => ({ ...s, phase3Enabled: !s.phase3Enabled }));
  }
  setMode(e: Event): void {
    const mode = (e.target as HTMLSelectElement).value as Phase3Mode;
    this.s.update((s) => ({ ...s, phase3Mode: mode }));
  }
  saveSettings(): void {
    this.persistence.saveSettings(this.s());
    this.savedMsg.set('Gespeichert ✓');
  }

  // ---- cards ----
  edit(c: Card): void {
    this.draftId.set(c.id);
    this.dMode.set(c.mode);
    this.dDiff.set(c.difficulty);
    this.dTerm.set(c.term);
    this.dTaboo.set(c.taboo.join(', '));
    this.dLocs.set(c.locations ?? []);
  }
  resetDraft(): void {
    this.draftId.set(null);
    this.dTerm.set('');
    this.dTaboo.set('');
    this.dLocs.set([]);
  }
  saveCard(): void {
    const term = this.dTerm().trim();
    if (!term) return;
    const card: Card = {
      id: this.draftId() ?? crypto.randomUUID(),
      mode: this.dMode(),
      difficulty: this.dDiff(),
      term,
      taboo: this.dMode() === 'Beschreiben' ? this.dTaboo().split(',').map((t) => t.trim()).filter(Boolean) : [],
      ...(this.dLocs().length ? { locations: this.dLocs() } : {}),
    };
    const next = this.draftId()
      ? this.cards().map((c) => (c.id === card.id ? card : c))
      : [...this.cards(), card];
    this.commit(next);
    this.edit(card);
  }
  deleteCard(): void {
    const id = this.draftId();
    if (!id) return;
    this.commit(this.cards().filter((c) => c.id !== id));
    this.resetDraft();
  }
  private commit(cards: Card[]): void {
    this.persistence.saveCards(cards);
    this.cards.set(cards);
  }

  // ---- import / export ----
  exportJson(): void {
    const data = JSON.stringify({ settings: this.s(), cards: this.cards() }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feuerwehr-activity.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  importJson(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text);
        const cards = sanitizeCards(parsed.cards);
        if (cards.length) this.commit(cards);
        if (parsed.settings) {
          const settings = mergeSettings(parsed.settings);
          this.s.set(settings);
          this.persistence.saveSettings(settings);
        }
        this.importMsg.set(`Importiert: ${cards.length} Karten.`);
      } catch {
        this.importMsg.set('Fehler: ungültige JSON-Datei.');
      }
    });
  }
}

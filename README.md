# 🚒 Feuerwehr Activity

An "Activity"-style guessing game about the equipment on a **Löschfahrzeug (LF)**, built for the
**Freiwillige Feuerwehr Konstanz**. Teams describe, draw, or mime pieces of kit — and then have to
know **where each item lives on the truck**.

**Live app:** https://fabian-goetz.github.io/feuerwehr-activity/
(installable & offline — see [Install on a tablet](#install-on-a-tablet-ipad))

It's a modern Angular rewrite of a colleague's Python/Tkinter original, keeping the real card set.

---

## How it plays

- **Board race** on a 36-field snake board. Teams advance by the points they earn; first to `Ziel`
  wins. Solo play instead records **fewest Runden bis Ziel** to a persistent Bestenliste.
- Each turn: land on a field → its **mode** decides the task, pick a **difficulty**, a card is drawn,
  and a **countdown** runs.
  - **Modes:** `Beschreiben` (describe, with Tabu-Wörter) · `Zeichnen` (draw) · `Darstellen` (mime).
  - **Difficulty → points & time:** `Leicht` 2 pts / 75 s · `Mittel` 3 / 55 s · `Schwer` 5 / 35 s
    (shorter time on harder cards makes Schwer a real gamble). All adjustable in Admin.
- **Phase 3 – the LF-placement gate.** A correct guess only advances the team if they also show
  **where the item is stowed**. Two modes (chosen at setup):
  - **Am Fahrzeug** — at the real truck; a moderator confirms Ja/Nein.
  - **Am Plan** — tap the correct **Fach** on an on-screen top-down LF sketch; auto-verified against
    the card's stored location(s). An item can live in several Fächer; tapping **any** correct one counts.
  - Wrong placement (or the clock running out during it) = **0 fields** that round.
- **Testrunde** — a non-scoring warm-up (fixed "4-Teilige Steckleiter" card) runs first so everyone
  sees the flow; skippable.
- **Admin** — edit cards (term, Tabu-Wörter, difficulty, category) and their LF locations (via the
  same sketch), tune times/points, choose the default Phase-3 mode, and **Export/Import JSON**.

---

## Tech stack

- **Angular 22** — standalone components, **signals**, **zoneless** change detection, new control flow.
- **Tailwind CSS v4** (CSS-first config, theme tokens in `src/styles.css`).
- **Vitest** for unit tests (`@angular/build:unit-test`).
- **PWA** — `@angular/service-worker` for offline + installable; `SwUpdate` shows an in-app
  "neue Version" prompt when a deploy is available.
- **Persistence:** in-browser `localStorage` behind a `PersistencePort` interface — no backend.
  The game is 100 % client-side, which is why it can run fully offline on a tablet.

### Architecture notes

- `core/game/game-store.ts` — a plain-class, **signal-based** `GameStore` holding all game state and
  rules (scoring, first-to-Ziel, turn order, skip, phase-3 gate, per-team Züge, solo result). Its deps
  are constructor-injected, so it's unit-tested **without** Angular's TestBed.
- `core/game/card-picker.ts` — random card selection with a "no repeats within the last 5" rule.
- `core/persistence/` — `PersistencePort` (DI token) + `LocalStoragePersistence` adapter. The adapter
  seeds from `core/seed/seed-cards.ts` on first run and **migrates** legacy/renamed data on load.
  Swapping in an HTTP backend later means one new adapter, nothing else changes.
- `shared/lf-sketch.ts` — the reusable top-down LF diagram (tap-to-guess in Play/Testrunde,
  multi-select in Admin).
- Feature screens under `features/`: `setup` · `testrunde` · `board` · `play` · `result` ·
  `leaderboard` · `admin` (all lazy-loaded routes).

---

## Getting started

Requires **Node 22+** and npm.

```bash
git clone https://github.com/Fabian-Goetz/feuerwehr-activity.git
cd feuerwehr-activity
npm install

npm start        # dev server → http://localhost:4200  (auto-reload)
npm test         # unit tests (Vitest); add -- --no-watch for a one-shot run
npm run build    # production build → dist/feuerwehr-activity/browser
```

> There is no global Angular CLI dependency — `npm start`/`npm test`/`npm run build` use the pinned
> local CLI. (`npm start` = `ng serve`, `npm test` = `ng test`.)

**Test on another device on the same Wi-Fi** (e.g. an iPad, dev build):

```bash
npm start -- --host 0.0.0.0        # then open http://<this-machine-ip>:4200 on the device
```

---

## Install on a tablet (iPad)

The app installs to the home screen and then runs **offline, standalone, no server**:

1. Open the [live URL](https://fabian-goetz.github.io/feuerwehr-activity/) in **Safari** (not Chrome —
   iOS only installs real PWAs from Safari).
2. **Teilen (⬆️) → Zum Home-Bildschirm.**
3. Launch from the icon. It's cached for offline use; game data (cards, scores, leaderboard) persists
   in that device's browser storage.

Held **horizontally** the "Am Plan" screen shows the sketch and controls side by side.

Data is **per-device** — use **Admin → Export/Import JSON** to move a card set between devices.

---

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with
`--base-href=/feuerwehr-activity/`, adds a `404.html` SPA fallback, and publishes to **GitHub Pages**.
Once you're running the installed PWA, a new deploy surfaces the in-app "neue Version" prompt within
~60 s of the app being open online — tap it to update.

---

## Roadmap / ideas

- Tablet-layout polish and touch-target tuning on the real device.
- **Dockerize** for a server-backed deployment (would add a real backend behind `PersistencePort`);
  needs a design decision on what persists.
- Grow the card catalogue (especially `Schwer`) and verify the seeded LF locations against the actual
  truck — the seeded Fächer are best-effort defaults from standard LF-20/LF-KatS beladung.

---

## Credits

Concept and original Python/Tkinter implementation by a colleague at FF Konstanz; card content is
theirs. This Angular PWA rewrite adds the Phase-3 LF-placement mechanic, the on-screen truck sketch,
per-difficulty timing, and offline tablet support.

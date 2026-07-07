import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <router-outlet />
    @if (updateReady()) {
      <button
        class="fixed inset-x-0 bottom-0 z-50 bg-ember px-4 py-3 text-center text-sm font-bold text-white shadow-lg"
        (click)="reload()"
      >
        Neue Version verfügbar — tippen zum Aktualisieren
      </button>
    }
  `,
})
export class App {
  private readonly sw = inject(SwUpdate);
  readonly updateReady = signal(false);

  constructor() {
    if (this.sw.isEnabled) {
      this.sw.versionUpdates
        .pipe(filter((e) => e.type === 'VERSION_READY'))
        .subscribe(() => this.updateReady.set(true));
      // check now and every 60s so a long-running kiosk picks up deploys
      this.sw.checkForUpdate();
      setInterval(() => this.sw.checkForUpdate(), 60_000);
    }
  }

  reload(): void {
    this.sw.activateUpdate().then(() => document.location.reload());
  }
}

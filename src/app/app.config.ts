import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { inject, isDevMode } from '@angular/core';
import { routes } from './app.routes';
import { PERSISTENCE } from './core/persistence/persistence.port';
import { LocalStoragePersistence } from './core/persistence/local-storage.persistence';
import { GameStore } from './core/game/game-store';
import { CardPicker } from './core/game/card-picker';
import { randomSelect, shuffleOrder } from './core/game/random';
import { DEFAULT_BOARD } from './core/models/settings';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: PERSISTENCE, useFactory: () => new LocalStoragePersistence(localStorage) },
    {
      provide: GameStore,
      useFactory: () => {
        const persistence = inject(PERSISTENCE);
        return new GameStore({
          picker: new CardPicker(randomSelect),
          cards: persistence.loadCards(),
          board: DEFAULT_BOARD,
          settings: persistence.loadSettings(),
          shuffle: shuffleOrder,
        });
      },
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};

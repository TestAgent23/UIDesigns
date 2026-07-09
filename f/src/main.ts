import { provideZoneChangeDetection } from "@angular/core";
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { SharePointUserAuthService } from './app/workspace-connect/services/sharepoint-user.service';
import { environment } from './app/environments/environment';

async function start(): Promise<void> {
  const mode = await SharePointUserAuthService.bootstrapBeforeAngular(environment);
  if (mode === 'popup-only') return;
  await platformBrowserDynamic()
    .bootstrapModule(AppModule, { applicationProviders: [provideZoneChangeDetection({ eventCoalescing: true })] });
}

start().catch((err) => console.error(err));

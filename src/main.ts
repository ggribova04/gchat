import { bootstrapApplication, provideProtractorTestingSupport } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { routes } from './app/app.routes';
import { authInterceptorProvider } from './app/shared/interceptor/auth.interceptor';
import { cookieInterceptorProvider } from './app/shared/interceptor/cookie.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideProtractorTestingSupport(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    authInterceptorProvider,
    cookieInterceptorProvider
  ]
}).catch((err) => console.error(err));
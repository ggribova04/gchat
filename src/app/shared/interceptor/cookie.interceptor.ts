/*
Активирует передачу кук при всех HTTP-запросах
Необходим для работы с аутентификацией на основе кук
*/

import { Injectable } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class CookieInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const withCredentialsReq = req.clone({ withCredentials: true });
    return next.handle(withCredentialsReq);
  }
}

export const cookieInterceptorProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: CookieInterceptor,
    multi: true
};
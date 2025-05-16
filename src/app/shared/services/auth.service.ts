import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ThemeService } from '../services/theme.service';
import { LanguageService } from './language.service';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;

  constructor(
    private router: Router,
    private http: HttpClient, 
    private themeService: ThemeService,
    private languageService: LanguageService
  ) {}

  // Сохранение данных аутентификации
  saveAuthData(authData: any): void {
    try {
      const theme = authData.settings?.theme || authData.theme || 'light';
      const userData = {
        id: authData.userId,
        nickName: authData.userName,
        settings: {
          theme: theme,
          language: authData.settings?.language || 'ru',
          photoUrl: authData.settings?.photoUrl || ''
        }
      };
  
      // Сохраняем токен и данные в сессии
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user_data', JSON.stringify(userData));

      this.languageService.setLanguage(userData.settings.language);
  
      this.themeService.setTheme(theme);
    } catch (e) {
      console.error('Auth error', e);
    }
  }

  // Проверка авторизации
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // Выход из системы
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    
    this.router.navigate(['']);
  }

  // Получаем ID пользователя
  getUserIdFromLocalStorage(): number {
    try {
      const userData = localStorage.getItem('user_data');
      if (!userData) return 0;
      
      const parsed = JSON.parse(userData);
      return parsed?.id || 0;
    } catch {
      return 0;
    }
  }

  // Получение всех данных пользователя
  getUserData(): any {
    try {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  // Получение языка
  getCurrentLanguage(): string {
    try {
      const userData = this.getUserData();
      return userData?.settings?.language || 'ru';
    } catch {
      return 'ru';
    }
  }

  // Авторизация
  login(credentials: { userName: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials);
  }

  // Регистрация
  register(userData: {
    nickName: string;
    userName: string;
    password: string;
    confirmPassword: string;
    language: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }
}
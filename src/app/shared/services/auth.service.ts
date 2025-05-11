import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ThemeService } from '../services/theme.service';
import { isPlatformBrowser } from '@angular/common';
import { LanguageService } from './language.service';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private isBrowser: boolean;

  constructor(
    private router: Router,
    private http: HttpClient, 
    private themeService: ThemeService,
    private languageService: LanguageService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // Сохранение данных аутентификации
  saveAuthData(authData: any): void {
    if (!this.isBrowser) return;

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
    if (!this.isBrowser) return false;
    return !!localStorage.getItem('token');
  }

  // Выход из системы
  logout(): void {
    if (!this.isBrowser) return;

    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    
    this.router.navigate(['']);
  }

  // Получаем ID пользователя
  getUserIdFromLocalStorage(): number {
    if (!this.isBrowser) return 0;

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
    if (!this.isBrowser) return null;

    try {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  // Получение языка
  getCurrentLanguage(): string {
    if (!this.isBrowser) return 'ru';
    
    try {
      const userData = this.getUserData();
      return userData?.settings?.language || 'ru';
    } catch {
      return 'ru';
    }
  }

  // Авторизация
  async login(credentials: { userName: string; password: string }): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.http.post<any>(`${this.apiUrl}/login`, credentials)
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Регистрация
  async register(userData: {
    nickName: string;
    userName: string;
    password: string;
    confirmPassword: string;
    language: string;
  }): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.http.post<any>(`${this.apiUrl}/register`, userData)
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
}
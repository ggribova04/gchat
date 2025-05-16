import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<AppTheme>('light');
  currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const theme = this.detectTheme();
    this.apply(theme);
    this.currentThemeSubject.next(theme);
  }

  private detectTheme(): AppTheme {
    try {
      // Проверяем явное сохранение темы
      const explicitTheme = localStorage.getItem('theme');
      if (explicitTheme === 'dark') return 'dark';
      
      // Проверяем данные пользователя (учитываем вложенность settings)
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        // Проверяем оба варианта
        if (parsed.settings?.theme === 'dark') return 'dark';
        if (parsed.theme === 'dark') return 'dark';
      }
    } catch (e) {
      console.error('Theme detection error', e);
    }
    return 'light';
  }

  setTheme(theme: AppTheme): void {
    this.apply(theme);
    this.currentThemeSubject.next(theme);
    
    try {
      // Сохраняем в трёх местах для максимальной надежности
      localStorage.setItem('theme', theme);
      
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        // Обновляем theme в обоих возможных местах
        parsed.theme = theme;
        if (parsed.settings) {
          parsed.settings.theme = theme;
        }
        localStorage.setItem('user_data', JSON.stringify(parsed));
      }
    } catch (e) {
      console.error('Theme save error', e);
    }
  }

  private apply(theme: AppTheme): void {
    const html = document.documentElement;
    html.classList.remove('light-theme', 'dark-theme');
    html.classList.add(`${theme}-theme`);
  }

  get currentTheme(): AppTheme {
    return this.currentThemeSubject.value;
  }

  updateThemeFromUserData(userData: any): void {
    const theme = userData?.theme === 'dark' ? 'dark' : 'light';
    this.setTheme(theme);
  }
}
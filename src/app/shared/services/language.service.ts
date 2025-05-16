import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, of, Observable, Subscription } from 'rxjs';
import { catchError, tap, finalize, map } from 'rxjs/operators';
import { BAD_WORDS } from '../../constants/bad-words';

@Injectable({
  providedIn: 'root'
})
export class LanguageService implements OnDestroy {
  private currentLanguageSubject = new BehaviorSubject<string>('ru');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();
  private translations: any = {};
  private translationSub?: Subscription;

  private translationCache = new Map<string, string>();
  private readonly cacheStorageKey = 'translationCache';

  constructor(
    private http: HttpClient
  ) {
    this.loadTranslations('ru');
      
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang) {
      this.setLanguage(savedLang);
    }

    this.loadCacheFromStorage();
  }

  ngOnDestroy(): void {
    if (this.translationSub) {
      this.translationSub.unsubscribe();
    }
  }
  // Загружаем кеш из localStorage
  private loadCacheFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.cacheStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string>;
        this.translationCache = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load translation cache', error);
    }
  }

  // Сохраняем кеш в localStorage
  private saveCacheToStorage(): void {
    try {
      const obj = Object.fromEntries(this.translationCache);
      localStorage.setItem(this.cacheStorageKey, JSON.stringify(obj));
    } catch (error) {
      console.warn('Failed to save translation cache', error);
    }
  }
  // Переводим текст MyMemory Translation API
  translateText(text: string, targetLang: string): Observable<string> {
    const cleanedText = text?.trim() ?? '';
    if (!cleanedText || targetLang === 'ru') {
      return of(cleanedText);
    }

    // Кеширование
    const cacheKey = `${cleanedText}|${targetLang}`;

    // Проверяем кеш перед выполнением запроса
    if (this.translationCache.has(cacheKey)) {
      return of(this.translationCache.get(cacheKey)!);
    }

    const params = new HttpParams()
      .set('q', cleanedText)
      .set('langpair', `ru|${targetLang}`);

    return this.http.get<{responseData: {translatedText: string}}>(
      '/translate-api/get',
      { params }
    ).pipe(
      map(response => {
        const translatedText = response.responseData.translatedText;
        
        // Сохраняем в кеш перед возвратом
        this.translationCache.set(cacheKey, translatedText);
        this.saveCacheToStorage();
        
        return translatedText;
      }),
      catchError(error => {
        console.error('Translation error', error);
        return of(cleanedText);
      })
    );
  }

  // Цензура
  censorText(text: string): string {
    const badwords: string[] = BAD_WORDS;

    return badwords.reduce((censored, pattern) => {
      const regex = new RegExp(pattern, 'gi');
      return censored.replace(regex, match => '*'.repeat(match.length));
    }, text);
  }

  // Загрузка переводов
  private loadTranslations(lang: string): void {
    if (this.translationSub) {
      this.translationSub.unsubscribe();
    }

    this.translationSub = this.http.get(`/assets/i18n/${lang}.json`).pipe(
      tap(translations => {
        this.translations = translations;
      }),
      catchError(() => {
        console.error(`Failed to load ${lang} translations`);
        return of({}); 
      }),
      finalize(() => {
        this.translationSub = undefined; // Очищаем подписку после завершения
      })
    ).subscribe();
  }

  setLanguage(lang: string): void {
    if (['ru', 'en'].includes(lang)) {
      this.loadTranslations(lang);
      this.currentLanguageSubject.next(lang);
      localStorage.setItem('preferredLanguage', lang);
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  translate(key: string, params?: any): string {
    const keys = key.split('.');
    let result = this.translations;
    
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) return key;
    }

    if (params && typeof result === 'string') {
      for (const param in params) {
        result = result.replace(`{{${param}}}`, params[param]);
      }
    }

    return result || key;
  }

  toggleLanguage(): void {
    const newLang = this.currentLanguageSubject.value === 'ru' ? 'en' : 'ru';
    this.setLanguage(newLang);
  }
}
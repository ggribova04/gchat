import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of, Observable, Subscription } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { BAD_WORDS } from '../../constants/bad-words';

@Injectable({
  providedIn: 'root'
})
export class LanguageService implements OnDestroy {
  private currentLanguageSubject = new BehaviorSubject<string>('ru');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();
  private translations: any = {};
  private translationSub?: Subscription;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadTranslations('ru');
      
      const savedLang = localStorage.getItem('preferredLanguage');
      if (savedLang) {
        this.setLanguage(savedLang);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.translationSub) {
      this.translationSub.unsubscribe();
    }
  }

  // Переводим текст
  translateText(text: string, targetLang: string): Observable<string> {
    if (targetLang === 'ru') {
        return of(text);
    }

    // Расширенный словарь переводов (в нижнем регистре)
    const mockTranslations: {[key: string]: string} = {
        'привет': 'hello',
        'здравствуйте': 'hello',
        'пока': 'goodbye',
        'до свидания': 'goodbye',
        'как дела': 'how are you',
        'как ты': 'how are you',
        'спасибо': 'thank you',
        'благодарю': 'thank you',
    };

    // Сохраняем оригинальный регистр для каждого слова
    const originalWords = text.split(/(\s+)/).filter(part => part.trim().length > 0);
    
    // Проверяем полную фразу
    const lowerText = text.toLowerCase();
    if (mockTranslations[lowerText]) {
        return of(this.applyOriginalCase(text, mockTranslations[lowerText]));
    }

    // Разбиваем на части с сохранением пунктуации
    const phrases = this.splitIntoSentences(text);
    let hasTranslation = false;
    
    const translatedPhrases = phrases.map(phrase => {
        const trimmedPhrase = phrase.trim();
        if (!trimmedPhrase) return phrase;
        
        const lowerPhrase = trimmedPhrase.toLowerCase();
        if (mockTranslations[lowerPhrase]) {
            hasTranslation = true;
            return this.applyOriginalCase(trimmedPhrase, mockTranslations[lowerPhrase]);
        }
        
        // Попробуем перевести отдельные слова
        const words = this.splitIntoWords(trimmedPhrase);
        const translatedWords = words.map(word => {
            const lowerWord = word.toLowerCase();
            return mockTranslations[lowerWord] || word;
        });
        
        if (translatedWords.some(w => mockTranslations[w.toLowerCase()])) {
            hasTranslation = true;
        }
        
        return this.reconstructPhrase(trimmedPhrase, translatedWords);
    });

    if (!hasTranslation) {
        return of(`${text} [translated to ${targetLang}]`);
    }

    const translatedText = translatedPhrases.join(' ');
    return of(this.fixFinalPunctuation(text, translatedText));
  }

  private splitIntoSentences(text: string): string[] {
    // Разбиваем с сохранением пунктуации
    return text.split(/([!?.,]\s*)/).filter(part => part.trim().length > 0);
  }

  private splitIntoWords(phrase: string): string[] {
    // Разбиваем на слова с сохранением апострофов и дефисов
    return phrase.split(/([\s'-]+)/).filter(part => part.trim().length > 0);
  }

  private applyOriginalCase(original: string, translated: string): string {
    if (!original || !translated) return translated;
    
    // Полностью сохраняем регистр оригинала
    if (original === original.toUpperCase()) {
        return translated.toUpperCase();
    }
    
    if (original === original.toLowerCase()) {
        return translated.toLowerCase();
    }
    
    if (this.isCapitalized(original)) {
        return this.capitalizeFirstLetter(translated);
    }
    
    return this.preserveMixedCase(original, translated);
  }

  private isCapitalized(word: string): boolean {
    return word[0] === word[0].toUpperCase() && 
           word.slice(1) === word.slice(1).toLowerCase();
  }

  private capitalizeFirstLetter(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  private preserveMixedCase(original: string, translated: string): string {
    // Простейшая реализация - сохраняем только первую букву
    return this.capitalizeFirstLetter(translated);
  }

  private reconstructPhrase(original: string, translatedWords: string[]): string {
    // Восстанавливаем оригинальные пробелы и пунктуацию
    const originalParts = original.split(/(\s+)/);
    let result = '';
    
    for (let i = 0; i < Math.min(originalParts.length, translatedWords.length); i++) {
        result += translatedWords[i] + (originalParts[i].match(/\s+$/) || '');
    }
    
    return result;
  }

  private fixFinalPunctuation(original: string, translated: string): string {
    // Сохраняем пунктуацию конца предложения
    const lastChar = original.trim().slice(-1);
    if (['!', '?', '.'].includes(lastChar)) {
        return translated.replace(/[!?.]*$/, '') + lastChar;
    }
    return translated;
  }

  // Цензура
  censorText(text: string): string {
    if (!isPlatformBrowser(this.platformId)) return text;
    const badwords = BAD_WORDS[this.currentLanguageSubject.value as keyof typeof BAD_WORDS] || [];

    return badwords.reduce((censored, pattern) => {
      const regex = new RegExp(pattern, 'gi');
      return censored.replace(regex, match => '*'.repeat(match.length));
    }, text);
  }

  // Загрузка переводов
  private loadTranslations(lang: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

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
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';
import { Message } from '../../shared/models/message.models';
import { LanguageService } from './language.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/api/chat`;

  constructor(
    private http: HttpClient,
    private languageService: LanguageService
  ) {}

  // Получаем сообщения
  getMessages(): Observable<Message[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Message[]>(this.apiUrl, { headers }).pipe(
      switchMap(messages => this.translateMessages(messages)) // Преобразование полученных сообщений
    );
  }

  // Отправка сообщения
  sendMessage(message: Message): Observable<Message> {
    const headers = this.getAuthHeaders();
    // Применяем цензуру перед отправкой
    message.message = this.languageService.censorText(message.message);
    return this.http.post<Message>(this.apiUrl, message, { headers });
  }

  // Перевод сообщений
  private translateMessages(messages: Message[]): Observable<Message[]> {
    const currentLang = this.languageService.getCurrentLanguage();
    
    // Если текущий язык - русский, не переводим
    if (currentLang === 'ru') {
      return of(messages);
    }

    // Создаем массив Observable для перевода каждого сообщения
    const translationObservables = messages.map(message => 
      this.languageService.translateText(message.message, currentLang).pipe(
        map(translatedText => ({
          ...message,
          displayMessage: translatedText,
          originalMessage: message.message
        }))
      )
    );

    return forkJoin(translationObservables); // параллельное выполнение переводов
  }

  // Получаем токен авторизации
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Токен отсутствует');
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }
}
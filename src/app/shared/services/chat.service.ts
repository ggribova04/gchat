import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of, Subject } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';
import { Message } from '../../shared/models/message.models';
import { LanguageService } from './language.service';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/api/chat`;
  private hubConnection: signalR.HubConnection | null = null;
  private messageSubject = new Subject<Message>();

  constructor(
    private http: HttpClient,
    private languageService: LanguageService
  ) {
    this.initWebSocket();
  }

  private initWebSocket(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/chatHub`, {
        accessTokenFactory: () => localStorage.getItem('token') || ''
      })
      .build();

    this.hubConnection.start()
      .catch(err => console.error('Error while starting connection' + err));

    this.hubConnection.on('ReceiveMessage', (message) => {
      if (message.isLocal) return;

      const currentLang = this.languageService.getCurrentLanguage();
      // Если язык не русский и сообщение не переведено - переводим
      if (currentLang !== 'ru' && !message.isTranslated) {
        this.languageService.translateText(message.message, currentLang).subscribe(
          translatedText => {
            this.messageSubject.next({
              ...message,
              displayMessage: translatedText,
              isTranslated: true
            });
          }
        );
      } else {
        this.messageSubject.next(message);
      }
    
    });
  }

  getMessages(): Observable<Message[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Message[]>(this.apiUrl, { headers }).pipe(
      switchMap(messages => this.translateMessages(messages)) // Преобразование полученных сообщений
    );
  }

  getRealTimeMessages(): Observable<Message> {
    return this.messageSubject.asObservable();
  }

  sendMessage(message: Message): Observable<Message> {
    const headers = this.getAuthHeaders();
    
    // Применяем цензуру
    const censoredMessage = this.languageService.censorText(message.message);
    
    // Подготавливаем сообщение для сохранения
    const messageToSave = {
      ...message,
      message: censoredMessage,
      originalMessage: censoredMessage,
      language: 'ru',
    };

    return this.http.post<Message>(this.apiUrl, messageToSave, { headers });
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
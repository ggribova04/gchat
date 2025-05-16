import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { ChatService } from '../../shared/services/chat.service';
import { ThemeService } from '../../shared/services/theme.service';
import { Message } from '../../shared/models/message.models';
import { UserService } from '../../shared/services/user.service';
import { LanguageService } from '../../shared/services/language.service';

@Component({
  selector: 'app-main-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  
  messages: Message[] = [];
  messageText: string = '';
  userId!: number;
  id!:number;
  currentLanguage: string = 'ru';

  private shouldScrollToBottom = true;

  private subscription = new Subscription();
  private scrollListener?: () => void;

  constructor(
    public authService: AuthService, 
    private chatService: ChatService,
    private router: Router,
    private themeService: ThemeService,
    private userService: UserService,
    public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserIdFromLocalStorage();
    this.loadMessages();
    this.setupScrollListener();

    // Подписка на SignalR
    const signalRSub = this.chatService.getRealTimeMessages().subscribe((message) => {
      this.messages.push({
        ...message,
        displayMessage: message.displayMessage || message.message
      });
      this.scrollToBottomAfterRender();
    });

    this.subscription.add(signalRSub);
  }

  ngAfterViewInit() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    
    // Удаляем слушатель скролла
    if (this.scrollListener && this.messageContainer?.nativeElement) {
      this.messageContainer.nativeElement.removeEventListener('scroll', this.scrollListener);
    }
  }

  // Загружаем все сообщения из чата
  loadMessages(): void {
    const sub = this.chatService.getMessages().subscribe(
      (data) => {
        this.messages = data;
        this.scrollToBottomAfterRender();
      },
      (error) => console.error('Error loading messages', error)
    );
    this.subscription.add(sub);
  }

  // Отправка сообщения
  sendMessage(): void {
    const trimmedMessage = this.messageText.trim();

    if (trimmedMessage) {
      const newMessage: Message = {
        id: this.id,
        userId: this.userId,
        message: trimmedMessage,
        originalMessage: this.currentLanguage,
        displayMessage: trimmedMessage
      };
      
      const sub = this.chatService.sendMessage(newMessage).subscribe({
        next: () => {
          this.messageText = '';
          this.scrollToBottomAfterRender();
          this.resetTextareaHeight();
        },
        error: (error) => {
          console.error('Error send message', error);
        }
      });
      this.subscription.add(sub);
    }
  }

  // Обработчик отправки сообщения нажатием на Enter
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
    // Если нажат Shift+Enter - будет обычный перенос строки
  }

  // Методы для работы со скроллом
  private setupScrollListener(): void {
    if (this.messageContainer?.nativeElement) {
      this.scrollListener = () => {
        const container = this.messageContainer.nativeElement;
        const threshold = 100;
        this.shouldScrollToBottom = 
          container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
      };
      
      this.messageContainer.nativeElement.addEventListener('scroll', this.scrollListener);
    }
  }

  private scrollToBottom(smooth: boolean = true): void {
    if (!this.messageContainer?.nativeElement) return;
    
    try {
      const container = this.messageContainer.nativeElement;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    } catch(err) {
      console.error('Scroll error', err);
    }
  }

  // Прокрутка после обновления DOM
  private scrollToBottomAfterRender(): void {
    setTimeout(() => {
      this.shouldScrollToBottom = true;
      this.scrollToBottom();
    }, 0);
  }

  // Сбрасываем высоту
  private resetTextareaHeight(): void {
    if (this.messageInput?.nativeElement) {
      this.messageInput.nativeElement.style.height = 'auto';
    }
  }

  // Переход в лк юзера
  goUserProfile(){
    this.router.navigate(['/profile']);
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout(): void {
    this.authService.logout();
  }

  translate(key: string): string {
    return this.languageService.translate(key);
  }
}
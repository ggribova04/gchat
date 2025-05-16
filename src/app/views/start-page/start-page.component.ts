import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import { LanguageService } from '../../shared/services/language.service';


@Component({
  selector: 'app-start-page',
  standalone: true,
  imports: [CommonModule, AuthModalComponent],
  templateUrl: './start-page.component.html',
  styleUrls: ['./start-page.component.scss']
})
export class StartPageComponent {
  isModalOpen = false;
  modalMode: 'login' | 'register' = 'login';

  constructor(public languageService: LanguageService) {}

  // Открытие модального окна
  openModal(mode: 'login' | 'register'): void {
    this.modalMode = mode;
    this.isModalOpen = true;
  }

  // Закрытие модального окна
  closeModal(): void {
    this.isModalOpen = false;
  }

  // Обработчик выбора языка
  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  get currentLanguage(): string {
    return this.languageService.getCurrentLanguage();
  }

  translate(key: string): string {
    return this.languageService.translate(key);
  }
}

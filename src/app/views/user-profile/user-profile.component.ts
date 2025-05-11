import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserService } from '../../shared/services/user.service';
import { User, AppTheme } from '../../shared/models/user.model';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../shared/services/theme.service';
import { ChangePasswordComponent } from '../change-password/change-password.component';
import { LanguageService } from '../../shared/services/language.service';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ChangePasswordComponent],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  user: User = {
    id: 0,
    nickName: '',
    settings: {
      photoUrl: '',
      theme: 'light',
      language: 'ru'
    }
  };
  
  profileForm: FormGroup = new FormGroup({
    nickName: new FormControl(''),
    theme: new FormControl('light'),
    language: new FormControl('ru')
  });
  
  isEditing = false;
  isPasswordModalOpen = false;
  selectedFile: File | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private userService: UserService,
    private router: Router,
    public authService: AuthService,
    private themeService: ThemeService,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.setupThemeListener();
    this.setupLanguageListener();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Загрузка профиля
  loadProfile(): void {
    const sub = this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        // Устанавливаем темы и язык профиля
        const currentTheme: AppTheme = (user.settings?.theme === 'dark' ? 'dark' : 'light');
        const currentLanguage = user.settings?.language || 'ru';
        
        // Заполнение формы данными из БД
        this.profileForm.patchValue({
          nickName: user.nickName ?? '',
          theme: currentTheme,
          language: currentLanguage
        });
        
        // Язык и тема меняются без режима редактирования
        this.profileForm.get('theme')?.enable();
        this.profileForm.get('language')?.enable();
        
        // Применяем настройки
        this.themeService.setTheme(currentTheme);
        this.languageService.setLanguage(currentLanguage as 'ru' | 'en');
  
        // Изменение никнейма только в режиме редактирования
        if (!this.isEditing) {
          this.profileForm.get('nickName')?.disable();
        } else {
          this.profileForm.get('nickName')?.enable();
        }
      },
      error: (err) => console.error('Load profile error', err)
    });
    
    this.subscriptions.push(sub);
  }

  // Управление редактированием никнейма
  enableEditing(): void {
    this.isEditing = true;
    this.profileForm.get('nickName')?.enable();
  }

  // Сохранение данных
  saveChanges(): void {
    const { nickName, theme, language } = this.profileForm.value;

    // Отправляем на сервер
    const sub1 = this.userService.updateNickName({ newNickName: nickName }).subscribe();
    const sub2 = this.userService.updateTheme({ theme }).subscribe();
    const sub3 = this.userService.updateLanguage({ language }).subscribe();
    
    this.subscriptions.push(sub1, sub2, sub3);

    // Убираем возможность редактирования поля "Никнейм"
    this.isEditing = false;
    this.profileForm.get('nickName')?.disable();
  }

  // Методы для смены аватара
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadAvatar();
    }
  }

  uploadAvatar(): void {
    if (this.selectedFile) {
      const sub = this.userService.uploadAvatar(this.selectedFile).subscribe({
        next: (res) => {
          this.user.settings.photoUrl = res.photoUrl;
          this.selectedFile = null;
        },
        error: (err) => console.error('Upload avatar error', err)
      });
      
      this.subscriptions.push(sub);
    }
  }

  removeAvatar(): void {
    const sub = this.userService.removeAvatar().subscribe({
      next: () => this.user.settings.photoUrl = '',
      error: (err) => console.error('Remove avatar error', err)
    });
    
    this.subscriptions.push(sub);
  }

  // Слушатель языка
  private setupLanguageListener(): void {
    const sub = this.profileForm.get('language')?.valueChanges.subscribe((lang: string) => {
      this.languageService.setLanguage(lang);
      
      // Обновление локальных данных пользователя
      const userData = this.authService.getUserData();
      if (userData) {
        userData.settings.language = lang;
        localStorage.setItem('user_data', JSON.stringify(userData));
      }
      
      // Отправка на сервер
      const updateSub = this.userService.updateLanguage({ language: lang }).subscribe();
      this.subscriptions.push(updateSub);
    });
    
    if (sub) {
      this.subscriptions.push(sub);
    }
  }

  // Слушатель темы
  private setupThemeListener(): void {
    const sub = this.profileForm.get('theme')?.valueChanges.subscribe((theme: AppTheme) => {
      this.themeService.setTheme(theme);
      
      const userData = this.authService.getUserData();
      if (userData) {
        userData.settings.theme = theme;
        localStorage.setItem('user_data', JSON.stringify(userData));
      }
      
      const updateSub = this.userService.updateTheme({ theme }).subscribe();
      this.subscriptions.push(updateSub);
    });
    
    if (sub) {
      this.subscriptions.push(sub);
    }
  }

  // Переход на главный экран
  goBack(): void {
    this.router.navigate(['/']);
  }
}

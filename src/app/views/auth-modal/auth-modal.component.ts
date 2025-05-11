import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { LanguageService } from '../../shared/services/language.service';

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class AuthModalComponent implements OnDestroy {
  @Input() mode: 'login' | 'register' = 'login';
  @Output() close = new EventEmitter<void>();
  @Output() authSuccess = new EventEmitter<any>();

  loginForm: FormGroup;
  registerForm: FormGroup;
  passwordMismatch = false;
  errorMessage: string | null = null;

  private passwordSubscriptions: any[] = [];
  
  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private authService: AuthService,
    public languageService: LanguageService
  ) {
    this.loginForm = this.fb.group({
      userName: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      nickName: ['', [Validators.required]],
      userName: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });

    // Подписка на изменения паролей для проверки совпадения
    const passwordSub = this.registerForm.get('password')?.valueChanges.subscribe(() => {
      this.checkPasswordMatch();
    });
    if (passwordSub) this.passwordSubscriptions.push(passwordSub);

    const confirmPasswordSub = this.registerForm.get('confirmPassword')?.valueChanges.subscribe(() => {
      this.checkPasswordMatch();
    });
    if (confirmPasswordSub) this.passwordSubscriptions.push(confirmPasswordSub);
  }

  // Отписываемся от всех подписок
  ngOnDestroy() {
    this.passwordSubscriptions.forEach(sub => sub.unsubscribe());
  }
  
  // Валидатор для проверки совпадения паролей
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // Проверка совпадения паролей
  private checkPasswordMatch(): void {
    const password = this.registerForm.get('password')?.value;
    const confirmPassword = this.registerForm.get('confirmPassword')?.value;
    this.passwordMismatch = password !== confirmPassword;
  }
  
  // Переключатель режимов
  switchMode(mode: 'login' | 'register'): void {
    this.mode = mode;
    this.errorMessage = null;
    this.passwordMismatch = false;
  }

  // Обработчик закрытия модального окна
  onClose(): void {
    this.close.emit();
    this.loginForm.reset();
    this.registerForm.reset();
    this.passwordMismatch = false;
    this.errorMessage = null;
  }

  // Обработчик отправки формы
  async onSubmit(): Promise<void> {
    if (this.mode === 'login') {
      await this.handleLogin();
    } else {
      await this.handleRegister();
    }
  }

  // Авторизация пользователя
  private async handleLogin(): Promise<void> {
    if (!this.loginForm.valid) return;
  
    this.errorMessage = null;
  
    try {
      const response = await this.authService.login(this.loginForm.value);
  
      this.authService.saveAuthData(response);
      this.authSuccess.emit({ id: response.userId, nickName: response.userName });
      this.router.navigate(['/chat']);

    } catch (error: any) {
      console.error('Login error', error);
      this.errorMessage = this.languageService.getCurrentLanguage() === 'en' 
      ? 'error' 
      : this.languageService.translate(error.error?.error);
    }
  }

  // Регистрация пользвоателя
  private async handleRegister(): Promise<void> {
    if (!this.registerForm.valid || this.passwordMismatch) return;
  
    this.errorMessage = null;
  
    const formData = {
      nickName: this.registerForm.value.nickName,
      userName: this.registerForm.value.userName,
      password: this.registerForm.value.password,
      confirmPassword: this.registerForm.value.confirmPassword,
      language: this.languageService.getCurrentLanguage()
    };
  
    try {
      const response = await this.authService.register(formData);
  
      this.authService.saveAuthData(response);
      this.authSuccess.emit({ id: response.userId, nickName: response.userName });
      this.router.navigate(['/chat']);
      
    } catch (error: any) {
      console.error('Registration error', error);
      this.errorMessage = this.languageService.getCurrentLanguage() === 'en' 
      ? 'error' 
      : this.languageService.translate(error.error?.error);
    }
  }
}
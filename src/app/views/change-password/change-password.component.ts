import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LanguageService } from '../../shared/services/language.service';
import { UserService } from '../../shared/services/user.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnDestroy {
  @Output() close = new EventEmitter<void>();
  @Output() passwordChanged = new EventEmitter<void>();

  passwordForm: FormGroup = new FormGroup({
    currentPassword: new FormControl('', Validators.required),
    newPassword: new FormControl('', Validators.required),
    confirmPassword: new FormControl('', Validators.required),
  });

  private subscriptions: Subscription[] = [];

  constructor(
    public languageService: LanguageService,
    private userService: UserService
  ) {}

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Закрытие модального окна
  onClose(): void {
    this.close.emit();
  }

  // Отправка формы
  onSubmit(): void {
    if (this.passwordForm.invalid) return;
  
    const dto = this.passwordForm.value;
  
    const changePasswordSub = this.userService.changePassword(dto).subscribe({
      next: () => {
        alert(this.languageService.translate('PASSWORD_CHANGED_SUCCESS'));
        this.passwordChanged.emit();
        this.onClose();
      },
      error: (err) => {
        console.error('Change password error', err);
        alert(err.error?.message || this.languageService.translate('PASSWORD_CHANGE_ERROR'));
      }
    });

    this.subscriptions.push(changePasswordSub);
  }
}
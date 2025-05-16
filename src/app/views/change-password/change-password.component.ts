import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors, } from '@angular/forms';
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

  errorMessage: string | null = null;

  passwordForm: FormGroup;

  private subscription = new Subscription();

  constructor(
    public languageService: LanguageService,
    private userService: UserService
  ) {
    this.passwordForm = new FormGroup({
      currentPassword: new FormControl('', Validators.required),
      newPassword: new FormControl('', Validators.required),
      confirmPassword: new FormControl('', Validators.required),
    }, { validators: this.passwordsMatchValidator });

    const newPassSub = this.passwordForm.get('newPassword')?.valueChanges.subscribe(() => {
      this.passwordForm.updateValueAndValidity({ onlySelf: true });
    });

    const confirmPassSub = this.passwordForm.get('confirmPassword')?.valueChanges.subscribe(() => {
      this.passwordForm.updateValueAndValidity({ onlySelf: true });
    });

    if (newPassSub) this.subscription.add(newPassSub);
    if (confirmPassSub) this.subscription.add(confirmPassSub);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // Закрытие модального окна
  onClose(): void {
    this.close.emit();
  }

  // Отправка формы
  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const dto = this.passwordForm.value;

    const changePasswordSub = this.userService.changePassword(dto).subscribe({
      next: () => {
        alert(this.translate('PASSWORD_CHANGED_SUCCESS'));
        this.passwordChanged.emit();
        this.onClose();
      },
      error: (err) => {
        console.error('Change password error', err);
        this.errorMessage = err.error?.message || this.translate('PASSWORD_CHANGE_ERROR');
      }
    });

    this.subscription.add(changePasswordSub);
  }

  passwordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordsMismatch: true };
  };

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  get form() {
    return this.passwordForm.controls;
  }
}
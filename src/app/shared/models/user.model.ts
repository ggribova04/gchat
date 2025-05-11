export interface User {
  id: number;
  nickName: string;
  settings: UserSettings;
}

export type AppTheme = 'light' | 'dark';

export interface UserSettings {
  theme: AppTheme;
  language: string;
  photoUrl: string;
}

export interface UpdateNickNameDto {
  newNickName: string;
}

export interface UpdateThemeDto {
  theme: string;
}

export interface UpdateLanguageDto {
  language: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
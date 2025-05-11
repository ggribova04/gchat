import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/user`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }

  updateNickName(dto: { newNickName: string }): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/nickname`, dto);
  }

  updateTheme(dto: { theme: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/theme`, dto);
  }

  updateLanguage(dto: { language: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/language`, dto);
  }

  changePassword(dto: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/change-password`, dto);
  }

  uploadAvatar(file: File): Observable<{ photoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ photoUrl: string }>(`${this.apiUrl}/avatar`, formData);
  }

  removeAvatar(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/avatar`);
  }
}
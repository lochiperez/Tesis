import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private api = 'http://localhost:4000/api/usuarios';
  private isBrowser: boolean;

  constructor(
    private httpClient: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  getUsuarios(): Observable<any> {
    return this.httpClient.get(this.api);
  }

  register(userData: any): Observable<any> {
    return this.httpClient.post(`${this.api}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.httpClient.post(`${this.api}/login`, credentials);
  }

  updateProfile(userData: any): Observable<any> {
    return this.httpClient.put(`${this.api}/profile`, userData);
  }

  getProfile(): Observable<any> {
    return this.httpClient.get(`${this.api}/profile`);
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    const currentUser = sessionStorage.getItem('currentUser');
    const userId = sessionStorage.getItem('userId');
    return !!(currentUser && userId);
  }

  saveUserData(user: any, token?: string): void {
    if (!this.isBrowser) {
      return;
    }
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    sessionStorage.setItem('userId', user.id || user.uid);
    if (token) {
      sessionStorage.setItem('authToken', token);
    }
  }

  logout(): void {
    if (!this.isBrowser) {
      return;
    }
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('routeHistory');
  }

  getCurrentUser(): any {
    if (!this.isBrowser) {
      return null;
    }
    const userStr = sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }
}
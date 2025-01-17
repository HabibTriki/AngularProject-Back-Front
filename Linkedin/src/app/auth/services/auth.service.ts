import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import jwt_decode from 'jwt-decode';

import { Preferences } from '@capacitor/preferences';

import { environment } from 'src/environments/environment';

import { NewUser } from '../models/newUser.model';
import { Role, User } from '../models/user.model';
import { UserResponse } from '../models/userResponse.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user$ = new BehaviorSubject<User | null>(null);

  private httpOptions: { headers: HttpHeaders } = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  get isUserLoggedIn(): Observable<boolean> {
    return this.user$.asObservable().pipe(
      map((user) => !!user)
    );
  }

  get userRole(): Observable<Role> {
    return this.user$.asObservable().pipe(
      map((user) => user?.role ?? 'user')
    );
  }

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  register(newUser: NewUser): Observable<User> {
    return this.http
      .post<User>(
        `${environment.baseApiUrl}/auth/register`,
        newUser,
        this.httpOptions
      )
      .pipe(take(1));
  }

  login(email: string, password: string): Observable<{ token: string }> {
    return this.http
      .post<{ token: string }>(
        `${environment.baseApiUrl}/auth/login`,
        { email, password },
        this.httpOptions
      )
      .pipe(
        take(1),
        tap((response) => {
          Preferences.set({
            key: 'token',
            value: response.token,
          });

          const decodedToken: UserResponse = jwt_decode(response.token);
          this.user$.next(decodedToken.user);
        })
      );
  }

  isTokenInStorage(): Observable<boolean> {
    return from(Preferences.get({ key: 'token' })).pipe(
      map((data) => {
        if (!data?.value) {
          return false;
        }
        const decodedToken: UserResponse = jwt_decode(data.value);
        const jwtExpirationInMs = decodedToken.exp * 1000;
        const isExpired = new Date() > new Date(jwtExpirationInMs);

        if (isExpired) {
          return false;
        }

        if (decodedToken.user) {
          this.user$.next(decodedToken.user);
          return true;
        }
        return false;
      })
    );
  }

  logout(): void {
    this.user$.next(null);
    Preferences.remove({ key: 'token' });
    this.router.navigateByUrl('/auth');
  }
}

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {BehaviorSubject, filter, from, Observable, of} from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import jwt_decode from 'jwt-decode';
import { switchMap } from 'rxjs/operators';

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

  get userStream(): Observable<User> {
    return this.user$.asObservable().pipe(filter((user): user is User => user !== null));
  }

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
  get userId(): Observable<number> {
    return this.user$.asObservable().pipe(
      switchMap((user) => {
        if (user) {
          return of(user.id);
        }
        // Handle the case where `user` is null
        return of(-1); // You can return a default value or handle it differently
      })
    );
  }

  get userFullName(): Observable<string> {
    return this.user$.asObservable().pipe(
      filter((user): user is User => user !== null), // Filter out null values
      switchMap((user: User) => {
        if (!user){
          return of('Guest User');
        }
        const fullName = `${user.firstName} ${user.lastName}`;
        return of(fullName);
      })
    );
  }

  get userFullImagePath(): Observable<string> {
    return this.user$.asObservable().pipe(
      filter((user): user is User => user !== null), // Ensure user is not null
      switchMap((user: User) => {
        const doesAuthorHaveImage = !!user.imagePath;
        console.log(888, doesAuthorHaveImage, user);

        let fullImagePath = this.getDefaultFullImagePath();
        if (doesAuthorHaveImage) {
          fullImagePath = this.getFullImagePath(user.imagePath!); // Use non-null assertion
        }
        return of(fullImagePath);
      })
    );
  }


  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  getDefaultFullImagePath(): string {
    return 'http://localhost:3000/api/feed/image/blank-profile-picture.png';
  }
  getFullImagePath(imageName: string): string {
    return 'http://localhost:3000/api/feed/image/' + imageName;
  }
  getUserImage() {
    return this.http.get(`${environment.baseApiUrl}/user/image`).pipe(take(1));
  }
  getUserImageName(): Observable<{ imageName: string }> {
    return this.http
      .get<{ imageName: string }>(`${environment.baseApiUrl}/user/image-name`)
      .pipe(take(1));
  }
  updateUserImagePath(imagePath: string): Observable<User> {
    return this.user$.pipe(
      take(1),
      map((user) => {
        if (!user) {
          throw new Error('User is null and cannot be updated.');
        }
        user.imagePath = imagePath;
        this.user$.next(user); // Update the BehaviorSubject with the modified user
        return user;
      })
    );
  }

  uploadUserImage(
    formData: FormData
  ): Observable<{ modifiedFileName: string }> {
    return this.http
      .post<{ modifiedFileName: string }>(
        `${environment.baseApiUrl}/user/upload`,
        formData
      )
      .pipe(
        tap(({ modifiedFileName }) => {
          const user = this.user$.value;
          if (!user) {
            throw new Error('User is null and cannot be updated.');
          }
          user.imagePath = modifiedFileName;
          this.user$.next(user);
        })
      );
  }


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

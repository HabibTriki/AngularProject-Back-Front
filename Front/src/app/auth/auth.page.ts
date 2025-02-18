import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NewUser } from './models/newUser.model';

import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: false
})
export class AuthPage implements OnInit {
  @ViewChild('form') form!: NgForm;

  submissionType: 'login' | 'join' = 'login';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {}

  onSubmit(): void {
    if (!this.form.valid) {
      console.error('Form is invalid!');
      return;
    }

    const { email, password, firstName, lastName } = this.form.value;

    if (!email || !password) {
      console.error('Email and password are required!');
      return;
    }

    if (this.submissionType === 'login') {
      this.authService.login(email, password).subscribe({
        next: () => {
          console.log('Login successful!');
          this.router.navigateByUrl('/home');
        },
        error: (err) => {
          console.error('Login failed:', err);
        },
      });
    } else if (this.submissionType === 'join') {
      if (!firstName || !lastName) {
        console.error('First name and last name are required for registration!');
        return;
      }

      const newUser: NewUser = { firstName, lastName, email, password };

      this.authService.register(newUser).subscribe({
        next: () => {
          console.log('Registration successful!');
          this.toggleText();
        },
        error: (err) => {
          console.error('Registration failed:', err);
        },
      });
    }
  }


  toggleText() {
    if (this.submissionType === 'login') {
      this.submissionType = 'join';
    } else if (this.submissionType === 'join') {
      this.submissionType = 'login';
    }
  }
}

import { Component, OnInit, ViewChild } from '@angular/core';
import {FormsModule, NgForm} from '@angular/forms';
import {IonicModule} from "@ionic/angular";

import { Router } from '@angular/router';
import { NewUser } from './models/newUser.model';

import { AuthService } from './services/auth.service';
@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    FormsModule
  ]
})
export class AuthPage implements OnInit {
  @ViewChild('form') form!: NgForm;

  submissionType: 'login' | 'join' = 'login';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {}

  onSubmit() {
    const { email, password } = this.form.value;
    if (!email || !password) return;

    if (this.submissionType === 'login') {
      console.log(1, 'handle login', email, password);
      return this.authService.login(email, password).subscribe(() => {
        this.router.navigateByUrl('/home');
      });
    } else if (this.submissionType === 'join') {
      const { firstName, lastName } = this.form.value;
      if (!firstName || !lastName) return;
      console.log(2, 'handle join', email, password, firstName, lastName);

      const newUser: NewUser = { firstName, lastName, email, password };

      return this.authService.register(newUser).subscribe(() => {
        this.toggleText();
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



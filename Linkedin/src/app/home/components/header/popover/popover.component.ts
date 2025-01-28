import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { PopoverController } from '@ionic/angular';
import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'app-popover',
  templateUrl: './popover.component.html',
  styleUrls: ['./popover.component.scss'],
  standalone: false,
})
export class PopoverComponent implements OnInit, OnDestroy {
  userFullImagePath: string = ''; // Initialized with default value
  private userImagePathSubscription: Subscription = new Subscription(); // Initialized with an empty Subscription
  fullName$ = new BehaviorSubject<string>(''); // BehaviorSubject initialized with an empty string
  fullName: string = ''; // Initialized with an empty string

  constructor(private authService: AuthService,
              private popoverController: PopoverController
  ) {}

  ngOnInit() {
    // Subscribe to userFullImagePath
    this.userImagePathSubscription = this.authService.userFullImagePath.subscribe(
      (fullImagePath: string) => {
        this.userFullImagePath = fullImagePath;
      }
    );

    // Fetch and set full name
    this.authService.userFullName.pipe(take(1)).subscribe((fullName: string) => {
      this.fullName = fullName;
      this.fullName$.next(fullName);
    });
  }

  async onSignOut() {
    await this.popoverController.dismiss();
    this.authService.logout();
  }

  ngOnDestroy() {
    this.userImagePathSubscription.unsubscribe(); // Clean up the subscription
  }
}

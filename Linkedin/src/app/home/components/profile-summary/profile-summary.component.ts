import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';

import {User} from 'src/app/auth/models/user.model';
import { AuthService } from 'src/app/auth/services/auth.service';
import { BannerColorService } from '../../services/banner-color.service';

type validFileExtension = 'png' | 'jpg' | 'jpeg';
type validMimeType = 'image/png' | 'image/jpg' | 'image/jpeg';

@Component({
  selector: 'app-profile-summary',
  templateUrl: './profile-summary.component.html',
  styleUrls: ['./profile-summary.component.scss'],
  standalone: false,
})
export class ProfileSummaryComponent implements OnInit, OnDestroy {
  form!: FormGroup;

  validFileExtensions: validFileExtension[] = ['png', 'jpg', 'jpeg'];
  validMimeTypes: validMimeType[] = ['image/png', 'image/jpg', 'image/jpeg'];

  userFullImagePath!: string;
  private userImagePathSubscription!: Subscription;
  private userSubscription!: Subscription;

  fullName$ = new BehaviorSubject<string>('');
  fullName = '';

  constructor(
    private authService: AuthService,
    public bannerColorService: BannerColorService
  ) {}

  ngOnInit() {
    this.form = new FormGroup({
      file: new FormControl(null),
    });

    this.userImagePathSubscription =
      this.authService.userFullImagePath.subscribe((fullImagePath: string) => {
        this.userFullImagePath = fullImagePath;
      });

    this.userSubscription = this.authService.userStream.subscribe(
      (user: User) => {
        if (user?.role) {
          this.bannerColorService.bannerColors =
            this.bannerColorService.getBannerColors(user.role);
        }

        if (user && user?.firstName && user?.lastName) {
          this.fullName = user.firstName + ' ' + user.lastName;
          this.fullName$.next(this.fullName);
        }
      }
    );
  }

  onFileSelect(event: Event): void {
    const file: File | undefined = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type;

    // Validate the file extension and MIME type
    const isFileExtensionValid = this.validFileExtensions.includes(fileExtension as validFileExtension);
    const isMimeTypeValid = this.validMimeTypes.includes(mimeType as validMimeType);

    if (!isFileExtensionValid || !isMimeTypeValid) {
      console.log({ error: 'File format not supported!' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    // Proceed with uploading the file
    this.authService.uploadUserImage(formData).subscribe({
      next: (response) => {
        console.log('File uploaded successfully:', response);
      },
      error: (err) => {
        console.log('Error uploading file:', err);
      },
    });

    this.form.reset();
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
    this.userImagePathSubscription.unsubscribe();
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, from, of, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { Role } from 'src/app/auth/models/user.model';
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

    this.authService.userRole.pipe(take(1)).subscribe((role: Role) => {
      this.bannerColorService.bannerColors =
        this.bannerColorService.getBannerColors(role);
    });

    this.authService.userFullName
      .pipe(take(1))
      .subscribe((fullName: string) => {
        this.fullName = fullName;
        this.fullName$.next(fullName);
      });

    this.userImagePathSubscription =
      this.authService.userFullImagePath.subscribe((fullImagePath: string) => {
        this.userFullImagePath = fullImagePath;
      });
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
    this.userImagePathSubscription.unsubscribe();
  }
}

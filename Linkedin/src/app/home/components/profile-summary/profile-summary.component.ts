import { Component, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Role } from 'src/app/auth/models/user.model';

type BannerColors = {
  colorOne: string;
  colorTwo: string;
  colorThree: string;
};

@Component({
  selector: 'app-profile-summary',
  templateUrl: './profile-summary.component.html',
  styleUrls: ['./profile-summary.component.scss'],
  standalone: false,
})
export class ProfileSummaryComponent implements OnInit {
  bannerColors: BannerColors = {
    colorOne: '#a0b4b7',
    colorTwo: '#dbe7e9',
    colorThree: '#bfd3d6',
  };

  userFullImagePath: string = ''; // Initialize with an empty string
  fullName: string = ''; // Initialize with an empty string

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Set banner colors based on user role
    this.authService.userRole.pipe(take(1)).subscribe((role: Role) => {
      this.bannerColors = this.getBannerColors(role);
    });

    // Fetch and set the user's full name
    this.authService.userFullName.pipe(take(1)).subscribe((name: string) => {
      this.fullName = name;
    });

    // Fetch and set the user's profile image path
    this.authService.userFullImagePath.subscribe((imagePath: string) => {
      this.userFullImagePath = imagePath;
    });
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files && input.files.length > 0) {
      const file = input.files[0];
      console.log('File selected:', file);
      // Logic to upload and handle the file can go here
    }
  }

  private getBannerColors(role: Role): BannerColors {
    switch (role) {
      case 'admin':
        return {
          colorOne: '#daa520',
          colorTwo: '#f0e68c',
          colorThree: '#fafad2',
        };
      case 'premium':
        return {
          colorOne: '#bc8f8f',
          colorTwo: '#c09999',
          colorThree: '#ddadaf',
        };
      default:
        return this.bannerColors;
    }
  }
}

import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';
import { ModalComponent } from './modal/modal.component';

@Component({
  selector: 'app-start-post',
  templateUrl: './start-post.component.html',
  styleUrls: ['./start-post.component.scss'],
  standalone: false,
})
export class StartPostComponent implements OnInit, OnDestroy {
  @Output() create: EventEmitter<any> = new EventEmitter();

  userFullImagePath: string = ''; // Initialized with an empty string
  private userImagePathSubscription: Subscription = new Subscription(); // Initialized with an empty subscription

  constructor(
    public modalController: ModalController,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Subscribe to userFullImagePath
    this.userImagePathSubscription = this.authService.userFullImagePath.subscribe(
      (fullImagePath: string) => {
        this.userFullImagePath = fullImagePath;
      }
    );
  }

  async presentModal() {
    console.log('CREATE POST');
    const modal = await this.modalController.create({
      component: ModalComponent,
      cssClass: 'my-custom-class2',
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (!data) return;
    this.create.emit(data.post.body);
  }

  ngOnDestroy() {
    this.userImagePathSubscription.unsubscribe(); // Clean up the subscription
  }
}

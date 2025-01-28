import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ChatService} from "../../services/chat.service";
import {NgForm} from "@angular/forms";
import {User} from "../../../auth/models/user.model";
import {AuthService} from "../../../auth/services/auth.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  standalone : false
})
export class ChatComponent  implements OnInit, OnDestroy {

  @ViewChild('form') form!: NgForm;

  userFullImagePath! : string
  private userImagePathSubscription! : Subscription;
  // newMessage$: Observable<string>;
  friends: User[] = []
  messages: string[] = [];
  constructor(private chatService: ChatService, private authService: AuthService) { }

  ngOnInit() {
    this.userImagePathSubscription = this.authService.userFullImagePath.subscribe(FullImagePath => {
      this.userFullImagePath = FullImagePath;
    })

    this.chatService.getNewMessage().subscribe((message: string) => {
      this.messages.push(message)
    });

    this.chatService.getFriends().subscribe((friends ) => {
      console.log(friends);
      this.friends = friends
    });
  }

  onSubmit() {
    const { message } = this.form.value;
    if (!message) return;
    this.chatService.sendMessage(message);
    this.form.reset();
  }

  ngOnDestroy() {
    this.userImagePathSubscription.unsubscribe();
  }
}

import { Component } from '@angular/core';
import {Post} from "./models/Post";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false
})
export class HomePage {
  body = '';

  constructor() {}

  onCreatePost(body: string) {
    this.body = body;
  }
}

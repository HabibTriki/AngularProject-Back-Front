import { User } from 'src/app/auth/models/user.model';
export interface Post {
  fullImagePath: string;
  id: number;
  body: string;
  createdAt: Date;
  author: User;
}

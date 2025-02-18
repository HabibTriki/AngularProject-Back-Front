import { User } from './user.class';

export enum FriendRequestStatusEnum {
  NOT_SENT = 'not-sent',
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  WAITING_FOR_CURRENT_USER_RESPONSE = 'waiting-for-current-user-response',
}

export interface FriendRequestStatus {
  status?: FriendRequestStatusEnum;
}

export interface FriendRequest {
  id?: number;
  creator?: User;
  receiver?: User;
  status?: FriendRequestStatusEnum;
}

import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, mergeMap, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { In, Repository, UpdateResult } from 'typeorm';
import { FriendRequestEntity } from '../models/friend-request.entity';
import {
  FriendRequest,
  FriendRequestStatus,
  FriendRequestStatusEnum,
} from '../models/friend-request.interface';
import { UserEntity } from '../models/user.entity';
import { User } from '../models/user.class';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FriendRequestEntity)
    private readonly friendRequestRepository: Repository<FriendRequestEntity>,
  ) {}

  findUserById(id: number): Observable<User> {
    return from(
      this.userRepository.findOne({
        where: { id },
        relations: ['feedPosts'],
      }),
    ).pipe(
      map((user: User | null) => {
        if (!user) {
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        delete user.password;
        return user;
      }),
    );
  }

  updateUserImageById(id: number, imagePath: string): Observable<UpdateResult> {
    const user: User = new UserEntity();
    user.id = id;
    user.imagePath = imagePath;
    return from(this.userRepository.update(id, user));
  }

  findImageNameByUserId(id: number): Observable<string> {
    return from(
      this.userRepository.findOne({
        where: { id },
      }),
    ).pipe(
      map((user: User) => {
        delete user.password;
        return user.imagePath;
      }),
    );
  }

  hasRequestBeenSentOrReceived(
    creator: UserEntity,
    receiver: UserEntity,
  ): Observable<boolean> {
    return from(
      this.friendRequestRepository.findOne({
        where: [
          { creator: { id: creator.id }, receiver: { id: receiver.id } }, // Match using user ids
          { creator: { id: receiver.id }, receiver: { id: creator.id } }, // Match in reverse direction
        ],
      }),
    ).pipe(
      map((friendRequest: FriendRequestEntity | undefined) => {
        return !!friendRequest;
      }),
    );
  }

  sendFriendRequest(
    receiverId: number,
    creator: UserEntity,
  ): Observable<FriendRequestEntity | { error: string }> {
    if (receiverId === creator.id) {
      return of({ error: 'It is not possible to add yourself!' });
    }
    return this.findUserById(receiverId).pipe(
      mergeMap((receiver: UserEntity) => {
        return this.hasRequestBeenSentOrReceived(creator, receiver).pipe(
          mergeMap((hasRequestBeenSentOrReceived: boolean) => {
            if (hasRequestBeenSentOrReceived) {
              return of({
                error:
                  'A friend request has already been sent or received to your account!',
              });
            }
            const friendRequest = new FriendRequestEntity();
            friendRequest.creator = creator;
            friendRequest.receiver = receiver;
            friendRequest.status = FriendRequestStatusEnum.PENDING;

            return from(this.friendRequestRepository.save(friendRequest));
          }),
        );
      }),
      catchError((err) => of({ error: err.message })), // Handle errors
    );
  }

  getFriendRequestStatus(
    receiverId: number,
    currentUser: User,
  ): Observable<FriendRequestStatus> {
    return this.findUserById(receiverId).pipe(
      mergeMap((receiver: User) => {
        return from(
          this.friendRequestRepository.findOne({
            where: [
              {
                creator: { id: currentUser.id },
                receiver: { id: receiver.id },
              },
              {
                creator: { id: receiver.id },
                receiver: { id: currentUser.id },
              },
            ],
            relations: ['creator', 'receiver'],
          }),
        ).pipe(
          map((friendRequest: FriendRequest | undefined) => {
            if (!friendRequest) {
              return { status: FriendRequestStatusEnum.NOT_SENT };
            }
            if (
              friendRequest.creator.id === currentUser.id &&
              friendRequest.status === FriendRequestStatusEnum.PENDING
            ) {
              return { status: FriendRequestStatusEnum.PENDING };
            }
            if (
              friendRequest.receiver.id === currentUser.id &&
              friendRequest.status === FriendRequestStatusEnum.PENDING
            ) {
              return {
                status:
                  FriendRequestStatusEnum.WAITING_FOR_CURRENT_USER_RESPONSE,
              };
            }
            return { status: friendRequest.status };
          }),
        );
      }),
      catchError(() => of({ status: FriendRequestStatusEnum.NOT_SENT })),
    );
  }

  getFriendRequestUserById(friendRequestId: number): Observable<FriendRequest> {
    return from(
      this.friendRequestRepository.findOne({
        where: [{ id: friendRequestId }],
        relations: ['creator', 'receiver'],
      }),
    );
  }

  respondToFriendRequest(
    statusResponse: FriendRequestStatusEnum,
    friendRequestId: number,
    currentUserId: number,
  ): Observable<FriendRequestStatus> {
    if (!Object.values(FriendRequestStatusEnum).includes(statusResponse)) {
      return throwError(() => new Error('Invalid status provided.'));
    }

    return this.getFriendRequestUserById(friendRequestId).pipe(
      mergeMap((friendRequest: FriendRequestEntity | null) => {
        if (!friendRequest) {
          throw new NotFoundException('Friend request not found');
        }
        if (friendRequest.receiver.id !== currentUserId) {
          throw new ForbiddenException(
            'You are not allowed to modify this friend request.',
          );
        }
        return from(
          this.friendRequestRepository.save({
            ...friendRequest,
            status: statusResponse,
          }),
        ).pipe(map(() => ({ status: statusResponse })));
      }),
      catchError((err) => {
        if (err instanceof NotFoundException || ForbiddenException) {
          throw err;
        }
        return of({ status: FriendRequestStatusEnum.NOT_SENT });
      }),
    );
  }

  getFriendRequestsFromRecipients(
    currentUser: User,
  ): Observable<FriendRequest[]> {
    return from(
      this.friendRequestRepository.find({
        where: [{ receiver: currentUser }],
        relations: ['receiver', 'creator'],
      }),
    );
  }

  getFriends(currentUser: User): Observable<User[]> {
    return from(
      this.friendRequestRepository.find({
        where: [
          { creator: currentUser, status: FriendRequestStatusEnum.ACCEPTED },
          { receiver: currentUser, status: FriendRequestStatusEnum.ACCEPTED },
        ],
        relations: ['creator', 'receiver'],
      }),
    ).pipe(
      map((friends: FriendRequest[]) => {
        // Extract user IDs based on the current user
        const userIds: number[] = friends.map((friend: FriendRequest) =>
          friend.creator.id === currentUser.id
            ? friend.receiver.id
            : friend.creator.id,
        );
        return Array.from(new Set(userIds));
      }),
      switchMap((uniqueUserIds: number[]) =>
        from(
          this.userRepository.find({
            where: { id: In(uniqueUserIds) },
          }),
        ),
      ),
    );
  }
}

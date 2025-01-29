import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { DeleteResult, UpdateResult } from 'typeorm';

import { JwtGuard } from '../../auth/guards/jwt.guard';

import { FeedPost } from '../models/post.interface';
import { FeedService } from '../services/feed.service';

import { IsCreatorGuard } from '../guards/is-creator.guard';
import { catchError } from 'rxjs/operators';

@Controller('feed')
export class FeedController {
  constructor(private feedService: FeedService) {}

  @UseGuards(JwtGuard)
  @Post()
  create(@Body() feedPost: FeedPost, @Request() req): Observable<FeedPost> {
    return this.feedService.createPost(req.user, feedPost);
  }

  @Get('all')
  findAll(): Observable<FeedPost[]> {
    return this.feedService.findAllPosts();
  }

  @UseGuards(JwtGuard)
  @Get()
  findSelected(
    @Query('take', new ParseIntPipe({ errorHttpStatusCode: 400 }))
    take: number = 10,
    @Query('skip', new ParseIntPipe({ errorHttpStatusCode: 400 }))
    skip: number = 0,
  ): Observable<FeedPost[]> {
    take = Math.min(take, 20);
    return this.feedService.findPosts(take, skip).pipe(
      catchError((error) => {
        console.error('Error fetching posts', error);
        return throwError(() => new Error('Failed to fetch posts'));
      }),
    );
  }

  @UseGuards(JwtGuard, IsCreatorGuard)
  @Put(':id')
  update(
    @Param('id') id: number,
    @Body() feedPost: FeedPost,
  ): Observable<UpdateResult> {
    return this.feedService.updatePost(id, feedPost);
  }

  @UseGuards(JwtGuard, IsCreatorGuard)
  @Delete(':id')
  delete(@Param('id') id: number): Observable<DeleteResult> {
    return this.feedService.deletePost(id);
  }

  @Get('image/:fileName')
  findImageByName(@Param('fileName') fileName: string, @Res() res) {
    if (!fileName || ['null', '[null]'].includes(fileName)) return;
    return res.sendFile(fileName, { root: './images' });
  }
}

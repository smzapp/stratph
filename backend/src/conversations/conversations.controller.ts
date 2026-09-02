import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ConversationsService } from './conversations.service.js';
import { StartConversationDto } from './dto/start-conversation.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import type { User } from '../users/user.entity.js';

const ALLOWED_ATTACHMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/png',
  'image/jpeg',
]);
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.conversationsService.findForUser(user.id);
  }

  @Post()
  start(@CurrentUser() user: User, @Body() dto: StartConversationDto) {
    return this.conversationsService.startOrGet(user, dto.otherUserId);
  }

  @Get(':id/messages')
  messages(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversationsService.findMessages(id, user.id, {
      before,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post(':id/messages')
  @HttpCode(201)
  send(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.conversationsService.sendMessage(id, user, dto.body);
  }

  @Post(':id/attachments')
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads/messages',
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
      }),
      limits: { fileSize: MAX_ATTACHMENT_SIZE },
      fileFilter: (_req, file, cb) => {
        cb(null, ALLOWED_ATTACHMENT_TYPES.has(file.mimetype));
      },
    }),
  )
  sendAttachment(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('body') body?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Unsupported file type, or the file is too large (10MB max).');
    }
    return this.conversationsService.sendAttachment(
      id,
      user,
      {
        url: `/uploads/messages/${file.filename}`,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
      },
      body,
    );
  }

  @Patch(':id/read')
  @HttpCode(200)
  async markRead(@CurrentUser() user: User, @Param('id') id: string) {
    await this.conversationsService.markRead(id, user.id);
    return { ok: true };
  }

  @Delete(':id/messages/:messageId')
  @HttpCode(200)
  deleteMessage(@CurrentUser() user: User, @Param('id') id: string, @Param('messageId') messageId: string) {
    return this.conversationsService.deleteMessage(id, messageId, user.id);
  }

  @Patch(':id/close')
  @HttpCode(200)
  close(@CurrentUser() user: User, @Param('id') id: string) {
    return this.conversationsService.closeConversation(id, user.id);
  }

  @Patch(':id/archive')
  @HttpCode(200)
  archive(@CurrentUser() user: User, @Param('id') id: string) {
    return this.conversationsService.setArchived(id, user.id, true);
  }

  @Patch(':id/unarchive')
  @HttpCode(200)
  unarchive(@CurrentUser() user: User, @Param('id') id: string) {
    return this.conversationsService.setArchived(id, user.id, false);
  }
}

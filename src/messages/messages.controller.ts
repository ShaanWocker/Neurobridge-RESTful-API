import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { SearchMessageDto } from './dto/search-message.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { CreateDraftDto } from './dto/create-draft.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message to another institution' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 404, description: 'Recipient institution not found' })
  create(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
  ) {
    return this.messagesService.create(createMessageDto, userId, institutionId);
  }

  @Get()
  @ApiOperation({ summary: 'Search and filter messages' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  findAll(
    @Query() searchDto: SearchMessageDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.messagesService.findAll(searchDto, userId, institutionId, userRole);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get message statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStatistics(
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.messagesService.getStatistics(
      userRole === UserRole.SUPER_ADMIN ? undefined : institutionId,
    );
  }

  @Get('thread/:threadId')
  @ApiOperation({ summary: 'Get all messages in a thread' })
  @ApiParam({ name: 'threadId', description: 'Thread UUID' })
  @ApiResponse({ status: 200, description: 'Thread retrieved successfully' })
  findThread(
    @Param('threadId') threadId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.messagesService.findThread(threadId, userId, institutionId, userRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a message by ID' })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  @ApiResponse({ status: 200, description: 'Message retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.messagesService.findOne(id, userId, institutionId, userRole);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a message (before it is read)' })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  @ApiResponse({ status: 200, description: 'Message updated successfully' })
  @ApiResponse({ status: 400, description: 'Message already read' })
  update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.messagesService.update(id, updateMessageDto, userId, institutionId, userRole);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  markAsRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.messagesService.markAsRead(id, userId, institutionId, userRole);
  }

  @Post('mark-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark multiple messages as read' })
  @ApiResponse({ status: 204, description: 'Messages marked as read' })
  markMultipleAsRead(
    @Body() markAsReadDto: MarkAsReadDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.messagesService.markMultipleAsRead(
      markAsReadDto,
      userId,
      institutionId,
      userRole,
    );
  }

  @Patch(':id/star')
  @ApiOperation({ summary: 'Toggle star on a message' })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  @ApiResponse({ status: 200, description: 'Message star toggled' })
  toggleStar(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.messagesService.toggleStar(id, userId, institutionId, userRole);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a message' })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  @ApiResponse({ status: 200, description: 'Message archived' })
  archive(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.messagesService.archive(id, userId, institutionId, userRole);
  }

  @Patch(':id/unarchive')
  @ApiOperation({ summary: 'Unarchive a message' })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  @ApiResponse({ status: 200, description: 'Message unarchived' })
  unarchive(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.messagesService.unarchive(id, userId, institutionId, userRole);
  }

  // Drafts endpoints
  @Post('drafts')
  @ApiOperation({ summary: 'Save a message draft' })
  @ApiResponse({ status: 201, description: 'Draft saved successfully' })
  createDraft(
    @Body() createDraftDto: CreateDraftDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
  ) {
    return this.messagesService.createDraft(createDraftDto, userId, institutionId);
  }

  @Get('drafts/all')
  @ApiOperation({ summary: 'Get all message drafts' })
  @ApiResponse({ status: 200, description: 'Drafts retrieved successfully' })
  findAllDrafts(
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
  ) {
    return this.messagesService.findAllDrafts(userId, institutionId);
  }

  @Patch('drafts/:id')
  @ApiOperation({ summary: 'Update a message draft' })
  @ApiParam({ name: 'id', description: 'Draft UUID' })
  @ApiResponse({ status: 200, description: 'Draft updated successfully' })
  updateDraft(
    @Param('id') id: string,
    @Body() updateDraftDto: CreateDraftDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.updateDraft(id, updateDraftDto, userId);
  }

  @Delete('drafts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a message draft' })
  @ApiParam({ name: 'id', description: 'Draft UUID' })
  @ApiResponse({ status: 204, description: 'Draft deleted successfully' })
  deleteDraft(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.deleteDraft(id, userId);
  }

  @Post('drafts/:id/send')
  @ApiOperation({ summary: 'Send a draft message' })
  @ApiParam({ name: 'id', description: 'Draft UUID' })
  @ApiResponse({ status: 201, description: 'Draft sent successfully' })
  sendDraft(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
  ) {
    return this.messagesService.sendDraft(id, userId, institutionId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  @ApiResponse({ status: 204, description: 'Message deleted successfully' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.messagesService.remove(id, userId, institutionId, userRole);
  }
}
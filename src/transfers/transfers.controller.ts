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
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { ReviewTransferDto } from './dto/review-transfer.dto';
import { AcknowledgeTransferDto } from './dto/acknowledge-transfer.dto';
import { CompleteTransferDto } from './dto/complete-transfer.dto';
import { AddCommunicationDto } from './dto/add-communication.dto';
import { SearchTransferDto } from './dto/search-transfer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @ApiOperation({ summary: 'Initiate a learner transfer' })
  @ApiResponse({ status: 201, description: 'Transfer initiated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Transfer already exists' })
  create(
    @Body() createTransferDto: CreateTransferDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.transfersService.create(createTransferDto, userId, institutionId, userRole);
  }

  @Get()
  @ApiOperation({ summary: 'Search and filter transfers' })
  @ApiResponse({ status: 200, description: 'Transfers retrieved successfully' })
  findAll(
    @Query() searchDto: SearchTransferDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.transfersService.findAll(searchDto, userId, institutionId, userRole);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get transfer statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStatistics(
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.transfersService.getStatistics(
      userRole === UserRole.SUPER_ADMIN ? undefined : institutionId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transfer by ID' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({ status: 200, description: 'Transfer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.transfersService.findOne(id, userId, institutionId, userRole);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get transfer timeline' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({ status: 200, description: 'Timeline retrieved successfully' })
  getTimeline(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.transfersService.findTimeline(id, userId, institutionId, userRole);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transfer' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({ status: 200, description: 'Transfer updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateTransferDto: UpdateTransferDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.transfersService.update(id, updateTransferDto, userId, institutionId, userRole);
  }

  @Patch(':id/review')
  @ApiOperation({ summary: 'Review (approve/reject) a transfer' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({ status: 200, description: 'Transfer reviewed successfully' })
  review(
    @Param('id') id: string,
    @Body() reviewDto: ReviewTransferDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.transfersService.review(id, reviewDto, userId, institutionId, userRole);
  }

  @Patch(':id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge receipt of transfer' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({ status: 200, description: 'Transfer acknowledged successfully' })
  acknowledge(
    @Param('id') id: string,
    @Body() acknowledgeDto: AcknowledgeTransferDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.transfersService.acknowledge(id, acknowledgeDto, userId, institutionId, userRole);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete a transfer' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({ status: 200, description: 'Transfer completed successfully' })
  complete(
    @Param('id') id: string,
    @Body() completeDto: CompleteTransferDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.transfersService.complete(id, completeDto, userId, institutionId, userRole);
  }

  @Post(':id/communications')
  @ApiOperation({ summary: 'Add communication to transfer' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({ status: 201, description: 'Communication added successfully' })
  addCommunication(
    @Param('id') id: string,
    @Body() communicationDto: AddCommunicationDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.transfersService.addCommunication(
      id,
      communicationDto,
      userId,
      institutionId,
      userRole,
    );
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a transfer' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({ status: 200, description: 'Transfer cancelled successfully' })
  cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.transfersService.cancel(id, reason, userId, institutionId, userRole);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a transfer (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({ status: 204, description: 'Transfer deleted successfully' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.transfersService.remove(id, userId, institutionId, userRole);
  }
}
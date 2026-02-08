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
import { LearnersService } from './learners.service';
import { CreateLearnerDto } from './dto/create-learner.dto';
import { UpdateLearnerDto } from './dto/update-learner.dto';
import { CreateCaseNoteDto } from './dto/create-case-note.dto';
import { UpdateCaseNoteDto } from './dto/update-case-note.dto';
import { SearchLearnerDto } from './dto/search-learner.dto';
import { AddGoalDto } from './dto/add-goal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { LearnerStatus } from './entities/learner.entity';

@ApiTags('learners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('learners')
export class LearnersController {
  constructor(private readonly learnersService: LearnersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new learner case' })
  @ApiResponse({ status: 201, description: 'Learner created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Body() createLearnerDto: CreateLearnerDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
  ) {
    return this.learnersService.create(createLearnerDto, userId, institutionId);
  }

  @Get()
  @ApiOperation({ summary: 'Search and filter learners' })
  @ApiResponse({ status: 200, description: 'Learners retrieved successfully' })
  findAll(
    @Query() searchDto: SearchLearnerDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.learnersService.findAll(searchDto, userId, institutionId, userRole);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get learner statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStatistics(
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.learnersService.getStatistics(
      userRole === UserRole.SUPER_ADMIN ? undefined : institutionId,
    );
  }

  @Get('case/:caseNumber')
  @ApiOperation({ summary: 'Get learner by case number' })
  @ApiParam({ name: 'caseNumber', description: 'Learner case number' })
  @ApiResponse({ status: 200, description: 'Learner retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Learner not found' })
  findByCaseNumber(
    @Param('caseNumber') caseNumber: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.learnersService.findByCaseNumber(caseNumber, userId, institutionId, userRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a learner by ID' })
  @ApiParam({ name: 'id', description: 'Learner UUID' })
  @ApiResponse({ status: 200, description: 'Learner retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Learner not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.learnersService.findOne(id, userId, institutionId, userRole);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a learner' })
  @ApiParam({ name: 'id', description: 'Learner UUID' })
  @ApiResponse({ status: 200, description: 'Learner updated successfully' })
  @ApiResponse({ status: 404, description: 'Learner not found' })
  update(
    @Param('id') id: string,
    @Body() updateLearnerDto: UpdateLearnerDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.learnersService.update(id, updateLearnerDto, userId, institutionId, userRole);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update learner status' })
  @ApiParam({ name: 'id', description: 'Learner UUID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: LearnerStatus,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.learnersService.updateStatus(id, status, userId, institutionId, userRole);
  }

  @Post(':id/goals')
  @ApiOperation({ summary: 'Add a goal to learner' })
  @ApiParam({ name: 'id', description: 'Learner UUID' })
  @ApiResponse({ status: 201, description: 'Goal added successfully' })
  addGoal(
    @Param('id') id: string,
    @Body() goalDto: AddGoalDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.learnersService.addGoal(id, goalDto, userId, institutionId, userRole);
  }

  @Patch(':id/goals/:goalId')
  @ApiOperation({ summary: 'Update a learner goal' })
  @ApiParam({ name: 'id', description: 'Learner UUID' })
  @ApiParam({ name: 'goalId', description: 'Goal UUID' })
  @ApiResponse({ status: 200, description: 'Goal updated successfully' })
  updateGoal(
    @Param('id') id: string,
    @Param('goalId') goalId: string,
    @Body() goalDto: Partial<AddGoalDto>,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.learnersService.updateGoal(id, goalId, goalDto, userId, institutionId, userRole);
  }

  // Case Notes Endpoints
  @Post(':id/case-notes')
  @ApiOperation({ summary: 'Add a case note to learner' })
  @ApiParam({ name: 'id', description: 'Learner UUID' })
  @ApiResponse({ status: 201, description: 'Case note created successfully' })
  createCaseNote(
    @Param('id') id: string,
    @Body() createCaseNoteDto: CreateCaseNoteDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.learnersService.createCaseNote(
      id,
      createCaseNoteDto,
      userId,
      institutionId,
      userRole,
    );
  }

  @Get(':id/case-notes')
  @ApiOperation({ summary: 'Get all case notes for a learner' })
  @ApiParam({ name: 'id', description: 'Learner UUID' })
  @ApiResponse({ status: 200, description: 'Case notes retrieved successfully' })
  getCaseNotes(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.learnersService.findCaseNotes(id, userId, institutionId, userRole);
  }

  @Patch(':id/case-notes/:noteId')
  @ApiOperation({ summary: 'Update a case note' })
  @ApiParam({ name: 'id', description: 'Learner UUID' })
  @ApiParam({ name: 'noteId', description: 'Case note UUID' })
  @ApiResponse({ status: 200, description: 'Case note updated successfully' })
  updateCaseNote(
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @Body() updateCaseNoteDto: UpdateCaseNoteDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.learnersService.updateCaseNote(
      id,
      noteId,
      updateCaseNoteDto,
      userId,
      institutionId,
      userRole,
    );
  }

  @Delete(':id/case-notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a case note' })
  @ApiParam({ name: 'id', description: 'Learner UUID' })
  @ApiParam({ name: 'noteId', description: 'Case note UUID' })
  @ApiResponse({ status: 204, description: 'Case note deleted successfully' })
  deleteCaseNote(
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.learnersService.deleteCaseNote(id, noteId, userId, institutionId, userRole);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a learner (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Learner UUID' })
  @ApiResponse({ status: 204, description: 'Learner deleted successfully' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.learnersService.remove(id, userId, institutionId, userRole);
  }
}
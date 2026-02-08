import {
  Controller,
  Get,
  Post,
  Body,
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
  ApiQuery,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { SearchAuditLogDto } from './dto/search-audit-log.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TUTOR_CENTRE_ADMIN)
  @ApiOperation({ summary: 'Search and filter audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  findAll(
    @Query() searchDto: SearchAuditLogDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.auditService.findAll(searchDto, userId, institutionId, userRole);
  }

  @Get('logs/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TUTOR_CENTRE_ADMIN)
  @ApiOperation({ summary: 'Get an audit log by ID' })
  @ApiParam({ name: 'id', description: 'Audit log UUID' })
  @ApiResponse({ status: 200, description: 'Audit log retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.auditService.findOne(id, userId, institutionId, userRole);
  }

  @Get('entity/:entityType/:entityId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TUTOR_CENTRE_ADMIN)
  @ApiOperation({ summary: 'Get audit logs for a specific entity' })
  @ApiParam({ name: 'entityType', description: 'Entity type (e.g., Learner, Institution)' })
  @ApiParam({ name: 'entityId', description: 'Entity UUID' })
  @ApiResponse({ status: 200, description: 'Entity audit logs retrieved successfully' })
  findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.auditService.findByEntity(entityType, entityId, userId, institutionId, userRole);
  }

  @Get('statistics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TUTOR_CENTRE_ADMIN)
  @ApiOperation({ summary: 'Get audit statistics' })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStatistics(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @CurrentUser('institutionId') institutionId?: string,
    @CurrentUser('role') userRole?: UserRole,
  ) {
    return this.auditService.getStatistics(
      fromDate,
      toDate,
      userRole === UserRole.SUPER_ADMIN ? undefined : institutionId,
    );
  }

  @Post('reports')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TUTOR_CENTRE_ADMIN)
  @ApiOperation({ summary: 'Generate an audit report' })
  @ApiResponse({ status: 201, description: 'Report generation initiated' })
  createReport(
    @Body() createReportDto: CreateReportDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.auditService.createReport(createReportDto, userId, institutionId, userRole);
  }

  @Get('reports')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TUTOR_CENTRE_ADMIN)
  @ApiOperation({ summary: 'Get all audit reports' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  findAllReports(
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.auditService.findAllReports(userId, institutionId, userRole);
  }

  @Get('reports/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TUTOR_CENTRE_ADMIN)
  @ApiOperation({ summary: 'Get a report by ID' })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  findReport(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.auditService.findReport(id, userId, institutionId, userRole);
  }

  @Delete('reports/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a report (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  @ApiResponse({ status: 204, description: 'Report deleted successfully' })
  deleteReport(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.auditService.deleteReport(id, userId, institutionId, userRole);
  }
}
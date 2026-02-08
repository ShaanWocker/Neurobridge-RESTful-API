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
import { InstitutionsService } from './institutions.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { VerifyInstitutionDto } from './dto/verify-institution.dto';
import { SearchInstitutionDto } from './dto/search-institution.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@users/entities/user.entity';
import { InstitutionStatus } from './entities/institution.entity';

@ApiTags('institutions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new institution (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Institution created successfully' })
  @ApiResponse({ status: 409, description: 'Institution already exists' })
  create(
    @Body() createInstitutionDto: CreateInstitutionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.institutionsService.create(createInstitutionDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Search and filter institutions' })
  @ApiResponse({ status: 200, description: 'Institutions retrieved successfully' })
  findAll(@Query() searchDto: SearchInstitutionDto) {
    return this.institutionsService.findAll(searchDto);
  }

  @Get('statistics')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get institution statistics (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStatistics() {
    return this.institutionsService.getStatistics();
  }

  @Get('specializations')
  @ApiOperation({ summary: 'Get all available specializations' })
  @ApiResponse({ status: 200, description: 'Specializations retrieved successfully' })
  getSpecializations() {
    return this.institutionsService.getAvailableSpecializations();
  }

  @Get('support-needs')
  @ApiOperation({ summary: 'Get all available support needs' })
  @ApiResponse({ status: 200, description: 'Support needs retrieved successfully' })
  getSupportNeeds() {
    return this.institutionsService.getAvailableSupportNeeds();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an institution by ID' })
  @ApiParam({ name: 'id', description: 'Institution UUID' })
  @ApiResponse({ status: 200, description: 'Institution retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Institution not found' })
  findOne(@Param('id') id: string) {
    return this.institutionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an institution' })
  @ApiParam({ name: 'id', description: 'Institution UUID' })
  @ApiResponse({ status: 200, description: 'Institution updated successfully' })
  @ApiResponse({ status: 404, description: 'Institution not found' })
  update(
    @Param('id') id: string,
    @Body() updateInstitutionDto: UpdateInstitutionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.institutionsService.update(id, updateInstitutionDto, userId);
  }

  @Patch(':id/verify')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Verify or reject an institution (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Institution UUID' })
  @ApiResponse({ status: 200, description: 'Institution verification updated' })
  @ApiResponse({ status: 404, description: 'Institution not found' })
  verify(
    @Param('id') id: string,
    @Body() verifyDto: VerifyInstitutionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.institutionsService.verify(id, verifyDto, userId);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update institution status (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Institution UUID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 404, description: 'Institution not found' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: InstitutionStatus,
    @CurrentUser('id') userId: string,
  ) {
    return this.institutionsService.updateStatus(id, status, userId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an institution (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Institution UUID' })
  @ApiResponse({ status: 204, description: 'Institution deleted successfully' })
  @ApiResponse({ status: 404, description: 'Institution not found' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.institutionsService.remove(id, userId);
  }
}
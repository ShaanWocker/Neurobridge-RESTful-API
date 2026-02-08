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
  ApiQuery,
} from '@nestjs/swagger';
import { DiscoveryService, UniversalSearchResult } from './discovery.service';
import { UniversalSearchDto } from './dto/universal-search.dto';
import { AdvancedSearchDto } from './dto/advanced-search.dto';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { UpdateSavedSearchDto } from './dto/update-saved-search.dto';
import { AggregationQueryDto } from './dto/aggregation-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SearchScope } from './entities/saved-search.entity';

@ApiTags('discovery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('search')
  @ApiOperation({ summary: 'Universal search across all entities' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async universalSearch(
    @Query() searchDto: UniversalSearchDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ): Promise<UniversalSearchResult> {
    return this.discoveryService.universalSearch(searchDto, userId, institutionId, userRole);
  }

  @Post('advanced-search')
  @ApiOperation({ summary: 'Advanced search with multiple filters' })
  @ApiResponse({ status: 200, description: 'Advanced search results retrieved' })
  advancedSearch(
    @Body() searchDto: AdvancedSearchDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.discoveryService.advancedSearch(searchDto, userId, institutionId, userRole);
  }

  @Get('aggregations')
  @ApiOperation({ summary: 'Get data aggregations for analytics' })
  @ApiResponse({ status: 200, description: 'Aggregations retrieved successfully' })
  getAggregations(
    @Query() queryDto: AggregationQueryDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.discoveryService.getAggregations(queryDto, userId, institutionId, userRole);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'scope', enum: SearchScope, required: true })
  @ApiResponse({ status: 200, description: 'Suggestions retrieved successfully' })
  getSearchSuggestions(
    @Query('query') query: string,
    @Query('scope') scope: SearchScope,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.discoveryService.getSearchSuggestions(
      query,
      scope,
      userId,
      institutionId,
      userRole,
    );
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular searches' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Popular searches retrieved' })
  getPopularSearches(
    @Query('limit') limit: number,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
  ) {
    return this.discoveryService.getPopularSearches(userId, institutionId, limit);
  }

  @Post('saved-searches')
  @ApiOperation({ summary: 'Create a saved search' })
  @ApiResponse({ status: 201, description: 'Saved search created successfully' })
  createSavedSearch(
    @Body() createSavedSearchDto: CreateSavedSearchDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
  ) {
    return this.discoveryService.createSavedSearch(
      createSavedSearchDto,
      userId,
      institutionId,
    );
  }

  @Get('saved-searches')
  @ApiOperation({ summary: 'Get all saved searches' })
  @ApiResponse({ status: 200, description: 'Saved searches retrieved successfully' })
  findAllSavedSearches(
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
  ) {
    return this.discoveryService.findAllSavedSearches(userId, institutionId);
  }

  @Get('saved-searches/:id')
  @ApiOperation({ summary: 'Get a saved search by ID' })
  @ApiParam({ name: 'id', description: 'Saved search UUID' })
  @ApiResponse({ status: 200, description: 'Saved search retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Saved search not found' })
  findSavedSearch(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.discoveryService.findSavedSearch(id, userId);
  }

  @Patch('saved-searches/:id')
  @ApiOperation({ summary: 'Update a saved search' })
  @ApiParam({ name: 'id', description: 'Saved search UUID' })
  @ApiResponse({ status: 200, description: 'Saved search updated successfully' })
  updateSavedSearch(
    @Param('id') id: string,
    @Body() updateSavedSearchDto: UpdateSavedSearchDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.discoveryService.updateSavedSearch(id, updateSavedSearchDto, userId);
  }

  @Post('saved-searches/:id/execute')
  @ApiOperation({ summary: 'Execute a saved search' })
  @ApiParam({ name: 'id', description: 'Saved search UUID' })
  @ApiResponse({ status: 200, description: 'Search executed successfully' })
  executeSavedSearch(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.discoveryService.executeSavedSearch(id, userId, institutionId, userRole);
  }

  @Delete('saved-searches/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a saved search' })
  @ApiParam({ name: 'id', description: 'Saved search UUID' })
  @ApiResponse({ status: 204, description: 'Saved search deleted successfully' })
  deleteSavedSearch(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.discoveryService.deleteSavedSearch(id, userId);
  }
}
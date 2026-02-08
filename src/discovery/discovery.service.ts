import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { SavedSearch, SearchScope } from './entities/saved-search.entity';
import { UniversalSearchDto, SearchEntity } from './dto/universal-search.dto';
import { AdvancedSearchDto } from './dto/advanced-search.dto';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { UpdateSavedSearchDto } from './dto/update-saved-search.dto';
import { AggregationQueryDto, AggregationField } from './dto/aggregation-query.dto';
import { InstitutionsService } from '@institutions/institutions.service';
import { LearnersService } from '@learners/learners.service';
import { TransfersService } from '@transfers/transfers.service';
import { MessagesService } from '@messages/messages.service';
import { UsersService } from '@users/users.service';
import { UserRole } from '@users/entities/user.entity';
import { Institution } from '@institutions/entities/institution.entity';
import { Learner } from '@learners/entities/learner.entity';
import { Transfer } from '@transfers/entities/transfer.entity';
import { Message } from '@messages/entities/message.entity';

export interface UniversalSearchResult {
  institutions?: {
    total: number;
    items: Institution[];
  };
  learners?: {
    total: number;
    items: Learner[];
  };
  transfers?: {
    total: number;
    items: Transfer[];
  };
  messages?: {
    total: number;
    items: Message[];
  };
  users?: {
    total: number;
    items: any[];
  };
  summary: {
    totalResults: number;
    searchTime: number;
    appliedFilters: string[];
  };
}

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectRepository(SavedSearch)
    private savedSearchRepository: Repository<SavedSearch>,
    private institutionsService: InstitutionsService,
    private learnersService: LearnersService,
    private transfersService: TransfersService,
    private messagesService: MessagesService,
    private usersService: UsersService,
  ) {}

  async universalSearch(
    searchDto: UniversalSearchDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<UniversalSearchResult> {
    const startTime = Date.now();
    const result: UniversalSearchResult = {
      summary: {
        totalResults: 0,
        searchTime: 0,
        appliedFilters: [],
      },
    };

    const { query, entities, fromDate, toDate, includeArchived } = searchDto;

    const searchEntities = entities || [
      SearchEntity.INSTITUTIONS,
      SearchEntity.LEARNERS,
      SearchEntity.TRANSFERS,
      SearchEntity.MESSAGES,
    ];

    // Search institutions
    if (searchEntities.includes(SearchEntity.INSTITUTIONS)) {
      const institutionResults = await this.institutionsService.findAll({
        page: 1,
        limit: 10,
        search: query,
        verificationStatus: undefined,
      });

      result.institutions = {
        total: institutionResults.meta.totalItems,
        items: institutionResults.data,
      };
      result.summary.totalResults += institutionResults.meta.totalItems;
    }

    // Search learners
    if (searchEntities.includes(SearchEntity.LEARNERS)) {
      const learnerResults = await this.learnersService.findAll(
        {
          page: 1,
          limit: 10,
          search: query,
        },
        userId,
        institutionId,
        userRole,
      );

      result.learners = {
        total: learnerResults.meta.totalItems,
        items: learnerResults.data,
      };
      result.summary.totalResults += learnerResults.meta.totalItems;
    }

    // Search transfers
    if (searchEntities.includes(SearchEntity.TRANSFERS)) {
      const transferResults = await this.transfersService.findAll(
        {
          page: 1,
          limit: 10,
        },
        userId,
        institutionId,
        userRole,
      );

      result.transfers = {
        total: transferResults.meta.totalItems,
        items: transferResults.data,
      };
      result.summary.totalResults += transferResults.meta.totalItems;
    }

    // Search messages
    if (searchEntities.includes(SearchEntity.MESSAGES)) {
      const messageResults = await this.messagesService.findAll(
        {
          page: 1,
          limit: 10,
          search: query,
          fromDate,
          toDate,
        },
        userId,
        institutionId,
        userRole,
      );

      result.messages = {
        total: messageResults.meta.totalItems,
        items: messageResults.data,
      };
      result.summary.totalResults += messageResults.meta.totalItems;
    }

    // Search users (Super Admin only)
    if (searchEntities.includes(SearchEntity.USERS) && userRole === UserRole.SUPER_ADMIN) {
      const userResults = await this.usersService.findAll(
        { page: 1, limit: 10 },
        { search: query },
      );

      result.users = {
        total: userResults.meta.totalItems,
        items: userResults.data,
      };
      result.summary.totalResults += userResults.meta.totalItems;
    }

    // Calculate search time
    result.summary.searchTime = Date.now() - startTime;

    // Track applied filters
    if (query) result.summary.appliedFilters.push('query');
    if (fromDate) result.summary.appliedFilters.push('fromDate');
    if (toDate) result.summary.appliedFilters.push('toDate');
    if (entities) result.summary.appliedFilters.push('entities');

    return result;
  }

  async advancedSearch(
    searchDto: AdvancedSearchDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<any> {
    const results: any = {
      institutions: null,
      learners: null,
      transfers: null,
      messages: null,
    };

    const {
      globalSearch,
      institutionType,
      verificationStatus,
      city,
      province,
      specializations,
      supportNeeds,
      minAge,
      maxAge,
      hasCapacity,
      learnerStatus,
      caseNumber,
      transferStatus,
      transferNumber,
      messageStatus,
      messageCategory,
      unreadOnly,
      fromDate,
      toDate,
      page,
      limit,
    } = searchDto;

    // Search institutions with advanced filters
    if (
      institutionType ||
      verificationStatus ||
      city ||
      province ||
      specializations ||
      supportNeeds ||
      minAge !== undefined ||
      maxAge !== undefined ||
      hasCapacity !== undefined
    ) {
      results.institutions = await this.institutionsService.findAll({
        page: page || 1,
        limit: limit || 20,
        type: institutionType,
        verificationStatus,
        city,
        province,
        specialization: specializations?.[0],
        supportNeed: supportNeeds?.[0],
        minAge,
        maxAge,
        hasCapacity,
        search: globalSearch,
      });
    }

    // Search learners with advanced filters
    if (learnerStatus || caseNumber || supportNeeds) {
      results.learners = await this.learnersService.findAll(
        {
          page: page || 1,
          limit: limit || 20,
          status: learnerStatus,
          caseNumber,
          supportNeed: supportNeeds?.[0],
          search: globalSearch,
        },
        userId,
        institutionId,
        userRole,
      );
    }

    // Search transfers with advanced filters
    if (transferStatus || transferNumber) {
      results.transfers = await this.transfersService.findAll(
        {
          page: page || 1,
          limit: limit || 20,
          status: transferStatus,
        },
        userId,
        institutionId,
        userRole,
      );
    }

    // Search messages with advanced filters
    if (messageStatus || messageCategory || unreadOnly !== undefined) {
      results.messages = await this.messagesService.findAll(
        {
          page: page || 1,
          limit: limit || 20,
          status: messageStatus,
          category: messageCategory,
          unreadOnly,
          search: globalSearch,
          fromDate,
          toDate,
        },
        userId,
        institutionId,
        userRole,
      );
    }

    return results;
  }

  async getAggregations(
    queryDto: AggregationQueryDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<any> {
    const aggregations: any = {};

    const { groupBy, fromDate, toDate } = queryDto;

    if (!groupBy || groupBy.length === 0) {
      throw new BadRequestException('At least one groupBy field is required');
    }

    for (const field of groupBy) {
      switch (field) {
        case AggregationField.INSTITUTION_TYPE:
          aggregations.institutionType = await this.aggregateInstitutionType();
          break;

        case AggregationField.VERIFICATION_STATUS:
          aggregations.verificationStatus = await this.aggregateVerificationStatus();
          break;

        case AggregationField.LEARNER_STATUS:
          aggregations.learnerStatus = await this.aggregateLearnerStatus(
            userId,
            institutionId,
            userRole,
          );
          break;

        case AggregationField.TRANSFER_STATUS:
          aggregations.transferStatus = await this.aggregateTransferStatus(
            userId,
            institutionId,
            userRole,
          );
          break;

        case AggregationField.MESSAGE_CATEGORY:
          aggregations.messageCategory = await this.aggregateMessageCategory(
            userId,
            institutionId,
            userRole,
          );
          break;

        case AggregationField.CITY:
          aggregations.city = await this.aggregateByCity();
          break;

        case AggregationField.PROVINCE:
          aggregations.province = await this.aggregateByProvince();
          break;

        case AggregationField.SPECIALIZATIONS:
          aggregations.specializations = await this.institutionsService.getAvailableSpecializations();
          break;

        case AggregationField.SUPPORT_NEEDS:
          aggregations.supportNeeds = await this.institutionsService.getAvailableSupportNeeds();
          break;
      }
    }

    return aggregations;
  }

  private async aggregateInstitutionType(): Promise<any[]> {
    const stats = await this.institutionsService.getStatistics();
    return [
      { type: 'school', count: stats.schools },
      { type: 'tutor_centre', count: stats.tutorCentres },
    ];
  }

  private async aggregateVerificationStatus(): Promise<any[]> {
    const stats = await this.institutionsService.getStatistics();
    return [
      { status: 'verified', count: stats.verified },
      { status: 'pending', count: stats.pending },
    ];
  }

  private async aggregateLearnerStatus(
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<any[]> {
    const stats = await this.learnersService.getStatistics(
      userRole === UserRole.SUPER_ADMIN ? undefined : institutionId,
    );
    return [
      { status: 'active', count: stats.active },
      { status: 'transitioning', count: stats.transitioning },
      { status: 'completed', count: stats.completed },
    ];
  }

  private async aggregateTransferStatus(
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<any[]> {
    const stats = await this.transfersService.getStatistics(
      userRole === UserRole.SUPER_ADMIN ? undefined : institutionId,
    );
    return [
      { status: 'pending', count: stats.pending },
      { status: 'approved', count: stats.approved },
      { status: 'completed', count: stats.completed },
      { status: 'rejected', count: stats.rejected },
    ];
  }

  private async aggregateMessageCategory(
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<any[]> {
    const stats = await this.messagesService.getStatistics(
      userRole === UserRole.SUPER_ADMIN ? undefined : institutionId,
    );
    // This would need to be implemented in MessagesService
    return [];
  }

  private async aggregateByCity(): Promise<any[]> {
    // This would require a custom query in InstitutionsService
    return [];
  }

  private async aggregateByProvince(): Promise<any[]> {
    // This would require a custom query in InstitutionsService
    return [];
  }

  // Saved Searches Management
  async createSavedSearch(
    createSavedSearchDto: CreateSavedSearchDto,
    userId: string,
    institutionId: string,
  ): Promise<SavedSearch> {
    const savedSearch = this.savedSearchRepository.create({
      ...createSavedSearchDto,
      userId,
      institutionId,
    });

    return this.savedSearchRepository.save(savedSearch);
  }

  async findAllSavedSearches(userId: string, institutionId: string): Promise<SavedSearch[]> {
    return this.savedSearchRepository.find({
      where: [
        { userId },
        { isShared: true, institutionId },
        { sharedWith: In([userId]) as any },
      ],
      order: { lastUsedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async findSavedSearch(id: string, userId: string): Promise<SavedSearch> {
    const savedSearch = await this.savedSearchRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!savedSearch) {
      throw new NotFoundException('Saved search not found');
    }

    // Check access
    if (
      savedSearch.userId !== userId &&
      !savedSearch.isShared &&
      !savedSearch.sharedWith.includes(userId)
    ) {
      throw new ForbiddenException('You do not have access to this saved search');
    }

    return savedSearch;
  }

  async updateSavedSearch(
    id: string,
    updateSavedSearchDto: UpdateSavedSearchDto,
    userId: string,
  ): Promise<SavedSearch> {
    const savedSearch = await this.savedSearchRepository.findOne({
      where: { id, userId },
    });

    if (!savedSearch) {
      throw new NotFoundException('Saved search not found or access denied');
    }

    Object.assign(savedSearch, updateSavedSearchDto);

    return this.savedSearchRepository.save(savedSearch);
  }

  async executeSavedSearch(
    id: string,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<any> {
    const savedSearch = await this.findSavedSearch(id, userId);

    // Update usage stats
    savedSearch.usageCount += 1;
    savedSearch.lastUsedAt = new Date();
    await this.savedSearchRepository.save(savedSearch);

    // Execute the search based on scope
    switch (savedSearch.scope) {
      case SearchScope.INSTITUTIONS:
        return this.institutionsService.findAll({
          page: 1,
          limit: 20,
          ...savedSearch.filters,
        });

      case SearchScope.LEARNERS:
        return this.learnersService.findAll(
          {
            page: 1,
            limit: 20,
            ...savedSearch.filters,
          },
          userId,
          institutionId,
          userRole,
        );

      case SearchScope.TRANSFERS:
        return this.transfersService.findAll(
          {
            page: 1,
            limit: 20,
            ...savedSearch.filters,
          },
          userId,
          institutionId,
          userRole,
        );

      case SearchScope.MESSAGES:
        return this.messagesService.findAll(
          {
            page: 1,
            limit: 20,
            ...savedSearch.filters,
          },
          userId,
          institutionId,
          userRole,
        );

      case SearchScope.ALL:
        return this.universalSearch(
          {
            page: 1,
            limit: 20,
            query: savedSearch.filters.query,
          },
          userId,
          institutionId,
          userRole,
        );

      default:
        throw new BadRequestException('Invalid search scope');
    }
  }

  async deleteSavedSearch(id: string, userId: string): Promise<void> {
    const savedSearch = await this.savedSearchRepository.findOne({
      where: { id, userId },
    });

    if (!savedSearch) {
      throw new NotFoundException('Saved search not found or access denied');
    }

    await this.savedSearchRepository.remove(savedSearch);
  }

  async getSearchSuggestions(
    query: string,
    scope: SearchScope,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<string[]> {
    const suggestions: Set<string> = new Set();

    if (scope === SearchScope.INSTITUTIONS || scope === SearchScope.ALL) {
      const specializations = await this.institutionsService.getAvailableSpecializations();
      specializations
        .filter((s) => s.toLowerCase().includes(query.toLowerCase()))
        .forEach((s) => suggestions.add(s));

      const supportNeeds = await this.institutionsService.getAvailableSupportNeeds();
      supportNeeds
        .filter((s) => s.toLowerCase().includes(query.toLowerCase()))
        .forEach((s) => suggestions.add(s));
    }

    return Array.from(suggestions).slice(0, 10);
  }

  async getPopularSearches(
    userId: string,
    institutionId: string,
    limit: number = 5,
  ): Promise<SavedSearch[]> {
    return this.savedSearchRepository.find({
      where: [
        { userId },
        { isShared: true, institutionId },
      ],
      order: { usageCount: 'DESC' },
      take: limit,
    });
  }
}
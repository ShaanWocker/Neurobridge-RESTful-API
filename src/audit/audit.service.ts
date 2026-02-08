import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, In, Like, MoreThan } from 'typeorm';
import {
  AuditLog,
  AuditAction,
  AuditCategory,
  AuditSeverity,
} from './entities/audit-log.entity';
import { AuditReport, ReportStatus } from './entities/audit-report.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { SearchAuditLogDto } from './dto/search-audit-log.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { UserRole } from '@users/entities/user.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(AuditReport)
    private reportRepository: Repository<AuditReport>,
  ) {}

  private getCategoryFromAction(action: AuditAction): AuditCategory {
    const categoryMap: Record<string, AuditCategory> = {
      user_login: AuditCategory.AUTHENTICATION,
      user_logout: AuditCategory.AUTHENTICATION,
      password_changed: AuditCategory.AUTHENTICATION,
      permission_denied: AuditCategory.AUTHORIZATION,
      unauthorized_access_attempt: AuditCategory.AUTHORIZATION,
      learner_viewed: AuditCategory.DATA_ACCESS,
      institution_viewed: AuditCategory.DATA_ACCESS,
      learner_created: AuditCategory.DATA_MODIFICATION,
      learner_updated: AuditCategory.DATA_MODIFICATION,
      learner_deleted: AuditCategory.DATA_DELETION,
      message_sent: AuditCategory.COMMUNICATION,
      message_read: AuditCategory.COMMUNICATION,
      consent_granted: AuditCategory.PRIVACY,
      consent_revoked: AuditCategory.PRIVACY,
      data_shared: AuditCategory.PRIVACY,
      suspicious_activity: AuditCategory.SECURITY,
      system_config_changed: AuditCategory.SYSTEM,
      data_export_request: AuditCategory.COMPLIANCE,
    };

    return categoryMap[action] || AuditCategory.SYSTEM;
  }

  async log(data: Partial<CreateAuditLogDto>): Promise<AuditLog> {
    // Auto-determine category if not provided
    if (!data.category && data.action) {
      data.category = this.getCategoryFromAction(data.action);
    }

    // Set default severity
    if (!data.severity) {
      data.severity = AuditSeverity.INFO;
    }

    const auditLog = this.auditLogRepository.create(data);

    return this.auditLogRepository.save(auditLog);
  }

  async findAll(
    searchDto: SearchAuditLogDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<PaginatedResponseDto<AuditLog>> {
    const {
      page,
      limit,
      userId: filterUserId,
      institutionId: filterInstitutionId,
      action,
      category,
      severity,
      entityType,
      entityId,
      ipAddress,
      search,
      fromDate,
      toDate,
      actions,
      categories,
      tags,
    } = searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit');

    // Access control: non-super-admins only see logs from their institution
    if (userRole !== UserRole.SUPER_ADMIN) {
      queryBuilder.andWhere('audit.institutionId = :institutionId', { institutionId });
    }

    // Filters
    if (filterUserId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId: filterUserId });
    }

    if (filterInstitutionId && userRole === UserRole.SUPER_ADMIN) {
      queryBuilder.andWhere('audit.institutionId = :institutionId', {
        institutionId: filterInstitutionId,
      });
    }

    if (action) {
      queryBuilder.andWhere('audit.action = :action', { action });
    }

    if (actions && actions.length > 0) {
      queryBuilder.andWhere('audit.action IN (:...actions)', { actions });
    }

    if (category) {
      queryBuilder.andWhere('audit.category = :category', { category });
    }

    if (categories && categories.length > 0) {
      queryBuilder.andWhere('audit.category IN (:...categories)', { categories });
    }

    if (severity) {
      queryBuilder.andWhere('audit.severity = :severity', { severity });
    }

    if (entityType) {
      queryBuilder.andWhere('audit.entityType = :entityType', { entityType });
    }

    if (entityId) {
      queryBuilder.andWhere('audit.entityId = :entityId', { entityId });
    }

    if (ipAddress) {
      queryBuilder.andWhere('audit.ipAddress = :ipAddress', { ipAddress });
    }

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(audit.description) LIKE LOWER(:search) OR LOWER(audit.entityName) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (fromDate) {
      queryBuilder.andWhere('audit.createdAt >= :fromDate', { fromDate });
    }

    if (toDate) {
      queryBuilder.andWhere('audit.createdAt <= :toDate', { toDate });
    }

    if (tags && tags.length > 0) {
      queryBuilder.andWhere('audit.tags && :tags', { tags });
    }

    // Pagination
    queryBuilder
      .leftJoinAndSelect('audit.user', 'user')
      .skip(skip)
      .take(limit)
      .orderBy('audit.createdAt', 'DESC');

    const [logs, totalItems] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: logs,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string, userId: string, institutionId: string, userRole: UserRole): Promise<AuditLog> {
    const log = await this.auditLogRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!log) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }

    // Access control
    if (userRole !== UserRole.SUPER_ADMIN && log.institutionId !== institutionId) {
      throw new ForbiddenException('You do not have access to this audit log');
    }

    return log;
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<AuditLog[]> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit');

    queryBuilder
      .where('audit.entityType = :entityType', { entityType })
      .andWhere('audit.entityId = :entityId', { entityId });

    // Access control
    if (userRole !== UserRole.SUPER_ADMIN) {
      queryBuilder.andWhere('audit.institutionId = :institutionId', { institutionId });
    }

    queryBuilder
      .leftJoinAndSelect('audit.user', 'user')
      .orderBy('audit.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async getStatistics(
    fromDate?: string,
    toDate?: string,
    institutionId?: string,
  ): Promise<any> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit');

    if (institutionId) {
      queryBuilder.where('audit.institutionId = :institutionId', { institutionId });
    }

    if (fromDate) {
      queryBuilder.andWhere('audit.createdAt >= :fromDate', { fromDate });
    }

    if (toDate) {
      queryBuilder.andWhere('audit.createdAt <= :toDate', { toDate });
    }

    const total = await queryBuilder.getCount();

    // Count by severity
    const severityCounts = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .where(institutionId ? 'audit.institutionId = :institutionId' : '1=1', { institutionId })
      .andWhere(fromDate ? 'audit.createdAt >= :fromDate' : '1=1', { fromDate })
      .andWhere(toDate ? 'audit.createdAt <= :toDate' : '1=1', { toDate })
      .groupBy('audit.severity')
      .getRawMany();

    // Count by category
    const categoryCounts = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where(institutionId ? 'audit.institutionId = :institutionId' : '1=1', { institutionId })
      .andWhere(fromDate ? 'audit.createdAt >= :fromDate' : '1=1', { fromDate })
      .andWhere(toDate ? 'audit.createdAt <= :toDate' : '1=1', { toDate })
      .groupBy('audit.category')
      .getRawMany();

    // Top actions
    const topActions = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where(institutionId ? 'audit.institutionId = :institutionId' : '1=1', { institutionId })
      .andWhere(fromDate ? 'audit.createdAt >= :fromDate' : '1=1', { fromDate })
      .andWhere(toDate ? 'audit.createdAt <= :toDate' : '1=1', { toDate })
      .groupBy('audit.action')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // Unique users
    const uniqueUsers = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('COUNT(DISTINCT audit.userId)', 'count')
      .where(institutionId ? 'audit.institutionId = :institutionId' : '1=1', { institutionId })
      .andWhere(fromDate ? 'audit.createdAt >= :fromDate' : '1=1', { fromDate })
      .andWhere(toDate ? 'audit.createdAt <= :toDate' : '1=1', { toDate })
      .getRawOne();

    // Activity by day (last 30 days)
    const activityByDay = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select("DATE(audit.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where(institutionId ? 'audit.institutionId = :institutionId' : '1=1', { institutionId })
      .andWhere('audit.createdAt >= NOW() - INTERVAL \'30 days\'')
      .groupBy('DATE(audit.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      total,
      uniqueUsers: parseInt(uniqueUsers.count),
      bySeverity: severityCounts.map((s) => ({
        severity: s.severity,
        count: parseInt(s.count),
      })),
      byCategory: categoryCounts.map((c) => ({
        category: c.category,
        count: parseInt(c.count),
      })),
      topActions: topActions.map((a) => ({
        action: a.action,
        count: parseInt(a.count),
      })),
      activityByDay: activityByDay.map((d) => ({
        date: d.date,
        count: parseInt(d.count),
      })),
    };
  }

  // Report Management
  async createReport(
    createReportDto: CreateReportDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<AuditReport> {
    const report = this.reportRepository.create({
      ...createReportDto,
      generatedBy: userId,
      institutionId: userRole === UserRole.SUPER_ADMIN ? null : institutionId,
      status: ReportStatus.PENDING,
    });

    const savedReport = await this.reportRepository.save(report);

    // Trigger async report generation (in production, use a queue)
    this.generateReport(savedReport.id).catch((error) => {
      console.error('Report generation failed:', error);
    });

    return savedReport;
  }

  private async generateReport(reportId: string): Promise<void> {
    const report = await this.reportRepository.findOne({ where: { id: reportId } });

    if (!report) return;

    try {
      report.status = ReportStatus.GENERATING;
      await this.reportRepository.save(report);

      // Build query based on report parameters
      const queryBuilder = this.auditLogRepository.createQueryBuilder('audit');

      queryBuilder
        .where('audit.createdAt >= :startDate', { startDate: report.startDate })
        .andWhere('audit.createdAt <= :endDate', { endDate: report.endDate });

      if (report.institutionId) {
        queryBuilder.andWhere('audit.institutionId = :institutionId', {
          institutionId: report.institutionId,
        });
      }

      if (report.filters) {
        const { userId, institutionId, actions, categories, severities, entityTypes } =
          report.filters;

        if (userId) {
          queryBuilder.andWhere('audit.userId = :userId', { userId });
        }
        if (institutionId) {
          queryBuilder.andWhere('audit.institutionId = :filterInstitutionId', {
            filterInstitutionId: institutionId,
          });
        }
        if (actions && actions.length > 0) {
          queryBuilder.andWhere('audit.action IN (:...actions)', { actions });
        }
        if (categories && categories.length > 0) {
          queryBuilder.andWhere('audit.category IN (:...categories)', { categories });
        }
        if (severities && severities.length > 0) {
          queryBuilder.andWhere('audit.severity IN (:...severities)', { severities });
        }
        if (entityTypes && entityTypes.length > 0) {
          queryBuilder.andWhere('audit.entityType IN (:...entityTypes)', { entityTypes });
        }
      }

      queryBuilder
        .leftJoinAndSelect('audit.user', 'user')
        .orderBy('audit.createdAt', 'DESC');

      const logs = await queryBuilder.getMany();

      // Generate summary
      const totalActions = logs.length;
      const uniqueUsers = new Set(logs.map((l) => l.userId).filter(Boolean)).size;
      const criticalEvents = logs.filter(
        (l) => l.severity === AuditSeverity.CRITICAL,
      ).length;
      const securityIncidents = logs.filter((l) =>
        [
          AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
          AuditAction.SUSPICIOUS_ACTIVITY,
          AuditAction.PERMISSION_DENIED,
        ].includes(l.action),
      ).length;

      // Top actions
      const actionCounts = logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Activity by day
      const activityByDay = logs.reduce((acc, log) => {
        const date = log.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const activityByDayArray = Object.entries(activityByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      report.status = ReportStatus.COMPLETED;
      report.generatedAt = new Date();
      report.totalRecords = totalActions;
      report.summary = {
        totalActions,
        uniqueUsers,
        criticalEvents,
        securityIncidents,
        topActions,
        activityByDay: activityByDayArray,
      };

      // In production, generate actual file (PDF/CSV/Excel) and upload to storage
      // For now, we'll just mark as completed
      report.fileUrl = `/api/audit/reports/${report.id}/download`;

      await this.reportRepository.save(report);
    } catch (error) {
      report.status = ReportStatus.FAILED;
      report.errorMessage = error.message;
      report.retryCount += 1;
      await this.reportRepository.save(report);
    }
  }

  async findAllReports(
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<AuditReport[]> {
    const queryBuilder = this.reportRepository.createQueryBuilder('report');

    if (userRole !== UserRole.SUPER_ADMIN) {
      queryBuilder.where(
        '(report.generatedBy = :userId OR report.institutionId = :institutionId)',
        { userId, institutionId },
      );
    }

    queryBuilder
      .leftJoinAndSelect('report.generator', 'generator')
      .orderBy('report.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async findReport(
    id: string,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<AuditReport> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['generator'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Access control
    if (
      userRole !== UserRole.SUPER_ADMIN &&
      report.generatedBy !== userId &&
      report.institutionId !== institutionId
    ) {
      throw new ForbiddenException('You do not have access to this report');
    }

    return report;
  }

  async deleteReport(
    id: string,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<void> {
    const report = await this.findReport(id, userId, institutionId, userRole);

    await this.reportRepository.remove(report);
  }

  // Cleanup old logs (for data retention compliance)
  async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('severity != :critical', { critical: AuditSeverity.CRITICAL })
      .execute();

    return result.affected || 0;
  }
}
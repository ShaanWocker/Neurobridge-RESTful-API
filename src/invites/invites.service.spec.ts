import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FindOperator, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { InvitesService } from './invites.service';
import { Invite } from './entities/invite.entity';
import { UserRole } from '@users/entities/user.entity';
import { GoneException, NotFoundException } from '@nestjs/common';

const mockInvite = (overrides: Partial<Invite> = {}): Invite => ({
  id: 'uuid-1',
  email: 'admin@example.com',
  role: UserRole.SUPER_ADMIN,
  institutionId: null,
  tokenHash: 'hashed',
  expiresAt: new Date(Date.now() + 3600 * 1000),
  usedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('InvitesService', () => {
  let service: InvitesService;
  let repo: jest.Mocked<Repository<Invite>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitesService,
        {
          provide: getRepositoryToken(Invite),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InvitesService>(InvitesService);
    repo = module.get(getRepositoryToken(Invite));
  });

  describe('createInvite', () => {
    it('should create an invite and return a raw token', async () => {
      const invite = mockInvite();
      repo.create.mockReturnValue(invite);
      repo.save.mockResolvedValue(invite);
      repo.delete.mockResolvedValue({ raw: [], affected: 0 });

      const result = await service.createInvite('admin@example.com', UserRole.SUPER_ADMIN);

      expect(result.token).toBeDefined();
      expect(result.token.length).toBeGreaterThan(0);
      expect(result.invite).toBe(invite);
      expect(repo.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'admin@example.com',
          role: UserRole.SUPER_ADMIN,
          usedAt: expect.any(FindOperator),
        }),
      );
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
    });

    it('should hash the token before storing', async () => {
      const createdInvites: Partial<Invite>[] = [];
      repo.create.mockImplementation((data) => {
        createdInvites.push(data as Partial<Invite>);
        return data as Invite;
      });
      repo.save.mockResolvedValue(mockInvite());
      repo.delete.mockResolvedValue({ raw: [], affected: 0 });

      const result = await service.createInvite('admin@example.com', UserRole.SUPER_ADMIN);

      const expectedHash = crypto
        .createHash('sha256')
        .update(result.token)
        .digest('hex');

      expect(createdInvites[0].tokenHash).toBe(expectedHash);
    });
  });

  describe('validateAndConsumeInvite', () => {
    it('should validate a valid invite and mark it as used', async () => {
      const token = 'valid-token';
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const invite = mockInvite({ tokenHash });
      repo.findOne.mockResolvedValue(invite);
      repo.save.mockResolvedValue({ ...invite, usedAt: new Date() });

      const result = await service.validateAndConsumeInvite(token);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { tokenHash } });
      expect(repo.save).toHaveBeenCalled();
      expect(result.usedAt).toBeDefined();
    });

    it('should throw NotFoundException for unknown token', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.validateAndConsumeInvite('bad-token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw GoneException if invite already used', async () => {
      repo.findOne.mockResolvedValue(mockInvite({ usedAt: new Date() }));

      await expect(service.validateAndConsumeInvite('used-token')).rejects.toThrow(
        GoneException,
      );
    });

    it('should throw GoneException if invite is expired', async () => {
      repo.findOne.mockResolvedValue(
        mockInvite({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(service.validateAndConsumeInvite('expired-token')).rejects.toThrow(
        GoneException,
      );
    });
  });
});

import {
  Injectable,
  BadRequestException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Invite } from './entities/invite.entity';
import { UserRole } from '@users/entities/user.entity';

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(Invite)
    private invitesRepository: Repository<Invite>,
  ) {}

  async createInvite(
    email: string,
    role: UserRole,
    institutionId?: string,
    ttlHours = 72,
  ): Promise<{ token: string; invite: Invite }> {
    // Generate a cryptographically secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    // Invalidate any existing unused invites for this email+role combo
    await this.invitesRepository.delete({ email, role, usedAt: IsNull() });

    const invite = this.invitesRepository.create({
      email,
      role,
      institutionId: institutionId ?? null,
      tokenHash,
      expiresAt,
    });

    await this.invitesRepository.save(invite);

    return { token, invite };
  }

  async validateAndConsumeInvite(token: string): Promise<Invite> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invite = await this.invitesRepository.findOne({ where: { tokenHash } });

    if (!invite) {
      throw new NotFoundException('Invite not found or already used');
    }

    if (invite.usedAt) {
      throw new GoneException('Invite has already been used');
    }

    if (new Date() > invite.expiresAt) {
      throw new GoneException('Invite has expired');
    }

    // Mark as used
    invite.usedAt = new Date();
    await this.invitesRepository.save(invite);

    return invite;
  }
}

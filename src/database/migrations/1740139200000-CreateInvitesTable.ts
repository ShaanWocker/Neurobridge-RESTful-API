import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvitesTable1740139200000 implements MigrationInterface {
  name = 'CreateInvitesTable1740139200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."invites_role_enum" AS ENUM('super_admin', 'school_admin', 'tutor_centre_admin')
    `);

    await queryRunner.query(`
      CREATE TABLE "invites" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "role" "public"."invites_role_enum" NOT NULL,
        "institutionId" character varying,
        "tokenHash" character varying NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "usedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_invites_tokenHash" UNIQUE ("tokenHash"),
        CONSTRAINT "PK_invites_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invites_tokenHash" ON "invites" ("tokenHash")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invites_email" ON "invites" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_invites_email"`);
    await queryRunner.query(`DROP INDEX "IDX_invites_tokenHash"`);
    await queryRunner.query(`DROP TABLE "invites"`);
    await queryRunner.query(`DROP TYPE "public"."invites_role_enum"`);
  }
}

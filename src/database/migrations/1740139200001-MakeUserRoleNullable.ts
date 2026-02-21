import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeUserRoleNullable1740139200001 implements MigrationInterface {
  name = 'MakeUserRoleNullable1740139200001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "role" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."users_status_enum" ADD VALUE IF NOT EXISTS 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users" SET "role" = 'school_admin' WHERE "role" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL
    `);
  }
}

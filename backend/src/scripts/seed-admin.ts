/**
 * One-off script to create the first ADMIN user (auth/register requires an existing ADMIN,
 * so this bootstraps that first account).
 *
 * Usage: ts-node src/scripts/seed-admin.ts
 * (or compile first: npm run build && node dist/scripts/seed-admin.js)
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize-typescript';
import * as bcrypt from 'bcryptjs';
import { User } from '@/modules/users/models/user.model';
import { Role } from '../common/enums/role.enum';

async function main() {
  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    models: [User],
    logging: false,
  });

  const email = process.argv[2] ?? 'admin@example.com';
  const password = process.argv[3] ?? 'ChangeMe123!';
  const name = process.argv[4] ?? 'Super Admin';

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    console.log(`User ${email} already exists.`);
    await sequelize.close();
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);
  await User.create({ name, email, password_hash, role: Role.ADMIN } as any);

  console.log(`Created ADMIN user: ${email} / ${password}`);
  console.log(
    'Log in via POST /auth/login, then change the password flow as needed.',
  );
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

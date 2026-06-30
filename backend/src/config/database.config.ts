import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';

export const databaseConfig = (
  config: ConfigService,
): SequelizeModuleOptions => ({
  dialect: 'mysql',
  host: config.get<string>('DB_HOST'),
  port: config.get<number>('DB_PORT'),
  username: config.get<string>('DB_USER'),
  password: config.get<string>('DB_PASS'),
  database: config.get<string>('DB_NAME'),

  // Automatically loads models registered via SequelizeModule.forFeature()
  autoLoadModels: true,

  // SQL schema is managed manually (schema.sql)
  // Keep this FALSE in production.
  synchronize: false,

  logging: false,

  // Connection Pool
  pool: {
    max: 50,
    min: 8,
    acquire: 60000,
    idle: 30000,
    evict: 10000,
  },

  // Default model settings
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true,
    underscored: false,
  },

  // India timezone
  timezone: '+05:30',

  // Retry on temporary connection failures
  retry: {
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
    ],
    max: 3,
  },
});

export default databaseConfig;

import { DataSource } from 'typeorm';
import * as path from 'path';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DATABASE_PATH || './data/assignment.sqlite',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
  subscribers: [path.join(__dirname, '../subscribers/*{.ts,.js}')],
});

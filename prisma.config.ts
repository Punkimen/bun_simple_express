import { defineConfig } from 'prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: 'src/server/prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrate: {
    async adapter() {
      return new PrismaPg({
        connectionString: process.env.DATABASE_URL!,
      });
    },
  },
});

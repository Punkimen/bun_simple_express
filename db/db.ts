import { SQL } from 'bun';
import * as dotenv from 'dotenv';

dotenv.config();

const db = new SQL(process.env.DATABASE_URL!);

export default db;

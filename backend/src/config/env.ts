import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
const envPath = resolve(__dirname, '../..', '.env');
dotenv.config({ path: envPath });

// Define and validate environment variables
export const env = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
};  
import { z } from 'zod';
import 'dotenv/config';

// Environment variable schema
const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432'),
  DB_NAME: z.string().default('vacation_portal'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

// Parse and validate environment variables
function loadConfig() {
  try {
    const env = envSchema.parse(process.env);
    
    return {
      port: parseInt(env.PORT, 10),
      nodeEnv: env.NODE_ENV,
      db: {
        host: env.DB_HOST,
        port: parseInt(env.DB_PORT, 10),
        name: env.DB_NAME,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
      },
      jwt: {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN,
      },
      cors: {
        origin: env.CORS_ORIGIN,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export const config = loadConfig();

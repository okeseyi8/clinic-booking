import Joi from 'joi';

/**
 * All configuration comes from the environment and is validated once at boot.
 * A misconfigured deploy crashes immediately with a clear message instead of
 * failing on the first request.
 */
interface Env {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  MONGODB_URI: string;
  API_KEY: string;
  CORS_ORIGIN: string[];
  LOG_LEVEL: string;
}

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(4000),
  MONGODB_URI: Joi.string().uri({ scheme: ['mongodb', 'mongodb+srv'] }).required(),
  API_KEY: Joi.string().min(16).required(),
  CORS_ORIGIN: Joi.string().default(''),
  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent').default('info'),
}).unknown(true);

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const { value, error } = schema.validate(source, { abortEarly: false });
  if (error) {
    throw new Error(`Invalid environment: ${error.details.map((d) => d.message).join('; ')}`);
  }
  return {
    ...value,
    CORS_ORIGIN: String(value.CORS_ORIGIN)
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  } as Env;
}

export type { Env };

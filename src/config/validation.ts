import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  APP_NAME: Joi.string().default('sprint-log'),
  APP_PORT: Joi.number().default(3000),
  APP_HOST: Joi.string().default('localhost'),
  DATABASE_PATH: Joi.string().default('./data/database.sqlite'),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  LOG_DIR: Joi.string().default('./logs'),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('7d'),
});

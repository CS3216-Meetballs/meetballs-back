import * as Joi from 'joi';

export default Joi.object({
  NODE_ENV: Joi.string().default('production'),
  DATABASE_URL: Joi.string().required(),
  CLIENT_URL: Joi.string().required(),
  DB_AUTOLOADENTITIES: Joi.boolean().default(true),
  DB_SYNCHRONIZE: Joi.boolean().default(false),

  AWS_REGION: Joi.string().default('ap-southeast-1'),
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_S3_ENDPOINT: Joi.string(),
  AWS_S3_SIGNATURE_VERSION: Joi.string(),
  AWS_S3_BUCKET_NAME: Joi.string().required(),

  JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
  JWT_ACCESS_TOKEN_EXPIRATION_TIME: Joi.string().default('3600'), // in seconds
  JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
  JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.string().default('1209600'), // in seconds
  JWT_MAIL_VERIFY_SECRET: Joi.string().required(),
  JWT_MAIL_VERIFY_EXPIRATION_TIME: Joi.string().default('3600'), // in seconds
  JWT_PASSWORD_RESET_SECRET: Joi.string().required(),
  JWT_PASSWORD_RESET_EXPIRATION_TIME: Joi.string().default('600'), // in seconds
  MAGIC_LINK_SECRET: Joi.string().required(),
  MEETING_SECRET: Joi.string().required(),

  SEEDER_SHOULD_SEED: Joi.boolean().default(false),

  EMAIL_FROM: Joi.string().default('noreply@meetballs.com'),
  EMAIL_HOST: Joi.string().required(), // smtp.office365.com
  EMAIL_PORT: Joi.number().required(), // 587
  EMAIL_ID: Joi.string().required(), // user@outlook.com
  EMAIL_PASS: Joi.string().required(), // password

  ZOOM_CLIENT_ID: Joi.string().required(),
  ZOOM_CLIENT_SECRET: Joi.string().required(),
  ZOOM_VERIFICATION_TOKEN: Joi.string().required(),
});

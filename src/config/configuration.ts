const {
  DATABASE_TYPE,
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_USER,
  DATABASE_PASSWORD,
  DATABASE_NAME,
  JWT_SECRET,
  JWT_EXPIRATION,
  ENCRYPTION_KEY,
  API_PREFIX,
  RATE_LIMIT_WINDOW,
  RATE_LIMIT_MAX,
  LOG_LEVEL,
} = process.env;

export default () => ({
  port: process.env.PORT || 3000,
  database: {
    type: DATABASE_TYPE,
    host: DATABASE_HOST,
    port: DATABASE_PORT || 5432,
    username: DATABASE_USER,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
  },
  jwt: {
    secret: JWT_SECRET,
    expiresIn: JWT_EXPIRATION,
  },
  encryption: {
    key: ENCRYPTION_KEY,
  },
  api: {
    prefix: API_PREFIX || "api",
    rateLimitWindow: RATE_LIMIT_WINDOW || 15,
    rateLimitMax: RATE_LIMIT_MAX || 100,
  },
  logging: {
    level: LOG_LEVEL || "debug",
  },
});

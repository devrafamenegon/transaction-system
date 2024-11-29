export interface AppConfig {
  port: number;
  apiPrefix: string;
  rateLimitWindow: number;
  rateLimitMax: number;
}

export interface DatabaseConfig {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface EncryptionConfig {
  key: string;
}

export interface AuthConfig {
  jwt: JwtConfig;
  encryption: EncryptionConfig;
}

export interface TransactionConfig {
  maxRetries: number;
  initialRetryDelay: number;
}

export interface RedisConfig {
  host: string;
  port: number;
}

export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  auth: AuthConfig;
  transaction: TransactionConfig;
  redis: RedisConfig;
}

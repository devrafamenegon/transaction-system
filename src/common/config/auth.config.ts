import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwt: {
    secret: process.env.JWT_SECRET ?? 'your-super-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRATION ?? '1h',
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY ?? 'your-encryption-key-32-chars-here',
  },
}));
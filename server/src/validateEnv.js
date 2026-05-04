/**
 * Fail fast in production so misconfiguration is obvious at boot (Railway logs).
 */
export default function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!process.env.MONGODB_URI?.trim()) {
    console.error('FATAL: MONGODB_URI is required.');
    process.exit(1);
  }

  if (isProd) {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      console.error('FATAL: JWT_SECRET must be set and at least 32 characters in production.');
      process.exit(1);
    }

    const origins = (process.env.FRONTEND_URL || '')
      .split(',')
      .map((o) => o.trim().replace(/\/$/, ''))
      .filter(Boolean);
    if (origins.length === 0) {
      console.error(
        'FATAL: FRONTEND_URL is required in production (comma-separated origins, e.g. https://your-app.vercel.app).'
      );
      process.exit(1);
    }
  }
}

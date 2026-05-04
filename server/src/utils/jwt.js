import jwt from 'jsonwebtoken';

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!s || s.length < 32) {
      throw new Error('JWT_SECRET must be set and at least 32 characters in production');
    }
    return s;
  }
  return s || 'dev-only-insecure-jwt-secret-change-me';
}

export function signToken(payload) {
  return jwt.sign(payload, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

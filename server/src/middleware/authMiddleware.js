import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

/**
 * Verifies Bearer JWT and attaches the user document to req.user (without password).
 */
export default async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const raw = header.slice(7);
    const decoded = verifyToken(raw);
    const user = await User.findById(decoded.sub).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    req.token = raw;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const listUsers = asyncHandler(async (req, res) => {
  const q = (req.query.search || '').trim();
  const limit = Math.min(Number(req.query.limit) || 300, 500);

  const filter = {};
  if (q.length > 0) {
    const safe = escapeRegex(q);
    filter.$or = [
      { name: new RegExp(safe, 'i') },
      { email: new RegExp(safe, 'i') },
    ];
  }

  const users = await User.find(filter).select('name email').sort({ name: 1 }).limit(limit).lean();

  return res.json(
    users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
    }))
  );
});

import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 40, 100);
  const items = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actor', 'name email')
    .lean();

  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });

  return res.json({ notifications: items, unreadCount });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid notification id' });
  }

  const doc = await Notification.findOneAndUpdate(
    { _id: id, recipient: req.user._id },
    { read: true },
    { new: true }
  ).lean();

  if (!doc) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  return res.json({ notification: doc });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  return res.json({ ok: true });
});

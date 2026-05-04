import Notification from '../models/Notification.js';

export async function sendNotification({
  recipientId,
  actorId,
  type,
  title,
  message,
  projectId,
  taskId,
}) {
  if (!recipientId) return;
  if (actorId && recipientId.toString() === actorId.toString()) return;

  await Notification.create({
    recipient: recipientId,
    actor: actorId || undefined,
    type,
    title,
    message,
    projectId: projectId || undefined,
    taskId: taskId || undefined,
  });
}

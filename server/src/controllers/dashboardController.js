import Task from '../models/Task.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getAccessibleProjectIds } from '../utils/projectAccess.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const uid = req.user._id;

  const projectIds = await getAccessibleProjectIds(uid);
  if (projectIds.length === 0) {
    return res.json({
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      tasksByStatus: { Todo: 0, 'In Progress': 0, Done: 0 },
      myTasks: [],
    });
  }

  const tasks = await Task.find({ projectId: { $in: projectIds } }).select('status dueDate');

  const now = new Date();
  let completedTasks = 0;
  let pendingTasks = 0;
  let overdueTasks = 0;
  const tasksByStatus = { Todo: 0, 'In Progress': 0, Done: 0 };

  for (const t of tasks) {
    tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
    if (t.status === 'Done') {
      completedTasks += 1;
    } else {
      pendingTasks += 1;
    }
    if (t.dueDate && t.status !== 'Done' && new Date(t.dueDate) < now) {
      overdueTasks += 1;
    }
  }

  const myPending = await Task.find({
    assignedTo: uid,
    status: { $ne: 'Done' },
  })
    .select('title status projectId dueDate')
    .populate('projectId', 'title')
    .sort({ dueDate: 1, createdAt: -1 })
    .limit(50)
    .lean();

  const myTasks = myPending.map((t) => {
    const proj = t.projectId;
    const pid = proj && typeof proj === 'object' && proj._id ? proj._id : t.projectId;
    const projectName = proj && typeof proj === 'object' && proj.title ? proj.title : 'Project';
    return {
      _id: t._id,
      title: t.title,
      status: t.status,
      projectId: pid,
      projectName,
      dueDate: t.dueDate,
    };
  });

  return res.json({
    totalTasks: tasks.length,
    completedTasks,
    pendingTasks,
    overdueTasks,
    tasksByStatus,
    myTasks,
  });
});

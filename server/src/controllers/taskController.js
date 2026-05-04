import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { userHasProjectAccess, userCanViewProject } from '../utils/projectAccess.js';
import { sendNotification } from '../utils/notify.js';

function parseDueDate(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const err = new Error('Invalid dueDate');
    err.statusCode = 400;
    throw err;
  }
  return d;
}

export const createTask = asyncHandler(async (req, res) => {
  const { title, description = '', assignedTo, projectId, dueDate, status = 'Todo' } = req.body;
  if (!title?.trim()) {
    return res.status(400).json({ message: 'Title is required' });
  }
  if (!projectId || !mongoose.isValidObjectId(projectId)) {
    return res.status(400).json({ message: 'Valid projectId is required' });
  }
  if (!assignedTo || !mongoose.isValidObjectId(assignedTo)) {
    return res.status(400).json({ message: 'Valid assignedTo user id is required' });
  }

  const { ok, project } = await userHasProjectAccess(req.user._id, projectId);
  if (!ok || !project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const fullProject = await Project.findById(projectId);
  const assignee = await User.findById(assignedTo);
  if (!assignee) {
    return res.status(400).json({ message: 'Assignee not found' });
  }

  const allowedStatus = ['Todo', 'In Progress', 'Done'];
  const taskStatus = allowedStatus.includes(status) ? status : 'Todo';

  const task = await Task.create({
    title: title.trim(),
    description: String(description).trim(),
    status: taskStatus,
    assignedTo,
    projectId,
    dueDate: parseDueDate(dueDate),
  });

  fullProject.tasks.push(task._id);
  await fullProject.save();

  const actorName = req.user.name;
  await sendNotification({
    recipientId: assignedTo,
    actorId: req.user._id,
    type: 'task_assigned',
    title: 'New task assigned',
    message: `${actorName} assigned you the task "${task.title.trim()}" in project "${fullProject.title}".`,
    projectId,
    taskId: task._id,
  });

  const populated = await Task.findById(task._id).populate('assignedTo', 'name email role');

  return res.status(201).json({ task: populated });
});

export const listTasksByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  if (!mongoose.isValidObjectId(projectId)) {
    return res.status(400).json({ message: 'Invalid project id' });
  }

  const { ok } = await userCanViewProject(req.user._id, projectId);
  if (!ok) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const tasks = await Task.find({ projectId })
    .sort({ createdAt: -1 })
    .populate('assignedTo', 'name email role');

  return res.json({ tasks });
});

export const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid task id' });
  }

  const task = await Task.findById(id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const originalAssignee = task.assignedTo.toString();

  const { ok } = await userCanViewProject(req.user._id, task.projectId);
  if (!ok) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const isAdmin = req.user.role === 'Admin';
  const isAssignee = task.assignedTo.toString() === req.user._id.toString();

  if (isAdmin) {
    const { title, description, status, assignedTo, dueDate } = req.body;
    if (title !== undefined) task.title = String(title).trim();
    if (description !== undefined) task.description = String(description).trim();
    if (status !== undefined) {
      if (!['Todo', 'In Progress', 'Done'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      task.status = status;
    }
    if (dueDate !== undefined) {
      task.dueDate = dueDate === null || dueDate === '' ? undefined : parseDueDate(dueDate);
    }
    if (assignedTo !== undefined) {
      if (!mongoose.isValidObjectId(assignedTo)) {
        return res.status(400).json({ message: 'Invalid assignedTo' });
      }
      const assignee = await User.findById(assignedTo);
      if (!assignee) {
        return res.status(400).json({ message: 'Assignee not found' });
      }
      task.assignedTo = assignedTo;
    }
  } else if (isAssignee) {
    const { status } = req.body;
    if (status === undefined) {
      return res.status(403).json({ message: 'Members may only update task status' });
    }
    if (!['Todo', 'In Progress', 'Done'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    task.status = status;
  } else {
    return res.status(403).json({ message: 'You can only update tasks assigned to you' });
  }

  await task.save();

  if (isAdmin && req.body.assignedTo !== undefined && originalAssignee !== task.assignedTo.toString()) {
    const fullProject = await Project.findById(task.projectId).select('title').lean();
    await sendNotification({
      recipientId: task.assignedTo,
      actorId: req.user._id,
      type: 'task_assigned',
      title: 'Task assigned to you',
      message: `${req.user.name} assigned you the task "${task.title}" in project "${fullProject.title}".`,
      projectId: task.projectId,
      taskId: task._id,
    });
  }

  const populated = await Task.findById(task._id).populate('assignedTo', 'name email role');
  return res.json({ task: populated });
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid task id' });
  }
  if (!status || !['Todo', 'In Progress', 'Done'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const task = await Task.findById(id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const { ok } = await userCanViewProject(req.user._id, task.projectId);
  if (!ok) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const isAdmin = req.user.role === 'Admin';
  const isAssignee = task.assignedTo.toString() === req.user._id.toString();
  if (!isAdmin && !isAssignee) {
    return res.status(403).json({ message: 'Only the assignee or an admin can update status' });
  }

  task.status = status;
  await task.save();

  const populated = await Task.findById(task._id).populate('assignedTo', 'name email');
  return res.json({ task: populated });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid task id' });
  }

  const task = await Task.findById(id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const { ok } = await userHasProjectAccess(req.user._id, task.projectId);
  if (!ok) {
    return res.status(404).json({ message: 'Task not found' });
  }

  await Project.findByIdAndUpdate(task.projectId, { $pull: { tasks: task._id } });
  await task.deleteOne();
  return res.json({ message: 'Task deleted' });
});

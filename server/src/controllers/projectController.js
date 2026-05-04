import mongoose from 'mongoose';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import asyncHandler from '../utils/asyncHandler.js';
import { userHasProjectAccess, userCanViewProject, getAccessibleProjectIds } from '../utils/projectAccess.js';
import { syncUsersForProject } from '../utils/syncUserProjects.js';
import { sendNotification } from '../utils/notify.js';

function uniqueObjectIds(ids) {
  const set = new Set();
  for (const raw of ids || []) {
    if (!mongoose.isValidObjectId(raw)) {
      const err = new Error('Invalid user id');
      err.statusCode = 400;
      throw err;
    }
    set.add(String(raw));
  }
  return [...set].map((id) => new mongoose.Types.ObjectId(id));
}

export const createProject = asyncHandler(async (req, res) => {
  const { title, description = '', memberIds = [] } = req.body;
  if (!title?.trim()) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const creatorId = req.user._id;
  const extraMembers = uniqueObjectIds(memberIds).filter((id) => id.toString() !== creatorId.toString());

  const users = await User.find({ _id: { $in: extraMembers } });
  if (users.length !== extraMembers.length) {
    return res.status(400).json({ message: 'One or more member IDs are invalid' });
  }

  const members = uniqueObjectIds([creatorId, ...extraMembers]);

  const project = await Project.create({
    title: title.trim(),
    description: String(description).trim(),
    createdBy: creatorId,
    members,
    tasks: [],
  });

  await syncUsersForProject(project._id, members);

  const actorName = req.user.name;
  const projectTitle = title.trim();
  for (const mid of members) {
    if (mid.toString() === creatorId.toString()) continue;
    await sendNotification({
      recipientId: mid,
      actorId: creatorId,
      type: 'project_added',
      title: 'Added to a project',
      message: `${actorName} added you to the project "${projectTitle}".`,
      projectId: project._id,
    });
  }

  const populated = await Project.findById(project._id)
    .populate('createdBy', 'name email role')
    .populate('members', 'name email role');

  return res.status(201).json({ project: populated });
});

export const listProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  if (!mongoose.isValidObjectId(projectId)) {
    return res.status(400).json({ message: 'Invalid project id' });
  }

  const { ok } = await userCanViewProject(req.user._id, projectId);
  if (!ok) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const full = await Project.findById(projectId).select('createdBy members').lean();
  if (!full) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const idSet = new Set([
    full.createdBy.toString(),
    ...(full.members || []).map((m) => m.toString()),
  ]);
  const objectIds = [...idSet].map((s) => new mongoose.Types.ObjectId(s));

  const users = await User.find({ _id: { $in: objectIds } })
    .select('name email')
    .sort({ name: 1 })
    .lean();

  const payload = users.map((u) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
  }));

  return res.json(payload);
});

export const listProjects = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const ids = await getAccessibleProjectIds(uid);
  if (ids.length === 0) {
    return res.json({ projects: [] });
  }

  const projects = await Project.find({ _id: { $in: ids } })
    .sort({ updatedAt: -1 })
    .populate('createdBy', 'name email role')
    .populate('members', 'name email role');

  return res.json({ projects });
});

export const getProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { ok } = await userCanViewProject(req.user._id, id);
  if (!ok) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const project = await Project.findById(id)
    .populate('createdBy', 'name email')
    .populate('members', 'name email')
    .populate({
      path: 'tasks',
      select: 'title status assignedTo dueDate',
      options: { sort: { createdAt: -1 } },
      populate: { path: 'assignedTo', select: 'name email' },
    });

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  return res.json({ project });
});

export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { ok, project } = await userHasProjectAccess(req.user._id, id);
  if (!ok || !project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const full = await Project.findById(id);
  if (!full) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const { title, description, memberIds } = req.body;

  if (title !== undefined) full.title = String(title).trim();
  if (description !== undefined) full.description = String(description).trim();

  let newlyAddedMemberIds = [];
  if (memberIds !== undefined) {
    const oldMemberSet = new Set(full.members.map((m) => m.toString()));
    const creatorId = full.createdBy;
    const merged = uniqueObjectIds([creatorId, ...memberIds]);
    const users = await User.find({ _id: { $in: merged } });
    if (users.length !== merged.length) {
      return res.status(400).json({ message: 'One or more member IDs are invalid' });
    }
    full.members = merged;
    newlyAddedMemberIds = merged.filter((mid) => !oldMemberSet.has(mid.toString()));
  }

  await full.save();
  await syncUsersForProject(full._id, full.members);

  if (newlyAddedMemberIds.length > 0) {
    const actorName = req.user.name;
    const projectTitle = full.title;
    for (const mid of newlyAddedMemberIds) {
      await sendNotification({
        recipientId: mid,
        actorId: req.user._id,
        type: 'project_added',
        title: 'Added to a project',
        message: `${actorName} added you to the project "${projectTitle}".`,
        projectId: full._id,
      });
    }
  }

  const populated = await Project.findById(full._id)
    .populate('createdBy', 'name email role')
    .populate('members', 'name email role');

  return res.json({ project: populated });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const full = await Project.findById(id);
  if (!full) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const { ok } = await userHasProjectAccess(req.user._id, id);
  if (!ok) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const taskIds = full.tasks || [];
  await Task.deleteMany({ _id: { $in: taskIds } });
  await User.updateMany({ projects: id }, { $pull: { projects: id } });
  await full.deleteOne();

  return res.json({ message: 'Project deleted' });
});

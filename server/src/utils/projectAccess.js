import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Task from '../models/Task.js';

/**
 * Returns true if the user is the creator or a member of the project.
 */
export async function userHasProjectAccess(userId, projectId) {
  const project = await Project.findById(projectId).select('createdBy members');
  if (!project) return { ok: false, project: null };
  const uid = userId.toString();
  const isCreator = project.createdBy.toString() === uid;
  const isMember = project.members.some((m) => m.toString() === uid);
  return { ok: isCreator || isMember, project };
}

/**
 * Member/creator OR user has at least one task assigned on this project.
 */
export async function userCanViewProject(userId, projectId) {
  if (!mongoose.isValidObjectId(projectId)) {
    return { ok: false, project: null };
  }
  const memberCheck = await userHasProjectAccess(userId, projectId);
  if (memberCheck.ok) return memberCheck;

  const assignedHere = await Task.exists({ projectId, assignedTo: userId });
  if (assignedHere) {
    const project = await Project.findById(projectId).select('createdBy members');
    return { ok: !!project, project };
  }
  return { ok: false, project: null };
}

/**
 * Project IDs the user can see: membership + any project where they have an assigned task.
 */
export async function getAccessibleProjectIds(userId) {
  const memberIds = await Project.find({
    $or: [{ createdBy: userId }, { members: userId }],
  }).distinct('_id');
  const fromTasks = await Task.distinct('projectId', { assignedTo: userId });
  const merged = new Set(
    [...memberIds.map(String), ...fromTasks.map(String)].filter(Boolean)
  );
  return [...merged].map((id) => new mongoose.Types.ObjectId(id));
}

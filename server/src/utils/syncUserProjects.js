import User from '../models/User.js';

/**
 * Keeps User.projects in sync with actual membership on a project.
 */
export async function syncUsersForProject(projectId, userIdsThatShouldHaveProject) {
  const pid = projectId.toString();
  const want = new Set(userIdsThatShouldHaveProject.map((id) => id.toString()));

  await User.updateMany({ projects: projectId, _id: { $nin: [...want] } }, { $pull: { projects: projectId } });

  for (const uid of want) {
    await User.findByIdAndUpdate(uid, { $addToSet: { projects: projectId } });
  }
}

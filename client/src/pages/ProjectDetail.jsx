import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import * as projectService from '../services/projectService.js';
import * as taskService from '../services/taskService.js';
import * as userService from '../services/userService.js';
import TaskCard from '../components/TaskCard.jsx';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [memberIdsInput, setMemberIdsInput] = useState('');
  const [savingProject, setSavingProject] = useState(false);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  const [assignUsers, setAssignUsers] = useState([]);
  const [assignUsersLoading, setAssignUsersLoading] = useState(false);
  const [assignUsersLoadError, setAssignUsersLoadError] = useState('');
  const [assignUserFilter, setAssignUserFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await Promise.all([
          projectService.fetchProject(id),
          taskService.fetchTasksForProject(id),
        ]);
        if (cancelled) return;
        const [p, t] = data;
        setProject(p);
        setTasks(t);
        setEditTitle(p.title);
        setEditDescription(p.description || '');
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Failed to load project');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    let cancelled = false;
    setAssignUsersLoading(true);
    setAssignUsersLoadError('');
    userService
      .fetchAllUsers()
      .then((list) => {
        if (cancelled) return;
        setAssignUsers(list);
        if (list.length > 0) {
          setTaskAssignee((prev) => {
            const stillValid = list.some((m) => String(m._id) === String(prev));
            return stillValid ? prev : list[0]._id;
          });
        } else {
          setTaskAssignee('');
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setAssignUsers([]);
          setTaskAssignee('');
          setAssignUsersLoadError(
            e.response?.data?.message || 'Could not load users (Admin access required).'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setAssignUsersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const filteredAssignUsers = useMemo(() => {
    const q = assignUserFilter.trim().toLowerCase();
    let list = q
      ? assignUsers.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            (u.email && u.email.toLowerCase().includes(q))
        )
      : assignUsers;
    const selected = assignUsers.find((u) => String(u._id) === String(taskAssignee));
    if (selected && !list.some((u) => String(u._id) === String(taskAssignee))) {
      list = [selected, ...list];
    }
    return list;
  }, [assignUsers, assignUserFilter, taskAssignee]);

  const assigneeOptions = useMemo(() => {
    if (!project) return [];
    const map = new Map();
    if (project.createdBy?._id) {
      map.set(project.createdBy._id, project.createdBy);
    }
    (project.members || []).forEach((m) => map.set(m._id, m));
    return [...map.values()];
  }, [project]);

  const canChangeStatus = (task) =>
    isAdmin || String(task.assignedTo?._id || task.assignedTo) === String(user?.id);

  const selectedTaskMember = assignUsers.find((m) => String(m._id) === String(taskAssignee));

  function memberInitials(name) {
    if (!name?.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    const first = parts[0][0] || '';
    const second = parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] || '';
    return `${first}${second}`.toUpperCase();
  }

  const taskSubmitDisabled =
    creatingTask ||
    assignUsersLoading ||
    assignUsers.length === 0 ||
    !taskAssignee ||
    (assignUsers.length > 0 && filteredAssignUsers.length === 0);

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSavingProject(true);
    setError('');
    try {
      const extra = memberIdsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const currentIds = (project.members || []).map((m) => m._id);
      const merged = [...new Set([...currentIds.map(String), ...extra])];
      const updated = await projectService.updateProject(id, {
        title: editTitle,
        description: editDescription,
        memberIds: merged,
      });
      setProject(updated);
      setMemberIdsInput('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update project');
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!isAdmin || !window.confirm('Delete this project and all tasks?')) return;
    setError('');
    try {
      await projectService.deleteProject(id);
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setCreatingTask(true);
    setError('');
    try {
      await taskService.createTask({
        title: taskTitle,
        description: taskDescription,
        projectId: id,
        assignedTo: taskAssignee,
        dueDate: taskDue || undefined,
      });
      setTaskTitle('');
      setTaskDescription('');
      setTaskDue('');
      const t = await taskService.fetchTasksForProject(id);
      setTasks(t);
      const p = await projectService.fetchProject(id);
      setProject(p);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create task');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    setError('');
    try {
      await taskService.updateTaskStatus(taskId, status);
      const [p, t] = await Promise.all([
        projectService.fetchProject(id),
        taskService.fetchTasksForProject(id),
      ]);
      setProject(p);
      setTasks(t);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!isAdmin || !window.confirm('Delete this task?')) return;
    setError('');
    try {
      await taskService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      const p = await projectService.fetchProject(id);
      setProject(p);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete task');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-40 rounded-xl bg-slate-800/70" />
        <div className="h-24 max-w-2xl rounded-2xl bg-slate-800/50" />
        <div className="h-48 rounded-2xl bg-slate-800/40" />
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="space-y-4">
        <div className="wp-alert-error max-w-lg">{error}</div>
        <Link to="/projects" className="inline-flex text-sm font-semibold text-indigo-400 hover:text-indigo-300">
          ← Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="border-b border-slate-800/80 pb-8">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-400 transition hover:text-indigo-300"
        >
          ← Projects
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{project.title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400">
              {project.description || 'No description'}
            </p>
          </div>
          {isAdmin && (
            <button type="button" onClick={handleDeleteProject} className="wp-btn-danger shrink-0">
              Delete project
            </button>
          )}
        </div>
      </header>

      {error && <div className="wp-alert-error">{error}</div>}

      {isAdmin && (
        <section className="wp-card">
          <h2 className="text-lg font-semibold text-white">Project settings</h2>
          <form onSubmit={handleSaveProject} className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="wp-label">Title</label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="wp-input mt-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="wp-label">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="wp-input mt-2 min-h-[6rem] resize-y"
              />
            </div>
            <div className="md:col-span-2">
              <label className="wp-label">Add members by user ID (comma-separated, merges with current)</label>
              <input
                value={memberIdsInput}
                onChange={(e) => setMemberIdsInput(e.target.value)}
                className="wp-input mt-2 font-mono text-xs"
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={savingProject} className="wp-btn-primary">
                {savingProject ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="wp-card">
        <h2 className="text-lg font-semibold text-white">Team</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {assigneeOptions.map((m) => (
            <li
              key={m._id}
              className="rounded-xl border border-slate-700/80 bg-slate-950/50 px-3.5 py-2 text-xs text-slate-200 ring-1 ring-white/[0.03]"
            >
              <span className="font-medium text-slate-100">{m.name}</span>{' '}
              <span className="text-slate-500">{m.email}</span>
            </li>
          ))}
        </ul>
      </section>

      {isAdmin && (
        <section className="wp-card">
          <h2 className="text-lg font-semibold text-white">New task</h2>
          <form onSubmit={handleCreateTask} className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="wp-label">Title</label>
              <input
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="wp-input mt-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="wp-label">Description</label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={2}
                className="wp-input mt-2 min-h-[4.5rem] resize-y"
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  Assign to
                </span>
                {selectedTaskMember && !assignUsersLoading && (
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-md ring-2 ring-indigo-400/20"
                    title={selectedTaskMember.email}
                  >
                    {memberInitials(selectedTaskMember.name)}
                  </span>
                )}
              </div>
              {assignUsersLoadError && (
                <p className="mt-1 text-sm text-red-400">{assignUsersLoadError}</p>
              )}
              {assignUsersLoading ? (
                <p className="mt-2 text-sm text-slate-500">Loading users…</p>
              ) : assignUsers.length === 0 ? (
                <p className="mt-2 text-sm text-amber-400/90">
                  No users found. Create user accounts first, then assign tasks.
                </p>
              ) : (
                <>
                  <input
                    type="search"
                    value={assignUserFilter}
                    onChange={(e) => setAssignUserFilter(e.target.value)}
                    placeholder="Filter by name or email…"
                    className="wp-input mt-2 max-w-md"
                  />
                  {filteredAssignUsers.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">No users match your filter.</p>
                  ) : (
                    <select
                      required
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      className="wp-select mt-2 w-full max-w-md"
                    >
                      {filteredAssignUsers.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>
            <div>
              <label className="wp-label">Due date</label>
              <input
                type="datetime-local"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="wp-input mt-2"
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={taskSubmitDisabled} className="wp-btn-primary disabled:opacity-50">
                {creatingTask ? 'Creating…' : 'Create task'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-white">Tasks</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          Everyone with project access sees this list. Changing status reloads tasks from the server so the board
          stays consistent.
        </p>
        {tasks.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/30 py-12 text-center text-slate-500">
            No tasks yet.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {tasks.map((t) => (
              <TaskCard
                key={t._id}
                task={t}
                projectId={id}
                canEditStatus={canChangeStatus(t)}
                onStatusChange={handleStatusChange}
                showDelete={isAdmin}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

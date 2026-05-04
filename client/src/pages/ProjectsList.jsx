import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import * as projectService from '../services/projectService.js';

export default function ProjectsList() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [memberIds, setMemberIds] = useState('');
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    projectService
      .fetchProjects()
      .then(setProjects)
      .catch((e) => setError(e.response?.data?.message || 'Failed to load projects'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const ids = memberIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await projectService.createProject({ title, description, memberIds: ids });
      setTitle('');
      setDescription('');
      setMemberIds('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-10">
      <header className="border-b border-slate-800/80 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400/90">Workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Projects</h1>
        <p className="mt-2 max-w-xl text-slate-400">Everything you own or collaborate on.</p>
      </header>

      {isAdmin && (
        <section className="wp-card">
          <h2 className="text-lg font-semibold text-white">Create project</h2>
          <p className="mt-1 text-sm text-slate-500">
            You are added automatically. Optional members: MongoDB user IDs, comma-separated.
          </p>
          <form onSubmit={handleCreate} className="mt-6 grid gap-5 md:grid-cols-2">
            {error && <div className="wp-alert-error md:col-span-2">{error}</div>}
            <div className="md:col-span-2">
              <label className="wp-label">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="wp-input mt-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="wp-label">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="wp-input mt-2 min-h-[5rem] resize-y"
              />
            </div>
            <div className="md:col-span-2">
              <label className="wp-label">Member user IDs (optional)</label>
              <input
                value={memberIds}
                onChange={(e) => setMemberIds(e.target.value)}
                placeholder="64 hex ids, comma-separated"
                className="wp-input mt-2 font-mono text-xs"
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={creating} className="wp-btn-primary">
                {creating ? 'Creating…' : 'Create project'}
              </button>
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-800/50" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/30 py-16 text-center">
          <p className="text-slate-400">No projects yet.</p>
          {isAdmin && <p className="mt-2 text-sm text-slate-500">Create your first project above.</p>}
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <li key={p._id}>
              <Link
                to={`/projects/${p._id}`}
                className="group flex h-full flex-col rounded-2xl border border-slate-800/90 bg-slate-900/40 p-6 shadow-lg shadow-black/20 ring-1 ring-white/[0.03] transition hover:border-indigo-500/35 hover:bg-slate-900/70 hover:shadow-indigo-950/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-white transition group-hover:text-indigo-100">
                    {p.title}
                  </h3>
                  <span
                    className="shrink-0 text-slate-600 transition group-hover:text-indigo-400"
                    aria-hidden
                  >
                    →
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-400">
                  {p.description || 'No description'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-slate-950/60 px-2.5 py-1 text-xs font-medium text-slate-400 ring-1 ring-slate-700/60">
                    {p.members?.length ?? 0} members
                  </span>
                  <span className="rounded-lg bg-slate-950/60 px-2.5 py-1 text-xs font-medium text-slate-400 ring-1 ring-slate-700/60">
                    {p.tasks?.length ?? 0} tasks
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

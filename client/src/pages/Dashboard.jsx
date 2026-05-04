import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboard } from '../services/dashboardService.js';
import { statusBadgeClass, taskIsOverdue } from '../components/TaskCard.jsx';

function StatCard({ label, value, accent }) {
  return (
    <div
      className={`wp-stat-card border-l-4 ${accent} transition hover:border-slate-700/90 hover:shadow-xl`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-white">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchDashboard()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.response?.data?.message || 'Could not load dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 rounded-xl bg-slate-800/80" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-800/60" />
          ))}
        </div>
        <div className="h-40 rounded-2xl bg-slate-800/50" />
      </div>
    );
  }

  if (error) {
    return <div className="wp-alert-error max-w-lg">{error}</div>;
  }

  const by = data.tasksByStatus || {};
  const myTasks = data.myTasks || [];

  return (
    <div className="space-y-10">
      <header className="border-b border-slate-800/80 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400/90">Overview</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Dashboard</h1>
        <p className="mt-2 max-w-xl text-slate-400">
          Your workload, team task mix, and what needs attention next.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total tasks" value={data.totalTasks} accent="border-l-slate-400" />
        <StatCard label="Completed" value={data.completedTasks} accent="border-l-emerald-500" />
        <StatCard label="Pending" value={data.pendingTasks ?? 0} accent="border-l-amber-400/90" />
        <StatCard label="Overdue" value={data.overdueTasks} accent="border-l-rose-500" />
        <StatCard label="In progress" value={by['In Progress'] ?? 0} accent="border-l-indigo-500" />
      </div>

      <div className="wp-card">
        <h2 className="text-base font-semibold text-white">Tasks by status</h2>
        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          {['Todo', 'In Progress', 'Done'].map((s) => (
            <div
              key={s}
              className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/50 px-4 py-3 ring-1 ring-white/[0.02]"
            >
              <dt className="text-sm font-medium text-slate-400">{s}</dt>
              <dd className="text-xl font-bold tabular-nums text-white">{by[s] ?? 0}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="wp-card">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">My pending tasks</h2>
            <p className="mt-1 text-sm text-slate-500">Assigned to you and not marked Done.</p>
          </div>
        </div>
        {myTasks.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/30 py-12 text-center">
            <p className="text-lg font-medium text-slate-300">No pending tasks</p>
            <p className="mt-1 text-2xl" aria-hidden>
              🎉
            </p>
            <p className="mt-2 text-sm text-slate-500">You are all caught up.</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-800/80">
            {myTasks.map((t) => {
              const overdue = taskIsOverdue(t);
              return (
                <li key={t._id}>
                  <Link
                    to={`/projects/${t.projectId}`}
                    className="group flex flex-wrap items-center justify-between gap-3 rounded-xl py-4 transition hover:bg-slate-950/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white transition group-hover:text-indigo-200">
                        {t.title}
                      </p>
                      <p className="mt-0.5 text-sm text-indigo-400/80">{t.projectName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Due:{' '}
                        {t.dueDate ? (
                          <span className={overdue ? 'font-medium text-rose-400' : 'text-slate-400'}>
                            {new Date(t.dueDate).toLocaleString()}
                          </span>
                        ) : (
                          '—'
                        )}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(t.status, overdue)}`}
                    >
                      {overdue && t.status !== 'Done' ? 'Overdue' : t.status}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Link to="/projects" className="wp-btn-primary inline-flex gap-2 shadow-glow">
        Browse projects
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}

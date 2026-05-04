import { Link } from 'react-router-dom';

const statuses = ['Todo', 'In Progress', 'Done'];

export function taskIsOverdue(task) {
  if (!task?.dueDate || task.status === 'Done') return false;
  return new Date(task.dueDate) < new Date();
}

export function statusBadgeClass(status, overdue) {
  if (overdue) return 'bg-rose-500/20 text-rose-100 ring-1 ring-rose-500/45';
  if (status === 'Done') return 'bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-500/35';
  if (status === 'In Progress') return 'bg-indigo-500/20 text-indigo-100 ring-1 ring-indigo-500/45';
  return 'bg-slate-700/90 text-slate-200 ring-1 ring-slate-600/80';
}

export default function TaskCard({ task, projectId, canEditStatus, onStatusChange, showDelete, onDelete }) {
  const overdue = taskIsOverdue(task);
  const assigneeName = task.assignedTo?.name || '—';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-slate-900/50 p-5 shadow-lg shadow-black/25 ring-1 ring-white/[0.04] transition hover:ring-white/[0.07] ${
        overdue ? 'border-rose-500/40 ring-rose-500/10' : 'border-slate-800/90'
      }`}
    >
      {overdue && task.status !== 'Done' && (
        <div className="absolute right-0 top-0 h-16 w-16 translate-x-6 -translate-y-6 rounded-full bg-rose-500/15 blur-2xl" />
      )}
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-snug text-white">{task.title}</h3>
          <p className="mt-2 text-sm text-slate-500">
            Assigned to{' '}
            <span className="font-medium text-slate-300">{assigneeName}</span>
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(task.status, overdue)}`}
        >
          {overdue && task.status !== 'Done' ? 'Overdue' : task.status}
        </span>
      </div>

      <p className="relative mt-3 text-xs text-slate-500">
        Due:{' '}
        {task.dueDate ? (
          <span className={overdue ? 'font-semibold text-rose-300' : 'text-slate-400'}>
            {new Date(task.dueDate).toLocaleString()}
          </span>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </p>

      <div className="relative mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-4">
        <label className="text-xs font-medium text-slate-500">Status</label>
        <select
          value={task.status}
          disabled={!canEditStatus}
          onChange={(e) => onStatusChange(task._id, e.target.value)}
          className="wp-select max-w-[11rem]"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {projectId && (
          <Link
            to={`/projects/${projectId}`}
            className="text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
          >
            Project
          </Link>
        )}
        {showDelete && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(task._id)}
            className="ml-auto text-xs font-medium text-red-400/90 transition hover:text-red-300"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

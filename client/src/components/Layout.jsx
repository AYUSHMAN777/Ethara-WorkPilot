import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationBell from './NotificationBell.jsx';

function userInitials(name) {
  if (!name?.trim()) return '?';
  const p = name.trim().split(/\s+/);
  const a = p[0][0] || '';
  const b = p.length > 1 ? p[p.length - 1][0] : p[0][1] || '';
  return `${a}${b}`.toUpperCase();
}

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="wp-page-bg">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/75 shadow-lg shadow-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-5">
          <Link
            to="/"
            className="group flex items-center gap-2.5 text-lg font-bold tracking-tight text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold leading-none text-white shadow-md shadow-indigo-900/50 ring-2 ring-indigo-400/20 transition group-hover:ring-indigo-400/40">
              E
            </span>
            <span className="leading-tight">
              <span className="text-slate-300">Ethara</span>{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Workpilot
              </span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-1.5">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `wp-nav-link ${isActive ? 'wp-nav-link-active' : 'wp-nav-link-idle'}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/projects"
              className={({ isActive }) =>
                `wp-nav-link ${isActive ? 'wp-nav-link-active' : 'wp-nav-link-idle'}`
              }
            >
              Projects
            </NavLink>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <div className="hidden h-8 w-px bg-slate-700/80 sm:block" aria-hidden />
            <div className="hidden items-center gap-2.5 sm:flex">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 text-xs font-bold text-slate-200 ring-1 ring-slate-600/50"
                title={user?.email}
              >
                {userInitials(user?.name)}
              </span>
              <div className="text-right">
                <span className="block max-w-[10rem] truncate text-sm font-medium text-slate-100">
                  {user?.name}
                </span>
                <span
                  className={
                    isAdmin
                      ? 'mt-0.5 inline-block rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300 ring-1 ring-amber-500/25'
                      : 'mt-0.5 inline-block rounded-md bg-slate-700/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 ring-1 ring-slate-600/50'
                  }
                >
                  {user?.role}
                </span>
              </div>
            </div>
            <button type="button" onClick={logout} className="wp-btn-ghost shrink-0 py-2 text-xs sm:text-sm">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl animate-fade-in px-4 py-8 sm:px-5 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}

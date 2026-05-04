import { useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="wp-page-bg flex min-h-screen items-center justify-center text-slate-400">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/50 px-6 py-4 shadow-xl ring-1 ring-white/[0.04]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          Loading…
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wp-page-bg flex min-h-screen flex-col justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white shadow-lg shadow-indigo-900/50 ring-2 ring-indigo-400/20">
            E
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-indigo-400/90">
            Ethara Workpilot
          </p>
          <p className="mt-2 text-sm text-slate-400">Sign in to manage projects and tasks.</p>
        </div>

        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-8 shadow-2xl shadow-black/40 ring-1 ring-white/[0.04] backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="wp-alert-error">{error}</div>}
            <div>
              <label htmlFor="email" className="wp-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="wp-input mt-2"
              />
            </div>
            <div>
              <label htmlFor="password" className="wp-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="wp-input mt-2"
              />
            </div>
            <button type="submit" disabled={submitting} className="wp-btn-primary mt-2 w-full py-3">
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-slate-500">
            No account?{' '}
            <Link to="/signup" className="font-semibold text-indigo-400 transition hover:text-indigo-300">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

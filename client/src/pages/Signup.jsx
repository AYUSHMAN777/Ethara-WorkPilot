import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const { signup, user, loading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Member');
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
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signup({ name, email, password, role });
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message;
      const errs = err.response?.data?.errors;
      setError(
        msg ||
          (Array.isArray(errs) ? errs.map((x) => x.msg).join(', ') : null) ||
          'Signup failed'
      );
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
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">Create account</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-indigo-400/90">
            Ethara Workpilot
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-8 shadow-2xl shadow-black/40 ring-1 ring-white/[0.04] backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="wp-alert-error">{error}</div>}
            <div>
              <label htmlFor="name" className="wp-label">
                Name
              </label>
              <input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="wp-input mt-2"
              />
            </div>
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
                Password (min 6 characters)
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="wp-input mt-2"
              />
            </div>
            <div>
              <span className="wp-label">Role</span>
              <div className="mt-3 flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-700/80 bg-slate-950/40 px-4 py-2.5 text-sm text-slate-200 transition hover:border-slate-600 has-[:checked]:border-indigo-500/50 has-[:checked]:bg-indigo-500/10">
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'Member'}
                    onChange={() => setRole('Member')}
                    className="text-indigo-500 focus:ring-indigo-500/30"
                  />
                  Member
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-700/80 bg-slate-950/40 px-4 py-2.5 text-sm text-slate-200 transition hover:border-slate-600 has-[:checked]:border-indigo-500/50 has-[:checked]:bg-indigo-500/10">
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'Admin'}
                    onChange={() => setRole('Admin')}
                    className="text-indigo-500 focus:ring-indigo-500/30"
                  />
                  Admin
                </label>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="wp-btn-primary w-full py-3">
              {submitting ? 'Creating account…' : 'Sign up'}
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-indigo-400 transition hover:text-indigo-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

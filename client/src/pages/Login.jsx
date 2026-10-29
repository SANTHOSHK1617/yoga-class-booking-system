import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const redirect = location.state?.from || '/classes';

  if (user) return <Navigate to={redirect} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(form);
      notify(`Welcome back, ${u.name.split(' ')[0]}!`);
      navigate(u.role === 'admin' && !location.state?.from ? '/admin' : redirect, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Welcome back</h1>
        <p className="muted">Log in to book and manage your classes.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <label>Email
          <input type="email" name="email" value={form.email} onChange={update} required autoComplete="email" />
        </label>
        <label>Password
          <input type="password" name="password" value={form.password} onChange={update} required autoComplete="current-password" />
        </label>
        <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="muted center">New here? <Link to="/register" state={location.state}>Create an account</Link></p>
        <div className="demo-box">
          <strong>Demo accounts</strong>
          <span>Member: member@yoga.com / member123</span>
          <span>Admin: admin@yoga.com / admin123</span>
        </div>
      </form>
    </div>
  );
}

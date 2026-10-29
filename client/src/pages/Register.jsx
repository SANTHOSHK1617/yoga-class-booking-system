import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Register() {
  const { user, register } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const redirect = location.state?.from || '/classes';

  if (user) return <Navigate to={redirect} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      notify('Account created. Welcome to Serenity Yoga!');
      navigate(redirect, { replace: true });
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
        <h1>Create your account</h1>
        <p className="muted">Join free and start booking classes today.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <label>Full name
          <input name="name" value={form.name} onChange={update} required autoComplete="name" />
        </label>
        <label>Email
          <input type="email" name="email" value={form.email} onChange={update} required autoComplete="email" />
        </label>
        <label>Password
          <input type="password" name="password" value={form.password} onChange={update} required minLength={6} autoComplete="new-password" />
        </label>
        <label>Confirm password
          <input type="password" name="confirm" value={form.confirm} onChange={update} required minLength={6} autoComplete="new-password" />
        </label>
        <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? 'Creating account…' : 'Sign up'}</button>
        <p className="muted center">Already a member? <Link to="/login" state={location.state}>Log in</Link></p>
      </form>
    </div>
  );
}

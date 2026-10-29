import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import Modal from '../components/Modal.jsx';
import Spinner from '../components/Spinner.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate, formatTime, money, todayISO } from '../utils';

const STYLES = ['Hatha', 'Vinyasa', 'Ashtanga', 'Yin', 'Restorative', 'Prenatal', 'Power', 'Kundalini'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

const blank = {
  title: '', style: 'Hatha', level: 'All Levels', instructor: '', date: todayISO(), startTime: '07:00',
  duration: 60, capacity: 15, price: 12, location: 'Studio A', description: '',
};

function ClassForm({ initial, onSaved, onCancel }) {
  const notify = useToast();
  const [form, setForm] = useState(initial || blank);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (initial?.id) await api.updateClass(initial.id, form);
      else await api.createClass(form);
      notify(initial?.id ? 'Class updated.' : 'Class created.');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form-grid" onSubmit={submit}>
      {error && <div className="alert alert-error span-2">{error}</div>}
      <label className="span-2">Title<input name="title" value={form.title} onChange={update} required /></label>
      <label>Style
        <select name="style" value={form.style} onChange={update}>
          {[...new Set([...STYLES, form.style])].map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label>Level
        <select name="level" value={form.level} onChange={update}>
          {LEVELS.map((l) => <option key={l}>{l}</option>)}
        </select>
      </label>
      <label>Instructor<input name="instructor" value={form.instructor} onChange={update} required /></label>
      <label>Location<input name="location" value={form.location} onChange={update} required /></label>
      <label>Date<input type="date" name="date" value={form.date} onChange={update} required /></label>
      <label>Start time<input type="time" name="startTime" value={form.startTime} onChange={update} required /></label>
      <label>Duration (min)<input type="number" name="duration" min="15" step="5" value={form.duration} onChange={update} required /></label>
      <label>Capacity<input type="number" name="capacity" min="1" value={form.capacity} onChange={update} required /></label>
      <label>Price ($)<input type="number" name="price" min="0" step="0.5" value={form.price} onChange={update} required /></label>
      <label className="span-2">Description<textarea name="description" rows="3" value={form.description} onChange={update} /></label>
      <div className="modal-actions span-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : initial?.id ? 'Save changes' : 'Create class'}</button>
      </div>
    </form>
  );
}

function Attendees({ cls, onChanged }) {
  const notify = useToast();
  const [list, setList] = useState(null);
  const load = useCallback(() => { api.attendees(cls.id).then(setList).catch(() => setList([])); }, [cls.id]);
  useEffect(load, [load]);

  const remove = async (a) => {
    if (!window.confirm(`Remove ${a.name} from this class?`)) return;
    try {
      await api.cancelBooking(a.bookingId);
      notify('Booking removed.');
      load();
      onChanged();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  if (!list) return <Spinner />;
  if (!list.length) return <p className="muted">No one has booked this class yet.</p>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Name</th><th>Email</th><th>Booked on</th><th /></tr></thead>
        <tbody>
          {list.map((a) => (
            <tr key={a.bookingId}>
              <td>{a.name}</td>
              <td>{a.email}</td>
              <td>{new Date(a.bookedAt).toLocaleDateString()}</td>
              <td className="right"><button className="btn btn-ghost btn-sm text-danger" onClick={() => remove(a)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Admin() {
  const notify = useToast();
  const [stats, setStats] = useState(null);
  const [classes, setClasses] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | {} (new) | class
  const [viewing, setViewing] = useState(null);

  const load = useCallback(() => {
    api.stats().then(setStats).catch(() => {});
    api.classes({ includePast: showPast }).then(setClasses).catch((err) => notify(err.message, 'error'));
  }, [showPast, notify]);
  useEffect(load, [load]);

  const remove = async (c) => {
    const msg = c.booked ? `Delete "${c.title}"? ${c.booked} booking(s) will also be removed.` : `Delete "${c.title}"?`;
    if (!window.confirm(msg)) return;
    try {
      await api.deleteClass(c.id);
      notify('Class deleted.');
      load();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const filtered = (classes || []).filter((c) =>
    [c.title, c.instructor, c.style].some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );
  if (showPast) filtered.reverse();

  return (
    <div className="container page">
      <div className="page-head row">
        <div>
          <h1>Admin dashboard</h1>
          <p className="muted">Manage the class schedule and see who's coming.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>+ New class</button>
      </div>

      <div className="stats stats-5">
        {[
          ['Members', stats?.members],
          ['Upcoming classes', stats?.upcomingClasses],
          ['Active bookings', stats?.activeBookings],
          ['Occupancy', stats ? `${stats.occupancy}%` : undefined],
          ['Booking revenue', stats ? money(stats.revenue) : undefined],
        ].map(([label, value]) => (
          <div key={label} className="stat card"><span className="stat-value">{value ?? '—'}</span><span className="muted">{label}</span></div>
        ))}
      </div>

      <div className="card">
        <div className="table-toolbar">
          <input type="search" placeholder="Search classes…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <label className="checkbox">
            <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} /> Include past classes
          </label>
        </div>
        {!classes ? <Spinner /> : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Class</th><th>Date & time</th><th>Instructor</th><th>Bookings</th><th>Price</th><th className="right">Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className={c.isPast ? 'row-muted' : ''}>
                    <td><strong>{c.title}</strong><div className="muted small">{c.style} · {c.level}</div></td>
                    <td>{formatDate(c.date, { month: 'short', day: 'numeric', weekday: 'short' })}<div className="muted small">{formatTime(c.startTime)} · {c.duration}m</div></td>
                    <td>{c.instructor}</td>
                    <td>
                      <button className="link-btn" onClick={() => setViewing(c)}>{c.booked} / {c.capacity}</button>
                      {c.spotsLeft === 0 && <span className="badge badge-danger ml">Full</span>}
                    </td>
                    <td>{money(c.price)}</td>
                    <td className="right nowrap">
                      <button className="btn btn-ghost btn-sm" onClick={() => setViewing(c)}>Attendees</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(c)}>Edit</button>
                      <button className="btn btn-ghost btn-sm text-danger" onClick={() => remove(c)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan="6" className="center muted">No classes found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit class' : 'New class'} onClose={() => setEditing(null)} wide>
          <ClassForm
            initial={editing.id ? editing : null}
            onCancel={() => setEditing(null)}
            onSaved={() => { setEditing(null); load(); }}
          />
        </Modal>
      )}

      {viewing && (
        <Modal title={`Attendees · ${viewing.title}`} onClose={() => setViewing(null)} wide>
          <p className="muted">{formatDate(viewing.date)} at {formatTime(viewing.startTime)} · {viewing.location}</p>
          <Attendees cls={viewing} onChanged={load} />
        </Modal>
      )}
    </div>
  );
}

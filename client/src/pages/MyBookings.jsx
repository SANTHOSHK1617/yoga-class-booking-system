import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Modal from '../components/Modal.jsx';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate, formatTime, endTime, money } from '../utils';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function MyBookings() {
  const { user } = useAuth();
  const notify = useToast();
  const [bookings, setBookings] = useState(null);
  const [tab, setTab] = useState('upcoming');
  const [confirming, setConfirming] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.myBookings().then(setBookings).catch((err) => { notify(err.message, 'error'); setBookings([]); });
  }, [notify]);
  useEffect(load, [load]);

  const cancel = async () => {
    setBusy(true);
    try {
      await api.cancelBooking(confirming.id);
      notify('Your booking has been cancelled.');
      setConfirming(null);
      load();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!bookings) return <Spinner />;

  const groups = {
    upcoming: bookings.filter((b) => b.status === 'confirmed' && !b.class.isPast),
    past: bookings.filter((b) => b.status === 'confirmed' && b.class.isPast).reverse(),
    cancelled: bookings.filter((b) => b.status === 'cancelled'),
  };
  const list = groups[tab];
  const totalSpent = [...groups.upcoming, ...groups.past].reduce((s, b) => s + b.class.price, 0);

  return (
    <div className="container page">
      <div className="page-head">
        <h1>My bookings</h1>
        <p className="muted">Hi {user.name.split(' ')[0]}, here's your practice at a glance.</p>
      </div>

      <div className="stats">
        <div className="stat card"><span className="stat-value">{groups.upcoming.length}</span><span className="muted">Upcoming classes</span></div>
        <div className="stat card"><span className="stat-value">{groups.past.length}</span><span className="muted">Classes attended</span></div>
        <div className="stat card"><span className="stat-value">{money(totalSpent)}</span><span className="muted">Total booked</span></div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label} <span className="tab-count">{groups[t.key].length}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🧘</div>
          <p>{tab === 'upcoming' ? "You don't have any upcoming classes." : `No ${tab} bookings.`}</p>
          {tab === 'upcoming' && <Link to="/classes" className="btn btn-primary">Browse classes</Link>}
        </div>
      ) : (
        <div className="booking-list">
          {list.map((b) => (
            <div key={b.id} className={`booking card ${b.status === 'cancelled' ? 'is-cancelled' : ''}`}>
              <div className="booking-date">
                <span>{formatDate(b.class.date, { month: 'short' })}</span>
                <strong>{formatDate(b.class.date, { day: 'numeric' })}</strong>
                <span>{formatDate(b.class.date, { weekday: 'short' })}</span>
              </div>
              <div className="booking-info">
                <h3><Link to={`/classes/${b.class.id}`}>{b.class.title}</Link></h3>
                <p className="muted">
                  {formatTime(b.class.startTime)} – {endTime(b.class.startTime, b.class.duration)} · {b.class.instructor} · {b.class.location}
                </p>
                <div className="tags">
                  <span className="tag tag-style">{b.class.style}</span>
                  <span className="tag">{b.class.level}</span>
                  <span className="tag">{money(b.class.price)}</span>
                </div>
              </div>
              <div className="booking-action">
                {tab === 'upcoming' && <button className="btn btn-danger-outline" onClick={() => setConfirming(b)}>Cancel</button>}
                {tab === 'past' && <span className="badge">Completed</span>}
                {tab === 'cancelled' && <span className="badge badge-danger">Cancelled</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {confirming && (
        <Modal title="Cancel booking?" onClose={() => !busy && setConfirming(null)}>
          <p>
            Are you sure you want to cancel <strong>{confirming.class.title}</strong> on{' '}
            {formatDate(confirming.class.date)} at {formatTime(confirming.class.startTime)}?
          </p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setConfirming(null)} disabled={busy}>Keep booking</button>
            <button className="btn btn-danger" onClick={cancel} disabled={busy}>{busy ? 'Cancelling…' : 'Yes, cancel'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

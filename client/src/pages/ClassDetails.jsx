import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import Spinner from '../components/Spinner.jsx';
import useBooking from '../hooks/useBooking';
import useMyBookedIds from '../hooks/useMyBookedIds';
import { formatDate, formatTime, endTime, money } from '../utils';

export default function ClassDetails() {
  const { id } = useParams();
  const [cls, setCls] = useState(null);
  const [error, setError] = useState('');
  const [bookedIds, refreshBooked] = useMyBookedIds();

  const load = useCallback(() => {
    api.getClass(id).then(setCls).catch((err) => setError(err.message));
  }, [id]);
  useEffect(load, [load]);

  const { book, pendingId } = useBooking(() => { load(); refreshBooked(); });

  if (error) return <div className="container page"><div className="alert alert-error">{error}</div><Link to="/classes">← Back to schedule</Link></div>;
  if (!cls) return <Spinner />;

  const booked = bookedIds.has(cls.id);
  const full = cls.spotsLeft === 0;

  return (
    <div className="container page">
      <Link to="/classes" className="back-link">← Back to schedule</Link>
      <div className="details">
        <div className="card details-main">
          <div className="tags">
            <span className="tag tag-style">{cls.style}</span>
            <span className="tag">{cls.level}</span>
          </div>
          <h1>{cls.title}</h1>
          <p className="muted">Led by <strong>{cls.instructor}</strong></p>
          <p className="details-desc">{cls.description || 'No description provided.'}</p>
          <h3>What to bring</h3>
          <ul className="checklist">
            <li>Comfortable clothing you can move in</li>
            <li>A water bottle</li>
            <li>Your own mat (studio mats are also available)</li>
            <li>Arrive 10 minutes early to settle in</li>
          </ul>
        </div>

        <aside className="card details-side">
          <dl className="detail-list">
            <div><dt>Date</dt><dd>{formatDate(cls.date)}</dd></div>
            <div><dt>Time</dt><dd>{formatTime(cls.startTime)} – {endTime(cls.startTime, cls.duration)}</dd></div>
            <div><dt>Duration</dt><dd>{cls.duration} minutes</dd></div>
            <div><dt>Location</dt><dd>{cls.location}</dd></div>
            <div><dt>Availability</dt><dd className={full ? 'text-danger' : ''}>{full ? 'Full' : `${cls.spotsLeft} / ${cls.capacity} spots left`}</dd></div>
          </dl>
          <div className="price-big">{money(cls.price)}</div>
          {cls.isPast ? (
            <button className="btn btn-block" disabled>Class has ended</button>
          ) : booked ? (
            <>
              <div className="badge badge-success badge-block">✓ You're booked for this class</div>
              <Link to="/my-bookings" className="btn btn-outline btn-block">Manage booking</Link>
            </>
          ) : (
            <button className="btn btn-primary btn-block btn-lg" disabled={full || pendingId === cls.id} onClick={() => book(cls)}>
              {pendingId === cls.id ? 'Booking…' : full ? 'Class full' : 'Book this class'}
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}

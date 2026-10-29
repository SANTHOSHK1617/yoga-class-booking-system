import { Link } from 'react-router-dom';
import { formatDate, formatTime, endTime, money } from '../utils';

export default function ClassCard({ cls, booked, onBook, pending, showDate = false }) {
  const full = cls.spotsLeft === 0;
  const low = !full && cls.spotsLeft <= 3;
  const fill = Math.round((cls.booked / cls.capacity) * 100);

  return (
    <article className="class-card">
      <div className="class-time">
        {showDate && <span className="class-day">{formatDate(cls.date, { weekday: 'short', month: 'short', day: 'numeric' })}</span>}
        <strong>{formatTime(cls.startTime)}</strong>
        <span className="muted">{endTime(cls.startTime, cls.duration)}</span>
        <span className="muted small">{cls.duration} min</span>
      </div>

      <div className="class-info">
        <div className="tags">
          <span className="tag tag-style">{cls.style}</span>
          <span className="tag">{cls.level}</span>
        </div>
        <h3><Link to={`/classes/${cls.id}`}>{cls.title}</Link></h3>
        <p className="muted">with <strong>{cls.instructor}</strong> · {cls.location}</p>
        <div className="capacity">
          <div className="capacity-bar"><span style={{ width: `${fill}%` }} /></div>
          <span className={`small ${full ? 'text-danger' : low ? 'text-warn' : 'muted'}`}>
            {full ? 'Class full' : `${cls.spotsLeft} of ${cls.capacity} spots left`}
          </span>
        </div>
      </div>

      <div className="class-action">
        <span className="price">{money(cls.price)}</span>
        {booked ? (
          <span className="badge badge-success">✓ Booked</span>
        ) : (
          <button className="btn btn-primary" disabled={full || pending} onClick={() => onBook(cls)}>
            {pending ? 'Booking…' : full ? 'Full' : 'Book now'}
          </button>
        )}
      </div>
    </article>
  );
}

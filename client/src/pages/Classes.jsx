import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import ClassCard from '../components/ClassCard.jsx';
import Spinner from '../components/Spinner.jsx';
import useBooking from '../hooks/useBooking';
import useMyBookedIds from '../hooks/useMyBookedIds';
import { formatDate, todayISO } from '../utils';

export default function Classes() {
  const [params, setParams] = useSearchParams();
  const [classes, setClasses] = useState(null);
  const [meta, setMeta] = useState({ styles: [], levels: [] });
  const [error, setError] = useState('');
  const [bookedIds, refreshBooked] = useMyBookedIds();

  const filters = {
    style: params.get('style') || '',
    level: params.get('level') || '',
    date: params.get('date') || '',
    search: params.get('search') || '',
  };
  const filterKey = params.toString();

  const load = useCallback(() => {
    setError('');
    api.classes(Object.fromEntries(new URLSearchParams(filterKey)))
      .then(setClasses)
      .catch((err) => { setError(err.message); setClasses([]); });
  }, [filterKey]);

  useEffect(load, [load]);
  useEffect(() => { api.classMeta().then(setMeta).catch(() => {}); }, []);

  const { book, pendingId } = useBooking(() => { load(); refreshBooked(); });

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  const grouped = useMemo(() => {
    const map = new Map();
    (classes || []).forEach((c) => {
      if (!map.has(c.date)) map.set(c.date, []);
      map.get(c.date).push(c);
    });
    return [...map.entries()];
  }, [classes]);

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Class schedule</h1>
        <p className="muted">Find a class that fits your day and your practice.</p>
      </div>

      <div className="filters card">
        <input
          type="search"
          placeholder="Search class or instructor…"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
        />
        <select value={filters.style} onChange={(e) => setFilter('style', e.target.value)} aria-label="Style">
          <option value="">All styles</option>
          {meta.styles.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filters.level} onChange={(e) => setFilter('level', e.target.value)} aria-label="Level">
          <option value="">All levels</option>
          {meta.levels.map((l) => <option key={l}>{l}</option>)}
        </select>
        <input type="date" min={todayISO()} value={filters.date} onChange={(e) => setFilter('date', e.target.value)} aria-label="Date" />
        {hasFilters && <button className="btn btn-ghost" onClick={() => setParams({}, { replace: true })}>Clear</button>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!classes ? <Spinner /> : grouped.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🍃</div>
          <p>No classes match your filters.</p>
        </div>
      ) : (
        grouped.map(([date, list]) => (
          <section key={date} className="day-group">
            <h2 className="day-title">
              {date === todayISO() ? 'Today' : formatDate(date)}
              <span className="muted small">{list.length} class{list.length > 1 ? 'es' : ''}</span>
            </h2>
            <div className="class-list">
              {list.map((c) => (
                <ClassCard key={c.id} cls={c} booked={bookedIds.has(c.id)} onBook={book} pending={pendingId === c.id} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

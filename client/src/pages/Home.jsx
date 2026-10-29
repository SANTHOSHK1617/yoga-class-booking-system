import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ClassCard from '../components/ClassCard.jsx';
import Spinner from '../components/Spinner.jsx';
import useBooking from '../hooks/useBooking';
import useMyBookedIds from '../hooks/useMyBookedIds';

const features = [
  { icon: '🌿', title: 'Every level welcome', text: 'From your very first downward dog to advanced Ashtanga, there is a class for you.' },
  { icon: '🧑‍🏫', title: 'Certified instructors', text: 'Learn from experienced teachers who focus on safe alignment and mindful practice.' },
  { icon: '📅', title: 'Book in seconds', text: 'See live availability, reserve your mat and cancel anytime before class starts.' },
];

const styles = [
  { name: 'Hatha', text: 'Slow-paced postures and breathing for balance and calm.' },
  { name: 'Vinyasa', text: 'Flowing sequences that build strength and stamina.' },
  { name: 'Yin', text: 'Long, passive holds for deep flexibility and stillness.' },
  { name: 'Ashtanga', text: 'A structured, vigorous practice following set series.' },
];

export default function Home() {
  const [classes, setClasses] = useState(null);
  const [bookedIds, refreshBooked] = useMyBookedIds();

  const load = useCallback(() => {
    api.classes().then((list) => setClasses(list.slice(0, 4))).catch(() => setClasses([]));
  }, []);
  useEffect(load, [load]);

  const { book, pendingId } = useBooking(() => { load(); refreshBooked(); });

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-text">
            <span className="eyebrow">Serenity Yoga Studio</span>
            <h1>Find your balance, one breath at a time.</h1>
            <p>Join small, mindful classes led by expert instructors. Browse the schedule, reserve your spot and show up ready to flow.</p>
            <div className="hero-actions">
              <Link to="/classes" className="btn btn-primary btn-lg">View schedule</Link>
              <Link to="/register" className="btn btn-outline btn-lg">Join for free</Link>
            </div>
            <div className="hero-stats">
              <div><strong>7</strong><span>class styles</span></div>
              <div><strong>4</strong><span>expert teachers</span></div>
              <div><strong>40+</strong><span>classes / 2 weeks</span></div>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-circle"><span>🧘‍♀️</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container features">
          {features.map((f) => (
            <div key={f.title} className="feature">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p className="muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Upcoming classes</h2>
              <p className="muted">Reserve your mat before the spots fill up.</p>
            </div>
            <Link to="/classes" className="btn btn-outline">Full schedule →</Link>
          </div>
          {!classes ? <Spinner /> : classes.length === 0 ? (
            <p className="empty">No upcoming classes right now. Check back soon!</p>
          ) : (
            <div className="class-list">
              {classes.map((c) => (
                <ClassCard key={c.id} cls={c} showDate booked={bookedIds.has(c.id)} onBook={book} pending={pendingId === c.id} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><div><h2>Our yoga styles</h2><p className="muted">Explore the practice that suits you.</p></div></div>
          <div className="styles-grid">
            {styles.map((s) => (
              <Link key={s.name} to={`/classes?style=${s.name}`} className="style-card">
                <h3>{s.name}</h3>
                <p className="muted">{s.text}</p>
                <span className="link">See classes →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container cta-inner">
          <h2>Ready to roll out your mat?</h2>
          <p>Create a free account and book your first class in under a minute.</p>
          <Link to="/register" className="btn btn-light btn-lg">Get started</Link>
        </div>
      </section>
    </>
  );
}

import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand"><span className="brand-mark">🧘</span> Serenity <span className="brand-light">Yoga</span></div>
          <p className="muted">Breathe, move and find balance with classes for every body and every level.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/classes">Class schedule</Link>
          <Link to="/my-bookings">My bookings</Link>
          <Link to="/register">Become a member</Link>
        </div>
        <div>
          <h4>Visit us</h4>
          <p className="muted">42 Lotus Lane, Coimbatore</p>
          <p className="muted">hello@serenityyoga.com</p>
          <p className="muted">+91 98765 43210</p>
        </div>
        <div>
          <h4>Hours</h4>
          <p className="muted">Mon – Fri: 6:00 AM – 9:30 PM</p>
          <p className="muted">Sat – Sun: 8:00 AM – 8:00 PM</p>
        </div>
      </div>
      <div className="container footer-bottom">© {new Date().getFullYear()} Serenity Yoga Studio. All rights reserved.</div>
    </footer>
  );
}

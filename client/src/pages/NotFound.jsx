import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container page empty">
      <div className="empty-icon">🍃</div>
      <h1>Page not found</h1>
      <p className="muted">The page you're looking for has drifted away.</p>
      <Link to="/" className="btn btn-primary">Go home</Link>
    </div>
  );
}

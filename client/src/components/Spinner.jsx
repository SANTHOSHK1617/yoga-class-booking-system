export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <span className="muted">{label}</span>
    </div>
  );
}

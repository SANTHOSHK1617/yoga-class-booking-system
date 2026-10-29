export const classDate = (c) => new Date(`${c.date}T${c.startTime}:00`);

export function formatDate(dateStr, opts = { weekday: 'long', month: 'long', day: 'numeric' }) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, opts);
}

export function formatTime(time) {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function endTime(time, duration) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + Number(duration);
  return formatTime(`${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`);
}

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const money = (n) => `$${Number(n).toFixed(2)}`;

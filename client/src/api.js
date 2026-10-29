const TOKEN_KEY = 'yoga_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Cannot reach the server. Is the API running?');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

const qs = (params) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
  return s ? `?${s}` : '';
};

export const api = {
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  me: () => request('/auth/me'),

  classes: (filters = {}) => request(`/classes${qs(filters)}`),
  classMeta: () => request('/classes/meta'),
  getClass: (id) => request(`/classes/${id}`),
  createClass: (data) => request('/classes', { method: 'POST', body: data }),
  updateClass: (id, data) => request(`/classes/${id}`, { method: 'PUT', body: data }),
  deleteClass: (id) => request(`/classes/${id}`, { method: 'DELETE' }),
  attendees: (id) => request(`/classes/${id}/attendees`),

  book: (classId) => request('/bookings', { method: 'POST', body: { classId } }),
  myBookings: () => request('/bookings/me'),
  cancelBooking: (id) => request(`/bookings/${id}`, { method: 'DELETE' }),

  stats: () => request('/admin/stats'),
};

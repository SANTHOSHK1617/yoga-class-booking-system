require('./env');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connect, mongoose, User, YogaClass, Booking } = require('./db');
const seed = require('./seed');

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const CLIENT_URL = process.env.CLIENT_URL;

const app = express();
app.use(cors(CLIENT_URL ? { origin: CLIENT_URL } : undefined));
app.use(express.json());

// ---------- helpers ----------
// Lets async route handlers pass errors to the error middleware (Express 4).
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const classStart = (c) => new Date(`${c.date}T${c.startTime}:00`);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Map of classId -> number of confirmed bookings
async function bookedCounts(classIds) {
  const match = { status: 'confirmed' };
  if (classIds) match.classId = { $in: classIds };
  const rows = await Booking.aggregate([{ $match: match }, { $group: { _id: '$classId', n: { $sum: 1 } } }]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
}

function withAvailability(c, counts) {
  const obj = c.toJSON();
  const booked = counts.get(obj.id) || 0;
  return { ...obj, booked, spotsLeft: Math.max(obj.capacity - booked, 0), isPast: classStart(obj) < new Date() };
}

async function oneWithAvailability(c) {
  return withAvailability(c, await bookedCounts([c._id]));
}

function signToken(user) {
  return jwt.sign({ id: String(user._id), role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

const auth = wrap(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in to continue.' });
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
  const user = mongoose.isValidObjectId(payload.id) && (await User.findById(payload.id));
  if (!user) return res.status(401).json({ message: 'Account not found.' });
  req.user = user;
  next();
});

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
  next();
}

// Rejects malformed ids with a 404 before they reach Mongo.
function validId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Not found.' });
  next();
}

function validateClass(body) {
  const required = ['title', 'style', 'level', 'instructor', 'date', 'startTime', 'duration', 'capacity', 'price', 'location'];
  for (const f of required) {
    if (body[f] === undefined || body[f] === '') return `${f} is required.`;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return 'Date must be YYYY-MM-DD.';
  if (!/^\d{2}:\d{2}$/.test(body.startTime)) return 'Start time must be HH:MM.';
  if (Number(body.duration) <= 0) return 'Duration must be positive.';
  if (Number(body.capacity) < 1) return 'Capacity must be at least 1.';
  if (Number(body.price) < 0) return 'Price cannot be negative.';
  return null;
}

const pickClass = (b) => ({
  title: String(b.title).trim(),
  style: String(b.style).trim(),
  level: String(b.level).trim(),
  instructor: String(b.instructor).trim(),
  date: b.date,
  startTime: b.startTime,
  duration: Number(b.duration),
  capacity: Number(b.capacity),
  price: Number(b.price),
  location: String(b.location).trim(),
  description: String(b.description || '').trim(),
});

// ---------- auth ----------
app.post('/api/auth/register', wrap(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Please enter a valid email.' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  const normalized = email.trim().toLowerCase();
  if (await User.exists({ email: normalized })) return res.status(409).json({ message: 'An account with this email already exists.' });

  const user = await User.create({ name: name.trim(), email: normalized, password: bcrypt.hashSync(password, 10) });
  res.status(201).json({ token: signToken(user), user });
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: String(email || '').trim().toLowerCase() });
  if (!user || !bcrypt.compareSync(password || '', user.password)) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  res.json({ token: signToken(user), user });
}));

app.get('/api/auth/me', auth, (req, res) => res.json(req.user));

// ---------- classes ----------
app.get('/api/classes', wrap(async (req, res) => {
  const { style, level, date, search, includePast } = req.query;
  const query = {};
  if (includePast !== 'true') query.date = { $gte: todayISO() };
  if (style) query.style = style;
  if (level) query.level = level;
  if (date) query.date = includePast === 'true' ? date : (date >= todayISO() ? date : '__none__');
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    query.$or = [{ title: re }, { instructor: re }, { style: re }];
  }
  const classes = await YogaClass.find(query).sort({ date: 1, startTime: 1 });
  const counts = await bookedCounts(classes.map((c) => c._id));
  let list = classes.map((c) => withAvailability(c, counts));
  if (includePast !== 'true') list = list.filter((c) => !c.isPast);
  res.json(list);
}));

app.get('/api/classes/meta', wrap(async (req, res) => {
  const [styles, levels, instructors] = await Promise.all(
    ['style', 'level', 'instructor'].map((k) => YogaClass.distinct(k))
  );
  res.json({ styles: styles.sort(), levels: levels.sort(), instructors: instructors.sort() });
}));

app.get('/api/classes/:id', validId, wrap(async (req, res) => {
  const c = await YogaClass.findById(req.params.id);
  if (!c) return res.status(404).json({ message: 'Class not found.' });
  res.json(await oneWithAvailability(c));
}));

app.post('/api/classes', auth, adminOnly, wrap(async (req, res) => {
  const error = validateClass(req.body || {});
  if (error) return res.status(400).json({ message: error });
  const c = await YogaClass.create(pickClass(req.body));
  res.status(201).json(await oneWithAvailability(c));
}));

app.put('/api/classes/:id', auth, adminOnly, validId, wrap(async (req, res) => {
  const c = await YogaClass.findById(req.params.id);
  if (!c) return res.status(404).json({ message: 'Class not found.' });
  const error = validateClass(req.body || {});
  if (error) return res.status(400).json({ message: error });
  const updates = pickClass(req.body);
  const booked = await Booking.countDocuments({ classId: c._id, status: 'confirmed' });
  if (updates.capacity < booked) {
    return res.status(400).json({ message: `Capacity cannot be lower than current bookings (${booked}).` });
  }
  c.set(updates);
  await c.save();
  res.json(await oneWithAvailability(c));
}));

app.delete('/api/classes/:id', auth, adminOnly, validId, wrap(async (req, res) => {
  const c = await YogaClass.findByIdAndDelete(req.params.id);
  if (!c) return res.status(404).json({ message: 'Class not found.' });
  await Booking.deleteMany({ classId: c._id });
  res.json({ message: 'Class deleted.' });
}));

app.get('/api/classes/:id/attendees', auth, adminOnly, validId, wrap(async (req, res) => {
  const bookings = await Booking.find({ classId: req.params.id, status: 'confirmed' })
    .sort({ createdAt: 1 })
    .populate('userId', 'name email');
  res.json(bookings.map((b) => ({
    bookingId: String(b._id),
    name: b.userId?.name || 'Deleted user',
    email: b.userId?.email || '-',
    bookedAt: b.createdAt,
  })));
}));

// ---------- bookings ----------
app.post('/api/bookings', auth, wrap(async (req, res) => {
  const { classId } = req.body || {};
  const c = mongoose.isValidObjectId(classId) && (await YogaClass.findById(classId));
  if (!c) return res.status(404).json({ message: 'Class not found.' });
  if (classStart(c) < new Date()) return res.status(400).json({ message: 'This class has already started.' });

  const existing = await Booking.findOne({ classId: c._id, userId: req.user._id });
  if (existing?.status === 'confirmed') return res.status(409).json({ message: 'You have already booked this class.' });
  const booked = await Booking.countDocuments({ classId: c._id, status: 'confirmed' });
  if (booked >= c.capacity) return res.status(409).json({ message: 'Sorry, this class is full.' });

  let booking;
  if (existing) {
    existing.status = 'confirmed';
    existing.cancelledAt = undefined;
    existing.createdAt = new Date();
    booking = await existing.save();
  } else {
    booking = await Booking.create({ userId: req.user._id, classId: c._id });
  }
  res.status(201).json({ ...booking.toJSON(), class: await oneWithAvailability(c) });
}));

app.get('/api/bookings/me', auth, wrap(async (req, res) => {
  const bookings = await Booking.find({ userId: req.user._id }).populate('classId');
  const classes = bookings.map((b) => b.classId).filter(Boolean);
  const counts = await bookedCounts(classes.map((c) => c._id));
  const list = bookings
    .filter((b) => b.classId)
    .map((b) => {
      const cls = withAvailability(b.classId, counts);
      return { ...b.toJSON(), classId: cls.id, userId: String(b.userId), class: cls };
    })
    .sort((a, b) => classStart(a.class) - classStart(b.class));
  res.json(list);
}));

app.delete('/api/bookings/:id', auth, validId, wrap(async (req, res) => {
  const b = await Booking.findById(req.params.id).populate('classId');
  if (!b) return res.status(404).json({ message: 'Booking not found.' });
  const isAdmin = req.user.role === 'admin';
  if (!b.userId.equals(req.user._id) && !isAdmin) return res.status(403).json({ message: 'Not allowed.' });
  if (b.classId && classStart(b.classId) < new Date() && !isAdmin) {
    return res.status(400).json({ message: 'Past classes cannot be cancelled.' });
  }
  b.status = 'cancelled';
  b.cancelledAt = new Date();
  await b.save();
  res.json({ message: 'Booking cancelled.' });
}));

// ---------- admin ----------
app.get('/api/admin/stats', auth, adminOnly, wrap(async (req, res) => {
  const [members, classes, confirmed, counts] = await Promise.all([
    User.countDocuments({ role: 'member' }),
    YogaClass.find({ date: { $gte: todayISO() } }),
    Booking.find({ status: 'confirmed' }).populate('classId', 'price'),
    bookedCounts(),
  ]);
  const upcoming = classes.map((c) => withAvailability(c, counts)).filter((c) => !c.isPast);
  const revenue = confirmed.reduce((sum, b) => sum + (b.classId?.price || 0), 0);
  const seats = upcoming.reduce((s, c) => s + c.capacity, 0);
  const filled = upcoming.reduce((s, c) => s + c.booked, 0);
  res.json({
    members,
    upcomingClasses: upcoming.length,
    activeBookings: confirmed.length,
    revenue,
    occupancy: seats ? Math.round((filled / seats) * 100) : 0,
  });
}));

// ---------- production: serve the built React client ----------
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use('/api', (req, res) => res.status(404).json({ message: 'Endpoint not found.' }));
app.use((err, req, res, next) => {
  if (err.code === 11000) return res.status(409).json({ message: 'That record already exists.' });
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

// Connects (and seeds an empty database) once per process; serverless invocations reuse it.
let readyPromise;
function ready() {
  readyPromise ||= connect().then(async () => {
    if (await seed()) console.log('Seeded demo data. Admin: admin@yoga.com / admin123');
  }).catch((err) => {
    readyPromise = undefined;
    throw err;
  });
  return readyPromise;
}

module.exports = { app, ready };

if (require.main === module) {
  ready()
    .then(() => app.listen(PORT, () => console.log(`Yoga booking API running on http://localhost:${PORT}`)))
    .catch((err) => {
      console.error('Failed to connect to MongoDB:', err.message);
      console.error('Check MONGODB_URI in server/.env and that your IP is allowed in Atlas → Network Access.');
      process.exit(1);
    });
}

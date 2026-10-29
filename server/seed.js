// Populates the database with an admin, a demo member and two weeks of classes.
const bcrypt = require('bcryptjs');
const { User, YogaClass, Booking } = require('./db');

const templates = [
  { title: 'Sunrise Hatha', style: 'Hatha', level: 'Beginner', instructor: 'Ananya Rao', startTime: '06:30', duration: 60, capacity: 15, price: 12, location: 'Studio A',
    description: 'Gentle, steady postures paired with breath work to wake the body and calm the mind. Perfect for starting your day.' },
  { title: 'Power Vinyasa Flow', style: 'Vinyasa', level: 'Intermediate', instructor: 'Marcus Lee', startTime: '08:00', duration: 75, capacity: 20, price: 15, location: 'Studio B',
    description: 'A dynamic, breath-linked flow that builds heat, strength and flexibility. Expect sun salutations and creative sequencing.' },
  { title: 'Lunchtime Reset', style: 'Hatha', level: 'All Levels', instructor: 'Priya Nair', startTime: '12:30', duration: 45, capacity: 12, price: 10, location: 'Studio A',
    description: 'A short, restorative practice to release tension from the desk and refocus for the afternoon.' },
  { title: 'Ashtanga Primary Series', style: 'Ashtanga', level: 'Advanced', instructor: 'Marcus Lee', startTime: '17:30', duration: 90, capacity: 14, price: 18, location: 'Studio B',
    description: 'The traditional primary series practiced in a set sequence. Prior Ashtanga experience recommended.' },
  { title: 'Yin & Meditation', style: 'Yin', level: 'All Levels', instructor: 'Ananya Rao', startTime: '19:00', duration: 60, capacity: 18, price: 12, location: 'Studio A',
    description: 'Long-held floor poses target deep connective tissue, followed by a guided meditation to unwind.' },
  { title: 'Prenatal Yoga', style: 'Prenatal', level: 'Beginner', instructor: 'Priya Nair', startTime: '10:00', duration: 60, capacity: 10, price: 14, location: 'Studio C',
    description: 'Safe, supportive movement and breathing techniques for every trimester. Props provided.' },
  { title: 'Restorative Evening', style: 'Restorative', level: 'All Levels', instructor: 'Sofia Martins', startTime: '20:00', duration: 60, capacity: 12, price: 13, location: 'Studio C',
    description: 'Fully supported poses with bolsters and blankets to activate the relaxation response before sleep.' },
];

// Which templates run on which weekday (0 = Sunday)
const weekly = {
  0: [4, 6], 1: [0, 1, 2, 4], 2: [0, 3, 5, 6], 3: [0, 1, 2, 4],
  4: [0, 3, 5, 6], 5: [0, 1, 2, 4], 6: [1, 5],
};

const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function seed({ force = false } = {}) {
  if (!force && (await User.estimatedDocumentCount())) return false;
  if (force) await Promise.all([User.deleteMany({}), YogaClass.deleteMany({}), Booking.deleteMany({})]);

  await User.create([
    { name: 'Studio Admin', email: 'admin@yoga.com', password: bcrypt.hashSync('admin123', 10), role: 'admin' },
    { name: 'Demo Member', email: 'member@yoga.com', password: bcrypt.hashSync('member123', 10), role: 'member' },
  ]);

  const classes = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    for (const t of weekly[day.getDay()]) classes.push({ ...templates[t], date: fmt(day) });
  }
  await YogaClass.insertMany(classes);
  return true;
}

module.exports = seed;

if (require.main === module) {
  require('./env');
  const { connect, mongoose } = require('./db');
  connect()
    .then(() => seed({ force: process.argv.includes('--reset') }))
    .then(() => console.log('Database seeded. Admin: admin@yoga.com / admin123 · Member: member@yoga.com / member123'))
    .catch((err) => { console.error(err.message); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
}

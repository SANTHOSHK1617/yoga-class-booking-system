// MongoDB connection and Mongoose models.
const dns = require('dns');
const mongoose = require('mongoose');

// Expose `id` instead of `_id`, and never send password hashes to the client.
const toJSON = {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.password;
    return ret;
  },
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['member', 'admin'], default: 'member' },
  },
  { timestamps: true, toJSON }
);

const classSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    style: { type: String, required: true, trim: true },
    level: { type: String, required: true, trim: true },
    instructor: { type: String, required: true, trim: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD
    startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ }, // HH:MM
    duration: { type: Number, required: true, min: 1 },
    capacity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    location: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
  },
  { timestamps: true, toJSON }
);
classSchema.index({ date: 1, startTime: 1 });

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'YogaClass', required: true },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    cancelledAt: Date,
  },
  { timestamps: true, toJSON }
);
// One booking record per member per class (re-booking reactivates it).
bookingSchema.index({ userId: 1, classId: 1 }, { unique: true });
bookingSchema.index({ classId: 1, status: 1 });

const User = mongoose.model('User', userSchema);
const YogaClass = mongoose.model('YogaClass', classSchema);
const Booking = mongoose.model('Booking', bookingSchema);

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set. Add it to server/.env');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  } catch (err) {
    // Some networks' DNS servers refuse the SRV/TXT lookups that mongodb+srv:// needs.
    // Retry once using public DNS resolvers.
    if (!['EREFUSED', 'ETIMEOUT', 'ESERVFAIL'].includes(err.code)) throw err;
    console.warn(`DNS lookup failed (${err.code}), retrying with public DNS…`);
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  }
  await Promise.all([User.syncIndexes(), YogaClass.syncIndexes(), Booking.syncIndexes()]);
  console.log(`Connected to MongoDB (database: ${mongoose.connection.name})`);
}

module.exports = { connect, mongoose, User, YogaClass, Booking };

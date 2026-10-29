# Serenity Yoga – Class Booking System

A full-stack yoga class booking website.

- **client/** – React 18 + Vite (HTML, CSS, JavaScript)
- **server/** – Node.js + Express REST API (MongoDB Atlas via Mongoose, JWT auth)

## Features

- Browse the class schedule, grouped by day, with search and style/level/date filters
- Live availability (spots left, full classes) and a page for each class
- Register and log in (passwords hashed with bcrypt, JWT sessions)
- Book classes, see upcoming, past and cancelled bookings, and cancel with a confirmation step
- Admin dashboard: stats, create/edit/delete classes, view and remove attendees
- Responsive layout for desktop and mobile

## Getting started

Requires Node.js 18 or newer.

```bash
# 1. Start the API (http://localhost:5000)
cd server
npm install
npm run dev

# 2. In a second terminal, start the website (http://localhost:5173)
cd client
npm install
npm run dev
```

The first time the server starts, it adds demo data (two weeks of classes) and these accounts:

| Role   | Email           | Password  |
|--------|-----------------|-----------|
| Admin  | admin@yoga.com  | admin123  |
| Member | member@yoga.com | member123 |

Data is stored in MongoDB (database `yoga_booking`). Set the connection string as `MONGODB_URI` in `server/.env` (see `server/.env.example`). In MongoDB Atlas, add your IP address under **Network Access**.

To reset the data, run `npm run seed` in `server/`. This clears the users, classes and bookings and adds the demo data again.

## Production build

```bash
cd client && npm run build
cd ../server && npm start   # serves the API and the built site on http://localhost:5000
```

Before you deploy, set the `JWT_SECRET` environment variable to a secret value.

## API overview

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/register, /api/auth/login | Public |
| GET | /api/auth/me | User |
| GET | /api/classes, /api/classes/:id, /api/classes/meta | Public |
| POST/PUT/DELETE | /api/classes(/:id) | Admin |
| GET | /api/classes/:id/attendees | Admin |
| POST | /api/bookings | User |
| GET | /api/bookings/me | User |
| DELETE | /api/bookings/:id | Owner / Admin |
| GET | /api/admin/stats | Admin |

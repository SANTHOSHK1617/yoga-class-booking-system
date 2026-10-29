import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

// Books a class, redirecting guests to login first. Calls onBooked() after success.
export default function useBooking(onBooked) {
  const { user } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingId, setPendingId] = useState(null);

  const book = async (cls) => {
    if (!user) {
      notify('Please log in to book a class.', 'info');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setPendingId(cls.id);
    try {
      await api.book(cls.id);
      notify(`You're booked for ${cls.title}!`);
      onBooked?.();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setPendingId(null);
    }
  };

  return { book, pendingId };
}

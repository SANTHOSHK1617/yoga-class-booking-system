import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';

// Returns the set of class IDs the current user has an active booking for.
export default function useMyBookedIds() {
  const { user } = useAuth();
  const [ids, setIds] = useState(new Set());

  const refresh = useCallback(async () => {
    if (!user) return setIds(new Set());
    try {
      const list = await api.myBookings();
      setIds(new Set(list.filter((b) => b.status === 'confirmed').map((b) => b.classId)));
    } catch {
      setIds(new Set());
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return [ids, refresh];
}

'use client';
import { useState, useEffect } from 'react';
import { listUsers } from '@/lib/api';
import { UserSummary } from '@/types';

export function useUsers() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    listUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return { users, isLoading };
}

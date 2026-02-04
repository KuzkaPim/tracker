import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/views/auth/types';
import { useTrackerStore } from './tracker';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => {
        set({ user: null, isAuthenticated: false });
        useTrackerStore.getState().reset();
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

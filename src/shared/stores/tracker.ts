import { create } from 'zustand';
import { useAuthStore } from './auth';

interface TrackerState {
  activeProjectId: string | null;
  timeEntryId: string | null;
  isRunning: boolean;
  isPaused: boolean;
  isLoading: boolean;
  startTime: number | null;
  accumulatedTime: number;
  totalSeconds: number;

  setActiveProject: (id: string) => void;
  checkActiveTimer: () => Promise<void>;
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  fetchTotalTime: () => Promise<void>;
  reset: () => void;
}

export const useTrackerStore = create<TrackerState>((set, get) => ({
  activeProjectId: null,
  timeEntryId: null,
  isRunning: false,
  isPaused: false,
  isLoading: false,
  startTime: null,
  accumulatedTime: 0,
  totalSeconds: 0,

  setActiveProject: (id) => set({ activeProjectId: id }),

  checkActiveTimer: async () => {
    set({ isLoading: true });
    try {
      await get().fetchTotalTime();

      const res = await fetch('/api/proxy/time-entries/active');
      if (res.ok) {
        const data = await res.json();
        const active = Array.isArray(data) ? data[0] : data;
        
        if (active && active.id) {
          const startIso = active.startTime || active.timeInterval?.start;
          
          set({ 
            timeEntryId: active.id, 
            isRunning: active.status === 'RUNNING', 
            isPaused: active.status === 'PAUSED',
            activeProjectId: active.projectId,
            startTime: startIso ? new Date(startIso).getTime() : Date.now()
          });
        } else {
          set({ timeEntryId: null, isRunning: false, isPaused: false, startTime: null });
        }
      } else {
        set({ timeEntryId: null, isRunning: false, isPaused: false, startTime: null });
      }
    } catch (e) {
      console.error(e);
      set({ timeEntryId: null, isRunning: false, isPaused: false, startTime: null });
    } finally {
      set({ isLoading: false });
    }
  },

  startTimer: async () => {
    const { activeProjectId } = get();
    if (!activeProjectId) return alert('Выберите проект!');

    const user = useAuthStore.getState().user;
    const userId = user?.id; 

    set({ isLoading: true });
    try {
      const res = await fetch('/api/proxy/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId,
          projectId: activeProjectId,
          startTime: new Date().toISOString(),
          description: "Work session",
          status: "RUNNING"
        }),
      });

      if (res.ok) {
        const data = await res.json();
        set({ 
          timeEntryId: data.id, 
          isRunning: true, 
          isPaused: false,
          startTime: Date.now(),
          accumulatedTime: 0
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  stopTimer: async () => {
    const { timeEntryId } = get();
    if (!timeEntryId) return;

    set({ isLoading: true });
    try {
      await fetch(`/api/proxy/time-entries/${timeEntryId}/stop`, {
        method: 'PUT',
      });
      
      set({ timeEntryId: null, isRunning: false, isPaused: false, startTime: null, accumulatedTime: 0 });
      await get().fetchTotalTime();
      
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  pauseTimer: async () => {
    const { timeEntryId, startTime, accumulatedTime } = get();
    if (!timeEntryId) return;
    
    const currentSegment = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    const totalElapsed = accumulatedTime + currentSegment;
    
    set({ isLoading: true, accumulatedTime: totalElapsed });
    try {
      await fetch(`/api/proxy/time-entries/${timeEntryId}/pause`, { method: 'PUT' });
      set({ isPaused: true, isRunning: false });
      await get().fetchTotalTime();
    } catch (e) { 
      console.error(e); 
    } finally {
      set({ isLoading: false });
    }
  },

  resumeTimer: async () => {
    const { timeEntryId } = get();
    if (!timeEntryId) return;
    set({ isLoading: true });
    try {
      await fetch(`/api/proxy/time-entries/${timeEntryId}/resume`, { method: 'PUT' });
      set({ isPaused: false, isRunning: true, startTime: Date.now() });
      await get().fetchTotalTime();
    } catch (e) { 
      console.error(e); 
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTotalTime: async () => {
    try {
      const res = await fetch('/api/proxy/time-entries/my');
      if (res.ok) {
        const entries = await res.json();
        
        if (Array.isArray(entries)) {
          const total = entries.reduce((acc: number, entry: { status?: string; duration?: number; timeInterval?: { duration?: number } }) => {
            if (entry.status === 'RUNNING' || entry.status === 'PAUSED') return acc;
            const duration = entry.duration || entry.timeInterval?.duration || 0;
            return acc + duration;
          }, 0);
          
          set({ totalSeconds: total });
        }
      }
    } catch (e) {
      console.error(e);
    }
  },

  reset: () => {
    set({
      activeProjectId: null,
      timeEntryId: null,
      isRunning: false,
      isPaused: false,
      isLoading: false,
      startTime: null,
      totalSeconds: 0,
    });
  }
}));
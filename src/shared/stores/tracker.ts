import { create } from 'zustand';
import { useAuthStore } from './auth';

interface TrackerState {
  // Состояние
  activeProjectId: string | null;
  timeEntryId: string | null; // Самое важное: ID текущего таймера (для скриншотов)
  isRunning: boolean;
  isPaused: boolean;
  isLoading: boolean;
  startTime: number | null; // Чтобы считать секунды на клиенте
  totalSeconds: number; // Общая сумма секунд

  // Действия
  setActiveProject: (id: string) => void;
  checkActiveTimer: () => Promise<void>; // Проверить при загрузке страницы
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  fetchTotalTime: () => Promise<void>;
}

export const useTrackerStore = create<TrackerState>((set, get) => ({
  activeProjectId: null,
  timeEntryId: null,
  isRunning: false,
  isPaused: false,
  isLoading: false,
  startTime: null,
  totalSeconds: 0,

  setActiveProject: (id) => set({ activeProjectId: id }),

  // 1. Проверка активного таймера (если обновил страницу)
  checkActiveTimer: async () => {
    set({ isLoading: true });
    try {
      // Этот эндпоинт возвращает массив активных записей (или одну)
      const res = await fetch('/api/proxy/time-entries/active');
      if (res.ok) {
        const data = await res.json();
        // Если пришел массив и он не пуст - берем первый
        const active = Array.isArray(data) ? data[0] : data;
        
        if (active && active.id) {
            set({ 
                timeEntryId: active.id, 
                isRunning: active.status !== 'STOPPED', 
                isPaused: active.status === 'PAUSED',
                activeProjectId: active.projectId,
                startTime: new Date(active.timeInterval.start).getTime()
            });
        }
        
        // Подгружаем статистику сразу
        get().fetchTotalTime();
      }
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  // 2. Старт
  startTimer: async () => {
    const { activeProjectId } = get();
    if (!activeProjectId) return alert('Выберите проект!');

    const user = useAuthStore.getState().user;
    if (!user?.id) return alert('Ошибка: пользователь не авторизован');

    set({ isLoading: true });
    try {
      const res = await fetch('/api/proxy/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userId: user.id,
            projectId: activeProjectId,
            startTime: new Date().toISOString(),
            description: "Разработка функционала авторизации",
            status: "RUNNING"
        }),
      });

      if (res.ok) {
        const data = await res.json();
        set({ 
            timeEntryId: data.id, 
            isRunning: true, 
            isPaused: false,
            startTime: Date.now() 
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  // 3. Стоп
  stopTimer: async () => {
    const { timeEntryId } = get();
    if (!timeEntryId) return;

    set({ isLoading: true });
    try {
      await fetch(`/api/proxy/time-entries/${timeEntryId}/stop`, {
        method: 'PUT',
      });
      
      set({ timeEntryId: null, isRunning: false, isPaused: false, startTime: null });
      // Обновляем статистику после остановки
      get().fetchTotalTime();
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  // 4. Пауза
  pauseTimer: async () => {
    const { timeEntryId } = get();
    if (!timeEntryId) return;

    set({ isLoading: true });
    try {
      await fetch(`/api/proxy/time-entries/${timeEntryId}/pause`, {
        method: 'PUT',
      });
      set({ isPaused: true });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  // 5. Продолжить
  resumeTimer: async () => {
    const { timeEntryId } = get();
    if (!timeEntryId) return;

    set({ isLoading: true });
    try {
      await fetch(`/api/proxy/time-entries/${timeEntryId}/resume`, {
        method: 'PUT',
      });
      set({ isPaused: false });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  // 6. Загрузить общую статистику
  fetchTotalTime: async () => {
    const userContext = useAuthStore.getState().user;
    if (!userContext?.id) return;

    try {
      const res = await fetch('/api/proxy/time-entries');
      if (res.ok) {
        const entries = await res.json();
        if (Array.isArray(entries)) {
          let total = 0;
          entries.forEach((entry: { timeInterval?: { duration?: number; start?: string; end?: string } }) => {
              if (entry.timeInterval?.duration) {
                total += entry.timeInterval.duration;
              } else if (entry.timeInterval?.start && entry.timeInterval?.end) {
                const start = new Date(entry.timeInterval.start).getTime();
                const end = new Date(entry.timeInterval.end).getTime();
                total += Math.floor((end - start) / 1000);
              }
          });
          set({ totalSeconds: total });
        }
      }
    } catch (e) {
      console.error('Ошибка загрузки статистики:', e);
    }
  },
}));
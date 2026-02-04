'use client';
import { useEffect, useState } from 'react';
import { useTrackerStore } from '@/shared/stores';

// Иконки кнопок (локальные, чтобы не тащить лишние зависимости)
const PlayIcon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const PauseIcon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
const StopIcon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16"/></svg>;
const ClockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

export const Timer = () => {
  const { 
    isRunning, 
    isPaused,
    startTime, 
    startTimer, 
    pauseTimer,
    resumeTimer,
    stopTimer, 
    isLoading, 
    activeProjectId 
  } = useTrackerStore();

  // --- Логика тиканья (для UI) ---
  const [elapsed, setElapsed] = useState(() => {
    if (isRunning && startTime) return Math.floor((Date.now() - startTime) / 1000);
    return 0;
  });

  useEffect(() => {
    if (!isRunning || !startTime || isPaused) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, startTime, isPaused]);

  // Вычисляем отображаемое время
  const displaySeconds = (isRunning && startTime) ? elapsed : 0;
  const h = Math.floor(displaySeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((displaySeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (displaySeconds % 60).toString().padStart(2, '0');

  return (
    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 w-full">
      
      {/* ЛЕВАЯ ЧАСТЬ: Текст и Кнопки */}
      <div className="space-y-4">
        <div>
          <h4 className="text-xl font-bold text-gray-900">Управление временем</h4>
          <p className="text-sm text-gray-400 font-medium">
            {activeProjectId 
              ? 'Проект активен' 
              : '← Сначала выберите проект'}
          </p>
        </div>

        {/* Кнопки показываем только если есть проект */}
        {activeProjectId && (
          <div className="flex gap-4">
            {!isRunning ? (
              <button 
                onClick={startTimer}
                disabled={isLoading}
                className="bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <PlayIcon />
                {isLoading ? 'Запуск...' : 'НАЧАТЬ РАБОТУ'}
              </button>
            ) : (
              <div className="flex gap-3">
                {!isPaused ? (
                   <button 
                   onClick={pauseTimer}
                   disabled={isLoading}
                   className="bg-amber-500 text-white px-6 py-4 rounded-xl font-bold hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-amber-200 shadow-lg"
                 >
                   <PauseIcon />
                   ПАУЗА
                 </button>
                ) : (
                  <button 
                  onClick={resumeTimer}
                  disabled={isLoading}
                  className="bg-black text-white px-6 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg"
                >
                  <PlayIcon />
                  ПРОДОЛЖИТЬ
                </button>
                )}
               
                <button 
                  onClick={stopTimer}
                  disabled={isLoading}
                  className="bg-red-500 text-white px-6 py-4 rounded-xl font-bold hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-red-200 shadow-lg"
                >
                  <StopIcon />
                  СТОП
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ПРАВАЯ ЧАСТЬ: Цифры */}
      <div className="flex flex-col items-center md:items-end gap-1">
        <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
          <ClockIcon />
          <span>Текущая сессия</span>
        </div>
        
        <div className="text-7xl font-black tracking-tighter leading-none tabular-nums text-gray-900 transition-all">
          {h}:{m}:{s}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore, useTrackerStore } from '@/shared/stores';
import { useScreenTracker } from '@/shared/hooks';
import { Timer, ProjectSelector } from '@/views/dashboard/blocks'; // Наш новый умный компонент

// Иконки для статистики (ClockIcon и UsersIcon можно вынести в отдельные файлы, но для Dashboard оставим тут для контекста)
const ClockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const UsersIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const PulsingIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 animate-pulse"><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>;

export const Dashboard = () => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  
  // Нам нужно только это для инициализации и выбора проекта
  const { 
    setActiveProject, 
    checkActiveTimer, 
    timeEntryId, 
    isRunning,
    isPaused,
    startTime,
    totalSeconds
  } = useTrackerStore();

  const { startTracking, stopTracking, videoRef, isTracking } = useScreenTracker({
    intervalMs: 1000 * 60 * 5, 
    uploadUrl: '/api/proxy/screenshots',
    timeEntryId: timeEntryId
  });

  useEffect(() => { checkActiveTimer(); }, []);

  useEffect(() => {
    if (isRunning && timeEntryId && !isPaused) {
      if (!isTracking) startTracking();
    } else {
      if (isTracking) stopTracking();
    }
  }, [isRunning, timeEntryId, isPaused, isTracking]);

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  // --- Live Ticker for total stats sync ---
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const isCurrentlyTracking = isRunning && startTime && !isPaused;

  // Сброс при остановке/паузе (официальный паттерн React для сброса стейта)
  if (!isCurrentlyTracking && sessionElapsed !== 0) {
    setSessionElapsed(0);
  }

  useEffect(() => {
    if (!isCurrentlyTracking) return;

    const interval = setInterval(() => {
      setSessionElapsed(Math.floor((Date.now() - startTime!) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isCurrentlyTracking, startTime]);

  const displayTotalSeconds = totalSeconds + sessionElapsed;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans relative">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <h2 className="text-lg font-semibold tracking-tight">Hubnity Tracker</h2>
        <button onClick={logout} className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors">Выйти</button>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-12">
        <section className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Привет, {user?.name?.split(' ')[0] || 'Коллега'}! 👋</h1>
          <p className="text-gray-400 font-medium capitalize">{today}</p>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-gray-800">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <h3 className="font-bold tracking-tight uppercase text-xs">Обзор</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md group">
              <div className="flex justify-between items-start mb-6">
                <span className="text-sm font-bold text-gray-800">Всего часов</span>
                <span className="text-gray-400 group-hover:text-blue-500 transition-colors"><ClockIcon /></span>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-extrabold tracking-tighter tabular-nums">
                   {Math.floor(displayTotalSeconds / 3600).toString().padStart(2, '0')}:
                   {Math.floor((displayTotalSeconds % 3600) / 60).toString().padStart(2, '0')}:
                   {(displayTotalSeconds % 60).toString().padStart(2, '0')}
                </div> 
                <div className="text-xs font-semibold text-gray-400">Статистика</div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md group">
              <div className="flex justify-between items-start mb-6">
                <span className="text-sm font-bold text-gray-800">Скриншоты</span>
                <span className={`transition-colors ${isTracking ? 'text-green-500' : 'text-gray-400'}`}>
                    {isTracking ? <PulsingIcon /> : <UsersIcon />}
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-extrabold tracking-tighter">{isTracking ? 'Активно' : 'Ожидание'}</div>
                <div className="text-xs font-semibold text-gray-400">{isTracking ? 'Запись экрана идет' : 'Таймер остановлен'}</div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                   <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                </div>
                <h4 className="text-sm font-bold text-gray-800 mb-4">Текущий проект</h4>
                <ProjectSelector onSelect={setActiveProject} />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-gray-800">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <h3 className="font-bold tracking-tight uppercase text-xs">Трекер времени</h3>
          </div>

          <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
            
            {/* ВЕСЬ UI ТАЙМЕРА ТЕПЕРЬ ЖИВЕТ ТУТ */}
            <Timer />

            {isTracking && (
                <div className="absolute top-6 right-6">
                    <PulsingIcon />
                </div>
            )}
          </div>
        </section>
      </main>

      <video ref={videoRef} className="absolute top-0 left-0 w-px h-px opacity-0 pointer-events-none" autoPlay playsInline muted />
    </div>
  );
};
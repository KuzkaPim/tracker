'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore, useTrackerStore } from '@/shared/stores';
import { useScreenTracker } from '@/shared/hooks';
import { Timer, ProjectSelector, ScreenshotGallery } from '@/views/dashboard/blocks';

const ClockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const PulsingIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 animate-pulse"><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>;
const StatusActiveIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const StatusInactiveIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;

export const Dashboard = () => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  
  const { 
    setActiveProject,
    startTimer,
    checkActiveTimer,
    fetchTotalTime,
    timeEntryId, 
    isRunning, 
    isPaused,
    startTime,
    accumulatedTime,
    totalSeconds 
  } = useTrackerStore();

  const { stopTimer } = useTrackerStore();

  const [isStarting, setIsStarting] = useState(false);
  
  const wasStoppedManuallyRef = useRef(false);

  const handleBrowserStop = useCallback(() => {
    console.log('🛑 [Dashboard] Browser stopped sharing, stopping timer...');
    wasStoppedManuallyRef.current = true;
    stopTimer();
  }, [stopTimer]);

  const { startTracking, stopTracking, videoRef, isTracking } = useScreenTracker({
    intervalMs: 10000,
    uploadUrl: '/api/proxy/screenshots',
    timeEntryId: timeEntryId,
    onTrackEnded: handleBrowserStop
  });

  useEffect(() => { 
    checkActiveTimer();
    fetchTotalTime();
  }, []);

  useEffect(() => {
    if (isRunning && !wasStoppedManuallyRef.current) {
      if (!isTracking && !isStarting) {
        startTracking(); 
      }
    } else if (!isRunning) {
      wasStoppedManuallyRef.current = false;
      if (isTracking && !isStarting) stopTracking();
    }
  }, [isRunning, isTracking, startTracking, stopTracking, isStarting]);

  const handleStartTimer = async () => {
     console.log('🚀 [Dashboard] Manual start requested');
     setIsStarting(true);
     try {
        console.log('👀 [Dashboard] Requesting screen access...');
        const ok = await startTracking();
        console.log(`👀 [Dashboard] Screen access result: ${ok}`);
        
        if (!ok) {
            console.log('🚫 [Dashboard] User cancelled or error');
            return; 
        }

        console.log('⏳ [Dashboard] Starting backend timer...');
        await startTimer();
        console.log('✅ [Dashboard] Backend timer started');
     } catch (e) {
        console.error('💥 [Dashboard] Error in handleStartTimer:', e);
        stopTracking();
     } finally {
        setIsStarting(false);
     }
  };

  const { resumeTimer } = useTrackerStore();
  
  const handleResumeTimer = async () => {
     console.log('▶️ [Dashboard] Resume requested');
     setIsStarting(true);
     try {
        console.log('👀 [Dashboard] Requesting screen access for resume...');
        const ok = await startTracking();
        console.log(`👀 [Dashboard] Screen access result: ${ok}`);
        
        if (!ok) {
            console.log('🚫 [Dashboard] User cancelled or error');
            return; 
        }

        console.log('⏳ [Dashboard] Resuming backend timer...');
        await resumeTimer();
        console.log('✅ [Dashboard] Backend timer resumed');
     } catch (e) {
        console.error('💥 [Dashboard] Error in handleResumeTimer:', e);
        stopTracking();
     } finally {
        setIsStarting(false);
     }
  };

  const [currentSegment, setCurrentSegment] = useState(0);

  useEffect(() => {
    if (isPaused) {
      setCurrentSegment(0);
      return;
    }

    if (!startTime || !isRunning) {
      setCurrentSegment(0);
      return;
    }

    const calcSegment = () => Math.floor((Date.now() - startTime) / 1000);
    setCurrentSegment(calcSegment());
    const interval = setInterval(() => {
      setCurrentSegment(calcSegment());
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, startTime]);

  const hasActiveSession = isRunning || isPaused;
  const currentSessionAddition = hasActiveSession ? (accumulatedTime + currentSegment) : 0;
  
  const displayTotalSeconds = totalSeconds + currentSessionAddition;

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

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
                <span className="text-sm font-bold text-gray-800">Всего времени</span>
                <span className="text-gray-400 group-hover:text-blue-500 transition-colors"><ClockIcon /></span>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-extrabold tracking-tighter tabular-nums text-gray-900">
                   {Math.floor(displayTotalSeconds / 3600).toString().padStart(2, '0')}:
                   {Math.floor((displayTotalSeconds % 3600) / 60).toString().padStart(2, '0')}:
                   {(displayTotalSeconds % 60).toString().padStart(2, '0')}
                </div> 
                <div className="text-xs font-semibold text-gray-400">За всё время + текущая сессия</div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md group">
              <div className="flex justify-between items-start mb-6">
                <span className="text-sm font-bold text-gray-800">Статус</span>
                <span className={`transition-colors ${isTracking ? 'text-green-500' : 'text-gray-400'}`}>
                    {isTracking ? <StatusActiveIcon /> : <StatusInactiveIcon />}
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
            <Timer onStartRequest={handleStartTimer} onResumeRequest={handleResumeTimer} />
            {isTracking && (
                <div className="absolute top-6 right-6">
                    <PulsingIcon />
                </div>
            )}
          </div>
          
          <ScreenshotGallery timeEntryId={timeEntryId} />
        </section>
      </main>

      <video ref={videoRef} className="absolute top-0 left-0 w-px h-px opacity-0 pointer-events-none" autoPlay playsInline muted />
    </div>
  );
};
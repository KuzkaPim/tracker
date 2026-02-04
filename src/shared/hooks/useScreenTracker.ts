import { useState, useRef, useEffect, useCallback } from 'react';

interface TrackerOptions {
  intervalMs: number;
  uploadUrl: string;
  timeEntryId: string | null;
  onTrackEnded?: () => void;
}

export const useScreenTracker = ({ intervalMs, uploadUrl, timeEntryId, onTrackEnded }: TrackerOptions) => {
  const [isTracking, setIsTracking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRequestingRef = useRef(false);

  const startTracking = useCallback(async (): Promise<boolean> => {
    if (isTracking || isRequestingRef.current) {
        console.log(`⚠️ [useScreenTracker] Early exit: isTracking=${isTracking}, isRequesting=${isRequestingRef.current}`);
        return true; 
    }

    console.log('🖥 [useScreenTracker] Requesting display media...');
    isRequestingRef.current = true;

    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      console.log('✅ [useScreenTracker] Stream acquired');
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play(); 
      } else {
        console.error('❌ [useScreenTracker] videoRef.current is null!');
      }

      setIsTracking(true);

      mediaStream.getVideoTracks()[0].onended = () => {
        console.log('🛑 [useScreenTracker] Track ended (user revoked access via browser)');
        stopTracking();
        if (onTrackEnded) {
          onTrackEnded();
        }
      };
      
      console.log('✨ [useScreenTracker] Tracking started successfully');
      return true;

    } catch (err) {
      console.error("❌ [useScreenTracker] Error/Cancel:", err);
      setIsTracking(false); 
      return false; 
    } finally {
      console.log('🔒 [useScreenTracker] Releasing request lock');
      isRequestingRef.current = false;
    }
  }, [isTracking]);

  const takeScreenshot = useCallback(async () => {
    if (!videoRef.current || !streamRef.current || !timeEntryId) return;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.5);

    console.log(`📸 Отправка скриншота (${Math.round(imageData.length / 1024)} KB)...`);

    try {
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          timeEntryId,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        console.error('Ошибка отправки скриншота:', error);
      }
    } catch (e) {
      console.error('Ошибка отправки:', e);
    }
  }, [timeEntryId, uploadUrl]);

  useEffect(() => {
    if (isTracking && timeEntryId) {
      const initialTimeout = setTimeout(takeScreenshot, 2000);
      intervalRef.current = setInterval(takeScreenshot, intervalMs);
      
      return () => {
        clearTimeout(initialTimeout);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isTracking, timeEntryId, intervalMs, takeScreenshot]);

  const stopTracking = useCallback(() => {
    console.log('⏹ Остановка трекинга экрана');
    setIsTracking(false);
    isRequestingRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
  }, []);

  return { startTracking, stopTracking, isTracking, videoRef };
};
import { useState, useRef, useEffect } from 'react';

interface TrackerOptions {
  intervalMs: number; // Интервал в мс (например, 60000 = 1 минута)
  uploadUrl: string;  // '/api/proxy/screenshots'
  timeEntryId: string | null; // ID текущей задачи
}

export const useScreenTracker = ({ intervalMs, uploadUrl, timeEntryId }: TrackerOptions) => {
  const [isTracking, setIsTracking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Запуск захвата (вызывает окно браузера)
  const startTracking = async () => {
    try {
      if (isTracking) return; // Уже запущено

      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        video: { displaySurface: 'monitor' } as any, // Подсказка браузеру
        audio: false,
      });

      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      setIsTracking(true);

      // Если юзер сам нажал "Закрыть доступ" в браузере
      mediaStream.getVideoTracks()[0].onended = () => {
        stopTracking();
      };

    } catch (err) {
      console.error("Отмена захвата экрана или ошибка:", err);
      setIsTracking(false);
    }
  };

  // 2. Сделать скриншот и отправить
  const takeScreenshot = async () => {
    // Если нет видео, потока или ID задачи — не фоткаем
    if (!videoRef.current || !streamRef.current || !timeEntryId) {
        console.log("Скриншот пропущен: нет ID задачи или потока");
        return;
    }

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      // 'screenshot' — имя поля, которое ждет Hubnity (по Swagger)
      formData.append('screenshot', blob, `screen-${Date.now()}.jpg`);
      // ОБЯЗАТЕЛЬНО привязываем к задаче
      formData.append('timeEntryId', timeEntryId); 

      console.log(`📸 Отправка скриншота для задачи ${timeEntryId}...`);

      try {
        const res = await fetch(uploadUrl, {
          method: 'POST',
          body: formData, // Headers для FormData браузер ставит сам
        });
        
        if (!res.ok) {
            const err = await res.text();
            console.error('Ошибка загрузки скриншота:', err);
        } else {
            console.log('✅ Скриншот успешно сохранен!');
        }
      } catch (e) {
        console.error('Ошибка сети при отправке скриншота:', e);
      }
    }, 'image/jpeg', 0.6); // Качество 0.6 достаточно
  };

  // 3. Управление таймером
  useEffect(() => {
    if (isTracking && timeEntryId) {
      // Запускаем интервал съемки
      intervalRef.current = setInterval(takeScreenshot, intervalMs);
    } else {
      // Если трекинг выключили или пропал ID — чистим таймер
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTracking, timeEntryId, intervalMs]); // Перезапуск при смене ID или статуса

  // 4. Остановка
  const stopTracking = () => {
    setIsTracking(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return { startTracking, stopTracking, isTracking, videoRef };
};
'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = 'https://hubnity.automatonsoft.de';

interface Screenshot {
  id: string;
  timeEntryId: string;
  imageUrl: string;
  thumbnailUrl: string;
  timestamp: string;
  createdAt: string;
}

interface ScreenshotGalleryProps {
  timeEntryId: string | null;
}

export const ScreenshotGallery = ({ timeEntryId }: ScreenshotGalleryProps) => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchScreenshots = useCallback(async () => {
    if (!timeEntryId) {
      setScreenshots([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/proxy/screenshots/time-entry/${timeEntryId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const sorted = data.sort((a: Screenshot, b: Screenshot) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setScreenshots(sorted.slice(0, 6));
        } else {
          setScreenshots([]);
        }
      }
    } catch (e) {
      console.error('Ошибка загрузки скриншотов:', e);
    } finally {
      setIsLoading(false);
    }
  }, [timeEntryId]);

  useEffect(() => {
    fetchScreenshots();
  }, [fetchScreenshots]);

  useEffect(() => {
    if (!timeEntryId) return;
    
    const interval = setInterval(fetchScreenshots, 10000);
    return () => clearInterval(interval);
  }, [timeEntryId, fetchScreenshots]);

  if (!timeEntryId) {
    return null;
  }

  const getImageUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return `${API_URL}${path}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Скриншоты
          </h4>
          <button 
            onClick={fetchScreenshots}
            disabled={isLoading}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Загрузка...' : 'Обновить'}
          </button>
        </div>

        {screenshots.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            {isLoading ? 'Загрузка...' : 'Нет скриншотов'}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {screenshots.map((screenshot) => (
              <button
                key={screenshot.id}
                onClick={() => setSelectedImage(getImageUrl(screenshot.imageUrl))}
                className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-blue-400 transition-all group"
              >
                <img
                  src={getImageUrl(screenshot.thumbnailUrl || screenshot.imageUrl)}
                  alt={`Скриншот ${formatTime(screenshot.timestamp)}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                  {formatTime(screenshot.timestamp)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <img
            src={selectedImage}
            alt="Полноразмерный скриншот"
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

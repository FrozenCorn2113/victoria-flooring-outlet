import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { WifiIcon } from '@heroicons/react/24/outline';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [hasShownOffline, setHasShownOffline] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      if (hasShownOffline) {
        toast.success('Connection restored', {
          icon: '🟢',
          duration: 3000,
        });
      }
      setHasShownOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setHasShownOffline(true);
      toast.error('No internet connection', {
        icon: '🔴',
        duration: Infinity, // Stay until dismissed or connection restored
        id: 'offline-toast', // Prevent duplicate toasts
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasShownOffline]);

  // Don't render any UI - we're using toasts
  // Could optionally add a small indicator in the header
  if (isOnline) {
    return null;
  }

  // Optional: Small persistent indicator when offline
  return (
    <div className="fixed bottom-20 left-4 z-40 bg-red-600 text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm">
      <WifiIcon className="w-4 h-4" />
      <span className="sr-only">Offline</span>
    </div>
  );
}

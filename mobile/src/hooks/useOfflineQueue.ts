import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { flushQueue, enqueue } from '@/services/offlineQueue';

export function useOfflineQueue() {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        flushQueue().catch(() => null);
      }
    });
    return unsubscribe;
  }, []);

  return { enqueue };
}

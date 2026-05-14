import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAsyncStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (raw !== null) setValue(JSON.parse(raw) as T);
      })
      .finally(() => setLoading(false));
  }, [key]);

  const store = async (newValue: T) => {
    setValue(newValue);
    await AsyncStorage.setItem(key, JSON.stringify(newValue));
  };

  const remove = async () => {
    setValue(defaultValue);
    await AsyncStorage.removeItem(key);
  };

  return { value, loading, store, remove };
}

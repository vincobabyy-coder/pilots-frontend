import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileApi } from './api';

const QUEUE_KEY = 'pilots_offline_queue';

interface QueueItem {
  id: string;
  method: 'POST' | 'PUT';
  path: string;
  body: unknown;
  timestamp: string;
}

export async function enqueue(method: 'POST' | 'PUT', path: string, body: unknown): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: QueueItem[] = raw ? (JSON.parse(raw) as QueueItem[]) : [];
  queue.push({
    id: `${Date.now()}-${Math.random()}`,
    method,
    path,
    body,
    timestamp: new Date().toISOString(),
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function flushQueue(): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return;

  const queue: QueueItem[] = JSON.parse(raw) as QueueItem[];
  if (queue.length === 0) return;

  const remaining: QueueItem[] = [];

  for (const item of queue) {
    try {
      if (item.method === 'POST') {
        await mobileApi.post(item.path, item.body);
      } else {
        await mobileApi.put(item.path, item.body);
      }
    } catch {
      remaining.push(item);
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
}

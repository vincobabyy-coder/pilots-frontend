import { publicGet } from './api';
import { PublicTracking } from '@/types/tracking';

export const trackingService = {
  lookup: (trackingNumber: string) =>
    publicGet<PublicTracking>(`/tracking/${encodeURIComponent(trackingNumber)}`),
};

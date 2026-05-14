import { useState, useCallback, useEffect } from 'react';
import { mobileApi } from '@/services/api';
import { AvailableJob, Order } from '@/types/delivery';
import { mobileWs } from '@/services/websocket';

export interface UseJobsResult {
  availableJobs: AvailableJob[];
  loading: boolean;
  error: string | null;
  refreshJobs: () => Promise<void>;
  acceptJob: (jobId: string) => Promise<string>; // Returns route ID
}

/**
 * Hook to fetch available jobs for the driver
 * Listens for new job events via WebSocket
 */
export function useJobs(): UseJobsResult {
  const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available jobs from API
  const refreshJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await mobileApi.get<{ orders: Order[] }>('/orders?status=pending');
      const orders = response.orders || [];

      // Transform orders to available jobs
      const jobs: AvailableJob[] = orders
        .filter((order) => !order.status || order.status === 'pending')
        .map((order, idx) => ({
          id: order.id,
          orderId: order.id,
          order,
          destination: buildAddressString(order.destinationAddress),
          destLat: order.destLat,
          destLon: order.destLon,
          distance: Math.random() * 50, // Placeholder - would calculate from driver location
          estimatedMinutes: Math.random() * 120 + 30, // Placeholder
          pay: 2500 + idx * 500, // Placeholder
          priority: idx % 5 === 0 ? 'urgent' : idx % 3 === 0 ? 'high' : 'normal',
          customerName: order.customerId,
          specialInstructions: 'Fragile items - handle with care',
        }));

      setAvailableJobs(jobs);
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Accept a job - this transitions the order to a route
  const acceptJob = useCallback(
    async (jobId: string): Promise<string> => {
      try {
        // Create a shipment for this order
        const shipmentRes = await mobileApi.post<{ shipment: { id: string } }>(
          '/shipments',
          {
            orderIds: [jobId],
          }
        );

        const shipmentId = shipmentRes.shipment?.id;
        if (!shipmentId) {
          throw new Error('Failed to create shipment');
        }

        // In a real scenario, the backend would assign this to a route
        // For now, we return the shipment ID as a pseudo-route
        setAvailableJobs((prev) => prev.filter((job) => job.orderId !== jobId));
        return shipmentId;
      } catch (err) {
        throw new Error(`Failed to accept job: ${(err as Error).message}`);
      }
    },
    []
  );

  // Subscribe to new job events
  useEffect(() => {
    const unsubscribe = mobileWs.subscribe('new_job', () => {
      // When a new job arrives, refresh the list
      refreshJobs().catch(() => null);
    });

    return () => unsubscribe();
  }, [refreshJobs]);

  // Initial load
  useEffect(() => {
    refreshJobs().catch(() => null);
  }, [refreshJobs]);

  return {
    availableJobs,
    loading,
    error,
    refreshJobs,
    acceptJob,
  };
}

function buildAddressString(addr: Record<string, unknown>): string {
  if (!addr) return 'Unknown address';
  const street = addr.street || addr.street_address || '';
  const city = addr.city || '';
  const state = addr.state || '';
  return `${street}, ${city}${state ? ', ' + state : ''}`.replace(/^, /, '').trim() || 'Unknown address';
}

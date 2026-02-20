import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function usePrefetch() {
  const queryClient = useQueryClient();
  const prefetchedRef = useRef<Set<string>>(new Set());

  const prefetchPatient = useCallback(
    (patientId: string) => {
      if (prefetchedRef.current.has(`patient-${patientId}`)) return;
      prefetchedRef.current.add(`patient-${patientId}`);

      queryClient.prefetchQuery({
        queryKey: ['patients', patientId],
        queryFn: async () => {
          const { data } = await apiClient.get(`/patients/${patientId}`);
          return data;
        },
        staleTime: 30000,
      });
    },
    [queryClient]
  );

  const prefetchRoute = useCallback(
    (route: string, queryKey: string[], endpoint: string) => {
      if (prefetchedRef.current.has(route)) return;
      prefetchedRef.current.add(route);

      queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => {
          const { data } = await apiClient.get(endpoint);
          return data;
        },
        staleTime: 60000,
      });
    },
    [queryClient]
  );

  return { prefetchPatient, prefetchRoute };
}

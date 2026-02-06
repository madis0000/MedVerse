import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useLabOrders(filters?: any) {
  return useQuery({
    queryKey: ['lab-orders', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/lab-orders', { params: filters });
      return data;
    },
  });
}

export function useLabOrder(id: string) {
  return useQuery({
    queryKey: ['lab-orders', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/lab-orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateLabOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/lab-orders', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
    },
  });
}

export function useUpdateLabOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch(`/lab-orders/${id}/status`, { status });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
      queryClient.invalidateQueries({ queryKey: ['lab-orders', variables.id] });
    },
  });
}

export function useEnterLabResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/lab-results', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
      queryClient.invalidateQueries({ queryKey: ['lab-results'] });
    },
  });
}

export function usePatientLabTrends(patientId: string) {
  return useQuery({
    queryKey: ['lab-results', 'patient', patientId, 'trends'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/lab-results/patient/${patientId}/trends`);
      return data;
    },
    enabled: !!patientId,
  });
}

export function useLabTests() {
  return useQuery({
    queryKey: ['lab-tests'],
    queryFn: async () => {
      const { data } = await apiClient.get('/lab-tests');
      return data;
    },
  });
}

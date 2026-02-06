import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useAppointments(filters?: any) {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/appointments', { params: filters });
      return data;
    },
  });
}

export function useCalendarAppointments(params?: any) {
  return useQuery({
    queryKey: ['appointments', 'calendar', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/appointments/calendar', { params });
      return data;
    },
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/appointments', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch(`/appointments/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'waiting-queue'] });
    },
  });
}

export function useWaitingQueue() {
  return useQuery({
    queryKey: ['appointments', 'waiting-queue'],
    queryFn: async () => {
      const { data } = await apiClient.get('/appointments/waiting-queue');
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/appointments/${id}/check-in`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'waiting-queue'] });
    },
  });
}

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/admin');
      return data;
    },
  });
}

export function useDoctorDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'doctor'],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/doctor');
      return data;
    },
  });
}

export function useRevenueData(period?: string) {
  return useQuery({
    queryKey: ['dashboard', 'revenue', period],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/revenue', {
        params: { period },
      });
      return data;
    },
  });
}

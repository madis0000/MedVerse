import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function usePrescription(id: string) {
  return useQuery({
    queryKey: ['prescriptions', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/prescriptions/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function usePatientPrescriptions(patientId: string) {
  return useQuery({
    queryKey: ['prescriptions', 'patient', patientId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/prescriptions/patient/${patientId}`);
      return data;
    },
    enabled: !!patientId,
  });
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/prescriptions', payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      if (variables.patientId) {
        queryClient.invalidateQueries({
          queryKey: ['prescriptions', 'patient', variables.patientId],
        });
      }
    },
  });
}

export function useCheckInteractions() {
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/prescriptions/check-interactions', payload);
      return data;
    },
  });
}

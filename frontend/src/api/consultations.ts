import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useConsultation(id: string) {
  return useQuery({
    queryKey: ['consultations', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/consultations/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateConsultation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/consultations', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useUpdateConsultation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await apiClient.patch(`/consultations/${id}`, payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['consultations', variables.id] });
    },
  });
}

export function useAddVitals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ consultationId, ...vitals }: any) => {
      const { data } = await apiClient.post(
        `/consultations/${consultationId}/vitals`,
        vitals,
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['consultations', variables.consultationId],
      });
    },
  });
}

export function useAddDiagnosis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ consultationId, ...diagnosis }: any) => {
      const { data } = await apiClient.post(
        `/consultations/${consultationId}/diagnoses`,
        diagnosis,
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['consultations', variables.consultationId],
      });
    },
  });
}

export function useSearchICD10(query: string) {
  return useQuery({
    queryKey: ['icd10', 'search', query],
    queryFn: async () => {
      const { data } = await apiClient.get('/icd10/search', {
        params: { q: query },
      });
      return data;
    },
    enabled: query.length >= 2,
  });
}

export function useSearchMedications(query: string) {
  return useQuery({
    queryKey: ['medications', 'search', query],
    queryFn: async () => {
      const { data } = await apiClient.get('/medications/search', {
        params: { q: query },
      });
      return data;
    },
    enabled: query.length >= 2,
  });
}

export function useTemplates(specialtyId?: string) {
  return useQuery({
    queryKey: ['consultations', 'templates', specialtyId],
    queryFn: async () => {
      const { data } = await apiClient.get('/consultations/templates', {
        params: specialtyId ? { specialtyId } : undefined,
      });
      return data;
    },
  });
}

export function useQuickTexts() {
  return useQuery({
    queryKey: ['quick-texts'],
    queryFn: async () => {
      const { data } = await apiClient.get('/quick-texts');
      return data;
    },
  });
}

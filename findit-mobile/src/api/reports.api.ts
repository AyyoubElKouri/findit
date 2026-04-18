import { apiClient } from './client';

export const reportsApi = {
  getReports: async <T = unknown>(params?: Record<string, unknown>): Promise<T> =>
    (await apiClient.get<T>('/reports', { params })).data,
  createReport: async <T = unknown>(data: Record<string, unknown>): Promise<T> => {
    if (__DEV__) {
      const photoCount = Array.isArray(data.photos) ? data.photos.length : 0;
      console.info('[reportsApi.createReport] request', {
        type: data.type,
        photoCount,
        hasAddress: Boolean(data.adresse),
        hasCoordinates:
          typeof data.latitude === 'number' && typeof data.longitude === 'number',
      });
    }

    try {
      const response = await apiClient.post<T>('/reports', data);

      if (__DEV__) {
        console.info('[reportsApi.createReport] success', { status: response.status });
      }

      return response.data;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[reportsApi.createReport] failed', {
          status: error?.response?.status,
          data: error?.response?.data,
          message: error?.message,
        });
      }
      throw error;
    }
  },
  getReport: async <T = unknown>(id: string): Promise<T> =>
    (await apiClient.get<T>(`/reports/${id}`)).data,
  updateReport: async <T = unknown>(id: string, data: Record<string, unknown>): Promise<T> =>
    (await apiClient.patch<T>(`/reports/${id}`, data)).data,
  updateReportStatus: async <T = unknown>(
    id: string,
    data: { statut: 'resolu' | 'rendu' },
  ): Promise<T> => (await apiClient.patch<T>(`/reports/${id}/status`, data)).data,
  deleteReport: async (id: string): Promise<void> => {
    await apiClient.delete(`/reports/${id}`);
  },
  getReportMatches: async <T = unknown>(id: string): Promise<T> =>
    (await apiClient.get<T>(`/reports/${id}/matches`)).data,
};

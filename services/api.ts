import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sie_auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const reservationService = {
    getAll: () => api.get('/reservations'),
    create: (data: any) => api.post('/reservations', data),
    delete: (id: string | number) => api.delete(`/reservations/${id}`),
};

export const aiService = {
    chat: (message: string) => api.post('/ai/chat', { message }),
    globalSearch: (query: string) => api.post('/ai/global-search', { query }),
    generateAssemblyAta: (data: any) => api.post('/ai/generate-assembly-ata', data),
    generateDocument: (prompt: string) => api.post('/ai/generate-document', { prompt }),
};

export const financialService = {
    getAll: (filters?: any) => api.get('/financials', { params: filters }),
    getDashboardStats: () => api.get('/dashboard/stats'),
    create: (data: any) => api.post('/financials', data),
    update: (id: string | number, data: any) => api.put(`/financials/${id}`, data),
    delete: (id: string | number) => api.delete(`/financials/${id}`),
};

export const authService = {
    me: () => api.get('/auth/me'),
    login: (credentials: any) => api.post('/auth/login', credentials),
    register: (data: any) => api.post('/auth/register', data),
};

// FIX: Added getSustainabilityStats to systemService to resolve property missing error in Sustainability.tsx
export const systemService = {
    getInfo: () => api.get('/settings/system'),
    updateInfo: (data: any) => api.put('/settings/system', data),
    getSustainabilityStats: () => api.get('/settings/sustainability'),
};

export const userService = {
    getAll: (page?: number, limit?: number, search?: string) => api.get('/users', { params: { page, limit, search } }),
    getDossier: (id: string | number) => api.get(`/users/${id}/dossier`),
    create: (data: any) => api.post('/users', data),
    update: (id: string | number, data: any) => api.put(`/users/${id}`, data),
};

export const templateService = {
    getAll: () => api.get('/settings/templates'),
    save: (data: any) => api.post('/settings/templates', data),
};

export const surveyService = {
    getAll: () => api.get('/surveys'),
    create: (data: any) => api.post('/surveys', data),
    update: (id: string | number, data: any) => api.put(`/surveys/${id}`, data),
    delete: (id: string | number) => api.delete(`/surveys/${id}`),
    getPublic: (id: string) => api.get(`/surveys/public/${id}`),
    submitPublic: (id: string, data: any) => api.post(`/surveys/public/${id}/submit`, data),
};

export const mapService = {
    getUnits: () => api.get('/map/units'),
};

export const demographicsService = {
    getStats: () => api.get('/demographics/stats'),
};

export const governanceService = {
    getMatrix: () => api.get('/governance/matrix'),
    updateMatrix: (data: any) => api.put('/governance/matrix', data),
};

export const aiKeyService = {
    getAll: () => api.get('/settings/ai-keys'),
    create: (data: any) => api.post('/settings/ai-keys', data),
};

export const operationsService = {
    getIncidents: () => api.get('/operations/incidents'),
    createIncident: (data: any) => api.post('/operations/incidents', data),
    updateIncident: (id: string | number, data: any) => api.put(`/operations/incidents/${id}`, data),
    deleteIncident: (id: string | number) => api.delete(`/operations/incidents/${id}`),
};

export const communicationService = {
    getNotices: () => api.get('/communication/notices'),
    sendNotice: (data: any) => api.post('/communication/notices', data),
    updateNotice: (id: string | number, data: any) => api.put(`/communication/notices/${id}`, data),
    deleteNotice: (id: string | number) => api.delete(`/communication/notices/${id}`),
};

export const agendaService = {
    getAll: () => api.get('/agenda'),
    create: (data: any) => api.post('/agenda', data),
    update: (id: string | number, data: any) => api.put(`/agenda/${id}`, data),
    delete: (id: string | number) => api.delete(`/agenda/${id}`),
};

export const projectService = {
    getAll: () => api.get('/projects'),
    create: (data: any) => api.post('/projects', data),
    update: (id: string | number, data: any) => api.put(`/projects/${id}`, data),
    delete: (id: string | number) => api.delete(`/projects/${id}`),
};

export const marketplaceService = {
    getAll: () => api.get('/marketplace'),
    create: (data: any) => api.post('/marketplace', data),
    update: (id: string | number, data: any) => api.put(`/marketplace/${id}`, data),
    delete: (id: string | number) => api.delete(`/marketplace/${id}`),
};

export const assetService = {
    getAll: () => api.get('/assets'),
    create: (data: any) => api.post('/assets', data),
    update: (id: string | number, data: any) => api.put(`/assets/${id}`, data),
    delete: (id: string | number) => api.delete(`/assets/${id}`),
};

export const censusService = {
    register: (data: any) => api.post('/census/register', data),
    createProfile: (registryId: number, data: any) => api.post(`/census/registry/${registryId}/profile`, data),
};

export const documentService = {
    getAll: () => api.get('/documents'),
    create: (data: any) => api.post('/documents', data),
    update: (id: string | number, data: any) => api.put(`/documents/${id}`, data),
    delete: (id: string | number) => api.delete(`/documents/${id}`),
};

export const assemblyService = {
    getAll: () => api.get('/assemblies'),
    create: (data: any) => api.post('/assemblies', data),
    update: (id: string | number, data: any) => api.put(`/assemblies/${id}`, data),
    delete: (id: string | number) => api.delete(`/assemblies/${id}`),
};

export default api;
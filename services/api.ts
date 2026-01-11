
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

export const authService = {
    me: () => api.get('/auth/me'),
    login: (credentials: any) => api.post('/auth/login', credentials),
    register: (data: any) => api.post('/auth/register', data),
};

export const censusService = {
    submit: (data: { cpf: string; name?: string; email?: string; unit?: string; answers: any }) => 
        api.post('/census/submit', data),
    register: (data: any) => api.post('/census/register', data),
    createProfile: (registryId: number, data: any) => api.post(`/census/registry/${registryId}/profile`, data),
};

export const userService = {
    getAll: (page?: number, limit?: number, search?: string) => api.get('/users', { params: { page, limit, search } }),
    getDossier: (id: string | number) => api.get(`/users/${id}/dossier`),
    create: (data: any) => api.post('/users', data),
    update: (id: string | number, data: any) => api.put(`/users/${id}`, data),
};

export const financialService = {
    getAll: (filters?: any) => api.get('/financials', { params: filters }),
    getDashboardStats: () => api.get('/dashboard/stats'),
    create: (data: any) => api.post('/financials', data),
    update: (id: string | number, data: any) => api.put(`/financials/${id}`, data),
    delete: (id: string | number) => api.delete(`/financials/${id}`),
};

export const systemService = {
    getInfo: () => api.get('/settings/system'),
    getSustainabilityStats: () => api.get('/sustainability/stats'),
};

export const documentService = {
    getAll: () => api.get('/documents'),
    create: (data: any) => api.post('/documents', data),
    update: (id: string | number, data: any) => api.put(`/documents/${id}`, data),
    delete: (id: string | number) => api.delete(`/documents/${id}`),
};

export const mapService = {
    getUnits: () => api.get('/users', { params: { limit: 1000 } }),
};

export const demographicsService = {
    getStats: () => api.get('/demographics/stats'),
};

export const aiService = {
    chat: (message: string) => api.post('/ai/chat', { message }),
    globalSearch: (query: string) => api.post('/ai/global-search', { query }),
    generateDocument: (prompt: string) => api.post('/ai/generate-document', { prompt }),
    generateAssemblyAta: (data: any) => api.post('/ai/generate-assembly-ata', data),
};

export const surveyService = {
    getAll: () => api.get('/surveys'),
    create: (data: any) => api.post('/surveys', data),
    update: (id: string | number, data: any) => api.put(`/surveys/${id}`, data),
    delete: (id: string | number) => api.delete(`/surveys/${id}`),
    getPublic: (id: string) => api.get(`/surveys/public/${id}`),
    submitPublic: (id: string, data: any) => api.post(`/surveys/public/${id}/submit`, data),
    // SRE CORE: Recupera respostas históricas vinculadas ao CPF
    getResponsesByCpf: (cpf: string) => api.get('/survey-responses', { params: { user_cpf: cpf.replace(/\D/g, '') } }),
};

export const aiKeyService = {
    getAll: () => api.get('/ai-keys'),
    create: (data: any) => api.post('/ai-keys', data),
};

export const templateService = {
    getAll: () => api.get('/templates'),
};

export const operationsService = {
    getIncidents: () => api.get('/incidents'),
    createIncident: (data: any) => api.post('/incidents', data),
    updateIncident: (id: string | number, data: any) => api.put(`/incidents/${id}`, data),
    deleteIncident: (id: string | number) => api.delete(`/incidents/${id}`),
};

export const communicationService = {
    getNotices: () => api.get('/notices'),
    sendNotice: (data: any) => api.post('/notices', data),
    updateNotice: (id: string | number, data: any) => api.put(`/notices/${id}`, data),
    deleteNotice: (id: string | number) => api.delete(`/notices/${id}`),
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

export const assemblyService = {
    getAll: () => api.get('/assemblies'),
    create: (data: any) => api.post('/assemblies', data),
    update: (id: string | number, data: any) => api.put(`/assemblies/${id}`, data),
    delete: (id: string | number) => api.delete(`/assemblies/${id}`),
};

export const reservationService = {
    getAll: () => api.get('/reservations'),
    create: (data: any) => api.post('/reservations', data),
    delete: (id: string | number) => api.delete(`/reservations/${id}`),
};

export default api;

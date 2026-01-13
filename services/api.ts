
import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('sie_auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    login: (credentials: any) => api.post('/auth/login', credentials),
    register: (data: any) => api.post('/auth/register', data),
    me: () => api.get('/auth/me'),
};

export const userService = {
    getAll: (page = 1, limit = 10, search = '') => api.get('/users', { params: { page, limit, search } }),
    getById: (id: string | number) => api.get(`/users/${id}`),
    create: (data: any) => api.post('/users', data),
    update: (id: string | number, data: any) => api.put(`/users/${id}`, data),
    delete: (id: string | number) => api.delete(`/users/${id}`),
};

export const financialService = {
    getAll: (params?: any) => api.get('/financials', { params }),
    getDashboardStats: () => api.get('/financials/stats'),
    create: (data: any) => api.post('/financials', data),
    update: (id: string | number, data: any) => api.put(`/financials/${id}`, data),
    delete: (id: string | number) => api.delete(`/financials/${id}`),
};

export const surveyService = {
    getAll: () => api.get('/surveys'),
    getPublic: (id: string) => api.get(`/surveys/public/${id}`),
    submitPublic: (id: string, data: any) => api.post(`/surveys/public/${id}/submit`, data),
    getResponsesByCpf: (cpf: string) => api.get(`/surveys/responses/${cpf}`),
    create: (data: any) => api.post('/surveys', data),
    update: (id: string | number, data: any) => api.put(`/surveys/${id}`, data),
    delete: (id: string | number) => api.delete(`/surveys/${id}`),
};

export const demographicsService = {
    getStats: () => api.get('/demographics/stats'),
};

export const aiKeyService = {
    getAll: () => api.get('/ai-keys'),
    create: (data: any) => api.post('/ai-keys', data),
    delete: (id: string | number) => api.delete(`/ai-keys/${id}`),
};

export const systemService = {
    getInfo: () => api.get('/settings/system'),
    updateInfo: (data: any) => api.put('/settings/system', data),
    getSustainabilityStats: () => api.get('/sustainability/stats'),
    getPermissions: () => api.get('/settings/permissions'),
    updatePermissions: (matrix: any[]) => api.put('/settings/permissions', { matrix }),
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
    getAll: () => api.get('/timeline'),
    create: (data: any) => api.post('/timeline', data),
    update: (id: string | number, data: any) => api.put(`/timeline/${id}`, data),
    delete: (id: string | number) => api.delete(`/timeline/${id}`),
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

export const aiService = {
    chat: (prompt: string) => api.post('/ai/chat', { contents: prompt }),
    generateDocument: (prompt: string) => api.post('/ai/generate-document', { contents: prompt }),
    generateAssemblyAta: (data: any) => api.post('/ai/generate-ata', data),
    generateUserDossier: (userId: string | number) => api.get(`/ai/user-dossier/${userId}`),
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

export const reservationService = {
    getAll: () => api.get('/reservations'),
    create: (data: any) => api.post('/reservations', data),
    delete: (id: string | number) => api.delete(`/reservations/${id}`),
};

// SRE FIX: Added missing mapService for SmartMap component compatibility
export const mapService = {
    getUnits: () => api.get('/users'),
};

// SRE FIX: Added missing censusService for CensusRegister and SocioProfile components compatibility
export const censusService = {
    register: (data: any) => api.post('/census/register', data),
    createProfile: (registryId: number | string, data: any) => api.post(`/census/profile/${registryId}`, data),
};

export { api };
export default api;

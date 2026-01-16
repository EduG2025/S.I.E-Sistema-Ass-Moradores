import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('sie_auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('sie_auth_token');
            window.dispatchEvent(new Event('sie_unauthorized'));
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: (creds: { username: string; password: string }) => api.post('/auth/login', creds),
    register: (data: { name: string; cpf_cnpj: string; phone: string; unit: string; role: string }) => api.post('/auth/register', data),
    me: () => api.get('/auth/me'),
    updatePassword: (password: string) => api.post('/auth/update-password', { password }),
};

export const userService = {
    getAll: (page = 1, limit = 50, search = '') => api.get('/users', { params: { page, limit, search } }),
    create: (data: any) => api.post('/users', data),
    update: (id: any, data: any) => api.put(`/users/${id}`, data),
    delete: (id: any) => api.delete(`/users/${id}`),
    activate: (id: any) => api.post(`/users/${id}/activate`),
    generateInvite: (id: any) => api.post(`/users/${id}/invite`),
};

export const financialService = {
    getAll: (params?: any) => api.get('/financials', { params }),
    getDashboardStats: () => api.get('/financials/stats'),
    create: (data: any) => api.post('/financials', data),
    update: (id: any, data: any) => api.put(`/financials/${id}`, data),
};

export const residentService = {
    getDashboard: () => api.get('/resident/dashboard'),
};

export const communicationService = {
    getNotices: () => api.get('/notices'),
    sendNotice: (data: any) => api.post('/notices', data),
    deleteNotice: (id: any) => api.delete(`/notices/${id}`),
    broadcastWhatsApp: (message: string, targetRole: string) => api.post('/communication/whatsapp-broadcast', { message, targetRole }),
    updateNotice: (id: any, data: any) => api.put(`/notices/${id}`, data),
};

export const surveyService = {
    getAll: () => api.get('/surveys'),
    getPublic: (id: string) => api.get(`/surveys/public/${id}`),
    submitPublic: (id: string, data: any) => api.post(`/surveys/public/${id}/submit`, data),
    suggestQuestions: (data: any) => api.post('/surveys/suggest', data),
    update: (id: any, data: any) => api.put(`/surveys/${id}`, data),
    create: (data: any) => api.post('/surveys', data),
    delete: (id: any) => api.delete(`/surveys/${id}`),
    getResponsesByCpf: (cpf: string) => api.get(`/surveys/responses/cpf/${cpf}`),
};

/**
 * CENSUS SERVICE (SRE PROTOCOL V22.5)
 */
export const censusService = {
    register: (data: any) => api.post('/census/register', data),
    createProfile: (registryId: number, data: any) => api.post(`/census/profile/${registryId}`, data),
};

export const aiService = {
    chat: (prompt: string) => api.post('/ai/chat', { contents: prompt }),
    generateUserDossier: (id: any) => api.post(`/ai/dossier/${id}`),
    generateDocument: (prompt: string) => api.post('/ai/generate-document', { prompt }),
};

export const cameraService = {
    getAll: () => api.get('/cameras'),
    getConfig: () => api.get('/monitoring/config'),
    saveConfig: (config: any) => api.post('/monitoring/config', config),
    create: (data: any) => api.post('/cameras', data),
    delete: (id: any) => api.delete(`/cameras/${id}`),
};

export const aiKeyService = {
    getAll: () => api.get('/ai-keys'),
    create: (data: any) => api.post('/ai-keys', data),
    delete: (id: any) => api.delete(`/ai-keys/${id}`),
};

export const systemService = {
    getInfo: () => api.get('/settings/system'),
    updateInfo: (info: any) => api.put('/settings/system', info),
    getSustainabilityStats: () => api.get('/sustainability/stats'),
    getPermissions: () => api.get('/settings/permissions'),
    updatePermissions: (data: any) => api.post('/settings/permissions', data),
};

export const mapService = {
    getUnits: () => api.get('/users'),
};

export const demographicsService = {
    getStats: () => api.get('/demographics/stats'),
};

export const operationsService = {
    getIncidents: () => api.get('/incidents'),
    createIncident: (data: any) => api.post('/incidents', data),
    updateIncident: (id: any, data: any) => api.put(`/incidents/${id}`, data),
};

export const agendaService = {
    getAll: () => api.get('/agenda'),
    create: (data: any) => api.post('/agenda', data),
    update: (id: any, data: any) => api.put(`/agenda/${id}`, data),
    delete: (id: any) => api.delete(`/agenda/${id}`),
};

export const projectService = {
    getAll: () => api.get('/projects'),
    create: (data: any) => api.post('/projects', data),
    update: (id: any, data: any) => api.put(`/projects/${id}`, data),
    delete: (id: any) => api.delete(`/projects/${id}`),
};

export const marketplaceService = {
    getAll: () => api.get('/marketplace'),
    create: (data: any) => api.post('/marketplace', data),
    update: (id: any, data: any) => api.put(`/marketplace/${id}`, data),
};

export const reservationService = {
    getAll: () => api.get('/reservations'),
    create: (data: any) => api.post('/reservations', data),
    delete: (id: any) => api.delete(`/reservations/${id}`),
};

export const assetService = {
    getAll: () => api.get('/assets'),
    create: (data: any) => api.post('/assets', data),
    update: (id: any, data: any) => api.put(`/assets/${id}`, data),
    delete: (id: any) => api.delete(`/assets/${id}`),
};

export const documentService = {
    getAll: () => api.get('/documents'),
    create: (data: any) => api.post('/documents', data),
    update: (id: any, data: any) => api.put(`/documents/${id}`, data),
    delete: (id: any) => api.delete(`/documents/${id}`),
};

export const assemblyService = {
    getAll: () => api.get('/assemblies'),
    create: (data: any) => api.post('/assemblies', data),
    update: (id: any, data: any) => api.put(`/assemblies/${id}`, data),
    delete: (id: any) => api.delete(`/assemblies/${id}`),
};

export { api };
export default api;
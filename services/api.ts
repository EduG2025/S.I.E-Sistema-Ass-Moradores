
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
    me: () => api.get('/auth/me'),
};

export const systemService = {
    getInfo: () => api.get('/settings/system'),
    updateInfo: (info: any) => api.put('/settings/system', info),
    getRoles: () => api.get('/settings/roles'),
    saveRole: (role: any) => api.post('/settings/roles', role),
    updateRole: (id: string, role: any) => api.put(`/settings/roles/${id}`, role),
    deleteRole: (id: string) => api.delete(`/settings/roles/${id}`),
    getPermissions: () => api.get('/settings/permissions'),
    togglePermission: (data: any) => api.post('/settings/permissions/toggle', data),
    getSustainabilityStats: () => api.get('/sustainability/stats'),
};

export const aiKeyService = {
    getAll: () => api.get('/settings/ai-keys'),
    create: (data: any) => api.post('/settings/ai-keys', data),
    update: (id: any, data: any) => api.put(`/settings/ai-keys/${id}`, data),
    delete: (id: any) => api.delete(`/settings/ai-keys/${id}`),
};

export const userService = {
    getAll: (page = 1, limit = 50, search = '') => api.get('/users', { params: { page, limit, search } }),
    update: (id: any, data: any) => api.put(`/users/${id}`, data),
    create: (data: any) => api.post('/users', data),
    activate: (id: any) => api.post(`/users/${id}/activate`),
    delete: (id: any) => api.delete(`/users/${id}`),
    getDependents: (id: any) => api.get(`/users/${id}/dependents`),
};

export const financialService = {
    getAll: (params?: any) => api.get('/financials', { params }),
    getDashboardStats: () => api.get('/financials/stats'),
    create: (data: any) => api.post('/financials', data),
    update: (id: any, data: any) => api.put(`/financials/${id}`, data),
    delete: (id: any) => api.delete(`/financials/${id}`),
};

export const aiService = {
    chat: (prompt: string, grounding?: { search?: boolean, maps?: boolean, location?: { lat: number, lng: number } }) => 
        api.post('/ai/chat', { 
            contents: prompt, 
            useSearch: grounding?.search, 
            useMaps: grounding?.maps, 
            location: grounding?.location 
        }),
    generateUserDossier: (id: any) => api.post(`/ai/dossier/${id}`),
    generateDocument: (prompt: string) => api.post('/ai/generate-document', { prompt }),
};

export const mapService = {
    getUnits: () => api.get('/users'),
    searchAdvanced: (query: string) => api.post('/users/search-neural', { query }),
};

export const demographicsService = {
    getStats: () => api.get('/demographics/stats'),
};

export const surveyService = {
    getAll: () => api.get('/surveys'),
    getResponsesByCpf: (cpf: string) => api.get(`/surveys/responses/cpf/${cpf}`),
    suggestQuestions: (data: any) => api.post('/surveys/suggest', data),
    create: (data: any) => api.post('/surveys', data),
    update: (id: any, data: any) => api.put(`/surveys/${id}`, data),
    delete: (id: any) => api.delete(`/surveys/${id}`),
};

export const communicationService = {
    getNotices: () => api.get('/communication/notices'),
    sendNotice: (data: any) => api.post('/communication/notices', data),
    updateNotice: (id: any, data: any) => api.put(`/communication/notices/${id}`, data),
    deleteNotice: (id: any) => api.delete(`/communication/notices/${id}`),
    
    // TEMPLATES
    getTemplates: () => api.get('/communication/templates'),
    saveTemplate: (data: any) => api.post('/communication/templates', data),
    deleteTemplate: (id: any) => api.delete(`/communication/templates/${id}`),

    getSchedules: () => api.get('/communication/schedules'),
    createSchedule: (data: any) => api.post('/communication/schedules', data),
    deleteSchedule: (id: any) => api.delete(`/communication/schedules/${id}`),
};

// SRE FIX: Missing exported services added to resolve frontend errors
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
    getAll: () => api.get('/community/marketplace'),
    create: (data: any) => api.post('/community/marketplace', data),
    update: (id: any, data: any) => api.put(`/community/marketplace/${id}`, data),
    delete: (id: any) => api.delete(`/community/marketplace/${id}`),
};

export const cameraService = {
    getAll: () => api.get('/cameras'),
    create: (data: any) => api.post('/cameras', data),
    delete: (id: any) => api.delete(`/cameras/${id}`),
};

export const assetService = {
    getAll: () => api.get('/assets'),
    create: (data: any) => api.post('/assets', data),
    update: (id: any, data: any) => api.put(`/assets/${id}`, data),
    delete: (id: any) => api.delete(`/assets/${id}`),
};

export const censusService = {
    register: (data: any) => api.post('/census/register', data),
    createProfile: (registryId: number, data: any) => api.post(`/census/profile/${registryId}`, data),
};

export const documentService = {
    getAll: () => api.get('/governance/documents'),
    create: (data: any) => api.post('/governance/documents', data),
    update: (id: any, data: any) => api.put(`/governance/documents/${id}`, data),
    delete: (id: any) => api.delete(`/governance/documents/${id}`),
};

export const assemblyService = {
    getAll: () => api.get('/governance/assemblies'),
    create: (data: any) => api.post('/governance/assemblies', data),
    update: (id: any, data: any) => api.put(`/governance/assemblies/${id}`, data),
    delete: (id: any) => api.delete(`/governance/assemblies/${id}`),
};

export const suggestionService = {
    getAll: () => api.get('/community/suggestions'),
    create: (data: any) => api.post('/community/suggestions', data),
    update: (id: any, data: any) => api.put(`/community/suggestions/${id}`, data),
    delete: (id: any) => api.delete(`/community/suggestions/${id}`),
};

export const reservationService = {
    getAll: () => api.get('/community/reservations'),
    create: (data: any) => api.post('/community/reservations', data),
    delete: (id: any) => api.delete(`/community/reservations/${id}`),
};

export { api };
export default api;

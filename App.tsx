
import React, { useState, Suspense, lazy, useEffect, useMemo } from 'react';
import { MENU_ITEMS, DEFAULT_SYSTEM_INFO, DEFAULT_ID_CARD_TEMPLATE } from './constants';
import { SystemInfo, User, IdCardTemplate } from './types';
import {
    LogOut, Menu, Loader2, Settings as SettingsIcon, Shield,
    Bell, Zap, Search, Sparkles, X, Key, ChevronLeft, ChevronRight, Lock
} from 'lucide-react';
import { systemService, authService, templateService } from './services/api';

const Dashboard = lazy(() => import('./components/Dashboard')) as any;
const Finance = lazy(() => import('./components/Finance')) as any;
const Settings = lazy(() => import('./components/Settings')) as any;
const UserManagement = lazy(() => import('./components/UserManagement')) as any;
const Surveys = lazy(() => import('./components/Surveys') as any) as any;
const Timeline = lazy(() => import('./components/Timeline')) as any;
const Operations = lazy(() => import('./components/Operations')) as any;
const DemographicAnalysis = lazy(() => import('./components/DemographicAnalysis')) as any;
const ProjectManagement = lazy(() => import('./components/ProjectManagement')) as any;
const MarketPlace = lazy(() => import('./components/MarketPlace')) as any;
const LoginScreen = lazy(() => import('./components/LoginScreen')) as any;
const DigitalWatch = lazy(() => import('./components/DigitalWatch')) as any;
const Assets = lazy(() => import('./components/Assets')) as any;
const DocumentHub = lazy(() => import('./components/DocumentHub')) as any;
const AssemblyManager = lazy(() => import('./components/AssemblyManager')) as any;
const ChatAssistant = lazy(() => import('./components/ChatAssistant')) as any;
const SuggestionBox = lazy(() => import('./components/SuggestionBox')) as any;
const Reservations = lazy(() => import('./components/Reservations')) as any;
const Sustainability = lazy(() => import('./components/Sustainability')) as any;
const PublicSenso = lazy(() => import('./components/PublicSenso')) as any;

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [systemInfo, setSystemInfo] = useState<SystemInfo>(DEFAULT_SYSTEM_INFO);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    
    const [settingsTab, setSettingsTab] = useState<'INFO' | 'ACCESS' | 'API' | 'STUDIO'>('INFO');
    const [templates, setTemplates] = useState<IdCardTemplate[]>([DEFAULT_ID_CARD_TEMPLATE]);

    const isPublicCensus = window.location.pathname.includes('/census/');

    const initKernel = async () => {
        if (isPublicCensus) {
            setIsLoading(false);
            return;
        }

        const token = localStorage.getItem('sie_auth_token');
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const userRes = await authService.me();
            const userData = userRes.data;
            setCurrentUser(userData);
            setIsAuthenticated(true);

            const [infoRes, templatesRes] = await Promise.all([
                systemService.getInfo(),
                templateService.getAll()
            ]);

            setSystemInfo(infoRes.data);
            if (templatesRes.data.data) setTemplates(templatesRes.data.data);
        } catch (error) {
            localStorage.removeItem('sie_auth_token');
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { initKernel(); }, []);

    // MOTOR DE VISIBILIDADE RBAC REAL
    const canSee = (permissionId: string) => {
        if (!currentUser) return false;
        // Protocolo SRE: Bypass master removido para teste real de filtragem solicitado pelo usuário.
        // Se desejar reativar o master absoluto: if (currentUser.id === 1) return true;
        return currentUser.permissions?.includes(permissionId);
    };

    // Componente de Fallback para Acesso Negado
    const AccessDenied = () => (
        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-fade-in">
            <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                <Lock size={48} />
            </div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Acesso Bloqueado</h3>
            <p className="text-slate-500 font-medium max-w-md mt-4 leading-relaxed">
                O seu cargo (<span className="text-indigo-600 font-black">{currentUser?.role}</span>) não possui permissão de leitura para este módulo na Matriz de Governança.
            </p>
            <button onClick={() => setActiveTab('dashboard')} className="mt-10 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all">Retornar ao Dashboard</button>
        </div>
    );

    const handleLoginSuccess = (user: User, token: string) => {
        localStorage.setItem('sie_auth_token', token);
        setCurrentUser(user);
        setIsAuthenticated(true);
        window.location.reload();
    };

    const handleLogout = () => {
        localStorage.removeItem('sie_auth_token');
        window.location.reload();
    };

    if (isLoading) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617]">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">SRE Kernel Booting...</p>
        </div>
    );

    if (isPublicCensus) return (
        <Suspense fallback={<div className="h-screen flex flex-col items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
            <PublicSenso />
        </Suspense>
    );

    if (!isAuthenticated) return (
        <Suspense fallback={null}>
            <LoginScreen onLoginSuccess={handleLoginSuccess} systemInfo={systemInfo} />
        </Suspense>
    );

    return (
        <div className="h-screen w-screen overflow-hidden flex bg-[#f8fafc] font-sans">
            <aside className={`fixed lg:static inset-y-0 left-0 z-[60] bg-slate-950 border-r border-white/5 flex flex-col shrink-0 transition-all duration-500 ${sidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80 lg:translate-x-0'} ${sidebarCollapsed ? 'lg:w-24' : 'lg:w-80'}`}>
                <div className={`p-8 flex items-center justify-between ${sidebarCollapsed ? 'flex-col gap-4' : ''}`}>
                    <div className="flex items-center gap-4">
                        <div className={`bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shrink-0 transition-all ${sidebarCollapsed ? 'w-10 h-10' : 'w-12 h-12'}`}>
                            <Shield size={sidebarCollapsed ? 18 : 24} className="text-white" />
                        </div>
                        {!sidebarCollapsed && (
                            <div className="animate-fade-in">
                                <h1 className="font-black text-white text-xl tracking-tighter leading-none">S.I.E PRO</h1>
                                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-1">Gestão Ativa</p>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                    {!sidebarOpen && (
                        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex p-2 text-slate-600 hover:text-indigo-400 transition-colors">
                            {sidebarCollapsed ? <ChevronRight size={20}/> : <ChevronLeft size={20}/>}
                        </button>
                    )}
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar">
                    {MENU_ITEMS.map((item) => {
                        if (!canSee(item.permissionId)) return null;
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setSettingsTab('INFO'); setSidebarOpen(false); }}
                                className={`w-full flex items-center p-4 rounded-2xl transition-all group ${isActive ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white/5 hover:text-white'} ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-4'}`}
                                title={sidebarCollapsed ? item.label : ''}
                            >
                                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} />
                                {!sidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest animate-fade-in truncate">{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                <div className={`p-6 border-t border-white/5 space-y-6 ${sidebarCollapsed ? 'items-center' : ''}`}>
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-4 p-2 rounded-2xl bg-white/5 border border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-white text-xs border border-white/10 shadow-lg shrink-0">
                                {currentUser?.name?.[0]}
                            </div>
                            <div className="flex-1 min-w-0 animate-fade-in">
                                <p className="text-xs font-black text-white truncate">{currentUser?.name}</p>
                                <p className="text-[9px] font-bold text-indigo-400 uppercase truncate">{currentUser?.role}</p>
                            </div>
                        </div>
                    )}
                    <button onClick={handleLogout} className={`flex items-center gap-4 p-4 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest ${sidebarCollapsed ? 'justify-center' : 'w-full'}`}>
                        <LogOut size={18} /> {!sidebarCollapsed && <span className="animate-fade-in">Encerrar</span>}
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shrink-0 z-50">
                    <div className="flex items-center gap-4 flex-1">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-3 bg-slate-100 rounded-xl text-slate-600">
                            <Menu size={20} />
                        </button>
                        <div className="hidden md:flex relative w-full max-w-lg">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold outline-none"
                                placeholder="Consultar Kernel S.I.E..."
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {canSee('manage_ai_keys') && (
                            <button onClick={() => { setActiveTab('settings'); setSettingsTab('API'); }} className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 shadow-lg">
                                <Key size={14}/> AI GATEWAY
                            </button>
                        )}
                        {canSee('manage_settings') && (
                            <button onClick={() => setActiveTab('settings')} className="p-3 bg-slate-100 rounded-xl text-slate-600 hover:bg-indigo-600 hover:text-white transition-all">
                                <SettingsIcon size={20} />
                            </button>
                        )}
                    </div>
                </header>

                <main className="flex-1 flex flex-col min-h-0 bg-[#fcfcfd] overflow-hidden relative">
                    <div className="flex-1 flex flex-col min-h-0 w-full overflow-y-auto custom-scrollbar p-4 lg:p-8">
                        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40}/></div>}>
                            {activeTab === 'dashboard' && (canSee('view_dashboard') ? <Dashboard onNavigate={setActiveTab} /> : <AccessDenied />)}
                            {activeTab === 'users' && (canSee('manage_users') ? <UserManagement /> : <AccessDenied />)}
                            {activeTab === 'finance' && (canSee('view_finances') ? <Finance /> : <AccessDenied />)}
                            {activeTab === 'settings' && (canSee('manage_settings') ? <Settings systemInfo={systemInfo} onUpdateSystemInfo={setSystemInfo} templates={templates} onUpdateTemplates={setTemplates} initialTab={settingsTab} /> : <AccessDenied />)}
                            {activeTab === 'surveys' && (canSee('manage_users') ? <Surveys /> : <AccessDenied />)}
                            {activeTab === 'operations' && (canSee('view_operations') ? <Operations /> : <AccessDenied />)}
                            {activeTab === 'projects' && (canSee('view_projects') ? <ProjectManagement /> : <AccessDenied />)}
                            {activeTab === 'marketplace' && (canSee('manage_marketplace') ? <MarketPlace /> : <AccessDenied />)}
                            {activeTab === 'assets' && (canSee('view_assets') ? <Assets /> : <AccessDenied />)}
                            {activeTab === 'neural_chat' && (canSee('use_ai_chat') ? <ChatAssistant /> : <AccessDenied />)}
                            {activeTab === 'suggestions' && (canSee('view_suggestions') ? <SuggestionBox /> : <AccessDenied />)}
                            {activeTab === 'reservations' && (canSee('manage_reservations') ? <Reservations /> : <AccessDenied />)}
                            {activeTab === 'documents' && (canSee('manage_documents') ? <DocumentHub /> : <AccessDenied />)}
                            {activeTab === 'assemblies' && (canSee('manage_assemblies') ? <AssemblyManager /> : <AccessDenied />)}
                            {activeTab === 'timeline' && (canSee('view_timeline') ? <Timeline /> : <AccessDenied />)}
                            {activeTab === 'demographics' && (canSee('view_demographics') ? <DemographicAnalysis systemInfo={systemInfo} /> : <AccessDenied />)}
                            {activeTab === 'digital_watch' && (canSee('manage_operations') ? <DigitalWatch /> : <AccessDenied />)}
                            {activeTab === 'sustainability' && (canSee('manage_sustainability') ? <Sustainability /> : <AccessDenied />)}
                        </Suspense>
                    </div>
                </main>
            </div>

            {sidebarOpen && (
                <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[55] lg:hidden animate-fade-in"></div>
            )}
        </div>
    );
};

export default App;

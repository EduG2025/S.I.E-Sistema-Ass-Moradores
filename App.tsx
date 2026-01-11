import React, { useState, Suspense, lazy, useEffect } from 'react';
import { MENU_ITEMS, DEFAULT_SYSTEM_INFO, DEFAULT_ID_CARD_TEMPLATE } from './constants';
import { SystemInfo, User, IdCardTemplate } from './types';
import {
    LogOut, Menu, Loader2, Settings as SettingsIcon, Shield,
    Bell, Zap, Search, Sparkles, X, Key, ChevronLeft, ChevronRight
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
            setCurrentUser(userRes.data);
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
            {/* SIDEBAR REPROJETADA */}
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
                        if (currentUser && !item.roles.includes(currentUser.role as any)) return null;
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

            {/* ÁREA DE CONTEÚDO PRINCIPAL */}
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
                        <button onClick={() => { setActiveTab('settings'); setSettingsTab('API'); }} className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 shadow-lg">
                            <Key size={14}/> AI GATEWAY
                        </button>
                        <button onClick={() => setActiveTab('settings')} className="p-3 bg-slate-100 rounded-xl text-slate-600 hover:bg-indigo-600 hover:text-white transition-all">
                            <SettingsIcon size={20} />
                        </button>
                    </div>
                </header>

                <main className="flex-1 flex flex-col min-h-0 bg-[#fcfcfd] overflow-hidden relative">
                    <div className="flex-1 flex flex-col min-h-0 w-full overflow-y-auto custom-scrollbar p-4 lg:p-8">
                        <Suspense fallback={
                            <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40}/></div>
                        }>
                            {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
                            {activeTab === 'users' && <UserManagement />}
                            {activeTab === 'finance' && <Finance />}
                            {activeTab === 'settings' && <Settings systemInfo={systemInfo} onUpdateSystemInfo={setSystemInfo} templates={templates} onUpdateTemplates={setTemplates} initialTab={settingsTab} />}
                            {activeTab === 'surveys' && <Surveys />}
                            {activeTab === 'operations' && <Operations />}
                            {activeTab === 'projects' && <ProjectManagement />}
                            {activeTab === 'marketplace' && <MarketPlace />}
                            {activeTab === 'assets' && <Assets />}
                            {activeTab === 'neural_chat' && <ChatAssistant />}
                            {activeTab === 'suggestions' && <SuggestionBox />}
                            {activeTab === 'reservations' && <Reservations />}
                            {activeTab === 'documents' && <DocumentHub />}
                            {activeTab === 'assemblies' && <AssemblyManager />}
                            {activeTab === 'timeline' && <Timeline />}
                            {activeTab === 'demographics' && <DemographicAnalysis systemInfo={systemInfo} />}
                            {activeTab === 'digital_watch' && <DigitalWatch />}
                            {activeTab === 'sustainability' && <Sustainability />}
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

import React, { useState, Suspense, lazy, useEffect } from 'react';
import { MENU_ITEMS, DEFAULT_SYSTEM_INFO, DEFAULT_ID_CARD_TEMPLATE } from './constants';
import { SystemInfo, User, IdCardTemplate } from './types';
import {
    LogOut, Menu, Loader2, Settings as SettingsIcon, Shield,
    Search, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { systemService, authService, templateService } from './services/api';

const Dashboard = lazy(() => import('./components/Dashboard')) as any;
const Settings = lazy(() => import('./components/Settings')) as any;
const UserManagement = lazy(() => import('./components/UserManagement')) as any;
const Operations = lazy(() => import('./components/Operations')) as any;
const DemographicAnalysis = lazy(() => import('./components/DemographicAnalysis')) as any;
const ProjectManagement = lazy(() => import('./components/ProjectManagement')) as any;
const LoginScreen = lazy(() => import('./components/LoginScreen')) as any;
const DigitalWatch = lazy(() => import('./components/DigitalWatch')) as any;
const DocumentHub = lazy(() => import('./components/DocumentHub')) as any;
const AssemblyManager = lazy(() => import('./components/AssemblyManager')) as any;
const ChatAssistant = lazy(() => import('./components/ChatAssistant')) as any;
const Finance = lazy(() => import('./components/Finance')) as any;
const PublicSenso = lazy(() => import('./components/PublicSenso')) as any;

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [systemInfo, setSystemInfo] = useState<SystemInfo>(DEFAULT_SYSTEM_INFO);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [templates, setTemplates] = useState<IdCardTemplate[]>([DEFAULT_ID_CARD_TEMPLATE]);

    const isPublicCensus = window.location.pathname.startsWith('/census/');

    useEffect(() => {
        const initKernel = async () => {
            const token = localStorage.getItem('sie_auth_token');
            
            if (isPublicCensus) {
                try {
                    const infoRes = await systemService.getInfo();
                    setSystemInfo(infoRes.data || DEFAULT_SYSTEM_INFO);
                } finally { setIsLoading(false); }
                return;
            }

            if (!token) { setIsLoading(false); return; }

            try {
                const userRes = await authService.me();
                setCurrentUser(userRes.data);
                setIsAuthenticated(true);

                const [infoRes, templatesRes] = await Promise.all([
                    systemService.getInfo(),
                    templateService.getAll()
                ]);

                setSystemInfo(infoRes.data || DEFAULT_SYSTEM_INFO);
                if (templatesRes.data.data) setTemplates(templatesRes.data.data);
            } catch (error) {
                localStorage.removeItem('sie_auth_token');
                setIsAuthenticated(false);
            } finally { setIsLoading(false); }
        };
        initKernel();
    }, [isPublicCensus]);

    const canSee = (permissionId: string) => {
        if (!currentUser) return false;
        if (currentUser.role === 'ADMIN') return true;
        return currentUser.permissions?.includes(permissionId);
    };

    if (isLoading) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617]">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">SRE Kernel Booting...</p>
        </div>
    );

    if (isPublicCensus) return <Suspense fallback={null}><PublicSenso /></Suspense>;

    if (!isAuthenticated) return (
        <Suspense fallback={null}>
            <LoginScreen 
                onLoginSuccess={(u, t) => { localStorage.setItem('sie_auth_token', t); window.location.reload(); }} 
                systemInfo={systemInfo} 
            />
        </Suspense>
    );

    return (
        <div className="h-screen w-screen overflow-hidden flex bg-[#f8fafc] font-sans">
            <aside className={`fixed lg:static inset-y-0 left-0 z-[60] bg-slate-950 border-r border-white/5 flex flex-col shrink-0 transition-all duration-500 ${sidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80 lg:translate-x-0'} ${sidebarCollapsed ? 'lg:w-24' : 'lg:w-80'}`}>
                <div className={`p-8 flex items-center justify-between ${sidebarCollapsed ? 'flex-col gap-4' : ''}`}>
                    <div className="flex items-center gap-4 min-w-0">
                        <div className={`bg-white/10 rounded-2xl flex items-center justify-center shadow-2xl shrink-0 overflow-hidden ${sidebarCollapsed ? 'w-10 h-10' : 'w-12 h-12'}`}>
                            {systemInfo.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain p-1" /> : <Shield size={sidebarCollapsed ? 18 : 24} className="text-white" />}
                        </div>
                        {!sidebarCollapsed && (
                            <div className="animate-fade-in min-w-0">
                                <h1 className="font-black text-white text-base tracking-tighter uppercase truncate">{systemInfo.shortName || systemInfo.name}</h1>
                                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-1">S.I.E PRO • Gestão Ativa</p>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar">
                    {MENU_ITEMS.map((item) => {
                        if (!canSee(item.permissionId)) return null;
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }} className={`w-full flex items-center p-4 rounded-2xl transition-all group ${isActive ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white/5 hover:text-white'} ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-4'}`}>
                                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} />
                                {!sidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest truncate">{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-white/5">
                    <button onClick={() => { localStorage.removeItem('sie_auth_token'); window.location.reload(); }} className={`flex items-center gap-4 p-4 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest ${sidebarCollapsed ? 'justify-center' : 'w-full'}`}>
                        <LogOut size={18} /> {!sidebarCollapsed && <span>Encerrar</span>}
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shrink-0 z-50">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-3 bg-slate-100 rounded-xl text-slate-600"><Menu size={20} /></button>
                    <div className="hidden md:flex relative w-full max-w-lg">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold outline-none" placeholder="Consultar Kernel S.I.E..." />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 bg-[#fcfcfd]">
                    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40}/></div>}>
                        {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} systemInfo={systemInfo} />}
                        {activeTab === 'users' && <UserManagement />}
                        {activeTab === 'finance' && <Finance />}
                        {activeTab === 'settings' && <Settings systemInfo={systemInfo} onUpdateSystemInfo={setSystemInfo} templates={templates} onUpdateTemplates={setTemplates} />}
                        {activeTab === 'operations' && <Operations />}
                        {activeTab === 'projects' && <ProjectManagement />}
                        {activeTab === 'neural_chat' && <ChatAssistant />}
                        {activeTab === 'documents' && <DocumentHub systemInfo={systemInfo} />}
                        {activeTab === 'assemblies' && <AssemblyManager />}
                        {activeTab === 'demographics' && <DemographicAnalysis systemInfo={systemInfo} />}
                        {activeTab === 'digital_watch' && <DigitalWatch />}
                    </Suspense>
                </main>
            </div>
            {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[55] lg:hidden animate-fade-in"></div>}
        </div>
    );
};

export default App;


import React, { useState, Suspense, lazy, useEffect, useRef } from 'react';
import { MENU_ITEMS, DEFAULT_SYSTEM_INFO } from './constants';
import { SystemInfo, User, UserRole } from './types';
import {
    LogOut, Menu, Loader2, Shield, Bell, PanelLeftClose, PanelLeft, X, Mail, MapPin, Phone, Building2
} from 'lucide-react';
import { systemService, authService } from './services/api';

// LAZY LOADING
const Dashboard = lazy(() => import('./components/Dashboard')) as any;
const Settings = lazy(() => import('./components/Settings')) as any;
const UserManagement = lazy(() => import('./components/UserManagement')) as any;
const Operations = lazy(() => import('./components/Operations')) as any;
const DemographicAnalysis = lazy(() => import('./components/DemographicAnalysis')) as any;
const ProjectManagement = lazy(() => import('./components/ProjectManagement')) as any;
const LoginScreen = lazy(() => import('./components/LoginScreen')) as any;
const DocumentHub = lazy(() => import('./components/DocumentHub')) as any;
const AssemblyManager = lazy(() => import('./components/AssemblyManager')) as any;
const ChatAssistant = lazy(() => import('./components/ChatAssistant')) as any;
const Finance = lazy(() => import('./components/Finance')) as any;
const PublicSenso = lazy(() => import('./components/PublicSenso')) as any;
const Communication = lazy(() => import('./components/Communication')) as any;
const Timeline = lazy(() => import('./components/Timeline')) as any;
const MarketPlace = lazy(() => import('./components/MarketPlace')) as any;
const Reservations = lazy(() => import('./components/Reservations')) as any;
const SuggestionBox = lazy(() => import('./components/SuggestionBox')) as any;
const Assets = lazy(() => import('./components/Assets')) as any;
const Surveys = lazy(() => import('./components/Surveys')) as any;
const Concierge = lazy(() => import('./components/Concierge')) as any;
const Sustainability = lazy(() => import('./components/Sustainability')) as any;

const ROLE_PERMISSIONS: Record<string, string[]> = {
    'ADMIN': ['*'],
    'PRESIDENT': ['view_dashboard', 'manage_users', 'view_finances', 'view_operations', 'manage_documents', 'manage_assemblies', 'view_projects', 'use_ai_chat', 'view_demographics', 'view_timeline', 'use_marketplace', 'use_reservations', 'send_suggestions'],
    'SINDIC': ['view_dashboard', 'view_finances', 'view_operations', 'manage_documents', 'manage_assemblies', 'view_projects', 'view_demographics', 'view_timeline', 'use_marketplace', 'use_reservations', 'send_suggestions'],
    'COUNCIL': ['view_dashboard', 'view_finances', 'view_operations', 'manage_documents', 'view_projects', 'view_demographics', 'view_timeline'],
    'CONCIERGE': ['view_dashboard', 'view_operations', 'view_timeline'],
    'RESIDENT': ['view_dashboard', 'view_timeline', 'use_marketplace', 'use_reservations', 'send_suggestions', 'view_documents', 'use_ai_chat'],
    'MERCHANT': ['view_dashboard', 'use_marketplace']
};

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [systemInfo, setSystemInfo] = useState<SystemInfo>(DEFAULT_SYSTEM_INFO);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    
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
                const infoRes = await systemService.getInfo();
                setSystemInfo(infoRes.data || DEFAULT_SYSTEM_INFO);
            } catch (error) {
                localStorage.removeItem('sie_auth_token');
                setIsAuthenticated(false);
            } finally { setIsLoading(false); }
        };
        initKernel();
    }, [isPublicCensus]);

    const handleLoginSuccess = (user: User, token: string) => {
        localStorage.setItem('sie_auth_token', token);
        setCurrentUser(user);
        setIsAuthenticated(true);
        setTimeout(() => setActiveTab('dashboard'), 100);
    };

    const hasPermission = (permissionId: string) => {
        if (!currentUser) return false;
        const perms = ROLE_PERMISSIONS[currentUser.role] || [];
        return perms.includes('*') || perms.includes(permissionId);
    };

    const filteredMenu = MENU_ITEMS.filter(item => hasPermission(item.permissionId));

    if (isLoading) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617]">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Kernel Loading...</p>
        </div>
    );

    if (isPublicCensus) return <Suspense fallback={null}><PublicSenso /></Suspense>;
    if (!isAuthenticated) return <Suspense fallback={null}><LoginScreen onLoginSuccess={handleLoginSuccess} systemInfo={systemInfo} /></Suspense>;

    return (
        <div className="h-screen w-screen flex bg-[#f8fafc] font-sans overflow-hidden">
            <aside className={`fixed lg:static inset-y-0 left-0 z-[60] bg-slate-950 border-r border-white/5 flex flex-col shrink-0 transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full lg:translate-x-0'} ${sidebarCollapsed ? 'lg:w-24' : 'lg:w-72'}`}>
                <div className={`p-6 flex items-center justify-between min-h-[100px] ${sidebarCollapsed ? 'flex-col gap-4' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shrink-0 transition-all ${sidebarCollapsed ? 'w-12 h-12' : 'w-10 h-10'} overflow-hidden`}>
                            {systemInfo.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain p-1.5" alt="Logo" /> : <Shield size={20} className="text-white" />}
                        </div>
                        {!sidebarCollapsed && (
                            <div className="min-w-0">
                                <h1 className="font-black text-white text-base tracking-tighter uppercase truncate leading-none">{systemInfo.shortName || "S.I.E PRO"}</h1>
                                <p className="text-[7px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-1 truncate opacity-70">Active Governance</p>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors">
                        {sidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                </div>
                
                <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
                    {filteredMenu.map((item) => (
                        <button 
                            key={item.id} 
                            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }} 
                            className={`w-full flex items-center p-3.5 rounded-2xl transition-all group ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-2xl' : 'text-slate-400 hover:bg-white/5'} ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-4'}`}
                            title={sidebarCollapsed ? item.label : ''}
                        >
                            <item.icon size={22} className={activeTab === item.id ? 'text-white' : 'text-slate-50 group-hover:text-indigo-400'} />
                            {!sidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-[0.1em] truncate">{item.label}</span>}
                        </button>
                    ))}
                </nav>
                
                <div className={`p-4 border-t border-white/5 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
                    <button onClick={() => { localStorage.removeItem('sie_auth_token'); window.location.reload(); }} className={`flex items-center p-4 rounded-2xl bg-rose-500/10 text-rose-500 w-full font-black text-[10px] uppercase tracking-widest transition-all hover:bg-rose-600 hover:text-white ${sidebarCollapsed ? 'w-14 h-14 justify-center p-0' : 'gap-4'}`}>
                        <LogOut size={20} /> 
                        {!sidebarCollapsed && <span>Sair do Cluster</span>}
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-[#fcfcfd]">
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-10 shrink-0 z-50">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-3 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors">
                            <Menu size={24} />
                        </button>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 lg:block hidden">
                            Protocolo: {MENU_ITEMS.find(m => m.id === activeTab)?.label}
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{currentUser?.name}</p>
                                <p className="text-[9px] font-black text-indigo-500 uppercase mt-1.5 tracking-widest">{currentUser?.role}</p>
                            </div>
                            <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm uppercase shadow-sm">
                                {currentUser?.name?.[0]}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-hidden relative flex flex-col">
                    <Suspense fallback={<div className="flex-1 flex flex-col items-center justify-center"><Loader2 className="animate-spin text-indigo-600 mb-2" size={48}/><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Módulo...</p></div>}>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-10">
                            <div className="max-w-[1700px] mx-auto min-h-full flex flex-col">
                                <div className="flex-1">
                                    {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} systemInfo={systemInfo} />}
                                    {activeTab === 'users' && <UserManagement />}
                                    {activeTab === 'concierge' && <Concierge />}
                                    {activeTab === 'finance' && <Finance />}
                                    {activeTab === 'settings' && <Settings systemInfo={systemInfo} onUpdateSystemInfo={setSystemInfo} templates={[]} onUpdateTemplates={() => {}} />}
                                    {activeTab === 'operations' && <Operations />}
                                    {activeTab === 'projects' && <ProjectManagement />}
                                    {activeTab === 'neural_chat' && <ChatAssistant />}
                                    {activeTab === 'documents' && <DocumentHub systemInfo={systemInfo} />}
                                    {activeTab === 'assemblies' && <AssemblyManager currentUser={currentUser} />}
                                    {activeTab === 'demographics' && <DemographicAnalysis systemInfo={systemInfo} />}
                                    {activeTab === 'communication' && <Communication />}
                                    {activeTab === 'timeline' && <Timeline />}
                                    {activeTab === 'marketplace' && <MarketPlace />}
                                    {activeTab === 'reservations' && <Reservations />}
                                    {activeTab === 'sustainability' && <Sustainability />}
                                    {activeTab === 'suggestions' && <SuggestionBox />}
                                    {activeTab === 'assets' && <Assets />}
                                    {activeTab === 'surveys' && <Surveys />}
                                </div>

                                {/* CORPORATE FOOTER - SRE COMPLIANCE */}
                                <footer className="mt-12 pt-8 border-t border-slate-100 pb-10">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden p-2">
                                                {systemInfo.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain" alt="Logo Footer" /> : <Building2 size={24} className="text-slate-400" />}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-tight">{systemInfo.name}</h4>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">CNPJ: {systemInfo.cnpj || '00.000.000/0001-00'}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            <div className="flex items-center gap-2"><MapPin size={14} className="text-indigo-500"/> {systemInfo.address || 'Sede Administrativa Central'}</div>
                                            <div className="flex items-center gap-2"><Mail size={14} className="text-indigo-500"/> {systemInfo.email || 'governanca@sie.pro'}</div>
                                            <div className="flex items-center gap-2"><Phone size={14} className="text-indigo-500"/> {systemInfo.phone || '(11) 4002-8922'}</div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">S.I.E PRO V100.0 • SRE CLUSTER 2025</p>
                                        </div>
                                    </div>
                                </footer>
                            </div>
                        </div>
                    </Suspense>
                </main>
            </div>
            
            {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[55] lg:hidden"></div>}
        </div>
    );
};

export default App;

import React, { useState, Suspense, lazy, useEffect } from 'react';
import { MENU_ITEMS, DEFAULT_SYSTEM_INFO } from './constants';
import { SystemInfo, User } from './types';
import {
    LogOut, Menu, Loader2, Shield, Bell, PanelLeftClose, PanelLeft, Monitor, X
} from 'lucide-react';
import { systemService, authService } from './services/api';

// LAZY LOADING
const Dashboard = lazy(() => import('./components/Dashboard')) as any;
const ResidentDashboard = lazy(() => import('./components/ResidentDashboard')) as any;
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
const Sustainability = lazy(() => import('./components/Sustainability')) as any;
const SuggestionBox = lazy(() => import('./components/SuggestionBox')) as any;
const Assets = lazy(() => import('./components/Assets')) as any;
const Surveys = lazy(() => import('./components/Surveys')) as any;
const Concierge = lazy(() => import('./components/Concierge')) as any;
const DigitalWatch = lazy(() => import('./components/DigitalWatch')) as any;

const ROLE_PERMISSIONS: Record<string, string[]> = {
    'ADMIN': ['*'],
    'PRESIDENT': ['view_dashboard', 'manage_users', 'view_finances', 'view_operations', 'manage_documents', 'manage_assemblies', 'view_projects', 'use_ai_chat', 'view_demographics', 'view_timeline', 'use_marketplace', 'use_reservations', 'send_suggestions', 'manage_settings'],
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
    const isActivation = window.location.pathname.startsWith('/activate/');

    useEffect(() => {
        const handleUnauthorized = () => {
            setIsAuthenticated(false);
            setCurrentUser(null);
        };
        window.addEventListener('sie_unauthorized', handleUnauthorized);
        return () => window.removeEventListener('sie_unauthorized', handleUnauthorized);
    }, []);

    useEffect(() => {
        const initKernel = async () => {
            const token = localStorage.getItem('sie_auth_token');
            if (isPublicCensus || isActivation) {
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
    }, [isPublicCensus, isActivation]);

    const handleLoginSuccess = (user: User, token: string) => {
        localStorage.setItem('sie_auth_token', token);
        setCurrentUser(user);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('sie_auth_token');
        setIsAuthenticated(false);
        setCurrentUser(null);
    };

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#020617]">
                <div className="text-center space-y-4">
                    <Loader2 className="animate-spin text-indigo-500 mx-auto" size={48} />
                    <p className="text-indigo-300 font-black uppercase text-[10px] tracking-widest animate-pulse">SRE KERNEL BOOTING...</p>
                </div>
            </div>
        );
    }

    if (isPublicCensus) {
        return (
            <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-[#020617]"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>}>
                <PublicSenso />
            </Suspense>
        );
    }

    if (!isAuthenticated) {
        return (
            <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-[#020617]"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>}>
                <LoginScreen onLoginSuccess={handleLoginSuccess} systemInfo={systemInfo} />
            </Suspense>
        );
    }

    const renderContent = () => {
        if (activeTab === 'dashboard') {
            if (currentUser?.role === 'RESIDENT') {
                return <ResidentDashboard onNavigate={setActiveTab} systemInfo={systemInfo} />;
            }
            return <Dashboard onNavigate={setActiveTab} systemInfo={systemInfo} />;
        }
        switch (activeTab) {
            case 'settings': return <Settings systemInfo={systemInfo} onUpdateSystemInfo={setSystemInfo} />;
            case 'users': return <UserManagement />;
            case 'operations': return <Operations />;
            case 'demographics': return <DemographicAnalysis systemInfo={systemInfo} />;
            case 'projects': return <ProjectManagement />;
            case 'documents': return <DocumentHub systemInfo={systemInfo} />;
            case 'assemblies': return <AssemblyManager currentUser={currentUser} />;
            case 'neural_chat': return <ChatAssistant />;
            case 'finance': return <Finance />;
            case 'communication': return <Communication />;
            case 'timeline': return <Timeline />;
            case 'marketplace': return <MarketPlace />;
            case 'reservations': return <Reservations />;
            case 'sustainability': return <Sustainability />;
            case 'suggestions': return <SuggestionBox />;
            case 'assets': return <Assets />;
            case 'surveys': return <Surveys />;
            case 'concierge': return <Concierge />;
            case 'watchdog': return <DigitalWatch />;
            default: return <Dashboard onNavigate={setActiveTab} systemInfo={systemInfo} />;
        }
    };

    const filteredMenu = MENU_ITEMS.map(item => {
        if (item.id === 'concierge') return { ...item, subItems: [{ id: 'watchdog', label: 'Central de Vídeo', icon: Monitor }] };
        return item;
    }).filter(item => {
        if (!currentUser) return false;
        if (currentUser.role === 'ADMIN') return true;
        const perms = ROLE_PERMISSIONS[currentUser.role] || [];
        return perms.includes('*') || perms.includes(item.permissionId);
    });

    return (
        <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-900 overflow-hidden">
            {sidebarOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setSidebarOpen(false)}></div>}
            <aside className={`fixed inset-y-0 left-0 z-[101] bg-slate-950 text-slate-400 transition-all duration-300 lg:static lg:block ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${sidebarCollapsed ? 'lg:w-24' : 'lg:w-72'}`}>
                <div className="flex flex-col h-full">
                    <div className="p-8 flex items-center justify-between shrink-0">
                        {!sidebarCollapsed && (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-600 rounded-lg text-white"><Shield size={20}/></div>
                                <span className="font-black text-xl text-white tracking-tighter uppercase">S.I.E PRO</span>
                            </div>
                        )}
                        {sidebarCollapsed && <div className="mx-auto p-2 bg-indigo-600 rounded-lg text-white"><Shield size={20}/></div>}
                        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:block text-slate-500 hover:text-white">
                            {sidebarCollapsed ? <PanelLeft size={20}/> : <PanelLeftClose size={20}/>}
                        </button>
                    </div>
                    <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-1 py-4">
                        {filteredMenu.map(item => (
                            <div key={item.id}>
                                <button onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'hover:bg-white/5 hover:text-white'}`}>
                                    <item.icon size={22} className="shrink-0" />
                                    {!sidebarCollapsed && <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>}
                                </button>
                                {item.id === 'concierge' && !sidebarCollapsed && (activeTab === 'concierge' || activeTab === 'watchdog') && (
                                    <div className="ml-10 mt-2 space-y-1 border-l border-white/10 pl-4 animate-fade-in">
                                        <button onClick={() => setActiveTab('watchdog')} className={`w-full text-left py-2 text-[10px] font-black uppercase tracking-widest ${activeTab === 'watchdog' ? 'text-indigo-400' : 'text-slate-500 hover:text-white'}`}>Central de Vídeo</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                    <div className="p-6 border-t border-white/5 space-y-4">
                        <div className={`flex items-center gap-4 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg border-2 border-white/10">
                                {currentUser?.name?.charAt(0) || 'U'}
                            </div>
                            {!sidebarCollapsed && (
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-white truncate uppercase">{currentUser?.name}</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{currentUser?.role}</p>
                                </div>
                            )}
                        </div>
                        <button onClick={handleLogout} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}>
                            <LogOut size={20} className="shrink-0" />
                            {!sidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>}
                        </button>
                    </div>
                </div>
            </aside>
            <main className="flex-1 flex flex-col min-w-0 bg-white relative">
                <header className="h-20 border-b border-slate-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500"><Menu size={24}/></button>
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest hidden md:block">
                            {MENU_ITEMS.find(i => i.id === activeTab)?.label || 'Kernel Engine'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full shadow-inner">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Master Synced</span>
                        </div>
                        <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors relative">
                            <Bell size={20}/>
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-600 rounded-full border-2 border-white shadow-sm"></span>
                        </button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar bg-[#f8fafc]">
                    <Suspense fallback={<div className="flex items-center justify-center p-20 h-full"><Loader2 className="animate-spin text-indigo-600" size={48}/></div>}>
                        {renderContent()}
                    </Suspense>
                </div>
            </main>
        </div>
    );
};

// FIX: Removed conflicting local declaration of PanelLeftClose as it is already imported from lucide-react.

export default App;
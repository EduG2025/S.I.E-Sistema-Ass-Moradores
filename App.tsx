import React, { useState, Suspense, lazy, useEffect, useMemo } from 'react';
import { MENU_ITEMS, DEFAULT_SYSTEM_INFO } from './constants';
import { SystemInfo, User } from './types';
import {
    LogOut, Menu, Loader2, Shield, Bell, PanelLeftClose, PanelLeft, Monitor, X, Zap, ChevronRight
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

    const filteredMenuByCategory = useMemo(() => {
        if (!currentUser) return {};
        const perms = ROLE_PERMISSIONS[currentUser.role] || [];
        const isAllowed = (item: any) => perms.includes('*') || perms.includes(item.permissionId);
        
        const categories: Record<string, any[]> = {};
        MENU_ITEMS.forEach(item => {
            if (isAllowed(item)) {
                const cat = item.category || 'OUTROS';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(item);
            }
        });
        return categories;
    }, [currentUser]);

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
            case 'communication': return <Communication systemInfo={systemInfo} />;
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

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-900">
            {sidebarOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setSidebarOpen(false)}></div>}
            
            <aside className={`fixed inset-y-0 left-0 z-[101] bg-slate-950 text-slate-400 transition-all duration-500 lg:static lg:block flex flex-col border-r border-white/5 h-screen ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${sidebarCollapsed ? 'lg:w-28' : 'lg:w-[320px]'}`}>
                {/* BRAND HEADER */}
                <div className="p-8 pb-4 flex-none overflow-hidden">
                    <div className="flex items-center justify-between gap-4 mb-8">
                        <div className={`flex items-center gap-4 transition-all duration-500 ${sidebarCollapsed ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}>
                             <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center p-2.5 shadow-2xl shadow-indigo-600/20 border border-white/10 shrink-0">
                                {systemInfo.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain" alt="Logo" /> : <Shield size={32} className="text-indigo-600" />}
                             </div>
                             <div className="min-w-0">
                                <h1 className="text-xl font-black text-white tracking-tightest leading-none truncate uppercase">{systemInfo.shortName}</h1>
                                <p className="text-[8px] font-black uppercase text-slate-500 mt-2 tracking-[0.4em] truncate">Kernel Alpha V2</p>
                             </div>
                        </div>
                        {sidebarCollapsed && (
                            <div className="mx-auto w-14 h-14 rounded-2xl bg-white flex items-center justify-center p-2.5 shadow-2xl border border-white/10">
                                {systemInfo.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain" alt="Logo" /> : <Shield size={28} className="text-indigo-600" />}
                            </div>
                        )}
                        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5 active:scale-95">
                            {sidebarCollapsed ? <PanelLeft size={18}/> : <PanelLeftClose size={18}/>}
                        </button>
                    </div>
                    <div className="h-px bg-gradient-to-r from-white/5 via-white/10 to-transparent w-full"></div>
                </div>

                {/* NAVIGATION AREA - SRE V5 CLEAN SCROLL */}
                <nav className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain px-6 space-y-8 py-6 min-h-0 pb-20 scrolling-touch">
                    {Object.entries(filteredMenuByCategory).map(([category, items]) => (
                        <div key={category} className="space-y-3">
                            {!sidebarCollapsed && (
                                <h5 className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] leading-none animate-fade-in">{category}</h5>
                            )}
                            <div className="space-y-1">
                                {items.map(item => {
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button 
                                            key={item.id} 
                                            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }} 
                                            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all relative group ${isActive ? 'bg-white/10 text-white shadow-xl' : 'hover:bg-white/5 hover:text-white'}`}
                                            title={sidebarCollapsed ? item.label : ''}
                                        >
                                            {isActive && (
                                                <div className="absolute left-0 w-1.5 h-6 rounded-r-full" style={{ backgroundColor: primaryColor, boxShadow: `0 0 15px ${primaryColor}` }}></div>
                                            )}
                                            <item.icon size={22} className={`shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} style={isActive ? { color: primaryColor } : {}} />
                                            {!sidebarCollapsed && <span className={`text-[11px] font-bold uppercase tracking-widest ${isActive ? 'text-white' : 'text-slate-500'}`}>{item.label}</span>}
                                            {isActive && !sidebarCollapsed && <ChevronRight size={14} className="ml-auto text-white/20" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {/* SPACER BUFFER PARA GARANTIR VISIBILIDADE ACIMA DO FOOTER */}
                    <div className="h-20 shrink-0"></div>
                </nav>

                {/* USER FOOTER */}
                <div className="p-6 border-t border-white/5 bg-black/20 flex-none relative z-10">
                    <div className={`flex flex-col gap-4 ${sidebarCollapsed ? 'items-center' : ''}`}>
                        <div className={`flex items-center gap-4 transition-all ${sidebarCollapsed ? 'flex-col' : ''}`}>
                            <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-2xl border-2 border-white/10 relative group cursor-pointer" style={{ backgroundColor: primaryColor }}>
                                {currentUser?.name?.charAt(0) || 'U'}
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[3px] border-slate-950 shadow-inner"></div>
                            </div>
                            {!sidebarCollapsed && (
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">{currentUser?.name}</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{currentUser?.role}</p>
                                </div>
                            )}
                        </div>
                        <button onClick={handleLogout} className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all group ${sidebarCollapsed ? 'justify-center' : ''}`}>
                            <LogOut size={20} className="shrink-0 transition-transform group-hover:-translate-x-1" />
                            {!sidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Desconectar</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN VIEWPORT */}
            <main className="flex-1 flex flex-col min-w-0 bg-white relative">
                <header className="h-20 border-b border-slate-100 flex items-center justify-between px-10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95"><Menu size={20}/></button>
                        <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                             <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] hidden md:block">
                                {MENU_ITEMS.find(i => i.id === activeTab)?.label || 'Terminal Core'}
                             </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-3 px-5 py-2 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SRE Cluster Alpha Synced</span>
                        </div>
                        <button className="p-3 bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-lg rounded-xl transition-all relative">
                            <Bell size={18}/>
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-600 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-10 lg:p-14 custom-scrollbar bg-[#fcfcfd]">
                    <Suspense fallback={<div className="flex items-center justify-center p-20 h-full"><div className="text-center space-y-6"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={48}/><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Injetando Módulo SRE...</p></div></div>}>
                        {renderContent()}
                    </Suspense>
                </div>
            </main>
        </div>
    );
};

export default App;

import React, { useState, Suspense, lazy, useEffect, useMemo } from 'react';
import { MENU_ITEMS, DEFAULT_SYSTEM_INFO } from './constants';
import { SystemInfo, User } from './types';
import {
    LogOut, Menu, Loader2, Shield, Bell, PanelLeftClose, PanelLeft, X, Zap, ChevronRight, Settings as SettingsIcon, Search
} from 'lucide-react';
import { systemService, authService, api } from './services/api';

// SRE TYPE-SAFE LAZY LOADING
const Dashboard = lazy(() => import('./components/Dashboard'));
const ResidentDashboard = lazy(() => import('./components/ResidentDashboard'));
const Settings = lazy(() => import('./components/Settings'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const Operations = lazy(() => import('./components/Operations'));
const DemographicAnalysis = lazy(() => import('./components/DemographicAnalysis'));
const ProjectManagement = lazy(() => import('./components/ProjectManagement'));
const LoginScreen = lazy(() => import('./components/LoginScreen'));
const DocumentHub = lazy(() => import('./components/DocumentHub'));
const AssemblyManager = lazy(() => import('./components/AssemblyManager'));
const ChatAssistant = lazy(() => import('./components/ChatAssistant'));
const Finance = lazy(() => import('./components/Finance'));
const PublicSenso = lazy(() => import('./components/PublicSenso'));
const Communication = lazy(() => import('./components/Communication'));
const Timeline = lazy(() => import('./components/Timeline'));
const MarketPlace = lazy(() => import('./components/MarketPlace'));
const Reservations = lazy(() => import('./components/Reservations'));
const Sustainability = lazy(() => import('./components/Sustainability'));
const SuggestionBox = lazy(() => import('./components/SuggestionBox'));
const Assets = lazy(() => import('./components/Assets'));
const Surveys = lazy(() => import('./components/Surveys'));
const Concierge = lazy(() => import('./components/Concierge'));
const DigitalWatch = lazy(() => import('./components/DigitalWatch'));

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [systemInfo, setSystemInfo] = useState<SystemInfo>(DEFAULT_SYSTEM_INFO);
    const [activeTab, setActiveTab] = useState('demographics'); 
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [dynamicPermissions, setDynamicPermissions] = useState<string[]>([]);
    
    const isPublicCensus = window.location.pathname.startsWith('/census/');

    useEffect(() => {
        if (systemInfo?.name) {
            document.title = `${systemInfo.shortName} | ${systemInfo.name}`;
        }
    }, [systemInfo]);

    useEffect(() => {
        const handleUnauthorized = () => {
            setIsAuthenticated(false);
            setCurrentUser(null);
            localStorage.removeItem('sie_auth_token');
        };
        window.addEventListener('sie_unauthorized', handleUnauthorized);
        return () => window.removeEventListener('sie_unauthorized', handleUnauthorized);
    }, []);

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
                const [userRes, infoRes, permsRes] = await Promise.all([
                    authService.me(),
                    systemService.getInfo(),
                    api.get('/settings/permissions/my')
                ]);
                setCurrentUser(userRes.data);
                setSystemInfo(infoRes.data || DEFAULT_SYSTEM_INFO);
                setDynamicPermissions(permsRes.data.data || []);
                setIsAuthenticated(true);
            } catch (error) {
                localStorage.removeItem('sie_auth_token');
                setIsAuthenticated(false);
            } finally { setIsLoading(false); }
        };
        initKernel();
    }, [isPublicCensus]);

    const handleLoginSuccess = async (user: User, token: string) => {
        localStorage.setItem('sie_auth_token', token);
        const permsRes = await api.get('/settings/permissions/my');
        setDynamicPermissions(permsRes.data.data || []);
        setCurrentUser(user);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('sie_auth_token');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setDynamicPermissions([]);
        setActiveTab('dashboard');
    };

    const filteredMenuByCategory = useMemo(() => {
        if (!currentUser) return {};
        const isAllowed = (item: any) => 
            currentUser.role === 'ADMIN' || 
            dynamicPermissions.includes('*') || 
            dynamicPermissions.includes(item.permissionId);
        
        const categories: Record<string, any[]> = {};
        MENU_ITEMS.forEach(item => {
            if (isAllowed(item)) {
                const cat = item.category || 'OUTROS';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(item);
            }
        });
        return categories;
    }, [currentUser, dynamicPermissions]);

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#020617]">
                <div className="text-center space-y-4">
                    <Loader2 className="animate-spin text-indigo-500 mx-auto" size={48} />
                    <p className="text-indigo-300 font-black uppercase text-[10px] tracking-widest animate-pulse">BOOTING KERNEL...</p>
                </div>
            </div>
        );
    }

    if (isPublicCensus) return <PublicSenso />;
    if (!isAuthenticated) return <LoginScreen onLoginSuccess={handleLoginSuccess} systemInfo={systemInfo} />;

    const renderContent = () => {
        if (activeTab === 'dashboard') {
            return currentUser?.role === 'RESIDENT' 
                ? <ResidentDashboard onNavigate={setActiveTab} systemInfo={systemInfo} />
                : <Dashboard onNavigate={setActiveTab} systemInfo={systemInfo} />;
        }
        switch (activeTab) {
            case 'settings': return <Settings systemInfo={systemInfo} onUpdateSystemInfo={setSystemInfo} />;
            case 'users': return <UserManagement systemInfo={systemInfo} />;
            case 'operations': return <Operations systemInfo={systemInfo} />;
            case 'demographics': return <DemographicAnalysis systemInfo={systemInfo} />;
            case 'projects': return <ProjectManagement systemInfo={systemInfo} />;
            case 'documents': return <DocumentHub systemInfo={systemInfo} currentUser={currentUser} />;
            case 'assemblies': return <AssemblyManager currentUser={currentUser} systemInfo={systemInfo} />;
            case 'neural_chat': return <ChatAssistant systemInfo={systemInfo} />;
            case 'finance': return <Finance systemInfo={systemInfo} />;
            case 'communication': return <Communication systemInfo={systemInfo} />;
            case 'timeline': return <Timeline systemInfo={systemInfo} />;
            case 'marketplace': return <MarketPlace systemInfo={systemInfo} />;
            case 'reservations': return <Reservations systemInfo={systemInfo} />;
            case 'sustainability': return <Sustainability systemInfo={systemInfo} />;
            case 'suggestions': return <SuggestionBox systemInfo={systemInfo} />;
            case 'assets': return <Assets systemInfo={systemInfo} />;
            case 'surveys': return <Surveys systemInfo={systemInfo} />;
            case 'concierge': return <Concierge systemInfo={systemInfo} />;
            case 'watchdog': return <DigitalWatch systemInfo={systemInfo} />;
            default: return <DemographicAnalysis systemInfo={systemInfo} />;
        }
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    // SRE: Determina se o padding lateral deve ser removido para modos full-screen
    const isFullScreenTab = ['demographics', 'surveys'].includes(activeTab);

    return (
        <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden">
            <aside 
                className={`fixed inset-y-0 left-0 z-[500] sidebar-glass text-slate-400 flex flex-col transition-all duration-500 lg:static h-screen 
                ${sidebarOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'} 
                ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-[320px]'}`}
            >
                <div className="p-8 flex-none">
                    <div className="flex items-center justify-between gap-4">
                        {!sidebarCollapsed && (
                             <div className="flex items-center gap-4 animate-fade-in min-w-0">
                                <div className="w-12 h-12 rounded-none bg-white flex items-center justify-center p-2 shadow-2xl shrink-0">
                                    {systemInfo.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain" alt="Logo" /> : <Shield size={24} className="text-indigo-600" style={{ color: primaryColor }} />}
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-base font-black text-white tracking-tight leading-none truncate uppercase">{systemInfo.shortName}</h1>
                                    <p className="text-[8px] font-black uppercase text-indigo-400 mt-1.5 tracking-[0.4em]" style={{ color: primaryColor }}>Handshake Ok</p>
                                </div>
                             </div>
                        )}
                        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex p-3 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-none border border-white/10">
                            {sidebarCollapsed ? <PanelLeft size={18}/> : <PanelLeftClose size={18}/>}
                        </button>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 py-4 space-y-10">
                    {Object.entries(filteredMenuByCategory).map(([category, items]) => (
                        <div key={category} className="space-y-2">
                            {!sidebarCollapsed && (
                                <h5 className="px-5 mb-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] leading-none">
                                    {category}
                                </h5>
                            )}
                            <div className="space-y-1">
                                {items.map(item => {
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button 
                                            key={item.id} 
                                            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }} 
                                            className={`w-full flex items-center gap-5 px-5 py-4 rounded-none transition-all relative group nav-item-hover ${isActive ? 'nav-item-active' : ''}`}
                                            style={isActive ? { 
                                              backgroundColor: `${primaryColor}20`, 
                                              borderLeft: `5px solid ${primaryColor}`,
                                              color: 'white'
                                            } : {}}
                                        >
                                            <item.icon 
                                                size={20} 
                                                className={`shrink-0 transition-transform ${isActive ? '' : 'text-slate-500 group-hover:text-slate-200'}`} 
                                                style={isActive ? { color: primaryColor } : {}} 
                                            />
                                            {!sidebarCollapsed && (
                                                <span className={`text-[11px] font-black uppercase tracking-widest truncate ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-200'}`}>
                                                    {item.label}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-6 flex-none border-t border-white/5 bg-black/40">
                    <div className={`flex flex-col gap-5 ${sidebarCollapsed ? 'items-center' : ''}`}>
                        <div className={`flex items-center gap-4 ${sidebarCollapsed ? 'flex-col' : ''}`}>
                            <div className="w-10 h-10 rounded-none bg-indigo-600 flex items-center justify-center text-white font-black text-[12px] shrink-0 shadow-2xl border border-white/10" style={{ backgroundColor: primaryColor }}>
                                {currentUser?.name?.charAt(0) || 'U'}
                            </div>
                            {!sidebarCollapsed && (
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black text-white truncate uppercase">{currentUser?.name}</p>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{currentUser?.role}</p>
                                </div>
                            )}
                        </div>
                        <button onClick={handleLogout} className={`flex items-center gap-4 px-4 py-3 rounded-none text-rose-500 hover:bg-rose-500/10 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}>
                            <LogOut size={18} className="shrink-0" />
                            {!sidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>}
                        </button>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 bg-white relative overflow-hidden">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden absolute top-6 left-6 z-[600] p-4 bg-slate-900 text-white rounded-none shadow-2xl">
                    <Menu size={24}/>
                </button>

                <div className={`flex-1 overflow-hidden h-full ${isFullScreenTab ? 'p-0' : 'p-6 md:p-10 overflow-y-auto custom-scrollbar'}`}>
                    <Suspense fallback={<div className="flex items-center justify-center p-20 h-full"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
                        {renderContent()}
                    </Suspense>
                </div>
            </main>
        </div>
    );
};

export default App;

import React, { useState, Suspense, lazy, useEffect, useMemo } from 'react';
import { MENU_ITEMS, DEFAULT_SYSTEM_INFO } from './constants';
import { SystemInfo, User } from './types';
import {
    LogOut, Menu, Loader2, Shield, PanelLeftClose, PanelLeft, X, ShieldCheck, Zap
} from 'lucide-react';
import { systemService, authService, api } from './services/api';

// --- LAZY LOADING MODULES (ESTRATÉGICO) ---
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
const Communication = lazy(() => import('./components/Communication'));
const MarketPlace = lazy(() => import('./components/MarketPlace'));
const Reservations = lazy(() => import('./components/Reservations'));
const Sustainability = lazy(() => import('./components/Sustainability'));
const SuggestionBox = lazy(() => import('./components/SuggestionBox'));
const DigitalWatch = lazy(() => import('./components/DigitalWatch'));
const PublicSenso = lazy(() => import('./components/PublicSenso'));
const Surveys = lazy(() => import('./components/Surveys'));
const InternalIDSystem = lazy(() => import('./components/InternalIDSystem'));

// --- LAZY LOADING MODULES (OPERACIONAL & BRIDGE) ---
const MessengerBridge = lazy(() => import('./components/MessengerBridge'));
const Concierge = lazy(() => import('./components/Concierge'));
const Assets = lazy(() => import('./components/Assets'));
const Timeline = lazy(() => import('./components/Timeline'));

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [systemInfo, setSystemInfo] = useState<SystemInfo>(DEFAULT_SYSTEM_INFO);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [dynamicPermissions, setDynamicPermissions] = useState<string[]>([]);

    const isPublicCensus = window.location.pathname.startsWith('/census/');

    // SRE Metadata Audit - Títulos dinâmicos no Header do Sidebar
    const appMetadata = useMemo(() => systemInfo?.module_metadata?.['sidebar'] || {
        handshake_label: "Handshake Active",
        logout_label: "Sair",
        boot_text: "BOOTING S.I.E PRO KERNEL...",
        sync_text: "Syncing Kernel..."
    }, [systemInfo]);

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
        const [infoRes, permsRes] = await Promise.all([
            systemService.getInfo(),
            api.get('/settings/permissions/my')
        ]);
        setSystemInfo(infoRes.data || DEFAULT_SYSTEM_INFO);
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
            <div className="h-screen w-screen flex items-center justify-center bg-[#020617] overflow-hidden">
                <div className="text-center space-y-4">
                    <Loader2 className="animate-spin text-indigo-500 mx-auto" size={48} />
                    <p className="text-indigo-300 font-black uppercase text-[10px] tracking-widest animate-pulse">
                        {appMetadata.boot_text || "BOOTING S.I.E PRO KERNEL..."}
                    </p>
                </div>
            </div>
        );
    }

    if (isPublicCensus) return <div key="public-view" className="w-full h-screen overflow-y-auto"><PublicSenso /></div>;

    if (!isAuthenticated) return (
        <div key="guest-view" className="w-full h-screen overflow-hidden">
            <LoginScreen onLoginSuccess={handleLoginSuccess} systemInfo={systemInfo} />
        </div>
    );

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return currentUser?.role === 'RESIDENT'
                    ? <ResidentDashboard onNavigate={setActiveTab} systemInfo={systemInfo} />
                    : <Dashboard onNavigate={setActiveTab} systemInfo={systemInfo} />;
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
            case 'marketplace': return <MarketPlace systemInfo={systemInfo} />;
            case 'reservations': return <Reservations systemInfo={systemInfo} />;
            case 'sustainability': return <Sustainability systemInfo={systemInfo} />;
            case 'suggestions': return <SuggestionBox systemInfo={systemInfo} />;
            case 'suggestions': return <SuggestionBox systemInfo={systemInfo} />;
            case 'watchdog': return <DigitalWatch systemInfo={systemInfo} />;
            case 'surveys': return <Surveys systemInfo={systemInfo} />;
            case 'id_system': return <InternalIDSystem systemInfo={systemInfo} />;

            // --- NOVOS MÓDULOS SINCRONIZADOS (SRE PROTOCOL) ---
            case 'messenger_bridge': return <MessengerBridge systemInfo={systemInfo} />;
            case 'concierge': return <Concierge systemInfo={systemInfo} />;
            case 'assets': return <Assets systemInfo={systemInfo} />;
            case 'timeline': return <Timeline systemInfo={systemInfo} />;

            default: return <Dashboard onNavigate={setActiveTab} systemInfo={systemInfo} />;
        }
    };

    return (
        <div key="authenticated-layout" className="flex h-screen w-full bg-[#f8fafc] overflow-hidden">
            {/* Sidebar Trigger (Mobile) */}
            <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-[1100] p-3 bg-slate-900 text-white rounded-xl shadow-2xl hover:bg-slate-800 transition-colors"
            >
                <Menu size={24} />
            </button>

            {/* Sidebar Overlay (Mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[1050] lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar Shell */}
            <aside className={`
                    fixed inset-y-0 left-0 z-[1100] sidebar-glass text-slate-400 flex flex-col transition-all duration-300 
                    lg:static h-full 
                    ${sidebarOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'} 
                    ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-[300px]'}
                    flex-shrink-0
                `}>
                <div className="p-6 flex-none">
                    <div className="flex items-center justify-between gap-4">
                        {!sidebarCollapsed && (
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center p-2 shadow-2xl shrink-0">
                                    {systemInfo.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain" alt="Logo" /> : <Shield size={20} className="text-indigo-600" style={{ color: primaryColor }} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-xs font-black text-white tracking-tight leading-none truncate uppercase" title={systemInfo.shortName}>{systemInfo.shortName}</h1>
                                    <p className="text-[7px] font-black uppercase text-indigo-400 mt-1 tracking-[0.4em]" style={{ color: primaryColor }}>
                                        {appMetadata.handshake_label || "Handshake Active"}
                                    </p>
                                </div>
                            </div>
                        )}
                        <button onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); else setSidebarCollapsed(!sidebarCollapsed); }} className="p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/10 shrink-0">
                            {window.innerWidth < 1024 ? <X size={20} /> : (sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />)}
                        </button>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-6">
                    {Object.entries(filteredMenuByCategory).map(([category, items]) => (
                        <div key={category} className="space-y-1">
                            {!sidebarCollapsed && <h5 className="px-4 mb-2 text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] leading-none truncate">{category}</h5>}
                            <div className="space-y-0.5">
                                {items.map(item => {
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => { setActiveTab(item.id); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                                            className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all relative group ${isActive ? 'bg-indigo-600/10 text-white border-l-4 border-indigo-600 shadow-sm' : 'hover:bg-white/5 text-slate-400'}`}
                                            style={isActive ? { borderColor: primaryColor } : {}}
                                            title={sidebarCollapsed ? item.label : ''}
                                        >
                                            <item.icon size={16} className={`shrink-0 ${isActive ? '' : 'text-slate-500 group-hover:text-slate-200'}`} style={isActive ? { color: primaryColor } : {}} />
                                            {!sidebarCollapsed && <span className={`text-[10px] font-black uppercase tracking-widest truncate ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-200'}`}>{item.label}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 flex-none border-t border-white/5 bg-black/10">
                    <div className={`flex flex-col gap-3 ${sidebarCollapsed ? 'items-center' : ''}`}>
                        <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'flex-col' : ''}`}>
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-[10px] shrink-0 shadow-2xl" style={{ backgroundColor: primaryColor }}>
                                {currentUser?.name?.charAt(0) || 'U'}
                            </div>
                            {!sidebarCollapsed && (
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black text-white truncate uppercase" title={currentUser?.name}>{currentUser?.name}</p>
                                    <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest truncate">{currentUser?.role}</p>
                                </div>
                            )}
                        </div>
                        <button onClick={handleLogout} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}>
                            <LogOut size={16} className="shrink-0" />
                            {!sidebarCollapsed && <span className="text-[9px] font-black uppercase tracking-widest truncate">
                                {appMetadata.logout_label || "Sair"}
                            </span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area - EXPANSÃO ULTRA-WIDE V11.1 APLICADA */}
            <main className="flex-1 relative overflow-hidden flex flex-col bg-[#f8fafc] h-full min-w-0 transition-all duration-300 w-full">
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 lg:px-10 py-10 w-full h-full">
                    <Suspense fallback={
                        <div className="flex-1 flex flex-col items-center justify-center p-20 h-full">
                            <Loader2 className="animate-spin text-indigo-600" size={48} style={{ color: primaryColor }} />
                            <p className="mt-4 font-black uppercase text-[10px] tracking-widest text-slate-400 animate-pulse">
                                {appMetadata.sync_text || "Syncing Kernel..."}
                            </p>
                        </div>
                    }>
                        {/* Removido max-w-[1600px] para preencher todo o espaço disponível */}
                        <div className="w-full min-h-full pb-20">
                            {renderContent()}
                        </div>
                    </Suspense>
                </div>
            </main>
        </div>
    );
};

export default App;
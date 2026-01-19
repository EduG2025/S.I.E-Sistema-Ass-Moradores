
import React, { useState, Suspense, lazy, useEffect, useMemo } from 'react';
import { MENU_ITEMS, DEFAULT_SYSTEM_INFO } from './constants';
import { SystemInfo, User } from './types';
import {
    LogOut, Menu, Loader2, Shield, Bell, PanelLeftClose, PanelLeft, X, Zap, ChevronRight, Settings as SettingsIcon
} from 'lucide-react';
import { systemService, authService, api } from './services/api';

// SRE TYPE-SAFE LAZY LOADING
const Dashboard = lazy<React.ComponentType<{ onNavigate: (tab: string) => void; systemInfo: SystemInfo }>>(() => import('./components/Dashboard'));
const ResidentDashboard = lazy<React.ComponentType<{ onNavigate: (tab: string) => void; systemInfo: SystemInfo }>>(() => import('./components/ResidentDashboard'));
const Settings = lazy<React.ComponentType<{ systemInfo: SystemInfo; onUpdateSystemInfo: (info: SystemInfo) => void }>>(() => import('./components/Settings'));
const UserManagement = lazy<React.ComponentType<{ systemInfo: SystemInfo }>>(() => import('./components/UserManagement'));
const Operations = lazy<React.ComponentType<{ systemInfo: SystemInfo }>>(() => import('./components/Operations'));
const DemographicAnalysis = lazy<React.ComponentType<{ systemInfo: SystemInfo }>>(() => import('./components/DemographicAnalysis'));
const ProjectManagement = lazy<React.ComponentType<{ systemInfo: SystemInfo }>>(() => import('./components/ProjectManagement'));
const LoginScreen = lazy<React.ComponentType<{ onLoginSuccess: (user: User, token: string) => void; systemInfo: SystemInfo }>>(() => import('./components/LoginScreen'));
const DocumentHub = lazy<React.ComponentType<{ systemInfo: SystemInfo; currentUser: User | null }>>(() => import('./components/DocumentHub'));
const AssemblyManager = lazy<React.ComponentType<{ currentUser: User | null; systemInfo: SystemInfo }>>(() => import('./components/AssemblyManager'));
const ChatAssistant = lazy<React.ComponentType<{ systemInfo: SystemInfo }>>(() => import('./components/ChatAssistant'));
const Finance = lazy<React.ComponentType<{ systemInfo: SystemInfo }>>(() => import('./components/Finance'));
const PublicSenso = lazy(() => import('./components/PublicSenso'));
const Communication = lazy<React.ComponentType<{ systemInfo: SystemInfo }>>(() => import('./components/Communication'));
const Timeline = lazy<React.ComponentType<{ systemInfo: SystemInfo }>>(() => import('./components/Timeline'));
const MarketPlace = lazy<React.ComponentType<{ systemInfo: SystemInfo }>>(() => import('./components/MarketPlace'));
const Reservations = lazy<React.ComponentType<{ systemInfo: SystemInfo }>>(() => import('./components/Reservations'));
const Sustainability = lazy<React.ComponentType<{ systemInfo: SystemInfo }>>(() => import('./components/Sustainability'));
const SuggestionBox = lazy<React.ComponentType<{ systemInfo: SystemInfo }>>(() => import('./components/SuggestionBox'));
const Assets = lazy<React.ComponentType<{ systemInfo: SystemInfo }>>(() => import('./components/Assets'));
const Surveys = lazy<React.ComponentType<{ systemInfo: SystemInfo }>>(() => import('./components/Surveys'));
const Concierge = lazy<React.ComponentType<{ systemInfo: SystemInfo }>>(() => import('./components/Concierge'));
const DigitalWatch = lazy<React.ComponentType<{ systemInfo: SystemInfo }>>(() => import('./components/DigitalWatch'));

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

    // SRE TITLE SYNC
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
                    <p className="text-indigo-300 font-black uppercase text-[10px] tracking-widest animate-pulse">BOOTING IDENTITY...</p>
                </div>
            </div>
        );
    }

    if (isPublicCensus) return <PublicSenso />;

    if (!isAuthenticated) {
        return <LoginScreen onLoginSuccess={handleLoginSuccess} systemInfo={systemInfo} />;
    }

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
            default: return <Dashboard onNavigate={setActiveTab} systemInfo={systemInfo} />;
        }
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden">
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden animate-fade-in" 
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
            
            <aside 
                className={`fixed inset-y-0 left-0 z-[101] sidebar-glass text-slate-400 flex flex-col transition-all duration-300 lg:static lg:translate-x-0 h-screen 
                ${sidebarOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'} 
                ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-[300px]'}`}
            >
                <div className="p-6 flex-none">
                    <div className="flex items-center justify-between gap-4">
                        {!sidebarCollapsed && (
                             <div className="flex items-center gap-3 animate-fade-in min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-xl shrink-0">
                                    {systemInfo.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain" alt="Logo" /> : <Shield size={24} className="text-indigo-600" style={{ color: primaryColor }} />}
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-sm font-black text-white tracking-tight leading-none truncate uppercase">{systemInfo.shortName}</h1>
                                    <p className="text-[7px] font-black uppercase text-indigo-400 mt-1 tracking-[0.4em]" style={{ color: primaryColor }}>Identidade Ativa</p>
                                </div>
                             </div>
                        )}
                        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-lg">
                            {sidebarCollapsed ? <PanelLeft size={16}/> : <PanelLeftClose size={16}/>}
                        </button>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 py-4 space-y-8">
                    {Object.entries(filteredMenuByCategory).map(([category, items]) => (
                        <div key={category} className="space-y-1">
                            {!sidebarCollapsed && (
                                <h5 className="px-4 mb-3 text-[8px] font-black text-slate-600 uppercase tracking-[0.5em] leading-none">
                                    {category}
                                </h5>
                            )}
                            <div className="space-y-0.5">
                                {items.map(item => {
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button 
                                            key={item.id} 
                                            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }} 
                                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all relative group nav-item-hover ${isActive ? 'nav-item-active' : ''}`}
                                            style={isActive ? { 
                                              backgroundColor: `${primaryColor}15`, 
                                              borderLeft: `4px solid ${primaryColor}`,
                                              color: 'white'
                                            } : {}}
                                            title={sidebarCollapsed ? item.label : ''}
                                        >
                                            <item.icon 
                                                size={18} 
                                                className={`shrink-0 transition-transform ${isActive ? '' : 'text-slate-500 group-hover:text-slate-200'}`} 
                                                style={isActive ? { color: primaryColor } : {}} 
                                            />
                                            {!sidebarCollapsed && (
                                                <span className={`text-[10px] font-bold uppercase tracking-widest truncate ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-200'}`}>
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

                <div className="p-4 flex-none border-t border-white/5 bg-black/20">
                    <div className={`flex flex-col gap-3 ${sidebarCollapsed ? 'items-center' : ''}`}>
                        <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'flex-col' : ''}`}>
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-[10px] shrink-0 shadow-xl border border-white/10" style={{ backgroundColor: primaryColor }}>
                                {currentUser?.name?.charAt(0) || 'U'}
                            </div>
                            {!sidebarCollapsed && (
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-white truncate uppercase">{currentUser?.name.split(' ')[0]}</p>
                                    <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">{currentUser?.role}</p>
                                </div>
                            )}
                        </div>
                        <button onClick={handleLogout} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}>
                            <LogOut size={16} className="shrink-0" />
                            {!sidebarCollapsed && <span className="text-[9px] font-black uppercase">Sair</span>}
                        </button>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 bg-white relative">
                <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 bg-slate-100 text-slate-600 rounded-lg">
                            <Menu size={18}/>
                        </button>
                        <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">
                           {MENU_ITEMS.find(i => i.id === activeTab)?.label || 'Console de Gestão'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 relative">
                            <Bell size={18}/>
                            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-600 rounded-full border border-white"></span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 bg-[#fcfcfd]">
                    <Suspense fallback={<div className="flex items-center justify-center p-20 h-full"><Loader2 className="animate-spin text-indigo-600" /></div>}>
                        {renderContent()}
                    </Suspense>
                </div>
            </main>
        </div>
    );
};

export default App;

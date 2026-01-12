
import React, { useState, Suspense, lazy, useEffect, useRef } from 'react';
import { MENU_ITEMS, DEFAULT_SYSTEM_INFO, DEFAULT_ID_CARD_TEMPLATE } from './constants';
import { SystemInfo, User, IdCardTemplate } from './types';
import {
    LogOut, Menu, Loader2, Shield, Search, X, Bell, ChevronLeft, ChevronRight, AlertTriangle, Info, CheckCircle, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { systemService, authService, templateService, notificationService } from './services/api';

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

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [systemInfo, setSystemInfo] = useState<SystemInfo>(DEFAULT_SYSTEM_INFO);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifyTray, setShowNotifyTray] = useState(false);

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

    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchNotifications = async () => {
            try {
                const res = await notificationService.getAll();
                setNotifications(res.data.data || []);
            } catch (e) { console.warn("[SRE] Notify Poll Fail"); }
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    if (isLoading) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617]">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Kernel V25.9 Loading...</p>
        </div>
    );

    if (isPublicCensus) return <Suspense fallback={null}><PublicSenso /></Suspense>;
    if (!isAuthenticated) return <Suspense fallback={null}><LoginScreen onLoginSuccess={() => window.location.reload()} systemInfo={systemInfo} /></Suspense>;

    return (
        <div className="h-screen w-screen flex bg-[#f8fafc] font-sans overflow-hidden">
            {/* Sidebar Reativa */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-[60] bg-slate-950 border-r border-white/5 flex flex-col shrink-0 transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full lg:translate-x-0'} ${sidebarCollapsed ? 'lg:w-24' : 'lg:w-72'}`}>
                <div className={`p-6 flex items-center justify-between ${sidebarCollapsed ? 'flex-col gap-4' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`bg-indigo-600 rounded-xl flex items-center justify-center shadow-2xl shrink-0 ${sidebarCollapsed ? 'w-10 h-10' : 'w-10 h-10'}`}>
                            <Shield size={20} className="text-white" />
                        </div>
                        {!sidebarCollapsed && <h1 className="font-black text-white text-sm tracking-tighter uppercase truncate leading-none">{systemInfo.shortName || "S.I.E"}</h1>}
                    </div>
                    <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex p-1.5 hover:bg-white/5 rounded-lg text-slate-500 transition-colors">
                        {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
                    </button>
                </div>
                
                <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
                    {MENU_ITEMS.map((item) => (
                        <button 
                            key={item.id} 
                            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }} 
                            className={`w-full flex items-center p-3 rounded-xl transition-all group ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'} ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-4'}`}
                            title={sidebarCollapsed ? item.label : ''}
                        >
                            <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} />
                            {!sidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest truncate">{item.label}</span>}
                        </button>
                    ))}
                </nav>
                
                <div className="p-4 border-t border-white/5">
                    <button onClick={() => { localStorage.removeItem('sie_auth_token'); window.location.reload(); }} className={`flex items-center p-3 rounded-xl bg-rose-500/10 text-rose-500 w-full font-black text-[10px] uppercase tracking-widest transition-all hover:bg-rose-500 hover:text-white ${sidebarCollapsed ? 'justify-center' : 'gap-4'}`}>
                        <LogOut size={18} /> 
                        {!sidebarCollapsed && <span>Sair</span>}
                    </button>
                </div>
            </aside>

            {/* Conteúdo Principal */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-50">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                            <Menu size={20} />
                        </button>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 lg:block hidden">
                            Protocolo: {MENU_ITEMS.find(m => m.id === activeTab)?.label}
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowNotifyTray(!showNotifyTray)} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all relative">
                            <Bell size={18}/>
                            {notifications.filter(n => !n.is_read).length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">{notifications.filter(n => !n.is_read).length}</span>}
                        </button>
                        
                        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                        
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black text-slate-800 uppercase leading-none">{currentUser?.name}</p>
                                <p className="text-[8px] font-bold text-indigo-500 uppercase mt-1">{currentUser?.role}</p>
                            </div>
                            <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs">
                                {currentUser?.name?.[0]}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 bg-[#fcfcfd]">
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32}/></div>}>
                        <div className="max-w-[1600px] mx-auto h-full flex flex-col">
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
                    </Suspense>
                </main>
            </div>
            
            {/* Overlay para Mobile Sidebar */}
            {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[55] lg:hidden"></div>}
        </div>
    );
};

export default App;

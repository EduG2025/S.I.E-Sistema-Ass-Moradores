import React, { useState, Suspense, lazy, useEffect, useMemo, useCallback } from 'react';
import { MENU_ITEMS, DEFAULT_SYSTEM_INFO, DEFAULT_ID_CARD_TEMPLATE } from './constants';
import { SystemInfo, User, IdCardTemplate } from './types';
import {
    LogOut, Menu, Loader2, Settings as SettingsIcon, Shield, Activity, 
    Bell, User as UserIcon, Zap, Search, Sparkles, X, ChevronRight, History
} from 'lucide-react';
import { systemService, authService, templateService, aiService } from './services/api';

// Lazy loading modules for performance optimization
const Dashboard = lazy(() => import('./components/Dashboard')) as any;
const Finance = lazy(() => import('./components/Finance')) as any;
const Communication = lazy(() => import('./components/Communication')) as any;
const Settings = lazy(() => import('./components/Settings')) as any;
// FIX: Cast lazy result to any to bypass construct/call signature errors
const UserManagement = lazy(() => import('./components/UserManagement')) as any;
const Surveys = lazy(() => import('./components/Surveys')) as any;
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
// FIX: Cast lazy result to any to bypass construct/call signature errors
const SuggestionBox = lazy(() => import('./components/SuggestionBox')) as any;
const Reservations = lazy(() => import('./components/Reservations')) as any;

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null as User | null);
    const [isLoading, setIsLoading] = useState(true);
    const [systemInfo, setSystemInfo] = useState(DEFAULT_SYSTEM_INFO as SystemInfo);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Neural Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<string | null>(null);

    const [templates, setTemplates] = useState<IdCardTemplate[]>([DEFAULT_ID_CARD_TEMPLATE]);

    const initKernel = async () => {
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

    useEffect(() => {
        initKernel();
    }, []);

    // FIX: Use any to bypass namespace 'React' error
    const handleGlobalSearch = async (e: any) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await aiService.globalSearch(searchQuery);
            setSearchResult(res.data.answer);
        } catch (err) {
            console.error("AI Search Failure", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('sie_auth_token');
        window.location.reload();
    };

    if (isLoading) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617]">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={48}/>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">SRE Kernel Booting...</p>
        </div>
    );

    if (!isAuthenticated) return (
        <Suspense fallback={null}>
            <LoginScreen onLoginSuccess={() => window.location.reload()} systemInfo={systemInfo}/>
        </Suspense>
    );

    return (
        <div className="h-screen w-screen overflow-hidden flex bg-[#f8fafc] font-sans">
            {/* Master Sidebar V82.5 */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-[60] w-80 bg-slate-950 border-r border-white/5 flex flex-col shrink-0 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-8 flex items-center justify-between lg:justify-start gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden ring-4 ring-indigo-600/20">
                            {systemInfo.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-cover" /> : <Shield size={24} className="text-white"/>}
                        </div>
                        <div>
                            <h1 className="font-black text-white text-xl tracking-tighter leading-none">S.I.E PRO</h1>
                            <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-1">Gestão Ativa</p>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
                        <X size={24}/>
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-6 py-4 space-y-2 custom-scrollbar">
                    {MENU_ITEMS.map((item) => {
                        // Role-based Access Control (RBAC) Filter
                        if (currentUser && !item.roles.includes(currentUser.role as any)) return null;
                        
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400 transition-colors'} />
                                    <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                                </div>
                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-8 border-t border-white/5 space-y-6">
                    <div className="flex items-center gap-4 p-2 rounded-2xl bg-white/5 border border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-white text-xs border border-white/10 shadow-lg">
                            {currentUser?.avatar_url ? <img src={currentUser.avatar_url} className="w-full h-full object-cover rounded-xl" /> : currentUser?.name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-white truncate">{currentUser?.name}</p>
                            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest truncate">{currentUser?.role}</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-50 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/5"
                    >
                        <LogOut size={18}/> Encerrar Sessão
                    </button>
                    
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Live Node Stable</span>
                        </div>
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">v82.5 SRE</span>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <header className="h-24 bg-white border-b border-slate-200 flex items-center justify-between px-8 lg:px-12 shrink-0 z-50">
                    <div className="flex items-center gap-6 flex-1">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-3 bg-slate-100 rounded-xl text-slate-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                            <Menu size={20}/>
                        </button>
                        <form onSubmit={handleGlobalSearch} className="hidden md:flex relative w-full max-w-xl">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                            <input 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                                className="w-full pl-14 pr-16 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner" 
                                placeholder="Consultar Kernel S.I.E (IA Search)..."
                            />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-slate-900 text-white rounded-xl shadow-md hover:bg-indigo-600 transition-all">
                                {isSearching ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                            </button>
                        </form>
                    </div>

                    <div className="flex items-center gap-4 lg:gap-6">
                        <button onClick={() => setActiveTab('operations')} className="p-3 bg-slate-100 rounded-xl text-slate-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                            <Bell size={20}/>
                        </button>
                        <button onClick={() => setActiveTab('settings')} className="p-3 bg-slate-100 rounded-xl text-slate-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                            <SettingsIcon size={20}/>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-[#f8fafc] custom-scrollbar relative">
                    {/* IA Search Response Overlay */}
                    {searchResult && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-8">
                             <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl border border-indigo-500/30 animate-scale-in relative">
                                <button onClick={() => setSearchResult(null)} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors">
                                    <X size={24}/>
                                </button>
                                <p className="text-indigo-400 font-black uppercase text-[10px] tracking-widest mb-4 flex items-center gap-2">
                                    <Sparkles size={14}/> SRE Advisor Insight
                                </p>
                                <p className="text-base font-medium leading-relaxed italic">"{searchResult}"</p>
                             </div>
                        </div>
                    )}
                    
                    <div className="max-w-[1500px] mx-auto">
                        <Suspense fallback={
                            <div className="p-20 text-center flex flex-col items-center">
                                <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
                                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Inicializando Módulo Operacional...</p>
                            </div>
                        }>
                            {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
                            {activeTab === 'users' && <UserManagement templates={templates} />}
                            {activeTab === 'finance' && <Finance />}
                            {activeTab === 'settings' && <Settings systemInfo={systemInfo} onUpdateSystemInfo={setSystemInfo} templates={templates} onUpdateTemplates={setTemplates} />}
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
                        </Suspense>
                    </div>
                </main>
            </div>
            
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    onClick={() => setSidebarOpen(false)} 
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[55] lg:hidden animate-fade-in"
                ></div>
            )}
        </div>
    );
};

export default App;

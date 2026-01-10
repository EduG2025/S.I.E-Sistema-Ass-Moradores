
import React, { useState, Suspense, lazy, useEffect } from 'react';
import { MENU_ITEMS, DEFAULT_SYSTEM_INFO, DEFAULT_ID_CARD_TEMPLATE } from './constants';
import { SystemInfo, User, IdCardTemplate } from './types';
import {
    LogOut, Menu, Loader2, Settings as SettingsIcon, Shield,
    Bell, Zap, Search, Sparkles, X, Key
} from 'lucide-react';
import { systemService, authService, templateService, aiService } from './services/api';

const Dashboard = lazy(() => import('./components/Dashboard')) as any;
const Finance = lazy(() => import('./components/Finance')) as any;
const Settings = lazy(() => import('./components/Settings')) as any;
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
const SuggestionBox = lazy(() => import('./components/SuggestionBox')) as any;
const Reservations = lazy(() => import('./components/Reservations')) as any;
const Sustainability = lazy(() => import('./components/Sustainability')) as any;

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [systemInfo, setSystemInfo] = useState<SystemInfo>(DEFAULT_SYSTEM_INFO);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<string | null>(null);
    const [settingsTab, setSettingsTab] = useState<'INFO' | 'ACCESS' | 'API' | 'STUDIO'>('INFO');

    const initKernel = async () => {
        const token = localStorage.getItem('sie_auth_token');
        if (!token) { setIsLoading(false); return; }
        try {
            const userRes = await authService.me();
            setCurrentUser(userRes.data);
            setIsAuthenticated(true);
            const [infoRes] = await Promise.all([systemService.getInfo()]);
            setSystemInfo(infoRes.data);
        } catch (error) {
            localStorage.removeItem('sie_auth_token');
            setIsAuthenticated(false);
        } finally { setIsLoading(false); }
    };

    useEffect(() => { initKernel(); }, []);

    const handleLoginSuccess = async (user: User, token: string) => {
        localStorage.setItem('sie_auth_token', token);
        setCurrentUser(user);
        setIsAuthenticated(true);
        window.location.reload();
    };

    const handleGlobalSearch = async (e: any) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await aiService.globalSearch(searchQuery);
            setSearchResult(res.data.answer);
        } catch (err) { console.error("AI Search Failure", err); }
        finally { setIsSearching(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem('sie_auth_token');
        setIsAuthenticated(false);
        setCurrentUser(null);
    };

    if (isLoading) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617]">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={48}/>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">SRE Kernel Booting...</p>
        </div>
    );

    if (!isAuthenticated) return (
        <Suspense fallback={null}><LoginScreen onLoginSuccess={handleLoginSuccess} systemInfo={systemInfo}/></Suspense>
    );

    return (
        <div className="h-screen w-screen overflow-hidden flex bg-[#f8fafc] font-sans">
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
                </div>
                <nav className="flex-1 overflow-y-auto px-6 py-4 space-y-2 custom-scrollbar">
                    {MENU_ITEMS.map((item) => {
                        if (currentUser && !item.roles.includes(currentUser.role as any)) return null;
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button key={item.id} onClick={() => { setActiveTab(item.id); setSettingsTab('INFO'); setSidebarOpen(false); }} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${isActive ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                                <div className="flex items-center gap-4">
                                    <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400 transition-colors'} />
                                    <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                                </div>
                            </button>
                        );
                    })}
                </nav>
                <div className="p-8 border-t border-white/5 space-y-6">
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-50 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/5"><LogOut size={18}/> Encerrar Sessão</button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <header className="h-24 bg-white border-b border-slate-200 flex items-center justify-between px-8 lg:px-12 shrink-0 z-50">
                    <div className="flex items-center gap-6 flex-1">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-3 bg-slate-100 rounded-xl text-slate-600 shadow-sm"><Menu size={20}/></button>
                        <form onSubmit={handleGlobalSearch} className="hidden md:flex relative w-full max-w-xl">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                            <input value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)} className="w-full pl-14 pr-16 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-xs font-bold outline-none" placeholder="Consultar Kernel S.I.E (IA Search)..." />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-slate-900 text-white rounded-xl shadow-md hover:bg-indigo-600 transition-all">{isSearching ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}</button>
                        </form>
                    </div>

                    <div className="flex items-center gap-4 lg:gap-6 bg-white rounded-[2rem] p-1.5 border border-slate-100 shadow-sm">
                        <button onClick={() => { setActiveTab('settings'); setSettingsTab('API'); }} className="flex items-center gap-3 px-8 py-2.5 bg-slate-900 text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">
                            <Key size={14}/> AI GATEWAY
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-[#f8fafc] custom-scrollbar relative">
                    {searchResult && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-8">
                             <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl border border-indigo-500/30 animate-scale-in relative">
                                <button onClick={() => setSearchResult(null)} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
                                <p className="text-indigo-400 font-black uppercase text-[10px] tracking-widest mb-4 flex items-center gap-2"><Sparkles size={14}/> SRE Advisor Insight</p>
                                <p className="text-base font-medium leading-relaxed italic">"{searchResult}"</p>
                             </div>
                        </div>
                    )}
                    
                    <div className="max-w-[1500px] mx-auto">
                        <Suspense fallback={<div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mb-4" size={48} /></div>}>
                            {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
                            {activeTab === 'users' && <UserManagement />}
                            {activeTab === 'finance' && <Finance />}
                            {activeTab === 'settings' && <Settings systemInfo={systemInfo} onUpdateSystemInfo={setSystemInfo} templates={[]} onUpdateTemplates={()=>{}} initialTab={settingsTab} />}
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
        </div>
    );
};

export default App;

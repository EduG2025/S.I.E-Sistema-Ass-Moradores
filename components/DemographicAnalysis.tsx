import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { 
  Users, Loader2, LayoutDashboard, Map as MapIcon, 
  ShieldAlert, Search, X, Compass, Flame, User as UserIcon, Brain, Zap, Globe,
  ShieldCheck, Activity, TrendingUp, Maximize2, ZapOff, Fingerprint, ChevronRight, BarChart3,
  BarChart as BarIcon, PieChart as PieIcon, Radio, Signal
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';
import { SystemInfo, User, Incident } from '../types';
import { demographicsService, mapService, operationsService } from '../services/api';

const SmartMap = lazy(() => import('./SmartMap'));

/**
 * S.I.E DemographicAnalysis V16.1 - OBSERVATÓRIO SOBERANO
 * SRE Operational Standard - Advanced Telemetry & Integrated Search.
 */

interface DemographicAnalysisProps {
    systemInfo: SystemInfo;
}

const DemographicAnalysis = ({ systemInfo }: DemographicAnalysisProps) => {
    const [activeTab, setActiveTab] = useState<'MAP' | 'DASHBOARD'>('MAP');
    const [stats, setStats] = useState<any>(null);
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    
    // Map & HUD State
    const [activeLayers, setActiveLayers] = useState({ residents: true, incidents: true, heatmap: false });
    const [selectedEntity, setSelectedEntity] = useState<any>(null);
    const [units, setUnits] = useState<User[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [focusCoord, setFocusCoord] = useState<{lat: number, lng: number} | null>(null);

    // Mock Data para BI
    const ageData = [
        { name: '0-12', value: 400, color: '#6366f1' },
        { name: '13-18', value: 300, color: '#8b5cf6' },
        { name: '19-35', value: 1200, color: '#4f46e5' },
        { name: '36-60', value: 800, color: '#4338ca' },
        { name: '60+', value: 200, color: '#312e81' },
    ];

    const evolutionData = [
        { month: 'Jan', score: 82 },
        { month: 'Fev', score: 85 },
        { month: 'Mar', score: 84 },
        { month: 'Abr', score: 89 },
        { month: 'Mai', score: 92 },
    ];

    // Governança de Metadados
    const metadata = useMemo(() => systemInfo?.module_metadata?.['demographics'] || {
        title: "Observatório Social",
        slogan: "Inteligência Territorial & BI Populacional",
        placeholder: "Rastrear Identidade ou Unidade...",
        heatmap_label: "Mapa de Calor",
        sync_label: "Sincronia Ativa"
    }, [systemInfo]);

    useEffect(() => {
        const loadObservatoryData = async () => {
            try {
                const [resStats, resUnits, resIncidents] = await Promise.allSettled([
                    demographicsService.getStats(),
                    mapService.getUnits(),
                    operationsService.getIncidents()
                ]);

                if (resStats.status === 'fulfilled') setStats(resStats.value.data?.data || resStats.value.data);
                if (resUnits.status === 'fulfilled') setUnits(resUnits.value.data?.data || []);
                if (resIncidents.status === 'fulfilled') setIncidents(resIncidents.value.data?.data || []);
            } catch (err) {
                console.warn("[SRE] Data stream degraded.");
            } finally {
                setIsStatsLoading(false);
            }
        };
        loadObservatoryData();
    }, []);

    const resetFocus = () => {
        setFocusCoord(null);
        setTimeout(() => {
            setFocusCoord(systemInfo?.coordinates || {lat: -22.6288, lng: -43.8975});
        }, 50);
    };

    const primaryColor = systemInfo?.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col min-h-screen animate-fade-in pb-12">
            
            {/* 1. HEADER DO OBSERVATÓRIO */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 lg:px-10 lg:py-8 rounded-t-[3.5rem] shadow-sm border-x border-t border-slate-200 shrink-0 gap-6">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl border border-white/10"><Globe size={24}/></div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tightest uppercase leading-none">{metadata.title}</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2">{metadata.slogan}</p>
                    </div>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200 shadow-inner w-full lg:w-auto">
                    <button onClick={() => setActiveTab('MAP')} className={`flex-1 lg:flex-none px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'MAP' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-indigo-600'}`} style={activeTab === 'MAP' ? { backgroundColor: primaryColor } : {}}>
                        <MapIcon size={16}/> Mapa Ativo
                    </button>
                    <button onClick={() => setActiveTab('DASHBOARD')} className={`flex-1 lg:flex-none px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'DASHBOARD' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-indigo-600'}`} style={activeTab === 'DASHBOARD' ? { backgroundColor: primaryColor } : {}}>
                        <LayoutDashboard size={16}/> Analytics BI
                    </button>
                </div>
            </div>

            {activeTab === 'MAP' ? (
                <div className="flex-1 flex flex-col bg-white border-x border-slate-200 min-h-[800px]">
                    
                    {/* 2. TOOLBAR DE CAMADAS (Busca agora é interna ao SmartMap) */}
                    <div className="bg-slate-50 p-6 lg:px-10 border-b border-slate-200 space-y-6 shrink-0 z-30 shadow-sm">
                        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white rounded-xl border border-slate-200 text-indigo-600"><Signal size={18}/></div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Controle de Camadas Geográficas</p>
                            </div>

                            <div className="flex gap-3 w-full lg:w-auto overflow-x-auto no-scrollbar">
                                <button onClick={() => setActiveLayers(p => ({...p, heatmap: !p.heatmap}))} className={`px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-3 whitespace-nowrap ${activeLayers.heatmap ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm' : 'bg-white text-slate-400 border-slate-200'}`}>
                                    <Flame size={16}/> {metadata.heatmap_label || "Heatmap"}
                                </button>
                                <button onClick={() => setActiveLayers(p => ({...p, residents: !p.residents}))} className={`px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-3 whitespace-nowrap ${activeLayers.residents ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' : 'bg-white text-slate-400 border-slate-200'}`}>
                                    <Users size={16}/> {units.length} Membros
                                </button>
                                <button onClick={() => setActiveLayers(p => ({...p, incidents: !p.incidents}))} className={`px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-3 whitespace-nowrap ${activeLayers.incidents ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm' : 'bg-white text-slate-400 border-slate-200'}`}>
                                    <ShieldAlert size={16}/> {incidents.length} Ocorrências
                                </button>
                                <button onClick={resetFocus} className="px-6 py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-3 shadow-lg active:scale-95">
                                    <Compass size={16} className="animate-spin-slow" /> Reset
                                </button>
                            </div>
                        </div>

                        {selectedEntity && (
                            <div className="animate-slide-down bg-white p-6 rounded-[2.5rem] border border-indigo-100 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden ring-4 ring-indigo-50/50">
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${selectedEntity.isIncident ? 'bg-rose-600' : 'bg-indigo-600'}`} style={!selectedEntity.isIncident ? { backgroundColor: primaryColor } : {}}>
                                        {selectedEntity.isIncident ? <ShieldAlert size={28}/> : <UserIcon size={28}/>}
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">{selectedEntity.name || selectedEntity.title}</h4>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-2">Unid. {selectedEntity.unit || 'HUB'} • ID #{selectedEntity.id}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 relative z-10">
                                    <button className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl">
                                        <Brain size={18}/> Dossiê Preditivo
                                    </button>
                                    <button onClick={() => setSelectedEntity(null)} className="p-4 bg-slate-100 text-slate-400 hover:text-rose-600 rounded-2xl transition-all"><X size={24}/></button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. VIEWPORT DO MAPA - ALTURA GARANTIDA E HUD TÁTICO */}
                    <div className="relative bg-slate-200 overflow-hidden" style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}>
                        <Suspense fallback={
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-50">
                                <div className="w-24 h-24 border-8 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-6 shadow-inner"></div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] animate-pulse">{metadata.sync_label || "Sincronizando Satélite..."}</p>
                            </div>
                        }>
                            <SmartMap 
                                systemInfo={systemInfo} 
                                activeLayers={activeLayers} 
                                onSelectEntity={setSelectedEntity}
                                focusCoord={focusCoord}
                                showSearch={true}
                            />
                        </Suspense>

                        {/* OVERLAY DE TELEMETRIA SRE */}
                        <div className="absolute bottom-10 left-10 z-20 pointer-events-none space-y-3">
                             <div className="bg-slate-900/90 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 shadow-2xl flex items-center gap-5">
                                 <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_#10b981]"></div>
                                 <div>
                                    <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] block leading-none">Mapa Operacional • Online</span>
                                    <span className="text-[8px] font-black text-indigo-300 uppercase opacity-60 mt-1 block">Audit Ledger Sync: 200 OK</span>
                                 </div>
                             </div>
                             <div className="bg-black/60 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/5 flex gap-4">
                                 <div className="flex items-center gap-2">
                                     <Signal size={12} className="text-slate-400" />
                                     <span className="text-[8px] font-black text-slate-300 uppercase">12ms Latency</span>
                                 </div>
                                 <div className="w-px h-3 bg-white/10"></div>
                                 <div className="flex items-center gap-2">
                                     <Radio size={12} className="text-emerald-400 animate-pulse" />
                                     <span className="text-[8px] font-black text-slate-300 uppercase">Sat-Link Active</span>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* 4. DASHBOARD VIEW (Analytics) */
                <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 bg-[#f8fafc] border-x border-b border-slate-200 rounded-b-[3.5rem] animate-fade-in">
                    {isStatsLoading ? (
                        <div className="py-40 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={48}/><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6">Processando Ledger...</p></div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { title: "População Ativa", value: stats?.totalPopulation || units.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                { title: "Audit Ledger", value: "SINC OK", icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { title: "Saúde Social", value: "92.4%", icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
                                { title: "Fator Crítico", value: stats?.vulnerability?.critical || incidents.filter(i => i.priority?.includes('NÍVEL 4')).length, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' }
                            ].map(m => (
                                <div key={m.title} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-indigo-300 transition-all hover:shadow-xl">
                                    <div className={`p-5 rounded-2xl ${m.bg} ${m.color} group-hover:scale-110 transition-transform`}><m.icon size={32}/></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{m.title}</p>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tightest leading-none mt-2">{m.value}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm min-h-[500px] flex flex-col space-y-10">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><BarIcon size={20} className="text-indigo-600"/> Pirâmide Etária Ativa</h4>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Distribuição demográfica do cluster</p>
                                </div>
                                <span className="px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[8px] font-black uppercase border border-indigo-100">Live BI</span>
                            </div>
                            <div className="flex-1 w-full h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ageData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: 900}} 
                                            cursor={{fill: '#f8fafc', radius: 12}}
                                        />
                                        <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                                            {ageData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm min-h-[500px] flex flex-col space-y-10">
                             <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><TrendingUp size={20} className="text-emerald-600"/> Evolução Score Territorial</h4>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Índice de estabilidade do cluster</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">SRE Target: 95%</span>
                                </div>
                            </div>
                            <div className="flex-1 w-full h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={evolutionData}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} domain={[60, 100]} />
                                        <Tooltip contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: 900}} />
                                        <Area type="monotone" dataKey="score" stroke={primaryColor} strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" dot={{r: 6, fill: 'white', stroke: primaryColor, strokeWidth: 3}} activeDot={{r: 8, strokeWidth: 0}} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed text-center italic opacity-80">
                                    "Aumento de 12% na estabilidade detectado no último ciclo via otimização neural de fluxos."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DemographicAnalysis;
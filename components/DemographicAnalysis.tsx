
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Users, DollarSign, Droplets, HeartHandshake, Loader2, LayoutDashboard, Map as MapIcon, TrendingUp, ShieldCheck, Activity } from 'lucide-react';
import { SystemInfo, UnitData } from '../types';
import SmartMap from './SmartMap';
import { demographicsService } from '../services/api';

interface DemographicAnalysisProps {
    systemInfo?: SystemInfo;
}

const DemographicAnalysis = ({ systemInfo }: DemographicAnalysisProps) => {
    const [activeTab, setActiveTab] = useState('DASHBOARD' as 'DASHBOARD' | 'MAP');
    const [stats, setStats] = useState(null as any);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(false);
            try {
                const res = await demographicsService.getStats();
                if (res.data) {
                    setStats(res.data);
                } else {
                    throw new Error("Empty Payload");
                }
            } catch (error) {
                console.error("[SRE] Falha ao carregar Observatório:", error);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    const incomeData = stats ? [
        { name: 'Baixa Renda', value: stats.incomeDistribution.low || 0 },
        { name: 'Média/Baixa', value: stats.incomeDistribution.midLow || 0 },
        { name: 'Média', value: stats.incomeDistribution.mid || 0 },
        { name: 'Alta Renda', value: stats.incomeDistribution.high || 0 },
    ] : [];

    const vulnerabilityData = stats ? [
        { name: 'Baixo Risco', value: stats.vulnerability.low || 0, color: '#10b981' },
        { name: 'Moderado', value: stats.vulnerability.moderate || 0, color: '#f59e0b' },
        { name: 'Crítico', value: stats.vulnerability.critical || 0, color: '#ef4444' }
    ] : [];

    if (isLoading) return (
        <div className="flex-1 flex flex-col items-center justify-center p-20">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/>
            <p className="text-slate-400 font-black animate-pulse text-[10px] uppercase tracking-widest">Compilando Dossiê Populacional...</p>
        </div>
    );

    if (error) return (
        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
            <div className="p-6 bg-rose-50 rounded-full mb-6 text-rose-500"><Activity size={48}/></div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Erro de Sincronização</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-xs">O Kernel não conseguiu processar as estatísticas demográficas neste momento.</p>
            <button onClick={() => window.location.reload()} className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all">Tentar Reconexão</button>
        </div>
    );
    
    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in overflow-hidden">
            <div className="flex justify-between items-center bg-white p-6 lg:p-8 rounded-[2.5rem] shadow-sm border border-slate-200 shrink-0">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Observatório Social</h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Inteligência Demográfica e Geoprocessamento V105.0</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200 shadow-inner">
                    <button 
                        onClick={() => setActiveTab('DASHBOARD')} 
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'DASHBOARD' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-600'}`}
                    >
                        <LayoutDashboard size={16}/> Analytics
                    </button>
                    <button 
                        onClick={() => setActiveTab('MAP')} 
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'MAP' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-600'}`}
                    >
                        <MapIcon size={16}/> Mapa de Calor
                    </button>
                </div>
            </div>

            {activeTab === 'DASHBOARD' ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                          { title: "População Ativa", value: stats?.totalPopulation || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                          { title: "Score Sanitário", value: "94%", icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                          { title: "Ocupação Regional", value: "88%", icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
                          { title: "Risco Crítico", value: stats?.vulnerability?.critical || 0, icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' }
                        ].map(m => (
                            <div key={m.title} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6">
                                <div className={`p-4 rounded-2xl ${m.bg} ${m.color}`}><m.icon size={28}/></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.title}</p>
                                    <h3 className="text-3xl font-black text-slate-800 mt-1 tracking-tight">{m.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-10 flex items-center gap-4">
                                <DollarSign size={20} className="text-emerald-500"/> Distribuição de Renda Familiar
                            </h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={incomeData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 'bold'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                                        <Bar dataKey="value" fill="#4f46e5" radius={[10, 10, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-10 flex items-center gap-4">
                                <HeartHandshake size={20} className="text-rose-500"/> Índices de Vulnerabilidade
                            </h3>
                            <div className="flex-1 flex items-center">
                                <div className="w-1/2 h-[250px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={vulnerabilityData} innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                                                {vulnerabilityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-3xl font-black text-slate-800">{stats?.totalPopulation ? Math.round((stats.vulnerability.critical / stats.totalPopulation) * 100) : 0}%</span>
                                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">ALTA PRIORIDADE</span>
                                    </div>
                                </div>
                                <div className="w-1/2 space-y-4 pl-10">
                                    {vulnerabilityData.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase">{item.name}</span>
                                            </div>
                                            <span className="text-sm font-black text-slate-800">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden p-2 relative">
                    <SmartMap systemInfo={systemInfo} />
                </div>
            )}
        </div>
    );
};

export default DemographicAnalysis;

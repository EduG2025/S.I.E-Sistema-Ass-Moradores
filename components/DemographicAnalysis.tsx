
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Users, DollarSign, HeartHandshake, Loader2, LayoutDashboard, Map as MapIcon, TrendingUp, ShieldCheck, Activity } from 'lucide-react';
import { SystemInfo } from '../types';
import { demographicsService } from '../services/api';

const SmartMap = lazy(() => import('./SmartMap'));

interface DemographicAnalysisProps {
    systemInfo?: SystemInfo;
}

const DemographicAnalysis = ({ systemInfo }: DemographicAnalysisProps) => {
    const [activeTab, setActiveTab] = useState('MAP' as 'DASHBOARD' | 'MAP');
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(false);
            try {
                const res = await demographicsService.getStats();
                if (res && res.data) {
                    const payload = res.data.data || res.data;
                    setStats(payload);
                } else {
                    throw new Error("Invalid Payload Structure");
                }
            } catch (error) {
                console.error("[SRE] Erro no Observatório:", error);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const safeStats = stats || {};
    const incomeDist = safeStats.incomeDistribution || { low: 0, midLow: 0, mid: 0, high: 0 };
    const vulDist = safeStats.vulnerability || { low: 0, moderate: 0, critical: 0 };
    const totalPop = safeStats.totalPopulation || 0;

    const incomeData = [
        { name: 'Baixa Renda', value: Number(incomeDist.low || 0) },
        { name: 'Média/Baixa', value: Number(incomeDist.midLow || 0) },
        { name: 'Média', value: Number(incomeDist.mid || 0) },
        { name: 'Alta Renda', value: Number(incomeDist.high || 0) },
    ];

    const vulnerabilityData = [
        { name: 'Baixo Risco', value: Number(vulDist.low || 0), color: '#10b981' },
        { name: 'Moderado', value: Number(vulDist.moderate || 0), color: '#f59e0b' },
        { name: 'Crítico', value: Number(vulDist.critical || 0), color: '#ef4444' }
    ];

    if (isLoading) return (
        <div className="flex-1 flex flex-col items-center justify-center p-20 h-full min-h-[500px]">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/>
            <p className="text-slate-400 font-black animate-pulse text-[10px] uppercase tracking-widest">Sincronizando Dossiê Territorial...</p>
        </div>
    );

    if (error) return (
        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center h-full">
            <div className="p-6 bg-rose-50 rounded-full mb-6 text-rose-500"><Activity size={48}/></div>
            <h3 className="text-xl font-black text-slate-800 uppercase">Falha de Telemetria</h3>
            <button onClick={() => window.location.reload()} className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase">Reiniciar Módulo</button>
        </div>
    );
    
    return (
        <div className="flex-1 flex flex-col min-h-0 animate-fade-in overflow-hidden h-full">
            {activeTab === 'MAP' ? (
                <div className="flex-1 relative">
                    {/* BOTÃO FLUTUANTE PARA ANALYTICS */}
                    <button 
                        onClick={() => setActiveTab('DASHBOARD')}
                        className="absolute bottom-10 left-10 z-[2000] px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-indigo-600 transition-all flex items-center gap-3 border border-white/10"
                    >
                        <LayoutDashboard size={18}/> Ver Analytics
                    </button>
                    
                    <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-indigo-600" /></div>}>
                        <SmartMap systemInfo={systemInfo} />
                    </Suspense>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-white">
                    <div className="flex justify-between items-center pb-6 border-b">
                         <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Observatório Social</h2>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">BI Territorial v2.1</p>
                        </div>
                        <button onClick={() => setActiveTab('MAP')} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-indigo-700 transition-all">
                            <MapIcon size={18}/> Retornar ao Mapa
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                          { title: "População Ativa", value: totalPop, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                          { title: "Score Sanitário", value: "94%", icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                          { title: "Ocupação Regional", value: "88%", icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
                          { title: "Risco Crítico", value: vulDist.critical || 0, icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' }
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
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
                                <HeartHandshake size={20} className="text-rose-500"/> Vulnerabilidade Social
                            </h3>
                            <div className="flex-1 flex items-center">
                                <div className="w-1/2 h-[220px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={vulnerabilityData} innerRadius={50} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                                                {vulnerabilityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-1/2 space-y-4 pl-4">
                                    {vulnerabilityData.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                                                <span className="text-[8px] font-black text-slate-500 uppercase">{item.name}</span>
                                            </div>
                                            <span className="text-xs font-black text-slate-800">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DemographicAnalysis;

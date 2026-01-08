
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Users, DollarSign, Droplets, HeartHandshake, Loader2, LayoutDashboard, Map as MapIcon, TrendingUp, ShieldCheck, Activity } from 'lucide-react';
import { SystemInfo, UnitData } from '../types';
import SmartMap from './SmartMap';
/* Fixed demographicsService import */
import { demographicsService, mapService } from '../services/api';

interface DemographicAnalysisProps {
    systemInfo?: SystemInfo;
}

// FIX: Remove React.FC to bypass namespace errors
const DemographicAnalysis = ({ systemInfo }: DemographicAnalysisProps) => {
    // FIX: Use 'as' casting to avoid generic errors on potentially untyped useState
    const [activeTab, setActiveTab] = useState('DASHBOARD' as 'DASHBOARD' | 'MAP');
    const [stats, setStats] = useState(null as any);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [statsRes] = await Promise.all([
                    demographicsService.getStats()
                ]);
                setStats(statsRes.data);
            } catch (error) {
                console.error("Failed to load demographic data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    const incomeData = [
        { name: 'Até R$ 600', value: stats?.incomeDistribution?.low || 35 },
        { name: 'R$ 601-1.2k', value: stats?.incomeDistribution?.midLow || 25 },
        { name: 'R$ 1.2k-2.5k', value: stats?.incomeDistribution?.mid || 20 },
        { name: 'Acima 2.5k', value: stats?.incomeDistribution?.high || 20 },
    ];

    const ageData = [
        { name: '0-12 (Crianças)', value: 15 },
        { name: '13-17 (Jovens)', value: 10 },
        { name: '18-59 (Adultos)', value: 60 },
        { name: '60+ (Idosos)', value: 15 }
    ];

    const vulnerabilityData = [
        { name: 'Baixo Risco', value: 65, color: '#10b981' },
        { name: 'Moderado', value: 25, color: '#f59e0b' },
        { name: 'Crítico', value: 10, color: '#ef4444' }
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/>
                <p className="text-slate-500 font-bold animate-pulse">Compilando Dados Demográficos...</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Observatório Social</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Inteligência de Dados Geográficos e Populacionais</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200 shadow-inner">
                    <button 
                        onClick={() => setActiveTab('DASHBOARD')} 
                        className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'DASHBOARD' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-600'}`}
                    >
                        <LayoutDashboard size={16}/> Painel Analítico
                    </button>
                    <button 
                        onClick={() => setActiveTab('MAP')} 
                        className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'MAP' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-600'}`}
                    >
                        <MapIcon size={16}/> Mapa de Calor
                    </button>
                </div>
            </div>

            {activeTab === 'DASHBOARD' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto pb-6">
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm"><Users size={28}/></div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">População</p>
                                <h3 className="text-3xl font-black text-slate-800">{stats?.totalPopulation || 452}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
                            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm"><ShieldCheck size={28}/></div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saneamento</p>
                                <h3 className="text-3xl font-black text-slate-800">92%</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
                            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl shadow-sm"><TrendingUp size={28}/></div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa Ocupação</p>
                                <h3 className="text-3xl font-black text-slate-800">84%</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
                            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl shadow-sm"><DollarSign size={28}/></div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Renda Média</p>
                                <h3 className="text-3xl font-black text-slate-800">R$ 1.2k</h3>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-5">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Renda Familiar e Faixas Etárias</h3>
                            <div className="flex gap-4">
                                <span className="flex items-center gap-2 text-[9px] font-black text-indigo-500 uppercase">● Economia</span>
                                <span className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase">● Pirâmide</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={incomeData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                        <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                                <p className="text-center text-[9px] font-black text-slate-400 uppercase mt-4">Distribuição de Renda</p>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={ageData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                                            {ageData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <p className="text-center text-[9px] font-black text-slate-400 uppercase mt-4">Composição Etária</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-5">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Vulnerabilidade Social</h3>
                        </div>
                        <div className="flex-1 min-h-[200px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={vulnerabilityData} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                                        {vulnerabilityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-black text-slate-800">10%</span>
                                <span className="text-[8px] font-black text-rose-500 uppercase">Em Risco</span>
                            </div>
                        </div>
                        <div className="space-y-3 mt-6">
                            {vulnerabilityData.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}}></div>
                                        <span className="text-[10px] font-bold text-slate-600">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-800">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-2 relative">
                    <SmartMap systemInfo={systemInfo} />
                </div>
            )}
        </div>
    );
};

export default DemographicAnalysis;
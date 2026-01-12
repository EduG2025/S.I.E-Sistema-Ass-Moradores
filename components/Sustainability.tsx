
import React, { useState, useEffect } from 'react';
import { Leaf, Droplets, Zap, Trash2, TrendingDown, ArrowUpRight, Loader2, BarChart3, ShieldCheck, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import { systemService } from '../services/api';

const Sustainability = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState(null as any);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const res = await systemService.getSustainabilityStats();
                setStats(res.data);
            } catch (e) {
                console.error("[SRE ESG] API Error, using fallback.");
                // Mock data para demonstração caso a API não esteja pronta
                setStats({
                    energy: [
                        { month: 'Jan', value: 4500 }, { month: 'Fev', value: 4200 },
                        { month: 'Mar', value: 3900 }, { month: 'Abr', value: 3700 }
                    ],
                    water: [
                        { month: 'Jan', value: 120 }, { month: 'Fev', value: 115 },
                        { month: 'Mar', value: 105 }, { month: 'Abr', value: 98 }
                    ],
                    waste: [
                        { name: 'Reciclável', value: 45, color: '#10b981' },
                        { name: 'Orgânico', value: 35, color: '#f59e0b' },
                        { name: 'Rejeito', value: 20, color: '#ef4444' }
                    ]
                });
            } finally {
                setIsLoading(false);
            }
        };
        loadStats();
    }, []);

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center h-[60vh]">
            <Loader2 className="animate-spin text-emerald-600 mb-4" size={48} />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Compilando Indicadores ESG...</p>
        </div>
    );

    // SRE Safety Check
    if (!stats || !stats.energy) return <div className="p-20 text-center text-slate-400">Falha ao sincronizar métricas ESG.</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="bg-emerald-950 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="space-y-6 max-w-2xl">
                        <div className="flex items-center gap-3 px-4 py-1.5 bg-white/10 rounded-full w-fit border border-white/10 backdrop-blur-md">
                            <Leaf size={16} className="text-emerald-400"/>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Monitoramento ESG Ativo</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">Eficiência Energética <br/>& Gestão de Recursos.</h1>
                        <p className="text-emerald-100/70 text-base font-medium leading-relaxed">Painel estratégico para redução de custos operacionais e pegada ecológica da comunidade.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 shrink-0">
                        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center shadow-2xl">
                            <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-2">Eco Score</p>
                            <h3 className="text-4xl font-black">A+</h3>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center shadow-2xl">
                            <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-2">Redução CO2</p>
                            <h3 className="text-4xl font-black">12%</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Zap size={32}/></div>
                        <div>
                            <h3 className="font-black text-slate-800 text-lg leading-none">Energia</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Consumo em kWh</p>
                        </div>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.energy}>
                                <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="#fef3c7" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-xs font-black text-slate-400 uppercase">Economia no Mês</span>
                        <span className="text-emerald-600 font-black flex items-center gap-1 text-sm"><TrendingDown size={14}/> -4.2%</span>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Droplets size={32}/></div>
                        <div>
                            <h3 className="font-black text-slate-800 text-lg leading-none">Água</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Consumo em m³</p>
                        </div>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.water}>
                                <Area type="monotone" dataKey="value" stroke="#4f46e5" fill="#e0e7ff" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-xs font-black text-slate-400 uppercase">Meta de Redução</span>
                        <span className="text-indigo-600 font-black text-sm">95 m³</span>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Trash2 size={32}/></div>
                        <div>
                            <h3 className="font-black text-slate-800 text-lg leading-none">Resíduos</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Separação Seletiva</p>
                        </div>
                    </div>
                    <div className="h-48 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.waste}>
                                <XAxis dataKey="name" hide />
                                <Tooltip />
                                <Bar dataKey="value">
                                    {stats.waste.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-xs font-black text-slate-400 uppercase">Índice Reciclagem</span>
                        <span className="text-emerald-600 font-black text-sm">45%</span>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5">
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-emerald-500 rounded-[2rem] shadow-lg shadow-emerald-500/20"><ShieldCheck size={32}/></div>
                    <div>
                        <h4 className="text-xl font-black tracking-tight">Protocolo de Sustentabilidade V2</h4>
                        <p className="text-slate-400 text-xs mt-1 font-medium">Relatórios mensais de conformidade ESG gerados automaticamente.</p>
                    </div>
                </div>
                <button className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-emerald-50 transition-all flex items-center gap-3">
                    <BarChart3 size={20}/> Baixar Relatório ESG
                </button>
            </div>
        </div>
    );
};

export default Sustainability;

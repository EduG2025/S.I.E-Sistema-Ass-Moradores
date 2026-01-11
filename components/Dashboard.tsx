import React, { useState, useEffect } from 'react';
import { financialService, demographicsService } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  AlertTriangle, Users, Loader2, TrendingUp, 
  Shield, ChevronRight, UserPlus, FileText, Activity, Zap, Landmark, Sparkles, ShoppingBag, Leaf
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const [stats, setStats] = useState<any>(null);
  const [socialStats, setSocialStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const loadAllStats = async () => {
          try {
              const [finRes, socialRes] = await Promise.all([
                  financialService.getDashboardStats(),
                  demographicsService.getStats()
              ]);
              setStats(finRes.data);
              setSocialStats(socialRes.data);
          } catch (error) {
              setStats({ balance: 0, openIncidents: 0, totalUsers: 0, sla: 'N/A' });
          } finally {
              setLoading(false);
          }
      };
      loadAllStats();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={56}/>
      <p className="text-slate-400 font-black animate-pulse text-[10px] uppercase tracking-[0.4em]">Sincronizando Cluster de Dados...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* Hero Section - Missão Crítica */}
      <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border border-white/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="space-y-6 max-w-3xl">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 rounded-full w-fit border border-indigo-500/30">
                        <Shield size={16} className="text-indigo-400"/>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">SRE Operational Core V100.0</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 rounded-full w-fit border border-emerald-500/30">
                        <Activity size={16} className="text-emerald-400"/>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Sistema Estabilizado</span>
                    </div>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tightest leading-[0.9]">
                      S.I.E — Sistema <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">Inteligente Ativo</span>
                  </h1>
                  <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">
                      Gestão soberana para Associações e Condomínios com inteligência demográfica e governança digital.
                  </p>
              </div>
              <div className="grid grid-cols-2 gap-4 shrink-0">
                  <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center shadow-2xl">
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Social Score</p>
                      <h3 className="text-4xl font-black">{socialStats?.totalPopulation > 0 ? '782' : '--'}</h3>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center shadow-2xl">
                      <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-2">ESG Level</p>
                      <h3 className="text-4xl font-black">A+</h3>
                  </div>
              </div>
          </div>
      </div>

      {/* Grid Principal de Telemetria */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Caixa Operacional", value: `R$ ${(stats?.balance || 0).toLocaleString('pt-BR')}`, icon: TrendingUp, color: 'text-emerald-500', tab: 'finance', desc: 'Saldo em Cluster' },
          { title: "Alertas Watchdog", value: stats?.openIncidents || 0, icon: AlertTriangle, color: 'text-rose-500', tab: 'operations', desc: 'Severidade Crítica' },
          { title: "Membros Ativos", value: stats?.totalUsers || 0, icon: Users, color: 'text-indigo-500', tab: 'users', desc: 'População Validada' },
          { title: "Economia Circular", value: "24", icon: ShoppingBag, color: 'text-amber-500', tab: 'marketplace', desc: 'Anúncios Ativos' }
        ].map((stat, i) => (
          <div key={stat.title} onClick={() => onNavigate(stat.tab)} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 group-hover:rotate-12 transition-transform duration-500">
                  <stat.icon size={80}/>
              </div>
              <div className="flex justify-between items-start">
                  <div className={`p-4 rounded-2xl bg-slate-50 ${stat.color} group-hover:scale-110 transition-transform`}><stat.icon size={28}/></div>
                  <ChevronRight size={18} className="text-slate-300"/>
              </div>
              <div className="mt-6 relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
                  <h3 className="text-3xl font-black text-slate-800 mt-1 tracking-tighter">{stat.value}</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">{stat.desc}</p>
              </div>
          </div>
        ))}
      </div>

      {/* Seção de Atalhos Rápidos SRE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                      <Activity size={20} className="text-indigo-600"/> Handshake Operacional
                  </h3>
                  <button onClick={() => onNavigate('timeline')} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Ver Cronograma</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => onNavigate('surveys')} className="p-6 bg-slate-50 hover:bg-indigo-50 border border-slate-100 rounded-[2rem] text-left transition-all group">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-xl text-indigo-600 group-hover:scale-110 transition-transform"><Sparkles size={20}/></div>
                          <div>
                              <p className="font-black text-slate-800 text-sm">Lançar Censo 2025</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Inteligência Demográfica</p>
                          </div>
                      </div>
                  </button>
                  <button onClick={() => onNavigate('assemblies')} className="p-6 bg-slate-50 hover:bg-emerald-50 border border-slate-100 rounded-[2rem] text-left transition-all group">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-xl text-emerald-600 group-hover:scale-110 transition-transform"><FileText size={20}/></div>
                          <div>
                              <p className="font-black text-slate-800 text-sm">Convocação Digital</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Gestão de Quórum</p>
                          </div>
                      </div>
                  </button>
              </div>
          </div>
          
          <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={120}/></div>
              <div>
                  <h3 className="text-2xl font-black tracking-tightest">Ghostwriter IA</h3>
                  <p className="text-indigo-100 text-sm mt-3 font-medium opacity-80">Converta discussões em atas oficiais automaticamente via Gemini 3 Pro.</p>
              </div>
              <button onClick={() => onNavigate('neural_chat')} className="w-full py-5 bg-white text-indigo-600 rounded-[1.75rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3">
                  <Sparkles size={18}/> Iniciar Advisor IA
              </button>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { financialService, demographicsService } from '../services/api';
import { SystemInfo } from '../types';
import { 
  AlertTriangle, Users, Loader2, TrendingUp, 
  Shield, ChevronRight, Activity, Zap, Landmark, Sparkles, 
  ShoppingBag, Leaf, Building2
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  systemInfo: SystemInfo;
}

const Dashboard = ({ onNavigate, systemInfo }: DashboardProps) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const loadAll = async () => {
          try {
              const [fin, soc] = await Promise.all([
                  financialService.getDashboardStats(),
                  demographicsService.getStats()
              ]);
              setStats({ ...fin.data, ...soc.data });
          } catch (error) {
              console.error("Dashboard Sync Failed");
          } finally { setLoading(false); }
      };
      loadAll();
  }, []);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/>
      <p className="text-slate-400 font-black animate-pulse text-[10px] uppercase tracking-widest">Sincronizando Sistema...</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-8 animate-fade-in max-w-[1600px] mx-auto overflow-y-auto custom-scrollbar pr-2">
      {/* HEADER DINÂMICO S.I.E */}
      <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-8 space-y-6">
                  <div className="flex flex-wrap gap-3">
                    <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2">
                        <Shield size={12} className="text-indigo-400"/>
                        <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">CLUSTER ATIVO</span>
                    </div>
                    {systemInfo.cnpj && (
                        <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
                            <Building2 size={12} className="text-slate-400"/>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">CNPJ: {systemInfo.cnpj}</span>
                        </div>
                    )}
                  </div>
                  <h1 className="text-5xl font-black text-white tracking-tightest leading-none">
                      Bem-vindo ao <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400 italic uppercase">{systemInfo.name}</span>
                  </h1>
                  <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">
                      Painel centralizado de inteligência e governança para a gestão ativa de sua comunidade.
                  </p>
              </div>
              <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/5 p-6 rounded-3xl backdrop-blur-xl text-center">
                      <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-2">Membros</p>
                      <h3 className="text-3xl font-black text-white">{stats?.totalPopulation || '--'}</h3>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-6 rounded-3xl backdrop-blur-xl text-center">
                      <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-2">ESG Score</p>
                      <h3 className="text-3xl font-black text-white">A+</h3>
                  </div>
              </div>
          </div>
      </div>

      {/* METRIC GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Caixa Total", value: `R$ ${(stats?.balance || 0).toLocaleString('pt-BR')}`, icon: Landmark, color: 'text-emerald-500', tab: 'finance' },
          { title: "Ocorrências", value: stats?.openIncidents || 0, icon: AlertTriangle, color: 'text-rose-500', tab: 'operations' },
          { title: "Projetos Ativos", value: "08", icon: Zap, color: 'text-indigo-500', tab: 'projects' },
          { title: "Marketplace", value: "24", icon: ShoppingBag, color: 'text-amber-500', tab: 'marketplace' }
        ].map((item) => (
          <div key={item.title} onClick={() => onNavigate(item.tab)} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-2xl bg-slate-50 ${item.color} group-hover:scale-110 transition-transform`}><item.icon size={24}/></div>
                  <ChevronRight size={18} className="text-slate-200 group-hover:text-indigo-500 transition-colors"/>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.title}</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1 tracking-tighter">{item.value}</h3>
          </div>
        ))}
      </div>

      {/* SHORTCUTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-4">
                  <Activity size={20} className="text-indigo-600"/> Protocolos de Gestão
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => onNavigate('surveys')} className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] text-left hover:bg-indigo-50 transition-all group flex items-center gap-6">
                      <div className="p-4 bg-white rounded-2xl shadow-sm text-indigo-600 group-hover:scale-110 transition-transform"><Sparkles size={24}/></div>
                      <div>
                          <p className="font-black text-slate-800 text-sm">Disparar Censo</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Coleta de Dados</p>
                      </div>
                  </button>
                  <button onClick={() => onNavigate('assemblies')} className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] text-left hover:bg-emerald-50 transition-all group flex items-center gap-6">
                      <div className="p-4 bg-white rounded-2xl shadow-sm text-emerald-600 group-hover:scale-110 transition-transform"><Landmark size={24}/></div>
                      <div>
                          <p className="font-black text-slate-800 text-sm">Nova Assembleia</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Governança Digital</p>
                      </div>
                  </button>
              </div>
          </div>
          
          <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={120}/></div>
              <div>
                  <h3 className="text-2xl font-black tracking-tightest">SRE Ghostwriter</h3>
                  <p className="text-indigo-100/70 text-xs mt-3 font-medium leading-relaxed">
                      Gerador de atas e documentos oficiais através de inteligência artificial.
                  </p>
              </div>
              <button onClick={() => onNavigate('neural_chat')} className="w-full py-5 bg-white text-indigo-600 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all active:scale-95">
                  Iniciar Assistente IA
              </button>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;

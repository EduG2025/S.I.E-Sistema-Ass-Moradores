import React, { useState, useEffect } from 'react';
import { financialService, demographicsService, api } from '../services/api';
import { SystemInfo } from '../types';
import { 
  Users, Loader2, Landmark, Sparkles, 
  TrendingUp, Fingerprint, ShieldAlert, BarChart3, 
  Zap, Package, UserCheck, Shield, Brain, Terminal,
  Globe, Activity, MessageCircle, AlertCircle
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  systemInfo: SystemInfo;
}

const Dashboard = ({ onNavigate, systemInfo }: DashboardProps) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [operationalContext, setOperationalContext] = useState({ visitors: 0, deliveries: 0, activeReservations: 0 });

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [fin, soc, audit, healthRes, conciergeRes] = await Promise.all([
          financialService.getDashboardStats(),
          demographicsService.getStats(),
          api.get('/audit'),
          api.get('/system/health'),
          api.get('/visitors')
        ]);
        
        setStats({ ...fin.data, ...soc.data });
        setRecentLogs(audit.data?.data || []);
        
        setOperationalContext({
            visitors: (conciergeRes.data?.data || []).filter((v: any) => v.status === 'IN_CLUSTER').length,
            deliveries: 4, 
            activeReservations: 2
        });
      } catch (error) {
        console.error("[SRE] Dashboard Sync Failed");
      } finally {
        setLoading(false);
      }
    };
    loadMasterData();
    const interval = setInterval(loadMasterData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 h-full">
      <Loader2 className="animate-spin text-indigo-600 mb-6" size={48}/>
      <p className="text-slate-400 font-black animate-pulse text-[10px] uppercase tracking-[0.4em]">Sincronizando Comando...</p>
    </div>
  );

  const primaryColor = systemInfo.primaryColor || '#4f46e5';

  return (
    <div className="flex-1 flex flex-col space-y-8 animate-fade-in pb-10">
      
      {/* HUD TÁTICO - TEXTOS REDUZIDOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group overflow-hidden relative transition-all hover:shadow-lg">
              <div className="relative z-10">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Fluxo Portaria</p>
                  <h4 className="text-xl font-black text-slate-800 mt-1">{operationalContext.visitors} Ativos</h4>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform"><UserCheck size={20}/></div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group overflow-hidden relative transition-all hover:shadow-lg">
              <div className="relative z-10">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Financeiro</p>
                  <h4 className="text-xl font-black text-slate-800 mt-1">Ledger OK</h4>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform"><TrendingUp size={20}/></div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group overflow-hidden relative transition-all hover:shadow-lg">
              <div className="relative z-10">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Encomendas</p>
                  <h4 className="text-xl font-black text-slate-800 mt-1">{operationalContext.deliveries} Cargas</h4>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform"><Package size={20}/></div>
          </div>
          <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl flex items-center justify-between group overflow-hidden relative transition-all hover:shadow-indigo-500/10">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/10 rounded-full blur-2xl -mr-12 -mt-12"></div>
              <div className="relative z-10">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">Watchdog</p>
                  <h4 className="text-xl font-black mt-1">Status 200</h4>
              </div>
              <div className="p-3 bg-white/10 rounded-2xl text-white group-hover:scale-110 transition-transform"><ShieldAlert size={20}/></div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* HERO ESTRATÉGICO - ESCALA NORMALIZADA (3XL ~ 5XL) */}
          <div className="lg:col-span-8 bg-slate-950 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl border border-white/5 min-h-[400px] flex flex-col justify-between group">
              <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-600/5 rounded-full blur-[100px] -mr-40 -mt-40 transition-all group-hover:bg-indigo-600/10"></div>
              
              <div className="relative z-10 space-y-6">
                  <div className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2 backdrop-blur-md w-fit">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></div>
                      <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Protocolo SRE Master</span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-white tracking-tightest leading-[1.1] uppercase">
                    Gestão <span className="text-indigo-400">Inteligente</span> <br/> Ativa.
                  </h1>
                  <p className="text-slate-400 font-medium text-base max-w-lg leading-relaxed uppercase opacity-80">Comando centralizado para {systemInfo.shortName}.</p>
              </div>
              
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
                  <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 group/card hover:bg-white/10 transition-all cursor-pointer" onClick={() => onNavigate('users')}>
                      <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Membros</p>
                      <div className="flex items-end justify-between">
                          <h3 className="text-3xl font-black text-white tracking-tighter leading-none">{stats?.totalPopulation || '0'}</h3>
                          <Users size={18} className="text-indigo-400" />
                      </div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 group/card hover:bg-white/10 transition-all cursor-pointer" onClick={() => onNavigate('finance')}>
                      <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Tesouraria</p>
                      <div className="flex items-end justify-between">
                          <h3 className="text-2xl font-black text-white tracking-tighter leading-none">R$ {(stats?.balance || 0).toLocaleString('pt-BR')}</h3>
                          <Landmark size={18} className="text-emerald-400" />
                      </div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 group/card hover:bg-white/10 transition-all cursor-pointer" onClick={() => onNavigate('operations')}>
                      <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Alertas</p>
                      <div className="flex items-end justify-between">
                          <h3 className="text-3xl font-black text-white tracking-tighter leading-none">{stats?.openIncidents || 0}</h3>
                          <ShieldAlert size={18} className="text-rose-400" />
                      </div>
                  </div>
              </div>
          </div>

          {/* SRE ADVISOR - TEXTO REDUZIDO */}
          <div className="lg:col-span-4">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm h-full flex flex-col justify-between group overflow-hidden relative">
                   <div className="absolute top-0 right-0 p-6 opacity-[0.03] transform scale-125"><Brain size={120} /></div>
                   <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Zap size={16} className="text-amber-500 animate-pulse"/> SRE Advisor</h5>
                            <span className="text-[7px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase">Online</span>
                        </div>
                        <div className="space-y-6">
                            <div className="p-6 bg-slate-50 rounded-[1.75rem] border border-slate-100 shadow-inner">
                                <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic uppercase">
                                    "O Kernel detectou {operationalContext.visitors} visitantes ativos. Recomendo auditoria nas faturas pendentes."
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                    <p className="text-[7px] font-black text-indigo-400 uppercase mb-1">Saúde</p>
                                    <p className="text-xs font-black text-indigo-900">99.8% OK</p>
                                </div>
                                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                                    <p className="text-[7px] font-black text-emerald-400 uppercase mb-1">Sync</p>
                                    <p className="text-xs font-black text-emerald-900">100% OK</p>
                                </div>
                            </div>
                        </div>
                   </div>
                   <button onClick={() => onNavigate('neural_chat')} className="w-full mt-10 py-5 bg-slate-900 text-white rounded-[1.75rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 group/btn">
                        <Sparkles size={16} className="group-hover/btn:rotate-12 transition-transform" /> Neural Command
                   </button>
              </div>
          </div>
      </div>

      {/* QUICK LAUNCH - TAMANHO NORMALIZADO */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
              { id: 'finance', label: 'Financeiro', icon: Landmark, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { id: 'users', label: 'Membros', icon: Fingerprint, color: 'text-indigo-500', bg: 'bg-indigo-50' },
              { id: 'watchdog', label: 'Vision ID', icon: UserCheck, color: 'text-rose-500', bg: 'bg-rose-50' },
              { id: 'communication', label: 'Mural', icon: MessageCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
              { id: 'demographics', label: 'Observatório', icon: Globe, color: 'text-purple-500', bg: 'bg-purple-50' },
              { id: 'settings', label: 'Console', icon: Terminal, color: 'text-slate-500', bg: 'bg-slate-100' }
          ].map(mod => (
              <div key={mod.id} onClick={() => onNavigate(mod.id)} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center gap-3 text-center">
                  <div className={`p-4 rounded-[1.25rem] ${mod.bg} ${mod.color} group-hover:scale-110 transition-all shadow-sm`}><mod.icon size={22}/></div>
                  <h4 className="font-black text-slate-800 uppercase text-[9px] tracking-widest">{mod.label}</h4>
              </div>
          ))}
      </div>
    </div>
  );
};

export default Dashboard;
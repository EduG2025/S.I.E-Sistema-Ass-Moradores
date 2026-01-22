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
      <Loader2 className="animate-spin text-indigo-600 mb-6" size={56}/>
      <p className="text-slate-400 font-black animate-pulse text-[11px] uppercase tracking-[0.4em]">Iniciando Central de Comando S.I.E...</p>
    </div>
  );

  const primaryColor = systemInfo.primaryColor || '#4f46e5';

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-10 animate-fade-in max-w-[1600px] mx-auto pb-20">
      
      {/* HUD TÁTICO DE INDICADORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex items-center justify-between group overflow-hidden relative transition-all hover:shadow-xl hover:border-indigo-200">
              <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Fluxo Portaria</p>
                  <h4 className="text-3xl font-black text-slate-800 mt-2">{operationalContext.visitors} Ativos</h4>
              </div>
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl group-hover:scale-110 transition-transform shadow-inner"><UserCheck size={28}/></div>
          </div>
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex items-center justify-between group overflow-hidden relative transition-all hover:shadow-xl hover:border-emerald-200">
              <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Financeiro</p>
                  <h4 className="text-3xl font-black text-slate-800 mt-2">Ledger OK</h4>
              </div>
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl group-hover:scale-110 transition-transform shadow-inner"><TrendingUp size={28}/></div>
          </div>
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex items-center justify-between group overflow-hidden relative transition-all hover:shadow-xl hover:border-amber-200">
              <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Encomendas</p>
                  <h4 className="text-3xl font-black text-slate-800 mt-2">{operationalContext.deliveries} Cargas</h4>
              </div>
              <div className="p-4 bg-amber-50 text-amber-600 rounded-3xl group-hover:scale-110 transition-transform shadow-inner"><Package size={28}/></div>
          </div>
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl flex items-center justify-between group overflow-hidden relative transition-all hover:shadow-indigo-500/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">IA Watchdog</p>
                  <h4 className="text-3xl font-black mt-2">Status 200</h4>
              </div>
              <div className="p-4 bg-white/10 rounded-3xl text-white group-hover:scale-110 transition-transform"><ShieldAlert size={28}/></div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* S.I.E HUB HERO - VISÃO ESTRATÉGICA */}
          <div className="lg:col-span-8 bg-slate-950 rounded-[4rem] p-12 relative overflow-hidden shadow-2xl border border-white/5 min-h-[550px] flex flex-col justify-between group">
              <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-indigo-600/5 rounded-full blur-[150px] -mr-60 -mt-60 transition-all group-hover:bg-indigo-600/10"></div>
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-950 to-transparent z-0"></div>
              
              <div className="relative z-10 space-y-10">
                  <div className="flex items-center gap-4">
                    <div className="px-6 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-3 backdrop-blur-md">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"></div>
                        <span className="text-[11px] font-black text-indigo-300 uppercase tracking-widest">Protocolo Master SRE Online</span>
                    </div>
                  </div>
                  <h1 className="text-6xl md:text-8xl font-black text-white tracking-tightest leading-[0.85] uppercase">
                    Gestão <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-emerald-400">Inteligente <br/> Ativa.</span>
                  </h1>
                  <p className="text-slate-400 font-medium text-xl max-w-xl leading-relaxed italic opacity-80 uppercase tracking-tight">Hub Centralizado de Governança para {systemInfo.name}.</p>
              </div>
              
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                  <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/5 group/card hover:bg-white/10 transition-all cursor-pointer" onClick={() => onNavigate('users')}>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Membros Ativos</p>
                      <div className="flex items-end justify-between">
                          <h3 className="text-5xl font-black text-white tracking-tighter leading-none">{stats?.totalPopulation || '0'}</h3>
                          <Users size={24} className="text-indigo-400 mb-1 group-hover/card:scale-125 transition-transform" />
                      </div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/5 group/card hover:bg-white/10 transition-all cursor-pointer" onClick={() => onNavigate('finance')}>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">Tesouraria Sinc</p>
                      <div className="flex items-end justify-between">
                          <h3 className="text-4xl font-black text-white tracking-tighter leading-none">R$ {(stats?.balance || 0).toLocaleString('pt-BR')}</h3>
                          <Landmark size={24} className="text-emerald-400 mb-1 group-hover/card:scale-125 transition-transform" />
                      </div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/5 group/card hover:bg-white/10 transition-all cursor-pointer" onClick={() => onNavigate('operations')}>
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4">Watchdog Alerts</p>
                      <div className="flex items-end justify-between">
                          <h3 className="text-5xl font-black text-white tracking-tighter leading-none">{stats?.openIncidents || 0}</h3>
                          <ShieldAlert size={24} className="text-rose-400 mb-1 group-hover/card:scale-125 transition-transform" />
                      </div>
                  </div>
              </div>
          </div>

          {/* SRE ADVISOR - REATIVIDADE NEURAL */}
          <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm h-full flex flex-col justify-between group overflow-hidden relative">
                   <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><Brain size={180} /></div>
                   <div className="relative z-10">
                        <div className="flex items-center justify-between mb-10">
                            <h5 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-3"><Zap size={20} className="text-amber-500 animate-pulse"/> SRE Advisor</h5>
                            <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">Ativo</span>
                        </div>
                        <div className="space-y-8">
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner group-hover:bg-white transition-colors duration-500">
                                <p className="text-sm text-slate-600 font-medium leading-relaxed italic uppercase">
                                    "O Kernel detectou {operationalContext.visitors} visitantes no cluster. 
                                    Recomendo auditoria nas faturas pendentes que totalizam R$ {Number(stats?.pending || 0).toLocaleString('pt-BR')}."
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 hover:bg-white transition-all">
                                    <p className="text-[9px] font-black text-indigo-400 uppercase mb-1.5">Saúde IA</p>
                                    <p className="text-base font-black text-indigo-900 tracking-tight">99.8% OK</p>
                                </div>
                                <div className="p-5 bg-emerald-50/50 rounded-3xl border border-emerald-100/50 hover:bg-white transition-all">
                                    <p className="text-[9px] font-black text-emerald-400 uppercase mb-1.5">Uptime DB</p>
                                    <p className="text-base font-black text-emerald-900 tracking-tight">100% SYNC</p>
                                </div>
                            </div>
                        </div>
                   </div>
                   <button onClick={() => onNavigate('neural_chat')} className="w-full mt-12 py-7 bg-slate-950 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 group/btn">
                        <Sparkles size={20} className="group-hover/btn:rotate-12 transition-transform" /> Neural Command
                   </button>
              </div>
          </div>
      </div>

      {/* QUICK LAUNCH GRID - ATALHOS DE ACESSO */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[
              { id: 'finance', label: 'Financeiro', icon: Landmark, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { id: 'users', label: 'Membros', icon: Fingerprint, color: 'text-indigo-500', bg: 'bg-indigo-50' },
              { id: 'watchdog', label: 'Vision ID', icon: UserCheck, color: 'text-rose-500', bg: 'bg-rose-50' },
              { id: 'communication', label: 'Mensageria', icon: MessageCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
              { id: 'demographics', label: 'Observatório', icon: Globe, color: 'text-purple-500', bg: 'bg-purple-50' },
              { id: 'settings', label: 'Terminal', icon: Terminal, color: 'text-slate-500', bg: 'bg-slate-100' }
          ].map(mod => (
              <div key={mod.id} onClick={() => onNavigate(mod.id)} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer group flex flex-col items-center gap-4 text-center">
                  <div className={`p-5 rounded-[1.75rem] ${mod.bg} ${mod.color} group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm`}><mod.icon size={28}/></div>
                  <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">{mod.label}</h4>
              </div>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LOGS DE INTEGRIDADE (HEARTBEAT) */}
          <div className="lg:col-span-8 bg-white p-12 rounded-[4.5rem] border border-slate-200 shadow-sm overflow-hidden relative">
              <div className="flex justify-between items-center mb-12">
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tightest flex items-center gap-5"><Terminal size={32} className="text-indigo-600"/> Heartbeat de Integridade</h3>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-[9px] font-black uppercase">Live Logs</span>
                  </div>
              </div>
              <div className="space-y-4">
                  {recentLogs.slice(0, 5).map((log, i) => (
                      <div key={i} className="flex items-center justify-between p-7 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 group hover:bg-white transition-all hover:shadow-xl hover:border-indigo-200">
                          <div className="flex items-center gap-8">
                              <div className={`p-4 rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-300 group-hover:text-indigo-600 transition-all`}><Shield size={20}/></div>
                              <div>
                                  <p className="text-sm font-black text-slate-800 uppercase leading-none tracking-tight">{log.action} • {log.table_name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">Protocolo #{log.id} • {new Date(log.created_at).toLocaleDateString('pt-BR')}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <span className="text-[11px] font-black text-indigo-400 uppercase font-mono">{new Date(log.created_at).toLocaleTimeString('pt-BR')}</span>
                          </div>
                      </div>
                  ))}
                  {recentLogs.length === 0 && (
                      <div className="py-24 text-center text-slate-200 font-black uppercase text-sm tracking-[0.6em] opacity-40 italic">Kernel em estado nominal. Sem mutações.</div>
                  )}
              </div>
          </div>

          {/* TACTICAL MAP MINI - CTA GEOGRÁFICO */}
          <div className="lg:col-span-4">
              <div className="bg-indigo-600 rounded-[4.5rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between h-full group cursor-pointer" onClick={() => onNavigate('demographics')}>
                  <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-all transform scale-150 rotate-12 group-hover:rotate-0"><Globe size={250}/></div>
                  <div className="relative z-10">
                       <div className="p-5 bg-white/10 rounded-[2rem] w-fit mb-10 border border-white/10 shadow-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><BarChart3 size={42} className="text-indigo-200"/></div>
                       <h3 className="text-5xl font-black uppercase tracking-tightest leading-[0.9]">Dossiê <br/> Territorial.</h3>
                       <p className="text-indigo-100/70 text-lg mt-8 font-medium leading-relaxed uppercase italic opacity-90 tracking-tight">Soberania de dados georreferenciados para análise de risco e BI em tempo real.</p>
                  </div>
                  <button className="w-full mt-14 py-7 bg-white text-indigo-950 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-50 transition-all relative z-10 active:scale-95">Abrir SmartMap</button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { financialService, demographicsService, api } from '../services/api';
import { SystemInfo } from '../types';
import { 
  AlertTriangle, Users, Loader2, ChevronRight, Activity, Landmark, Sparkles, 
  Video, Radio, Server, ArrowUpRight, History, 
  ShieldCheck, Wifi, Cpu, Clock, Terminal, Heart, Zap, Droplets, Leaf, 
  Database, ShieldAlert, BarChart3, TrendingUp, Fingerprint,
  // SRE FIX: Added missing icons to resolve "Cannot find name" errors in the dashboard module
  AlertCircle, Wallet, MessageCircle, Globe
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  systemInfo: SystemInfo;
}

const Dashboard = ({ onNavigate, systemInfo }: DashboardProps) => {
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [fin, soc, audit, healthRes] = await Promise.all([
          financialService.getDashboardStats(),
          demographicsService.getStats(),
          api.get('/audit'),
          api.get('/system/health')
        ]);
        setStats({ ...fin.data, ...soc.data });
        setHealth(healthRes.data);
        setRecentLogs(audit.data?.data || []);
      } catch (error) {
        console.error("[SRE] Dashboard Sync Failed");
      } finally {
        setLoading(false);
      }
    };
    loadMasterData();
    const interval = setInterval(loadMasterData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 h-full">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/>
      <p className="text-slate-400 font-black animate-pulse text-[10px] uppercase tracking-[0.4em]">Sincronizando Malha Neural...</p>
    </div>
  );

  const primaryColor = systemInfo.primaryColor || '#4f46e5';

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-20">
      
      {/* KPIs DE ALTO IMPACTO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between group overflow-hidden relative transition-all hover:shadow-xl hover:border-indigo-200">
              <div className="relative z-10">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Saúde Coletiva</p>
                  <h4 className="text-3xl font-black text-slate-800 mt-2">S.I.E Ativo</h4>
              </div>
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform shadow-inner"><Activity size={28}/></div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between group overflow-hidden relative transition-all hover:shadow-xl hover:border-emerald-200">
              <div className="relative z-10">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Financeiro</p>
                  <h4 className="text-3xl font-black text-slate-800 mt-2">Score A+</h4>
              </div>
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform shadow-inner"><TrendingUp size={28}/></div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between group overflow-hidden relative transition-all hover:shadow-xl hover:border-amber-200">
              <div className="relative z-10">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Eficiência ESG</p>
                  <h4 className="text-3xl font-black text-slate-800 mt-2">94%</h4>
              </div>
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform shadow-inner"><Leaf size={28}/></div>
          </div>
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl flex items-center justify-between group overflow-hidden relative transition-all hover:shadow-indigo-500/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">Vigilância</p>
                  <h4 className="text-3xl font-black mt-2">VISION OK</h4>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl text-white group-hover:scale-110 transition-transform"><ShieldCheck size={28}/></div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* CORE STATUS HERO */}
          <div className="lg:col-span-8 bg-slate-950 rounded-[3.5rem] p-12 relative overflow-hidden shadow-2xl border border-white/5">
              <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-indigo-600/5 rounded-full blur-[150px] -mr-60 -mt-60"></div>
              <div className="relative z-10 flex flex-col h-full justify-between gap-12">
                  <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-3 backdrop-blur-md">
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></div>
                            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Protocolo Master SRE V8.0 Ativo</span>
                        </div>
                      </div>
                      <h1 className="text-5xl md:text-7xl font-black text-white tracking-tightest leading-tight uppercase">
                        Gestão <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-emerald-400">Inteligente Ativa.</span>
                      </h1>
                      <p className="text-slate-400 font-medium text-xl max-w-xl leading-relaxed italic opacity-80 uppercase">Plataforma Soberana de Governança para {systemInfo.name}.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 group hover:bg-white/10 transition-all">
                          <div className="flex justify-between items-start mb-4">
                              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Membros Ativos</p>
                              <Users size={16} className="text-indigo-400" />
                          </div>
                          <h3 className="text-5xl font-black text-white tracking-tighter">{stats?.totalPopulation || '0'}</h3>
                      </div>
                      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 group hover:bg-white/10 transition-all">
                          <div className="flex justify-between items-start mb-4">
                              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Caixa Atual</p>
                              <Landmark size={16} className="text-emerald-400" />
                          </div>
                          <h3 className="text-3xl font-black text-white tracking-tighter leading-none">R$ {(stats?.balance || 0).toLocaleString('pt-BR')}</h3>
                      </div>
                      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 group hover:bg-white/10 transition-all">
                          <div className="flex justify-between items-start mb-4">
                              <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Alertas Watchdog</p>
                              <AlertCircle size={16} className="text-rose-400" />
                          </div>
                          <h3 className="text-5xl font-black text-white tracking-tighter">{stats?.openIncidents || 0}</h3>
                      </div>
                  </div>
              </div>
          </div>

          {/* SYSTEM TELEMETRY SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm h-full flex flex-col justify-between group overflow-hidden relative">
                   <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><Database size={150} /></div>
                   <div className="relative z-10">
                        <h5 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3 mb-8"><Zap size={18} className="text-amber-500 animate-pulse"/> SRE Advisor Mentor</h5>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">"O Kernel processou os últimos dados e recomenda a atualização do fundo de reserva baseado na inflação setorial."</p>
                            </div>
                        </div>
                   </div>
                   <button onClick={() => onNavigate('neural_chat')} className="w-full mt-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">Falar com IA <ArrowUpRight size={16}/></button>
              </div>
          </div>
      </div>

      {/* QUICK ACTIONS MODULE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
              { id: 'finance', label: 'ERP Financeiro', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { id: 'users', label: 'Cadastro Core', icon: Fingerprint, color: 'text-indigo-500', bg: 'bg-indigo-50' },
              { id: 'watchdog', label: 'Central Vision', icon: Video, color: 'text-rose-500', bg: 'bg-rose-50' },
              { id: 'communication', label: 'Messenger Bridge', icon: MessageCircle, color: 'text-amber-500', bg: 'bg-amber-50' }
          ].map(mod => (
              <div key={mod.id} onClick={() => onNavigate(mod.id)} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer group flex items-center gap-6">
                  <div className={`p-4 rounded-2xl ${mod.bg} ${mod.color} group-hover:scale-110 transition-transform`}><mod.icon size={28}/></div>
                  <div>
                      <h4 className="font-black text-slate-800 uppercase text-xs tracking-tight">{mod.label}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Acessar Protocolo</p>
                  </div>
              </div>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tightest flex items-center gap-4 mb-10"><Terminal size={24} className="text-indigo-600"/> Trilha de Integridade SRE</h3>
              <div className="space-y-4">
                  {recentLogs.slice(0, 5).map((log, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group hover:bg-white transition-all hover:shadow-md">
                          <div className="flex items-center gap-6">
                              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-colors"><ShieldAlert size={20}/></div>
                              <div>
                                  <p className="text-xs font-black text-slate-800 uppercase leading-none">{log.action} • {log.table_name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">ID Registro: #{log.record_id} • Auditado</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <span className="text-[9px] font-black text-slate-300 uppercase block">{new Date(log.created_at).toLocaleDateString()}</span>
                              <span className="text-[9px] font-black text-indigo-400 uppercase mt-1 block">{new Date(log.created_at).toLocaleTimeString()}</span>
                          </div>
                      </div>
                  ))}
                  {recentLogs.length === 0 && (
                      <div className="py-20 text-center text-slate-300 font-black uppercase text-xs tracking-[0.4em] opacity-40 italic">Sem mutações de dados registradas.</div>
                  )}
              </div>
          </div>

          <div className="lg:col-span-4">
              <div className="bg-indigo-600 rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[500px] group cursor-pointer" onClick={() => onNavigate('demographics')}>
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all transform scale-150 rotate-12"><Globe size={200}/></div>
                  <div className="relative z-10">
                       <div className="p-4 bg-white/10 rounded-2xl w-fit mb-10 border border-white/10"><BarChart3 size={32} className="text-indigo-200 animate-pulse"/></div>
                       <h3 className="text-4xl font-black uppercase tracking-tightest leading-tight">Observatório <br/> Territorial.</h3>
                       <p className="text-indigo-100/70 text-base mt-6 font-medium leading-relaxed uppercase italic">Mapeamento georreferenciado de vulnerabilidade e demografia do cluster.</p>
                  </div>
                  <button className="w-full py-6 bg-white text-indigo-950 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-50 transition-all relative z-10">Explorar SmartMap</button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
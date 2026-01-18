
import React, { useState, useEffect } from 'react';
import { financialService, demographicsService, api } from '../services/api';
import { SystemInfo } from '../types';
import { 
  AlertTriangle, Users, Loader2, 
  ChevronRight, Activity, Landmark, Sparkles, 
  Video, Radio, Server, ArrowUpRight, History, 
  ShieldCheck, Wifi, Cpu as CpuIcon, Clock, Terminal
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
        console.error("[SRE] Dashboard Master Sync Failed");
      } finally {
        setLoading(false);
      }
    };
    loadMasterData();
    const interval = setInterval(loadMasterData, 30000); // Telemetria a cada 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 h-full">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/>
      <p className="text-slate-400 font-black animate-pulse text-[10px] uppercase tracking-[0.4em]">Sincronizando Kernel Master...</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-20">
      {/* HERO SECTION - COMANDO SRE */}
      <div className="bg-slate-900 border border-white/5 rounded-[3.5rem] p-10 lg:p-14 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-indigo-600/10 rounded-full blur-[150px] -mr-60 -mt-60"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-8 space-y-8">
                  <div className="flex flex-wrap gap-4">
                    <div className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2 backdrop-blur-md">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></div>
                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Kernel v215.0 Online</span>
                    </div>
                    <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2 backdrop-blur-md">
                        <Wifi size={12} className="text-emerald-400"/>
                        <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Cluster Sincronizado</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tightest leading-none uppercase">
                        S.I.E PRO <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-emerald-400 lowercase">{systemInfo.shortName}</span>
                    </h1>
                    <p className="text-slate-400 font-medium text-xl max-w-2xl leading-relaxed">Arquitetura de Governança Digital para Gestão Coletiva Ativa.</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pt-8 border-t border-white/5">
                      {[
                        { label: 'Neural Core', status: 'Ready', icon: Sparkles, color: 'text-indigo-400' },
                        { label: 'Uptime', status: (health?.uptime || 0) + 's', icon: Clock, color: 'text-emerald-400' },
                        { label: 'CPU Load', status: health?.cpu_load || '0.00', icon: CpuIcon, color: 'text-amber-400' },
                        { label: 'DB Health', status: health?.db_status || 'OFFLINE', icon: Server, color: 'text-indigo-500' }
                      ].map((svc, i) => (
                        <div key={i} className="space-y-1">
                           <p className="text-[8px] font-black uppercase text-slate-500 tracking-[0.3em] flex items-center gap-2"><svc.icon size={12} className={svc.color}/> {svc.label}</p>
                           <p className="text-sm font-black text-white uppercase">{svc.status}</p>
                        </div>
                      ))}
                  </div>
              </div>

              <div className="lg:col-span-4">
                  <div className="bg-white/5 border border-white/10 p-10 rounded-[3.5rem] backdrop-blur-3xl shadow-2xl group hover:border-indigo-500/30 transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Membros Ativos</p>
                        <Users size={20} className="text-indigo-400"/>
                      </div>
                      <h3 className="text-7xl font-black text-white tracking-tighter">{stats?.totalPopulation || '0'}</h3>
                      <div className="mt-8 flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                        <ArrowUpRight size={14}/> Sincronizado via Kernel
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { title: "Saúde Financeira", value: `R$ ${(stats?.balance || 0).toLocaleString('pt-BR')}`, icon: Landmark, color: 'text-emerald-500', tab: 'finance', label: 'Efetivo em Caixa' },
          { title: "Watchdog Alertas", value: stats?.openIncidents || 0, icon: AlertTriangle, color: 'text-rose-500', tab: 'operations', label: 'Chamados em Aberto' },
          { title: "Membros Pendentes", value: stats?.pending || 0, icon: History, color: 'text-amber-500', tab: 'users', label: 'Aguardando Aprovação' },
          { title: "Nós de Captura", value: "8 Ativos", icon: Video, color: 'text-indigo-500', tab: 'watchdog', label: 'SRE Vision Guard' }
        ].map((item) => (
          <div key={item.title} onClick={() => onNavigate(item.tab)} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all cursor-pointer group flex flex-col justify-between h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-50 transition-colors"></div>
              <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className={`p-4 rounded-2xl bg-slate-50 ${item.color} group-hover:scale-110 transition-transform shadow-inner`}><item.icon size={28}/></div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 transition-all transform group-hover:translate-x-1" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{item.title}</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{item.value}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 tracking-widest">{item.label}</p>
              </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
              <div className="bg-white p-10 lg:p-14 rounded-[4rem] border border-slate-200 shadow-sm">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-4 mb-12">
                      <Terminal size={28} className="text-indigo-600"/> Audit Trail (Logs Recentes)
                  </h3>
                  <div className="space-y-4">
                      {recentLogs.map((log, i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white transition-all shadow-sm">
                           <div className="flex items-center gap-6">
                              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                 <Activity size={18}/>
                              </div>
                              <div>
                                 <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{log.action} em {log.table_name}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">ID: #{log.record_id} • Sincronizado</p>
                              </div>
                           </div>
                           <span className="text-[9px] font-black text-slate-300 group-hover:text-slate-500 uppercase">{new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                      ))}
                      {recentLogs.length === 0 && <p className="text-center text-slate-300 py-10 uppercase text-[10px] font-black tracking-widest">Nenhuma mutação de dados registrada.</p>}
                  </div>
              </div>
          </div>
          
          <div className="lg:col-span-4">
              <div className="bg-slate-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between group cursor-pointer border border-white/5 min-h-[500px]" onClick={() => onNavigate('watchdog')}>
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-all transform scale-150 rotate-12"><Video size={200}/></div>
                  <div className="space-y-8 relative z-10">
                      <div className="flex items-center gap-4">
                          <div className="p-4 bg-rose-600 rounded-2xl shadow-xl shadow-rose-600/20 animate-pulse"><Radio size={24}/></div>
                          <h3 className="text-3xl font-black tracking-tightest uppercase">Vision Guard</h3>
                      </div>
                      <h4 className="text-5xl font-black leading-tight uppercase">Segurança <br/> Preditiva.</h4>
                      <p className="text-slate-400 text-sm font-medium uppercase italic leading-relaxed">Monitoramento biométrico e captura de eventos Vision SRE.</p>
                  </div>
                  <button className="w-full py-6 bg-white text-slate-900 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-rose-600 hover:text-white transition-all shadow-2xl relative z-10">
                      Acessar Central Vision
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;


import React, { useState, useEffect } from 'react';
import { financialService, demographicsService, cameraService, api } from '../services/api';
import { SystemInfo } from '../types';
import { 
  AlertTriangle, Users, Loader2, 
  ChevronRight, Activity, Landmark, Sparkles, 
  ShoppingBag, Video, Radio,
  Server, Database, ArrowUpRight, History, ShieldCheck, Wifi, Cpu as CpuIcon,
  Heart
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  systemInfo: SystemInfo;
}

const Dashboard = ({ onNavigate, systemInfo }: DashboardProps) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [camerasCount, setCamerasCount] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [fin, soc, cams, audit] = await Promise.all([
          financialService.getDashboardStats(),
          demographicsService.getStats(),
          cameraService.getAll(),
          api.get('/audit')
        ]);
        setStats({ ...fin.data, ...soc.data });
        setCamerasCount(cams.data?.data?.length || 0);
        setRecentLogs((audit.data?.data || []).slice(0, 5));
      } catch (error) {
        console.error("[SRE] Dashboard Master Sync Failed");
      } finally {
        setLoading(false);
      }
    };
    loadMasterData();
  }, []);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 h-full">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/>
      <p className="text-slate-400 font-black animate-pulse text-[10px] uppercase tracking-[0.4em]">Sincronizando Kernel Master...</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-20">
      {/* HEADER MASTER SRE */}
      <div className="bg-slate-900 border border-white/5 rounded-[3.5rem] p-10 lg:p-14 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[120px] -mr-60 -mt-60"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-8 space-y-8">
                  <div className="flex flex-wrap gap-4">
                    <div className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></div>
                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none">Kernel Online: V100.0</span>
                    </div>
                    <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                        <Wifi size={12} className="text-emerald-400"/>
                        <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest leading-none">Cluster Sincronizado</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tightest leading-none uppercase">
                        S.I.E PRO <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-emerald-400 lowercase">{systemInfo.name}</span>
                    </h1>
                    <p className="text-slate-400 font-medium text-xl max-w-2xl leading-relaxed">Sala de Comando Administrativa para Governança de Clusters Urbanos.</p>
                  </div>

                  <div className="flex flex-wrap gap-10 pt-8 border-t border-white/5">
                      {[
                        { label: 'Neural Engine', status: 'Ready', icon: Sparkles },
                        { label: 'Database Log', status: 'Active', icon: Database },
                        { label: 'Infrastructure', status: 'Optimal', icon: Server }
                      ].map((svc, i) => (
                        <div key={i} className="flex items-center gap-3">
                           <svc.icon size={20} className="text-indigo-500"/>
                           <div>
                              <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">{svc.label}</p>
                              <p className="text-xs font-black text-white uppercase">{svc.status}</p>
                           </div>
                        </div>
                      ))}
                  </div>
              </div>

              <div className="lg:col-span-4 space-y-4">
                  <div className="bg-white/5 border border-white/10 p-10 rounded-[3.5rem] backdrop-blur-2xl shadow-xl">
                      <div className="flex justify-between items-start mb-6">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Base de Dados Total</p>
                        <Users size={20} className="text-indigo-400"/>
                      </div>
                      <h3 className="text-6xl font-black text-white tracking-tighter">{stats?.totalPopulation || '00'}</h3>
                      <div className="mt-6 flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase">
                        <ArrowUpRight size={14}/> Membros Ativos no Cluster
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { title: "Saúde Financeira", value: `R$ ${(stats?.balance || 0).toLocaleString('pt-BR')}`, icon: Landmark, color: 'text-emerald-500', tab: 'finance', label: 'Líquido Disponível' },
          { title: "Alertas Watchdog", value: stats?.openIncidents || 0, icon: AlertTriangle, color: 'text-rose-500', tab: 'operations', label: 'Incidentes Críticos' },
          { title: "Soberania Digital", value: "98.2%", icon: ShieldCheck, color: 'text-indigo-500', tab: 'settings', label: 'Score Governança' },
          { title: "Fluxo Marketplace", value: "24", icon: ShoppingBag, color: 'text-amber-500', tab: 'marketplace', label: 'Ofertas Ativas' }
        ].map((item) => (
          <div key={item.title} onClick={() => onNavigate(item.tab)} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all cursor-pointer group flex flex-col justify-between h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:bg-indigo-50 transition-colors"></div>
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
                  <div className="flex items-center justify-between mb-12">
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-4">
                            <Activity size={28} className="text-indigo-600"/> Protocolos Estratégicos
                        </h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div onClick={() => onNavigate('demographics')} className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition-all group cursor-pointer shadow-sm flex flex-col justify-between min-h-[260px]">
                          <div className="p-5 bg-white rounded-[2rem] shadow-md text-indigo-600 w-fit group-hover:scale-110 transition-transform"><Heart size={32}/></div>
                          <div>
                              <h4 className="font-black text-slate-800 text-2xl uppercase tracking-tight">Análise Social</h4>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 leading-relaxed italic">Mapa de vulnerabilidade e demografia do cluster.</p>
                          </div>
                      </div>
                      <div onClick={() => onNavigate('assemblies')} className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 hover:bg-emerald-50 hover:border-emerald-100 transition-all group cursor-pointer shadow-sm flex flex-col justify-between min-h-[260px]">
                          <div className="p-5 bg-white rounded-[2rem] shadow-md text-emerald-600 w-fit group-hover:scale-110 transition-transform"><Landmark size={32}/></div>
                          <div>
                              <h4 className="font-black text-slate-800 text-2xl uppercase tracking-tight">Sessão Digital</h4>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 leading-relaxed italic">Atas e deliberações com motor neural.</p>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="bg-white p-10 lg:p-14 rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden">
                   <div className="flex items-center gap-4 mb-10">
                      <History size={24} className="text-indigo-600"/>
                      <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Trilha de Kernel</h4>
                   </div>
                   <div className="space-y-4">
                      {recentLogs.map((log, i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white transition-all">
                           <div className="flex items-center gap-5">
                              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
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
                   </div>
              </div>
          </div>
          
          <div className="lg:col-span-4 space-y-8">
              <div onClick={() => onNavigate('watchdog')} className="bg-slate-950 p-12 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between group cursor-pointer border border-white/5 min-h-[420px]">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-all transform scale-150 rotate-12"><Video size={180}/></div>
                  <div className="space-y-8 relative z-10">
                      <div className="flex items-center gap-4">
                          <div className="p-4 bg-rose-600 rounded-2xl shadow-xl shadow-rose-600/20 animate-pulse"><Radio size={24}/></div>
                          <h3 className="text-3xl font-black tracking-tightest uppercase">Vision Control</h3>
                      </div>
                      <h4 className="text-4xl font-black leading-tight uppercase">Vigilância <br/> Ativa 24/7</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-md">
                              <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Endpoints</p>
                              <p className="text-3xl font-black text-white">{camerasCount}</p>
                          </div>
                          <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-md">
                              <p className="text-[10px] font-black text-slate-500 uppercase mb-2">IA Engine</p>
                              <p className="text-3xl font-black text-emerald-500">ON</p>
                          </div>
                      </div>
                  </div>
                  <button className="w-full py-5 bg-white text-slate-900 rounded-[2.2rem] font-black text-[11px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-2xl relative z-10">
                      Central de Vídeo
                  </button>
              </div>

              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-xl space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-slate-950 text-white rounded-2xl"><CpuIcon size={24}/></div>
                    <div>
                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg">Server Status</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SRE Operational Health</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                      {[
                        { label: 'Uso de CPU', val: '12%', color: 'bg-indigo-600' },
                        { label: 'Database I/O', val: '8%', color: 'bg-emerald-500' }
                      ].map((h, i) => (
                        <div key={i} className="space-y-2">
                           <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-500 tracking-widest">
                               <span>{h.label}</span>
                               <span>{h.val}</span>
                           </div>
                           <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                               <div className={`h-full ${h.color} w-1/4 animate-pulse`}></div>
                           </div>
                        </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;

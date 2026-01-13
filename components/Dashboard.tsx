
import React, { useState, useEffect } from 'react';
import { financialService, demographicsService, operationsService, cameraService } from '../services/api';
import { SystemInfo } from '../types';
import { 
  AlertTriangle, Users, Loader2, 
  Shield, ChevronRight, Activity, Landmark, Sparkles, 
  ShoppingBag, Building2, Zap, TrendingUp, Heart, MapPin, Info, Video, Radio
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  systemInfo: SystemInfo;
}

const Dashboard = ({ onNavigate, systemInfo }: DashboardProps) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [camerasCount, setCamerasCount] = useState(0);

  useEffect(() => {
      const loadAll = async () => {
          try {
              const [fin, soc, cams] = await Promise.all([
                  financialService.getDashboardStats(),
                  demographicsService.getStats(),
                  cameraService.getAll()
              ]);
              setStats({ ...fin.data, ...soc.data });
              setCamerasCount(cams.data?.data?.length || 0);
          } catch (error) {
              console.error("[SRE] Dashboard Sync Failed");
          } finally { setLoading(false); }
      };
      loadAll();
  }, []);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 h-full">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/>
      <p className="text-slate-400 font-black animate-pulse text-[10px] uppercase tracking-[0.4em]">Sincronizando Kernel S.I.E...</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
      <div className="bg-slate-900 border border-white/5 rounded-[3.5rem] p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-8 space-y-6">
                  <div className="flex flex-wrap gap-3">
                    <div className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2">
                        <Shield size={14} className="text-indigo-400"/>
                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none">Cluster Ativo V25.5</span>
                    </div>
                  </div>
                  <h1 className="text-5xl md:text-6xl font-black text-white tracking-tightest leading-none uppercase">
                      Portal de Comando <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400 italic lowercase">{systemInfo.name}</span>
                  </h1>
                  <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">Infraestrutura neural pronta para governança ativa, economia circular e monitoramento demográfico em tempo real.</p>
              </div>
              <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-2xl text-center shadow-xl">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Total População</p>
                      <h3 className="text-4xl font-black text-white">{stats?.totalPopulation || '--'}</h3>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-2xl text-center shadow-xl">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">Eco Score</p>
                      <h3 className="text-4xl font-black text-white">A+</h3>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                  <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden p-2 shadow-inner">
                          {systemInfo.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain" alt="Identity" /> : <Building2 size={28} className="text-indigo-600" />}
                      </div>
                      <div>
                          <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none">{systemInfo.shortName || 'Identidade'}</h3>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Registro Master S.I.E</p>
                      </div>
                  </div>
                  <div className="space-y-4">
                      <div className="flex items-start gap-3">
                          <MapPin size={14} className="text-indigo-500 shrink-0 mt-0.5"/>
                          <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase">{systemInfo.address || 'Endereço não configurado'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                          <Info size={14} className="text-indigo-500 shrink-0"/>
                          <p className="text-[10px] font-black text-slate-800 uppercase">CNPJ: {systemInfo.cnpj || 'Aguardando Registro'}</p>
                      </div>
                  </div>
              </div>
              <button onClick={() => onNavigate('settings')} className="mt-8 w-full py-3 bg-slate-50 border border-slate-100 text-indigo-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Configurar Perfil</button>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Saúde de Caixa", value: `R$ ${(stats?.balance || 0).toLocaleString('pt-BR')}`, icon: Landmark, color: 'text-emerald-500', tab: 'finance' },
              { title: "Watchdog (Ocorr.)", value: stats?.openIncidents || 0, icon: AlertTriangle, color: 'text-rose-500', tab: 'operations' },
              { title: "Projetos Ativos", value: "08", icon: Zap, color: 'text-indigo-500', tab: 'projects' },
              { title: "Economia Local", value: "24", icon: ShoppingBag, color: 'text-amber-500', tab: 'marketplace' }
            ].map((item) => (
              <div key={item.title} onClick={() => onNavigate(item.tab)} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all cursor-pointer group flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start mb-6">
                      <div className={`p-4 rounded-2xl bg-slate-50 ${item.color} group-hover:scale-110 transition-transform shadow-inner`}><item.icon size={24}/></div>
                      <ChevronRight size={18} className="text-slate-200 group-hover:text-indigo-500 transition-colors"/>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.title}</p>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">{item.value}</h3>
                  </div>
              </div>
            ))}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          <div className="lg:col-span-2 bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-10">
              <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-4">
                    <Activity size={24} className="text-indigo-600"/> Protocolos de Engajamento
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <button onClick={() => onNavigate('demographics')} className="p-10 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-left hover:bg-indigo-50 transition-all group flex items-center gap-8 shadow-sm">
                      <div className="p-5 bg-white rounded-[1.5rem] shadow-md text-indigo-600 group-hover:scale-110 transition-transform"><Heart size={28}/></div>
                      <div>
                          <p className="font-black text-slate-800 text-base">Observatório Social</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Soberania de Dados</p>
                      </div>
                  </button>
                  <button onClick={() => onNavigate('assemblies')} className="p-10 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-left hover:bg-emerald-50 transition-all group flex items-center gap-8 shadow-sm">
                      <div className="p-5 bg-white rounded-[1.5rem] shadow-md text-emerald-600 group-hover:scale-110 transition-transform"><Landmark size={28}/></div>
                      <div>
                          <p className="font-black text-slate-800 text-base">Sessão Legislativa</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Assembleia Digital</p>
                      </div>
                  </button>
              </div>
          </div>
          
          <div onClick={() => onNavigate('concierge')} className="bg-slate-950 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between group cursor-pointer border border-white/5">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all"><Video size={140}/></div>
              <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-3">
                      <div className="p-3 bg-rose-600 rounded-xl animate-pulse"><Radio size={20}/></div>
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-400">Sistema Watchdog Online</span>
                  </div>
                  <h3 className="text-3xl font-black tracking-tightest leading-tight uppercase">Vigilância <br/> Ativa</h3>
                  <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                          <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Câmeras</p>
                          <p className="text-xl font-black">{camerasCount}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                          <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Alertas</p>
                          <p className="text-xl font-black text-rose-500">03</p>
                      </div>
                  </div>
              </div>
              <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest mt-8 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-xl">
                  Acessar Central de Vídeo
              </button>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;

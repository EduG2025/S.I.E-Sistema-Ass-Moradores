import React, { useState, useEffect } from 'react';
import { api, authService, systemService } from '../services/api';
import { User, SystemInfo, ResidentUISetting } from '../types';
import {
  Wallet, Calendar, ShoppingBag, MessageSquare, Lock,
  Brain, Sparkles, ArrowRight, Loader2,
  ShieldCheck, Bell, Fingerprint, QrCode,
  FileText, ClipboardCheck, Timer, ChevronRight // ChevronRight adicionado aqui
} from 'lucide-react';

interface ResidentDashboardProps {
  onNavigate: (tab: string) => void;
  systemInfo: SystemInfo;
}

const ResidentDashboard = ({ onNavigate, systemInfo }: ResidentDashboardProps) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [uiManifest, setUiManifest] = useState<ResidentUISetting[]>([]);

  useEffect(() => {
    const loadResidentPortal = async () => {
      try {
        const [userRes, portalRes, sysRes] = await Promise.all([
          authService.me(),
          api.get('/resident/dashboard'),
          systemService.getInfo()
        ]);

        setCurrentUser(userRes.data);
        setData(portalRes.data);

        // SRE: Sanitização de configurações de UI
        let rawSettings = sysRes.data?.resident_ui_settings;
        if (typeof rawSettings === 'string') {
          try { rawSettings = JSON.parse(rawSettings); } catch { rawSettings = []; }
        }
        setUiManifest(Array.isArray(rawSettings) ? rawSettings : []);
      } catch (e) {
        console.error("[SRE] Falha de Handshake no Portal do Residente");
      } finally {
        setLoading(false);
      }
    };
    loadResidentPortal();
  }, []);

  const isModuleEnabled = (id: string) => {
    if (!uiManifest || uiManifest.length === 0) return true;
    const widget = uiManifest.find(w => w.id === id);
    return widget ? widget.enabled : true;
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 h-full">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
      <p className="text-slate-400 font-black animate-pulse text-[10px] uppercase tracking-widest">Sincronizando Terminal...</p>
    </div>
  );

  const primaryColor = systemInfo.primaryColor || '#4f46e5';

  return (
    <div className="flex-1 flex flex-col space-y-8 animate-fade-in max-w-[1300px] mx-auto pb-10">

      {/* HEADER: GREETING & CONTEXT */}
      <div className="bg-slate-900 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        <div className="relative z-10">
          <div className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2 backdrop-blur-md w-fit mb-10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{systemInfo.shortName} • Terminal do Associado</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tightest leading-none">Olá, {currentUser?.name.split(' ')[0]}</h1>
              <p className="text-slate-400 font-medium text-lg mt-4 uppercase tracking-widest flex items-center gap-3">
                <Fingerprint size={20} className="text-indigo-500" /> Unid. {currentUser?.unit || 'CADASTRO EM ANÁLISE'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => onNavigate('settings')} className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-black text-[9px] uppercase tracking-widest flex items-center gap-3 transition-all">
                <Lock size={14} /> Perfil & Chaves
              </button>
              {isModuleEnabled('suggestions') && (
                <button onClick={() => onNavigate('suggestions')} className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all" style={{ backgroundColor: primaryColor }}>
                  <MessageSquare size={14} /> Suporte Operacional
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isModuleEnabled('finance') && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-300 transition-all cursor-pointer" onClick={() => onNavigate('finance')}>
            <div className="flex justify-between items-start mb-6">
              <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600 shadow-inner"><Wallet size={24} /></div>
              <ArrowRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Saldo Devedor Pendente</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">R$ {Number(data?.pendingBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        )}

        {isModuleEnabled('reservations') && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-300 transition-all cursor-pointer" onClick={() => onNavigate('reservations')}>
            <div className="flex justify-between items-start mb-6">
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner"><Calendar size={24} /></div>
              <ArrowRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Agendas Confirmadas</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{data?.reservations?.length || 0} Atividades</h3>
            </div>
          </div>
        )}

        {isModuleEnabled('concierge') && (
          <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-between group hover:scale-[1.01] transition-all cursor-pointer overflow-hidden relative" onClick={() => onNavigate('concierge')}>
            <div className="absolute top-0 right-0 p-6 opacity-5"><Fingerprint size={100} /></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-lg" style={{ backgroundColor: primaryColor }}><QrCode size={24} /></div>
              <ArrowRight size={18} className="text-indigo-400/20 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Acesso ao Cluster</p>
              <h3 className="text-3xl font-black text-white tracking-tight">QR Code Dinâmico</h3>
            </div>
          </div>
        )}
      </div>

      {/* CENSO ATIVO: ACTIVE SURVEYS SECTION */}
      {data?.activeSurveys?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-700">
          {data.activeSurveys.map((survey: any) => (
            <div
              key={survey.id}
              className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 shadow-sm flex flex-col gap-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ClipboardCheck size={80} className="text-indigo-600" />
              </div>

              <div className="flex justify-between items-start relative z-10">
                <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm border border-indigo-100">
                  <Timer size={20} className="animate-pulse" />
                </div>
                <span className="text-[8px] font-black uppercase bg-indigo-600 text-white px-3 py-1.5 rounded-full tracking-widest shadow-md">
                  Censo Ativo
                </span>
              </div>

              <div className="relative z-10">
                <h4 className="text-base font-black text-slate-800 uppercase tracking-tight leading-tight mb-2">
                  {survey.title}
                </h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                  {survey.totalQuestions} perguntas • Aproximadamente 2 min
                </p>
              </div>

              <div className="space-y-2 relative z-10">
                <div className="flex justify-between items-center text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                  <span>Conclusão</span>
                  <span>{survey.progress}%</span>
                </div>
                <div className="h-2.5 bg-white rounded-full overflow-hidden border border-indigo-100 p-0.5">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${survey.progress || 5}%`, backgroundColor: primaryColor }}
                  ></div>
                </div>
              </div>

              <button
                onClick={() => onNavigate(`surveys/${survey.id}`)}
                className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group"
              >
                {survey.progress > 0 ? 'Continuar Censo' : 'Responder Agora'}
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {isModuleEnabled('communication') && (
          <div className="lg:col-span-8 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-10">
              <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-4">
                <Bell size={26} className="text-indigo-600" style={{ color: primaryColor }} /> Mural do Cluster
              </h4>
            </div>
            <div className="space-y-4 flex-1">
              {data?.recentNotices?.length > 0 ? data.recentNotices.map((n: any) => (
                <div key={n.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:border-indigo-200 hover:shadow-xl transition-all relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${n.urgency === 'HIGH' ? 'bg-rose-500' : 'bg-indigo-400'}`} style={n.urgency !== 'HIGH' ? { backgroundColor: primaryColor } : {}}></div>
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-black text-slate-800 text-base uppercase leading-tight truncate pr-4">{n.title}</h5>
                    <span className="text-[8px] font-black text-slate-400 uppercase whitespace-nowrap">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium uppercase leading-relaxed line-clamp-2">{n.content}</p>
                </div>
              )) : (
                <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Nenhum comunicado ativo.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {isModuleEnabled('neural_chat') && (
          <div className="lg:col-span-4 bg-indigo-600 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between group cursor-pointer" onClick={() => onNavigate('neural_chat')} style={{ backgroundColor: primaryColor }}>
            <div className="absolute top-0 right-0 p-8 opacity-5 transform scale-125"><Brain size={120} /></div>
            <div className="relative z-10">
              <div className="p-4 bg-white/10 rounded-2xl w-fit mb-10 backdrop-blur-md border border-white/10 shadow-2xl"><Sparkles size={28} className="text-indigo-200 animate-pulse" /></div>
              <h4 className="text-3xl lg:text-4xl font-black uppercase tracking-tightest leading-[0.9]">Cérebro Regimental</h4>
              <p className="text-indigo-100 text-xs mt-6 font-medium leading-relaxed uppercase italic opacity-80 border-l-2 border-white/20 pl-4">
                Suporte normativo, estatutário e resoluções de conflitos em tempo real.
              </p>
            </div>
            <button className="mt-10 w-full py-5 bg-white text-indigo-950 rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-2xl relative z-10 transition-all active:scale-95">
              Consultar IA
            </button>
          </div>
        )}
      </div>

      {/* FOOTER BAR */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-slate-900 text-white rounded-[1.25rem] shadow-lg"><ShieldCheck size={26} /></div>
          <div>
            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">Integridade de Dados</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1.5 tracking-wider">Protocolo de Criptografia SRE v6.5 • Session Active</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {isModuleEnabled('marketplace') && (
            <button onClick={() => onNavigate('marketplace')} className="px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase text-slate-600 hover:bg-white hover:border-indigo-600 hover:text-indigo-600 transition-all">
              <ShoppingBag size={14} /> Marketplace
            </button>
          )}
          {isModuleEnabled('documents') && (
            <button onClick={() => onNavigate('documents')} className="px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase text-slate-600 hover:bg-white hover:border-indigo-600 hover:text-indigo-600 transition-all">
              <FileText size={14} /> Repositório Legal
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
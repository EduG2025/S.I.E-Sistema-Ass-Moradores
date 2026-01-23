import React, { useState, useEffect } from 'react';
import { api, authService, systemService } from '../services/api';
import { User, SystemInfo, ResidentUISetting } from '../types';
import { 
  Wallet, Calendar, ShoppingBag, MessageSquare, Key, Lock, 
  Brain, Sparkles, Landmark, ChevronRight, X, Loader2, 
  ShieldCheck, Phone, Bell, Zap, Fingerprint, QrCode, Layout, 
  AlertCircle, ArrowRight, UserCheck, Shield, FileText, HelpCircle
} from 'lucide-react';

interface ResidentDashboardProps {
  onNavigate: (tab: string) => void;
  systemInfo: SystemInfo;
}

const ResidentDashboard = ({ onNavigate, systemInfo }: ResidentDashboardProps) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
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
        if (sysRes.data?.resident_ui_settings) {
            setUiManifest(sysRes.data.resident_ui_settings);
        }
      } catch (e) {
        console.error("[SRE] Falha de Handshake no Portal do Residente");
      } finally {
        setLoading(false);
      }
    };
    loadResidentPortal();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) return alert("SRE: Divergência de integridade nas senhas.");
    try {
      await api.post('/auth/update-password', { password: newPass });
      alert("✅ Chave soberana atualizada com sucesso.");
      setIsResetModalOpen(false);
    } catch (e) { alert("Falha ao comitar nova senha."); }
  };

  const isModuleEnabled = (id: string) => {
      if (!uiManifest || uiManifest.length === 0) return true;
      const widget = uiManifest.find(w => w.id === id);
      return widget ? widget.enabled : true;
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 h-full">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/>
      <p className="text-slate-400 font-black animate-pulse text-[10px] uppercase tracking-widest">Sincronizando Terminal...</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col space-y-8 animate-fade-in max-w-[1300px] mx-auto">
      
      {/* HEADER SOBERANO - TEXTO REDUZIDO */}
      <div className="bg-slate-900 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        <div className="relative z-10">
          <div className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2 backdrop-blur-md w-fit mb-10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{systemInfo.shortName} • Associado</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tightest leading-none">Olá, {currentUser?.name.split(' ')[0]}</h1>
                <p className="text-slate-400 font-medium text-lg mt-4 uppercase tracking-widest flex items-center gap-3">
                   <Fingerprint size={20} className="text-indigo-500"/> Unid. {currentUser?.unit || 'PENDENTE'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setIsResetModalOpen(true)} className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-black text-[9px] uppercase tracking-widest flex items-center gap-3 transition-all"><Lock size={14}/> Chave SRE</button>
                {isModuleEnabled('suggestions') && (
                    <button onClick={() => onNavigate('suggestions')} className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all"><MessageSquare size={14}/> Ouvidoria</button>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* KPI GRID - NORMALIZADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isModuleEnabled('finance') && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-300 transition-all cursor-pointer" onClick={() => onNavigate('finance')}>
                <div className="flex justify-between items-start mb-6">
                    <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600 shadow-inner"><Wallet size={24}/></div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform"/>
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Aberto</p>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">R$ {Number(data?.pendingBalance || 0).toLocaleString('pt-BR')}</h3>
                    <div className="mt-4 flex items-center gap-2 text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-lg w-fit">Ver Faturas</div>
                </div>
            </div>
        )}

        {isModuleEnabled('reservations') && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-300 transition-all cursor-pointer" onClick={() => onNavigate('reservations')}>
                <div className="flex justify-between items-start mb-6">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner"><Calendar size={24}/></div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform"/>
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Agenda</p>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">{data?.reservations?.length || 0} Registros</h3>
                    <div className="mt-4 flex items-center gap-2 text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-lg w-fit">Reservar Área</div>
                </div>
            </div>
        )}

        {isModuleEnabled('concierge') && (
            <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-between group hover:scale-[1.01] transition-all cursor-pointer overflow-hidden relative" onClick={() => onNavigate('concierge')}>
                <div className="absolute top-0 right-0 p-6 opacity-5"><Shield size={100}/></div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-lg"><QrCode size={24}/></div>
                    <ArrowRight size={18} className="text-indigo-400/20 group-hover:translate-x-1 transition-transform"/>
                </div>
                <div className="relative z-10">
                    <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Acesso</p>
                    <h3 className="text-3xl font-black text-white tracking-tight">QR Code</h3>
                    <div className="mt-4 flex items-center gap-2 text-[8px] font-black text-white uppercase tracking-widest bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg w-fit">Gerar Convite</div>
                </div>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-4">
        {/* MURAL - TEXTOS PROPORCIONAIS */}
        {isModuleEnabled('communication') && (
            <div className="lg:col-span-8 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                        <Bell size={24} className="text-indigo-600"/> Mural S.I.E
                    </h4>
                </div>
                <div className="space-y-4">
                    {data?.recentNotices?.length > 0 ? data.recentNotices.map((n: any) => (
                    <div key={n.id} className="p-6 bg-slate-50 rounded-[1.75rem] border border-slate-100 group hover:bg-white hover:border-indigo-200 hover:shadow-lg transition-all relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${n.urgency === 'HIGH' ? 'bg-rose-500' : 'bg-indigo-400'}`}></div>
                        <div className="flex justify-between items-start mb-2">
                            <h5 className="font-black text-slate-800 text-base uppercase leading-tight">{n.title}</h5>
                            <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(n.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium uppercase leading-relaxed line-clamp-2">{n.content}</p>
                    </div>
                    )) : (
                    <div className="py-16 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aguardando novos comunicados.</p>
                    </div>
                    )}
                </div>
            </div>
        )}
        
        {/* IA CTA - NORMALIZADO */}
        {isModuleEnabled('neural_chat') && (
            <div className="lg:col-span-4 bg-indigo-600 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between group cursor-pointer" onClick={() => onNavigate('neural_chat')}>
                <div className="absolute top-0 right-0 p-8 opacity-5 transform scale-125"><Brain size={120}/></div>
                <div className="relative z-10">
                    <div className="p-3.5 bg-white/10 rounded-2xl w-fit mb-8 backdrop-blur-md border border-white/10 shadow-xl"><Sparkles size={24} className="text-indigo-200 animate-pulse"/></div>
                    <h4 className="text-3xl lg:text-4xl font-black uppercase tracking-tightest leading-tight">Dúvidas? <br/> IA Mentor.</h4>
                    <p className="text-indigo-100 text-xs mt-4 font-medium leading-relaxed uppercase italic opacity-80">Suporte normativo e regimental ativo.</p>
                </div>
                <button className="mt-8 w-full py-4 bg-white text-indigo-950 rounded-[1.5rem] font-black text-[9px] uppercase tracking-[0.2em] shadow-xl relative z-10">Falar com Advisor</button>
            </div>
        )}
      </div>

      {/* FOOTER SRE */}
      <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
              <div className="p-4 bg-white text-indigo-600 rounded-2xl shadow-sm"><ShieldCheck size={24}/></div>
              <div>
                  <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">Dados Auditados</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Monitorado pelo Protocolo SRE V4.5</p>
              </div>
          </div>
          <div className="flex gap-3">
              {isModuleEnabled('marketplace') && (
                  <button onClick={() => onNavigate('marketplace')} className="px-5 py-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase text-slate-600 hover:border-indigo-600 transition-all"><ShoppingBag size={14}/> Mercado</button>
              )}
              {isModuleEnabled('documents') && (
                  <button onClick={() => onNavigate('documents')} className="px-5 py-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase text-slate-600 hover:border-indigo-600 transition-all"><FileText size={14}/> Documentos</button>
              )}
          </div>
      </div>

      {/* PASSWORD RESET */}
      {isResetModalOpen && (
        <div className="sie-editor-overlay">
          <div className="sie-modal-container !h-auto !max-w-md self-center">
            <form onSubmit={handleUpdatePassword}>
              <div className="h-16 px-8 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-indigo-600 rounded-xl shadow-xl"><Key size={18}/></div>
                  <h4 className="font-black text-base tracking-tight uppercase">Chave SRE</h4>
                </div>
                <button type="button" onClick={() => setIsResetModalOpen(false)} className="p-2 text-slate-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all"><X size={20}/></button>
              </div>
              <div className="p-8 space-y-6 bg-[#fdfdfe]">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Credencial</label>
                  <input type="password" required className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-5 text-lg focus:bg-white focus:border-indigo-500 outline-none" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar</label>
                  <input type="password" required className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-5 text-lg focus:bg-white focus:border-indigo-500 outline-none" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="••••••••" />
                </div>
                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 active:scale-95">Sincronizar Chave</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentDashboard;
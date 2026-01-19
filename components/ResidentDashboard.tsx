
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
      <p className="text-slate-400 font-black animate-pulse text-[10px] uppercase tracking-[0.4em]">Sincronizando Malha de Módulos...</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-20">
      
      {/* HEADER SOBERANO */}
      <div className="bg-slate-900 rounded-[3.5rem] p-10 lg:p-14 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[120px] -mr-60 -mt-60"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-3 backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none">{systemInfo.shortName} • Terminal do Associado</span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tightest leading-none">Olá, {currentUser?.name.split(' ')[0]}</h1>
                <p className="text-slate-400 font-medium text-xl mt-4 uppercase tracking-widest flex items-center gap-3">
                   <Fingerprint size={24} className="text-indigo-500"/> Unidade {currentUser?.unit || 'PENDENTE'}
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => setIsResetModalOpen(true)} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95"><Lock size={16}/> Gestão de Chave</button>
                {isModuleEnabled('suggestions') && (
                    <button onClick={() => onNavigate('suggestions')} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all active:scale-95"><MessageSquare size={16}/> Ouvidoria Ativa</button>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* QUADRO DE INDICADORES (KPI) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* WIDGET: FINANCEIRO */}
        {isModuleEnabled('finance') && (
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-300 transition-all cursor-pointer" onClick={() => onNavigate('finance')}>
                <div className="flex justify-between items-start mb-8">
                    <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 shadow-inner"><Wallet size={28}/></div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:translate-x-2 transition-transform"/>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Taxas Pendentes</p>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tight">R$ {Number(data?.pendingBalance || 0).toLocaleString('pt-BR')}</h3>
                    <div className="mt-6 flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg w-fit">Ver Boletos</div>
                </div>
            </div>
        )}

        {/* WIDGET: RESERVAS */}
        {isModuleEnabled('reservations') && (
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-300 transition-all cursor-pointer" onClick={() => onNavigate('reservations')}>
                <div className="flex justify-between items-start mb-8">
                    <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner"><Calendar size={28}/></div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:translate-x-2 transition-transform"/>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Agendamentos</p>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tight">{data?.reservations?.length || 0} Registros</h3>
                    <div className="mt-6 flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg w-fit">Nova Reserva</div>
                </div>
            </div>
        )}

        {/* WIDGET: ACESSO DIGITAL / CONCIERGE */}
        {isModuleEnabled('concierge') && (
            <div className="bg-slate-950 p-10 rounded-[3rem] text-white shadow-2xl flex flex-col justify-between group hover:scale-[1.02] transition-all cursor-pointer overflow-hidden relative" onClick={() => onNavigate('concierge')}>
                <div className="absolute top-0 right-0 p-8 opacity-10"><Shield size={120}/></div>
                <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-lg"><QrCode size={28}/></div>
                    <ArrowRight size={20} className="text-indigo-400/30 group-hover:translate-x-2 transition-transform"/>
                </div>
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Segurança</p>
                    <h3 className="text-4xl font-black text-white tracking-tight">QR Code</h3>
                    <div className="mt-6 flex items-center gap-2 text-[9px] font-black text-white uppercase tracking-widest bg-white/10 border border-white/10 px-3 py-1 rounded-lg w-fit">Gerar Convite</div>
                </div>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* MURAL OFICIAL */}
        {isModuleEnabled('communication') && (
            <div className="lg:col-span-8 bg-white p-10 lg:p-12 rounded-[4rem] border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-10">
                    <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tightest flex items-center gap-4">
                        <Bell size={28} className="text-indigo-600"/> Mural S.I.E
                    </h4>
                    <button onClick={() => onNavigate('communication')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Ver Histórico</button>
                </div>
                <div className="space-y-6">
                    {data?.recentNotices?.length > 0 ? data.recentNotices.map((n: any) => (
                    <div key={n.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:border-indigo-200 hover:shadow-xl transition-all relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-2 h-full ${n.urgency === 'HIGH' ? 'bg-rose-500' : 'bg-indigo-400'}`}></div>
                        <div className="flex justify-between items-start mb-3">
                            <h5 className="font-black text-slate-800 text-lg uppercase leading-tight">{n.title}</h5>
                            <span className="text-[9px] font-black text-slate-400 bg-white px-3 py-1 rounded-lg border border-slate-100 uppercase">{new Date(n.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium uppercase leading-relaxed line-clamp-2">{n.content}</p>
                    </div>
                    )) : (
                    <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                        <AlertCircle size={48} className="mx-auto text-slate-200 mb-4 opacity-30"/>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sem avisos críticos no momento.</p>
                    </div>
                    )}
                </div>
            </div>
        )}
        
        {/* IA ADVISOR CTA */}
        {isModuleEnabled('neural_chat') && (
            <div className="lg:col-span-4 bg-indigo-600 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between group cursor-pointer" onClick={() => onNavigate('neural_chat')}>
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-30 transition-all scale-150 rotate-12"><Brain size={150}/></div>
                <div className="relative z-10">
                    <div className="p-4 bg-white/10 rounded-2xl w-fit mb-10 backdrop-blur-md border border-white/10 shadow-xl"><Sparkles size={32} className="text-indigo-200 animate-pulse"/></div>
                    <h4 className="text-5xl font-black uppercase tracking-tightest leading-tight">Dúvidas? <br/> IA Mentor.</h4>
                    <p className="text-indigo-100 text-base mt-6 font-medium leading-relaxed uppercase italic opacity-80">Consulte o regimento e normas internas em tempo real via IA Ativa.</p>
                </div>
                <button className="mt-12 w-full py-6 bg-white text-indigo-950 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl group-hover:bg-indigo-50 transition-all relative z-10">Falar com Advisor</button>
            </div>
        )}
      </div>

      {/* FOOTER DE GOVERNANÇA SRE */}
      <div className="bg-slate-50 p-10 rounded-[4rem] border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-6">
              <div className="p-5 bg-white text-indigo-600 rounded-[2rem] shadow-sm"><ShieldCheck size={32}/></div>
              <div>
                  <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">Dados Auditados</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">Sua conta é monitorada pelo Protocolo SRE de Integridade V4.5</p>
              </div>
          </div>
          <div className="flex gap-4">
              {isModuleEnabled('marketplace') && (
                  <button onClick={() => onNavigate('marketplace')} className="px-6 py-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase text-slate-600 hover:border-indigo-600 transition-all"><ShoppingBag size={16}/> Mercado Local</button>
              )}
              {isModuleEnabled('documents') && (
                  <button onClick={() => onNavigate('documents')} className="px-6 py-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase text-slate-600 hover:border-indigo-600 transition-all"><FileText size={16}/> Documentos</button>
              )}
          </div>
      </div>

      {/* PASSWORD RESET MODAL */}
      {isResetModalOpen && (
        <div className="sie-editor-overlay">
          <div className="sie-modal-container !h-auto !max-w-md self-center">
            <form onSubmit={handleUpdatePassword}>
              <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                <div className="flex items-center gap-5">
                  <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl"><Key size={22}/></div>
                  <h4 className="font-black text-xl tracking-tight uppercase">Chave SRE</h4>
                </div>
                <button type="button" onClick={() => setIsResetModalOpen(false)} className="p-3 text-slate-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all"><X size={28}/></button>
              </div>
              <div className="p-10 space-y-8 bg-[#fdfdfe]">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Nova Credencial</label>
                  <input type="password" required className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xl focus:bg-white focus:border-indigo-500 transition-all shadow-inner outline-none" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Repetir Credencial</label>
                  <input type="password" required className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xl focus:bg-white focus:border-indigo-500 transition-all shadow-inner outline-none" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="••••••••" />
                </div>
                <button type="submit" className="w-full py-6 bg-slate-950 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95">Commitar Mudança</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentDashboard;

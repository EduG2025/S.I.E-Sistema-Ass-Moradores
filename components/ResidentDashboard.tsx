
import React, { useState, useEffect } from 'react';
import { api, authService, systemService } from '../services/api';
import { User, SystemInfo, ResidentUISetting } from '../types';
import { 
  Wallet, Calendar, ShoppingBag, MessageSquare, Key, Lock, 
  Brain, Sparkles, Landmark, ChevronRight, X, Loader2, 
  ShieldCheck, Phone, Bell, Zap, Fingerprint, QrCode, Layout
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
        console.error("[SRE] Falha ao carregar Portal do Residente");
      } finally {
        setLoading(false);
      }
    };
    loadResidentPortal();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) return alert("Senhas não conferem.");
    try {
      await api.post('/auth/update-password', { password: newPass });
      alert("✅ Credencial soberana atualizada.");
      setIsResetModalOpen(false);
    } catch (e) { alert("Erro ao atualizar."); }
  };

  const getIcon = (iconName: string) => {
    switch(iconName) {
        case 'Wallet': return Wallet;
        case 'Calendar': return Calendar;
        case 'QrCode': return QrCode;
        case 'Landmark': return Landmark;
        case 'Brain': return Brain;
        default: return Layout;
    }
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 h-full">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/>
      <p className="text-slate-400 font-black animate-pulse text-[10px] uppercase tracking-[0.4em]">Sincronizando Portal Soberano...</p>
    </div>
  );

  const enabledWidgets = uiManifest.filter(w => w.enabled);

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-20">
      {/* HEADER SOBERANO */}
      <div className="bg-slate-900 rounded-[3.5rem] p-10 lg:p-14 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2">
              <Zap size={12} className="text-indigo-400 fill-current"/>
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none">Membro Ativo • Cluster {systemInfo.shortName}</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tightest leading-none">Olá, {currentUser?.name.split(' ')[0]}</h1>
          <p className="text-slate-400 font-medium text-lg mt-4 uppercase tracking-widest">Unidade {currentUser?.unit || 'PENDENTE'} • {systemInfo.name}</p>
          
          <div className="flex flex-wrap gap-4 mt-10">
            <button onClick={() => setIsResetModalOpen(true)} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all"><Key size={16}/> Gerenciar Senha</button>
            <button onClick={() => onNavigate('suggestions')} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-50 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all shadow-indigo-600/20"><MessageSquare size={16}/> Abrir Chamado</button>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS GRID DINÂMICO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {enabledWidgets.filter(w => ['finance', 'reservations', 'access'].includes(w.id)).map(widget => {
            const Icon = getIcon(widget.icon);
            let val = "";
            let sub = widget.detail;
            let target = "";
            let color = "bg-indigo-50 text-indigo-600";
            
            if (widget.id === 'finance') {
                val = `R$ ${Number(data?.pendingBalance || 0).toLocaleString('pt-BR')}`;
                sub = "Pendente da Unidade";
                target = 'finance';
                color = "bg-rose-50 text-rose-600";
            } else if (widget.id === 'reservations') {
                val = `${data?.reservations?.length || 0} Ativas`;
                sub = "Minhas Reservas";
                target = 'reservations';
                color = "bg-emerald-50 text-emerald-600";
            } else if (widget.id === 'access') {
                val = "Gerar Convite";
                sub = "Acesso Digital";
                target = "watchdog";
                color = "bg-slate-950 text-white";
            }

            return (
                <div key={widget.id} className={`${widget.id === 'access' ? 'bg-slate-950 p-10 rounded-[3rem] text-white shadow-2xl' : 'bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm'} flex flex-col justify-between group hover:scale-[1.02] transition-all cursor-pointer`} onClick={() => onNavigate(target)}>
                    <div className="flex justify-between items-start mb-6">
                        <div className={`p-4 rounded-2xl shadow-inner ${color}`}><Icon size={28}/></div>
                        <ChevronRight size={20} className={`${widget.id === 'access' ? 'text-white/20' : 'text-slate-300'} group-hover:translate-x-2 transition-transform`}/>
                    </div>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${widget.id === 'access' ? 'text-indigo-400' : 'text-slate-400'}`}>{sub}</p>
                        <h3 className={`font-black tracking-tighter leading-tight ${widget.id === 'access' ? 'text-3xl text-white' : 'text-4xl text-slate-800'}`}>{val}</h3>
                        <p className={`mt-4 text-[9px] font-black uppercase tracking-widest ${widget.id === 'access' ? 'text-indigo-300 opacity-60' : 'text-indigo-600'}`}>{widget.detail} →</p>
                    </div>
                </div>
            );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {enabledWidgets.find(w => w.id === 'notices') && (
            <div className={`${enabledWidgets.find(w => w.id === 'chat') ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm`}>
                <h4 className="text-xl font-black text-slate-800 uppercase tracking-tightest mb-8 flex items-center gap-3"><Landmark size={24} className="text-indigo-600"/> Mural da Unidade</h4>
                <div className="space-y-4">
                    {data?.recentNotices?.length > 0 ? data.recentNotices.map((n: any) => (
                    <div key={n.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-indigo-50 transition-all">
                        <div className="flex justify-between items-start">
                        <h5 className="font-black text-slate-800 text-sm uppercase">{n.title}</h5>
                        <span className="text-[8px] font-black text-slate-400">{new Date(n.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 line-clamp-2">{n.content}</p>
                    </div>
                    )) : (
                    <div className="py-10 text-center text-slate-300 font-black uppercase text-xs tracking-widest italic">Nenhum aviso no mural.</div>
                    )}
                </div>
            </div>
        )}
        
        {enabledWidgets.find(w => w.id === 'chat') && (
            <div className={`${enabledWidgets.find(w => w.id === 'notices') ? 'lg:col-span-5' : 'lg:col-span-12'} bg-indigo-600 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between group cursor-pointer`} onClick={() => onNavigate('neural_chat')}>
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-30 transition-all scale-150 rotate-12"><Brain size={120}/></div>
                <div className="relative z-10">
                    <Sparkles size={40} className="mb-6 animate-pulse"/>
                    <h4 className="text-4xl font-black uppercase tracking-tightest leading-tight">Advisor IA <br/> Residente</h4>
                    <p className="text-indigo-200 text-sm mt-4 max-w-xs font-medium uppercase italic leading-relaxed">
                        {enabledWidgets.find(w => w.id === 'chat')?.detail}
                    </p>
                </div>
                <button className="mt-10 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl self-start">Abrir Chatbot →</button>
            </div>
        )}
      </div>

      {/* RESET PASSWORD MODAL */}
      {isResetModalOpen && (
        <div className="sie-editor-overlay">
          <div className="sie-modal-container !h-auto !max-w-md self-center">
            <form onSubmit={handleUpdatePassword}>
              <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                <div className="flex items-center gap-5">
                  <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl"><Lock size={22}/></div>
                  <h4 className="font-black text-xl tracking-tight uppercase leading-none">Minha Credencial</h4>
                </div>
                <button type="button" onClick={() => setIsResetModalOpen(false)} className="p-2 text-slate-400 hover:text-white transition-all"><X size={28}/></button>
              </div>
              <div className="p-10 space-y-8 bg-[#fdfdfe]">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Nova Senha</label>
                  <input type="password" required className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6" value={newPass} onChange={e => setNewPass(e.target.value)} />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Confirmar</label>
                  <input type="password" required className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
                </div>
                <button type="submit" className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all">Sincronizar Senha</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentDashboard;

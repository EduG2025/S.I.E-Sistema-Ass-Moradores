import React, { useState, useEffect } from 'react';
import { Notice, User, SystemInfo } from '../types';
import { communicationService, userService, api } from '../services/api';
import { 
    MessageSquare, Clock, Plus, Trash2, Edit2, X, Save, Loader2, 
    Megaphone, MessageCircle, Send, Users, Shield, AlertTriangle,
    Info, ChevronRight, Share2, CheckCircle2, UserCheck, Smartphone, Search, Zap
} from 'lucide-react';

interface CommunicationProps {
  systemInfo?: SystemInfo;
}

const Communication = ({ systemInfo }: CommunicationProps) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWABroadcastOpen, setIsWABroadcastOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Partial<Notice> | null>(null);

  // WhatsApp Broadcast V2.5 State
  const [waType, setWaType] = useState<'ROLE' | 'USER' | 'DIRECT'>('ROLE');
  const [waMessage, setWaMessage] = useState('');
  const [waTargetRole, setWaTargetRole] = useState('ALL');
  const [waTargetUserId, setWaTargetUserId] = useState('');
  const [waDirectNumber, setWaDirectNumber] = useState('55');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
      try {
          setIsLoading(true);
          const [noticesRes, usersRes] = await Promise.all([
              communicationService.getNotices(),
              userService.getAll(1, 500) // Pega a base para o seletor
          ]);
          setNotices(noticesRes.data?.data || (Array.isArray(noticesRes.data) ? noticesRes.data : []));
          setUsers(usersRes.data?.data || []);
      } catch (e) {
          setNotices([]);
      } finally { setIsLoading(false); }
  };

  const handleSendWABroadcast = async () => {
      if (!waMessage.trim()) return alert("O corpo da mensagem não pode estar vazio.");
      
      const confirmMsg = waType === 'ROLE' ? `Disparar para ${waTargetRole}?` : 
                         waType === 'USER' ? `Enviar para o membro selecionado?` : 
                         `Enviar para o número ${waDirectNumber}?`;

      if (!confirm(`🚀 Kernel SRE: ${confirmMsg}`)) return;
      
      setIsSaving(true);
      try {
          const payload = {
              message: waMessage,
              targetType: waType,
              targetRole: waTargetRole,
              userId: waTargetUserId,
              directNumber: waDirectNumber.replace(/\D/g, ''),
              // SRE PROTOCOL V2.7: Hierarquia de Identidade Solicitada
              footer: systemInfo?.shortName || systemInfo?.whatsapp_config?.footer || 'shortName'
          };
          await api.post('/communication/whatsapp-broadcast', payload);
          alert("✅ Protocolo de envio processado pelo Gateway.");
          setIsWABroadcastOpen(false);
          setWaMessage('');
      } catch (e) {
          alert("🛑 Falha no Gateway: Verifique as configurações da JennyAI em 'Settings'.");
      } finally { setIsSaving(false); }
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice?.title || !editingNotice?.content) return;
    setIsSaving(true);
    try {
        if (editingNotice.id) await communicationService.updateNotice(editingNotice.id, editingNotice);
        else await communicationService.sendNotice(editingNotice);
        setIsModalOpen(false);
        setEditingNotice(null);
        loadData();
    } finally { setIsSaving(false); }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in pb-12 h-full relative">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shrink-0 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="relative z-10 flex items-center gap-5">
                <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl"><Megaphone size={28}/></div>
                <div>
                    <h2 className="text-3xl font-black tracking-tighter leading-none uppercase">Mural Broadcast</h2>
                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2">Comunicação Ativa e Soberana V2.5</p>
                </div>
            </div>
            <div className="flex gap-4 relative z-10">
                <button onClick={() => { loadData(); setIsWABroadcastOpen(true); }} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-50 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all flex items-center gap-3 active:scale-95">
                    <MessageCircle size={18}/> Disparar WhatsApp
                </button>
                <button 
                  onClick={() => { 
                    setEditingNotice({ title: '', content: '', urgency: 'LOW', date: new Date().toISOString().split('T')[0] }); 
                    setIsModalOpen(true); 
                  }} 
                  className="px-8 py-4 bg-white text-slate-950 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-2 active:scale-95"
                >
                    <Plus size={18}/> Novo Comunicado
                </button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40}/></div> : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {notices.map(notice => (
                        <div key={notice.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col min-h-[320px]">
                            <div className={`absolute top-0 left-0 w-2.5 h-full ${notice.urgency === 'HIGH' ? 'bg-rose-500' : notice.urgency === 'MEDIUM' ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex gap-3">
                                    <span className={`px-4 py-1 rounded-xl text-[9px] font-black uppercase border ${notice.urgency === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>Urgência: {notice.urgency}</span>
                                    <span className="px-4 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-[9px] font-black uppercase">SRE ID: #{notice.id}</span>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                    <button onClick={() => { setEditingNotice(notice); setIsModalOpen(true); }} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm"><Edit2 size={18}/></button>
                                    <button onClick={async () => { if(confirm("Deseja remover este aviso do mural?")) { await communicationService.deleteNotice(notice.id); loadData(); } }} className="p-3 bg-white border border-slate-100 text-slate-300 hover:text-rose-600 rounded-xl shadow-sm"><Trash2 size={18}/></button>
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4 leading-tight">{notice.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed mb-10 line-clamp-5 uppercase text-xs flex-1">{notice.content}</p>
                            <div className="pt-6 border-t border-slate-50 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <div className="flex items-center gap-2"><Clock size={14}/> {new Date(notice.date).toLocaleDateString('pt-BR')}</div>
                                <button className="text-indigo-600 hover:translate-x-1 transition-transform flex items-center gap-2">Protocolo Completo <ChevronRight size={14}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* --- MODAL: BROADCAST WHATSAPP V2.5 --- */}
        {isWABroadcastOpen && (
            <div className="sie-editor-overlay">
                <div className="sie-modal-container !h-auto !max-w-3xl self-center">
                    <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                        <div className="flex items-center gap-5">
                            <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl shadow-indigo-600/20"><MessageCircle size={22}/></div>
                            <div>
                                <h3 className="font-black text-xl uppercase tracking-tighter leading-none">WhatsApp Messenger V2.5</h3>
                                <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">Segmentação Cirúrgica SRE</p>
                            </div>
                        </div>
                        <button onClick={() => setIsWABroadcastOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24} /></button>
                    </div>

                    <div className="p-10 space-y-8 bg-[#fdfdfe]">
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200 shadow-inner">
                            <button onClick={() => setWaType('ROLE')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${waType === 'ROLE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}>
                                <Users size={14}/> Por Cargo
                            </button>
                            <button onClick={() => setWaType('USER')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${waType === 'USER' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}>
                                <UserCheck size={14}/> Indivíduo
                            </button>
                            <button onClick={() => setWaType('DIRECT')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${waType === 'DIRECT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}>
                                <Smartphone size={14}/> Número Direto
                            </button>
                        </div>

                        <div className="space-y-4 animate-fade-in">
                            {waType === 'ROLE' && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {['ALL', 'ADMIN', 'RESIDENT', 'SINDIC'].map(r => (
                                        <button key={r} onClick={() => setWaTargetRole(r)} className={`py-4 rounded-xl text-[9px] font-black uppercase border transition-all ${waTargetRole === r ? 'bg-indigo-50 border-indigo-600 text-indigo-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>{r}</button>
                                    ))}
                                </div>
                            )}

                            {waType === 'USER' && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Search size={12}/> Selecionar Membro do Cluster</label>
                                    <select value={waTargetUserId} onChange={e => setWaTargetUserId(e.target.value)} className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 focus:bg-white focus:border-indigo-500 transition-all shadow-inner outline-none uppercase text-xs">
                                        <option value="">-- ESCOLHA UM MORADOR NO BANCO --</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} (Unid. {u.unit || 'N/A'}) - {u.phone || 'SEM TEL'}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {waType === 'DIRECT' && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Smartphone size={12}/> Inserir WhatsApp Manual</label>
                                    <input 
                                        className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-xl focus:bg-white focus:border-indigo-500 transition-all shadow-inner outline-none" 
                                        placeholder="55119XXXXXXXX" 
                                        value={waDirectNumber}
                                        onChange={e => setWaDirectNumber(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-end px-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Corpo da Mensagem</label>
                                <span className="text-[9px] font-bold text-indigo-400 uppercase bg-indigo-50 px-2 py-0.5 rounded">Variável: {`{nome}`}</span>
                            </div>
                            <textarea 
                              rows={5} 
                              className="w-full font-medium bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-lg focus:bg-white focus:border-indigo-500 transition-all shadow-inner uppercase leading-relaxed outline-none" 
                              placeholder="Olá {nome}, informamos que..." 
                              value={waMessage} 
                              onChange={e => setWaMessage(e.target.value)} 
                            />
                        </div>

                        {/* RÓTULO DE ASSINATURA SRE - INTEGRADO COM SIGLA DO DB */}
                        <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex items-start gap-5 shadow-sm">
                            <div className="p-2.5 bg-white rounded-xl text-indigo-600 shadow-sm border border-indigo-200"><Zap size={20} className="animate-pulse"/></div>
                            <div>
                                <p className="text-[11px] font-black text-indigo-950 uppercase leading-none">whatsapp Rodapé de Assinatura</p>
                                <p className="text-[10px] text-indigo-600 font-bold uppercase leading-relaxed mt-2 flex items-center gap-2">
                                    Assinado como: <span className="bg-indigo-600 text-white px-2 py-0.5 rounded font-black tracking-widest">{systemInfo?.shortName || systemInfo?.whatsapp_config?.footer || 'shortName'}</span>
                                </p>
                                <p className="text-[8px] text-indigo-400 font-black uppercase mt-1 tracking-widest opacity-80">( REGISTRADO EM SETTINGS NO BANCO DE DADOS )</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t bg-slate-50 flex justify-end gap-6 rounded-b-[2.5rem]">
                        <button onClick={() => setIsWABroadcastOpen(false)} className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600">Abortar</button>
                        <button 
                            onClick={handleSendWABroadcast} 
                            disabled={isSaving || !waMessage.trim() || (waType === 'USER' && !waTargetUserId) || (waType === 'DIRECT' && waDirectNumber.length < 12)} 
                            className="px-14 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl flex items-center gap-4 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-30"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>} Commitar Envio
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- MODAL: NOVO AVISO / EDIÇÃO --- */}
        {isModalOpen && editingNotice && (
            <div className="sie-editor-overlay">
                <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                    <form onSubmit={handleSaveNotice}>
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                            <div className="flex items-center gap-5">
                                <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl shadow-indigo-600/20"><Plus size={22}/></div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter leading-none">{editingNotice.id ? 'Editar Aviso' : 'Protocolar Aviso'}</h3>
                                    <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">Gestão de Mural Comunitário</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => { setIsModalOpen(false); setEditingNotice(null); }} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24} /></button>
                        </div>
                        <div className="p-10 space-y-8 bg-[#fdfdfe]">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Título do Comunicado</label>
                                <input required className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 text-xl focus:bg-white focus:border-indigo-500 transition-all shadow-inner outline-none uppercase placeholder:text-slate-300" placeholder="Ex: Manutenção Elétrica - Bloco A" value={editingNotice.title} onChange={e => setEditingNotice({...editingNotice, title: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Grau de Urgência</label>
                                    <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 appearance-none uppercase text-xs focus:bg-white focus:border-indigo-500 shadow-sm" value={editingNotice.urgency} onChange={e => setEditingNotice({...editingNotice, urgency: e.target.value as any})}>
                                        <option value="LOW">Informativo / Baixa</option>
                                        <option value="MEDIUM">Importante / Média</option>
                                        <option value="HIGH">Urgente / Crítica</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Data do Aviso</label>
                                    <input type="date" className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xs focus:bg-white focus:border-indigo-500 shadow-sm" value={editingNotice.date} onChange={e => setEditingNotice({...editingNotice, date: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Corpo do Aviso</label>
                                <textarea 
                                    rows={5} 
                                    required 
                                    className="w-full font-medium bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-sm focus:bg-white focus:border-indigo-500 transition-all shadow-inner uppercase outline-none leading-relaxed" 
                                    placeholder="Descreva as instruções ou informações detalhadas para a comunidade..."
                                    value={editingNotice.content} 
                                    onChange={e => setEditingNotice({...editingNotice, content: e.target.value})} 
                                />
                            </div>
                        </div>
                        <div className="p-8 border-t bg-slate-50 flex justify-end gap-6 rounded-b-[2.5rem]">
                            <button type="button" onClick={() => { setIsModalOpen(false); setEditingNotice(null); }} className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Abortar</button>
                            <button type="submit" disabled={isSaving} className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl flex items-center gap-4 hover:bg-indigo-600 transition-all active:scale-95">
                                {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} {editingNotice.id ? 'Sincronizar' : 'Publicar'} Aviso
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Communication;
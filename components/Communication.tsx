
import React, { useState, useEffect } from 'react';
import { Notice } from '../types';
import { communicationService, api } from '../services/api';
import { 
    MessageSquare, Clock, Plus, Trash2, Edit2, X, Save, Loader2, 
    Megaphone, MessageCircle, Send, Users, Shield, AlertTriangle,
    Info, ChevronRight, Share2, CheckCircle2
} from 'lucide-react';

const Communication = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWABroadcastOpen, setIsWABroadcastOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Partial<Notice> | null>(null);

  // WhatsApp Broadcast State
  const [waMessage, setWaMessage] = useState('');
  const [waTarget, setWaTarget] = useState<'ALL' | 'SINDIC'>('ALL');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
      try {
          setIsLoading(true);
          const res = await communicationService.getNotices();
          const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
          setNotices(data);
      } catch (e) {
          setNotices([]);
      } finally { setIsLoading(false); }
  };

  const handleSendWABroadcast = async () => {
      if (!waMessage.trim()) return alert("O corpo da mensagem não pode estar vazio.");
      if (!confirm(`Confirmar disparo de WhatsApp para segmentação: ${waTarget === 'ALL' ? 'TODOS' : 'SÍNDICOS'}?`)) return;
      
      setIsSaving(true);
      try {
          await api.post('/communication/whatsapp-broadcast', { message: waMessage, targetRole: waTarget });
          alert("🚀 Kernel SRE: Ciclo de broadcast iniciado com sucesso.");
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
        if (editingNotice.id) {
            await communicationService.updateNotice(editingNotice.id, editingNotice);
        } else {
            await communicationService.sendNotice(editingNotice);
        }
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
                <button onClick={() => setIsWABroadcastOpen(true)} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all flex items-center gap-3 active:scale-95">
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
                    {notices.length === 0 && (
                        <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <Megaphone size={40} className="text-slate-100"/>
                             </div>
                             <p className="font-black uppercase text-[12px] text-slate-400 tracking-[0.5em]">Log de Comunicações Vazio.</p>
                             <p className="text-[10px] text-slate-300 font-bold uppercase mt-4">Inicie um novo broadcast para os moradores.</p>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* --- MODAL: BROADCAST WHATSAPP --- */}
        {isWABroadcastOpen && (
            <div className="sie-editor-overlay">
                <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                    <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                        <div className="flex items-center gap-5">
                            <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl shadow-indigo-600/20"><MessageCircle size={22}/></div>
                            <div>
                                <h3 className="font-black text-xl uppercase tracking-tighter leading-none">WhatsApp Broadcast</h3>
                                <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">Interface de Disparo JennyAI</p>
                            </div>
                        </div>
                        <button onClick={() => setIsWABroadcastOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24} /></button>
                    </div>

                    <div className="p-10 space-y-8 bg-[#fdfdfe]">
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Segmentação de Destino</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setWaTarget('ALL')} className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-3 border-2 ${waTarget === 'ALL' ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.02]' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white'}`}>
                                    <Users size={16}/> Todos Membros
                                </button>
                                <button onClick={() => setWaTarget('SINDIC')} className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-3 border-2 ${waTarget === 'SINDIC' ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.02]' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white'}`}>
                                    <Shield size={16}/> Apenas Síndicos
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-end px-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Script da Mensagem</label>
                                <span className="text-[9px] font-bold text-indigo-400 uppercase bg-indigo-50 px-2 py-0.5 rounded">Variável: {`{nome}`}</span>
                            </div>
                            <textarea 
                              rows={6} 
                              className="w-full font-medium bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-lg focus:bg-white focus:border-indigo-500 transition-all shadow-inner uppercase leading-relaxed outline-none" 
                              placeholder="Olá {nome}, informamos que o protocolo S.I.E..." 
                              value={waMessage} 
                              onChange={e => setWaMessage(e.target.value)} 
                            />
                        </div>

                        <div className="p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-start gap-5 shadow-sm">
                            <div className="p-2.5 bg-white rounded-xl text-amber-500 shadow-sm border border-amber-100"><AlertTriangle size={20}/></div>
                            <div>
                                <p className="text-[11px] font-black text-amber-900 uppercase leading-none">Aviso de Integridade SRE</p>
                                <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed mt-2 italic opacity-80">O Kernel processará o disparo em lotes de cadência variável para evitar flags de SPAM e preservar a reputação do Sender ID.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t bg-slate-50 flex justify-end gap-6 rounded-b-[2.5rem]">
                        <button onClick={() => setIsWABroadcastOpen(false)} className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600">Abortar</button>
                        <button onClick={handleSendWABroadcast} disabled={isSaving || !waMessage.trim()} className="px-14 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl flex items-center gap-4 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-30">
                            {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>} Iniciar Broadcast
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

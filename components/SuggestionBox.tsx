
import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Send, Loader2, X, Trash2, Edit2, Heart, AlertTriangle, CircleCheck } from 'lucide-react';
import api from '../services/api';

const SuggestionBox = () => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState({ title: '', content: '', category: 'SUGGESTION' });

  useEffect(() => { loadSuggestions(); }, []);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/suggestions');
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setSuggestions(data);
    } catch (e) {
      setSuggestions([]);
    } finally { setIsLoading(false); }
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/suggestions', newSuggestion);
      setIsModalOpen(false);
      setNewSuggestion({ title: '', content: '', category: 'SUGGESTION' });
      loadSuggestions();
    } catch (err) {
        alert("Erro ao enviar sugestão.");
    } finally { setIsSaving(false); }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
      try {
          await api.put(`/suggestions/${id}`, { status: currentStatus === 'RESOLVED' ? 'OPEN' : 'RESOLVED' });
          loadSuggestions();
      } catch (err) {
          alert("Falha ao atualizar status.");
      }
  };

  const handleDelete = async (id: number) => {
      if (!confirm("Remover esta manifestação?")) return;
      try {
          await api.delete(`/suggestions/${id}`);
          loadSuggestions();
      } catch (err) {
          alert("Falha ao excluir.");
      }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">Ouvidoria Digital</h2>
          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">Canal Direto de Co-Gestão S.I.E</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2">
            <Plus size={18}/> Nova Sugestão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? <div className="col-span-full p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={48}/></div> : 
         suggestions.map(s => (
            <div key={s.id} className={`bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm group relative ${s.status === 'RESOLVED' ? 'opacity-60 bg-slate-50 border-dashed' : ''}`}>
                <div className="absolute top-6 right-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleToggleStatus(s.id, s.status)} className={`p-2 rounded-lg ${s.status === 'RESOLVED' ? 'text-amber-500' : 'text-emerald-500'}`} title="Concluir">
                        <CircleCheck size={18}/>
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-2 text-rose-400" title="Excluir"><Trash2 size={18}/></button>
                </div>
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{s.category}</span>
                    {s.status === 'RESOLVED' && <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border">Finalizado</span>}
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{s.title}</h3>
                <p className="text-sm text-slate-500 mt-4 line-clamp-3 font-medium leading-relaxed">{s.content}</p>
            </div>
        ))}
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/95 z-[2000] flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in">
              <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/10 animate-scale-in">
                  <form onSubmit={handleSave}>
                      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                          <h3 className="font-black text-2xl tracking-tighter">Enviar Manifestação</h3>
                          <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={24}/></button>
                      </div>
                      <div className="p-10 space-y-6">
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Título</label><input required className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6" value={newSuggestion.title} onChange={e => setNewSuggestion({...newSuggestion, title: e.target.value})} /></div>
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Mensagem Detalhada</label><textarea rows={5} className="w-full font-medium bg-slate-50 border-slate-200 rounded-2xl p-6" value={newSuggestion.content} onChange={e => setNewSuggestion({...newSuggestion, content: e.target.value})} /></div>
                      </div>
                      <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                          <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-xs uppercase">Cancelar</button>
                          <button type="submit" disabled={isSaving} className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-3">
                              {isSaving ? <Loader2 className="animate-spin"/> : <Send size={18}/>} Enviar
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default SuggestionBox;

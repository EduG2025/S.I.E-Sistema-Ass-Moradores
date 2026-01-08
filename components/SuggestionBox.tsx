import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Send, Loader2, Search, X, CheckCircle, AlertTriangle, ShieldCheck, Heart, Trash2, Edit2, Save, Sparkles, ThumbsUp } from 'lucide-react';
import api from '../services/api';

// FIX: Added missing ThumbsUp to imports and completed truncated component logic and JSX
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
      setSuggestions(res.data);
    } finally { setIsLoading(false); }
  };

  // FIX: Use any to bypass namespace 'React' error
  const handleSave = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/suggestions', newSuggestion);
      setIsModalOpen(false);
      setNewSuggestion({ title: '', content: '', category: 'SUGGESTION' });
      loadSuggestions();
    } finally { setIsSaving(false); }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVO': return <Heart className="text-emerald-500" size={16} />;
      case 'NEGATIVO': return <AlertTriangle className="text-rose-500" size={16} />;
      default: return <MessageSquare className="text-slate-400" size={16} />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">Ouvidoria Digital</h2>
          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">Canal Direto de Co-Gestão S.I.E</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-500 shadow-xl transition-all flex items-center gap-2">
            <Plus size={18}/> Nova Sugestão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? <div className="col-span-full p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={48}/></div> : 
         suggestions.map(s => (
            <div key={s.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative">
                <div className="flex items-center gap-3 mb-6">
                    {getSentimentIcon(s.sentiment || 'NEUTRO')}
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{s.category}</span>
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{s.title}</h3>
                <p className="text-sm text-slate-500 mt-4 line-clamp-3 font-medium leading-relaxed flex-1">{s.content}</p>
                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase">{new Date(s.created_at).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-indigo-600"><ThumbsUp size={16}/></button>
                        <span className="text-xs font-bold text-slate-400">{s.upvotes || 0}</span>
                    </div>
                </div>
            </div>
        ))}
        {!isLoading && suggestions.length === 0 && <div className="col-span-full py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center text-slate-300 font-black uppercase text-xs tracking-widest">Nenhuma sugestão enviada.</div>}
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
              <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-scale-in">
                  <form onSubmit={handleSave}>
                      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                          <h3 className="font-black text-2xl tracking-tighter">Enviar Sugestão</h3>
                          <button type="button" onClick={() => setIsModalOpen(false)}><X/></button>
                      </div>
                      <div className="p-10 space-y-6">
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Título</label><input required className="w-full font-bold" value={newSuggestion.title} onChange={e => setNewSuggestion({...newSuggestion, title: e.target.value})} /></div>
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Categoria</label>
                              <select className="w-full font-bold" value={newSuggestion.category} onChange={e => setNewSuggestion({...newSuggestion, category: e.target.value})}>
                                  <option value="SUGGESTION">Sugestão</option><option value="COMPLAINT">Reclamação</option><option value="PRAISE">Elogio</option>
                              </select>
                          </div>
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Conteúdo</label><textarea rows={5} className="w-full font-medium" value={newSuggestion.content} onChange={e => setNewSuggestion({...newSuggestion, content: e.target.value})} /></div>
                      </div>
                      <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                          <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-xs uppercase">Cancelar</button>
                          <button type="submit" disabled={isSaving} className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-3">
                              {isSaving ? <Loader2 className="animate-spin"/> : <Send size={18}/>} Enviar para Ouvidoria
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

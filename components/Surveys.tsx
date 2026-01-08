
import React, { useState, useEffect } from 'react';
import { Survey } from '../types';
import { surveyService } from '../services/api';
import { Plus, X, Trash2, Edit2, Loader2, Sparkles, Save, Info } from 'lucide-react';

const Surveys = () => {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingSurvey, setEditingSurvey] = useState<any>(null);

    useEffect(() => { loadSurveys(); }, []);

    const loadSurveys = async () => {
        setIsLoading(true);
        try { 
            const res = await surveyService.getAll(); 
            setSurveys(res.data?.data || []); 
        } finally { setIsLoading(false); }
    };

    const handleOpenCreate = () => {
        setEditingSurvey({ title: '', description: '', type: 'CENSUS', questions: [] });
        setIsModalOpen(true);
    };

    // FIX: Use any to bypass namespace 'React' error
    const handleSave = async (e: any) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingSurvey.id) {
                await surveyService.update(editingSurvey.id, editingSurvey);
            } else {
                await surveyService.create(editingSurvey);
            }
            setIsModalOpen(false);
            loadSurveys();
        } finally { setIsSaving(false); }
    };

    const handleDelete = async (id: number | string) => {
        if (!confirm("Remover este formulário permanentemente?")) return;
        try {
            await surveyService.delete(id);
            loadSurveys();
        } catch (e) { alert("Erro ao excluir."); }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter">Censo & Inteligência Social</h2>
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">Kernel Coleta de Dados Ativa</p>
                </div>
                <button onClick={handleOpenCreate} className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-500 shadow-xl transition-all flex items-center gap-2">
                    <Plus size={18}/> Novo Formulário
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoading ? <div className="col-span-full p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={48}/></div> : 
                 surveys.map(s => (
                    <div key={s.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative">
                        <div className="absolute top-6 right-6 flex gap-2">
                            <button onClick={() => { setEditingSurvey(s); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={16}/></button>
                            <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16}/></button>
                        </div>
                        <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded-lg w-fit border border-indigo-100">{s.type}</span>
                        <h3 className="text-2xl font-black text-slate-800 mt-6 tracking-tight">{s.title}</h3>
                        <p className="text-sm text-slate-500 mt-4 line-clamp-3 font-medium leading-relaxed flex-1">{s.description}</p>
                        <div className="mt-10 pt-6 border-t border-slate-50 flex gap-4">
                            <button className="flex-1 py-4 bg-slate-900 text-white font-black text-[10px] uppercase rounded-2xl shadow-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                                <Sparkles size={14}/> Resultados
                            </button>
                            <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-indigo-600 transition-all"><Info size={20}/></button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-scale-in">
                        <form onSubmit={handleSave}>
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="font-black text-2xl tracking-tighter">Configurar Pesquisa</h3>
                                <button type="button" onClick={() => setIsModalOpen(false)}><X/></button>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Título</label><input required className="w-full font-bold" value={editingSurvey.title} onChange={e => setEditingSurvey({...editingSurvey, title: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descrição</label><textarea rows={3} className="w-full font-medium" value={editingSurvey.description} onChange={e => setEditingSurvey({...editingSurvey, description: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tipo de Censo</label>
                                    <select className="w-full font-bold" value={editingSurvey.type} onChange={e => setEditingSurvey({...editingSurvey, type: e.target.value})}>
                                        <option value="CENSUS">Identidade Comunitária</option><option value="SOCIAL">Assistência Social</option><option value="COMMERCIAL">Perfil Empreendedor</option><option value="POLL">Votação</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-xs uppercase">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-3">
                                    {isSaving ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Commitar Pesquisa
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Surveys;

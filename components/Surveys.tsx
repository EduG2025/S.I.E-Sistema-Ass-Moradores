
import React, { useState, useEffect } from 'react';
import { Survey, SurveyQuestion } from '../types';
import { surveyService } from '../services/api';
import {
    Plus, X, Trash2, Edit2, Loader2, Save,
    Share2, Link, Eye, Layout, Shield, Info, Heart, Brain, Activity, Settings2, Zap, Target
} from 'lucide-react';

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
            const rawData = res.data?.data || res.data;
            setSurveys(Array.isArray(rawData) ? rawData : []);
        } catch (err) { setSurveys([]); } 
        finally { setIsLoading(false); }
    };

    const handleCopyLink = (id: string | number) => {
        const url = `${window.location.origin}/census/${id}`;
        navigator.clipboard.writeText(url);
        alert("✅ Link público copiado para clipboard.");
    };

    const handleOpenCreate = () => {
        setEditingSurvey({ title: '', description: 'Coleta de dados demográficos S.I.E', type: 'CENSUS', questions: [], status: 'ACTIVE' });
        setIsModalOpen(true);
    };

    const handleSave = async (e: any) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!editingSurvey?.title) return alert("Defina um título.");
        setIsSaving(true);
        try {
            const payload = { ...editingSurvey };
            delete payload.created_at; delete payload.updated_at;
            payload.questions = (payload.questions || []).map((q: any) => {
                const { id, ...cleanQ } = q;
                const finalQ = typeof q.id === 'string' && q.id.startsWith('new_') ? cleanQ : { ...q };
                return { ...finalQ, required: q.required ? 1 : 0 };
            });
            if (payload.id && !String(payload.id).startsWith('temp_')) { await surveyService.update(payload.id, payload); } 
            else { delete payload.id; await surveyService.create(payload); }
            setIsModalOpen(false);
            loadSurveys();
        } catch (err: any) { alert("Erro de rede ao comitar protocolo."); } 
        finally { setIsSaving(false); }
    };

    const addQuestion = () => {
        const newQuestion: any = { id: `new_${Date.now()}`, text: '', type: 'text', options: [], mapping_tag: 'VULNERABILITY', required: 0 };
        setEditingSurvey({ ...editingSurvey, questions: [...(editingSurvey?.questions || []), newQuestion] });
    };

    const removeQuestion = (index: number) => {
        const qs = [...(editingSurvey?.questions || [])]; qs.splice(index, 1);
        setEditingSurvey({ ...editingSurvey, questions: qs });
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const qs = [...(editingSurvey?.questions || [])];
        if (qs[index]) { qs[index] = { ...qs[index], [field]: value }; setEditingSurvey({ ...editingSurvey, questions: qs }); }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-fade-in h-full relative">
            <div className="flex flex-row justify-between items-center bg-slate-900 p-4 rounded-2xl text-white shadow-lg shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg"><Layout size={18}/></div>
                    <div>
                        <h2 className="text-base font-black tracking-tight uppercase leading-none">Censo & Pesquisas</h2>
                        <p className="text-indigo-400 text-[8px] font-black uppercase tracking-widest mt-1">Social Architecture V22.4</p>
                    </div>
                </div>
                <button onClick={handleOpenCreate} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg"><Plus size={14} /> Novo Formulário</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-2">
                {isLoading ? <div className="p-10 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" /></div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {surveys.map(s => (
                            <div key={String(s.id)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col h-fit relative">
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleCopyLink(s.id)} className="p-2 text-slate-400 hover:text-emerald-600"><Share2 size={14} /></button>
                                    <button onClick={() => { setEditingSurvey(s); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 size={14} /></button>
                                    <button onClick={async () => { if(confirm("Excluir?")) { await surveyService.delete(s.id); loadSurveys(); } }} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded border border-indigo-100">{s.type}</span>
                                    <span className={`px-2 py-0.5 ${s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} text-[8px] font-black uppercase rounded border border-emerald-100`}>{s.status}</span>
                                </div>
                                <h3 className="text-xs font-black text-slate-800 truncate">{s.title || 'Sem Título'}</h3>
                                <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase line-clamp-2">{s.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && editingSurvey && (
                <div className="sie-editor-overlay">
                    <div className="h-16 px-8 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-lg relative z-20">
                        <div className="flex items-center gap-4">
                            <Brain size={24} className="text-indigo-400"/>
                            <h3 className="font-black text-xs uppercase tracking-[0.2em]">Arquiteto de Protocolo Social</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={handleSave} disabled={isSaving} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl">
                                {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} Commitar Protocolo
                            </button>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-400 transition-all ml-2"><X size={32}/></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar bg-[#fcfcfd]">
                        <div className="max-w-7xl mx-auto space-y-16 pb-10">
                            <section className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none"><Layout size={200}/></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.3em]">Título do Protocolo</label><input className="w-full font-black h-16 bg-slate-50 border-slate-200 rounded-3xl px-8 text-xl shadow-inner focus:bg-white focus:border-indigo-500 transition-all" value={editingSurvey.title} onChange={e => setEditingSurvey({ ...editingSurvey, title: e.target.value })} /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.3em]">Motor de Análise</label>
                                        <select className="w-full font-black h-16 bg-slate-50 border-slate-200 rounded-3xl px-8 text-sm uppercase shadow-inner appearance-none focus:bg-white focus:border-indigo-500" value={editingSurvey.type} onChange={e => setEditingSurvey({ ...editingSurvey, type: e.target.value })}>
                                            <option value="CENSUS">Censo Demográfico Geral</option><option value="SOCIAL_AID">Auxílio & ESG (Social)</option><option value="SATISFACTION">Engajamento Comunitário</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-10">
                                <div className="flex justify-between items-center px-4">
                                    <div>
                                        <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Engenharia de Atributos</h4>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Definição de campos para coleta de dados biográficos</p>
                                    </div>
                                    <button onClick={addQuestion} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-3 shadow-2xl active:scale-95"><Plus size={18} /> Novo Atributo</button>
                                </div>
                                <div className="space-y-6">
                                    {editingSurvey.questions?.map((q: any, qIdx: number) => (
                                        <div key={q.id || qIdx} className="p-10 bg-white rounded-[3rem] border border-slate-200 shadow-sm relative group hover:border-indigo-300 transition-all hover:shadow-xl">
                                            <button onClick={() => removeQuestion(qIdx)} className="absolute top-6 right-6 p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={20} /></button>
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                                                <div className="md:col-span-1 text-5xl font-black text-slate-100 group-hover:text-indigo-50 transition-colors">{qIdx + 1}</div>
                                                <div className="md:col-span-6 space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Definição da Pergunta</label><input className="w-full font-black h-14 bg-slate-50 border-slate-100 rounded-2xl px-6 text-sm group-hover:bg-white transition-all shadow-inner focus:border-indigo-400" value={q.text} onChange={e => updateQuestion(qIdx, 'text', e.target.value)} /></div>
                                                <div className="md:col-span-3 space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Formato de Entrada</label>
                                                    <select className="w-full font-black h-14 bg-slate-50 border-slate-100 rounded-2xl px-6 text-[10px] uppercase tracking-widest shadow-inner" value={q.type} onChange={e => updateQuestion(qIdx, 'type', e.target.value)}>
                                                        <option value="text">Texto Plano</option><option value="number">Valor Numérico</option><option value="boolean">Simulação Binária (Sim/Não)</option><option value="select">Seleção de Múltiplas Escolhas</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2"><button onClick={() => updateQuestion(qIdx, 'required', !q.required)} className={`w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all shadow-sm ${q.required ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{q.required ? 'Obrigatório' : 'Opcional'}</button></div>
                                            </div>
                                            {q.type === 'select' && (
                                                <div className="mt-8 pt-8 border-t border-slate-50 animate-fade-in"><label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Dicionário de Opções (Separar por Vírgula)</label><input className="w-full font-bold h-14 bg-slate-50 border-slate-100 rounded-2xl px-6 mt-3 shadow-inner" value={Array.isArray(q.options) ? q.options.join(', ') : ''} onChange={e => updateQuestion(qIdx, 'options', e.target.value.split(',').map((s: string) => s.trim()))} placeholder="Ex: Opção A, Opção B, Opção C..." /></div>
                                            )}
                                        </div>
                                    ))}
                                    {(!editingSurvey.questions || editingSurvey.questions.length === 0) && (
                                        <div className="py-24 text-center bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-200">
                                            <Zap size={64} className="mx-auto text-slate-200 mb-6 opacity-50" />
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Nenhum atributo definido no protocolo.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Surveys;

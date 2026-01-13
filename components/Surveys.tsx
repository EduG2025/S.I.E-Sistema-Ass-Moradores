
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
        } catch (err) {
            setSurveys([]);
        } finally { setIsLoading(false); }
    };

    const handleCopyLink = (id: string | number) => {
        const url = `${window.location.origin}/census/${id}`;
        navigator.clipboard.writeText(url);
        alert("✅ Link público copiado para clipboard.");
    };

    const handleOpenCreate = () => {
        setEditingSurvey({
            title: '',
            description: 'Coleta de dados demográficos S.I.E',
            type: 'CENSUS',
            questions: [],
            status: 'ACTIVE'
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: any) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!editingSurvey?.title) return alert("Defina um título.");
        setIsSaving(true);
        try {
            const payload = { ...editingSurvey };
            
            // SRE FIX: Sanitização de Payload para evitar Incorrect datetime value no MySQL
            delete payload.created_at;
            delete payload.updated_at;
            
            payload.questions = (payload.questions || []).map((q: any) => {
                const { id, ...cleanQ } = q;
                // Se o ID for temporário (String), removemos para o DB gerar um real
                const finalQ = typeof q.id === 'string' && q.id.startsWith('new_') ? cleanQ : { ...q };
                return { ...finalQ, required: q.required ? 1 : 0 };
            });

            if (payload.id && !String(payload.id).startsWith('temp_')) {
                await surveyService.update(payload.id, payload);
            } else {
                delete payload.id;
                await surveyService.create(payload);
            }
            setIsModalOpen(false);
            loadSurveys();
        } catch (err: any) {
            alert("Erro de rede ao comitar protocolo.");
        } finally { setIsSaving(false); }
    };

    const addQuestion = () => {
        const newQuestion: any = {
            id: `new_${Date.now()}`,
            text: '',
            type: 'text',
            options: [],
            mapping_tag: 'VULNERABILITY',
            required: 0
        };
        const currentQuestions = editingSurvey?.questions || [];
        setEditingSurvey({ ...editingSurvey, questions: [...currentQuestions, newQuestion] });
    };

    const removeQuestion = (index: number) => {
        const qs = [...(editingSurvey?.questions || [])];
        qs.splice(index, 1);
        setEditingSurvey({ ...editingSurvey, questions: qs });
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const qs = [...(editingSurvey?.questions || [])];
        if (qs[index]) {
            qs[index] = { ...qs[index], [field]: value };
            setEditingSurvey({ ...editingSurvey, questions: qs });
        }
    };

    const ENGINE_CONFIG = {
        'CENSUS': { label: 'Censo Demográfico', color: 'text-indigo-600', icon: Shield },
        'SOCIAL_AID': { label: 'Auxílio & ESG', color: 'text-rose-600', icon: Heart },
        'SATISFACTION': { label: 'Engajamento', color: 'text-emerald-600', icon: Target }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-fade-in h-full relative">
            {/* Slim Header - Compacto */}
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

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                {isLoading ? <div className="p-10 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" /></div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

            {/* FIXED FULL-CANVAS ARCHITECT - Ocupa 100% da área útil */}
            {isModalOpen && editingSurvey && (
                <div className="fixed inset-y-0 right-0 z-[1000] bg-[#fcfcfd] flex flex-col animate-slide-left shadow-2xl transition-all duration-300" 
                     style={{ left: document.querySelector('aside')?.classList.contains('lg:w-24') ? '96px' : '288px' }}>
                    
                    <div className="h-14 px-6 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-lg">
                        <div className="flex items-center gap-3">
                            <Brain size={16} className="text-indigo-400"/>
                            <h3 className="font-black text-[10px] uppercase tracking-widest">Arquiteto de Protocolo</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2">
                                {isSaving ? <Loader2 className="animate-spin" size={12}/> : <Save size={12}/>} Commitar Protocolo
                            </button>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-400"><X size={20}/></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#fcfcfd]">
                        <div className="max-w-4xl mx-auto space-y-10 pb-20">
                            <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Título do Protocolo</label><input className="w-full font-bold h-12 bg-slate-50 border rounded-xl px-4" value={editingSurvey.title} onChange={e => setEditingSurvey({ ...editingSurvey, title: e.target.value })} /></div>
                                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Motor de Análise</label>
                                        <select className="w-full font-bold h-12 bg-slate-50 border rounded-xl px-4" value={editingSurvey.type} onChange={e => setEditingSurvey({ ...editingSurvey, type: e.target.value })}>
                                            <option value="CENSUS">Censo Demográfico</option><option value="SOCIAL_AID">Auxílio & ESG</option><option value="SATISFACTION">Engajamento</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex justify-between items-center px-2">
                                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Engenharia de Atributos</h4>
                                    <button onClick={addQuestion} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2"><Plus size={14} /> Novo Atributo</button>
                                </div>
                                <div className="space-y-4">
                                    {editingSurvey.questions?.map((q: any, qIdx: number) => (
                                        <div key={q.id || qIdx} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative group hover:border-indigo-200 transition-all">
                                            <button onClick={() => removeQuestion(qIdx)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-600"><Trash2 size={16} /></button>
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                                <div className="md:col-span-1 text-xl font-black text-slate-100">{qIdx + 1}</div>
                                                <div className="md:col-span-6 space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">Pergunta</label><input className="w-full font-bold h-10 bg-slate-50 border rounded-lg px-3" value={q.text} onChange={e => updateQuestion(qIdx, 'text', e.target.value)} /></div>
                                                <div className="md:col-span-3 space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">Formato</label>
                                                    <select className="w-full font-bold h-10 bg-slate-50 border rounded-lg px-3" value={q.type} onChange={e => updateQuestion(qIdx, 'type', e.target.value)}>
                                                        <option value="text">Texto</option><option value="number">Número</option><option value="boolean">Sim/Não</option><option value="select">Opções</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2"><button onClick={() => updateQuestion(qIdx, 'required', !q.required)} className={`w-full h-10 rounded-lg text-[8px] font-black uppercase transition-all ${q.required ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>{q.required ? 'Obrigatório' : 'Opcional'}</button></div>
                                            </div>
                                            {q.type === 'select' && (
                                                <div className="mt-4 pt-4 border-t border-slate-50"><label className="text-[8px] font-black text-indigo-400 uppercase">Opções (Separadas por vírgula)</label><input className="w-full font-bold h-10 bg-slate-50 border rounded-lg px-3 mt-1" value={Array.isArray(q.options) ? q.options.join(', ') : ''} onChange={e => updateQuestion(qIdx, 'options', e.target.value.split(',').map((s: string) => s.trim()))} /></div>
                                            )}
                                        </div>
                                    ))}
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

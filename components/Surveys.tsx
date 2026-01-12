
import React, { useState, useEffect, useMemo } from 'react';
import { Survey, SurveyQuestion } from '../types';
import { surveyService } from '../services/api';
import {
    Plus, X, Trash2, Edit2, Loader2, Save,
    Share2, BrainCircuit, Link, Eye, EyeOff, CheckCircle2, Layout, Shield, Info, Heart, Brain, Activity, Settings2, Zap, HelpCircle, Target
} from 'lucide-react';

const Surveys = () => {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingSurvey, setEditingSurvey] = useState<any>(null);

    useEffect(() => { loadSurveys(); }, []);

    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isModalOpen]);

    const loadSurveys = async () => {
        setIsLoading(true);
        try {
            const res = await surveyService.getAll();
            const rawData = res.data?.data || res.data;
            setSurveys(Array.isArray(rawData) ? rawData : []);
        } catch (err) {
            console.error("[SRE] Falha ao listar formulários", err);
            setSurveys([]);
        } finally { setIsLoading(false); }
    };

    const handleCopyLink = (id: string | number) => {
        const url = `${window.location.origin}/census/${id}`;
        navigator.clipboard.writeText(url);
        alert("✅ Link público copiado!");
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
            const payload = {
                ...editingSurvey,
                questions: (editingSurvey.questions || []).map((q: any) => {
                    const { id, ...cleanQ } = q;
                    return { ...cleanQ, required: q.required ? 1 : 0 };
                })
            };
            if (editingSurvey.id && !String(editingSurvey.id).startsWith('new_') && !String(editingSurvey.id).startsWith('temp_')) {
                await surveyService.update(editingSurvey.id, payload);
            } else {
                await surveyService.create(payload);
            }
            setIsModalOpen(false);
            loadSurveys();
        } catch (err: any) {
            alert("Erro ao salvar no Kernel.");
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

    const ENGINE_EXPLANATIONS = {
        'CENSUS': {
            label: 'Censo Demográfico (Soberano)',
            desc: 'Protocolo de alta criticidade. Altera o cadastro mestre do cidadão e atualiza o Smart Map.',
            icon: <Shield size={18} className="text-indigo-600" />
        },
        'SOCIAL_AID': {
            label: 'Auxílio & ESG',
            desc: 'Identifica necessidades de apoio social e segurança alimentar.',
            icon: <Heart size={18} className="text-rose-600" />
        },
        'SATISFACTION': {
            label: 'Pesquisa de Engajamento',
            desc: 'Analisa o sentimento da comunidade e gera relatórios de NPS.',
            icon: <Target size={18} className="text-emerald-600" />
        }
    };

    const currentEngine = (editingSurvey?.type || 'CENSUS') as keyof typeof ENGINE_EXPLANATIONS;

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in p-4 lg:p-6 overflow-hidden">
            <div className="flex justify-between items-center bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl shrink-0">
                <div>
                    <h2 className="text-xl font-black tracking-tightest uppercase leading-none">Censo & Pesquisas</h2>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1.5 opacity-80">Database Governança V22.4</p>
                </div>
                <button onClick={handleOpenCreate} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg"><Plus size={16} /> Novo Formulário</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12 overflow-y-auto flex-1 custom-scrollbar min-h-0">
                {isLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} /></div> : 
                    surveys.map(s => (
                        <div key={String(s.id)} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col h-fit relative">
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleCopyLink(s.id)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><Share2 size={14} /></button>
                                <button onClick={() => { setEditingSurvey(s); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={14} /></button>
                                <button onClick={async () => { if(confirm("Excluir?")) { await surveyService.delete(s.id); loadSurveys(); } }} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded border border-indigo-100">{s.type}</span>
                                <span className={`px-2 py-0.5 ${s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} text-[8px] font-black uppercase rounded border border-emerald-100`}>{s.status}</span>
                            </div>
                            <h3 className="text-base font-black text-slate-800 truncate">{s.title || 'Sem Título'}</h3>
                            <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">{s.description}</p>
                        </div>
                    ))
                }
            </div>

            {isModalOpen && editingSurvey && (
                <div className="fixed inset-0 w-full h-[100dvh] bg-slate-950/80 z-[10000] flex items-center justify-center p-4 lg:p-10 animate-fade-in">
                    <div className="bg-white w-full max-w-6xl h-full lg:h-[90vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/10 animate-scale-in">
                        <header className="h-20 px-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><Brain size={24} className="text-white" /></div>
                                <h3 className="font-black text-xl tracking-tighter uppercase">Arquiteto Social</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-black text-[11px] uppercase tracking-widest shadow-xl">{isSaving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Commitar</>}</button>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl transition-all"><X size={24} /></button>
                            </div>
                        </header>

                        <main className="flex-1 min-h-0 overflow-y-auto bg-slate-50/50 custom-scrollbar p-10">
                            <div className="max-w-4xl mx-auto space-y-10">
                                <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título do Protocolo</label><input className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6 focus:bg-white focus:border-indigo-500 transition-all" value={editingSurvey.title} onChange={e => setEditingSurvey({ ...editingSurvey, title: e.target.value })} /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motor de Processamento</label>
                                            <select className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6" value={editingSurvey.type} onChange={e => setEditingSurvey({ ...editingSurvey, type: e.target.value })}>
                                                <option value="CENSUS">Censo Demográfico</option><option value="SOCIAL_AID">Auxílio & ESG</option><option value="SATISFACTION">Pesquisa de Engajamento</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2rem] p-6 flex items-start gap-4">
                                        <div className="p-3 bg-white rounded-xl shadow-sm">{ENGINE_EXPLANATIONS[currentEngine].icon}</div>
                                        <div><h5 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">{ENGINE_EXPLANATIONS[currentEngine].label}</h5><p className="text-[13px] text-indigo-700 font-medium mt-1 leading-relaxed">{ENGINE_EXPLANATIONS[currentEngine].desc}</p></div>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <div className="flex justify-between items-center px-4">
                                        <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-[0.2em]">Engenharia de Atributos</h4>
                                        <button onClick={addQuestion} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-lg"><Plus size={18} /> Novo Atributo</button>
                                    </div>
                                    <div className="space-y-4">
                                        {editingSurvey.questions?.map((q: any, qIdx: number) => (
                                            <div key={q.id || qIdx} className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm relative group hover:border-indigo-400 transition-all">
                                                <button onClick={() => removeQuestion(qIdx)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={20} /></button>
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                                    <div className="md:col-span-1 text-2xl font-black text-slate-100">{qIdx + 1}</div>
                                                    <div className="md:col-span-6 space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Enunciado</label><input className="w-full font-bold h-12 bg-slate-50 border-slate-100 rounded-xl px-4" value={q.text} onChange={e => updateQuestion(qIdx, 'text', e.target.value)} /></div>
                                                    <div className="md:col-span-3 space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Formato</label>
                                                        <select className="w-full font-bold h-12 bg-slate-50 border-slate-100 rounded-xl px-4" value={q.type} onChange={e => updateQuestion(qIdx, 'type', e.target.value)}>
                                                            <option value="text">Texto</option><option value="number">Número</option><option value="boolean">Sim / Não</option><option value="select">Opções</option>
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-2"><button onClick={() => updateQuestion(qIdx, 'required', !q.required)} className={`w-full h-12 rounded-xl text-[10px] font-black uppercase transition-all ${q.required ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>{q.required ? 'Obrigatório' : 'Opcional'}</button></div>
                                                </div>
                                                {q.type === 'select' && (
                                                    <div className="mt-4 pt-4 border-t border-slate-50"><label className="text-[9px] font-black text-indigo-400 uppercase">Opções (Separe por vírgula)</label><input className="w-full font-bold h-10 bg-slate-50 border-slate-100 rounded-lg px-4 mt-1" value={Array.isArray(q.options) ? q.options.join(', ') : ''} onChange={e => updateQuestion(qIdx, 'options', e.target.value.split(',').map((s: string) => s.trim()))} /></div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </main>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Surveys;

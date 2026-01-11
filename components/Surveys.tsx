
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

    const deleteSurvey = async (id: string | number) => {
        if (!confirm("Excluir registro permanentemente?")) return;
        try {
            await surveyService.delete(id);
            loadSurveys();
        } catch (e: any) {
            alert("Erro ao deletar: " + (e.message || "Erro desconhecido"));
        }
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
            const errorMsg = err.response?.data?.error || err.message || String(err);
            alert("Erro ao salvar no Kernel: " + (typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg));
        } finally { setIsSaving(false); }
    };

    // Explicações dos Motores (Conforme sua imagem)
    const ENGINE_EXPLANATIONS = {
        'CENSUS': {
            label: 'Censo Demográfico (Soberano)',
            desc: 'Protocolo de alta criticidade. Altera o cadastro mestre do cidadão e atualiza o Smart Map em tempo real.',
            impact: 'Atualiza o Core Database e o perfil principal do morador.',
            icon: <Globe size={18} className="text-indigo-600" />
        },
        'SOCIAL_AID': {
            label: 'Auxílio & ESG',
            desc: 'Algoritmo focado em indicadores de vulnerabilidade. Identifica necessidades de apoio social e segurança alimentar.',
            impact: 'Gera alertas de risco social no painel de assistência.',
            icon: <Heart size={18} className="text-rose-600" />
        },
        'SATISFACTION': {
            label: 'Pesquisa de Engajamento',
            desc: 'Módulo de escuta ativa. Analisa o sentimento da comunidade e gera relatórios de NPS para a governança.',
            impact: 'Alimenta o dashboard de satisfação e qualidade de gestão.',
            icon: <ThumbsUp size={18} className="text-emerald-600" />
        }
    };

    const currentEngine = (editingSurvey?.type || 'CENSUS') as keyof typeof ENGINE_EXPLANATIONS;

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in p-4 lg:p-6 overflow-hidden">
            {/* CABEÇALHO DO MÓDULO */}
            <div className="flex justify-between items-center bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl shrink-0">
                <div>
                    <h2 className="text-xl font-black tracking-tightest uppercase leading-none">
                        Censo & Pesquisas
                    </h2>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1.5 opacity-80">
                        Database Governança V22.4
                    </p>
                </div>

                <button
                    onClick={handleOpenCreate}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg"
                >
                    <Plus size={16} />
                    Novo Formulário
                </button>
            </div>

            {/* GRID DE FORMULÁRIOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12 overflow-y-auto flex-1 custom-scrollbar min-h-0">
                {isLoading ? (
                    <div className="col-span-full py-20 text-center">
                        <Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} />
                    </div>
                ) : (
                    surveys.map(s => (
                        <div key={String(s.id)} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col h-fit relative">
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleCopyLink(s.id)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><Share2 size={14} /></button>
                                <button onClick={() => { setEditingSurvey(s); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={14} /></button>
                                <button onClick={() => deleteSurvey(s.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded border border-indigo-100">{s.type}</span>
                                <span className={`px-2 py-0.5 ${s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} text-[8px] font-black uppercase rounded border border-emerald-100`}>{s.status}</span>
                            </div>
                            <h3 className="text-base font-black text-slate-800 truncate">{s.title || 'Sem Título'}</h3>
                            <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">{s.description || 'Sem descrição cadastrada.'}</p>
                            <div className="mt-5 pt-4 border-t border-slate-50 flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase">{Array.isArray(s.questions) ? s.questions.length : 0} Atributos</span>
                                <button onClick={() => handleCopyLink(s.id)} className="text-indigo-600 font-black text-[9px] uppercase hover:underline tracking-widest">Link Público</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* WORKSPACE DO ARQUITETO SOCIAL (MODAL FULLSCREEN) */}
            {isModalOpen && editingSurvey && (
                <div className="fixed inset-0 w-full h-[100dvh] bg-white z-[10000] flex flex-col overflow-hidden animate-fade-in shadow-2xl">
                    <header className="h-20 px-8 bg-slate-950 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg">
                                <Brain size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl tracking-tighter uppercase leading-none">
                                    Arquiteto Social
                                </h3>
                                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-1.5">
                                    SRE Workspace • High-Density Protocol
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-900/20 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Commitar Formulário</>}
                            </button>

                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl transition-all font-black text-[11px] uppercase tracking-widest border border-white/10"
                            >
                                <X size={18} /> Fechar
                            </button>
                        </div>
                    </header>

                    <main className="flex-1 min-h-0 overflow-y-auto bg-slate-50/50 custom-scrollbar relative z-10">
                        <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
                            {/* CONFIGURAÇÕES BASE */}
                            <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                                <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                                    <span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm">01</span>
                                    <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-[0.2em]">Configurações Nucleares</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Protocolo</label>
                                        <input
                                            className="w-full font-bold h-14 bg-slate-50 border-slate-200 focus:bg-white text-lg rounded-2xl"
                                            value={editingSurvey.title || ''}
                                            onChange={e => setEditingSurvey({ ...editingSurvey, title: e.target.value })}
                                            placeholder="Ex: Censo Governança 2025"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                Motor de Processamento <Zap size={10} className="text-amber-500" />
                                            </label>
                                            <select
                                                className="w-full font-bold h-14 bg-slate-50 border-slate-200 text-base rounded-2xl appearance-none cursor-pointer hover:border-indigo-400 transition-colors"
                                                value={editingSurvey.type || 'CENSUS'}
                                                onChange={e => setEditingSurvey({ ...editingSurvey, type: e.target.value })}
                                            >
                                                <option value="CENSUS">Censo Demográfico (Soberano)</option>
                                                <option value="SOCIAL_AID">Auxílio & ESG</option>
                                                <option value="SATISFACTION">Pesquisa de Engajamento</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        {/* PAINEL EXPLICATIVO DOS COMPONENTES (IMAGEM SOLICITADA) */}
                                        <div className="bg-indigo-50/50 border-2 border-dashed border-indigo-100 rounded-[2rem] p-6 animate-fade-in">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-white rounded-xl shadow-sm shrink-0">
                                                    {ENGINE_EXPLANATIONS[currentEngine].icon}
                                                </div>
                                                <div className="space-y-1">
                                                    <h5 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">
                                                        Protocolo Ativo: {ENGINE_EXPLANATIONS[currentEngine].label}
                                                    </h5>
                                                    <p className="text-[13px] text-indigo-700 font-medium leading-relaxed italic">
                                                        "{ENGINE_EXPLANATIONS[currentEngine].desc}"
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-indigo-100">
                                                        <Activity size={12} className="text-indigo-400" />
                                                        <span className="text-[10px] font-black text-indigo-400 uppercase">
                                                            Impacto no Kernel: {ENGINE_EXPLANATIONS[currentEngine].impact}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Objetivo Estratégico / Instruções</label>
                                        <textarea
                                            rows={3}
                                            className="w-full font-medium bg-slate-50 border-slate-200 focus:bg-white text-base p-6 rounded-2xl leading-relaxed shadow-inner"
                                            value={editingSurvey.description || ''}
                                            onChange={e => setEditingSurvey({ ...editingSurvey, description: e.target.value })}
                                            placeholder="Descreva a finalidade deste levantamento para os moradores..."
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* ENGENHARIA DE DADOS */}
                            <section className="space-y-8 pb-32">
                                <div className="flex justify-between items-center px-4">
                                    <div className="flex items-center gap-4">
                                        <span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm">02</span>
                                        <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-[0.2em]">Engenharia de Atributos</h4>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addQuestion}
                                        className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl active:scale-95"
                                    >
                                        <Plus size={18} /> Novo Atributo
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {Array.isArray(editingSurvey.questions) &&
                                        editingSurvey.questions.map((q: any, qIdx: number) => (
                                            <div key={q.id || qIdx} className="p-8 bg-white rounded-[2.5rem] border border-slate-200 relative shadow-sm group hover:border-indigo-400 transition-colors">
                                                <button
                                                    type="button"
                                                    onClick={() => removeQuestion(qIdx)}
                                                    className="absolute top-6 right-6 p-2.5 text-slate-300 hover:text-rose-600 transition-colors bg-slate-50 rounded-xl"
                                                >
                                                    <Trash2 size={20} />
                                                </button>

                                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                                                    <div className="lg:col-span-1 flex justify-center">
                                                        <span className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center font-black text-sm">
                                                            {qIdx + 1}
                                                        </span>
                                                    </div>

                                                    <div className="lg:col-span-6 space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enunciado do Atributo</label>
                                                        <input
                                                            className="w-full font-bold text-base h-14 px-6 bg-slate-50 border-slate-200 rounded-2xl focus:bg-white"
                                                            value={q.text || ''}
                                                            onChange={e => updateQuestion(qIdx, 'text', e.target.value)}
                                                            placeholder="Ex: Qual a renda familiar total?"
                                                        />
                                                    </div>

                                                    <div className="lg:col-span-3 space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Formato de Resposta</label>
                                                        <select
                                                            className="w-full font-black text-[11px] h-14 px-5 bg-slate-50 border-slate-200 rounded-2xl"
                                                            value={q.type || 'text'}
                                                            onChange={e => updateQuestion(qIdx, 'type', e.target.value)}
                                                        >
                                                            <option value="text">Texto Curto</option>
                                                            <option value="number">Valor Numérico</option>
                                                            <option value="boolean">Sim / Não</option>
                                                            <option value="select">Opções de Lista</option>
                                                        </select>
                                                    </div>

                                                    <div className="lg:col-span-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuestion(qIdx, 'required', !q.required)}
                                                            className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase transition-all border ${q.required
                                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                                                                : 'bg-white border-slate-200 text-slate-400'
                                                                }`}
                                                        >
                                                            {q.required ? 'Obrigatória' : 'Opcional'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {q.type === 'select' && (
                                                    <div className="mt-8 pt-8 border-t border-slate-50">
                                                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Opções da Lista (Separe por vírgula)</label>
                                                        <input
                                                            className="w-full text-sm font-bold bg-slate-50 h-12 px-6 rounded-xl border-slate-100 mt-2"
                                                            value={Array.isArray(q.options) ? q.options.join(', ') : ''}
                                                            onChange={e => updateQuestion(qIdx, 'options', e.target.value.split(',').map((s: string) => s.trim()))}
                                                            placeholder="Opção 1, Opção 2, Opção 3..."
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                    {(!editingSurvey.questions || editingSurvey.questions.length === 0) && (
                                        <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-4">
                                            <Layout size={64} className="text-slate-200" />
                                            <p className="text-[12px] font-black uppercase text-slate-300 tracking-[0.3em]">Nenhum atributo modelado no Workspace</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </main>
                </div>
            )}
        </div>
    );
};

// Componentes Iconográficos locais para simplificação
const Globe = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const ThumbsUp = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>;

export default Surveys;

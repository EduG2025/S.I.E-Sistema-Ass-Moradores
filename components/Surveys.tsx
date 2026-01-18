import React, { useState, useEffect, useCallback } from 'react';
import { Survey, SurveyQuestion } from '../types';
import { surveyService, api } from '../services/api';
import {
    Plus, X, Trash2, Edit2, Loader2, Save,
    Share2, Link, Eye, Layout, Shield, Info, Heart, Brain, Activity, Settings2, Zap, Target,
    BarChart3, Download, ChevronUp, ChevronDown, Sparkles, User, Users, Table, FileSpreadsheet, Tag,
    Settings
} from 'lucide-react';

const Surveys = () => {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingIA, setIsGeneratingIA] = useState(false);
    
    const [editingSurvey, setEditingSurvey] = useState<any>(null);
    const [analyticsData, setAnalyticsData] = useState<any[]>([]);
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);

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

    const loadAnalytics = async (survey: Survey) => {
        setIsLoading(true);
        setSelectedSurvey(survey);
        try {
            const res = await api.get(`/surveys/${survey.id}/responses`);
            setAnalyticsData(res.data.data || []);
            setIsAnalyticsOpen(true);
        } catch (e) {
            alert("Erro ao carregar banco de respostas.");
        } finally {
            setIsLoading(false);
        }
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

    const handleSuggestIA = async () => {
        if (!editingSurvey?.title) return alert("Defina um título primeiro para a IA entender o contexto.");
        setIsGeneratingIA(true);
        try {
            const res = await surveyService.suggestQuestions({ 
                title: editingSurvey.title, 
                description: editingSurvey.description, 
                type: editingSurvey.type 
            });
            
            const suggested = res.data.data.map((q: any) => ({
                id: `ia_${Date.now()}_${Math.random()}`,
                ...q,
                required: 1
            }));
            setEditingSurvey({ ...editingSurvey, questions: [...(editingSurvey.questions || []), ...suggested] });
        } catch (e) {
            alert("Motor IA indisponível. Tente novamente em instantes.");
        } finally {
            setIsGeneratingIA(false);
        }
    };

    const handleSave = async (e: any) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!editingSurvey?.title) return alert("Defina um título.");
        
        setIsSaving(true);
        try {
            const payload = { ...editingSurvey };
            
            // SRE SERIALIZATION: Garante que o array de perguntas seja limpo para o DB
            const sanitizedQuestions = (payload.questions || []).map((q: any) => {
                const { id, ...cleanQ } = q;
                // Mantém o ID apenas se não for temporário
                const isTemp = String(q.id).startsWith('ia_') || String(q.id).startsWith('new_');
                return {
                    id: isTemp ? `q_${Math.random().toString(36).substr(2, 9)}` : q.id,
                    text: q.text,
                    type: q.type,
                    options: q.options || [],
                    mapping_tag: q.mapping_tag || 'SOCIAL',
                    required: q.required ? 1 : 0
                };
            });

            const dataToCommit = {
                ...payload,
                questions: sanitizedQuestions
            };

            if (dataToCommit.id && !String(dataToCommit.id).startsWith('temp_')) { 
                await surveyService.update(dataToCommit.id, dataToCommit); 
            } else { 
                delete dataToCommit.id; 
                await surveyService.create(dataToCommit); 
            }
            
            setIsModalOpen(false);
            loadSurveys();
            alert("✅ Protocolo Social Sincronizado.");
        } catch (err: any) { 
            alert("Erro de rede ao comitar protocolo."); 
        } finally { 
            setIsSaving(false); 
        }
    };

    const moveQuestion = (index: number, direction: 'UP' | 'DOWN') => {
        const qs = [...(editingSurvey.questions || [])];
        const target = direction === 'UP' ? index - 1 : index + 1;
        if (target >= 0 && target < qs.length) {
            [qs[index], qs[target]] = [qs[target], qs[index]];
            setEditingSurvey({ ...editingSurvey, questions: qs });
        }
    };

    const addQuestion = () => {
        const newQuestion: any = { id: `new_${Date.now()}`, text: '', type: 'text', options: [], mapping_tag: 'SOCIAL', required: 0 };
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

    const handleExportCSV = () => {
        if (!selectedSurvey || analyticsData.length === 0) return;
        
        const headers = ["Data", "CPF", "Membro", ...selectedSurvey.questions.map(q => q.text)];
        const rows = analyticsData.map(r => {
            const rowData = [new Date(r.created_at).toLocaleDateString(), r.cpf, r.user_name || 'Desconhecido'];
            selectedSurvey.questions.forEach(q => {
                const ans = r.answers?.social?.[q.id] || r.answers?.[q.id] || '';
                rowData.push(ans);
            });
            return rowData.join(';');
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(';'), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `respostas_${selectedSurvey.id}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in h-full relative">
            <div className="flex flex-row justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shrink-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl"><Layout size={24}/></div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight uppercase leading-none">Censo & Pesquisas</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2 opacity-80">Social Architecture Engine V25.9</p>
                    </div>
                </div>
                <button onClick={handleOpenCreate} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3 relative z-10">
                    <Plus size={20} /> Novo Formulário
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40}/></div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {surveys.map(s => (
                            <div key={String(s.id)} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col h-fit relative">
                                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                    <button onClick={() => loadAnalytics(s)} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 rounded-xl shadow-sm transition-all" title="Analytics"><BarChart3 size={16} /></button>
                                    <button onClick={() => handleCopyLink(s.id)} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm transition-all" title="Link Público"><Share2 size={16} /></button>
                                    <button onClick={() => { setEditingSurvey(s); setIsModalOpen(true); }} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm transition-all"><Edit2 size={16} /></button>
                                    <button onClick={async () => { if(confirm("Remover permanentemente este protocolo?")) { await surveyService.delete(s.id); loadSurveys(); } }} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 rounded-xl shadow-sm transition-all"><Trash2 size={16} /></button>
                                </div>
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded-lg border border-indigo-100 tracking-widest">{s.type}</span>
                                    <span className={`px-3 py-1 ${s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} text-[8px] font-black uppercase rounded-lg border border-emerald-100`}>{s.status}</span>
                                </div>
                                <h3 className="text-base font-black text-slate-800 uppercase tracking-tight truncate mb-2">{s.title || 'Sem Título'}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase line-clamp-2 leading-relaxed italic">{s.description}</p>
                                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-3">
                                     <Users size={14} className="text-slate-300"/>
                                     <span className="text-[9px] font-black text-slate-400 uppercase">Protocolo SRE #{s.id}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && editingSurvey && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/5">
                            <div className="flex items-center gap-5">
                                <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl"><Brain size={22} className="text-white"/></div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Arquiteto Social</h3>
                                    <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">SRE Social Planning V5.0</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={handleSuggestIA} disabled={isGeneratingIA} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-indigo-300 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 border border-white/5">
                                    {isGeneratingIA ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>} IA Predict
                                </button>
                                <button onClick={handleSave} disabled={isSaving} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl active:scale-95">
                                    {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Commitar Protocolo
                                </button>
                                <button onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#fdfdfe] relative">
                            <div className="max-w-7xl mx-auto space-y-12 pb-10">
                                <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200 shadow-inner space-y-10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none"><Layout size={150}/></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Protocolo</label>
                                            <input className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-2xl focus:border-indigo-500 transition-all shadow-sm uppercase" placeholder="Ex: Censo Socioeconômico 2025..." value={editingSurvey.title} onChange={e => setEditingSurvey({ ...editingSurvey, title: e.target.value })} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motor de Análise</label>
                                            <select className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-sm uppercase shadow-sm appearance-none focus:border-indigo-500" value={editingSurvey.type} onChange={e => setEditingSurvey({ ...editingSurvey, type: e.target.value })}>
                                                <option value="CENSUS">Censo Demográfico Geral</option>
                                                <option value="SOCIAL_AID">Auxílio & ESG (Social)</option>
                                                <option value="SATISFACTION">Engajamento Comunitário</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-3 relative z-10">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição e Instruções</label>
                                        <textarea rows={3} className="w-full font-medium bg-white border border-slate-200 rounded-[1.5rem] p-6 text-sm focus:border-indigo-500 shadow-sm uppercase" value={editingSurvey.description} onChange={e => setEditingSurvey({ ...editingSurvey, description: e.target.value })} />
                                    </div>
                                </div>

                                <section className="space-y-8">
                                    <div className="flex justify-between items-center px-4">
                                        <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Atributos de Pesquisa</h4>
                                        <button onClick={addQuestion} className="px-8 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-3 shadow-xl active:scale-95"><Plus size={18} /> Novo Atributo</button>
                                    </div>
                                    <div className="space-y-6">
                                        {editingSurvey.questions?.map((q: any, qIdx: number) => (
                                            <div key={q.id || qIdx} className="p-10 bg-white rounded-[3rem] border border-slate-200 shadow-sm relative group hover:border-indigo-300 transition-all hover:shadow-lg">
                                                <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                    <button onClick={() => moveQuestion(qIdx, 'UP')} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-white transition-all shadow-sm"><ChevronUp size={18}/></button>
                                                    <button onClick={() => moveQuestion(qIdx, 'DOWN')} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-white transition-all shadow-sm"><ChevronDown size={18}/></button>
                                                    <button onClick={() => removeQuestion(qIdx)} className="p-3 bg-rose-50 text-rose-400 border border-rose-100 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                                                    <div className="md:col-span-1 text-5xl font-black text-slate-100 group-hover:text-indigo-50 transition-colors">{qIdx + 1}</div>
                                                    <div className="md:col-span-5 space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pergunta</label>
                                                        <input className="w-full font-black h-12 bg-slate-50 border-transparent rounded-xl px-5 text-sm group-hover:bg-white group-hover:border-slate-200 transition-all shadow-inner uppercase" placeholder="Ex: Renda mensal familiar?" value={q.text} onChange={e => updateQuestion(qIdx, 'text', e.target.value)} />
                                                    </div>
                                                    <div className="md:col-span-2 space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tag SRE</label>
                                                        <input className="w-full font-black h-12 bg-indigo-50 border-indigo-100 rounded-xl px-5 text-[10px] uppercase tracking-widest text-indigo-600 text-center" value={q.mapping_tag} onChange={e => updateQuestion(qIdx, 'mapping_tag', e.target.value.toUpperCase())} />
                                                    </div>
                                                    <div className="md:col-span-2 space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Formato</label>
                                                        <select className="w-full font-black h-12 bg-slate-50 border-transparent rounded-xl px-5 text-[10px] uppercase tracking-widest shadow-inner appearance-none text-center" value={q.type} onChange={e => updateQuestion(qIdx, 'type', e.target.value)}>
                                                            <option value="text">Texto</option>
                                                            <option value="number">Número</option>
                                                            <option value="boolean">Sim/Não</option>
                                                            <option value="select">Seleção</option>
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <button onClick={() => updateQuestion(qIdx, 'required', !q.required)} className={`w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${q.required ? 'bg-indigo-600 text-white shadow-lg border-indigo-500' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-white'}`}>{q.required ? 'Obrigatório' : 'Opcional'}</button>
                                                    </div>
                                                </div>
                                                {q.type === 'select' && (
                                                    <div className="mt-8 pt-8 border-t border-slate-50">
                                                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Opções (Separadas por vírgula)</label>
                                                        <input className="w-full font-bold h-12 bg-slate-50 border-slate-100 rounded-xl px-5 mt-2 shadow-inner focus:bg-white focus:border-indigo-500 uppercase" placeholder="Ex: OPCAO 1, OPCAO 2, OPCAO 3" value={Array.isArray(q.options) ? q.options.join(', ') : ''} onChange={e => updateQuestion(qIdx, 'options', e.target.value.split(',').map((s: string) => s.trim().toUpperCase()))} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>

                        <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estrutura Social Calibrada</span></div>
                            <div className="flex gap-4">
                                <button onClick={() => setIsModalOpen(false)} className="px-8 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Fechar</button>
                                <button onClick={handleSave} disabled={isSaving} className="px-10 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all">Salvar Estrutura</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isAnalyticsOpen && selectedSurvey && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-emerald-500 rounded-xl shadow-xl shadow-emerald-500/20"><BarChart3 size={22} className="text-white"/></div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Observatório de Respostas</h3>
                                    <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest">PROTOCOL ID: {selectedSurvey.id} • {selectedSurvey.title}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={handleExportCSV} className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl active:scale-95">
                                    <FileSpreadsheet size={18}/> Exportar CSV
                                </button>
                                <button onClick={() => setIsAnalyticsOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#fcfcfd]">
                            <div className="max-w-7xl mx-auto space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex items-center gap-6">
                                        <div className="p-5 bg-indigo-50 text-indigo-600 rounded-[1.5rem] shadow-inner"><Users size={32}/></div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amostragem</p>
                                            <h4 className="text-4xl font-black text-slate-800 tracking-tight">{analyticsData.length}</h4>
                                        </div>
                                    </div>
                                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex items-center gap-6">
                                        <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[1.5rem] shadow-inner"><Activity size={32}/></div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Engajamento</p>
                                            <h4 className="text-4xl font-black text-slate-800 tracking-tight">{(analyticsData.length > 0 ? (analyticsData.length / 452 * 100).toFixed(1) : 0)}%</h4>
                                        </div>
                                    </div>
                                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex items-center gap-6">
                                        <div className="p-5 bg-amber-50 text-amber-600 rounded-[1.5rem] shadow-inner"><Target size={32}/></div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Confiança</p>
                                            <h4 className="text-4xl font-black text-slate-800 tracking-tight">95%</h4>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                                    <div className="p-8 border-b bg-slate-50/50 flex items-center gap-3">
                                        <Table size={18} className="text-slate-400"/>
                                        <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Matriz de Dados Brutos</h5>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                                                <tr>
                                                    <th className="p-8 border-b">Membro do Cluster</th>
                                                    {selectedSurvey.questions.slice(0, 3).map(q => (
                                                        <th key={q.id} className="p-8 border-b truncate max-w-[200px]">{q.text}</th>
                                                    ))}
                                                    <th className="p-8 text-right border-b">Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {analyticsData.map(r => (
                                                    <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="p-8">
                                                            <div className="flex items-center gap-5">
                                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform shadow-inner">{r.user_name?.charAt(0) || 'A'}</div>
                                                                <div><p className="text-sm font-black text-slate-800 uppercase tracking-tight">{r.user_name || 'Membro Externo'}</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-1">ID: {r.cpf}</p></div>
                                                            </div>
                                                        </td>
                                                        {selectedSurvey.questions.slice(0, 3).map(q => {
                                                            const ans = r.answers?.social?.[q.id] || r.answers?.[q.id] || '---';
                                                            return <td key={q.id} className="p-8 text-sm font-medium text-slate-500 uppercase">{String(ans)}</td>
                                                        })}
                                                        <td className="p-8 text-right text-[10px] font-black text-slate-400 uppercase">{new Date(r.created_at).toLocaleString('pt-BR')}</td>
                                                    </tr>
                                                ))}
                                                {analyticsData.length === 0 && (
                                                    <tr><td colSpan={5} className="p-40 text-center text-slate-300 font-black uppercase text-xs tracking-widest italic opacity-20">Aguardando telemetria social de campo...</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Surveys;

import React, { useState, useEffect, useCallback } from 'react';
import { Survey, SurveyQuestion, SystemInfo } from '../types';
import { surveyService, api } from '../services/api';
import {
    Plus, X, Trash2, Edit2, Loader2, Save,
    Share2, Link, Eye, Layout, Shield, Info, Heart, Brain, Activity, Settings2, Zap, Target,
    BarChart3, Download, ChevronUp, ChevronDown, Sparkles, User, Users, Table, FileSpreadsheet, Tag,
    Settings, ListPlus, GitBranch, Database, ClipboardCheck, GraduationCap, HandHelping, Laptop, Landmark, ShieldAlert
} from 'lucide-react';

interface SurveysProps {
    systemInfo: SystemInfo;
}

const Surveys = ({ systemInfo }: SurveysProps) => {
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

    const handleInjectMaster = () => {
        const masterQuestions: any[] = [
            { id: 'ident_01', text: 'Estado Civil do Titular', type: 'select', options: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'], required: 1, mapping_tag: 'IDENTITY' },
            { id: 'ident_02', text: 'Cor ou Raça (Autodeclaração)', type: 'select', options: ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena'], required: 1, mapping_tag: 'IDENTITY' },
            { id: 'edu_01', text: 'Nível de Escolaridade do Titular', type: 'select', options: ['Analfabeto', 'Fundamental', 'Médio', 'Técnico', 'Superior', 'Pós-Graduação'], required: 1, mapping_tag: 'EDUCATION' },
            { id: 'edu_02', text: 'Há moradores em idade escolar (0-17 anos) na unidade?', type: 'boolean', required: 1, mapping_tag: 'EDUCATION' },
            { id: 'soc_01', text: 'A família possui inscrição ativa no CadÚnico?', type: 'boolean', required: 1, mapping_tag: 'GOV_AID' },
            { id: 'soc_03', text: 'Recebe o Programa Bolsa Família?', type: 'boolean', required: 1, mapping_tag: 'GOV_AID' },
            { id: 'health_01', text: 'Algum morador possui deficiência (PCD)?', type: 'boolean', required: 1, mapping_tag: 'HEALTH' },
            { id: 'work_01', text: 'Situação de Trabalho do Titular', type: 'select', options: ['CLT', 'MEI/Autônomo', 'Desempregado', 'Aposentado'], required: 1, mapping_tag: 'WORK' }
        ];

        setEditingSurvey({
            title: 'Censo Socioeconômico e Educacional 2025 - S.I.E PRO',
            description: 'Mapeamento integral de vulnerabilidade e educação.',
            type: 'CENSUS',
            status: 'ACTIVE',
            questions: masterQuestions
        });
        setIsModalOpen(true);
    };

    const handleCopyLink = (id: string | number) => {
        const url = `${window.location.origin}/census/${id}`;
        navigator.clipboard.writeText(url);
        alert("✅ Link público copiado.");
    };

    const handleSuggestIA = async () => {
        if (!editingSurvey?.title) return alert("Defina um título primeiro.");
        setIsGeneratingIA(true);
        try {
            const res = await surveyService.suggestQuestions({ 
                title: editingSurvey.title, 
                description: editingSurvey.description, 
                type: editingSurvey.type 
            });
            const suggested = res.data.data.map((q: any) => ({
                id: `ia_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                ...q,
                required: 1
            }));
            setEditingSurvey({ ...editingSurvey, questions: [...(editingSurvey.questions || []), ...suggested] });
        } catch (e) { alert("IA offline."); } 
        finally { setIsGeneratingIA(false); }
    };

    const handleSave = async (e: any) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!editingSurvey?.title) return alert("Defina um título.");
        setIsSaving(true);
        try {
            const payload = { ...editingSurvey };
            const sanitizedQuestions = (payload.questions || []).map((q: any) => ({
                id: q.id, text: q.text, type: q.type, options: q.options || [],
                mapping_tag: q.mapping_tag || 'SOCIAL', required: q.required ? 1 : 0,
                logic: q.logic || null, repeater_fields: q.repeater_fields || []
            }));
            const dataToCommit = { ...payload, questions: sanitizedQuestions };
            if (dataToCommit.id && !String(dataToCommit.id).startsWith('temp_')) { 
                await surveyService.update(dataToCommit.id, dataToCommit); 
            } else { 
                delete dataToCommit.id; 
                await surveyService.create(dataToCommit); 
            }
            setIsModalOpen(false);
            loadSurveys();
        } catch (err: any) { alert("Erro ao salvar."); } 
        finally { setIsSaving(false); }
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const qs = [...(editingSurvey?.questions || [])];
        if (qs[index]) { 
            qs[index] = { ...qs[index], [field]: value }; 
            setEditingSurvey({ ...editingSurvey, questions: qs }); 
        }
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-fade-in h-full relative">
            <div className="flex flex-row justify-between items-center bg-slate-900 p-6 rounded-none text-white shadow-xl shrink-0 overflow-hidden relative">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-indigo-600 rounded-none shadow-xl" style={{ backgroundColor: primaryColor }}><Database size={20}/></div>
                    <div>
                        <h2 className="text-lg font-black tracking-tight uppercase leading-none">Censo & Inteligência</h2>
                        <p className="text-indigo-400 text-[7px] font-black uppercase tracking-widest mt-1 opacity-80">Full Social Architecture • Minimal Density</p>
                    </div>
                </div>
                <div className="flex gap-2 relative z-10">
                    <button onClick={handleInjectMaster} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-emerald-400 rounded-none font-black text-[8px] uppercase tracking-widest transition-all flex items-center gap-2 border border-white/5">
                        <HandHelping size={16} /> Injetar Mestre
                    </button>
                    <button onClick={() => { setEditingSurvey({ title: '', description: '', type: 'CENSUS', questions: [], status: 'ACTIVE' }); setIsModalOpen(true); }} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-none font-black text-[9px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-2" style={{ backgroundColor: primaryColor }}>
                        <Plus size={16} /> Novo
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-6">
                {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32}/></div> : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {surveys.map(s => (
                            <div key={String(s.id)} className="bg-white p-5 rounded-none border border-slate-200 shadow-sm hover:shadow-lg transition-all group flex flex-col h-fit relative">
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => handleCopyLink(s.id)} className="p-2 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-none shadow-sm transition-all"><Share2 size={12} /></button>
                                    <button onClick={() => { setEditingSurvey(s); setIsModalOpen(true); }} className="p-2 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-none shadow-sm transition-all"><Edit2 size={12} /></button>
                                </div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[6px] font-black uppercase rounded-none border border-indigo-100">{s.type}</span>
                                    <span className={`px-2 py-0.5 ${s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} text-[6px] font-black uppercase rounded-none border`}>{s.status}</span>
                                </div>
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight truncate mb-1">{s.title || 'Sem Título'}</h3>
                                <p className="text-[7px] text-slate-400 font-bold uppercase line-clamp-1 italic">{s.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && editingSurvey && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !rounded-none !h-full !max-w-none w-full">
                        <div className="h-16 px-8 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-indigo-600 rounded-none shadow-xl" style={{ backgroundColor: primaryColor }}><Brain size={18}/></div>
                                <div>
                                    <h3 className="font-black text-lg uppercase tracking-tight leading-none">Arquiteto de Senso</h3>
                                    <p className="text-indigo-400 text-[7px] font-black uppercase mt-1 tracking-widest opacity-80">Full Social Architecture • Density Mode</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleSuggestIA} disabled={isGeneratingIA} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-indigo-300 rounded-none font-black text-[8px] uppercase tracking-widest flex items-center gap-2">
                                    {isGeneratingIA ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12}/>} IA Predict
                                </button>
                                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-none font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center gap-2" style={{ backgroundColor: primaryColor }}>
                                    {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} Commitar
                                </button>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-rose-500 hover:text-white text-slate-400 rounded-none transition-all"><X size={20}/></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white relative">
                            <div className="w-full space-y-8">
                                <div className="bg-slate-50 p-6 rounded-none border border-slate-200 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        <div className="md:col-span-8 space-y-1">
                                            <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Protocolo</label>
                                            <input className="w-full font-black h-11 bg-white border border-slate-200 rounded-none px-4 text-sm focus:border-indigo-500 outline-none uppercase" placeholder="Título..." value={editingSurvey.title} onChange={e => setEditingSurvey({ ...editingSurvey, title: e.target.value })} />
                                        </div>
                                        <div className="md:col-span-4 space-y-1">
                                            <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Análise</label>
                                            <select className="w-full font-black h-11 bg-white border border-slate-200 rounded-none px-4 text-[9px] uppercase shadow-sm outline-none focus:border-indigo-500" value={editingSurvey.type} onChange={e => setEditingSurvey({ ...editingSurvey, type: e.target.value })}>
                                                <option value="CENSUS">Censo Biopsicossocial</option>
                                                <option value="SOCIAL_AID">Auxílio & ESG (Social)</option>
                                                <option value="SATISFACTION">Engajamento Comunitário</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <section className="space-y-4">
                                    <div className="flex items-center gap-4 px-2">
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Atributos Sociais</h4>
                                        <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-3 py-0.5 rounded-none border border-emerald-100">{editingSurvey.questions?.length || 0} Campos</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {editingSurvey.questions?.map((q: any, qIdx: number) => (
                                            <div key={q.id || qIdx} className="p-6 bg-white rounded-none border border-slate-200 relative group hover:border-indigo-300 transition-all">
                                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => {
                                                        const qs = [...editingSurvey.questions]; qs.splice(qIdx, 1); setEditingSurvey({...editingSurvey, questions: qs});
                                                    }} className="p-2 bg-rose-50 text-rose-400 rounded-none hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={12} /></button>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                    <div className="md:col-span-12 space-y-1">
                                                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Pergunta do Censo</label>
                                                        <input className="w-full font-black h-9 bg-slate-50 border-slate-200 rounded-none px-4 text-[9px] uppercase outline-none" value={q.text} onChange={e => updateQuestion(qIdx, 'text', e.target.value)} />
                                                    </div>
                                                    <div className="md:col-span-6 space-y-1">
                                                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Formato</label>
                                                        <select className="w-full font-black h-9 bg-slate-50 border-slate-200 rounded-none px-4 text-[8px] uppercase outline-none" value={q.type} onChange={e => updateQuestion(qIdx, 'type', e.target.value)}>
                                                            <option value="text">Texto</option>
                                                            <option value="number">Número</option>
                                                            <option value="boolean">Sim/Não</option>
                                                            <option value="select">Seleção</option>
                                                            <option value="date">Data</option>
                                                            <option value="repeater">Repetidor</option>
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-6 space-y-1">
                                                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Tag de BI</label>
                                                        <select className="w-full font-black h-9 bg-indigo-50 border-indigo-100 rounded-none px-4 text-[8px] uppercase text-indigo-600 outline-none" value={q.mapping_tag} onChange={e => updateQuestion(qIdx, 'mapping_tag', e.target.value)}>
                                                            <option value="IDENTITY">Identidade</option>
                                                            <option value="EDUCATION">Educação</option>
                                                            <option value="DIGITAL">Digital</option>
                                                            <option value="GOV_AID">Assistência</option>
                                                            <option value="FAMILY">Família</option>
                                                            <option value="HEALTH">Saúde</option>
                                                            <option value="FINANCE">Renda</option>
                                                            <option value="WORK">Profissão</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => setEditingSurvey({ ...editingSurvey, questions: [...(editingSurvey.questions || []), { id: `q_${Date.now()}`, text: 'Nova Pergunta', type: 'text', required: 1, mapping_tag: 'SOCIAL' }] })} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-none text-[9px] font-black uppercase text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all">+ Adicionar Atributo</button>
                                </section>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-slate-50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-none animate-pulse" /><span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">SRE Core Sync active</span></div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-400 font-black text-[8px] uppercase tracking-widest hover:text-slate-600">Fechar</button>
                                <button onClick={handleSave} disabled={isSaving} className="px-8 py-2 bg-slate-900 text-white rounded-none font-black text-[9px] uppercase tracking-widest shadow-xl">Salvar Estrutura</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Surveys;

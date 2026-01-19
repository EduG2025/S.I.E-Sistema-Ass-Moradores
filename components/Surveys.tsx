
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
            // ESFERA 1: IDENTIDADE
            { id: 'ident_01', text: 'Estado Civil do Titular', type: 'select', options: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'], required: 1, mapping_tag: 'IDENTITY' },
            { id: 'ident_02', text: 'Cor ou Raça (Autodeclaração)', type: 'select', options: ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena'], required: 1, mapping_tag: 'IDENTITY' },

            // ESFERA 2: EDUCAÇÃO
            { id: 'edu_01', text: 'Nível de Escolaridade do Titular', type: 'select', options: ['Analfabeto', 'Fundamental', 'Médio', 'Técnico', 'Superior', 'Pós-Graduação'], required: 1, mapping_tag: 'EDUCATION' },
            { id: 'edu_02', text: 'Há moradores em idade escolar (0-17 anos) na unidade?', type: 'boolean', required: 1, mapping_tag: 'EDUCATION' },
            { id: 'edu_03', text: 'Os estudantes utilizam transporte escolar público?', type: 'boolean', required: 0, mapping_tag: 'EDUCATION', logic: { show_if_question: 'edu_02', show_if_value: 'SIM' } },

            // ESFERA 3: BENEFÍCIOS SOCIAIS (CADÚNICO / BOLSA FAMÍLIA)
            { id: 'soc_01', text: 'A família possui inscrição ativa no CadÚnico?', type: 'boolean', required: 1, mapping_tag: 'GOV_AID' },
            { id: 'soc_02', text: 'Informe seu Número do NIS:', type: 'text', required: 0, mapping_tag: 'GOV_AID', logic: { show_if_question: 'soc_01', show_if_value: 'SIM' } },
            { id: 'soc_03', text: 'Recebe o Programa Bolsa Família?', type: 'boolean', required: 1, mapping_tag: 'GOV_AID' },
            { id: 'soc_04', text: 'Recebe BPC (Benefício de Prestação Continuada)?', type: 'boolean', required: 1, mapping_tag: 'GOV_AID' },
            { id: 'soc_05', text: 'Possui a Tarifa Social de Energia Elétrica ou Água?', type: 'boolean', required: 1, mapping_tag: 'GOV_AID' },

            // ESFERA 4: INCLUSÃO DIGITAL
            { id: 'dig_01', text: 'Possui acesso à Internet em casa?', type: 'select', options: ['Sim, Banda Larga', 'Sim, apenas Celular', 'Não possui'], required: 1, mapping_tag: 'DIGITAL' },
            { id: 'dig_02', text: 'Quantos computadores ou notebooks funcionais existem na casa?', type: 'number', required: 1, mapping_tag: 'DIGITAL' },

            // ESFERA 5: NÚCLEO FAMILIAR (REPETIDOR)
            { id: 'fam_01', text: 'Existem dependentes ou outros moradores?', type: 'boolean', required: 1, mapping_tag: 'FAMILY' },
            { 
                id: 'fam_02', 
                text: 'Cadastro de Moradores Adicionais', 
                type: 'repeater', 
                required: 0, 
                mapping_tag: 'FAMILY',
                logic: { show_if_question: 'fam_01', show_if_value: 'SIM' },
                repeater_fields: [
                    { id: 'dep_nome', text: 'Nome Completo', type: 'text', required: 1 },
                    { id: 'dep_parent', text: 'Parentesco', type: 'select', options: ['Filho(a)', 'Cônjuge', 'Pai/Mãe', 'Neto(a)', 'Outros'], required: 1 },
                    { id: 'dep_nasc', text: 'Nascimento', type: 'date', required: 1 }
                ]
            },

            // ESFERA 6: SAÚDE & RISCO
            { id: 'health_01', text: 'Algum morador possui deficiência (PCD)?', type: 'boolean', required: 1, mapping_tag: 'HEALTH' },
            { id: 'health_02', text: 'Possui doença crônica que exija medicação contínua?', type: 'boolean', required: 1, mapping_tag: 'HEALTH' },

            // ESFERA 7: TRABALHO & ECONOMIA
            { id: 'work_01', text: 'Situação de Trabalho do Titular', type: 'select', options: ['CLT', 'MEI/Autônomo', 'Desempregado', 'Aposentado'], required: 1, mapping_tag: 'WORK' },
            { id: 'work_02', text: 'Gostaria de oferecer seus serviços no Marketplace S.I.E?', type: 'boolean', required: 1, mapping_tag: 'WORK' }
        ];

        setEditingSurvey({
            title: 'Censo Socioeconômico e Educacional 2025 - S.I.E PRO',
            description: 'Mapeamento integral de vulnerabilidade, educação e capital intelectual para governança ativa.',
            type: 'CENSUS',
            status: 'ACTIVE',
            questions: masterQuestions
        });
        setIsModalOpen(true);
    };

    const handleCopyLink = (id: string | number) => {
        const url = `${window.location.origin}/census/${id}`;
        navigator.clipboard.writeText(url);
        alert("✅ Link público copiado para clipboard.");
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
        } catch (e) { alert("Motor IA indisponível."); } 
        finally { setIsGeneratingIA(false); }
    };

    const handleSave = async (e: any) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!editingSurvey?.title) return alert("Defina um título.");
        setIsSaving(true);
        try {
            const payload = { ...editingSurvey };
            const sanitizedQuestions = (payload.questions || []).map((q: any) => ({
                id: q.id,
                text: q.text,
                type: q.type,
                options: q.options || [],
                mapping_tag: q.mapping_tag || 'SOCIAL',
                required: q.required ? 1 : 0,
                logic: q.logic || null,
                repeater_fields: q.repeater_fields || []
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
            alert("✅ Protocolo Social Sincronizado.");
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

    const addRepeaterField = (qIdx: number) => {
        const qs = [...(editingSurvey.questions)];
        const fields = qs[qIdx].repeater_fields || [];
        fields.push({ id: `rf_${Date.now()}`, text: 'Novo Atributo', type: 'text', required: 1 });
        qs[qIdx].repeater_fields = fields;
        setEditingSurvey({ ...editingSurvey, questions: qs });
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in h-full relative">
            <div className="flex flex-row justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shrink-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><Database size={24}/></div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight uppercase leading-none">Censo & Inteligência</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2 opacity-80">Full Social Architecture V9.0</p>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    <button onClick={handleInjectMaster} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-emerald-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 border border-white/5 shadow-2xl">
                        <HandHelping size={20} /> Injetar Censo Mestre 2025
                    </button>
                    <button onClick={() => { setEditingSurvey({ title: '', description: '', type: 'CENSUS', questions: [], status: 'ACTIVE' }); setIsModalOpen(true); }} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                        <Plus size={20} /> Novo Formulário
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} style={{ color: primaryColor }}/></div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {surveys.map(s => (
                            <div key={String(s.id)} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col h-fit relative">
                                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                    <button onClick={() => { setSelectedSurvey(s); setIsAnalyticsOpen(true); }} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 rounded-xl shadow-sm transition-all"><BarChart3 size={16} /></button>
                                    <button onClick={() => handleCopyLink(s.id)} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm transition-all"><Share2 size={16} /></button>
                                    <button onClick={() => { setEditingSurvey(s); setIsModalOpen(true); }} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm transition-all"><Edit2 size={16} /></button>
                                    <button onClick={async () => { if(confirm("Remover permanentemente este protocolo?")) { await surveyService.delete(s.id); loadSurveys(); } }} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 rounded-xl shadow-sm transition-all"><Trash2 size={16} /></button>
                                </div>
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded-lg border border-indigo-100 tracking-widest" style={{ color: primaryColor, backgroundColor: primaryColor + '10', borderColor: primaryColor + '30' }}>{s.type}</span>
                                    <span className={`px-3 py-1 ${s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} text-[8px] font-black uppercase rounded-lg border border-emerald-100`}>{s.status}</span>
                                </div>
                                <h3 className="text-base font-black text-slate-800 uppercase tracking-tight truncate mb-2">{s.title || 'Sem Título'}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase line-clamp-2 leading-relaxed italic">{s.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && editingSurvey && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/10">
                            <div className="flex items-center gap-5">
                                <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl" style={{ backgroundColor: primaryColor }}><Brain size={22} className="text-white"/></div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Arquiteto de Senso</h3>
                                    <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">Full Social Architecture V9.0</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={handleSuggestIA} disabled={isGeneratingIA} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-indigo-300 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 border border-white/5">
                                    {isGeneratingIA ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>} IA Predict
                                </button>
                                <button onClick={handleSave} disabled={isSaving} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl active:scale-95" style={{ backgroundColor: primaryColor }}>
                                    {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Commitar Protocolo
                                </button>
                                <button onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#fdfdfe] relative">
                            <div className="max-w-7xl mx-auto space-y-12 pb-10">
                                <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200 shadow-inner space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Protocolo</label>
                                            <input className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-2xl focus:border-indigo-500 transition-all shadow-sm uppercase" placeholder="Ex: Censo Socioeconômico 2025..." value={editingSurvey.title} onChange={e => setEditingSurvey({ ...editingSurvey, title: e.target.value })} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motor de Análise</label>
                                            <select className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-sm uppercase shadow-sm appearance-none focus:border-indigo-500" value={editingSurvey.type} onChange={e => setEditingSurvey({ ...editingSurvey, type: e.target.value })}>
                                                <option value="CENSUS">Censo Biopsicossocial</option>
                                                <option value="SOCIAL_AID">Auxílio & ESG (Social)</option>
                                                <option value="SATISFACTION">Engajamento Comunitário</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <section className="space-y-8">
                                    <div className="flex justify-between items-center px-4">
                                        <div className="flex items-center gap-4">
                                            <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Atributos Sociais</h4>
                                            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-4 py-1 rounded-full border border-emerald-100">{editingSurvey.questions?.length || 0} Campos</span>
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        {editingSurvey.questions?.map((q: any, qIdx: number) => (
                                            <div key={q.id || qIdx} className="p-10 bg-white rounded-[3rem] border border-slate-200 shadow-sm relative group hover:border-indigo-300 transition-all">
                                                <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => {
                                                        const qs = [...editingSurvey.questions];
                                                        const target = qIdx - 1;
                                                        if (target >= 0) { [qs[qIdx], qs[target]] = [qs[target], qs[qIdx]]; setEditingSurvey({...editingSurvey, questions: qs}); }
                                                    }} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm"><ChevronUp size={18}/></button>
                                                    <button onClick={() => {
                                                        const qs = [...editingSurvey.questions];
                                                        const target = qIdx + 1;
                                                        if (target < qs.length) { [qs[qIdx], qs[target]] = [qs[target], qs[qIdx]]; setEditingSurvey({...editingSurvey, questions: qs}); }
                                                    }} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm"><ChevronDown size={18}/></button>
                                                    <button onClick={() => {
                                                        const qs = [...editingSurvey.questions]; qs.splice(qIdx, 1); setEditingSurvey({...editingSurvey, questions: qs});
                                                    }} className="p-3 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                                    <div className="md:col-span-6 space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pergunta do Censo</label>
                                                        <input className="w-full font-black h-12 bg-slate-50 border-slate-200 rounded-xl px-5 text-sm uppercase" value={q.text} onChange={e => updateQuestion(qIdx, 'text', e.target.value)} />
                                                    </div>
                                                    <div className="md:col-span-3 space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Formato</label>
                                                        <select className="w-full font-black h-12 bg-slate-50 border-slate-200 rounded-xl px-5 text-[10px] uppercase" value={q.type} onChange={e => updateQuestion(qIdx, 'type', e.target.value)}>
                                                            <option value="text">Texto Livre</option>
                                                            <option value="number">Numérico</option>
                                                            <option value="boolean">Sim / Não</option>
                                                            <option value="select">Seleção Única</option>
                                                            <option value="date">Data</option>
                                                            <option value="repeater">Repetidor (Entidades)</option>
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-3 space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tag de BI (SRE)</label>
                                                        <select className="w-full font-black h-12 bg-indigo-50 border-indigo-100 rounded-xl px-5 text-[10px] uppercase text-indigo-600" value={q.mapping_tag} onChange={e => updateQuestion(qIdx, 'mapping_tag', e.target.value)} style={{ color: primaryColor, backgroundColor: primaryColor + '10', borderColor: primaryColor + '30' }}>
                                                            <option value="IDENTITY">Identidade / Civil</option>
                                                            <option value="EDUCATION">Educação / Escolas</option>
                                                            <option value="DIGITAL">Inclusão Digital</option>
                                                            <option value="GOV_AID">Assistência Gov / NIS</option>
                                                            <option value="FAMILY">Família / Membros</option>
                                                            <option value="HEALTH">Saúde / PCD</option>
                                                            <option value="FINANCE">Financeiro / Renda</option>
                                                            <option value="WORK">Trabalho / Profissão</option>
                                                            <option value="TALENT">Talento / Habilidade</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {q.type === 'select' && (
                                                    <div className="mt-4 space-y-2 pl-6">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Opções (Separadas por vírgula)</label>
                                                        <input className="w-full h-10 bg-white border border-slate-200 rounded-lg px-4 text-xs font-bold" value={q.options?.join(', ') || ''} onChange={e => updateQuestion(qIdx, 'options', e.target.value.split(',').map(o => o.trim()))} placeholder="Ex: Opção A, Opção B" />
                                                    </div>
                                                )}

                                                <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                                                    <h5 className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-2"><GitBranch size={12}/> Lógica Condicional</h5>
                                                    <div className="flex flex-wrap gap-4 items-center">
                                                        <span className="text-[9px] font-bold uppercase text-slate-400">Mostrar se:</span>
                                                        <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[9px] font-black uppercase" value={q.logic?.show_if_question || ''} onChange={e => updateQuestion(qIdx, 'logic', { ...q.logic, show_if_question: e.target.value })}>
                                                            <option value="">(Sempre Visível)</option>
                                                            {editingSurvey.questions.filter((_q: any, i: number) => i < qIdx).map((prevQ: any) => (
                                                                <option key={prevQ.id} value={prevQ.id}>{prevQ.text.slice(0, 30)}...</option>
                                                            ))}
                                                        </select>
                                                        <span className="text-[9px] font-bold uppercase text-slate-400">for respondida com:</span>
                                                        <input className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[9px] font-black uppercase w-32" value={q.logic?.show_if_value || ''} onChange={e => updateQuestion(qIdx, 'logic', { ...q.logic, show_if_value: e.target.value })} placeholder="Ex: SIM" />
                                                    </div>
                                                </div>

                                                {q.type === 'repeater' && (
                                                    <div className="mt-6 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
                                                        <h5 className="text-[9px] font-black uppercase text-indigo-600 flex items-center gap-2" style={{ color: primaryColor }}><ListPlus size={12}/> Campos da Entidade</h5>
                                                        <div className="space-y-3">
                                                            {q.repeater_fields?.map((rf: any, rfIdx: number) => (
                                                                <div key={rf.id || rfIdx} className="flex gap-3 items-center bg-white p-3 rounded-xl border border-indigo-100">
                                                                    <input className="flex-1 text-[10px] font-bold uppercase outline-none" value={rf.text} onChange={e => {
                                                                        const fields = [...q.repeater_fields];
                                                                        fields[rfIdx].text = e.target.value;
                                                                        updateQuestion(qIdx, 'repeater_fields', fields);
                                                                    }} />
                                                                    <select className="text-[9px] font-black uppercase bg-slate-50 px-2 py-1 rounded" value={rf.type} onChange={e => {
                                                                        const fields = [...q.repeater_fields];
                                                                        fields[rfIdx].type = e.target.value;
                                                                        updateQuestion(qIdx, 'repeater_fields', fields);
                                                                    }}>
                                                                        <option value="text">Texto</option>
                                                                        <option value="number">Número</option>
                                                                        <option value="date">Data</option>
                                                                        <option value="select">Seleção</option>
                                                                    </select>
                                                                    <button onClick={() => {
                                                                        const fields = [...q.repeater_fields];
                                                                        fields.splice(rfIdx, 1);
                                                                        updateQuestion(qIdx, 'repeater_fields', fields);
                                                                    }} className="text-rose-400 hover:text-rose-600"><Trash2 size={14}/></button>
                                                                </div>
                                                            ))}
                                                            <button onClick={() => addRepeaterField(qIdx)} className="w-full py-3 border-2 border-dashed border-indigo-200 rounded-xl text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all" style={{ color: primaryColor, borderColor: primaryColor + '40' }}>+ Novo Atributo da Entidade</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>

                        <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SRE Social Core Sync v9.0</span></div>
                            <div className="flex gap-4">
                                <button onClick={() => setIsModalOpen(false)} className="px-8 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Fechar</button>
                                <button onClick={handleSave} disabled={isSaving} className="px-10 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all">Salvar Estrutura</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Surveys;

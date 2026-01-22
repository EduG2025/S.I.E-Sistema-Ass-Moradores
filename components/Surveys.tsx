import React, { useState, useEffect } from 'react';
import { Survey, SurveyQuestion, SystemInfo } from '../types';
import { surveyService } from '../services/api';
import {
    Plus, X, Trash2, Edit2, Loader2, Save, Share2, Link, Eye, Brain, Database,
    Sparkles, ClipboardCheck, GraduationCap, HandHelping, ChevronRight, AlertCircle,
    Info, Search, Layout, Settings, ListPlus, GitBranch, Table, Activity, Zap
} from 'lucide-react';

interface SurveysProps {
    systemInfo: SystemInfo;
}

const Surveys = ({ systemInfo }: SurveysProps) => {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingIA, setIsGeneratingIA] = useState(false);
    const [editingSurvey, setEditingSurvey] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => { loadSurveys(); }, []);

    const loadSurveys = async () => {
        setIsLoading(true);
        try {
            const res = await surveyService.getAll();
            setSurveys(res.data?.data || []);
        } catch (err) { setSurveys([]); } 
        finally { setIsLoading(false); }
    };

    const handleInjectMaster = () => {
        const masterQuestions: SurveyQuestion[] = [
            { id: 'ident_01', text: 'Estado Civil do Titular', type: 'select', options: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'], required: 1, mapping_tag: 'IDENTITY' },
            { id: 'ident_02', text: 'Cor ou Raça (Autodeclaração)', type: 'select', options: ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena'], required: 1, mapping_tag: 'IDENTITY' },
            { id: 'edu_01', text: 'Nível de Escolaridade do Titular', type: 'select', options: ['Analfabeto', 'Fundamental', 'Médio', 'Técnico', 'Superior', 'Pós-Graduação'], required: 1, mapping_tag: 'EDUCATION' },
            { id: 'soc_01', text: 'A família possui inscrição ativa no CadÚnico?', type: 'boolean', required: 1, mapping_tag: 'GOV_AID' },
            { id: 'health_01', text: 'Algum morador possui deficiência (PCD)?', type: 'boolean', required: 1, mapping_tag: 'HEALTH' },
            { id: 'work_01', text: 'Situação de Trabalho do Titular', type: 'select', options: ['CLT', 'MEI/Autônomo', 'Desempregado', 'Aposentado'], required: 1, mapping_tag: 'WORK' }
        ];

        setEditingSurvey({
            title: 'Censo Socioeconômico Master 2025',
            description: 'Mapeamento integral de vulnerabilidade e demografia do cluster.',
            type: 'CENSUS',
            status: 'ACTIVE',
            questions: masterQuestions
        });
        setIsModalOpen(true);
    };

    const handleCopyLink = (id: string | number) => {
        const url = `${window.location.origin}/census/${id}`;
        navigator.clipboard.writeText(url);
        alert("✅ Link público copiado para a área de transferência.");
    };

    const handleSuggestIA = async () => {
        if (!editingSurvey?.title) return alert("Defina um título para que a IA entenda o contexto.");
        setIsGeneratingIA(true);
        try {
            const res = await surveyService.suggestQuestions({ 
                title: editingSurvey.title, 
                description: editingSurvey.description, 
                type: editingSurvey.type 
            });
            const suggested = res.data.data.map((q: any) => ({
                id: `ia_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                ...q,
                required: 1
            }));
            setEditingSurvey({ ...editingSurvey, questions: [...(editingSurvey.questions || []), ...suggested] });
        } catch (e) { alert("IA Mentor temporariamente offline."); } 
        finally { setIsGeneratingIA(false); }
    };

    const handleSave = async () => {
        if (!editingSurvey?.title) return alert("O título do protocolo é obrigatório.");
        setIsSaving(true);
        try {
            const payload = { ...editingSurvey };
            if (payload.id && !String(payload.id).startsWith('temp_')) { 
                await surveyService.update(payload.id, payload); 
            } else { 
                delete payload.id; 
                await surveyService.create(payload); 
            }
            setIsModalOpen(false);
            loadSurveys();
        } catch (err: any) { alert("Erro ao comitar estrutura no banco de dados."); } 
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
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in h-full relative">
            {/* Header do Módulo */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl shrink-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-2xl" style={{ backgroundColor: primaryColor }}><Database size={28}/></div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Censo & Inteligência</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2 opacity-80">Full Social Architecture • Protocolo SRE V10.0</p>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    <button onClick={handleInjectMaster} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-emerald-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 border border-white/5">
                        <Zap size={20} className="animate-pulse" /> Injetar Mestre
                    </button>
                    <button onClick={() => { setEditingSurvey({ title: '', description: '', type: 'CENSUS', questions: [], status: 'ACTIVE' }); setIsModalOpen(true); }} className="px-10 py-4 bg-white text-slate-950 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all active:scale-95 flex items-center gap-3">
                        <Plus size={22} /> Novo Protocolo
                    </button>
                </div>
            </div>

            {/* Listagem de Formulários */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-12">
                <div className="p-8 bg-white rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col min-h-full">
                    <div className="flex justify-between items-center mb-10 pb-8 border-b border-slate-100">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <input type="text" placeholder="Filtrar base de censos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 h-14 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none focus:bg-white focus:border-indigo-500 transition-all" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-100">{surveys.length} Registros Mapeados</span>
                    </div>

                    {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={48}/></div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {surveys.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                                <div key={s.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 hover:border-indigo-200 hover:shadow-2xl transition-all group flex flex-col min-h-[340px] relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-2 h-full ${s.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-slate-300'}`}></div>
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shadow-inner"><ClipboardCheck size={24} /></div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                            <button onClick={() => handleCopyLink(s.id)} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm" title="Link Público"><Link size={18} /></button>
                                            <button onClick={() => { setEditingSurvey(s); setIsModalOpen(true); }} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-amber-600 rounded-xl shadow-sm"><Edit2 size={18} /></button>
                                            <button onClick={() => { if(confirm("Remover protocolo permanentemente?")) surveyService.delete(s.id).then(loadSurveys); }} className="p-3 bg-white border border-slate-100 text-slate-300 hover:text-rose-600 rounded-xl shadow-sm"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-4 leading-tight flex-1 line-clamp-2">{s.title || 'Sem Título'}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-8 line-clamp-3 leading-relaxed italic">{s.description}</p>
                                    
                                    <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>{s.status}</span>
                                        <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest"><Table size={14}/> {s.questions?.length || 0} Atributos</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {surveys.length === 0 && !isLoading && (
                        <div className="flex-1 flex flex-col items-center justify-center py-40">
                            <Database size={64} className="text-slate-100 mb-6" />
                            <p className="font-black uppercase text-[10px] text-slate-300 tracking-[0.4em]">Nenhum protocolo de censo ativo no cluster.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: ARQUITETO DE SENSO (WORKSPACE) */}
            {isModalOpen && editingSurvey && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container">
                        <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 shadow-2xl relative z-20">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><Brain size={28}/></div>
                                <div>
                                    <h3 className="font-black text-2xl uppercase tracking-tighter leading-none">Arquiteto de Senso</h3>
                                    <p className="text-indigo-400 text-[10px] font-black uppercase mt-2 tracking-widest opacity-80">Full Social Architecture • V2 UI</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={handleSuggestIA} disabled={isGeneratingIA} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-indigo-300 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 border border-white/10">
                                    {isGeneratingIA ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18} className="text-amber-400" />} IA Predict
                                </button>
                                <button onClick={handleSave} disabled={isSaving} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all" style={{ backgroundColor: primaryColor }}>
                                    {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} Commitar Protocolo
                                </button>
                                <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-rose-500 hover:text-white text-slate-400 rounded-2xl transition-all border border-white/5 ml-4"><X size={32}/></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#fdfdfe] relative">
                            <div className="max-w-5xl mx-auto space-y-12 pb-20">
                                
                                {/* Definição de Contexto */}
                                <div className="bg-slate-50 p-12 rounded-[4rem] border border-slate-200 shadow-inner space-y-10">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Título do Protocolo</label>
                                        <input className="w-full font-black h-20 bg-white border border-slate-200 rounded-[2rem] px-8 text-3xl focus:border-indigo-500 outline-none uppercase shadow-sm" placeholder="Ex: Censo de Saúde 2025..." value={editingSurvey.title} onChange={e => setEditingSurvey({ ...editingSurvey, title: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Objetivo Estratégico</label>
                                            <select className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-sm uppercase shadow-sm outline-none focus:border-indigo-500 appearance-none cursor-pointer" value={editingSurvey.type} onChange={e => setEditingSurvey({ ...editingSurvey, type: e.target.value })}>
                                                <option value="CENSUS">Censo Biopsicossocial (Territorial)</option>
                                                <option value="SOCIAL_AID">Auxílio & ESG (Gestão de Recursos)</option>
                                                <option value="SATISFACTION">Engajamento Comunitário (NPS)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Status do Link</label>
                                            <select className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-sm uppercase shadow-sm outline-none focus:border-indigo-500 appearance-none cursor-pointer" value={editingSurvey.status} onChange={e => setEditingSurvey({ ...editingSurvey, status: e.target.value })}>
                                                <option value="ACTIVE">Online / Recebendo Respostas</option>
                                                <option value="INACTIVE">Offline / Link Bloqueado</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Descrição / Instruções (Membro)</label>
                                        <textarea rows={4} className="w-full font-medium bg-white border border-slate-200 rounded-[2.5rem] p-10 text-lg focus:border-indigo-500 outline-none shadow-sm uppercase leading-relaxed" placeholder="Descreva a importância deste censo para a comunidade..." value={editingSurvey.description} onChange={e => setEditingSurvey({ ...editingSurvey, description: e.target.value })} />
                                    </div>
                                </div>

                                {/* Matriz de Atributos (Questões) */}
                                <section className="space-y-8">
                                    <div className="flex items-center justify-between px-4">
                                        <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-4">
                                            <ListPlus size={28} className="text-indigo-600"/> Matriz de Atributos
                                        </h4>
                                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-5 py-2 rounded-full border border-emerald-100 shadow-sm">{editingSurvey.questions?.length || 0} Campos Mapeados</span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        {editingSurvey.questions?.map((q: any, qIdx: number) => (
                                            <div key={q.id || qIdx} className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all relative group">
                                                <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                    <button onClick={() => {
                                                        const qs = [...editingSurvey.questions]; qs.splice(qIdx, 1); setEditingSurvey({...editingSurvey, questions: qs});
                                                    }} className="p-3 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={20} /></button>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                                    <div className="md:col-span-6 space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pergunta do Protocolo</label>
                                                        <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-base focus:bg-white focus:border-indigo-500 outline-none uppercase" value={q.text} onChange={e => updateQuestion(qIdx, 'text', e.target.value)} />
                                                    </div>
                                                    <div className="md:col-span-3 space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Formato de Resposta</label>
                                                        <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-[10px] uppercase outline-none focus:bg-white focus:border-indigo-500" value={q.type} onChange={e => updateQuestion(qIdx, 'type', e.target.value)}>
                                                            <option value="text">Texto Livre</option>
                                                            <option value="number">Número / Quantidade</option>
                                                            <option value="boolean">Sim ou Não (Binário)</option>
                                                            <option value="select">Seleção Única (Dropdown)</option>
                                                            <option value="date">Data (Picker)</option>
                                                            <option value="repeater">Repetidor (Add Dinâmico)</option>
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-3 space-y-2">
                                                        <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Mapeamento de BI</label>
                                                        <select className="w-full font-black h-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl px-6 text-[10px] uppercase outline-none focus:bg-white" value={q.mapping_tag} onChange={e => updateQuestion(qIdx, 'mapping_tag', e.target.value)}>
                                                            <option value="IDENTITY">Identidade / Civil</option>
                                                            <option value="EDUCATION">Educação / Escolaridade</option>
                                                            <option value="DIGITAL">Acesso Digital / Conectividade</option>
                                                            <option value="GOV_AID">Assistência / Benefícios</option>
                                                            <option value="HEALTH">Saúde / PCD / Vulnerabilidade</option>
                                                            <option value="FINANCE">Renda / Econômico</option>
                                                            <option value="WORK">Profissão / Trabalho</option>
                                                        </select>
                                                    </div>

                                                    {q.type === 'select' && (
                                                        <div className="md:col-span-12 space-y-2 pt-4 border-t border-slate-100">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Opções de Seleção (Separadas por Vírgula)</label>
                                                            <input className="w-full font-medium h-12 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm outline-none focus:bg-white" placeholder="Opção 1, Opção 2, Opção 3..." value={q.options?.join(', ')} onChange={e => updateQuestion(qIdx, 'options', e.target.value.split(',').map((s: string) => s.trim()))} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => setEditingSurvey({ ...editingSurvey, questions: [...(editingSurvey.questions || []), { id: `q_${Date.now()}`, text: 'Novo Atributo', type: 'text', required: 1, mapping_tag: 'IDENTITY' }] })} className="w-full py-10 border-4 border-dashed border-slate-200 rounded-[3rem] text-sm font-black uppercase tracking-[0.4em] text-slate-300 hover:text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 transition-all active:scale-[0.99] flex flex-col items-center gap-4">
                                        <Plus size={32}/> Adicionar Atributo ao Protocolo
                                    </button>
                                </section>
                            </div>
                        </div>

                        <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SRE Core Sync Active • Handshake Protocol OK</span></div>
                            <div className="flex gap-4">
                                <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600">Abortar</button>
                                <button onClick={handleSave} className="px-12 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all">Salvar Estrutura</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Surveys;
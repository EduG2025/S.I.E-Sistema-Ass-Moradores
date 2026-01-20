
import React, { useState, useEffect, useRef } from 'react';
import { Survey, SurveyQuestion, SystemInfo } from '../types';
import { api } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import {
    ShieldCheck, CheckCircle2, X, Fingerprint, Loader2, Save, ChevronRight, 
    AlertTriangle, Users, Plus, Trash2, ArrowRight, Brain, Sparkles, ClipboardList,
    ChevronLeft, RotateCcw, HeartPulse, User, MapPin, Building, Laptop, GraduationCap, HandHelping, Landmark, Info, Calendar
} from 'lucide-react';

const PublicSenso = () => {
    const [survey, setSurvey] = useState(null as Survey | null);
    const [systemInfo, setSystemInfo] = useState(null as SystemInfo | null);
    const [step, setStep] = useState('IDENTIFY' as 'IDENTIFY' | 'FORM' | 'REVIEW' | 'SUCCESS');
    const [currentSection, setCurrentSection] = useState(0); 
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [error, setError] = useState('');
    const [cpfIdentifier, setCpfIdentifier] = useState('');
    const [aiSummary, setAiSummary] = useState('');

    const [userData, setUserData] = useState({ name: '', unit: '', email: '', phone: '', birthDate: '' });
    const [answers, setAnswers] = useState({} as Record<string, any>);

    useEffect(() => {
        const saved = localStorage.getItem('sie_census_draft');
        if (saved) {
            try {
                const { cpf, ans, usr } = JSON.parse(saved);
                setCpfIdentifier(cpf);
                setAnswers(ans);
                setUserData(usr);
            } catch (e) { localStorage.removeItem('sie_census_draft'); }
        }
        
        const paths = window.location.pathname.split('/');
        const id = paths[paths.length - 1];
        if (id && id !== 'census') {
            loadSurvey(id);
            loadSystemInfo();
        } else { setError('Protocolo de link inválido.'); }
    }, []);

    useEffect(() => {
        if (cpfIdentifier) {
            localStorage.setItem('sie_census_draft', JSON.stringify({ 
                cpf: cpfIdentifier, ans: answers, usr: userData 
            }));
        }
    }, [answers, userData, cpfIdentifier]);

    const loadSystemInfo = async () => {
        try { 
            const res = await api.get('/settings/system'); 
            setSystemInfo(res.data); 
        } catch (e) { console.error("Identity Offline"); }
    };

    const loadSurvey = async (id: string) => {
        setIsLoading(true);
        try { 
            const res = await api.get(`/surveys/public/${id}`); 
            setSurvey(res.data); 
        } catch (e) { 
            setError('Formulário indisponível.'); 
        } finally { setIsLoading(false); }
    };

    const handleIdentify = async () => {
        const cleanCPF = normalizeCPF(cpfIdentifier);
        if (!validateCPF(cleanCPF)) { setError('Assinatura de CPF inválida.'); return; }

        setIsLoading(true); setError('');
        try {
            const res = await api.get(`/surveys/public/check-resident/${cleanCPF}`);
            if (res.data && res.data.found) {
                setUserData({ 
                    name: res.data.name, 
                    unit: res.data.unit || '', 
                    email: res.data.email || '', 
                    phone: res.data.phone || '',
                    birthDate: res.data.birthDate || '' // SRE: Sincronização de DOB se existir
                });
            }
            setStep('FORM');
        } catch (e) { setError('Falha no Kernel de identificação.'); } 
        finally { setIsLoading(false); }
    };

    const isQuestionVisible = (q: any) => {
        if (!q.logic || !q.logic.show_if_question) return true;
        const dependentValue = answers[q.logic.show_if_question];
        return String(dependentValue).toUpperCase() === String(q.logic.show_if_value).toUpperCase();
    };

    const visibleQuestions = survey?.questions?.filter(isQuestionVisible) || [];
    
    const questionsPerSection = 5;
    const totalSteps = Math.ceil(visibleQuestions.length / questionsPerSection) + 1;
    const progress = ((currentSection + 1) / totalSteps) * 100;

    const getCurrentQuestions = () => {
        if (currentSection === 0) return [];
        const start = (currentSection - 1) * questionsPerSection;
        return visibleQuestions.slice(start, start + questionsPerSection);
    };

    const handleNext = () => {
        if (currentSection === 0 && (!userData.name || !userData.unit || !userData.birthDate)) {
            alert("Nome, Unidade e Data de Nascimento são obrigatórios."); return;
        }
        if (currentSection < totalSteps - 1) {
            setCurrentSection(prev => prev + 1);
            window.scrollTo(0, 0);
        } else {
            handleFinalReview();
        }
    };

    const handleFinalReview = async () => {
        const missing = visibleQuestions.find(q => q.required && !answers[q.id]);
        if (missing) {
            alert(`O atributo "${missing.text}" é obrigatório.`); return;
        }
        setStep('REVIEW');
        setIsGeneratingSummary(true);
        try {
            const res = await api.post('/ai/chat', { 
                contents: `Analise este perfil demográfico: ${JSON.stringify({...userData, ...answers})}. Gere um diagnóstico social curto e humanizado sobre as necessidades e potencial desta família. Comece com "Perfil analisado..."`
            });
            setAiSummary(res.data.text);
        } catch (e) {
            setAiSummary("O Kernel S.I.E protocolou seus dados com sucesso. Sua unidade agora faz parte da malha social inteligente.");
        } finally { setIsGeneratingSummary(false); }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            await api.post(`/surveys/public/${survey?.id}/submit`, {
                cpf: normalizeCPF(cpfIdentifier),
                userData: userData, 
                answers: answers
            });
            localStorage.removeItem('sie_census_draft');
            setStep('SUCCESS');
        } catch (e: any) { alert(`Erro ao protocolar: ${e.response?.data?.error || 'Erro de rede.'}`); } 
        finally { setIsLoading(false); }
    };

    if (step === 'SUCCESS') return (
        <div className="h-screen w-screen bg-slate-950 flex items-center justify-center p-6 text-white">
            <div className="bg-white p-12 lg:p-20 rounded-[4rem] shadow-2xl max-w-2xl w-full text-center animate-scale-in">
                <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center shadow-xl mx-auto mb-10"><CheckCircle2 size={56} /></div>
                <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tightest leading-none">Dados <br/> Sincronizados</h2>
                <p className="text-slate-500 font-medium mt-6 mb-12 text-sm uppercase tracking-widest leading-relaxed italic">Sua participação fortalece a governança soberana do cluster.</p>
                <button onClick={() => window.location.href = '/'} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all">Encerrar Sessão</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen w-screen bg-[#020617] flex flex-col overflow-x-hidden relative selection:bg-indigo-600 selection:text-white">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 2px, transparent 2px)', backgroundSize: '60px 60px' }} />
            
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 py-20">
                
                {step === 'IDENTIFY' && (
                    <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-xl p-12 lg:p-20 text-center animate-scale-in">
                        <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] mx-auto flex items-center justify-center text-white shadow-2xl mb-10">
                            {systemInfo?.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain p-4" /> : <Fingerprint size={48} />}
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase mb-4 tracking-tighter">Censo Ativo 2025</h2>
                        <p className="text-slate-400 mb-12 text-[10px] font-black uppercase tracking-[0.4em]">Protocolo de Identificação SRE</p>
                        <div className="space-y-8">
                            <div className="relative">
                                <input type="text" value={cpfIdentifier} onChange={e => { setCpfIdentifier(formatCPF(e.target.value)); setError(''); }} className="w-full py-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] text-center text-3xl font-black outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase shadow-inner" placeholder="000.000.000-00" maxLength={14} />
                                {validateCPF(normalizeCPF(cpfIdentifier)) && <div className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500 animate-bounce"><ShieldCheck size={28}/></div>}
                            </div>
                            <button onClick={handleIdentify} disabled={isLoading || !validateCPF(normalizeCPF(cpfIdentifier))} className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 shadow-2xl disabled:opacity-30">
                                {isLoading ? <Loader2 className="animate-spin" /> : <>Validar CPF <ChevronRight size={20}/></>}
                            </button>
                            {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-black text-[10px] uppercase">{error}</div>}
                        </div>
                    </div>
                )}

                {step === 'FORM' && (
                    <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden animate-slide-up border border-white/20">
                        <div className="shrink-0 border-b bg-white p-12 py-8 flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl"><ClipboardList size={28}/></div>
                                <div>
                                    <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tighter leading-none">{survey?.title}</h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase mt-2 tracking-widest flex items-center gap-2">Etapa {currentSection + 1} de {totalSteps}</p>
                                </div>
                            </div>
                            <div className="hidden md:flex flex-col items-end gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{Math.round(progress)}% Concluído</span>
                                <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                                    <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-12 lg:p-20 custom-scrollbar bg-slate-50/20">
                            <div className="max-w-3xl mx-auto space-y-12">
                                {currentSection === 0 ? (
                                    <div className="space-y-8 bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
                                        <h4 className="text-sm font-black text-indigo-600 uppercase tracking-[0.4em] mb-4 border-b border-indigo-50 pb-4 flex items-center gap-3">
                                            <User size={18}/> 01. Informações Básicas
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-sm font-black uppercase focus:bg-white focus:border-indigo-500 transition-all" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} placeholder="Seu nome completo..." />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                    <input type="date" className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 text-sm font-black uppercase focus:bg-white focus:border-indigo-500 transition-all" value={userData.birthDate} onChange={e => setUserData({...userData, birthDate: e.target.value})} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Cluster</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-sm font-black uppercase focus:bg-white focus:border-indigo-500 transition-all" value={userData.unit} onChange={e => setUserData({...userData, unit: e.target.value})} placeholder="Ex: CASA 102..." />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-sm font-black lowercase focus:bg-white focus:border-indigo-500 transition-all" value={userData.email} onChange={e => setUserData({...userData, email: e.target.value})} placeholder="email@exemplo.com" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-sm font-black focus:bg-white focus:border-indigo-500 transition-all" value={userData.phone} onChange={e => setUserData({...userData, phone: e.target.value})} placeholder="Ex: 11999998888" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-12 animate-fade-in">
                                        {getCurrentQuestions().map((q, idx) => (
                                            <div key={q.id} className="p-12 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm relative group hover:border-indigo-200 transition-all">
                                                <div className="absolute -left-4 top-14 w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-xl group-hover:bg-indigo-600 transition-colors border-4 border-white">{visibleQuestions.indexOf(q) + 2}</div>
                                                <h4 className="text-2xl font-black text-slate-800 tracking-tighter uppercase mb-10 pl-6 leading-tight flex items-center gap-3">
                                                    {q.mapping_tag === 'EDUCATION' && <GraduationCap size={24} className="text-indigo-600"/>}
                                                    {q.mapping_tag === 'DIGITAL' && <Laptop size={24} className="text-indigo-600"/>}
                                                    {q.mapping_tag === 'GOV_AID' && <Landmark size={24} className="text-indigo-600"/>}
                                                    {q.mapping_tag === 'FAMILY' && <Users size={24} className="text-indigo-600"/>}
                                                    {q.mapping_tag === 'HEALTH' && <HeartPulse size={24} className="text-rose-600"/>}
                                                    {q.text}
                                                </h4>
                                                
                                                {q.type === 'repeater' ? (
                                                    <div className="space-y-6 pl-6">
                                                        {(Array.isArray(answers[q.id]) ? answers[q.id] : []).map((item: any, i: number) => (
                                                            <div key={i} className="p-10 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 space-y-8 relative animate-slide-up group/item hover:bg-white hover:border-indigo-100 transition-all shadow-inner">
                                                                <button onClick={() => { const current = [...answers[q.id]]; current.splice(i, 1); setAnswers({ ...answers, [q.id]: current }); }} className="absolute top-6 right-6 p-3 text-slate-300 hover:text-rose-500 transition-colors bg-white rounded-xl shadow-sm"><Trash2 size={20}/></button>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                    {q.repeater_fields?.map((rf: any) => (
                                                                        <div key={rf.id} className="space-y-3">
                                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{rf.text}</label>
                                                                            {rf.type === 'select' ? (
                                                                                <select className="w-full h-14 bg-white border-2 border-slate-100 rounded-xl px-6 text-xs font-bold uppercase focus:border-indigo-500 shadow-sm appearance-none" value={item[rf.id] || ''} onChange={e => { const current = [...answers[q.id]]; current[i] = { ...current[i], [rf.id]: e.target.value }; setAnswers({ ...answers, [q.id]: current }); }}>
                                                                                    <option value="">Selecione...</option>
                                                                                    {rf.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                                                                </select>
                                                                            ) : <input type={rf.type} className="w-full h-14 bg-white border-2 border-slate-100 rounded-xl px-6 text-sm font-bold uppercase focus:border-indigo-500 transition-all shadow-sm" value={item[rf.id] || ''} onChange={e => { const current = [...answers[q.id]]; current[i] = { ...current[i], [rf.id]: e.target.value }; setAnswers({ ...answers, [q.id]: current }); }} />}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <button onClick={() => { const current = Array.isArray(answers[q.id]) ? [...answers[q.id]] : []; current.push({}); setAnswers({ ...answers, [q.id]: current }); }} className="w-full py-6 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-4 font-black text-xs uppercase tracking-widest shadow-inner"><Plus size={24}/> Adicionar Registro à Lista</button>
                                                    </div>
                                                ) : q.type === 'select' ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                                                        {q.options?.map((opt: string) => (
                                                            <button key={opt} onClick={() => setAnswers({...answers, [q.id]: opt})} className={`py-6 px-8 rounded-3xl text-left font-black text-xs uppercase tracking-widest border-2 transition-all ${answers[q.id] === opt ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.02]' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-indigo-200'}`}>{opt}</button>
                                                        ))}
                                                    </div>
                                                ) : q.type === 'boolean' ? (
                                                    <div className="flex gap-6 pl-6">
                                                        {['SIM', 'NÃO'].map(val => (
                                                            <button key={val} onClick={() => setAnswers({...answers, [q.id]: val})} className={`flex-1 py-8 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] border-2 transition-all ${answers[q.id] === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-indigo-200'}`}>{val}</button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="pl-6">
                                                        <input type={q.type} value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} className="w-full h-18 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-8 text-2xl font-black uppercase focus:bg-white focus:border-indigo-500 transition-all shadow-inner" placeholder="Toque para preencher..." />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-6 pt-10">
                                    {currentSection > 0 && (
                                        <button onClick={() => setCurrentSection(prev => prev - 1)} className="flex-1 py-8 bg-slate-100 text-slate-500 rounded-[3rem] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3">
                                            <ChevronLeft size={24}/> Voltar
                                        </button>
                                    )}
                                    <button onClick={handleNext} className="flex-[2] py-8 bg-slate-900 text-white rounded-[3rem] font-black text-sm uppercase tracking-[0.5em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-6 active:scale-95 group">
                                        {currentSection === totalSteps - 1 ? 'Revisar Censo' : 'Avançar'} <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'REVIEW' && (
                    <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-4xl p-12 lg:p-20 animate-scale-in border border-slate-100">
                        <div className="flex items-center gap-6 mb-12">
                            <div className="p-5 bg-indigo-600 rounded-3xl text-white shadow-xl animate-pulse"><Brain size={32}/></div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Mapeamento Social S.I.E</h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Validação Inteligente via Gemini 3</p>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div className="p-10 bg-indigo-50 rounded-[3rem] border border-indigo-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={120} className="text-indigo-600"/></div>
                                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6 flex items-center gap-2"><Info size={14}/> Diagnóstico Social IA</h4>
                                {isGeneratingSummary ? (
                                    <div className="flex items-center gap-4 py-4">
                                        <Loader2 className="animate-spin text-indigo-600" />
                                        <span className="text-sm font-black text-indigo-400 uppercase animate-pulse">Processando matriz socioeconômica...</span>
                                    </div>
                                ) : <p className="text-indigo-900 text-lg font-medium leading-relaxed italic uppercase">"{aiSummary}"</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Atributos Coletados</p>
                                    <h4 className="text-3xl font-black text-slate-800">{Object.keys(answers).length} Pontos</h4>
                                </div>
                                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Unidade Alvo</p>
                                    <h4 className="text-3xl font-black text-slate-800 uppercase">{userData.unit || 'PENDENTE'}</h4>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6 pt-10">
                                <button onClick={() => setStep('FORM')} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3"><ChevronLeft size={20}/> Corrigir</button>
                                <button onClick={handleSubmit} disabled={isLoading} className="flex-[2] py-6 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 active:scale-95">
                                    {isLoading ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={24}/> Protocolar Censo</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicSenso;

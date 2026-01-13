
import React, { useState, useEffect } from 'react';
import { Survey, SurveyQuestion, SystemInfo } from '../types';
import { surveyService, systemService } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import {
    ShieldCheck, CheckCircle2, ArrowRight, X, Fingerprint, Loader2, Heart, AlertTriangle, Save, Sparkles, ChevronRight
} from 'lucide-react';
import axios from 'axios';

const PublicSenso = () => {
    const [survey, setSurvey] = useState(null as Survey | null);
    const [systemInfo, setSystemInfo] = useState(null as SystemInfo | null);
    const [step, setStep] = useState('IDENTIFY' as 'IDENTIFY' | 'PERSONAL_INFO' | 'FORM' | 'SUCCESS');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [cpfIdentifier, setCpfIdentifier] = useState('');

    const [userData, setUserData] = useState({ name: '', unit: '', email: '', phone: '' });
    const [answers, setAnswers] = useState({} as Record<string, any>);

    useEffect(() => {
        const paths = window.location.pathname.split('/');
        const id = paths[paths.length - 1];
        if (id && id !== 'census') {
            loadSurvey(id);
            loadSystemInfo();
        } else { setError('Protocolo de link inválido.'); }
    }, []);

    const loadSystemInfo = async () => {
        try { 
            const res = await systemService.getInfo(); 
            setSystemInfo(res.data); 
        } catch (e) { 
            console.error("[SRE] Identity Offline"); 
        }
    };

    const loadSurvey = async (id: string) => {
        setIsLoading(true);
        try { 
            const res = await surveyService.getPublic(id); 
            setSurvey(res.data); 
        } catch (e) { 
            setError('Formulário de pesquisa indisponível ou desativado.'); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleIdentify = async () => {
        const cleanCPF = normalizeCPF(cpfIdentifier);
        if (cleanCPF.length !== 11) { setError('O CPF deve conter 11 dígitos.'); return; }
        if (!validateCPF(cleanCPF)) { setError('Assinatura de CPF inválida.'); return; }

        setIsLoading(true); setError('');
        try {
            const res = await axios.get(`/api/surveys/public/check-resident/${cleanCPF}`);
            if (res.data && res.data.found) {
                setUserData({ 
                    name: res.data.name, 
                    unit: res.data.unit || '', 
                    email: res.data.email || '', 
                    phone: res.data.phone || '' 
                });
                setStep('FORM'); 
            } else { 
                setStep('PERSONAL_INFO'); 
            }
        } catch (e) { 
            setError('Falha no serviço de identificação do Kernel.'); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleSubmit = async () => {
        if (!survey) return;
        const missing = survey.questions.find(q => q.required && !answers[q.id]);
        if (missing) { alert(`Por favor, responda a questão obrigatória: ${missing.text}`); return; }

        setIsLoading(true);
        try {
            await surveyService.submitPublic(String(survey.id), {
                cpf: cpfIdentifier,
                userData, // IMPORTANTE: Enviado para auto-registro caso seja novo morador
                answers: { 
                    core: userData, 
                    social: answers,
                    metadata: { submitted_at: new Date().toISOString() }
                }
            });
            setStep('SUCCESS');
        } catch (e) { 
            alert('Falha ao comitar respostas. Tente novamente mais tarde.'); 
        } finally { 
            setIsLoading(false); 
        }
    };

    if (step === 'SUCCESS') return (
        <div className="h-screen w-screen bg-[#020617] flex items-center justify-center p-6 text-center overflow-hidden">
            <div className="bg-white p-12 lg:p-20 rounded-[3rem] shadow-2xl max-w-2xl w-full border border-emerald-100 relative">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shadow-xl animate-bounce">
                    <CheckCircle2 size={56} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight mt-6">Protocolo Finalizado</h2>
                <p className="text-slate-500 font-medium mt-4 mb-10 leading-relaxed uppercase text-[10px] tracking-widest">Sua participação foi auditada e registrada <br/>no Kernel do {systemInfo?.shortName || 'S.I.E PRO'}.</p>
                <button onClick={() => window.location.reload()} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl active:scale-95">Sair do Portal</button>
            </div>
        </div>
    );

    return (
        <div className="h-screen w-screen bg-[#020617] flex flex-col font-sans overflow-hidden relative">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 -left-40 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 -right-40 w-[40rem] h-[40rem] bg-emerald-600/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
                {step === 'IDENTIFY' ? (
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl p-10 lg:p-16 text-center animate-scale-in border border-white/20 backdrop-blur-sm">
                        <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-xl mb-8 overflow-hidden p-1">
                            {systemInfo?.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain p-2" /> : <Fingerprint size={48} />}
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase mb-2">Portal do Morador</h2>
                        <p className="text-slate-400 mb-10 text-[10px] font-black uppercase tracking-widest">Identifique-se para acessar o protocolo: <br/><span className="text-indigo-600">{survey?.title || 'FORMULÁRIO S.I.E'}</span></p>
                        
                        <div className="space-y-6">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={cpfIdentifier} 
                                    onChange={e => setCpfIdentifier(formatCPF(e.target.value))} 
                                    className="w-full py-7 bg-slate-50 border border-slate-200 rounded-[2rem] text-center text-3xl font-black outline-none shadow-inner focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-200" 
                                    placeholder="000.000.000-00" 
                                    maxLength={14} 
                                />
                            </div>
                            <button onClick={handleIdentify} disabled={isLoading} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-600 shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95">
                                {isLoading ? <Loader2 className="animate-spin" /> : <>Acessar Formulário <ChevronRight size={20}/></>}
                            </button>
                            {error && <p className="text-rose-500 font-black text-[10px] uppercase tracking-widest bg-rose-50 py-3 rounded-xl border border-rose-100">{error}</p>}
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#fcfcfd] rounded-[3.5rem] shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden animate-slide-up border border-white/20">
                        <div className="px-8 py-6 border-b bg-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-md"><ShieldCheck size={24}/></div>
                                <div>
                                    <h3 className="font-black text-lg text-slate-800 uppercase leading-none tracking-tight">{step === 'PERSONAL_INFO' ? 'Ficha Administrativa' : survey?.title}</h3>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">SRE HANDSHAKE • {systemInfo?.shortName || 'S.I.E'}</p>
                                </div>
                            </div>
                            <button onClick={() => window.location.reload()} className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-full transition-all"><X size={24}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                            <div className="max-w-3xl mx-auto h-full flex flex-col">
                                {step === 'PERSONAL_INFO' && (
                                    <div className="space-y-10 animate-fade-in">
                                        <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 flex items-start gap-6 shadow-sm">
                                            <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600"><AlertTriangle size={24}/></div>
                                            <div>
                                                <h4 className="font-black text-indigo-900 uppercase text-xs tracking-widest">Nova Provisão Detectada</h4>
                                                <p className="text-[11px] text-indigo-700 font-medium leading-relaxed mt-1 uppercase tracking-tight">Seu CPF não possui registro ativo no Kernel S.I.E. <br/>Complete sua ficha cadastral para liberar o censo.</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label><input className="w-full font-bold h-14 bg-white border border-slate-200 rounded-2xl px-6 focus:border-indigo-500 shadow-sm" value={userData.name} onChange={e => setUserData({ ...userData, name: e.target.value })} /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Lote / Bloco</label><input className="w-full font-bold h-14 bg-white border border-slate-200 rounded-2xl px-6 focus:border-indigo-500 shadow-sm" value={userData.unit} onChange={e => setUserData({ ...userData, unit: e.target.value })} /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Contato</label><input className="w-full font-bold h-14 bg-white border border-slate-200 rounded-2xl px-6 focus:border-indigo-500 shadow-sm" value={userData.email} onChange={e => setUserData({ ...userData, email: e.target.value })} /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp / Telefone</label><input className="w-full font-bold h-14 bg-white border border-slate-200 rounded-2xl px-6 focus:border-indigo-500 shadow-sm" value={userData.phone} onChange={e => setUserData({ ...userData, phone: e.target.value })} /></div>
                                        </div>
                                        <button onClick={() => { if(userData.name && userData.unit) setStep('FORM'); else alert("Os campos 'Nome' e 'Unidade' são obrigatórios para o protocolo."); }} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">Iniciar Questionário Neural</button>
                                    </div>
                                )}

                                {step === 'FORM' && (
                                    <div className="space-y-8 animate-fade-in h-full flex flex-col pb-10">
                                        <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white relative overflow-hidden shrink-0 shadow-xl">
                                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-[60px]"></div>
                                            <h3 className="text-2xl font-black uppercase tracking-tightest leading-none">{survey?.title}</h3>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-3">{survey?.description}</p>
                                        </div>

                                        <div className="flex-1 space-y-6 mt-4">
                                            {survey?.questions?.map((q: SurveyQuestion, idx: number) => (
                                                <div key={q.id} className="p-8 bg-white rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-all shadow-sm group">
                                                    <div className="flex gap-6 items-start">
                                                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors shadow-inner">{idx + 1}</div>
                                                        <div className="flex-1 space-y-5">
                                                            <label className="text-base font-black text-slate-800 tracking-tight block uppercase leading-tight">{q.text} {q.required && <span className="text-rose-500 ml-2 text-xl">*</span>}</label>
                                                            {q.type === 'select' ? (
                                                                <select value={answers[q.id] || ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} className="w-full bg-slate-50 font-bold h-14 px-6 rounded-2xl border-slate-200 text-sm focus:bg-white focus:border-indigo-500 shadow-inner appearance-none">
                                                                    <option value="">Selecione uma opção...</option>
                                                                    {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                </select>
                                                            ) : q.type === 'boolean' ? (
                                                                <div className="flex gap-4">
                                                                    {['SIM', 'NÃO'].map(val => (
                                                                        <button key={val} type="button" onClick={() => setAnswers({ ...answers, [q.id]: val })} className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 ${answers[q.id] === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}>{val}</button>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <input type={q.type} value={answers[q.id] || ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} className="w-full h-14 px-6 bg-slate-50 border-slate-200 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 shadow-inner" placeholder="Escreva sua resposta..." />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-10 sticky bottom-0 bg-[#fcfcfd]/80 backdrop-blur-md">
                                            <button onClick={handleSubmit} disabled={isLoading} className="w-full py-8 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 active:scale-95 shrink-0 border-b-4 border-indigo-800">
                                                {isLoading ? <Loader2 className="animate-spin" /> : <><Save size={24} /> Comitar Respostas no Kernel</>}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicSenso;

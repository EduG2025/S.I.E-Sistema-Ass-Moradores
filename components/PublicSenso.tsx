
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
        try { const res = await systemService.getInfo(); setSystemInfo(res.data); } 
        catch (e) { console.error("[SRE] Identity Offline"); }
    };

    const loadSurvey = async (id: string) => {
        setIsLoading(true);
        try { const res = await surveyService.getPublic(id); setSurvey(res.data); } 
        catch (e) { setError('Formulário de pesquisa indisponível.'); } 
        finally { setIsLoading(false); }
    };

    const handleIdentify = async () => {
        const cleanCPF = normalizeCPF(cpfIdentifier);
        if (cleanCPF.length !== 11) { setError('O CPF deve conter 11 dígitos.'); return; }
        if (!validateCPF(cleanCPF)) { setError('Assinatura de CPF inválida.'); return; }

        setIsLoading(true); setError('');
        try {
            // SRE FIX: Busca profunda no banco para reconhecer morador
            const res = await axios.get(`/api/surveys/public/check-resident/${cleanCPF}`);
            if (res.data.found) {
                setUserData({ 
                    name: res.data.name, 
                    unit: res.data.unit || '', 
                    email: res.data.email || '', 
                    phone: res.data.phone || '' 
                });
                console.log("[SRE] Morador identificado. Iniciando Bypass de Ficha.");
                setStep('FORM'); // BYPASS TOTAL
            } else { 
                console.log("[SRE] Novo CPF detectado. Exigindo Ficha de Inclusão.");
                setStep('PERSONAL_INFO'); 
            }
        } catch (e) { 
            setError('Serviço de identificação instável. Tente novamente.'); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleSubmit = async () => {
        if (!survey) return;
        const missing = survey.questions.find(q => q.required && !answers[q.id]);
        if (missing) { alert(`Por favor, responda a questão: ${missing.text}`); return; }

        setIsLoading(true);
        try {
            await surveyService.submitPublic(String(survey.id), {
                cpf: cpfIdentifier,
                userData,
                answers: { core: userData, social: answers }
            });
            setStep('SUCCESS');
        } catch (e) { 
            alert('Falha ao comitar respostas no Kernel.'); 
        } finally { 
            setIsLoading(false); 
        }
    };

    if (step === 'SUCCESS') return (
        <div className="h-screen bg-slate-950 flex items-center justify-center p-6 animate-fade-in text-center">
            <div className="bg-white p-20 rounded-[4rem] shadow-2xl max-w-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                <div className="w-32 h-32 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner animate-bounce">
                    <CheckCircle2 size={72} />
                </div>
                <h2 className="text-4xl font-black text-slate-800 tracking-tightest leading-none">Protocolo Finalizado</h2>
                <p className="text-slate-500 font-medium text-lg mt-6 mb-12 leading-relaxed">Sua participação foi sincronizada com o Kernel S.I.E PRO. Obrigado por colaborar.</p>
                <button onClick={() => window.location.reload()} className="px-16 py-6 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:bg-indigo-600 transition-all">Encerrar Sessão</button>
            </div>
        </div>
    );

    return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-end font-sans overflow-hidden relative">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 -left-40 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[120px]"></div>
            </div>

            {step === 'IDENTIFY' && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in">
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl p-16 text-center animate-scale-in border border-white/20">
                        <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-xl mb-10 overflow-hidden p-2">
                            {systemInfo?.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain" /> : <Fingerprint size={48} />}
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tightest uppercase mb-2">Portal de Identificação</h2>
                        <p className="text-slate-500 mb-12 leading-relaxed">Informe seu CPF para iniciar a participação no <br/><span className="font-black text-indigo-600 uppercase text-sm tracking-widest">{survey?.title || 'Censo de Governança'}</span>.</p>
                        <input 
                            type="text" 
                            value={cpfIdentifier} 
                            onChange={e => setCpfIdentifier(formatCPF(e.target.value))} 
                            className="w-full py-10 bg-slate-50 border border-slate-200 rounded-[2.5rem] text-center text-5xl font-black outline-none mb-10 shadow-inner focus:bg-white focus:border-indigo-500 transition-all" 
                            placeholder="000.000.000-00" 
                            maxLength={14} 
                        />
                        <button onClick={handleIdentify} disabled={isLoading} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-indigo-600 shadow-2xl transition-all flex items-center justify-center gap-4">
                            {isLoading ? <Loader2 className="animate-spin" /> : <>Validar Identidade <ChevronRight size={24}/></>}
                        </button>
                        {error && <p className="text-rose-500 font-black text-[10px] uppercase mt-6 tracking-widest">{error}</p>}
                    </div>
                </div>
            )}

            {(step === 'PERSONAL_INFO' || step === 'FORM') && (
                <div className="w-full h-[98vh] flex flex-col relative z-10 animate-slide-up mt-auto">
                    <div className="bg-[#fcfcfd] rounded-t-[4rem] shadow-[0_-20px_100px_rgba(0,0,0,0.3)] w-full h-full flex flex-col overflow-hidden">
                        <div className="p-10 border-b bg-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><ShieldCheck size={32}/></div>
                                <div>
                                    <h3 className="font-black text-3xl tracking-tightest uppercase text-slate-800">{step === 'PERSONAL_INFO' ? 'Ficha de Inclusão' : 'Questionário Social'}</h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">SRE Governança • Coleta Ativa</p>
                                </div>
                            </div>
                            <button onClick={() => window.location.reload()} className="p-4 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-full transition-all"><X size={32}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar">
                            <div className="max-w-4xl mx-auto">
                                {step === 'PERSONAL_INFO' && (
                                    <div className="space-y-12 animate-fade-in">
                                        <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 mb-10 flex items-start gap-4">
                                            <AlertTriangle className="text-indigo-600 shrink-0" size={24}/>
                                            <p className="text-sm text-indigo-700 font-medium leading-relaxed">Você ainda não possui cadastro mestre no S.I.E. Preencha os dados abaixo para criar sua identidade administrativa e prosseguir.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Completo</label><input className="w-full font-bold h-18 bg-white border-slate-200 text-xl rounded-3xl px-8 focus:border-indigo-500 shadow-sm" value={userData.name} onChange={e => setUserData({ ...userData, name: e.target.value })} /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Unidade / Lote</label><input className="w-full font-bold h-18 bg-white border-slate-200 text-xl rounded-3xl px-8 focus:border-indigo-500 shadow-sm" value={userData.unit} onChange={e => setUserData({ ...userData, unit: e.target.value })} /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail de Contato</label><input className="w-full font-bold h-18 bg-white border-slate-200 text-xl rounded-3xl px-8 focus:border-indigo-500 shadow-sm" value={userData.email} onChange={e => setUserData({ ...userData, email: e.target.value })} /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Telefone / WhatsApp</label><input className="w-full font-bold h-18 bg-white border-slate-200 text-xl rounded-3xl px-8 focus:border-indigo-500 shadow-sm" value={userData.phone} onChange={e => setUserData({ ...userData, phone: e.target.value })} /></div>
                                        </div>
                                        <button onClick={() => { if(userData.name && userData.unit) setStep('FORM'); else alert("Nome e Unidade são obrigatórios."); }} className="w-full py-10 bg-slate-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 transition-all">Confirmar Identidade e Iniciar Pesquisa</button>
                                    </div>
                                )}

                                {step === 'FORM' && (
                                    <div className="space-y-12 animate-fade-in pb-20">
                                        <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                                            <h3 className="text-4xl font-black uppercase tracking-tightest leading-none mb-4">{survey?.title}</h3>
                                            <p className="text-slate-400 text-lg font-medium leading-relaxed">{survey?.description}</p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-10">
                                            {survey?.questions?.map((q: SurveyQuestion, idx: number) => (
                                                <div key={q.id} className="p-12 bg-white rounded-[3.5rem] border border-slate-100 hover:border-indigo-300 transition-all shadow-sm">
                                                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10">
                                                        <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-lg">{idx + 1}</div>
                                                        <div className="flex-1 space-y-6 w-full">
                                                            <label className="text-2xl font-black text-slate-800 tracking-tight leading-tight block">{q.text} {q.required && <span className="text-rose-500 text-[10px] ml-4 font-black uppercase bg-rose-50 px-3 py-1 rounded-lg">Obrigatório</span>}</label>
                                                            {q.type === 'select' ? (
                                                                <select value={answers[q.id] || ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} className="w-full bg-slate-50 font-bold h-20 px-8 rounded-[2rem] border-slate-200 text-xl appearance-none cursor-pointer focus:bg-white transition-all shadow-inner">
                                                                    <option value="">Selecione uma opção...</option>
                                                                    {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                </select>
                                                            ) : q.type === 'boolean' ? (
                                                                <div className="grid grid-cols-2 gap-6">
                                                                    {['SIM', 'NÃO'].map(val => (
                                                                        <button key={val} type="button" onClick={() => setAnswers({ ...answers, [q.id]: val })} className={`py-8 rounded-[2rem] font-black text-xl tracking-widest transition-all border-2 ${answers[q.id] === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}`}>{val}</button>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <input type={q.type} value={answers[q.id] || ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} className="w-full h-20 px-8 bg-slate-50 border-slate-200 rounded-[2rem] font-bold text-2xl focus:bg-white transition-all shadow-inner" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={handleSubmit} disabled={isLoading} className="w-full py-10 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-6">
                                            {isLoading ? <Loader2 className="animate-spin" size={32} /> : <><Save size={32} /> Commitar Respostas no Kernel</>}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicSenso;

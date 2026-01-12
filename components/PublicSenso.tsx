
import React, { useState, useEffect } from 'react';
import { Survey, SurveyQuestion, SystemInfo } from '../types';
import { surveyService, systemService } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import {
    ShieldCheck, CheckCircle2, ArrowRight, X, Shield,
    Fingerprint, Loader2, Heart, AlertTriangle, User, Home, Mail, Check, Sparkles, Info, Save, Phone
} from 'lucide-react';
import axios from 'axios';

const PublicSenso = () => {
    const [survey, setSurvey] = useState(null as Survey | null);
    const [systemInfo, setSystemInfo] = useState(null as SystemInfo | null);
    const [step, setStep] = useState('IDENTIFY' as 'IDENTIFY' | 'PERSONAL_INFO' | 'FORM' | 'SUCCESS');
    const [activeTab, setActiveTab] = useState<'PERSONAL' | 'SOCIAL'>('PERSONAL');
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
        } else {
            setError('Acesse via link oficial da pesquisa fornecido pela administração.');
        }
    }, []);

    const loadSystemInfo = async () => {
        try {
            const res = await systemService.getInfo();
            setSystemInfo(res.data);
        } catch (e) { console.error("[SRE] Identity Offline"); }
    };

    const loadSurvey = async (id: string) => {
        setIsLoading(true);
        try {
            const res = await surveyService.getPublic(id);
            setSurvey(res.data);
        } catch (e: any) { 
            setError('Protocolo de Censo não localizado ou expirado no Kernel.'); 
        } finally {
            setIsLoading(false);
        }
    };

    const handleIdentify = async () => {
        const cleanCPF = normalizeCPF(cpfIdentifier);
        if (!cleanCPF || cleanCPF.length !== 11) { setError('Informe os 11 dígitos do seu CPF.'); return; }
        if (!validateCPF(cleanCPF)) { setError('CPF com assinatura digital inválida.'); return; }

        setIsLoading(true);
        setError('');

        try {
            // SRE FIX: Garantir que a URL de verificação passe o CPF limpo
            const res = await axios.get(`/api/surveys/public/check-resident/${cleanCPF}`);
            if (res.data.found) {
                setUserData({ 
                    name: res.data.name, 
                    unit: res.data.unit || '', 
                    email: res.data.email || '', 
                    phone: res.data.phone || '' 
                });
                // CORREÇÃO: Pula 'PERSONAL_INFO' e vai direto para 'FORM'
                setStep('FORM');
                setActiveTab('SOCIAL');
                console.log("[SRE] Membro identificado via Database. Redirecionando para Censo Neural.");
            } else { 
                console.log("[SRE] Novo CPF detectado. Solicitando Ficha de Inclusão.");
                setStep('PERSONAL_INFO'); 
            }
        } catch (e) { 
            console.error("ID_SYNC_FAIL:", e);
            setError('Falha de sincronização com o Hub. Tente novamente.'); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleSubmit = async () => {
        if (!survey) return;
        const missing = survey.questions.find(q => q.required && !answers[q.id]);
        if (missing) { alert(`Questão obrigatória não respondida: ${missing.text}`); return; }

        setIsLoading(true);
        try {
            await surveyService.submitPublic(String(survey.id), {
                cpf: cpfIdentifier,
                userData,
                answers: { core: userData, social: answers }
            });
            setStep('SUCCESS');
        } catch (e: any) { 
            setError('Falha no commit social. O Kernel rejeitou a sincronização.'); 
        } finally { 
            setIsLoading(false); 
        }
    };

    if (error && step === 'IDENTIFY') return (
        <div className="h-screen bg-slate-950 flex items-center justify-center p-6">
            <div className="bg-white p-12 rounded-[3rem] text-center max-w-lg shadow-2xl">
                <div className="p-5 bg-rose-50 text-rose-500 rounded-2xl mx-auto w-fit mb-6"><AlertTriangle size={40}/></div>
                <h3 className="text-2xl font-black text-slate-800">Falha de Protocolo</h3>
                <p className="text-slate-500 mt-4 leading-relaxed">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Tentar Novamente</button>
            </div>
        </div>
    );

    if (step === 'SUCCESS') return (
        <div className="h-screen bg-slate-950 flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white p-20 rounded-[4rem] shadow-2xl text-center max-w-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                <div className="w-32 h-32 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner animate-bounce">
                    <CheckCircle2 size={72} />
                </div>
                <h2 className="text-4xl font-black text-slate-800 tracking-tightest mb-4">Registro Comitado</h2>
                <p className="text-slate-500 font-medium text-lg mb-12 leading-relaxed">Sua participação ativa foi sincronizada com o Kernel S.I.E. Agradecemos sua colaboração.</p>
                <button onClick={() => window.location.reload()} className="px-16 py-6 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-indigo-600 transition-all shadow-xl">Encerrar Sessão</button>
            </div>
        </div>
    );

    return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-end font-sans overflow-hidden relative">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 -left-40 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute -bottom-40 -right-20 w-[40rem] h-[40rem] bg-emerald-600/5 rounded-full blur-[120px]"></div>
            </div>

            {step === 'IDENTIFY' && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in">
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl p-16 text-center border border-white/20 animate-scale-in">
                        <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-xl mb-10 overflow-hidden">
                            {systemInfo?.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain p-2" alt="Logo" /> : <Fingerprint size={48} />}
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tightest uppercase mb-2">{systemInfo?.name || 'Sistema S.I.E'}</h2>
                        <p className="text-slate-500 font-medium mb-12 leading-relaxed">Para iniciar sua participação no <span className="text-indigo-600 font-black">{survey?.title || 'Censo demográfico'}</span>, identifique-se com seu CPF.</p>

                        <input
                            type="text"
                            value={cpfIdentifier}
                            onChange={e => setCpfIdentifier(formatCPF(e.target.value))}
                            className="w-full px-8 py-8 bg-slate-50 border border-slate-200 rounded-[2rem] text-center text-4xl font-black outline-none focus:ring-8 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner mb-10"
                            placeholder="000.000.000-00"
                            maxLength={14}
                        />
                        <button onClick={handleIdentify} disabled={isLoading} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-indigo-600 shadow-2xl transition-all flex items-center justify-center gap-4">
                            {isLoading ? <Loader2 className="animate-spin" /> : <>Autenticar e Prosseguir <ArrowRight size={24} /></>}
                        </button>
                    </div>
                </div>
            )}

            {(step === 'PERSONAL_INFO' || step === 'FORM') && (
                <div className="w-full h-[98vh] flex flex-col relative z-10 animate-slide-up mt-auto">
                    <div className="bg-[#fcfcfd] rounded-t-[4rem] shadow-[0_-25px_100px_-15px_rgba(0,0,0,0.4)] w-full h-full flex flex-col overflow-hidden">
                        <div className="p-10 border-b bg-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><ShieldCheck size={32}/></div>
                                <div><h3 className="font-black text-3xl tracking-tightest uppercase text-slate-800">Ficha de Inclusão</h3><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Censo Demográfico • Cluster Ativo</p></div>
                            </div>
                            <button onClick={() => window.location.reload()} className="p-4 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-full transition-all"><X size={32}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar">
                            <div className="max-w-4xl mx-auto space-y-16">
                                {activeTab === 'PERSONAL' && (
                                    <div className="space-y-12 animate-fade-in">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                                <input className="w-full font-bold h-18 bg-white border-slate-200 text-xl rounded-3xl px-8 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all" value={userData.name} onChange={e => setUserData({ ...userData, name: e.target.value })} />
                                            </div>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Lote</label>
                                                <input className="w-full font-bold h-18 bg-white border-slate-200 text-xl rounded-3xl px-8 shadow-sm focus:border-indigo-500" value={userData.unit} onChange={e => setUserData({ ...userData, unit: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail para Contato</label>
                                                <input type="email" className="w-full font-bold h-18 bg-white border-slate-200 text-xl rounded-3xl px-8 shadow-sm focus:border-indigo-500" value={userData.email} onChange={e => setUserData({ ...userData, email: e.target.value })} />
                                            </div>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                                                <input className="w-full font-bold h-18 bg-white border-slate-200 text-xl rounded-3xl px-8 shadow-sm focus:border-indigo-500" value={userData.phone} onChange={e => setUserData({ ...userData, phone: e.target.value })} />
                                            </div>
                                        </div>
                                        <button onClick={() => { if (userData.name && userData.unit) { setStep('FORM'); setActiveTab('SOCIAL'); } else { alert("Preencha Nome e Unidade para prosseguir."); } }} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 transition-all">Próxima Etapa: Dados Sociais</button>
                                    </div>
                                )}

                                {activeTab === 'SOCIAL' && (
                                    <div className="space-y-12 animate-fade-in pb-20">
                                        <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                                            <h3 className="text-4xl font-black tracking-tightest leading-none uppercase">{survey?.title}</h3>
                                            <p className="text-slate-400 text-lg mt-6 font-medium leading-relaxed">{survey?.description}</p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-10">
                                            {survey?.questions?.map((q: SurveyQuestion, idx: number) => (
                                                <div key={q.id} className="p-12 bg-white rounded-[3.5rem] border border-slate-100 group hover:border-indigo-300 transition-all shadow-sm">
                                                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10">
                                                        <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shrink-0 group-hover:bg-indigo-600 transition-colors shadow-lg">{idx + 1}</div>
                                                        <div className="flex-1 space-y-6 w-full">
                                                            <label className="text-2xl font-black text-slate-800 tracking-tight leading-tight block">{q.text} {q.required && <span className="text-rose-500 text-xs ml-4 font-black uppercase bg-rose-50 px-3 py-1 rounded-lg">Obrigatório</span>}</label>
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
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-10 border-t bg-white flex justify-center sticky bottom-0">
                            <button onClick={handleSubmit} disabled={isLoading} className="w-full max-w-4xl py-8 bg-slate-900 hover:bg-emerald-600 text-white rounded-[2.5rem] font-black text-xs lg:text-sm uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-6 disabled:opacity-50">
                                {isLoading ? <Loader2 className="animate-spin" size={32} /> : <><Save size={32} /> Commitar no Kernel S.I.E</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicSenso;

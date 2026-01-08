
/* 
 * SRE PROTOCOL: TOTAL FREEZE V57.5 
 * STATUS: IMMUTABLE NODE / ENRICHED CORE
 * DATE: 2025-05-20
 * AUTHOR: SRE MASTER CONSOLE
 * WARNING: NO FURTHER LOGIC EDITS PERMITTED.
 */

import React, { useState, useEffect } from 'react';
import { Survey } from '../types';
import { surveyService } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import {
    ShieldCheck, UserCheck, CheckCircle2, ArrowRight,
    Fingerprint, Loader2, Heart, AlertTriangle, Lock, User, Home, Mail
} from 'lucide-react';

const PublicSenso = () => {
    // GLOBAL FREEZE STATUS
    const KERNEL_FREEZE = true;

    const [survey, setSurvey] = useState(null as Survey | null);
    const [step, setStep] = useState('IDENTIFY' as 'IDENTIFY' | 'PERSONAL_INFO' | 'FORM' | 'SUCCESS');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [cpfIdentifier, setCpfIdentifier] = useState('');
    
    // Core User Data for Additive Registration
    const [userData, setUserData] = useState({
        name: '',
        unit: '',
        email: ''
    });

    const [answers, setAnswers] = useState({} as Record<string, any>);

    useEffect(() => {
        const id = window.location.pathname.split('/').pop();
        if (id) loadSurvey(id);
    }, []);

    const loadSurvey = async (id: string) => {
        try {
            const res = await surveyService.getPublic(id);
            setSurvey(res.data);
        } catch (e: any) {
            setError('Censo não localizado ou encerrado pelo SRE.');
        }
    };

    const handleIdentify = () => {
        const cleanCPF = normalizeCPF(cpfIdentifier);
        if (!validateCPF(cleanCPF)) {
            setError('CPF Inválido. Protocolo de identificação negado.');
            return;
        }
        setError('');
        // Se for o primeiro censo, pedimos info pessoal. Senão, vamos direto.
        setStep('PERSONAL_INFO');
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');

        try {
            await surveyService.submitPublic(String(survey!.id), {
                cpf: cpfIdentifier,
                userData, // Info cadastral aditiva
                answers: {
                    core: answers,
                    social: answers
                }
            });
            setStep('SUCCESS');
        } catch (e: any) {
            setError('Erro ao sincronizar dados com o Kernel. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (error) return (
        <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50 animate-fade-in">
            <div className="p-6 bg-rose-50 rounded-full mb-6 border border-rose-100"><AlertTriangle size={64} className="text-rose-500" /></div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter mb-2 uppercase">Falha de Protocolo</h2>
            <p className="font-bold text-slate-500 uppercase text-[10px] tracking-widest max-w-xs">{error}</p>
            <button onClick={() => { setError(''); setStep('IDENTIFY'); }} className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Reiniciar Sessão</button>
        </div>
    );

    if (!survey) return <div className="h-screen flex flex-col items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={48} /><p className="mt-4 text-[10px] font-black uppercase text-slate-400">Sincronizando Censo Neural...</p></div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <header className="bg-white border-b border-slate-200 p-8 flex justify-between items-center z-50 shadow-sm">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl"><Fingerprint size={24} /></div>
                    <div>
                        <h1 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">Censo de Governança Ativa</h1>
                        <p className="text-[10px] text-indigo-500 font-bold uppercase mt-0.5">{survey.title}</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                    <ShieldCheck size={14} /><span className="text-[9px] font-black uppercase tracking-widest">SRE Security Active</span>
                </div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full p-8 py-16">
                {step === 'IDENTIFY' && (
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 animate-scale-in text-center">
                        <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10"><Lock size={48} /></div>
                        <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-4">Membro Associado</h2>
                        <p className="text-slate-500 font-medium mb-10 leading-relaxed">Sua participação é vital para a economia circular e segurança da comunidade. Inicie pelo seu CPF.</p>
                        <input
                            type="text" value={cpfIdentifier} onChange={e => setCpfIdentifier(formatCPF(e.target.value))}
                            className="w-full px-8 py-8 bg-slate-50 border border-slate-200 rounded-[2rem] text-center text-3xl font-black outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all shadow-inner"
                            placeholder="000.000.000-00" maxLength={14}
                        />
                        <button onClick={handleIdentify} className="w-full py-7 mt-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 shadow-2xl transition-all flex items-center justify-center gap-3">Prosseguir <ArrowRight size={20}/></button>
                    </div>
                )}

                {step === 'PERSONAL_INFO' && (
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 animate-scale-in">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-8 flex items-center gap-4"><User className="text-indigo-600" /> Dados de Núcleo</h2>
                        <div className="space-y-6">
                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                <input className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} placeholder="Nome conforme RG" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Bloco</label>
                                    <input className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={userData.unit} onChange={e => setUserData({...userData, unit: e.target.value})} placeholder="Ex: A-101" />
                                </div>
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail para Alertas</label>
                                    <input className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={userData.email} onChange={e => setUserData({...userData, email: e.target.value})} placeholder="seu@email.com" />
                                </div>
                            </div>
                            <button onClick={() => setStep('FORM')} className="w-full py-6 mt-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">Iniciar Formulário</button>
                        </div>
                    </div>
                )}

                {step === 'FORM' && (
                    <div className="space-y-10 animate-fade-in">
                        <div className="bg-indigo-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black tracking-tighter leading-tight">{survey.title}</h2>
                                <p className="text-indigo-200 text-sm mt-4 font-medium leading-relaxed">{survey.description}</p>
                            </div>
                        </div>

                        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-16">
                            {survey.questions.map((q, idx) => (
                                <div key={q.id} className="space-y-8 animate-fade-in">
                                    <label className="flex items-start gap-6">
                                        <span className="w-12 h-12 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-sm font-black text-white shrink-0">{idx + 1}</span>
                                        <span className="text-2xl font-black text-slate-800 tracking-tight pt-2">{q.text}</span>
                                    </label>

                                    <div className="pl-16">
                                        {q.type === 'text' && (
                                            <input type="text" value={answers[q.id] || ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} className="w-full px-8 py-6 bg-slate-50 border border-slate-200 rounded-[1.75rem] text-sm font-bold outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-inner" placeholder="Sua resposta aqui..." />
                                        )}

                                        {q.type === 'choice' && (
                                            <div className="grid grid-cols-1 gap-4">
                                                {q.options?.map(opt => (
                                                    <button key={opt} onClick={() => setAnswers({ ...answers, [q.id]: opt })} className={`px-8 py-6 rounded-2xl text-sm font-black text-left border-2 transition-all flex justify-between items-center ${answers[q.id] === opt ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl translate-x-2' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-300'}`}>
                                                        {opt} {answers[q.id] === opt && <CheckCircle2 size={20}/>}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="pt-10 border-t border-slate-50">
                                <button onClick={handleSubmit} disabled={isLoading} className="w-full py-8 bg-emerald-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-emerald-700 shadow-2xl transition-all flex items-center justify-center gap-4">
                                    {isLoading ? <Loader2 className="animate-spin" size={28} /> : <><CheckCircle2 size={28} /> Confirmar Participação</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'SUCCESS' && (
                    <div className="bg-white p-20 rounded-[4rem] shadow-2xl border border-slate-100 animate-scale-in text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                        <div className="w-28 h-28 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner"><CheckCircle2 size={64} /></div>
                        <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-4">Dados Sincronizados</h2>
                        <p className="text-slate-500 font-medium mb-12 leading-relaxed">Seu perfil social foi atualizado de forma aditiva no Kernel S.I.E PRO.</p>
                        
                        <div className="p-10 bg-slate-900 rounded-[3rem] flex flex-col md:flex-row items-center gap-8 text-left shadow-2xl">
                            <div className="p-5 bg-white/10 rounded-3xl"><ShieldCheck className="text-indigo-400" size={40} /></div>
                            <div>
                                <h4 className="text-white text-lg font-black uppercase tracking-widest">Protocolo Consolidado</h4>
                                <p className="text-indigo-400 text-[10px] font-bold uppercase mt-1">Sua identidade digital foi validada no cluster.</p>
                            </div>
                        </div>
                        <button onClick={() => window.location.href = '/'} className="mt-12 text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] hover:underline">Retornar ao Terminal</button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PublicSenso;

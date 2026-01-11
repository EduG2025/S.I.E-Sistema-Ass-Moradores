import React, { useState, useEffect } from 'react';
import { Survey, SurveyQuestion } from '../types';
import { surveyService } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import {
    ShieldCheck, CheckCircle2, ArrowRight, X, Shield,
    Fingerprint, Loader2, Heart, AlertTriangle, Lock, User, Home, Mail, Check, Sparkles, RefreshCw, Info, Wallet, Brain, Save, Phone
} from 'lucide-react';
import axios from 'axios';

const PublicSenso = () => {
    const [survey, setSurvey] = useState(null as Survey | null);
    const [step, setStep] = useState('IDENTIFY' as 'IDENTIFY' | 'PERSONAL_INFO' | 'FORM' | 'SUCCESS');
    const [activeTab, setActiveTab] = useState<'PERSONAL' | 'SOCIAL' | 'AUDIT'>('PERSONAL');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [cpfIdentifier, setCpfIdentifier] = useState('');

    const [userData, setUserData] = useState({ name: '', unit: '', email: '', phone: '' });
    const [isExistingMember, setIsExistingMember] = useState(false);
    const [answers, setAnswers] = useState({} as Record<string, any>);

    useEffect(() => {
        const id = window.location.pathname.split('/').pop();
        if (id && id !== 'census') loadSurvey(id);
    }, []);

    const loadSurvey = async (id: string) => {
        try {
            const res = await surveyService.getPublic(id);
            setSurvey(res.data);
        } catch (e: any) {
            setError('Protocolo Neural não localizado ou expirado.');
        }
    };

    const handleIdentify = async () => {
        const cleanCPF = normalizeCPF(cpfIdentifier);
        if (!cleanCPF || cleanCPF.length !== 11) { setError('Informe os 11 dígitos do seu CPF.'); return; }
        if (!validateCPF(cleanCPF)) { setError('Assinatura Digital Inválida (CPF).'); return; }

        setIsLoading(true);
        setError('');

        try {
            const res = await axios.get(`/api/surveys/public/check-resident/${cleanCPF}`);
            if (res.data.found) {
                setIsExistingMember(true);
                setUserData({
                    name: res.data.name,
                    unit: res.data.unit || '',
                    email: res.data.email || '',
                    phone: res.data.phone || ''
                });
                setStep('FORM');
                setActiveTab('SOCIAL');
            } else {
                setIsExistingMember(false);
                setStep('PERSONAL_INFO');
            }
        } catch (e) {
            setError('Sincronização com o Kernel falhou. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!survey) return;
        const missing = survey.questions.find(q => q.required && !answers[q.id]);
        if (missing) { alert(`Protocolo incompleto. Preencha: ${missing.text}`); return; }

        setIsLoading(true);
        try {
            await surveyService.submitPublic(String(survey.id), {
                cpf: cpfIdentifier,
                userData,
                answers: { core: userData, social: answers }
            });
            setStep('SUCCESS');
        } catch (e: any) {
            setError('Falha no Commit Social.');
        } finally {
            setIsLoading(false);
        }
    };

    if (step === 'SUCCESS') return (
        <div className="h-screen bg-slate-900 flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white p-20 rounded-[4rem] shadow-2xl text-center max-w-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                <div className="w-28 h-28 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner animate-bounce">
                    <CheckCircle2 size={64} />
                </div>
                <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-4">Registro Comitado</h2>
                <p className="text-slate-500 font-medium mb-12 leading-relaxed">Sua participação ativa foi sincronizada com o Kernel S.I.E. A comunidade agradece sua colaboração.</p>
                <button onClick={() => window.location.reload()} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all">Encerrar Sessão</button>
            </div>
        </div>
    );

    return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-end font-sans overflow-hidden relative">
            {/* Background Decor */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 -left-40 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute -bottom-40 -right-20 w-[40rem] h-[40rem] bg-emerald-600/5 rounded-full blur-[120px]"></div>
            </div>

            {/* IDENTIFICAÇÃO INICIAL (CARD CENTRAL) */}
            {step === 'IDENTIFY' && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in">
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl p-16 text-center border border-white/20 animate-scale-in">
                        <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl mb-10">
                            <Fingerprint size={40} />
                        </div>
                        <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-4">Pesquisa Social</h2>
                        <p className="text-slate-500 font-medium mb-10 leading-relaxed">Para iniciar sua participação no <span className="text-indigo-600 font-black">{survey?.title || 'Censo S.I.E'}</span>, identifique seu CPF oficial.</p>

                        {error && <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 border border-rose-100 animate-bounce"><AlertTriangle size={14} /> {error}</div>}

                        <input
                            type="text"
                            value={cpfIdentifier}
                            onChange={e => setCpfIdentifier(formatCPF(e.target.value))}
                            className="w-full px-8 py-8 bg-slate-50 border border-slate-200 rounded-[2rem] text-center text-3xl font-black outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all shadow-inner mb-8"
                            placeholder="000.000.000-00"
                            maxLength={14}
                        />
                        <button onClick={handleIdentify} disabled={isLoading} className="w-full py-8 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-600 shadow-2xl transition-all flex items-center justify-center gap-3">
                            {isLoading ? <Loader2 className="animate-spin" /> : <>Autenticar e Prosseguir <ArrowRight size={20} /></>}
                        </button>
                    </div>
                </div>
            )}

            {/* FORMULÁRIO EXPANDIDO - FIXADO DA BASE PARA O TOPO (98vh) */}
            {(step === 'PERSONAL_INFO' || step === 'FORM') && (
                <div className="w-full h-[98vh] flex flex-col relative z-10 animate-slide-up mt-auto">
                    <div className="bg-white rounded-t-[3.5rem] shadow-[0_-25px_80px_-15px_rgba(0,0,0,0.5)] w-full h-full flex flex-col overflow-hidden border-t border-x border-white/10">

                        {/* HEADER DA FICHA - FIXO NO TOPO DO CONTAINER */}
                        <div className="p-8 lg:p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-black text-3xl lg:text-4xl tracking-tighter flex items-center gap-5 text-slate-800 uppercase">
                                    <Shield size={36} className="text-indigo-600" />
                                    Ficha de Participação Ativa
                                </h3>
                                <p className="text-[10px] lg:text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">
                                    Protocolo de Inteligência Social • {survey?.title} • SRE V22.15
                                </p>
                            </div>
                            <button onClick={() => window.location.reload()} className="p-5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all border border-slate-100 bg-white">
                                <X size={36} />
                            </button>
                        </div>

                        {/* TABS DE NAVEGAÇÃO - FIXO */}
                        <div className="flex bg-slate-50 p-3 border-b shrink-0">
                            <button
                                onClick={() => step === 'PERSONAL_INFO' && setActiveTab('PERSONAL')}
                                className={`flex-1 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-4 ${activeTab === 'PERSONAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Info size={18} /> Identificação e Localidade
                            </button>
                            <button
                                onClick={() => step === 'FORM' && setActiveTab('SOCIAL')}
                                className={`flex-1 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-4 ${activeTab === 'SOCIAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                disabled={step === 'PERSONAL_INFO'}
                            >
                                <Heart size={18} /> Levantamento de Atributos
                            </button>
                            <button className="flex-1 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-4 text-slate-300 cursor-not-allowed">
                                <Brain size={18} /> Análise Auditiva IA
                            </button>
                        </div>

                        {/* ÁREA DE CONTEÚDO - FLEX-1 PARA OCUPAR TODO O VÁCUO ENTRE HEADER E FOOTER */}
                        <div className="flex-1 overflow-y-auto p-8 lg:p-16 bg-[#f8fafc] custom-scrollbar">
                            <div className="w-full h-full max-w-[1600px] mx-auto">

                                {/* PASSO: DADOS PESSOAIS */}
                                {activeTab === 'PERSONAL' && (
                                    <div className="space-y-12 animate-fade-in h-full flex flex-col">
                                        <div className="flex items-center gap-5 mb-10 shrink-0">
                                            <div className="w-2 h-10 bg-indigo-600 rounded-full"></div>
                                            <h4 className="font-black text-slate-800 uppercase text-lg tracking-widest">Núcleo de Identidade do Membro</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 shrink-0">
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-slate-400 uppercase ml-1">Nome Completo do Declarante</label>
                                                <div className="relative group">
                                                    <User size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                    <input
                                                        className="w-full pl-16 font-bold h-18 bg-white border-slate-200 text-xl rounded-3xl"
                                                        value={userData.name}
                                                        onChange={e => setUserData({ ...userData, name: e.target.value })}
                                                        placeholder="Ex: João da Silva Santos"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-slate-400 uppercase ml-1">Unidade / Lote / Bloco de Referência</label>
                                                <div className="relative group">
                                                    <Home size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                    <input
                                                        className="w-full pl-16 font-bold h-18 bg-white border-slate-200 text-xl rounded-3xl"
                                                        value={userData.unit}
                                                        onChange={e => setUserData({ ...userData, unit: e.target.value })}
                                                        placeholder="Ex: Casa 42 - Setor Sul"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 shrink-0">
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-slate-400 uppercase ml-1">E-mail para Sincronização</label>
                                                <div className="relative group">
                                                    <Mail size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                    <input
                                                        type="email"
                                                        className="w-full pl-16 font-bold h-18 bg-white border-slate-200 text-xl rounded-3xl"
                                                        value={userData.email}
                                                        onChange={e => setUserData({ ...userData, email: e.target.value })}
                                                        placeholder="seu@email.com"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-slate-400 uppercase ml-1">Telefone / WhatsApp Ativo</label>
                                                <div className="relative group">
                                                    <Phone size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                    <input
                                                        className="w-full pl-16 font-bold h-18 bg-white border-slate-200 text-xl rounded-3xl"
                                                        value={userData.phone}
                                                        onChange={e => setUserData({ ...userData, phone: e.target.value })}
                                                        placeholder="(00) 00000-0000"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1"></div> {/* Spacer dinâmico */}

                                        <div className="pt-10 shrink-0">
                                            <button
                                                onClick={() => { if (userData.name && userData.unit) { setStep('FORM'); setActiveTab('SOCIAL'); } else { alert("Preencha Nome e Unidade."); } }}
                                                className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 active:scale-95"
                                            >
                                                Iniciar Protocolo Social <ArrowRight size={24} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* PASSO: QUESTIONÁRIO DINÂMICO */}
                                {activeTab === 'SOCIAL' && (
                                    <div className="space-y-12 animate-fade-in pb-32">
                                        <div className="bg-slate-900 p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5 shrink-0">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                                            <div className="relative z-10">
                                                <p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.4em] mb-5">Fase 02: Levantamento Geodemográfico Ativo</p>
                                                <h3 className="text-4xl lg:text-5xl font-black tracking-tightest leading-none">{survey?.title}</h3>
                                                <p className="text-slate-400 text-lg mt-6 font-medium max-w-4xl leading-relaxed">{survey?.description}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-10">
                                            {survey?.questions?.map((q: SurveyQuestion, idx: number) => (
                                                <div key={q.id} className="p-12 bg-white rounded-[3.5rem] border border-slate-100 group hover:border-indigo-300 transition-all hover:shadow-[0_20px_50px_-20px_rgba(79,70,229,0.15)] relative">
                                                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10">
                                                        <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.75rem] flex items-center justify-center font-black text-xl shrink-0 shadow-xl group-hover:bg-indigo-600 transition-colors">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex-1 space-y-8 w-full">
                                                            <label className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight leading-tight block">
                                                                {q.text}
                                                                {q.required && <span className="text-rose-500 text-xs ml-4 font-black uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-lg">Obrigatório</span>}
                                                            </label>

                                                            <div className="relative w-full">
                                                                {q.type === 'select' ? (
                                                                    <select
                                                                        value={answers[q.id] || ''}
                                                                        onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                                                                        className="w-full bg-slate-50 font-bold h-20 px-8 rounded-3xl border-slate-200 text-xl appearance-none cursor-pointer focus:bg-white transition-all"
                                                                    >
                                                                        <option value="">Selecione uma opção estratégica...</option>
                                                                        {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                    </select>
                                                                ) : q.type === 'boolean' ? (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                        {['SIM', 'NÃO'].map(val => (
                                                                            <button
                                                                                key={val}
                                                                                type="button"
                                                                                onClick={() => setAnswers({ ...answers, [q.id]: val })}
                                                                                className={`py-8 rounded-[2rem] font-black text-xl tracking-widest transition-all border-2 ${answers[q.id] === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:bg-slate-50'}`}
                                                                            >
                                                                                {val}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <input
                                                                        type={q.type}
                                                                        value={answers[q.id] || ''}
                                                                        onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                                                                        className="w-full h-20 px-8 bg-slate-50 border-slate-200 rounded-3xl font-bold text-2xl focus:bg-white focus:ring-8 focus:ring-indigo-500/5 transition-all shadow-inner"
                                                                        placeholder="Digite sua resposta técnica..."
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RODAPÉ DO FORMULÁRIO - FIXO NA BASE DA JANELA */}
                        <div className="p-8 border-t border-slate-100 bg-white/95 backdrop-blur-xl shrink-0 sticky bottom-0 z-[50] flex justify-center shadow-[0_-15px_40px_-10px_rgba(0,0,0,0.1)]">
                            <button
                                onClick={activeTab === 'PERSONAL' ? () => setActiveTab('SOCIAL') : handleSubmit}
                                disabled={isLoading}
                                className="w-full max-w-[1200px] py-9 bg-slate-900 hover:bg-emerald-600 text-white rounded-[3rem] font-black text-xs lg:text-sm uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-6 active:scale-95 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={32} /> : (
                                    <>
                                        <Save size={32} />
                                        {activeTab === 'PERSONAL' ? 'Prosseguir para Questionário Social' : 'Commitar Registro no Kernel Ativo'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; border: 3px solid #f8fafc; }
                .h-18 { height: 4.5rem; }
                .h-20 { height: 5rem; }
                .tracking-tightest { letter-spacing: -0.06em; }
            `}</style>
        </div>
    );
};

export default PublicSenso;
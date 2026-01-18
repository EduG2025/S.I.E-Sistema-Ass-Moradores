import React, { useState, useEffect } from 'react';
import { Survey, SurveyQuestion, SystemInfo } from '../types';
import { api } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import { z } from 'zod';
import {
    ShieldCheck, CheckCircle2, X, Fingerprint, Loader2, Save, ChevronRight, Scan, AlertTriangle
} from 'lucide-react';

const personalInfoSchema = z.object({
  name: z.string().min(5, "Nome completo requerido"),
  unit: z.string().min(1, "Unidade requerida"),
  phone: z.string().min(10, "WhatsApp inválido").optional().or(z.literal('')),
  email: z.string().email("E-mail inválido").optional().or(z.literal(''))
});

const PublicSenso = () => {
    const [survey, setSurvey] = useState(null as Survey | null);
    const [systemInfo, setSystemInfo] = useState(null as SystemInfo | null);
    const [step, setStep] = useState('IDENTIFY' as 'IDENTIFY' | 'HANDSHAKE' | 'PERSONAL_INFO' | 'FORM' | 'SUCCESS');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [cpfIdentifier, setCpfIdentifier] = useState('');

    const [userData, setUserData] = useState({ name: '', unit: '', email: '', phone: '' });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
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
            setError('Formulário de pesquisa indisponível ou desativado.'); 
        } finally { setIsLoading(false); }
    };

    const handleIdentify = async () => {
        const cleanCPF = normalizeCPF(cpfIdentifier);
        if (cleanCPF.length !== 11) { setError('O CPF deve conter 11 dígitos.'); return; }
        if (!validateCPF(cleanCPF)) { setError('Assinatura de CPF inválida.'); return; }

        setIsLoading(true); setError('');
        try {
            const res = await api.get(`/surveys/public/check-resident/${cleanCPF}`);
            if (res.data && res.data.found) {
                setUserData({ 
                    name: res.data.name, 
                    unit: res.data.unit || '', 
                    email: res.data.email || '', 
                    phone: res.data.phone || '' 
                });
                setStep('HANDSHAKE'); 
                setTimeout(() => setStep('FORM'), 1500);
            } else { setStep('PERSONAL_INFO'); }
        } catch (e) { setError('Falha no serviço de identificação do Kernel.'); } 
        finally { setIsLoading(false); }
    };

    const startSurvey = () => {
        try {
            setFormErrors({});
            personalInfoSchema.parse(userData);
            setStep('FORM');
        } catch (err) {
            if (err instanceof z.ZodError) {
                const errs: Record<string, string> = {};
                err.issues.forEach(e => { if(e.path[0]) errs[e.path[0].toString()] = e.message; });
                setFormErrors(errs);
            }
        }
    };

    const handleSubmit = async () => {
        if (!survey) return;
        const missing = survey.questions.find(q => q.required && !answers[q.id]);
        if (missing) { 
            alert(`Atenção: A pergunta "${missing.text}" é obrigatória.`); 
            return; 
        }

        setIsLoading(true);
        try {
            // SRE PROTOCOL: Envio estruturado para o motor de UPSERT do Kernel
            await api.post(`/surveys/public/${survey.id}/submit`, {
                cpf: normalizeCPF(cpfIdentifier),
                userData: {
                    name: userData.name,
                    unit: userData.unit,
                    email: userData.email,
                    phone: userData.phone
                }, 
                answers: { 
                    core: userData, 
                    social: answers, 
                    metadata: { 
                        submitted_at: new Date().toISOString(),
                        survey_title: survey.title 
                    } 
                }
            });
            setStep('SUCCESS');
        } catch (e: any) { 
            const msg = e.response?.data?.error || 'Erro ao comitar respostas.';
            alert(`🛑 Falha de Registro: ${msg}`); 
        } finally { setIsLoading(false); }
    };

    if (step === 'SUCCESS') return (
        <div className="h-screen w-screen bg-[#020617] flex items-center justify-center p-6 text-center">
            <div className="bg-white p-12 lg:p-20 rounded-[3rem] shadow-2xl max-w-2xl w-full animate-scale-in">
                <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shadow-xl mx-auto mb-6"><CheckCircle2 size={56} /></div>
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Protocolo Finalizado</h2>
                <p className="text-slate-500 font-medium mt-4 mb-10 text-[10px] tracking-widest uppercase leading-relaxed">Obrigado por sua participação. <br/> Suas informações foram auditadas e sincronizadas com o Kernel S.I.E PRO.</p>
                <button onClick={() => window.location.href = '/'} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95">Retornar ao Início</button>
            </div>
        </div>
    );

    return (
        <div className="h-screen w-screen bg-[#020617] flex flex-col overflow-hidden relative">
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
                {step === 'IDENTIFY' && (
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl p-10 lg:p-16 text-center animate-scale-in">
                        <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-xl mb-8 border-4 border-slate-50">
                            {systemInfo?.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain p-2" alt="Logo" /> : <Fingerprint size={48} />}
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase mb-2 tracking-tight">Portal do Morador</h2>
                        <p className="text-slate-400 mb-10 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                            Identifique-se para o protocolo: <br/>
                            <span className="text-indigo-600 font-black mt-2 inline-block bg-indigo-50 px-4 py-1 rounded-lg border border-indigo-100">{survey?.title || 'FORMULÁRIO S.I.E'}</span>
                        </p>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-left ml-4">CPF / Identidade</label>
                                <input type="text" value={cpfIdentifier} onChange={e => { setError(''); setCpfIdentifier(formatCPF(e.target.value)); }} className="w-full py-7 bg-slate-50 border border-slate-200 rounded-[2rem] text-center text-3xl font-black outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase shadow-inner" placeholder="000.000.000-00" maxLength={14} />
                            </div>
                            <button onClick={handleIdentify} disabled={isLoading} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50">
                                {isLoading ? <Loader2 className="animate-spin" /> : <>Acessar Formulário <ChevronRight size={20}/></>}
                            </button>
                            {error && (
                                <div className="flex items-center justify-center gap-2 p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 animate-shake">
                                    <AlertTriangle size={16}/>
                                    <span className="text-[10px] font-black uppercase">{error}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 'HANDSHAKE' && (
                    <div className="bg-white rounded-[3.5rem] p-16 text-center animate-scale-in max-w-md w-full shadow-2xl">
                         <div className="w-32 h-32 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl mx-auto mb-10 border-4 border-white animate-pulse"><Scan size={48} /></div>
                         <h2 className="text-2xl font-black text-slate-800 uppercase leading-none tracking-tight">Membro Localizado</h2>
                         <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                             <p className="text-indigo-600 font-black text-lg uppercase leading-tight">{userData.name}</p>
                         </div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-10 animate-pulse">Sincronizando com o Kernel...</p>
                    </div>
                )}

                {(step === 'PERSONAL_INFO' || step === 'FORM') && (
                    <div className="bg-[#fcfcfd] rounded-[3.5rem] shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-slide-up border border-white/10">
                        <div className="px-10 py-7 border-b bg-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl"><ShieldCheck size={24}/></div>
                                <div>
                                    <h3 className="font-black text-xl text-slate-800 uppercase leading-none tracking-tight">{step === 'PERSONAL_INFO' ? 'Ficha Administrativa' : survey?.title}</h3>
                                    <p className="text-[9px] text-slate-400 font-black uppercase mt-1.5 tracking-widest">SRE HANDSHAKE • {systemInfo?.shortName || 'S.I.E'}</p>
                                </div>
                            </div>
                            <button onClick={() => window.location.reload()} className="p-3 bg-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all"><X size={24}/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-10 lg:p-16 custom-scrollbar">
                            <div className="max-w-4xl mx-auto">
                                {step === 'PERSONAL_INFO' && (
                                    <div className="space-y-12">
                                        <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 text-center space-y-2">
                                            <h4 className="text-indigo-900 font-black uppercase text-sm tracking-widest">Dados Cadastrais</h4>
                                            <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">Identidade não localizada na base atual. Por favor, preencha os campos abaixo.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label><input className={`w-full font-black h-16 bg-white border ${formErrors.name ? 'border-rose-400' : 'border-slate-200'} rounded-2xl px-6 focus:border-indigo-500 shadow-sm uppercase`} value={userData.name} onChange={e => setUserData({ ...userData, name: e.target.value.toUpperCase() })} /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Bloco</label><input className={`w-full font-black h-16 bg-white border ${formErrors.unit ? 'border-rose-400' : 'border-slate-200'} rounded-2xl px-6 focus:border-indigo-500 shadow-sm uppercase`} value={userData.unit} onChange={e => setUserData({ ...userData, unit: e.target.value.toUpperCase() })} /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Contato</label><input className={`w-full font-black h-16 bg-white border ${formErrors.email ? 'border-rose-400' : 'border-slate-200'} rounded-2xl px-6 focus:border-indigo-500 shadow-sm lowercase`} value={userData.email} onChange={e => setUserData({ ...userData, email: e.target.value })} /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp (DDD+Número)</label><input className={`w-full font-black h-16 bg-white border ${formErrors.phone ? 'border-rose-400' : 'border-slate-200'} rounded-2xl px-6 focus:border-indigo-500 shadow-sm`} value={userData.phone} onChange={e => setUserData({ ...userData, phone: e.target.value.replace(/\D/g, '') })} placeholder="11999998888" /></div>
                                        </div>
                                        <button onClick={startSurvey} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-indigo-600 transition-all shadow-2xl active:scale-95">Prosseguir para o Questionário</button>
                                    </div>
                                )}
                                
                                {step === 'FORM' && (
                                    <div className="space-y-10 pb-20">
                                        {survey?.questions?.map((q: SurveyQuestion, idx: number) => (
                                            <div key={q.id} className="p-10 bg-white rounded-[3rem] border border-slate-100 hover:border-indigo-200 transition-all shadow-sm">
                                                <label className="text-xl font-black text-slate-800 tracking-tight block uppercase mb-8 leading-tight">
                                                    <span className="text-indigo-600 mr-3 opacity-20">{String(idx + 1).padStart(2, '0')}</span> 
                                                    {q.text} {q.required && <span className="text-rose-500 ml-2">*</span>}
                                                </label>
                                                
                                                {q.type === 'select' ? (
                                                    <div className="relative">
                                                        <select value={answers[q.id] || ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} className="w-full bg-slate-50 font-black h-16 px-8 rounded-2xl border border-slate-200 text-sm appearance-none uppercase focus:bg-white focus:border-indigo-500 shadow-inner">
                                                            <option value="">Selecione uma opção...</option>
                                                            {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                        </select>
                                                        <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-300 pointer-events-none" size={20}/>
                                                    </div>
                                                ) : q.type === 'boolean' ? (
                                                    <div className="flex gap-6">
                                                        {['SIM', 'NÃO'].map(val => (
                                                            <button key={val} type="button" onClick={() => setAnswers({ ...answers, [q.id]: val })} className={`flex-1 py-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 ${answers[q.id] === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}>{val}</button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <input type={q.type} value={answers[q.id] || ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} className="w-full h-16 px-8 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg uppercase shadow-inner focus:bg-white focus:border-indigo-500 transition-all" placeholder="Digite sua resposta..." />
                                                )}
                                            </div>
                                        ))}
                                        
                                        <div className="p-8 bg-emerald-50 rounded-[3rem] border border-emerald-100 flex items-center gap-6 shadow-sm">
                                            <div className="p-4 bg-white text-emerald-600 rounded-2xl shadow-sm"><ShieldCheck size={28}/></div>
                                            <div>
                                                <h4 className="text-sm font-black text-emerald-950 uppercase tracking-widest">Protocolo de Integridade</h4>
                                                <p className="text-[10px] text-emerald-700 font-bold uppercase mt-1 tracking-widest">Ao enviar, suas respostas serão vinculadas à sua identidade condominial.</p>
                                            </div>
                                        </div>

                                        <button onClick={handleSubmit} disabled={isLoading} className="w-full py-8 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                                            {isLoading ? <Loader2 className="animate-spin" /> : <><Save size={24} /> Enviar Protocolo Social</>}
                                        </button>
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
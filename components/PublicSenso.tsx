import React, { useState, useEffect, useRef } from 'react';
import { Survey, SystemInfo } from '../types';
import { api } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import {
    ShieldCheck, CheckCircle2, X, Fingerprint, Loader2, Save, ChevronRight, 
    AlertTriangle, Users, Plus, Trash2, ArrowRight, Brain, Sparkles, ClipboardCheck,
    ChevronLeft, RotateCcw, User, MapPin, Building, Info, Camera, ScanLine, Upload,
    Zap, Calendar as CalendarIcon
} from 'lucide-react';

/**
 * S.I.E Public Censo - Protocolo SRE V25.2
 * Otimização de Entrada de Dados: Máscara de Data Padrão BR (DD/MM/AAAA)
 */

const PublicSenso = () => {
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [step, setStep] = useState<'IDENTIFY' | 'FORM' | 'PHOTO' | 'REVIEW' | 'SUCCESS'>('IDENTIFY');
    const [currentSection, setCurrentSection] = useState(0); 
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [error, setError] = useState('');
    const [cpfIdentifier, setCpfIdentifier] = useState('');
    const [aiSummary, setAiSummary] = useState('');
    const [isNewResident, setIsNewResident] = useState(false);

    const [userData, setUserData] = useState({ name: '', unit: '', email: '', phone: '', birthDate: '', avatar_url: '' });
    const [answers, setAnswers] = useState<Record<string, any>>({});

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraActive, setCameraActive] = useState(false);

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
        } catch (e) { console.error("Identity Core Offline"); }
    };

    const loadSurvey = async (id: string) => {
        setIsLoading(true);
        try { 
            const res = await api.get(`/surveys/public/${id}`); 
            setSurvey(res.data); 
        } catch (e) { 
            setError('Este formulário de censo não está mais disponível no cluster.'); 
        } finally { setIsLoading(false); }
    };

    /**
     * SRE UTILS: Máscara de Data Reativa (DD/MM/YYYY)
     */
    const maskDate = (value: string) => {
        const clean = value.replace(/\D/g, '');
        let masked = clean;
        if (clean.length > 2) masked = `${clean.slice(0, 2)}/${clean.slice(2)}`;
        if (clean.length > 4) masked = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
        return masked;
    };

    const convertToISO = (brDate: string) => {
        if (!brDate || brDate.length < 10) return '';
        const [d, m, y] = brDate.split('/');
        return `${y}-${m}-${d}`;
    };

    const handleIdentify = async () => {
        const cleanCPF = normalizeCPF(cpfIdentifier);
        
        if (!validateCPF(cleanCPF)) { 
            setError('Falha de Protocolo: CPF Inválido.'); 
            return; 
        }

        setIsLoading(true); 
        setError('');
        try {
            const res = await api.get(`/surveys/public/check-resident/${cleanCPF}`);
            if (res.data && res.data.found) {
                setUserData({ 
                    name: res.data.name || '', 
                    unit: res.data.unit || '', 
                    email: res.data.email || '', 
                    phone: res.data.phone || '',
                    birthDate: '', 
                    avatar_url: res.data.avatar_url || ''
                });
                setIsNewResident(false);
            } else { 
                setIsNewResident(true); 
                setUserData({ name: '', unit: '', email: '', phone: '', birthDate: '', avatar_url: '' });
            }
            setStep('FORM');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) { 
            setError('Falha no Kernel de identificação. Verifique sua conexão.'); 
        } finally { setIsLoading(false); }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) { videoRef.current.srcObject = stream; setCameraActive(true); }
        } catch (e) { alert("Hardware de Vision bloqueado ou indisponível."); }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx?.drawImage(videoRef.current, 0, 0);
            const b64 = canvasRef.current.toDataURL('image/jpeg', 0.8);
            setUserData({ ...userData, avatar_url: b64 });
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            setCameraActive(false);
        }
    };

    const handleNext = () => {
        if (currentSection === 0 && (!userData.name || !userData.unit)) {
            alert("Atributos de Identidade (Nome e Unidade) são obrigatórios."); return;
        }
        if (currentSection < totalSteps - 1) { 
            setCurrentSection(prev => prev + 1); 
            window.scrollTo({ top: 0, behavior: 'smooth' }); 
        } 
        else {
            if (isNewResident && !userData.avatar_url) { setStep('PHOTO'); } 
            else { handleFinalReview(); }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleFinalReview = async () => {
        setStep('REVIEW');
        setIsGeneratingSummary(true);
        try {
            // Conversão de datas para ISO antes da análise da IA
            const processedUserData = { ...userData, birthDate: convertToISO(userData.birthDate) };
            const processedAnswers = { ...answers };
            
            visibleQuestions.forEach(q => {
                if (q.type === 'date' && processedAnswers[q.id]) {
                    processedAnswers[q.id] = convertToISO(processedAnswers[q.id]);
                }
            });

            const res = await api.post('/ai/chat', { 
                contents: `Analise este perfil: ${JSON.stringify({...processedUserData, ...processedAnswers})}. Gere um diagnóstico social curto. Comece com "Dossiê S.I.E analisado..."`
            });
            setAiSummary(res.data.text);
        } catch (e) { setAiSummary("Seu protocolo foi processado com sucesso pelo Kernel S.I.E."); } 
        finally { setIsGeneratingSummary(false); }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const finalUserData = { ...userData, birthDate: convertToISO(userData.birthDate) };
            const finalAnswers = { ...answers };
            visibleQuestions.forEach(q => {
                if (q.type === 'date' && finalAnswers[q.id]) {
                    finalAnswers[q.id] = convertToISO(finalAnswers[q.id]);
                }
            });

            await api.post(`/surveys/public/${survey?.id}/submit`, { 
                cpf: normalizeCPF(cpfIdentifier), 
                userData: finalUserData, 
                answers: finalAnswers 
            });
            setStep('SUCCESS');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e: any) { alert(`Erro ao comitar: ${e.response?.data?.error || 'Erro de rede.'}`); } 
        finally { setIsLoading(false); }
    };

    const questionsPerSection = 8;
    const visibleQuestions = survey?.questions || [];
    const totalSteps = Math.ceil(visibleQuestions.length / questionsPerSection) + 1;
    const progress = ((currentSection + 1) / totalSteps) * 100;

    const getCurrentQuestions = () => {
        if (currentSection === 0) return [];
        const start = (currentSection - 1) * questionsPerSection;
        return visibleQuestions.slice(start, start + questionsPerSection);
    };

    const primaryColor = systemInfo?.primaryColor || '#4f46e5';

    if (step === 'SUCCESS') return (
        <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center text-white p-4">
            <div className="bg-white p-10 sm:p-16 rounded-[3rem] sm:rounded-[4rem] shadow-2xl max-w-lg w-full text-center animate-scale-in">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl"><CheckCircle2 size={40} /></div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">Sincronizado!</h2>
                <p className="text-slate-500 font-medium mt-4 mb-10 text-[10px] sm:text-[11px] uppercase tracking-widest leading-relaxed italic">Sua participação fortalece o cluster {systemInfo?.shortName}.</p>
                <button onClick={() => window.location.href = '/'} className="w-full py-5 sm:py-6 bg-slate-900 text-white rounded-2xl sm:rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Encerrar Terminal</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen w-screen bg-[#f8fafc] flex flex-col relative">
            <div className="flex-1 flex flex-col items-center p-4 sm:p-6 lg:p-10">
                
                {step === 'IDENTIFY' && (
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] sm:rounded-[4rem] w-full max-w-xl p-8 sm:p-12 lg:p-20 text-center animate-fade-in shadow-[0_20px_50px_rgba(0,0,0,0.05)] my-auto">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] mx-auto flex items-center justify-center text-white mb-6 sm:mb-10 shadow-2xl relative overflow-hidden">
                            {systemInfo?.logoUrl ? (
                                <img src={systemInfo.logoUrl} className="w-full h-full object-contain p-1.5" alt="Logo" />
                            ) : (
                                <Fingerprint size={48} />
                            )}
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase mb-3 tracking-tight leading-none">Censo Ativo</h2>
                        <div className="inline-block px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mb-10">
                            <p className="text-indigo-600 text-[9px] font-black uppercase tracking-[0.2em]">Protocolo SRE Identificação</p>
                        </div>
                        
                        <div className="space-y-6 sm:space-y-8">
                            <div className="relative group">
                                <label className="absolute -top-3 left-6 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">Informe seu CPF</label>
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    value={cpfIdentifier} 
                                    onChange={e => { setCpfIdentifier(formatCPF(e.target.value)); setError(''); }} 
                                    className="w-full py-5 sm:py-7 pl-6 pr-16 sm:pr-20 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] sm:rounded-3xl text-center text-lg sm:text-xl font-black outline-none focus:bg-white focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all uppercase placeholder:text-slate-200 shadow-inner" 
                                    placeholder="000.000.000-00" 
                                    maxLength={14} 
                                />
                                {validateCPF(normalizeCPF(cpfIdentifier)) && (
                                    <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-emerald-500 animate-scale-in">
                                        <ShieldCheck size={28}/>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleIdentify} 
                                disabled={isLoading || !validateCPF(normalizeCPF(cpfIdentifier))} 
                                className="w-full py-6 sm:py-7 bg-slate-900 text-white rounded-[1.5rem] sm:rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-2xl disabled:opacity-30"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20}/> : <>Entrar <ChevronRight size={18}/></>}
                            </button>

                            {error && (
                                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-black text-[10px] uppercase shadow-sm animate-shake flex items-center justify-center gap-2">
                                    <AlertTriangle size={14} /> {error}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 'FORM' && (
                    <div className="bg-white w-full max-w-6xl flex flex-col animate-fade-in shadow-2xl rounded-[2rem] sm:rounded-[4rem] overflow-hidden border border-slate-100 mb-10">
                        <div className="shrink-0 border-b bg-slate-900 p-4 sm:p-8 flex justify-between items-center text-white sticky top-0 z-50 shadow-md">
                            <div className="flex items-center gap-3 sm:gap-6">
                                <div className="p-2.5 sm:p-4 bg-indigo-600 rounded-xl sm:rounded-2xl shadow-lg" style={{ backgroundColor: primaryColor }}><ClipboardCheck size={20}/></div>
                                <div>
                                    <h3 className="font-black text-xs sm:text-xl uppercase tracking-tight leading-none truncate max-w-[140px] sm:max-w-none">{survey?.title}</h3>
                                    <p className="text-[7px] sm:text-[9px] text-indigo-300 font-black uppercase mt-1 sm:mt-2 tracking-widest">Seção {currentSection + 1} de {totalSteps}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-6">
                                <div className="w-16 sm:w-48 h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${progress}%`, backgroundColor: primaryColor }} />
                                </div>
                                <span className="text-[8px] sm:text-[11px] font-black text-white/50 uppercase tracking-widest">{Math.round(progress)}%</span>
                            </div>
                        </div>

                        <div className="p-6 sm:p-10 lg:p-20 bg-white">
                            <div className="w-full mx-auto space-y-10 sm:space-y-12">
                                {currentSection === 0 ? (
                                    <div className="space-y-8 sm:space-y-10 animate-fade-in">
                                        <h4 className="text-[10px] sm:text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-6 sm:mb-10 border-b border-indigo-50 pb-4 flex items-center gap-3">
                                            <User size={18}/> 01. Identidade e Contato
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-10">
                                            <div className="md:col-span-8 space-y-2 group">
                                                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                                <input disabled={!isNewResident} className="w-full h-14 sm:h-18 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl px-5 sm:px-6 text-base sm:text-2xl font-black uppercase focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} />
                                            </div>
                                            <div className="md:col-span-4 space-y-2 group">
                                                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="DD/MM/AAAA"
                                                    maxLength={10}
                                                    className="w-full h-14 sm:h-18 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl px-5 sm:px-6 text-base sm:text-2xl font-black focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-sm" 
                                                    value={userData.birthDate} 
                                                    onChange={e => setUserData({...userData, birthDate: maskDate(e.target.value)})} 
                                                />
                                            </div>
                                            <div className="md:col-span-4 space-y-2 group">
                                                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Cluster</label>
                                                <input className="w-full h-14 sm:h-18 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl px-5 sm:px-6 text-base sm:text-2xl font-black uppercase focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-sm" value={userData.unit} onChange={e => setUserData({...userData, unit: e.target.value})} />
                                            </div>
                                            <div className="md:col-span-4 space-y-2 group">
                                                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                                                <input type="email" className="w-full h-14 sm:h-18 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl px-5 sm:px-6 text-base sm:text-2xl font-black focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-sm" value={userData.email} onChange={e => setUserData({...userData, email: e.target.value})} />
                                            </div>
                                            <div className="md:col-span-4 space-y-2 group">
                                                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Bridge</label>
                                                <input type="tel" className="w-full h-14 sm:h-18 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl px-5 sm:px-6 text-base sm:text-2xl font-black focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-sm" value={userData.phone} onChange={e => setUserData({...userData, phone: e.target.value})} placeholder="Ex: 21983911672" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-16 gap-y-10 sm:gap-y-14 animate-fade-in">
                                        {getCurrentQuestions().map((q, idx) => (
                                            <div key={q.id} className="space-y-4 group border-l-4 border-slate-100 pl-6 sm:pl-10 focus-within:border-indigo-500 transition-all">
                                                <h4 className="text-base sm:text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                                                    <span className="text-[10px] text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg">{(visibleQuestions.indexOf(q) + 1).toString().padStart(2, '0')}</span>
                                                    {q.text}
                                                </h4>
                                                {q.type === 'select' ? (
                                                    <div className="flex flex-wrap gap-3">
                                                        {q.options?.map((opt: string) => (
                                                            <button 
                                                                key={opt} 
                                                                onClick={() => setAnswers({...answers, [q.id]: opt})} 
                                                                className={`py-4 sm:py-5 px-5 sm:px-8 rounded-xl sm:rounded-2xl text-left font-black text-[9px] sm:text-[10px] uppercase tracking-widest border-2 transition-all active:scale-95 ${answers[q.id] === opt ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.03]' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-400'}`} 
                                                                style={answers[q.id] === opt ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                                                            >
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : q.type === 'boolean' ? (
                                                    <div className="flex gap-4 max-w-[320px] sm:max-w-md">
                                                        {['SIM', 'NÃO'].map(val => (
                                                            <button 
                                                                key={val} 
                                                                onClick={() => setAnswers({...answers, [q.id]: val})} 
                                                                className={`flex-1 py-5 rounded-xl sm:rounded-3xl font-black text-[11px] sm:text-[12px] uppercase tracking-[0.4em] border-2 transition-all active:scale-95 ${answers[q.id] === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.03]' : 'bg-white border-slate-100 text-slate-400'}`} 
                                                                style={answers[q.id] === val ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                                                            >
                                                                {val}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : q.type === 'date' ? (
                                                    <div className="relative">
                                                        <input 
                                                            type="text" 
                                                            maxLength={10}
                                                            placeholder="DD/MM/AAAA"
                                                            value={answers[q.id] || ''} 
                                                            onChange={e => setAnswers({...answers, [q.id]: maskDate(e.target.value)})} 
                                                            className="w-full h-14 sm:h-18 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-3xl px-6 sm:px-8 text-base sm:text-xl font-black uppercase focus:bg-white focus:border-indigo-500 outline-none shadow-inner transition-all" 
                                                        />
                                                        <CalendarIcon className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={24} />
                                                    </div>
                                                ) : (
                                                    <input 
                                                        type={q.type} 
                                                        value={answers[q.id] || ''} 
                                                        onChange={e => setAnswers({...answers, [q.id]: e.target.value})} 
                                                        className="w-full h-14 sm:h-18 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-3xl px-6 sm:px-8 text-base sm:text-xl font-black uppercase focus:bg-white focus:border-indigo-500 outline-none shadow-inner transition-all" 
                                                        placeholder="Clique para informar..." 
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-4 pt-10 sm:pt-14 border-t border-slate-100 pb-20">
                                    {currentSection > 0 && (
                                        <button onClick={() => setCurrentSection(prev => prev - 1)} className="order-2 sm:order-1 px-8 sm:px-14 py-5 sm:py-7 bg-slate-100 text-slate-500 rounded-2xl sm:rounded-[2.5rem] font-black text-[10px] sm:text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3">
                                            <ChevronLeft size={20}/> Voltar
                                        </button>
                                    )}
                                    <button 
                                        onClick={handleNext} 
                                        className="order-1 sm:order-2 flex-1 py-5 sm:py-7 bg-slate-900 text-white rounded-2xl sm:rounded-[2.5rem] font-black text-[11px] sm:text-[13px] uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-2xl"
                                    >
                                        {currentSection === totalSteps - 1 ? (isNewResident ? 'Autenticar Bio-ID' : 'Próxima Etapa') : 'Próxima Etapa'} <ArrowRight size={22} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'PHOTO' && (
                    <div className="bg-slate-950 w-full max-w-4xl min-h-[550px] sm:min-h-[750px] flex flex-col items-center justify-center text-center p-8 sm:p-14 rounded-[3rem] sm:rounded-[5rem] shadow-[0_40px_120px_rgba(0,0,0,0.6)] animate-fade-in relative overflow-hidden my-auto mb-10">
                         <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                         <div className="relative z-10 space-y-10 sm:space-y-14 w-full">
                            <div className="space-y-4">
                                <h3 className="text-3xl sm:text-6xl font-black text-white uppercase tracking-tightest leading-none">Vision ID</h3>
                                <p className="text-indigo-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.5em] opacity-90">Captura Biométrica Obrigatória</p>
                            </div>

                            <div className="relative mx-auto">
                                <div className={`w-64 h-64 sm:w-96 sm:h-96 lg:w-[450px] lg:h-[450px] bg-black rounded-full border-4 sm:border-8 ${userData.avatar_url ? 'border-emerald-500' : 'border-indigo-500/30'} overflow-hidden relative shadow-[0_0_100px_rgba(79,70,229,0.4)] transition-all duration-1000`}>
                                    {userData.avatar_url ? (
                                        <img src={userData.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-125 contrast-125" />
                                    )}
                                    {!userData.avatar_url && (
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute inset-x-0 h-1 bg-indigo-500 shadow-[0_0_40px_#6366f1] animate-[scan_3s_infinite]"></div>
                                            <div className="absolute inset-0 border-[20px] sm:border-[40px] border-black/20 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 justify-center pb-10">
                                {!userData.avatar_url ? (
                                    <>
                                        {!cameraActive ? (
                                            <button onClick={startCamera} className="px-10 sm:px-16 py-5 sm:py-8 bg-indigo-600 text-white rounded-[2rem] sm:rounded-[3rem] font-black text-[11px] sm:text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-4">
                                                <Camera size={24}/> Ativar Câmera
                                            </button>
                                        ) : (
                                            <button onClick={capturePhoto} className="px-10 sm:px-16 py-5 sm:py-8 bg-white text-slate-900 rounded-[2rem] sm:rounded-[3rem] font-black text-[11px] sm:text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-4 border-8 border-indigo-50">
                                                <ScanLine size={24}/> Registrar Face
                                            </button>
                                        )}
                                        <label className="px-10 sm:px-16 py-5 sm:py-8 bg-slate-800 text-white rounded-[2rem] sm:rounded-[3rem] font-black text-[11px] sm:text-xs uppercase tracking-widest cursor-pointer hover:bg-slate-700 transition-all flex items-center justify-center gap-4 border-2 border-white/5">
                                            <Upload size={24}/> Carregar Ficha <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (f) { const r = new FileReader(); r.onloadend = () => setUserData({...userData, avatar_url: r.result as string}); r.readAsDataURL(f); }
                                            }} />
                                        </label>
                                    </>
                                ) : (
                                    <button onClick={handleFinalReview} className="px-14 sm:px-24 py-6 sm:py-9 bg-emerald-600 text-white rounded-[2.5rem] sm:rounded-[4rem] font-black text-sm sm:text-base uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-6 active:scale-95 animate-pulse">
                                        Validar Protocolo <ArrowRight size={28}/>
                                    </button>
                                )}
                            </div>
                         </div>
                    </div>
                )}

                {step === 'REVIEW' && (
                    <div className="bg-white w-full max-w-4xl p-8 sm:p-14 lg:p-20 rounded-[3rem] sm:rounded-[5rem] shadow-2xl border border-slate-200 animate-fade-in relative overflow-hidden my-auto mb-10">
                         <div className="absolute top-0 left-0 w-3 sm:w-4 h-full bg-indigo-600" style={{ backgroundColor: primaryColor }}></div>
                         <div className="flex items-center gap-5 sm:gap-8 mb-10 sm:mb-16">
                            <div className="p-5 sm:p-7 bg-indigo-600 rounded-[2rem] sm:rounded-[2.5rem] text-white shadow-2xl animate-pulse" style={{ backgroundColor: primaryColor }}><Brain size={32}/></div>
                            <div>
                                <h3 className="text-3xl sm:text-4xl font-black text-slate-800 uppercase tracking-tightest leading-none">Matriz Social</h3>
                                <p className="text-[10px] sm:text-[11px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2">SRE Active Intelligence Audit</p>
                            </div>
                        </div>

                        <div className="space-y-10 sm:space-y-14">
                            <div className="flex flex-col sm:flex-row gap-8 sm:gap-10 items-center p-8 sm:p-10 bg-slate-50 border border-slate-200 rounded-[2.5rem] sm:rounded-[4rem] shadow-inner">
                                <div className="w-28 h-28 sm:w-36 sm:h-36 bg-slate-200 border-4 border-white shadow-2xl overflow-hidden rounded-3xl sm:rounded-[3rem] shrink-0">
                                    {userData.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover" /> : <User size={48} className="text-slate-400 m-10 sm:m-12"/>}
                                </div>
                                <div className="text-center sm:text-left flex-1 min-w-0">
                                    <h4 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase leading-none mb-4 truncate">{userData.name}</h4>
                                    <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4">
                                        <span className="text-[9px] sm:text-[11px] font-black text-indigo-600 bg-white px-4 py-2 rounded-xl border border-indigo-100 uppercase tracking-widest">Unid. {userData.unit}</span>
                                        <span className="text-[9px] sm:text-[11px] font-black text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-100 uppercase tracking-widest">{formatCPF(cpfIdentifier)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 sm:p-14 bg-indigo-50 rounded-[3rem] sm:rounded-[4.5rem] border border-indigo-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-[0.05]"><Sparkles size={160} /></div>
                                <h4 className="text-[10px] sm:text-[12px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-6 sm:mb-8 flex items-center gap-3"><Zap size={16}/> Diagnóstico Neural</h4>
                                {isGeneratingSummary ? (
                                    <div className="flex items-center gap-4 sm:gap-5 animate-pulse py-4 sm:py-6">
                                        <Loader2 className="animate-spin text-indigo-600" size={24} />
                                        <span className="text-sm sm:text-base font-black text-indigo-400 uppercase tracking-widest">Processando Atributos...</span>
                                    </div>
                                ) : <p className="text-indigo-900 text-lg sm:text-2xl font-medium leading-relaxed sm:leading-loose uppercase italic relative z-10">"{aiSummary}"</p>}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 pb-10">
                                <button onClick={() => setStep('FORM')} className="order-2 sm:order-1 flex-1 py-6 sm:py-8 bg-slate-100 text-slate-500 rounded-[1.75rem] sm:rounded-[2.5rem] font-black text-[11px] sm:text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Revisar Protocolo</button>
                                <button onClick={handleSubmit} disabled={isLoading} className="order-1 sm:order-2 flex-[2.5] py-6 sm:py-8 bg-slate-950 text-white rounded-[1.75rem] sm:rounded-[2.5rem] font-black text-[11px] sm:text-xs uppercase tracking-[0.4em] hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 disabled:opacity-30">
                                    {isLoading ? <Loader2 className="animate-spin" size={24}/> : <><ShieldCheck size={24}/> Comitar Censo Digital</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
            <style>{`
                @keyframes scan { 0% { transform: translateY(-40px); } 100% { transform: translateY(440px); } }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
                .animate-shake { animation: shake 0.35s ease-in-out; }
                /* Otimização de Scrollbar para Containers Mobile */
                .overflow-y-auto { -webkit-overflow-scrolling: touch; }
                ::-webkit-scrollbar { display: none; }
                body { overflow-x: hidden; height: auto !important; position: static !important; }
                #root { height: auto !important; }
            `}</style>
        </div>
    );
};

export default PublicSenso;
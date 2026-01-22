
import React, { useState, useEffect, useRef } from 'react';
import { Survey, SystemInfo } from '../types';
import { api } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import {
    ShieldCheck, CheckCircle2, X, Fingerprint, Loader2, Save, ChevronRight, 
    AlertTriangle, Users, Plus, Trash2, ArrowRight, Brain, Sparkles, ClipboardCheck,
    ChevronLeft, RotateCcw, User, MapPin, Building, Info, Camera, ScanLine, Upload,
    // SRE FIX: Added missing Zap icon import to resolve "Cannot find name 'Zap'" error on line 354
    Zap
} from 'lucide-react';

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

    const handleIdentify = async () => {
        const cleanCPF = normalizeCPF(cpfIdentifier);
        if (!validateCPF(cleanCPF)) { 
            setError('Falha de Protocolo: CPF Inválido matematicamente.'); 
            return; 
        }
        setIsLoading(true); 
        setError('');
        try {
            const res = await api.get(`/surveys/public/check-resident/${cleanCPF}`);
            if (res.data && res.data.found) {
                setUserData({ 
                    name: res.data.name, 
                    unit: res.data.unit || '', 
                    email: res.data.email || '', 
                    phone: res.data.phone || '',
                    birthDate: res.data.birthDate || '',
                    avatar_url: res.data.avatar_url || ''
                });
                setIsNewResident(false);
            } else { setIsNewResident(true); }
            setStep('FORM');
        } catch (e) { setError('Falha no Kernel de identificação. Verifique sua conexão.'); } 
        finally { setIsLoading(false); }
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
        if (currentSection === 0 && (!userData.name || !userData.unit || !userData.birthDate)) {
            alert("Atributos de Identidade (Nome, Unidade e Nascimento) são obrigatórios."); return;
        }
        if (currentSection < totalSteps - 1) { setCurrentSection(prev => prev + 1); window.scrollTo(0, 0); } 
        else {
            if (isNewResident && !userData.avatar_url) { setStep('PHOTO'); } 
            else { handleFinalReview(); }
        }
    };

    const handleFinalReview = async () => {
        setStep('REVIEW');
        setIsGeneratingSummary(true);
        try {
            const res = await api.post('/ai/chat', { 
                contents: `Analise este perfil: ${JSON.stringify({...userData, ...answers})}. Gere um diagnóstico social curto. Comece com "Dossiê S.I.E analisado..."`
            });
            setAiSummary(res.data.text);
        } catch (e) { setAiSummary("Seu protocolo foi processado com sucesso pelo Kernel S.I.E."); } 
        finally { setIsGeneratingSummary(false); }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            await api.post(`/surveys/public/${survey?.id}/submit`, { cpf: normalizeCPF(cpfIdentifier), userData, answers });
            setStep('SUCCESS');
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
        <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-white">
            <div className="bg-white p-16 rounded-[4rem] shadow-2xl max-w-lg w-full text-center mx-4 animate-scale-in">
                <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl"><CheckCircle2 size={48} /></div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Sincronizado!</h2>
                <p className="text-slate-500 font-medium mt-6 mb-12 text-[11px] uppercase tracking-widest leading-relaxed italic">Sua participação fortalece o cluster {systemInfo?.shortName}.</p>
                <button onClick={() => window.location.href = '/'} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Encerrar Terminal</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen w-screen bg-white flex flex-col overflow-x-hidden relative">
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
                
                {step === 'IDENTIFY' && (
                    <div className="bg-white border border-slate-100 sm:rounded-[4rem] rounded-none w-full max-w-xl p-12 lg:p-20 text-center animate-fade-in shadow-2xl">
                        <div className="w-20 h-20 bg-slate-900 rounded-[2rem] mx-auto flex items-center justify-center text-white mb-8 shadow-xl">
                            {systemInfo?.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain p-4" /> : <Fingerprint size={32} />}
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 uppercase mb-4 tracking-tight">Censo Ativo 2025</h2>
                        <p className="text-slate-400 mb-12 text-[9px] font-black uppercase tracking-[0.4em]">Protocolo SRE - Identificação Soberana</p>
                        <div className="space-y-8">
                            <div className="relative">
                                <input type="text" value={cpfIdentifier} onChange={e => { setCpfIdentifier(formatCPF(e.target.value)); setError(''); }} className="w-full py-7 bg-slate-50 border border-slate-200 rounded-3xl text-center text-3xl font-black outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase placeholder:text-slate-200" placeholder="000.000.000-00" maxLength={14} />
                                {validateCPF(normalizeCPF(cpfIdentifier)) && <div className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500"><ShieldCheck size={28}/></div>}
                            </div>
                            <button onClick={handleIdentify} disabled={isLoading || !validateCPF(normalizeCPF(cpfIdentifier))} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-2xl disabled:opacity-30">
                                {isLoading ? <Loader2 className="animate-spin" size={20}/> : <>Avançar Handshake <ChevronRight size={20}/></>}
                            </button>
                            {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-black text-[10px] uppercase shadow-sm">{error}</div>}
                        </div>
                    </div>
                )}

                {step === 'FORM' && (
                    <div className="bg-white w-full max-w-6xl flex flex-col flex-1 animate-fade-in sm:my-10 shadow-2xl sm:rounded-[4rem] overflow-hidden border border-slate-100">
                        <div className="shrink-0 border-b bg-slate-900 p-8 flex justify-between items-center text-white">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg" style={{ backgroundColor: primaryColor }}><ClipboardCheck size={24}/></div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tight leading-none">{survey?.title}</h3>
                                    <p className="text-[9px] text-indigo-300 font-black uppercase mt-2 tracking-widest">Protocolo: Seção {currentSection + 1} de {totalSteps}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden hidden md:block">
                                    <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${progress}%`, backgroundColor: primaryColor }} />
                                </div>
                                <span className="text-[11px] font-black text-white/50 uppercase tracking-widest">{Math.round(progress)}%</span>
                            </div>
                        </div>

                        <div className="flex-1 p-10 lg:p-20 bg-white">
                            <div className="w-full mx-auto space-y-12">
                                {currentSection === 0 ? (
                                    <div className="space-y-10 animate-fade-in">
                                        <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-10 border-b border-indigo-50 pb-4 flex items-center gap-4">
                                            <User size={20}/> 01. Ficha de Identidade
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                            <div className="md:col-span-8 space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                                <input disabled={!isNewResident} className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xl font-black uppercase focus:bg-white focus:border-indigo-500 outline-none" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} />
                                            </div>
                                            <div className="md:col-span-4 space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Nascimento</label>
                                                <input type="date" className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xl font-black focus:bg-white focus:border-indigo-500 outline-none" value={userData.birthDate} onChange={e => setUserData({...userData, birthDate: e.target.value})} />
                                            </div>
                                            <div className="md:col-span-4 space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Cluster</label>
                                                <input className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xl font-black uppercase focus:bg-white focus:border-indigo-500 outline-none" value={userData.unit} onChange={e => setUserData({...userData, unit: e.target.value})} />
                                            </div>
                                            <div className="md:col-span-4 space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                                                <input className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xl font-black focus:bg-white focus:border-indigo-500 outline-none" value={userData.email} onChange={e => setUserData({...userData, email: e.target.value})} />
                                            </div>
                                            <div className="md:col-span-4 space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                                                <input className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xl font-black focus:bg-white focus:border-indigo-500 outline-none" value={userData.phone} onChange={e => setUserData({...userData, phone: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 animate-fade-in">
                                        {getCurrentQuestions().map((q, idx) => (
                                            <div key={q.id} className="space-y-4 group border-l-4 border-slate-50 pl-8 hover:border-indigo-500 transition-all">
                                                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-4">
                                                    <span className="text-xs text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg">{(visibleQuestions.indexOf(q) + 1).toString().padStart(2, '0')}</span>
                                                    {q.text}
                                                </h4>
                                                {q.type === 'select' ? (
                                                    <div className="flex flex-wrap gap-3">
                                                        {q.options?.map((opt: string) => (
                                                            <button key={opt} onClick={() => setAnswers({...answers, [q.id]: opt})} className={`py-4 px-6 rounded-2xl text-left font-black text-[10px] uppercase tracking-widest border-2 transition-all ${answers[q.id] === opt ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-105' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-400'}`} style={answers[q.id] === opt ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}>{opt}</button>
                                                        ))}
                                                    </div>
                                                ) : q.type === 'boolean' ? (
                                                    <div className="flex gap-4 max-w-sm">
                                                        {['SIM', 'NÃO'].map(val => (
                                                            <button key={val} onClick={() => setAnswers({...answers, [q.id]: val})} className={`flex-1 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] border-2 transition-all ${answers[q.id] === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-105' : 'bg-white border-slate-100 text-slate-400'}`} style={answers[q.id] === val ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}>{val}</button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <input type={q.type} value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 text-lg font-black uppercase focus:bg-white focus:border-indigo-500 outline-none shadow-inner" placeholder="Clique para digitar..." />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-6 pt-12 border-t border-slate-100">
                                    {currentSection > 0 && (
                                        <button onClick={() => setCurrentSection(prev => prev - 1)} className="px-12 py-6 bg-slate-100 text-slate-500 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-3">
                                            <ChevronLeft size={20}/> Voltar
                                        </button>
                                    )}
                                    <button onClick={handleNext} className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-2xl">
                                        {currentSection === totalSteps - 1 ? (isNewResident ? 'Handshake Bio-ID' : 'Finalizar Protocolo') : 'Avançar Seção'} <ArrowRight size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'PHOTO' && (
                    <div className="bg-slate-950 w-full max-w-4xl min-h-[700px] flex flex-col items-center justify-center text-center p-12 sm:rounded-[5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] animate-fade-in relative overflow-hidden">
                         <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                         <div className="relative z-10 space-y-12 w-full">
                            <div className="space-y-4">
                                <h3 className="text-5xl font-black text-white uppercase tracking-tightest leading-none">Vision Identity</h3>
                                <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.5em] opacity-80">Captura Biométrica Obrigatória</p>
                            </div>

                            <div className="relative mx-auto">
                                <div className={`w-80 h-80 sm:w-[400px] sm:h-[400px] bg-black rounded-full border-8 ${userData.avatar_url ? 'border-emerald-500' : 'border-indigo-500/20'} overflow-hidden relative shadow-[0_0_100px_rgba(79,70,229,0.3)] transition-all duration-700`}>
                                    {userData.avatar_url ? (
                                        <img src={userData.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-125" />
                                    )}
                                    {!userData.avatar_url && (
                                        <div className="absolute inset-0 pointer-events-none">
                                            <ScanLine size={200} className="text-white/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                            <div className="absolute inset-x-0 h-1 bg-indigo-500 shadow-[0_0_30px_#6366f1] animate-[scan_2.5s_infinite]"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                {!userData.avatar_url ? (
                                    <>
                                        {!cameraActive ? (
                                            <button onClick={startCamera} className="px-14 py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-4">
                                                <Camera size={24}/> Ativar Lente
                                            </button>
                                        ) : (
                                            <button onClick={capturePhoto} className="px-14 py-7 bg-white text-slate-900 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-4 border-4 border-indigo-50">
                                                <ScanLine size={24}/> Registrar Face
                                            </button>
                                        )}
                                        <label className="px-14 py-7 bg-slate-800 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-slate-700 transition-all flex items-center justify-center gap-4">
                                            <Upload size={24}/> Carregar Ficha <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (f) { const r = new FileReader(); r.onloadend = () => setUserData({...userData, avatar_url: r.result as string}); r.readAsDataURL(f); }
                                            }} />
                                        </label>
                                    </>
                                ) : (
                                    <button onClick={handleFinalReview} className="px-20 py-8 bg-emerald-600 text-white rounded-[3rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-6 active:scale-95 animate-bounce">
                                        Validar Protocolo <ArrowRight size={28}/>
                                    </button>
                                )}
                            </div>
                         </div>
                    </div>
                )}

                {step === 'REVIEW' && (
                    <div className="bg-white w-full max-w-4xl p-12 lg:p-20 sm:rounded-[5rem] shadow-2xl border border-slate-100 animate-fade-in relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-3 h-full bg-indigo-600" style={{ backgroundColor: primaryColor }}></div>
                         <div className="flex items-center gap-6 mb-12">
                            <div className="p-5 bg-indigo-600 rounded-[2rem] text-white shadow-xl" style={{ backgroundColor: primaryColor }}><Brain size={32}/></div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tightest">Análise de Matriz</h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2">Validação SRE Active Intelligence</p>
                            </div>
                        </div>

                        <div className="space-y-12">
                            <div className="flex gap-8 items-center p-8 bg-slate-50 border border-slate-200 rounded-[3rem] shadow-inner">
                                <div className="w-28 h-28 bg-slate-200 border-4 border-white shadow-xl overflow-hidden rounded-[2.5rem]">
                                    {userData.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover" /> : <User size={48} className="text-slate-400 m-8"/>}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 uppercase leading-none mb-3">{userData.name}</h4>
                                    <div className="flex gap-4">
                                        <span className="text-[10px] font-black text-indigo-600 bg-white px-4 py-1.5 rounded-xl border border-indigo-100 uppercase">Unid. {userData.unit}</span>
                                        <span className="text-[10px] font-black text-slate-400 bg-white px-4 py-1.5 rounded-xl border border-slate-100 uppercase">{formatCPF(cpfIdentifier)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-indigo-50 rounded-[3.5rem] border border-indigo-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={120}/></div>
                                <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><Zap size={16}/> Diagnóstico Neural</h4>
                                {isGeneratingSummary ? (
                                    <div className="flex items-center gap-4 animate-pulse py-4">
                                        <Loader2 className="animate-spin text-indigo-600" size={24} />
                                        <span className="text-sm font-black text-indigo-400 uppercase tracking-widest">Processando Atributos Sociais...</span>
                                    </div>
                                ) : <p className="text-indigo-900 text-lg font-medium leading-loose uppercase italic relative z-10">"{aiSummary}"</p>}
                            </div>

                            <div className="flex gap-6">
                                <button onClick={() => setStep('FORM')} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all">Revisar Campos</button>
                                <button onClick={handleSubmit} disabled={isLoading} className="flex-[2] py-6 bg-slate-950 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 disabled:opacity-30">
                                    {isLoading ? <Loader2 className="animate-spin" size={24}/> : <><ShieldCheck size={24}/> Comitar Censo Digital</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
            <style>{`
                @keyframes scan { 0% { transform: translateY(-40px); } 100% { transform: translateY(340px); } }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default PublicSenso;

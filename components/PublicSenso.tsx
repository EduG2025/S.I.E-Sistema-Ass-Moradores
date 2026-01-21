
import React, { useState, useEffect, useRef } from 'react';
import { Survey, SurveyQuestion, SystemInfo } from '../types';
import { api } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import {
    ShieldCheck, CheckCircle2, X, Fingerprint, Loader2, Save, ChevronRight, 
    AlertTriangle, Users, Plus, Trash2, ArrowRight, Brain, Sparkles, ClipboardList,
    ChevronLeft, RotateCcw, HeartPulse, User, MapPin, Building, Laptop, GraduationCap, HandHelping, Landmark, Info, Calendar,
    Camera, ScanLine, Upload, Image as ImageIcon
} from 'lucide-react';

const PublicSenso = () => {
    const [survey, setSurvey] = useState(null as Survey | null);
    const [systemInfo, setSystemInfo] = useState(null as SystemInfo | null);
    const [step, setStep] = useState('IDENTIFY' as 'IDENTIFY' | 'FORM' | 'PHOTO' | 'REVIEW' | 'SUCCESS');
    const [currentSection, setCurrentSection] = useState(0); 
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [error, setError] = useState('');
    const [cpfIdentifier, setCpfIdentifier] = useState('');
    const [aiSummary, setAiSummary] = useState('');
    const [isNewResident, setIsNewResident] = useState(false);

    const [userData, setUserData] = useState({ name: '', unit: '', email: '', phone: '', birthDate: '', avatar_url: '' });
    const [answers, setAnswers] = useState({} as Record<string, any>);

    // Camera Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraActive, setCameraActive] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('sie_census_draft');
        if (saved) {
            try {
                const { cpf, ans, usr, isNew } = JSON.parse(saved);
                setCpfIdentifier(cpf);
                setAnswers(ans);
                setUserData(usr);
                setIsNewResident(isNew);
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
                cpf: cpfIdentifier, ans: answers, usr: userData, isNew: isNewResident
            }));
        }
    }, [answers, userData, cpfIdentifier, isNewResident]);

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
                    birthDate: res.data.birthDate || '',
                    avatar_url: res.data.avatar_url || ''
                });
                setIsNewResident(false);
            } else {
                setIsNewResident(true);
            }
            setStep('FORM');
        } catch (e) { setError('Falha no Kernel de identificação.'); } 
        finally { setIsLoading(false); }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (e) {
            alert("Acesso à câmera negado. Use o upload de arquivo.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            setCameraActive(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx?.drawImage(videoRef.current, 0, 0);
            const b64 = canvasRef.current.toDataURL('image/jpeg', 0.8);
            setUserData({ ...userData, avatar_url: b64 });
            stopCamera();
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setUserData({ ...userData, avatar_url: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

    const handleNext = () => {
        if (currentSection === 0 && (!userData.name || !userData.unit || !userData.birthDate)) {
            alert("Nome, Unidade e Data de Nascimento são obrigatórios."); return;
        }
        if (currentSection < totalSteps - 1) {
            setCurrentSection(prev => prev + 1);
            window.scrollTo(0, 0);
        } else {
            if (isNewResident && !userData.avatar_url) {
                setStep('PHOTO');
            } else {
                handleFinalReview();
            }
        }
    };

    const handleFinalReview = async () => {
        setStep('REVIEW');
        setIsGeneratingSummary(true);
        try {
            const res = await api.post('/ai/chat', { 
                contents: `Analise este perfil demográfico: ${JSON.stringify({...userData, ...answers})}. Gere um diagnóstico social curto e humanizado. Comece com "Perfil analisado..."`
            });
            setAiSummary(res.data.text);
        } catch (e) {
            setAiSummary("O Kernel S.I.E protocolou seus dados com sucesso.");
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

    const isQuestionVisible = (q: any) => {
        if (!q.logic || !q.logic.show_if_question) return true;
        const dependentValue = answers[q.logic.show_if_question];
        return String(dependentValue).toUpperCase() === String(q.logic.show_if_value).toUpperCase();
    };

    const visibleQuestions = survey?.questions?.filter(isQuestionVisible) || [];
    const questionsPerSection = 8;
    const totalSteps = Math.ceil(visibleQuestions.length / questionsPerSection) + 1;
    const progress = ((currentSection + 1) / totalSteps) * 100;

    const getCurrentQuestions = () => {
        if (currentSection === 0) return [];
        const start = (currentSection - 1) * questionsPerSection;
        return visibleQuestions.slice(start, start + questionsPerSection);
    };

    if (step === 'SUCCESS') return (
        <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-white">
            <div className="bg-white p-10 rounded-[2rem] shadow-2xl max-w-lg w-full text-center mx-4">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={32} /></div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Dados Sincronizados</h2>
                <p className="text-slate-500 font-medium mt-4 mb-8 text-[11px] uppercase tracking-widest leading-relaxed italic">Sua participação fortalece o cluster.</p>
                <button onClick={() => window.location.href = '/'} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl">Encerrar Sessão</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen w-screen bg-white flex flex-col overflow-x-hidden relative selection:bg-indigo-600 selection:text-white">
            
            <div className="relative z-10 flex-1 flex flex-col items-center">
                
                {step === 'IDENTIFY' && (
                    <div className="bg-white border border-slate-100 sm:rounded-[3rem] rounded-none w-full max-w-lg p-10 lg:p-14 text-center sm:mt-20 mt-0 h-full sm:h-auto flex flex-col justify-center">
                        <div className="w-14 h-14 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center text-white mb-6">
                            {systemInfo?.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain p-2 rounded-2xl" /> : <Fingerprint size={28} />}
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase mb-2 tracking-tight">Censo Ativo 2025</h2>
                        <p className="text-slate-400 mb-10 text-[7px] font-black uppercase tracking-[0.4em]">Protocolo SRE - Identidade Digital</p>
                        <div className="space-y-6">
                            <div className="relative">
                                <input type="text" value={cpfIdentifier} onChange={e => { setCpfIdentifier(formatCPF(e.target.value)); setError(''); }} className="w-full py-5 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xl font-black outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase" placeholder="000.000.000-00" maxLength={14} />
                                {validateCPF(normalizeCPF(cpfIdentifier)) && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500"><ShieldCheck size={18}/></div>}
                            </div>
                            <button onClick={handleIdentify} disabled={isLoading || !validateCPF(normalizeCPF(cpfIdentifier))} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.4em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                                {isLoading ? <Loader2 className="animate-spin" size={14}/> : <>Avançar Protocolo <ChevronRight size={14}/></>}
                            </button>
                            {error && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 font-black text-[8px] uppercase">{error}</div>}
                        </div>
                    </div>
                )}

                {step === 'FORM' && (
                    <div className="bg-white w-full flex flex-col flex-1 animate-fade-in">
                        <div className="shrink-0 border-b bg-slate-900 p-8 py-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-indigo-600 rounded-xl"><ClipboardList size={18}/></div>
                                <div>
                                    <h3 className="font-black text-sm uppercase tracking-tight leading-none">{survey?.title}</h3>
                                    <p className="text-[7px] text-indigo-300 font-black uppercase mt-1 tracking-widest">Seção {currentSection + 1} de {totalSteps}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">{Math.round(progress)}%</span>
                                <div className="w-20 sm:w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-4 sm:p-8 lg:p-14 bg-white">
                            <div className="w-full mx-auto space-y-8">
                                {currentSection === 0 ? (
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-4 border-b border-indigo-50 pb-2 flex items-center gap-2">
                                            <User size={14}/> 01. Ficha Cadastral
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="md:col-span-8 space-y-1">
                                                <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                                <input className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase focus:bg-white focus:border-indigo-500 outline-none" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} />
                                            </div>
                                            <div className="md:col-span-4 space-y-1">
                                                <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Nascimento</label>
                                                <input type="date" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black focus:bg-white focus:border-indigo-500 outline-none" value={userData.birthDate} onChange={e => setUserData({...userData, birthDate: e.target.value})} />
                                            </div>
                                            <div className="md:col-span-4 space-y-1">
                                                <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Lote</label>
                                                <input className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase focus:bg-white focus:border-indigo-500 outline-none" value={userData.unit} onChange={e => setUserData({...userData, unit: e.target.value})} />
                                            </div>
                                            <div className="md:col-span-4 space-y-1">
                                                <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                                                <input className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black focus:bg-white focus:border-indigo-500 outline-none" value={userData.email} onChange={e => setUserData({...userData, email: e.target.value})} />
                                            </div>
                                            <div className="md:col-span-4 space-y-1">
                                                <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                                                <input className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black focus:bg-white focus:border-indigo-500 outline-none" value={userData.phone} onChange={e => setUserData({...userData, phone: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                        {getCurrentQuestions().map((q, idx) => (
                                            <div key={q.id} className="space-y-3 group border-l-2 border-slate-100 pl-4 hover:border-indigo-500 transition-colors">
                                                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                                    <span className="text-[8px] text-indigo-500">{(visibleQuestions.indexOf(q) + 2).toString().padStart(2, '0')}</span>
                                                    {q.text}
                                                </h4>
                                                
                                                {q.type === 'repeater' ? (
                                                    <div className="space-y-3">
                                                        {(Array.isArray(answers[q.id]) ? answers[q.id] : []).map((item: any, i: number) => (
                                                            <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative">
                                                                <button onClick={() => { const current = [...answers[q.id]]; current.splice(i, 1); setAnswers({ ...answers, [q.id]: current }); }} className="absolute top-2 right-2 text-rose-400 hover:text-rose-600"><Trash2 size={12}/></button>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    {q.repeater_fields?.map((rf: any) => (
                                                                        <div key={rf.id} className="space-y-1">
                                                                            <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{rf.text}</label>
                                                                            <input type={rf.type} className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-[9px] font-bold uppercase focus:border-indigo-500 outline-none" value={item[rf.id] || ''} onChange={e => { const current = [...answers[q.id]]; current[i] = { ...current[i], [rf.id]: e.target.value }; setAnswers({ ...answers, [q.id]: current }); }} />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <button onClick={() => { const current = Array.isArray(answers[q.id]) ? [...answers[q.id]] : []; current.push({}); setAnswers({ ...answers, [q.id]: current }); }} className="w-full py-3 border border-dashed border-slate-300 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-black text-[8px] uppercase tracking-widest">+ Adicionar Registro</button>
                                                    </div>
                                                ) : q.type === 'select' ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {q.options?.map((opt: string) => (
                                                            <button key={opt} onClick={() => setAnswers({...answers, [q.id]: opt})} className={`py-2 px-4 rounded-xl text-left font-black text-[8px] uppercase tracking-widest border transition-all ${answers[q.id] === opt ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-400'}`}>{opt}</button>
                                                        ))}
                                                    </div>
                                                ) : q.type === 'boolean' ? (
                                                    <div className="flex gap-2">
                                                        {['SIM', 'NÃO'].map(val => (
                                                            <button key={val} onClick={() => setAnswers({...answers, [q.id]: val})} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.3em] border transition-all ${answers[q.id] === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}>{val}</button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <input type={q.type} value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[12px] font-black uppercase focus:bg-white focus:border-indigo-500 outline-none" placeholder="Digite aqui..." />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-4 pt-10 border-t">
                                    {currentSection > 0 && (
                                        <button onClick={() => setCurrentSection(prev => prev - 1)} className="px-6 sm:px-10 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 flex items-center gap-2">
                                            <ChevronLeft size={16}/> <span className="hidden sm:inline">Voltar</span>
                                        </button>
                                    )}
                                    <button onClick={handleNext} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-indigo-600 flex items-center justify-center gap-4 active:scale-[0.98] transition-all">
                                        {currentSection === totalSteps - 1 ? (isNewResident ? 'Capturar Avatar' : 'Revisar Protocolo') : 'Avançar Seção'} <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'PHOTO' && (
                    <div className="bg-slate-900 w-full flex flex-col flex-1 animate-fade-in relative overflow-hidden h-full">
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                        
                        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-10">
                            <div className="max-w-3xl w-full text-center space-y-8">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tightest">Identificação Vision</h3>
                                    <p className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.4em]">Handshake de Identidade Obrigatório</p>
                                </div>

                                <div className="relative mx-auto">
                                    <div className="w-72 h-72 sm:w-96 sm:h-96 bg-black rounded-full border-4 border-white/20 overflow-hidden relative shadow-[0_0_80px_rgba(79,70,229,0.3)]">
                                        {userData.avatar_url ? (
                                            <img src={userData.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-110" />
                                        )}
                                        {!userData.avatar_url && (
                                            <>
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <ScanLine size={160} className="text-white/20 animate-pulse" />
                                                    <div className="absolute inset-x-0 h-0.5 bg-indigo-500 shadow-[0_0_20px_#6366f1] animate-[scan_2s_infinite]"></div>
                                                </div>
                                                <div className="absolute top-0 left-0 p-4">
                                                    <span className="bg-rose-600 text-white px-3 py-1 text-[8px] font-black uppercase animate-pulse rounded-full">Live Feed</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    
                                    {userData.avatar_url && (
                                        <button onClick={() => { setUserData({...userData, avatar_url: ''}); startCamera(); }} className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 rounded-full">
                                            <RotateCcw size={14}/> Refazer
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {!userData.avatar_url ? (
                                        <>
                                            {!cameraActive ? (
                                                <button onClick={startCamera} className="w-full py-5 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 flex items-center justify-center gap-3 rounded-2xl">
                                                    <Camera size={20}/> Ativar Lente
                                                </button>
                                            ) : (
                                                <button onClick={capturePhoto} className="w-full py-5 bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 flex items-center justify-center gap-3 rounded-2xl">
                                                    <ScanLine size={20}/> Capturar Face
                                                </button>
                                            )}
                                            <label className="w-full py-5 bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-slate-700 flex items-center justify-center gap-3 rounded-2xl">
                                                <Upload size={20}/> Upload Ficha <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                            </label>
                                        </>
                                    ) : (
                                        <button onClick={handleFinalReview} className="col-span-full py-6 bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-4 rounded-3xl">
                                            Avançar para Revisão <ArrowRight size={20}/>
                                        </button>
                                    )}
                                </div>
                                <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">Sua foto será utilizada para o crachá digital e portaria Vision.</p>
                            </div>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                )}

                {step === 'REVIEW' && (
                    <div className="bg-white w-full max-w-3xl p-6 sm:p-10 lg:p-14 sm:mt-10 mt-0 sm:border rounded-none sm:rounded-[3rem] h-full sm:h-auto overflow-y-auto">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-600 rounded-2xl text-white"><Brain size={24}/></div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Mapeamento Social</h3>
                                <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest mt-1">Validação SRE Active Intelligence</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="flex gap-6 items-center p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                                <div className="w-20 h-20 bg-slate-200 border-2 border-white shadow-lg overflow-hidden rounded-2xl">
                                    {userData.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover" /> : <User size={40} className="text-slate-400 m-5"/>}
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-800 uppercase leading-none">{userData.name}</h4>
                                    <p className="text-[9px] font-black text-indigo-500 uppercase mt-2 tracking-widest">Unidade: {userData.unit}</p>
                                </div>
                            </div>

                            <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                                <h4 className="text-[8px] font-black text-indigo-600 uppercase tracking-widest mb-4">Diagnóstico IA</h4>
                                {isGeneratingSummary ? (
                                    <div className="flex items-center gap-2 animate-pulse">
                                        <Loader2 className="animate-spin" size={14} />
                                        <span className="text-[9px] font-black text-indigo-400 uppercase">Processando matriz...</span>
                                    </div>
                                ) : <p className="text-indigo-900 text-sm font-medium leading-relaxed uppercase italic">"{aiSummary}"</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Campos Coletados</p>
                                    <h4 className="text-xl font-black text-slate-800">{Object.keys(answers).length}</h4>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Handshake SRE</p>
                                    <h4 className="text-xl font-black text-emerald-600 uppercase">AUTENTICADO</h4>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button onClick={() => setStep('FORM')} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200">Corrigir</button>
                                <button onClick={handleSubmit} disabled={isLoading} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-3">
                                    {isLoading ? <Loader2 className="animate-spin" size={14}/> : <><ShieldCheck size={18}/> Protocolar Censo</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes scan { 0% { transform: translateY(-40px); } 100% { transform: translateY(400px); } }
            `}</style>
        </div>
    );
};

export default PublicSenso;

import React, { useState, useEffect, useRef } from 'react';
import { Survey, SystemInfo, ResidentType, PreferredChannel, UserRole, UserStatus } from '../types';
import { api, systemService } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import {
    ShieldCheck, CheckCircle2, X, Fingerprint, Loader2, ChevronRight, 
    AlertTriangle, ClipboardCheck, Camera, ScanLine, Upload,
    Zap, Sparkles, User, ArrowRight, Brain, Info, Key, Shield,
    UserCheck, Smartphone, MapPin, Building, Globe
} from 'lucide-react';

const PublicSenso = () => {
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [roles, setRoles] = useState<any[]>([]);
    const [step, setStep] = useState<'IDENTIFY' | 'FORM' | 'PHOTO' | 'REVIEW' | 'SUCCESS'>('IDENTIFY');
    const [currentSection, setCurrentSection] = useState(0); 
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [error, setError] = useState('');
    const [cpfIdentifier, setCpfIdentifier] = useState('');
    const [aiSummary, setAiSummary] = useState('');
    const [isNewResident, setIsNewResident] = useState(false);

    // Identidade Master V240.2
    const [userData, setUserData] = useState({ 
        name: '', 
        cpf_cnpj: '',
        birth_date: '', 
        rg: '',
        issuing_authority: '',
        gender: '',
        unit: '', 
        resident_type: 'TITULAR' as ResidentType,
        voting_rights: 1,
        role: 'RESIDENT' as string,
        status: 'PENDING' as UserStatus,
        password: '',
        email: '', 
        phone: '', 
        whatsapp: '',
        preferred_channel: 'WHATSAPP' as PreferredChannel,
        avatar_url: '',
        nationality: 'Brasileira',
        address: '',
        profession: ''
    });
    
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
            const [sysRes, rolesRes] = await Promise.all([
                api.get('/settings/system'),
                systemService.getRoles()
            ]);
            setSystemInfo(sysRes.data); 
            setRoles(rolesRes.data.data || []);
        } catch (e) { console.error("Identity Core Offline"); }
    };

    const loadSurvey = async (id: string) => {
        setIsLoading(true);
        try { 
            const res = await api.get(`/surveys/public/${id}`); 
            setSurvey(res.data); 
        } catch (e) { 
            setError('Este formulário não está disponível.'); 
        } finally { setIsLoading(false); }
    };

    const handleIdentify = async () => {
        const cleanCPF = normalizeCPF(cpfIdentifier);
        if (!validateCPF(cleanCPF)) { setError('CPF Inválido.'); return; }

        setIsLoading(true); 
        setError('');
        try {
            const res = await api.get(`/surveys/public/check-resident/${cleanCPF}`);
            if (res.data && res.data.found) {
                // SRE FIX: Mapeamento explícito de campos recuperados do banco para o estado local
                setUserData({ 
                    ...userData,
                    name: res.data.name || '', 
                    cpf_cnpj: cleanCPF,
                    unit: res.data.unit || '', 
                    email: res.data.email || '', 
                    phone: res.data.phone || '',
                    whatsapp: res.data.whatsapp || res.data.phone || '',
                    birth_date: res.data.birth_date ? res.data.birth_date.slice(0,10) : '',
                    gender: res.data.gender || '',
                    rg: res.data.rg || '',
                    issuing_authority: res.data.issuing_authority || '',
                    avatar_url: res.data.avatar_url || '',
                    resident_type: res.data.resident_type || 'TITULAR',
                    voting_rights: res.data.voting_rights ?? 1,
                    role: res.data.role || 'RESIDENT',
                    status: res.data.status || 'PENDING',
                    address: res.data.address || '',
                    profession: res.data.profession || ''
                });
                setIsNewResident(false);
            } else { 
                setIsNewResident(true); 
                setUserData({ ...userData, cpf_cnpj: cleanCPF });
            }
            setStep('FORM');
        } catch (e) { setError('Erro ao validar identidade.'); } 
        finally { setIsLoading(false); }
    };

    const handleFinalReview = async () => {
        setStep('REVIEW');
        setIsGeneratingSummary(true);
        try {
            const prompt = `Analise as respostas deste censo e gere um resumo biográfico de uma frase curta em caixa alta: ${JSON.stringify({ userData, answers })}`;
            const res = await api.post('/ai/chat', { contents: prompt });
            setAiSummary(res.data.text || 'DADOS COLETADOS COM SUCESSO. AGUARDANDO VALIDAÇÃO.');
        } catch (e) {
            setAiSummary('PROTOCOLADO PARA AUDITORIA HUMANA.');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            await api.post(`/surveys/public/${survey?.id}/submit`, { 
                cpf: normalizeCPF(cpfIdentifier), 
                userData: {
                    ...userData,
                    active: 1,
                    status: isNewResident ? 'PENDING' : userData.status
                }, 
                answers: answers 
            });
            setStep('SUCCESS');
        } catch (e: any) { alert(`Erro: ${e.response?.data?.error || 'Erro de rede.'}`); } 
        finally { setIsLoading(false); }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) { videoRef.current.srcObject = stream; setCameraActive(true); }
        } catch (e) { alert("Câmera indisponível."); }
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

    const primaryColor = systemInfo?.primaryColor || '#4f46e5';

    if (step === 'SUCCESS') return (
        <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center text-white p-6">
            <div className="bg-white p-8 sm:p-16 rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl max-w-lg w-full text-center animate-scale-in">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"><CheckCircle2 size={32} /></div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">Sincronizado</h2>
                <p className="text-slate-500 font-medium mt-4 mb-8 text-[10px] uppercase tracking-widest leading-relaxed">Sua participação fortalece o cluster {systemInfo?.shortName}.</p>
                <button onClick={() => window.location.href = '/'} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Encerrar Sessão</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col relative overflow-x-hidden antialiased">
            <div className="flex-1 flex flex-col items-center">
                
                {step === 'IDENTIFY' && (
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] sm:rounded-[4rem] w-full max-w-xl p-8 sm:p-12 lg:p-20 text-center animate-fade-in shadow-2xl my-auto sm:my-20">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-900 rounded-[2rem] mx-auto flex items-center justify-center text-white mb-8 shadow-2xl overflow-hidden">
                            {systemInfo?.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain p-3" alt="Logo" /> : <Fingerprint size={40} />}
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase mb-2 tracking-tight">Censo Digital</h2>
                        <div className="inline-block px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mb-8">
                            <p className="text-indigo-600 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em]">Protocolo Identificação V240.2</p>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="relative group">
                                <label className="absolute -top-2.5 left-5 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">Informe seu CPF</label>
                                <input type="text" inputMode="numeric" value={cpfIdentifier} onChange={e => { setCpfIdentifier(formatCPF(e.target.value)); setError(''); }} className="w-full py-5 sm:py-7 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl sm:rounded-3xl text-center text-lg sm:text-xl font-black outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase shadow-inner" placeholder="000.000.000-00" maxLength={14} />
                                {validateCPF(normalizeCPF(cpfIdentifier)) && <div className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500 animate-scale-in"><ShieldCheck size={24}/></div>}
                            </div>
                            <button onClick={handleIdentify} disabled={isLoading || !validateCPF(normalizeCPF(cpfIdentifier))} className="w-full py-5 sm:py-7 bg-slate-900 text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl disabled:opacity-30">
                                {isLoading ? <Loader2 className="animate-spin" size={20}/> : <>Iniciar Censo <ChevronRight size={18}/></>}
                            </button>
                            {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-black text-[9px] uppercase shadow-sm animate-shake flex items-center justify-center gap-2 tracking-widest"><AlertTriangle size={14} /> {error}</div>}
                        </div>
                    </div>
                )}

                {step === 'FORM' && (
                    <div className="bg-white w-full max-w-6xl flex flex-col animate-fade-in shadow-2xl sm:rounded-[3rem] overflow-hidden border-b border-slate-100 sm:mb-10 min-h-screen sm:min-h-0">
                        {/* HEADER SLIM */}
                        <div className="shrink-0 border-b bg-slate-900 p-5 sm:p-8 flex justify-between items-center text-white sticky top-0 z-50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shrink-0" style={{ backgroundColor: primaryColor }}><ClipboardCheck size={20}/></div>
                                <div className="min-w-0">
                                    <h3 className="font-black text-sm sm:text-xl uppercase tracking-tight truncate">{survey?.title || 'Identidade Digital'}</h3>
                                    <p className="text-[8px] sm:text-[9px] text-indigo-300 font-black uppercase mt-0.5 tracking-widest opacity-80">Etapa {currentSection + 1} de 2</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 sm:gap-6">
                                <div className="hidden sm:block w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${currentSection === 0 ? 50 : 100}%`, backgroundColor: primaryColor }} />
                                </div>
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{currentSection === 0 ? '50%' : '100%'}</span>
                            </div>
                        </div>
                        
                        <div className="sm:hidden w-full h-1 bg-slate-800">
                             <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${currentSection === 0 ? 50 : 100}%`, backgroundColor: primaryColor }} />
                        </div>

                        <div className="p-6 sm:p-10 lg:p-14 bg-white">
                            {currentSection === 0 ? (
                                <div className="space-y-12 animate-fade-in max-w-5xl mx-auto pb-10">
                                    
                                    {/* SEÇÃO 1: IDENTIFICAÇÃO CIVIL */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 px-2 border-l-4 border-indigo-500 pl-4">
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Identificação Civil</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-5 text-sm font-black focus:bg-white focus:border-indigo-500 outline-none transition-all uppercase" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} placeholder="CONFORME DOCUMENTO" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF (Único)</label>
                                                <input readOnly className="w-full h-14 bg-slate-100 border-2 border-slate-100 rounded-xl px-5 text-sm font-black outline-none opacity-60" value={formatCPF(userData.cpf_cnpj)} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                                                <input type="date" className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-5 text-sm font-black outline-none focus:bg-white focus:border-indigo-500 transition-all" value={userData.birth_date} onChange={e => setUserData({...userData, birth_date: e.target.value})} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">RG</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-5 text-sm font-black outline-none focus:bg-white focus:border-indigo-500 transition-all" value={userData.rg} onChange={e => setUserData({...userData, rg: e.target.value})} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Emissor</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-5 text-sm font-black outline-none focus:bg-white focus:border-indigo-500 uppercase" value={userData.issuing_authority} onChange={e => setUserData({...userData, issuing_authority: e.target.value})} placeholder="SSP/UF" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Gênero</label>
                                                <select className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-5 text-[10px] font-black uppercase appearance-none" value={userData.gender} onChange={e => setUserData({...userData, gender: e.target.value})}>
                                                    <option value="">Selecione...</option>
                                                    <option value="MALE">Masculino</option>
                                                    <option value="FEMALE">Feminino</option>
                                                    <option value="OTHER">Outro</option>
                                                    <option value="PREFER_NOT_TO_SAY">Não Informar</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Profissão</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-5 text-sm font-black focus:bg-white focus:border-indigo-500 outline-none transition-all uppercase" value={userData.profession} onChange={e => setUserData({...userData, profession: e.target.value})} placeholder="OCUPAÇÃO" />
                                            </div>
                                            <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Residencial Completo</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-5 text-sm font-black focus:bg-white focus:border-indigo-500 outline-none transition-all uppercase" value={userData.address} onChange={e => setUserData({...userData, address: e.target.value})} placeholder="RUA, NÚMERO, BAIRRO, CIDADE/UF" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* SEÇÃO 2: VÍNCULO HABITACIONAL */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 px-2 border-l-4 border-emerald-500 pl-4">
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Vínculo Habitacional</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Cluster</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-5 text-sm font-black focus:bg-white focus:border-indigo-500 transition-all uppercase" value={userData.unit} onChange={e => setUserData({...userData, unit: e.target.value})} placeholder="EX: BLOCO A 101" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Residente</label>
                                                <select className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-5 text-[10px] font-black uppercase appearance-none" value={userData.resident_type} onChange={e => setUserData({...userData, resident_type: e.target.value as ResidentType})}>
                                                    <option value="TITULAR">Titular</option>
                                                    <option value="DEPENDENTE">Dependente</option>
                                                    <option value="INQUILINO">Inquilino</option>
                                                    <option value="RESPONSAVEL">Responsável Legal</option>
                                                    <option value="OCUPANTE">Ocupante</option>
                                                </select>
                                            </div>
                                            <div className="flex items-end pb-2">
                                                <label className="flex items-center gap-4 cursor-pointer group">
                                                    <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${userData.voting_rights === 1 ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200 group-hover:border-indigo-300'}`} onClick={() => setUserData({...userData, voting_rights: userData.voting_rights === 1 ? 0 : 1})}>
                                                        {userData.voting_rights === 1 && <ShieldCheck size={16} className="text-white" />}
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Direito a Voto em Assembleia</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SEÇÃO 3: GOVERNANÇA & ACESSO */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 px-2 border-l-4 border-slate-900 pl-4">
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Governança & Acesso</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Papel SRE</label>
                                                <select className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-5 text-[10px] font-black uppercase appearance-none" value={userData.role} onChange={e => setUserData({...userData, role: e.target.value})}>
                                                    {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado de Conta</label>
                                                <select disabled className="w-full h-14 bg-slate-100 border-2 border-slate-100 rounded-xl px-5 text-[10px] font-black uppercase appearance-none opacity-60" value={userData.status}>
                                                    <option value="ACTIVE">Ativo (Online)</option>
                                                    <option value="PENDING">Pendente</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Chave (Opcional)</label>
                                                <div className="relative">
                                                    <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                    <input type="password" className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-5 text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all" value={userData.password} onChange={e => setUserData({...userData, password: e.target.value})} placeholder="••••••••" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SEÇÃO 4: CONTATO & COMUNICAÇÃO */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 px-2 border-l-4 border-emerald-600 pl-4">
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Contato & Comunicação</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Principal</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-5 text-sm font-black focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" value={userData.email} onChange={e => setUserData({...userData, email: e.target.value})} placeholder="SEU@EMAIL.COM" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone / Fixo</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-5 text-sm font-black focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" value={userData.phone} onChange={e => setUserData({...userData, phone: e.target.value})} placeholder="DDD + NÚMERO" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Bridge</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-5 text-sm font-black focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" value={userData.whatsapp} onChange={e => setUserData({...userData, whatsapp: e.target.value})} placeholder="DDD + NÚMERO" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Canal Preferencial</label>
                                                <select className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-5 text-[10px] font-black uppercase appearance-none" value={userData.preferred_channel} onChange={e => setUserData({...userData, preferred_channel: e.target.value as PreferredChannel})}>
                                                    <option value="WHATSAPP">WhatsApp Messenger</option>
                                                    <option value="EMAIL">E-mail Eletrônico</option>
                                                    <option value="APP">App Mobile</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-10 flex gap-4">
                                        <button onClick={() => { 
                                            if(!userData.name || !userData.unit || !userData.birth_date) return alert("Nome, Unidade e Data de Nascimento são obrigatórios.");
                                            setCurrentSection(1); 
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }} className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl">Continuar para o Censo <ArrowRight size={18} /></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8 sm:space-y-12 animate-fade-in max-w-5xl mx-auto">
                                    <div className="flex items-center gap-3 px-1">
                                        <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                                        <h4 className="text-xs sm:text-base font-black text-slate-800 uppercase tracking-[0.15em]">Dados Socioeconômicos</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                                        {survey?.questions.map((q, idx) => (
                                            <div key={q.id} className="space-y-3 group border-l-2 border-slate-100 pl-5 sm:pl-8 focus-within:border-indigo-500 transition-all">
                                                <h4 className="text-xs sm:text-lg font-black text-slate-800 uppercase tracking-tight flex items-start gap-2 leading-snug">
                                                    <span className="text-[8px] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded shrink-0 mt-1">{(idx + 1).toString().padStart(2, '0')}</span>
                                                    {q.text}
                                                </h4>
                                                {q.type === 'select' ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {q.options?.map((opt: string) => (
                                                            <button key={opt} onClick={() => setAnswers({...answers, [q.id]: opt})} className={`py-3 sm:py-4 px-4 sm:px-6 rounded-xl text-left font-black text-[8px] sm:text-[10px] uppercase tracking-widest border transition-all active:scale-95 ${answers[q.id] === opt ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-300'}`}>{opt}</button>
                                                        ))}
                                                    </div>
                                                ) : q.type === 'boolean' ? (
                                                    <div className="flex gap-3 max-w-xs">
                                                        {['SIM', 'NÃO'].map(val => (
                                                            <button key={val} onClick={() => setAnswers({...answers, [q.id]: val})} className={`flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all active:scale-95 ${answers[q.id] === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>{val}</button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <input type={q.type} value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} className="w-full h-12 sm:h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-5 text-sm sm:text-lg font-black uppercase focus:bg-white focus:border-indigo-500 outline-none shadow-inner transition-all placeholder:text-slate-300" placeholder="Digite aqui..." />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 pt-10 border-t border-slate-100 pb-20">
                                        <button onClick={() => { setCurrentSection(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="py-5 bg-slate-100 text-slate-500 rounded-2xl sm:rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2">Voltar para Identidade</button>
                                        <button onClick={() => { if(isNewResident && !userData.avatar_url) setStep('PHOTO'); else handleFinalReview(); }} className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl">Revisar Protocolo <ArrowRight size={18} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 'PHOTO' && (
                    <div className="bg-slate-950 w-full max-w-4xl min-h-screen sm:min-h-[750px] flex flex-col items-center justify-center text-center p-6 sm:p-14 sm:rounded-[4rem] shadow-2xl animate-fade-in relative overflow-hidden my-auto">
                         <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                         <div className="relative z-10 space-y-10 sm:space-y-14 w-full">
                            <div className="space-y-2">
                                <h3 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tightest leading-none">Vision ID</h3>
                                <p className="text-indigo-400 text-[8px] sm:text-xs font-black uppercase tracking-[0.4em] opacity-80">Protocolo Bio-ID Obrigatório</p>
                            </div>
                            <div className="relative mx-auto">
                                <div className={`w-64 h-64 sm:w-96 sm:h-96 lg:w-[450px] lg:h-[450px] bg-black rounded-full border-4 sm:border-8 ${userData.avatar_url ? 'border-emerald-500' : 'border-indigo-500/30'} overflow-hidden relative shadow-[0_0_80px_rgba(79,70,229,0.3)]`}>
                                    {userData.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover" /> : <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-110" />}
                                    {!userData.avatar_url && <div className="absolute inset-0 pointer-events-none"><div className="absolute inset-x-0 h-1 bg-indigo-500 shadow-[0_0_20px_#6366f1] animate-[scan_3s_infinite]"></div></div>}
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center">
                                {!userData.avatar_url ? (
                                    <>
                                        {!cameraActive ? (
                                            <button onClick={startCamera} className="px-10 py-5 bg-indigo-600 text-white rounded-2xl sm:rounded-[3rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3"><Camera size={20}/> Ativar Câmera</button>
                                        ) : (
                                            <button onClick={capturePhoto} className="px-10 py-5 bg-white text-slate-900 rounded-2xl sm:rounded-[3rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3 border-4 border-indigo-50"><ScanLine size={20}/> Capturar Face</button>
                                        )}
                                        <label className="px-10 py-5 bg-slate-800 text-white rounded-2xl sm:rounded-[3rem] font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-slate-700 transition-all flex items-center justify-center gap-3 border border-white/5"><Upload size={20}/> Upload Arquivo <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) { const r = new FileReader(); r.onloadend = () => setUserData({...userData, avatar_url: r.result as string}); r.readAsDataURL(f); }
                                        }} /></label>
                                    </>
                                ) : <button onClick={handleFinalReview} className="px-16 py-6 sm:py-8 bg-emerald-600 text-white rounded-2xl sm:rounded-[4rem] font-black text-xs sm:text-base uppercase tracking-[0.3em] shadow-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-4 active:scale-95">Validar Identidade <ArrowRight size={22}/></button>}
                            </div>
                         </div>
                    </div>
                )}

                {step === 'REVIEW' && (
                    <div className="bg-white w-full max-w-4xl p-8 sm:p-14 lg:p-20 sm:rounded-[4rem] shadow-2xl border-x sm:border border-slate-200 animate-fade-in relative overflow-hidden my-auto sm:my-10">
                         <div className="hidden sm:block absolute top-0 left-0 w-3 h-full bg-indigo-600" style={{ backgroundColor: primaryColor }}></div>
                         <div className="flex items-center gap-5 sm:gap-8 mb-10 sm:mb-16">
                            <div className="p-4 sm:p-7 bg-indigo-600 rounded-[1.25rem] sm:rounded-[2.5rem] text-white shadow-xl animate-pulse" style={{ backgroundColor: primaryColor }}><Brain size={24}/></div>
                            <div>
                                <h3 className="text-xl sm:text-4xl font-black text-slate-800 uppercase tracking-tight leading-none">Matriz de Dados</h3>
                                <p className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1.5">SRE Identity Audit Hub</p>
                            </div>
                        </div>

                        <div className="space-y-8 sm:space-y-14">
                            <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-center p-6 sm:p-10 bg-slate-50 border border-slate-200 rounded-3xl sm:rounded-[4rem] shadow-inner text-center sm:text-left">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-200 border-2 sm:border-4 border-white shadow-xl overflow-hidden rounded-[1.5rem] sm:rounded-[3rem] shrink-0">
                                    {userData.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover" /> : <User size={40} className="text-slate-400 m-8 sm:m-10"/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xl sm:text-3xl font-black text-slate-900 uppercase leading-none mb-3 truncate">{userData.name}</h4>
                                    <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                                        <span className="text-[8px] sm:text-[10px] font-black text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 uppercase tracking-widest">Unid. {userData.unit}</span>
                                        <span className="text-[8px] sm:text-[10px] font-black text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-100 uppercase tracking-widest">{formatCPF(cpfIdentifier)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 sm:p-14 bg-indigo-50 rounded-[2.5rem] sm:rounded-[4.5rem] border border-indigo-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><Sparkles size={120} /></div>
                                <h4 className="text-[9px] sm:text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 sm:mb-8 flex items-center gap-2"><Zap size={14}/> Diagnóstico SRE</h4>
                                {isGeneratingSummary ? (
                                    <div className="flex items-center gap-4 animate-pulse py-4">
                                        <Loader2 className="animate-spin text-indigo-600" size={20} />
                                        <span className="text-xs sm:text-sm font-black text-indigo-400 uppercase tracking-widest">Sincronizando Ledger...</span>
                                    </div>
                                ) : <p className="text-indigo-900 text-lg sm:text-2xl font-medium leading-relaxed sm:leading-loose uppercase italic relative z-10">"{aiSummary}"</p>}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pb-6">
                                <button onClick={() => setStep('FORM')} className="order-2 sm:order-1 py-5 sm:py-8 bg-slate-100 text-slate-500 rounded-2xl sm:rounded-[2.5rem] font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Revisar Protocolo</button>
                                <button onClick={handleSubmit} disabled={isLoading} className="order-1 sm:order-2 flex-[2.5] py-5 sm:py-8 bg-slate-950 text-white rounded-2xl sm:rounded-[2.5rem] font-black text-[10px] sm:text-xs uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 disabled:opacity-30">
                                    {isLoading ? <Loader2 className="animate-spin" size={20}/> : <><ShieldCheck size={20}/> Comitar Censo Digital</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
            <style>{`
                @keyframes scan { 0% { transform: translateY(-40px); } 100% { transform: translateY(440px); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-scale-in { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .tracking-tightest { letter-spacing: -0.05em; }
                @media (max-width: 640px) {
                    input, select, textarea { font-size: 16px !important; } /* Previne zoom no iOS */
                }
            `}</style>
        </div>
    );
};

export default PublicSenso;
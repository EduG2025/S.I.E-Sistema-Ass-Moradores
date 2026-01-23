import React, { useState, useEffect, useRef } from 'react';
import { userService, systemService } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import { User, ResidentType, PreferredChannel, UserRole, UserStatus } from '../types';
import { 
    Loader2, CheckCircle2, UserPlus, ShieldCheck, X, 
    Smartphone, Mail, MapPin, User as UserIcon, ArrowRight, Zap, 
    Fingerprint, Info, Save, Camera, ScanLine, Upload, Building, 
    Shield, Key, Radio, UserCheck, Globe, Smartphone as WhatsAppIcon
} from 'lucide-react';

const CensusRegister = ({ onClose, primaryColor = '#4f46e5' }: { onClose?: () => void, primaryColor?: string }) => {
    // Form States - Sincronizado com a Matriz de Identidade V240.2
    const [formData, setFormData] = useState({
        name: '',
        cpf_cnpj: '',
        birth_date: '',
        rg: '',
        issuing_authority: '',
        gender: '',
        unit: '',
        resident_type: 'TITULAR' as ResidentType,
        voting_rights: 1,
        role: 'RESIDENT' as UserRole | string,
        status: 'ACTIVE' as UserStatus,
        password: '',
        email: '',
        phone: '',
        whatsapp: '',
        preferred_channel: 'WHATSAPP' as PreferredChannel,
        avatar_url: '',
        address: '',
        profession: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successId, setSuccessId] = useState<number | null>(null);
    const [roles, setRoles] = useState<any[]>([]);

    // Camera States
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const res = await systemService.getRoles();
                setRoles(res.data.data || []);
                
                const params = new URLSearchParams(window.location.search);
                const cpfParam = params.get('cpf');
                if (cpfParam) setFormData(prev => ({ ...prev, cpf_cnpj: formatCPF(cpfParam) }));
            } catch (e) { console.error("SRE Boot Failure"); }
        };
        init();
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (e) { alert("Hardware de vídeo indisponível."); }
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
            setFormData({ ...formData, avatar_url: b64 });
            stopCamera();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const cpfClean = normalizeCPF(formData.cpf_cnpj);
        
        if (!validateCPF(cpfClean)) { 
            setError('PROTOCOL_ERROR: CPF INVÁLIDO OU NÃO RECONHECIDO.'); 
            return; 
        }

        setIsLoading(true);
        try {
            const payload = { 
                ...formData, 
                name: formData.name.toUpperCase(),
                cpf_cnpj: cpfClean,
                active: 1
            };
            // Usando userService para garantir persistência total nas mesmas colunas do UserModal
            const res = await userService.create(payload);
            setSuccessId(res.data.id || null);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'SRE_FAULT: FALHA CRÍTICA NA SINCRONIZAÇÃO.');
        } finally { 
            setIsLoading(false); 
        }
    };

    if (successId) return (
        <div className="flex flex-col items-center justify-center p-10 sm:p-20 text-center animate-scale-in min-h-[500px]">
            <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border-8 border-emerald-50">
                <CheckCircle2 size={48} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Identidade Protocolada</h3>
            <p className="text-slate-500 font-medium mt-4 mb-10 text-[11px] uppercase tracking-widest leading-relaxed">
                Seu registro foi processado e sincronizado com o Kernel administrativo. <br/> 
                <span className="text-indigo-600 font-black">ID DE PROTOCOLO: #SRE-{successId}</span>
            </p>
            <button onClick={() => onClose ? onClose() : window.location.href = '/'} className="px-14 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">Encerrar Sessão</button>
        </div>
    );

    return (
        <div className="sie-modal-container max-w-6xl self-center overflow-hidden">
            {/* Header SRE */}
            <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 shadow-2xl relative z-20">
                <div className="flex items-center gap-5">
                    <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl" style={{ backgroundColor: primaryColor }}><UserPlus size={22}/></div>
                    <div>
                        <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Identidade Digital</h3>
                        <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">Onboarding Protocol V240.2 • Sincronia Master</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24} /></button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar bg-[#fdfdfe] relative">
                <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-12 pb-20">
                    
                    {error && (
                        <div className="bg-rose-50 text-rose-600 p-6 rounded-[2rem] text-[10px] font-black uppercase text-center border border-rose-100 flex items-center justify-center gap-4 animate-shake shadow-sm">
                            <Zap size={20}/> {error}
                        </div>
                    )}

                    {/* SEÇÃO 0: HANDSHAKE BIOMÉTRICO (TOPO) */}
                    <div className="flex flex-col md:flex-row items-center gap-12 bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100 shadow-inner">
                        <div className="relative group">
                            <div className="w-48 h-48 rounded-[2.5rem] bg-slate-200 border-4 border-white shadow-2xl overflow-hidden relative flex items-center justify-center ring-4 ring-slate-100">
                                {formData.avatar_url ? (
                                    <img src={formData.avatar_url} className="w-full h-full object-cover" />
                                ) : cameraActive ? (
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-110" />
                                ) : (
                                    <div className="text-center space-y-3">
                                        <UserIcon size={64} className="text-slate-300 mx-auto" />
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Sem Imagem</p>
                                    </div>
                                )}
                            </div>
                            {cameraActive && (
                                <button type="button" onClick={capturePhoto} className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-indigo-600 text-white rounded-full font-black text-[9px] uppercase tracking-widest shadow-2xl border-2 border-white">
                                    Capturar
                                </button>
                            )}
                        </div>
                        <div className="space-y-6 flex-1 text-center md:text-left">
                            <div className="space-y-2">
                                <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tightest leading-none">Handshake Biométrico</h4>
                                <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-sm uppercase">Capture uma imagem frontal para autenticação Vision ID.</p>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                {!cameraActive ? (
                                    <button type="button" onClick={startCamera} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-3">
                                        <Camera size={18}/> Iniciar Câmera
                                    </button>
                                ) : (
                                    <button type="button" onClick={stopCamera} className="px-6 py-3 bg-rose-50 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-rose-100 transition-all flex items-center gap-2"><X size={18}/> Encerrar</button>
                                )}
                                <label className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm cursor-pointer hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center gap-3">
                                    <Upload size={18}/> Upload <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData({ ...formData, avatar_url: reader.result as string }); reader.readAsDataURL(file); }
                                    }} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO 1: IDENTIFICAÇÃO CIVIL */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 px-2 border-l-4 border-indigo-500 pl-4">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Identificação Civil</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-2 md:col-span-2 lg:col-span-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base focus:bg-white focus:border-indigo-500 shadow-inner outline-none uppercase transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="CONFORME DOCUMENTO" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF (Único)</label>
                                <input className="w-full font-mono font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={formData.cpf_cnpj} onChange={e => setFormData({...formData, cpf_cnpj: formatCPF(e.target.value)})} maxLength={14} placeholder="000.000.000-00" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                                <input type="date" className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RG</label>
                                <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={formData.rg} onChange={e => setFormData({...formData, rg: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Emissor</label>
                                <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase" value={formData.issuing_authority} onChange={e => setFormData({...formData, issuing_authority: e.target.value})} placeholder="SSP/UF" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gênero</label>
                                <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-[10px] uppercase shadow-inner appearance-none focus:bg-white focus:border-indigo-500 transition-all" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                                    <option value="">Selecione...</option>
                                    <option value="MALE">Masculino</option>
                                    <option value="FEMALE">Feminino</option>
                                    <option value="OTHER">Outro</option>
                                    <option value="PREFER_NOT_TO_SAY">Não Informar</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profissão</label>
                                <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base focus:bg-white focus:border-indigo-500 shadow-inner outline-none uppercase transition-all" value={formData.profession} onChange={e => setFormData({...formData, profession: e.target.value})} placeholder="OCUPAÇÃO" />
                            </div>
                            <div className="space-y-2 md:col-span-2 lg:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Residencial Completo</label>
                                <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base focus:bg-white focus:border-indigo-500 shadow-inner outline-none uppercase transition-all" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="RUA, NÚMERO, BAIRRO, CIDADE/UF" />
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO 2: VÍNCULO HABITACIONAL */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 px-2 border-l-4 border-emerald-500 pl-4">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Vínculo Habitacional</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Cluster</label>
                                <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base focus:bg-white focus:border-indigo-500 shadow-inner outline-none uppercase transition-all" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="EX: BLOCO A 101" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Residente</label>
                                <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-[10px] uppercase shadow-inner appearance-none focus:bg-white focus:border-indigo-500 transition-all" value={formData.resident_type} onChange={e => setFormData({...formData, resident_type: e.target.value as ResidentType})}>
                                    <option value="TITULAR">Titular</option>
                                    <option value="DEPENDENTE">Dependente</option>
                                    <option value="INQUILINO">Inquilino</option>
                                    <option value="RESPONSAVEL">Responsável Legal</option>
                                    <option value="OCUPANTE">Ocupante</option>
                                </select>
                            </div>
                            <div className="flex items-end pb-2">
                                <label className="flex items-center gap-4 cursor-pointer group">
                                    <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${formData.voting_rights === 1 ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200 group-hover:border-indigo-300'}`} onClick={() => setFormData({...formData, voting_rights: formData.voting_rights === 1 ? 0 : 1})}>
                                        {formData.voting_rights === 1 && <ShieldCheck size={16} className="text-white" />}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Direito a Voto em Assembleia</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO 3: GOVERNANÇA & ACESSO */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 px-2 border-l-4 border-slate-900 pl-4">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Governança & Acesso</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Papel SRE</label>
                                <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-[10px] uppercase shadow-inner appearance-none focus:bg-white focus:border-indigo-500 transition-all" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado de Conta</label>
                                <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-[10px] uppercase shadow-inner appearance-none focus:bg-white focus:border-indigo-500 transition-all" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                                    <option value="ACTIVE">Ativo (Online)</option>
                                    <option value="PENDING">Pendente</option>
                                    <option value="SUSPENDED">Suspenso</option>
                                    <option value="BLOCKED">Bloqueado</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Chave (Opcional)</label>
                                <div className="relative">
                                    <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input type="password" className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO 4: CONTATO & COMUNICAÇÃO */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 px-2 border-l-4 border-emerald-600 pl-4">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Contato & Comunicação</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Principal</label>
                                <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-[11px] shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="SEU@EMAIL.COM" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone / Fixo</label>
                                <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="DDD + NÚMERO" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Bridge</label>
                                <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="DDD + NÚMERO" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Canal Preferencial</label>
                                <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-[10px] uppercase shadow-inner appearance-none focus:bg-white focus:border-indigo-500 transition-all" value={formData.preferred_channel} onChange={e => setFormData({...formData, preferred_channel: e.target.value as PreferredChannel})}>
                                    <option value="WHATSAPP">WhatsApp Messenger</option>
                                    <option value="EMAIL">E-mail Eletrônico</option>
                                    <option value="APP">App Mobile</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 bg-indigo-900/5 border border-indigo-100 rounded-[3rem] flex items-center gap-8 shadow-sm">
                        <div className="p-5 bg-white text-indigo-600 rounded-[1.5rem] shadow-sm"><Shield size={32}/></div>
                        <div>
                            <h4 className="text-base font-black text-indigo-950 uppercase tracking-tight">Handshake de Segurança SRE</h4>
                            <p className="text-[11px] text-indigo-700 font-bold uppercase mt-1.5 tracking-widest leading-relaxed">
                                Ao prosseguir, os dados serão vinculados ao Kernel S.I.E sob protocolo de integridade LGPD V240.2. 
                                A biometria facial servirá como chave única para acesso Vision ID em portarias físicas.
                            </p>
                        </div>
                    </div>

                    <button type="submit" disabled={isLoading} style={{ backgroundColor: primaryColor }} className="w-full py-8 text-white rounded-[2.5rem] font-black text-xs sm:text-sm uppercase tracking-[0.4em] shadow-2xl hover:brightness-110 transition-all flex items-center justify-center gap-6 active:scale-95 disabled:opacity-50">
                        {isLoading ? <Loader2 className="animate-spin" size={28}/> : <><UserCheck size={28}/> Comitar Identidade Digital</>}
                    </button>
                </form>
            </div>

            <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">S.I.E PRO KERNEL SECURITY SESSION • READY</span>
                </div>
                <button type="button" onClick={onClose} className="text-[10px] font-black text-slate-400 uppercase hover:text-slate-600 tracking-widest">Abortar</button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <style>{`
                @keyframes scan { 0% { transform: translateY(-30px); } 100% { transform: translateY(220px); } }
            `}</style>
        </div>
    );
};

export default CensusRegister;
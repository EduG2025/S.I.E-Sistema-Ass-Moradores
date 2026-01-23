import React, { useState, useEffect, useRef } from 'react';
import { User, FinancialRecord, FinancialStatus, SystemInfo, ResidentType, PreferredChannel } from '../types';
import { systemService, userService, financialService, aiService, api } from '../services/api';
import { formatCPF } from '../utils/cpf';
import { FINANCIAL_CATEGORIES, DEFAULT_SYSTEM_INFO } from '../constants';
import {
    Save, X, Loader2, Users, Info, Heart, Wallet, Brain, 
    User as UserIcon, Plus, Trash2, AlertCircle, Activity, Sparkles, TrendingUp, RefreshCw, 
    ArrowUpRight, ArrowDownLeft, Receipt, CheckCircle2, MessageCircle, Printer, Filter, Send, CreditCard, Calendar, Clock,
    Camera, ScanLine, RotateCcw, Upload, Image as ImageIcon, MapPin, Building, ShieldCheck, Zap, Fingerprint, Smartphone, Globe
} from 'lucide-react';
import SocialQuestionnaire from './SocialQuestionnaire';

interface UserModalProps {
    user: User;
    onClose: () => void;
    onSaveSuccess: () => void;
}

const UserModal = ({ user, onClose, onSaveSuccess }: UserModalProps) => {
    const [editingUser, setEditingUser] = useState<User>(user);
    const [activeTab, setActiveTab] = useState<'PERSONAL' | 'FAMILY' | 'SOCIAL' | 'FINANCIAL' | 'AI_DOSSIER'>('PERSONAL');
    const [isSaving, setIsSaving] = useState(false);
    const [tempPassword, setTempPassword] = useState('');
    const [roles, setRoles] = useState<any[]>([]);
    const [dependents, setDependents] = useState<User[]>([]);
    const [finRecords, setFinRecords] = useState<FinancialRecord[]>([]);
    const [aiDossier, setAiDossier] = useState<string>('');
    const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);
    const [isFinLoading, setIsFinLoading] = useState(false);
    const [systemInfo, setSystemInfo] = useState<SystemInfo>(DEFAULT_SYSTEM_INFO);
    
    const [isAddingFinance, setIsAddingFinance] = useState(false);

    // Camera States
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const isTempUser = String(user.id).startsWith('temp_');

    useEffect(() => { 
        loadCoreData();
        if (user.id && !isTempUser) {
            loadDependents();
            loadFinancials();
        }
    }, [user.id, isTempUser]);

    const loadCoreData = async () => {
        try {
            const [rolesRes, sysRes] = await Promise.all([
                systemService.getRoles(),
                systemService.getInfo()
            ]);
            setRoles(rolesRes.data.data || []);
            setSystemInfo(sysRes.data || DEFAULT_SYSTEM_INFO);
        } catch (e) { console.error("SRE Core Fail"); }
    };

    const loadDependents = async () => {
        try {
            const res = await userService.getDependents(user.id);
            setDependents(res.data.data || []);
        } catch (e) {}
    };

    const loadFinancials = async () => {
        setIsFinLoading(true);
        try {
            const res = await financialService.getAll({ user_id: user.id });
            setFinRecords(res.data.data || []);
        } catch (e) { console.error("Ledger Fail"); }
        finally { setIsFinLoading(false); }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (e) { alert("Hardware de vídeo indisponível para captura biométrica."); }
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
            setEditingUser({ ...editingUser, avatar_url: b64 });
            stopCamera();
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setEditingUser({ ...editingUser, avatar_url: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload: any = { ...editingUser };
            if (tempPassword.trim()) payload.password_hash = tempPassword;
            payload.cpf_cnpj = (payload.cpf_cnpj || '').replace(/\D/g, '');
            payload.active = payload.active ? 1 : 0;
            payload.voting_rights = payload.voting_rights ? 1 : 0;

            if (isTempUser) {
                const { id, ...clean } = payload;
                await userService.create(clean);
            } else {
                await userService.update(editingUser.id, payload);
            }
            onSaveSuccess();
        } catch (e) { 
            alert("Erro de Sincronia: Verifique se o CPF é único."); 
        }
        finally { setIsSaving(false); }
    };

    const handleDeleteFinance = async (id: string | number) => {
        if (!confirm("Remover este título permanentemente?")) return;
        try {
            await financialService.delete(id);
            loadFinancials();
        } catch (e) { alert("Falha ao remover."); }
    };

    const handleGenerateAiDossier = async () => {
        if (isTempUser) return;
        setIsGeneratingDossier(true);
        try {
            const res = await aiService.generateUserDossier(editingUser.id);
            setAiDossier(res.data.text);
        } catch (e) {
            alert("Erro ao gerar dossiê via IA.");
        } finally {
            setIsGeneratingDossier(false);
        }
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="sie-editor-overlay">
            <div className="sie-modal-container">
                <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/5">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-600 rounded-2xl shadow-2xl" style={{ backgroundColor: primaryColor }}><UserIcon size={24}/></div>
                        <div>
                            <h3 className="font-black text-2xl uppercase tracking-tighter leading-none">{editingUser.name || 'Nova Identidade Digital'}</h3>
                            <p className="text-indigo-400 text-[10px] font-black uppercase mt-2 tracking-[0.4em] opacity-80">{systemInfo.shortName} ID • PROTOCOLO {editingUser.role || 'RESIDENT'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleSave} disabled={isSaving} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-4 shadow-2xl active:scale-95 group" style={{ backgroundColor: primaryColor }}>
                            {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} {isTempUser ? 'Commitar Novo Membro' : 'Sincronizar Registro'}
                        </button>
                        <button onClick={onClose} className="p-4 hover:bg-rose-500 hover:text-white text-slate-400 rounded-2xl transition-all border border-white/5 ml-4"><X size={28}/></button>
                    </div>
                </div>

                <div className="flex bg-slate-50 p-2 border-b shrink-0 gap-2 overflow-x-auto custom-scrollbar">
                    {[
                        { id: 'PERSONAL', label: 'Cadastro Core', icon: Fingerprint },
                        { id: 'FAMILY', label: 'Hierarquia Familiar', icon: Users },
                        { id: 'SOCIAL', label: 'Dossiê Bioestatístico', icon: Heart },
                        { id: 'FINANCIAL', label: 'Ledger de Títulos', icon: Wallet },
                        { id: 'AI_DOSSIER', label: 'Advisor Mentor', icon: Brain }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[180px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-xl border border-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`} style={activeTab === tab.id ? { color: primaryColor } : {}}>
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fdfdfe]">
                    <div className="max-w-6xl mx-auto p-10 space-y-12 pb-20">
                        
                        {activeTab === 'PERSONAL' && (
                            <div className="animate-fade-in space-y-12">
                                {/* BLOCO 2: BIOMETRIA */}
                                <div className="flex flex-col md:flex-row items-center gap-12 bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 shadow-inner">
                                    <div className="relative group">
                                        <div className="w-56 h-56 rounded-[3rem] bg-slate-200 border-4 border-white shadow-2xl overflow-hidden relative flex items-center justify-center ring-4 ring-slate-100">
                                            {editingUser.avatar_url ? (
                                                <img src={editingUser.avatar_url} className="w-full h-full object-cover" />
                                            ) : cameraActive ? (
                                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-110" />
                                            ) : (
                                                <div className="text-center space-y-3">
                                                    <UserIcon size={80} className="text-slate-300 mx-auto" />
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sem Imagem</p>
                                                </div>
                                            )}
                                        </div>
                                        {cameraActive && (
                                            <button onClick={capturePhoto} className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-8 py-3 bg-indigo-600 text-white rounded-full font-black text-[9px] uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-indigo-500 transition-all border-4 border-white">
                                                <Camera size={16}/> Capturar
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-6 flex-1 text-center md:text-left">
                                        <div className="space-y-2">
                                            <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tightest">Handshake Biométrico</h4>
                                            <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-sm">Capture uma imagem frontal para autenticação Vision ID.</p>
                                        </div>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                            {!cameraActive ? (
                                                <button onClick={startCamera} className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-3">
                                                    <Camera size={20}/> Iniciar Câmera
                                                </button>
                                            ) : (
                                                <button onClick={stopCamera} className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all flex items-center gap-3"><X size={20}/> Encerrar</button>
                                            )}
                                            <label className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm cursor-pointer hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center gap-3">
                                                <Upload size={20}/> Upload
                                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* BLOCO 1: IDENTIFICAÇÃO CIVIL */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Identificação Civil</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div className="space-y-2 md:col-span-2 lg:col-span-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                            <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base focus:bg-white focus:border-indigo-500 shadow-inner outline-none uppercase transition-all" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF (Único)</label>
                                            <input className="w-full font-mono font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.cpf_cnpj || ''} onChange={e => setEditingUser({...editingUser, cpf_cnpj: formatCPF(e.target.value)})} maxLength={14} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                                            <input type="date" className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.birth_date ? editingUser.birth_date.slice(0,10) : ''} onChange={e => setEditingUser({...editingUser, birth_date: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RG</label>
                                            <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.rg || ''} onChange={e => setEditingUser({...editingUser, rg: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Emissor</label>
                                            <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase" value={editingUser.issuing_authority || ''} onChange={e => setEditingUser({...editingUser, issuing_authority: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gênero</label>
                                            <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm uppercase shadow-inner appearance-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.gender || ''} onChange={e => setEditingUser({...editingUser, gender: e.target.value as any})}>
                                                <option value="">Selecione...</option>
                                                <option value="MALE">Masculino</option>
                                                <option value="FEMALE">Feminino</option>
                                                <option value="OTHER">Outro</option>
                                                <option value="PREFER_NOT_TO_SAY">Prefiro não Informar</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profissão</label>
                                            <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base focus:bg-white focus:border-indigo-500 shadow-inner outline-none uppercase transition-all" value={editingUser.profession || ''} onChange={e => setEditingUser({...editingUser, profession: e.target.value})} />
                                        </div>
                                        <div className="space-y-2 md:col-span-2 lg:col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Residencial Completo</label>
                                            <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base focus:bg-white focus:border-indigo-500 shadow-inner outline-none uppercase transition-all" value={editingUser.address || ''} onChange={e => setEditingUser({...editingUser, address: e.target.value})} />
                                        </div>
                                    </div>
                                </div>

                                {/* BLOCO 3: VÍNCULO HABITACIONAL */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Vínculo Habitacional</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Cluster</label>
                                            <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base focus:bg-white focus:border-indigo-500 shadow-inner outline-none uppercase transition-all" value={editingUser.unit || ''} onChange={e => setEditingUser({...editingUser, unit: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Residente</label>
                                            <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm uppercase shadow-inner appearance-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.resident_type || 'TITULAR'} onChange={e => setEditingUser({...editingUser, resident_type: e.target.value as ResidentType})}>
                                                <option value="TITULAR">Titular</option>
                                                <option value="DEPENDENTE">Dependente</option>
                                                <option value="INQUILINO">Inquilino</option>
                                                <option value="RESPONSAVEL">Responsável Legal</option>
                                                <option value="OCUPANTE">Ocupante</option>
                                            </select>
                                        </div>
                                        <div className="flex items-end pb-2">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all" checked={!!editingUser.voting_rights} onChange={e => setEditingUser({...editingUser, voting_rights: e.target.checked ? 1 : 0})} />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Direito a Voto em Assembleia</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* BLOCO 4: GOVERNANÇA & ACESSO */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Governança & Acesso</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Papel SRE</label>
                                            <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm uppercase shadow-inner appearance-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.role || ''} onChange={e => setEditingUser({...editingUser, role: e.target.value})}>
                                                {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado de Conta</label>
                                            <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm uppercase shadow-inner appearance-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.status || ''} onChange={e => setEditingUser({...editingUser, status: e.target.value as any})}>
                                                <option value="ACTIVE">Ativo (Online)</option>
                                                <option value="PENDING">Pendente de Validação</option>
                                                <option value="SUSPENDED">Suspenso Temporariamente</option>
                                                <option value="BLOCKED">Bloqueado / Risco</option>
                                                <option value="ARCHIVED">Arquivado (Inativo)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Chave (Opcional)</label>
                                            <input type="password" className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={tempPassword} onChange={e => setTempPassword(e.target.value)} placeholder="••••••••" />
                                        </div>
                                    </div>
                                </div>

                                {/* BLOCO 5: CONTATO & COMUNICAÇÃO */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Contato & Comunicação</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                                            <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone / Fixo</label>
                                            <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Bridge</label>
                                            <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.whatsapp || ''} onChange={e => setEditingUser({...editingUser, whatsapp: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Canal Preferencial</label>
                                            <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm uppercase shadow-inner appearance-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.preferred_channel || 'WHATSAPP'} onChange={e => setEditingUser({...editingUser, preferred_channel: e.target.value as PreferredChannel})}>
                                                <option value="WHATSAPP">WhatsApp Messenger</option>
                                                <option value="EMAIL">E-mail Eletrônico</option>
                                                <option value="APP">App S.I.E Mobile</option>
                                                <option value="SMS">SMS Direto</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'SOCIAL' && (
                            <div className="animate-fade-in space-y-12">
                                <SocialQuestionnaire user={editingUser} onSave={(data) => setEditingUser({...editingUser, socialData: data})} onCancel={() => setActiveTab('PERSONAL')} />
                            </div>
                        )}

                        {activeTab === 'FINANCIAL' && (
                            <div className="animate-fade-in space-y-12">
                                <div className="bg-white border border-slate-200 rounded-[3.5rem] overflow-hidden shadow-sm">
                                    <div className="p-10 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-8">
                                        <h4 className="text-base font-black text-slate-800 uppercase tracking-widest flex items-center gap-4"><Wallet size={20} className="text-indigo-600" /> Ledger Individual</h4>
                                        <button onClick={() => setIsAddingFinance(!isAddingFinance)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-3 shadow-2xl active:scale-95">
                                            {isAddingFinance ? <X size={16}/> : <Plus size={16}/>} {isAddingFinance ? 'Abortar' : 'Novo Título'}
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-separate border-spacing-0">
                                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                                                <tr><th className="p-8">Identificação</th><th className="p-8 text-center">Protocolo</th><th className="p-8 text-center">Estado</th><th className="p-8 text-right">Montante</th><th className="p-8 text-right">Ações</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {finRecords.map(rec => (
                                                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="p-8"><p className="text-sm font-black text-slate-800 uppercase tracking-tight">{rec.description}</p></td>
                                                        <td className="p-8 text-center text-xs font-bold text-slate-500">{new Date(rec.date).toLocaleDateString('pt-BR')}</td>
                                                        <td className="p-8 text-center"><span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border shadow-sm ${rec.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{rec.status}</span></td>
                                                        <td className={`p-8 text-right font-black text-base ${rec.status === 'PAID' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {Number(rec.amount).toLocaleString('pt-BR')}</td>
                                                        <td className="p-8 text-right"><div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => handleDeleteFinance(rec.id)} className="p-3 text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={18}/></button></div></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'AI_DOSSIER' && (
                            <div className="animate-fade-in space-y-10">
                                <div className="p-16 bg-slate-900 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12 border border-white/5">
                                    <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none transform rotate-12 scale-125"><Brain size={280}/></div>
                                    <div className="relative z-10 space-y-6">
                                        <h3 className="text-5xl font-black tracking-tightest uppercase leading-tight">Analista de <br/>Perfil Mentor.</h3>
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm uppercase italic opacity-80">Geração de dossiê preditivo baseado em histórico de participação, adimplência e comportamento social.</p>
                                    </div>
                                    <button onClick={handleGenerateAiDossier} disabled={isGeneratingDossier || isTempUser} className={`px-14 py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center gap-6 transition-all active:scale-95 ${isTempUser ? 'bg-slate-700 opacity-50' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
                                        {isGeneratingDossier ? <Loader2 className="animate-spin" size={28}/> : <Brain size={28}/>} {isGeneratingDossier ? 'Processando...' : 'Gerar Dossiê'}
                                    </button>
                                </div>
                                {aiDossier && (
                                    <div className="bg-white border border-slate-200 rounded-[4rem] p-20 shadow-inner relative overflow-hidden animate-slide-up">
                                        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
                                        <p className="font-serif text-2xl leading-[1.8] text-slate-800 uppercase tracking-tight whitespace-pre-wrap">{aiDossier}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">SRE Kernel Identity Management Session Active</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-10 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600">Fechar</button>
                        <button onClick={handleSave} className="px-14 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">Commitar Mudanças</button>
                    </div>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default UserModal;
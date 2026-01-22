import React, { useState, useEffect, useRef } from 'react';
import { User, FinancialRecord, FinancialStatus, SystemInfo } from '../types';
import { systemService, userService, financialService, aiService, communicationService, api } from '../services/api';
import { formatCPF, formatCEP } from '../utils/cpf';
import { FINANCIAL_CATEGORIES, DEFAULT_SYSTEM_INFO } from '../constants';
import {
    Save, X, Loader2, Users, Info, Heart, Wallet, Brain, 
    User as UserIcon, Plus, Trash2, AlertCircle, Activity, Sparkles, TrendingUp, RefreshCw, 
    ArrowUpRight, ArrowDownLeft, Receipt, CheckCircle2, MessageCircle, Printer, Filter, Send, CreditCard, Calendar, Clock,
    Camera, ScanLine, RotateCcw, Upload, Image as ImageIcon, MapPin, Building, ShieldCheck, Zap
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
    
    // Camera States
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const [finFilter, setFinFilter] = useState<'ALL' | FinancialStatus>('ALL');

    const [isAddingFinance, setIsAddingFinance] = useState(false);
    const [newRecord, setNewRecord] = useState<Partial<FinancialRecord>>({
        description: '', 
        amount: '', 
        type: 'INCOME', 
        category: 'CONDOMÍNIO', 
        date: new Date().toISOString().slice(0, 10), 
        status: 'PENDING',
        is_recurring: 0
    });

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

    const handleSaveFinance = async () => {
        if (!newRecord.description || !newRecord.amount) return alert("Erro: Identificação e Valor são obrigatórios.");
        setIsSaving(true);
        try {
            await financialService.create({ ...newRecord, user_id: user.id });
            setIsAddingFinance(false);
            setNewRecord({ description: '', amount: '', type: 'INCOME', category: 'CONDOMÍNIO', date: new Date().toISOString().slice(0, 10), status: 'PENDING', is_recurring: 0 });
            await loadFinancials();
        } catch (e) { alert("🛑 Falha crítica ao comitar lançamento no Ledger."); }
        finally { setIsSaving(false); }
    };

    const handleConfirmPayment = async (id: number | string) => {
        try {
            await financialService.update(id, { status: 'PAID' });
            loadFinancials();
        } catch (e) { alert("Falha ao liquidar título financeiro."); }
    };

    const handleDeleteFinance = async (id: number | string) => {
        if (!confirm("Excluir este lançamento permanentemente do Ledger? Ação irreversível.")) return;
        try {
            await financialService.delete(id);
            loadFinancials();
        } catch (e) { alert("Erro ao remover registro financeiro."); }
    };

    const handleSendReminder = async (rec: FinancialRecord) => {
        try {
            await api.post('/communication/whatsapp-broadcast', {
                message: `Olá {nome}, identificamos uma pendência no valor de R$ ${Number(rec.amount).toLocaleString('pt-BR')} referente a "${rec.description}". Por favor, regularize assim que possível.`,
                targetType: 'USER',
                userId: user.id,
                footer: systemInfo?.whatsapp_config?.footer || systemInfo?.shortName
            });
            alert("✅ Cobrança enviada via WhatsApp Bridge.");
        } catch (e) {
            console.error("Failed to send reminder:", e);
            alert("Falha ao disparar cobrança. Verifique as configurações do Gateway.");
        }
    };

    const handleGenerateAiDossier = async () => {
        if (isTempUser) return alert("SRE: Salve o cadastro antes de gerar o dossiê neural.");
        setIsGeneratingDossier(true);
        try {
            const res = await aiService.generateUserDossier(user.id);
            setAiDossier(res.data.text || 'O Kernel Mentor não retornou dados para este perfil.');
        } catch (e) { alert("Falha crítica no motor de inteligência Advisor."); } 
        finally { setIsGeneratingDossier(false); }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload: any = { ...editingUser };
            if (tempPassword.trim()) payload.password = tempPassword;
            
            // Sanitização de CPF antes do envio
            payload.cpf_cnpj = (payload.cpf_cnpj || '').replace(/\D/g, '');

            if (isTempUser) {
                const { id, ...clean } = payload;
                await userService.create(clean);
            } else {
                await userService.update(editingUser.id, payload);
            }
            onSaveSuccess();
        } catch (e) { 
            console.error(e);
            alert("Erro de Sincronia: Verifique se o CPF é único."); 
        }
        finally { setIsSaving(false); }
    };

    const filteredRecords = finRecords.filter(r => finFilter === 'ALL' || r.status === finFilter);
    const totalPaid = finRecords.filter(r => r.status === 'PAID').reduce((acc, r) => acc + Number(r.amount), 0);
    const totalPending = finRecords.filter(r => r.status === 'PENDING' || r.status === 'OVERDUE').reduce((acc, r) => acc + Number(r.amount), 0);

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="sie-editor-overlay">
            <div className="sie-modal-container">
                {/* HEADER SOBERANO - IDENTIDADE DO MEMBRO */}
                <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/5">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-600 rounded-2xl shadow-2xl" style={{ backgroundColor: primaryColor }}><UserIcon size={24}/></div>
                        <div>
                            <h3 className="font-black text-2xl uppercase tracking-tighter leading-none">{editingUser.name || 'Nova Identidade Digital'}</h3>
                            <p className="text-indigo-400 text-[10px] font-black uppercase mt-2 tracking-[0.4em] opacity-80">{systemInfo.shortName} ID • PROTOCOLO {editingUser.role || 'RESIDENT'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border mr-4 ${isTempUser ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                             <div className={`w-2 h-2 rounded-full animate-pulse ${isTempUser ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                             <span className={`text-[8px] font-black uppercase tracking-widest ${isTempUser ? 'text-amber-400' : 'text-emerald-400'}`}>{isTempUser ? 'Registro Pendente de Commit' : 'Cadastro Sincronizado'}</span>
                        </div>
                        <button onClick={handleSave} disabled={isSaving} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-4 shadow-2xl active:scale-95 group" style={{ backgroundColor: primaryColor }}>
                            {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} className="group-hover:scale-110 transition-transform" />} {isTempUser ? 'Commitar Novo Membro' : 'Sincronizar Registro'}
                        </button>
                        <button onClick={onClose} className="p-4 hover:bg-rose-500 hover:text-white text-slate-400 rounded-2xl transition-all border border-white/5 ml-4"><X size={28}/></button>
                    </div>
                </div>

                {/* NAVEGAÇÃO DE DOSSIÊ */}
                <div className="flex bg-slate-50 p-2 border-b shrink-0 gap-2 overflow-x-auto custom-scrollbar">
                    {[
                        { id: 'PERSONAL', label: 'Cadastro Core', icon: Info },
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

                {/* ÁREA DE TRABALHO - CONTEÚDO DINÂMICO */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fdfdfe]">
                    <div className="max-w-6xl mx-auto p-10 space-y-12 pb-20">
                        
                        {activeTab === 'PERSONAL' && (
                            <div className="animate-fade-in space-y-12">
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
                                            <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-sm">Capture ou carregue uma imagem frontal para autenticação Vision e Crachá Digital.</p>
                                        </div>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                            {!cameraActive ? (
                                                <button onClick={startCamera} className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-3">
                                                    <Camera size={20}/> Iniciar Câmera
                                                </button>
                                            ) : (
                                                <button onClick={stopCamera} className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all flex items-center gap-3"><X size={20}/> Encerrar Lente</button>
                                            )}
                                            <label className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm cursor-pointer hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center gap-3">
                                                <Upload size={20}/> Upload Ficha
                                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome de Batismo / Completo</label>
                                        <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 text-xl focus:bg-white focus:border-indigo-500 shadow-inner outline-none uppercase transition-all" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil Hierárquico</label>
                                        <select className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 text-sm uppercase shadow-inner appearance-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})}>
                                            {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF (Documento Digital)</label>
                                        <input className="w-full font-mono font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 text-xl shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.cpf_cnpj} onChange={e => setEditingUser({...editingUser, cpf_cnpj: formatCPF(e.target.value)})} maxLength={14} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RG (Registro Geral)</label>
                                        <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 text-xl shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.rg || ''} onChange={e => setEditingUser({...editingUser, rg: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Órgão Emissor</label>
                                        <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 text-xl shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase" value={editingUser.issuing_authority || ''} onChange={e => setEditingUser({...editingUser, issuing_authority: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade Habitacional / Cluster</label>
                                        <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 text-xl uppercase shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.unit} onChange={e => setEditingUser({...editingUser, unit: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Idade Cronológica</label>
                                        <input type="number" className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 text-xl shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.age || ''} onChange={e => setEditingUser({...editingUser, age: parseInt(e.target.value)})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Canal WhatsApp Bridge</label>
                                        <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 text-lg shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} placeholder="Ex: 11999998888" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'SOCIAL' && (
                            <div className="animate-fade-in space-y-12">
                                <div className="p-10 bg-indigo-50 border border-indigo-100 rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
                                    <div className="flex items-center gap-6">
                                        <div className="p-5 bg-white text-indigo-600 rounded-[2rem] shadow-md" style={{ color: primaryColor }}><Heart size={32}/></div>
                                        <div>
                                            <h4 className="text-2xl font-black text-indigo-950 uppercase tracking-tight">Handshake Social SRE</h4>
                                            <p className="text-[10px] text-indigo-700 font-bold uppercase mt-1 tracking-widest leading-relaxed">
                                                Sincronização reativa com o Ledger de Censos. <br/> 
                                                Dados extraídos via motor de Inteligência Territorial.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 px-6 py-3 bg-white/50 border border-indigo-200 rounded-2xl">
                                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                                        <span className="text-[9px] font-black text-indigo-900 uppercase tracking-widest">Ledger Sync: Active</span>
                                    </div>
                                </div>
                                <SocialQuestionnaire user={editingUser} onSave={(data) => setEditingUser({...editingUser, socialData: data})} onCancel={() => setActiveTab('PERSONAL')} />
                            </div>
                        )}

                        {activeTab === 'FINANCIAL' && (
                            <div className="animate-fade-in space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex items-center gap-8 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp size={100}/></div>
                                        <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[2rem] shadow-inner"><ArrowUpRight size={32}/></div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Liquidado</p>
                                            <h4 className="text-3xl font-black text-slate-800">R$ {totalPaid.toLocaleString('pt-BR')}</h4>
                                        </div>
                                    </div>
                                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex items-center gap-8 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><AlertCircle size={100}/></div>
                                        <div className="p-5 bg-rose-50 text-rose-600 rounded-[2rem] shadow-inner"><ArrowDownLeft size={32}/></div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Saldo em Aberto</p>
                                            <h4 className="text-3xl font-black text-rose-600">R$ {totalPending.toLocaleString('pt-BR')}</h4>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-[3.5rem] overflow-hidden shadow-sm">
                                    <div className="p-10 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-8">
                                        <h4 className="text-base font-black text-slate-800 uppercase tracking-widest flex items-center gap-4"><Wallet size={20} className="text-indigo-600" style={{ color: primaryColor }}/> Ledger Individual de Membro</h4>
                                        <button onClick={() => setIsAddingFinance(!isAddingFinance)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-3 shadow-2xl group active:scale-95">
                                            {isAddingFinance ? <X size={16}/> : <Plus size={16} className="group-hover:rotate-90 transition-transform" />} {isAddingFinance ? 'Abortar Protocolo' : 'Novo Lançamento'}
                                        </button>
                                    </div>
                                    
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-separate border-spacing-0">
                                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                                                <tr><th className="p-8">Identificação</th><th className="p-8 text-center">Data Protocolo</th><th className="p-8 text-center">Estado</th><th className="p-8 text-right">Montante</th><th className="p-8 text-right">Ações</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredRecords.map(rec => (
                                                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors group">
                                                        <td className="p-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`p-3 rounded-xl ${rec.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><Receipt size={18}/></div>
                                                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{rec.description}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-8 text-center text-xs font-bold text-slate-500 uppercase">{new Date(rec.date).toLocaleDateString('pt-BR')}</td>
                                                        <td className="p-8 text-center"><span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border shadow-sm ${rec.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{rec.status}</span></td>
                                                        <td className={`p-8 text-right font-black text-base ${rec.status === 'PAID' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {Number(rec.amount).toLocaleString('pt-BR')}</td>
                                                        <td className="p-8 text-right">
                                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                                {rec.status === 'PENDING' && (
                                                                    <>
                                                                        <button onClick={() => handleConfirmPayment(rec.id)} className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg hover:bg-emerald-400 transition-all" title="Liquidar Título"><CheckCircle2 size={18}/></button>
                                                                        <button onClick={() => handleSendReminder(rec)} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-500 transition-all" title="Enviar Cobrança Ativa"><MessageCircle size={18}/></button>
                                                                    </>
                                                                )}
                                                                <button onClick={() => handleDeleteFinance(rec.id)} className="p-3 text-slate-300 hover:text-rose-600 transition-all hover:bg-white rounded-xl border border-transparent hover:border-rose-100"><Trash2 size={18}/></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredRecords.length === 0 && (
                                                    <tr><td colSpan={5} className="p-24 text-center text-slate-300 font-black uppercase text-xs tracking-widest italic opacity-40">Nenhum título protocolado no Ledger deste membro.</td></tr>
                                                )}
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
                                        <div className="flex items-center gap-4 px-6 py-2 bg-indigo-500/10 rounded-full w-fit border border-indigo-500/20 backdrop-blur-md">
                                            <Zap size={18} className="text-indigo-400 animate-pulse"/>
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">SRE Neural Analyst Core</span>
                                        </div>
                                        <h3 className="text-5xl font-black tracking-tightest uppercase leading-tight">Analista de <br/>Perfil Mentor.</h3>
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm uppercase italic opacity-80">Geração de dossiê preditivo baseado em histórico de participação, adimplência e comportamento social.</p>
                                    </div>
                                    <div className="relative z-10 group">
                                        {isTempUser && (
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 bg-amber-500 text-slate-950 p-2 rounded-lg text-[8px] font-black uppercase text-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                Salve o cadastro antes de prosseguir
                                            </div>
                                        )}
                                        <button onClick={handleGenerateAiDossier} disabled={isGeneratingDossier || isTempUser} className={`px-14 py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center gap-6 transition-all active:scale-95 ${isTempUser ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
                                            {isGeneratingDossier ? <Loader2 className="animate-spin" size={28}/> : <Brain size={28}/>} {isGeneratingDossier ? 'Processando Matriz...' : 'Gerar Dossiê Neural'}
                                        </button>
                                    </div>
                                </div>
                                
                                {aiDossier && (
                                    <div className="bg-white border border-slate-200 rounded-[4rem] p-20 shadow-inner relative overflow-hidden animate-slide-up">
                                        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" style={{ backgroundColor: primaryColor }}></div>
                                        <div className="flex justify-between items-start mb-12 border-b border-slate-100 pb-8">
                                            <h5 className="text-base font-black text-slate-900 uppercase tracking-widest flex items-center gap-4"><ShieldCheck size={24} className="text-emerald-500"/> Relatório de Solvência & Risco</h5>
                                            <button onClick={() => window.print()} className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all border border-slate-100"><Printer size={20}/></button>
                                        </div>
                                        <p className="font-serif text-2xl leading-[1.8] text-slate-800 uppercase tracking-tight whitespace-pre-wrap selection:bg-indigo-100">
                                            {aiDossier}
                                        </p>
                                        <div className="mt-16 pt-10 border-t border-slate-100 flex items-center justify-between opacity-40">
                                            <span className="text-[10px] font-black uppercase tracking-widest">S.I.E Neural Architecture V6.0</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest">ID Auditoria: {Date.now()}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER DE ESTADO - PROTOCOLO SRE */}
                <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">SRE Kernel Identity Management Session Active • Secure Handshake OK</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-10 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Fechar Terminal</button>
                        <button onClick={handleSave} className="px-14 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">Commitar Mudanças</button>
                    </div>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default UserModal;

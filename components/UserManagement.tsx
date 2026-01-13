
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AVAILABLE_ROLES } from '../constants';
import { User, FinancialRecord } from '../types';
import { userService, financialService, aiService } from '../services/api';
import { formatCPF } from '../utils/cpf';
import {
    Save, Search, Edit2, X, Plus, Loader2, Users,
    Shield, Info, Heart, Wallet, Brain, Camera, ArrowUpRight, ArrowDownLeft, Receipt,
    Upload, User as UserIcon, Phone, Fingerprint, Trash2, Sparkles, FileText
} from 'lucide-react';
import SocialQuestionnaire from './SocialQuestionnaire';
import OCRScanner from './OCRScanner';

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<'PERSONAL' | 'SOCIAL' | 'FINANCIAL' | 'AI_DOSSIER'>('PERSONAL');
    const [showOCR, setShowOCR] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);

    const [dossierResult, setDossierResult] = useState<string | null>(null);
    const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [userFinances, setUserFinances] = useState<FinancialRecord[]>([]);
    const [isLoadingFinances, setIsLoadingFinances] = useState(false);

    const loadUsers = useCallback(async (page: number, searchTerm: string = '') => {
        setIsLoading(true);
        try {
            const res = await userService.getAll(page, 50, searchTerm);
            setUsers(res.data.data || []);
            setPagination(res.data.pagination || { page: 1, total: 0, pages: 1 });
        } finally { setIsLoading(false); }
    }, []);

    useEffect(() => { loadUsers(pagination.page, search); }, [pagination.page, search, loadUsers]);

    useEffect(() => {
        const loadIndividualFinances = async () => {
            if (editingUser && activeTab === 'FINANCIAL') {
                setIsLoadingFinances(true);
                try {
                    const res = await financialService.getAll({ user_id: editingUser.id });
                    setUserFinances(res.data.data || []);
                } catch (e) { setUserFinances([]); } 
                finally { setIsLoadingFinances(false); }
            }
        };
        loadIndividualFinances();
    }, [editingUser, activeTab]);

    const handleGenerateDossier = async () => {
        if (!editingUser) return;
        setIsGeneratingDossier(true);
        try {
            const res = await aiService.generateUserDossier(editingUser.id);
            setDossierResult(res.data.text);
        } catch (e) { alert("⚠️ Falha ao consultar rede neural."); } 
        finally { setIsGeneratingDossier(false); }
    };

    const handleSave = async () => {
        if (!editingUser) return;
        setIsSaving(true);
        try {
            const payload = { ...editingUser };
            if (typeof editingUser.id === 'string' && editingUser.id.startsWith('temp_')) {
                const { id, ...clean } = payload; await userService.create(clean);
            } else { await userService.update(editingUser.id, payload); }
            setEditingUser(null); 
            loadUsers(pagination.page, search);
            alert("✅ Registro sincronizado com sucesso.");
        } catch (e) { alert("Falha na sincronização do Kernel."); } 
        finally { setIsSaving(false); }
    };

    const startCamera = async () => {
        setIsCameraActive(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (e) { alert("Acesso à câmera negado."); setIsCameraActive(false); }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current && editingUser) {
            const ctx = canvasRef.current.getContext('2d');
            canvasRef.current.width = 400; canvasRef.current.height = 400;
            ctx?.drawImage(videoRef.current, 0, 0, 400, 400);
            const b64 = canvasRef.current.toDataURL('image/jpeg');
            setEditingUser({ ...editingUser, avatar_url: b64 });
            stopCamera();
        }
    };

    const stopCamera = () => {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(t => t.stop());
        setIsCameraActive(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editingUser) {
            const reader = new FileReader();
            reader.onloadend = () => { setEditingUser({ ...editingUser, avatar_url: reader.result as string }); };
            reader.readAsDataURL(file);
        }
    };

    const totalDevedor = userFinances
        .filter(r => r.status !== 'PAID' && r.type === 'INCOME')
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-fade-in h-full relative">
            <div className="flex flex-row justify-between items-center bg-slate-900 p-4 rounded-2xl text-white shadow-lg shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg"><Users size={18}/></div>
                    <div>
                        <h2 className="text-base font-black tracking-tight uppercase leading-none">Gestão de Identidade</h2>
                        <p className="text-indigo-400 text-[8px] font-black uppercase tracking-widest mt-1">Base Biométrica S.I.E</p>
                    </div>
                </div>
                <button onClick={() => { setEditingUser({ id: `temp_${Date.now()}`, name: '', role: 'RESIDENT', status: 'ACTIVE', active: 1, cpf_cnpj: '', username: '', phone: '', email: '', unit: '', rg: '' } as any); setActiveTab('PERSONAL'); setDossierResult(null); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg"><Plus size={14} /> Novo Membro</button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="p-3 border-b bg-slate-50/30 shrink-0">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <input type="text" placeholder="Filtrar por nome, CPF ou unidade..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 h-10 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-inner" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10">
                            <tr className="bg-white/90 backdrop-blur-md">
                                <th className="p-4">Perfil</th>
                                <th className="p-4">CPF / Contato</th>
                                <th className="p-4 text-center">Papel</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" /></td></tr> : users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center">
                                                    {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <UserIcon size={20} className="text-slate-300" />}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${user.active ? 'bg-emerald-50' : 'bg-slate-300'}`} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-800 truncate max-w-[200px]">{user.name}</p>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase">Unid. {user.unit || '---'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-[10px] font-bold text-slate-600 font-mono">{user.cpf_cnpj}</p>
                                        <p className="text-[8px] text-slate-400 font-bold">{user.phone || user.email || 'Sem contato'}</p>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-[9px] font-black uppercase text-indigo-600 px-2 py-1 bg-indigo-50 rounded-lg">{user.role}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{user.status}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => { setEditingUser(user); setActiveTab('PERSONAL'); setDossierResult(null); }} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 size={14}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingUser && (
                <div className="sie-editor-overlay">
                    <div className="h-16 px-6 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-lg relative z-20">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg"><Shield size={18} className="text-white"/></div>
                            <div>
                                <h3 className="font-black text-[11px] uppercase tracking-[0.1em] leading-none">Editor de Registro</h3>
                                <p className="text-indigo-400 text-[7px] font-black uppercase mt-1 tracking-widest">Protocolo Alpha V5.2</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl active:scale-95">
                                {isSaving ? <Loader2 className="animate-spin" size={12}/> : <Save size={12}/>} Sincronizar
                            </button>
                            <button onClick={() => { setEditingUser(null); setIsCameraActive(false); }} className="p-2 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={20} /></button>
                        </div>
                    </div>

                    <div className="flex bg-slate-100/50 p-1 border-b shrink-0 overflow-x-auto relative z-10">
                        {[ 
                            { id: 'PERSONAL', label: 'Dados', icon: Info }, 
                            { id: 'SOCIAL', label: 'Social', icon: Heart }, 
                            { id: 'FINANCIAL', label: 'Financeiro', icon: Wallet }, 
                            { id: 'AI_DOSSIER', label: 'Neural', icon: Brain }
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[80px] py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><tab.icon size={12} /> {tab.label}</button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar bg-white">
                        <div className="max-w-[1200px] mx-auto pb-10">
                            {activeTab === 'PERSONAL' && (
                                <div className="space-y-12 animate-fade-in">
                                    <div className="flex flex-col lg:flex-row gap-10 items-start">
                                        <div className="bg-slate-50 p-6 rounded-[3rem] border border-slate-200 shadow-inner flex flex-col items-center gap-6 relative overflow-hidden shrink-0 w-full lg:w-72">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600" />
                                            <div className="relative group">
                                                <div className="w-48 h-48 rounded-[3rem] overflow-hidden border-4 border-white shadow-xl bg-white flex items-center justify-center group-hover:border-indigo-50 transition-all">
                                                    {isCameraActive ? (
                                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale" />
                                                    ) : editingUser.avatar_url ? (
                                                        <img src={editingUser.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserIcon size={64} className="text-slate-100" />
                                                    )}
                                                </div>
                                                {!isCameraActive && (
                                                    <div className="absolute -bottom-4 -right-4 flex gap-2">
                                                        <label className="p-3.5 bg-indigo-600 text-white rounded-2xl shadow-xl cursor-pointer hover:bg-indigo-700 transition-all">
                                                            <Upload size={18} />
                                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                                        </label>
                                                        <button onClick={startCamera} className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-indigo-600 transition-all">
                                                            <Camera size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {isCameraActive ? (
                                                <div className="flex flex-col gap-2 w-full">
                                                    <button onClick={capturePhoto} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md">Capturar</button>
                                                    <button onClick={stopCamera} className="w-full py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md">Cancelar</button>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">Biometria SRE</h4>
                                                    <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest">Ativa no Cluster</p>
                                                </div>
                                            )}
                                            <canvas ref={canvasRef} className="hidden" />
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.1em] flex items-center gap-2"><UserIcon size={12}/> Nome Completo</label>
                                                <input className="w-full font-black h-14 bg-slate-50 border-slate-200 rounded-2xl px-6 text-xl shadow-inner focus:bg-white focus:border-indigo-500" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.1em] flex items-center gap-2"><Fingerprint size={12}/> CPF</label>
                                                <input className="w-full font-mono font-black h-12 bg-slate-50 border-slate-200 rounded-xl px-6 text-base shadow-inner" value={editingUser.cpf_cnpj} onChange={e => setEditingUser({...editingUser, cpf_cnpj: formatCPF(e.target.value)})} maxLength={18} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.1em] flex items-center gap-2"><Info size={12}/> RG</label>
                                                <input className="w-full font-mono font-black h-12 bg-slate-50 border-slate-200 rounded-xl px-6 text-base shadow-inner" value={editingUser.rg} onChange={e => setEditingUser({...editingUser, rg: e.target.value})} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.1em] flex items-center gap-2"><Phone size={12}/> Contato</label>
                                                <input className="w-full font-black h-12 bg-slate-50 border-slate-200 rounded-xl px-6 text-base shadow-inner" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.1em] flex items-center gap-2"><Shield size={12}/> Cargo</label>
                                                <select className="w-full font-black h-12 bg-slate-50 border-slate-200 rounded-xl px-6 text-xs shadow-inner appearance-none uppercase" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})}>
                                                    {AVAILABLE_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50/50 p-8 rounded-[3rem] border-2 border-dashed border-indigo-100 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-6">
                                            <div className="p-4 bg-white text-indigo-600 rounded-2xl shadow-md"><Brain size={32}/></div>
                                            <div>
                                                <p className="text-lg font-black text-indigo-950 uppercase tracking-tight">Vision Assist</p>
                                                <p className="text-[9px] text-indigo-400 font-bold uppercase mt-1 tracking-widest">Extração neural via documento oficial</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowOCR(true)} className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl active:scale-95">Scanner Vision</button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'SOCIAL' && <SocialQuestionnaire user={editingUser} onSave={(data) => setEditingUser({...editingUser, socialData: data})} onCancel={() => setEditingUser(null)} />}
                            
                            {activeTab === 'FINANCIAL' && (
                                <div className="space-y-12 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-center min-h-[160px]">
                                            <div className="absolute top-0 right-0 p-6 opacity-5"><Receipt size={80}/></div>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400 mb-2">Solvência</p>
                                            <h4 className={`text-3xl font-black tracking-tightest ${totalDevedor > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {totalDevedor > 0 ? 'DÉBITO ATIVO' : 'REGULAR'}
                                            </h4>
                                        </div>
                                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 shadow-inner flex flex-col justify-center min-h-[160px]">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Devedor</p>
                                            <h4 className="text-3xl font-black text-rose-600 tracking-tightest">R$ {totalDevedor.toLocaleString('pt-BR')}</h4>
                                        </div>
                                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 shadow-inner flex flex-col justify-center min-h-[160px]">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Títulos</p>
                                            <h4 className="text-3xl font-black text-slate-800 tracking-tightest">{userFinances.length}</h4>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
                                        <div className="p-6 border-b bg-slate-50/50">
                                            <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-600">Extrato Membro</h4>
                                        </div>
                                        {isLoadingFinances ? (
                                            <div className="p-10 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32}/></div>
                                        ) : (
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                                                    <tr><th className="p-6">Descrição</th><th className="p-6 text-right">R$</th></tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {userFinances.map(r => (
                                                        <tr key={r.id} className="hover:bg-slate-50">
                                                            <td className="p-6">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`p-2 rounded-lg ${r.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                        {r.type === 'INCOME' ? <ArrowUpRight size={14}/> : <ArrowDownLeft size={14}/>}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-black text-slate-800 text-xs">{r.description}</p>
                                                                        <p className="text-[8px] text-slate-400 font-bold uppercase">{new Date(r.date).toLocaleDateString('pt-BR')}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className={`p-6 text-right font-black text-sm ${r.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {Number(r.amount).toLocaleString('pt-BR')}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'AI_DOSSIER' && (
                                <div className="space-y-12 animate-fade-in">
                                    <div className="bg-slate-950 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden border border-white/5">
                                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                                        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                                            <div className="flex items-center gap-6">
                                                <div className="p-5 bg-indigo-600 rounded-2xl shadow-xl animate-pulse"><Brain size={32} /></div>
                                                <div>
                                                    <h4 className="text-xl font-black uppercase tracking-tightest leading-none">Advisor Neural</h4>
                                                    <p className="text-[8px] text-indigo-300 font-black uppercase tracking-widest mt-2">Motor Preditivo SRE</p>
                                                </div>
                                            </div>
                                            <button onClick={handleGenerateDossier} disabled={isGeneratingDossier} className="px-10 py-4 bg-white text-indigo-950 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50">
                                                {isGeneratingDossier ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                                                {isGeneratingDossier ? 'Processando...' : 'Gerar Dossiê'}
                                            </button>
                                        </div>
                                    </div>

                                    {dossierResult && (
                                        <div className="bg-slate-50 border-2 border-white rounded-[3rem] shadow-sm p-10 animate-fade-in relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-20" />
                                            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-indigo-100">
                                                <FileText size={24} className="text-indigo-600"/>
                                                <h5 className="font-black text-slate-800 uppercase text-sm tracking-widest">Relatório Analítico SRE</h5>
                                            </div>
                                            <div className="prose prose-indigo max-w-none prose-p:text-sm prose-p:leading-relaxed prose-headings:font-black prose-headings:uppercase prose-headings:text-slate-950">
                                                <div className="whitespace-pre-wrap font-medium text-slate-700 leading-relaxed text-sm">
                                                    {dossierResult}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {showOCR && (
                <OCRScanner 
                    context="IDENTITY" 
                    title="Capturar Dados Vision Neural" 
                    onResult={(data) => setEditingUser({ ...editingUser!, name: data.nome || editingUser!.name, cpf_cnpj: data.cpf || editingUser!.cpf_cnpj, rg: data.rg || editingUser!.rg })} 
                    onClose={() => setShowOCR(false)} 
                />
            )}
        </div>
    );
};

export default UserManagement;


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
                                                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${user.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
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
                <div className="sie-editor-overlay md:left-[15vw]">
                    <div className="h-16 px-6 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-lg relative z-20">
                        <div className="flex items-center gap-3">
                            <Shield size={18} className="text-indigo-400"/>
                            <h3 className="font-black text-xs uppercase tracking-widest">Editor de Registro Mestre</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleSave} disabled={isSaving} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg">
                                {isSaving ? <Loader2 className="animate-spin" size={12}/> : <Save size={14}/>} Sincronizar
                            </button>
                            <button onClick={() => { setEditingUser(null); setIsCameraActive(false); }} className="p-2 text-slate-400 hover:text-rose-400 transition-all ml-2"><X size={28} /></button>
                        </div>
                    </div>

                    <div className="flex bg-slate-50 p-1 border-b shrink-0 overflow-x-auto relative z-10">
                        {[ 
                            { id: 'PERSONAL', label: 'Dados Cadastrais', icon: Info }, 
                            { id: 'SOCIAL', label: 'Vulnerabilidade', icon: Heart }, 
                            { id: 'FINANCIAL', label: 'Histórico Financeiro', icon: Wallet }, 
                            { id: 'AI_DOSSIER', label: 'Relatório Neural', icon: Brain }
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[150px] py-4 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><tab.icon size={14} /> {tab.label}</button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar bg-[#fcfcfd]">
                        <div className="max-w-6xl mx-auto pb-10">
                            {activeTab === 'PERSONAL' && (
                                <div className="space-y-10 animate-fade-in">
                                    <div className="flex flex-col lg:flex-row gap-12 items-start">
                                        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col items-center gap-6 relative overflow-hidden shrink-0 w-full lg:w-72">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600" />
                                            <div className="relative group">
                                                <div className="w-48 h-48 rounded-[3rem] overflow-hidden border-4 border-slate-50 shadow-xl bg-slate-100 flex items-center justify-center group-hover:border-indigo-100 transition-all">
                                                    {isCameraActive ? (
                                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale" />
                                                    ) : editingUser.avatar_url ? (
                                                        <img src={editingUser.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserIcon size={64} className="text-slate-200" />
                                                    )}
                                                </div>
                                                {!isCameraActive && (
                                                    <div className="absolute -bottom-3 -right-3 flex gap-2">
                                                        <label className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl cursor-pointer hover:bg-indigo-700 transition-all">
                                                            <Upload size={18} />
                                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                                        </label>
                                                        <button onClick={startCamera} className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-indigo-600 transition-all">
                                                            <Camera size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {isCameraActive ? (
                                                <div className="flex flex-col gap-2 w-full">
                                                    <button onClick={capturePhoto} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg">Capturar Biometria</button>
                                                    <button onClick={stopCamera} className="w-full py-3 bg-rose-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg">Cancelar</button>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">Biometria Ativa</h4>
                                                    <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Identificação Digital do Cluster</p>
                                                </div>
                                            )}
                                            <canvas ref={canvasRef} className="hidden" />
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2"><UserIcon size={12}/> Nome Completo do Titular</label>
                                                <input className="w-full font-black h-14 bg-white border border-slate-200 rounded-[1.5rem] px-6 shadow-inner focus:border-indigo-500 text-base" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2"><Fingerprint size={12}/> CPF / Registro Nacional</label>
                                                <input className="w-full font-mono font-black h-14 bg-white border border-slate-200 rounded-[1.5rem] px-6 shadow-inner" value={editingUser.cpf_cnpj} onChange={e => setEditingUser({...editingUser, cpf_cnpj: formatCPF(e.target.value)})} maxLength={18} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2"><Info size={12}/> Cédula de Identidade (RG)</label>
                                                <input className="w-full font-mono font-black h-14 bg-white border border-slate-200 rounded-[1.5rem] px-6 shadow-inner" value={editingUser.rg} onChange={e => setEditingUser({...editingUser, rg: e.target.value})} placeholder="Número do Documento" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2"><Phone size={12}/> Linha de Contato Direta</label>
                                                <input className="w-full font-black h-14 bg-white border border-slate-200 rounded-[1.5rem] px-6 shadow-inner" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} placeholder="(00) 00000-0000" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2"><Shield size={12}/> Papel Hierárquico</label>
                                                <select className="w-full font-black h-14 bg-white border border-slate-200 rounded-[1.5rem] px-6 shadow-inner appearance-none" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})}>
                                                    {AVAILABLE_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2"><Info size={12}/> Unidade / Lote Estrutural</label>
                                                <input className="w-full font-black h-14 bg-white border border-slate-200 rounded-[1.5rem] px-6 shadow-inner" value={editingUser.unit} onChange={e => setEditingUser({...editingUser, unit: e.target.value})} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">Protocolo de Status</label>
                                                <select className="w-full font-black h-14 bg-white border border-slate-200 rounded-[1.5rem] px-6 shadow-inner appearance-none" value={editingUser.status} onChange={e => setEditingUser({...editingUser, status: e.target.value as any})}>
                                                    <option value="ACTIVE">OPERACIONAL / ATIVO</option>
                                                    <option value="PENDING">AGUARDANDO PROVISÃO</option>
                                                    <option value="BANNED">BLOQUEIO SRE ATIVO</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-dashed border-slate-200 flex items-center justify-between shadow-inner">
                                        <div className="flex items-center gap-5">
                                            <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl"><Brain size={24}/></div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Preenchimento via Vision Computing</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Extração neural de dados via documento oficial</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowOCR(true)} className="px-8 py-3 bg-white border border-slate-200 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm">Iniciar Scanner Neural</button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'SOCIAL' && <SocialQuestionnaire user={editingUser} onSave={(data) => setEditingUser({...editingUser, socialData: data})} onCancel={() => setEditingUser(null)} />}
                            
                            {activeTab === 'FINANCIAL' && (
                                <div className="space-y-10 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10"><Receipt size={56}/></div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Saúde de Caixa Individual</p>
                                            <h4 className={`text-4xl font-black tracking-tight ${totalDevedor > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {totalDevedor > 0 ? 'DÉBITO ATIVO' : 'SITUAÇÃO REGULAR'}
                                            </h4>
                                        </div>
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Inadimplência Bruta</p>
                                            <h4 className="text-4xl font-black text-rose-600 tracking-tight">R$ {totalDevedor.toLocaleString('pt-BR')}</h4>
                                        </div>
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Protocolos de Cobrança</p>
                                            <h4 className="text-4xl font-black text-slate-800 tracking-tight">{userFinances.length} registros</h4>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                                        <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                                            <h4 className="font-black text-sm uppercase tracking-widest text-slate-600">Extrato Analítico Consolidado</h4>
                                        </div>
                                        {isLoadingFinances ? (
                                            <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32}/></div>
                                        ) : (
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                                                    <tr><th className="p-6">Identificação do Título</th><th className="p-6 text-right">Montante (R$)</th></tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {userFinances.map(r => (
                                                        <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="p-6">
                                                                <div className="flex items-center gap-5">
                                                                    <div className={`p-2 rounded-xl shadow-sm ${r.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                        {r.type === 'INCOME' ? <ArrowUpRight size={16}/> : <ArrowDownLeft size={16}/>}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-black text-slate-800 text-sm">{r.description}</p>
                                                                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Protocolado em {new Date(r.date).toLocaleDateString('pt-BR')}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className={`p-6 text-right font-black text-base ${r.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {Number(r.amount).toLocaleString('pt-BR')}</td>
                                                        </tr>
                                                    ))}
                                                    {userFinances.length === 0 && (
                                                        <tr><td colSpan={2} className="p-32 text-center text-slate-300 font-black text-xs uppercase tracking-[0.4em] italic">O Kernel não detectou títulos financeiros vinculados.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'AI_DOSSIER' && (
                                <div className="space-y-10 animate-fade-in">
                                    <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
                                        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[120px] -mr-40 -mt-40"></div>
                                        <div className="flex flex-col lg:flex-row justify-between items-center gap-10 relative z-10">
                                            <div className="flex items-center gap-8">
                                                <div className="p-6 bg-indigo-600 rounded-[2.5rem] shadow-2xl animate-pulse">
                                                    <Brain size={48} />
                                                </div>
                                                <div>
                                                    <h4 className="text-3xl font-black uppercase tracking-tightest leading-none">SRE Advisor Individual</h4>
                                                    <p className="text-xs text-indigo-300 font-black uppercase tracking-[0.4em] mt-3">Algoritmo de Risco e Score Comportamental</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={handleGenerateDossier}
                                                disabled={isGeneratingDossier}
                                                className="px-12 py-5 bg-white text-indigo-950 rounded-[1.75rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-4 disabled:opacity-50 active:scale-95"
                                            >
                                                {isGeneratingDossier ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20}/>}
                                                {isGeneratingDossier ? 'Processando Lógica Neural...' : 'Compilar Novo Dossiê'}
                                            </button>
                                        </div>
                                    </div>

                                    {dossierResult ? (
                                        <div className="bg-white border border-slate-200 rounded-[3.5rem] shadow-sm p-12 lg:p-20 animate-fade-in relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 opacity-20" />
                                            <div className="flex items-center gap-5 mb-12 pb-6 border-b border-slate-100">
                                                <FileText size={32} className="text-indigo-600"/>
                                                <h5 className="font-black text-slate-800 uppercase text-lg tracking-widest">Relatório Analítico SRE PRO</h5>
                                            </div>
                                            <div className="prose prose-indigo max-w-none prose-p:text-base prose-p:leading-[1.8] prose-headings:font-black prose-headings:tracking-tighter prose-headings:uppercase prose-headings:text-slate-900 prose-strong:text-indigo-600">
                                                <div className="whitespace-pre-wrap font-medium text-slate-700 leading-loose">
                                                    {dossierResult}
                                                </div>
                                            </div>
                                        </div>
                                    ) : !isGeneratingDossier && (
                                        <div className="text-center py-40 bg-slate-50/50 rounded-[4rem] border border-dashed border-slate-200">
                                            <Brain size={80} className="mx-auto text-slate-200 mb-8 opacity-50" />
                                            <h4 className="font-black text-slate-400 uppercase text-sm tracking-[0.5em]">Aguardando Comando de Análise</h4>
                                            <p className="text-[11px] text-slate-400 font-bold uppercase mt-4 max-w-sm mx-auto leading-relaxed">O motor Gemini 3 aguarda autorização para cruzar as entidades financeiras e sociais deste membro.</p>
                                        </div>
                                    )}

                                    {isGeneratingDossier && (
                                        <div className="flex flex-col items-center justify-center py-40 space-y-8 bg-white rounded-[4rem] border border-slate-100 shadow-inner">
                                            <div className="relative">
                                                <div className="w-32 h-32 border-[12px] border-slate-50 border-t-indigo-600 rounded-full animate-spin shadow-inner" />
                                                <Brain size={48} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
                                            </div>
                                            <div className="text-center space-y-2">
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-[0.6em] animate-pulse">Auditando Histórico Normativo...</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">SRE Cluster Pipeline Ativo</p>
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
                    title="Capturar Dados via Vision Neural" 
                    onResult={(data) => setEditingUser({ ...editingUser!, name: data.nome || editingUser!.name, cpf_cnpj: data.cpf || editingUser!.cpf_cnpj, rg: data.rg || editingUser!.rg })} 
                    onClose={() => setShowOCR(false)} 
                />
            )}
        </div>
    );
};

export default UserManagement;

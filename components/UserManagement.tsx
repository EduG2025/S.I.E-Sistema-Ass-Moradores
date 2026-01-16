
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AVAILABLE_ROLES, FINANCIAL_CATEGORIES } from '../constants';
import { User, FinancialRecord } from '../types';
import { userService, financialService, aiService, reservationService, marketplaceService, api } from '../services/api';
import { formatCPF } from '../utils/cpf';
import {
    Save, Search, Edit2, X, Plus, Loader2, Users,
    Shield, Info, Heart, Wallet, Brain, Camera, ArrowUpRight, ArrowDownLeft, Receipt,
    Upload, User as UserIcon, Phone, Fingerprint, Trash2, Sparkles, FileText,
    Activity, History, UserPlus, CreditCard, Printer, CheckCircle2, AlertCircle, Filter,
    ChevronRight, ChevronLeft, MapPin, Target, Landmark, RefreshCw, DollarSign, TrendingUp, Star, Zap,
    // FIX: Added missing 'Key' icon to lucide-react imports
    Briefcase, ClipboardList, ShoppingBag, Clock, Map as MapIcon, Send, Key
} from 'lucide-react';
import SocialQuestionnaire from './SocialQuestionnaire';
import OCRScanner from './OCRScanner';
import * as L from 'leaflet';

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<'PERSONAL' | 'FAMILY' | 'SOCIAL' | 'FINANCIAL' | 'HISTORY' | 'AI_DOSSIER'>('PERSONAL');
    const [showOCR, setShowOCR] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);

    // Invitation State
    const [inviteToken, setInviteToken] = useState<string | null>(null);

    // Finance Modal States
    const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
    const [newFinRecord, setNewFinRecord] = useState<Partial<FinancialRecord>>({
        description: '', amount: '', type: 'INCOME', category: 'CONDOMÍNIO', date: new Date().toISOString().slice(0, 10), status: 'PAID', is_recurring: 0
    });

    // AI Dossier & Stats
    const [dossierResult, setDossierResult] = useState<string | null>(null);
    const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);
    const [stats, setStats] = useState({ total: 0, pending: 0, residents: 0, risk: 0 });

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);

    // Cross-Module Data
    const [userFinances, setUserFinances] = useState<FinancialRecord[]>([]);
    const [userHistory, setUserHistory] = useState<any[]>([]);
    const [dependents, setDependents] = useState<User[]>([]);
    const [isLoadingExtra, setIsLoadingExtra] = useState(false);

    const loadUsers = useCallback(async (page: number, searchTerm: string = '') => {
        setIsLoading(true);
        try {
            const res = await userService.getAll(page, 50, searchTerm);
            const data = res.data.data || [];
            setUsers(data);
            setPagination(res.data.pagination || { page: 1, total: data.length, pages: 1 });

            setStats({
                total: data.length,
                pending: data.filter((u: any) => u.status === 'PENDING').length,
                residents: data.filter((u: any) => u.role === 'RESIDENT').length,
                risk: data.filter((u: any) => (u.socialData?.risk || 0) > 70).length
            });
        } finally { setIsLoading(false); }
    }, []);

    useEffect(() => { loadUsers(pagination.page, search); }, [pagination.page, search, loadUsers]);

    useEffect(() => {
        if (editingUser && activeTab === 'PERSONAL' && mapContainerRef.current && !mapInstance.current) {
            const initialCoords = editingUser.coordinates || { lat: -23.5505, lng: -46.6333 };
            mapInstance.current = L.map(mapContainerRef.current, { center: [initialCoords.lat, initialCoords.lng], zoom: 16, attributionControl: false });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);

            markerInstance.current = L.marker([initialCoords.lat, initialCoords.lng], {
                draggable: true,
                icon: L.divIcon({ className: 'custom-marker', html: `<div class="w-6 h-6 bg-indigo-600 rounded-full border-4 border-white shadow-xl animate-pulse"></div>` })
            }).addTo(mapInstance.current);

            markerInstance.current.on('dragend', (e: any) => {
                const { lat, lng } = e.target.getLatLng();
                setEditingUser(prev => prev ? { ...prev, coordinates: { lat, lng } } : null);
            });
        }
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [editingUser, activeTab]);

    const loadIntegrations = async () => {
        if (editingUser && !String(editingUser.id).startsWith('temp_')) {
            setIsLoadingExtra(true);
            try {
                const [finRes, resRes, markRes, depRes] = await Promise.all([
                    financialService.getAll({ user_id: editingUser.id }),
                    reservationService.getAll(),
                    marketplaceService.getAll(),
                    api.get(`/users/${editingUser.id}/dependents`)
                ]);
                setUserFinances(finRes.data.data || []);
                setDependents(depRes.data.data || []);
                const hist = [
                    ...(resRes.data.data || []).filter((r: any) => r.user_id === editingUser.id).map((r: any) => ({ ...r, origin: 'RESERVA' })),
                    ...(markRes.data.data || []).filter((m: any) => m.merchant_id === editingUser.id).map((m: any) => ({ ...m, origin: 'ANÚNCIO' }))
                ];
                setUserHistory(hist.sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()));
            } catch (e) { console.error("Erro na integração SRE"); }
            finally { setIsLoadingExtra(false); }
        }
    };

    useEffect(() => {
        if (editingUser) loadIntegrations();
    }, [editingUser]);

    const handleSaveFinance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setIsSaving(true);
        try {
            await financialService.create({ ...newFinRecord, user_id: editingUser.id });
            setIsFinanceModalOpen(false);
            setNewFinRecord({ description: '', amount: '', type: 'INCOME', category: 'CONDOMÍNIO', date: new Date().toISOString().slice(0, 10), status: 'PAID', is_recurring: 0 });
            loadIntegrations();
            alert("✅ Protocolo financeiro injetado com sucesso.");
        } finally { setIsSaving(false); }
    };

    const handleActivate = async (id: string | number) => {
        if (!confirm("Confirmar ativação e liberação de acesso para este membro?")) return;
        try {
            await userService.activate(id);
            loadUsers(pagination.page, search);
        } catch (e) { alert("Falha na ativação SRE."); }
    };

    const handleGenerateInvite = async (id: string | number) => {
        try {
            const res = await userService.generateInvite(id);
            setInviteToken(res.data.token);
        } catch (e) {
            alert("Erro ao gerar convite.");
        }
    };

    const handleSave = async () => {
        if (!editingUser) return;
        setIsSaving(true);
        try {
            const payload = { ...editingUser };
            if (typeof editingUser.id === 'string' && editingUser.id.startsWith('temp_')) {
                const { id, ...clean } = payload;
                await userService.create(clean);
            } else {
                await userService.update(editingUser.id, payload);
            }
            setEditingUser(null);
            loadUsers(pagination.page, search);
            alert("✅ Registro sincronizado com sucesso.");
        } catch (e) {
            alert("Falha na sincronização do Kernel.");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrintID = () => {
        if (!editingUser) return;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>ID S.I.E - ${editingUser.name}</title><style>body { font-family: sans-serif; display: flex; justify-content: center; padding: 50px; background: #f0f2f5; } .card { width: 350px; height: 520px; background: #fff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden; position: relative; border: 1px solid #ddd; } .header { height: 120px; background: #4f46e5; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; } .photo { width: 140px; height: 140px; border-radius: 30px; border: 5px solid #fff; margin-top: -70px; background: #eee; overflow: hidden; } .photo img { width: 100%; height: 100%; object-fit: cover; } .info { padding: 30px; text-align: center; } .name { font-size: 20px; font-weight: 900; text-transform: uppercase; color: #1e293b; margin-bottom: 5px; } .role { font-size: 10px; font-weight: 900; color: #4f46e5; letter-spacing: 2px; text-transform: uppercase; } .details { margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; text-align: left; } .label { font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; } .val { font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 10px; } .footer { position: absolute; bottom: 0; width: 100%; height: 40px; background: #020617; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 900; letter-spacing: 1px; }</style></head><body><div class="card"><div class="header"><div style="font-weight: 900; font-size: 14px;">S.I.E PRO</div><div style="font-size: 7px; opacity: 0.7;">SISTEMA INTELIGENTE ATIVO</div></div><center><div class="photo"><img src="${editingUser.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + editingUser.id}" /></div></center><div class="info"><div class="name">${editingUser.name}</div><div class="role">${editingUser.role}</div><div class="details"><div class="label">CPF/Identidade</div><div class="val">${editingUser.cpf_cnpj}</div><div class="label">Unidade Atribuída</div><div class="val">${editingUser.unit || 'NÃO DEFINIDA'}</div><div class="label">Vínculo</div><div class="val">MEMBRO ATIVO</div></div></div><div class="footer">VALIDAÇÃO BIOMÉTRICA SRE V25.9</div></div></body></html>`);
            printWindow.document.close();
            printWindow.print();
        }
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

    const filteredUsers = users.filter(u => filterRole === 'ALL' || u.role === filterRole);

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in h-full relative">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                {[
                    { label: 'Base Total', val: stats.total, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Aguardando SRE', val: stats.pending, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Titulares Ativos', val: stats.residents, icon: UserIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Alerta Social', val: stats.risk, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' }
                ].map((s, i) => (
                    <div key={i} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}><s.icon size={18} /></div>
                        <div>
                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p>
                            <h4 className="text-xl font-black text-slate-800 tracking-tight">{s.val}</h4>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-row justify-between items-center bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-xl shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><Fingerprint size={24} /></div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight uppercase leading-none">Gestão de Identidade</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-1.5 opacity-80">Base Biométrica e Governança SRE</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex bg-white/5 p-1.5 rounded-xl border border-white/10">
                        {['ALL', 'ADMIN', 'RESIDENT', 'SINDIC'].map(r => (
                            <button key={r} onClick={() => setFilterRole(r)} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${filterRole === r ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{r}</button>
                        ))}
                    </div>
                    <button onClick={() => { setEditingUser({ id: `temp_${Date.now()}`, name: '', role: 'RESIDENT', status: 'ACTIVE', active: 1, cpf_cnpj: '', username: '', phone: '', email: '', unit: '', rg: '', coordinates: { lat: -23.5505, lng: -46.6333 } } as any); setActiveTab('PERSONAL'); }} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl"><Plus size={18} /> Novo Membro</button>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="p-6 border-b bg-slate-50/30 shrink-0 flex justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input type="text" placeholder="Pesquisar por nome, CPF ou unidade..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 h-14 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-inner focus:border-indigo-500 transition-all" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 text-slate-400 disabled:opacity-30"><ChevronLeft size={18} /></button>
                            <span className="text-[10px] font-black uppercase text-slate-400">Pág {pagination.page} de {pagination.pages}</span>
                            <button disabled={pagination.page >= pagination.pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 text-slate-400 disabled:opacity-30"><ChevronRight size={18} /></button>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10">
                            <tr className="bg-white/95 backdrop-blur-md shadow-sm">
                                <th className="p-6 border-b border-slate-100">Membro</th>
                                <th className="p-6 border-b border-slate-100">Assinatura Digital</th>
                                <th className="p-6 border-b border-slate-100 text-center">Nível</th>
                                <th className="p-6 border-b border-slate-100 text-center">Saúde Social</th>
                                <th className="p-6 border-b border-slate-100 text-center">Estado</th>
                                <th className="p-6 border-b border-slate-100 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={40} /></td></tr> : filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-[1.25rem] overflow-hidden bg-slate-100 border-2 border-white shadow-md flex items-center justify-center group-hover:border-indigo-100 transition-all">
                                                    {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-slate-300" />}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-white ${user.active ? 'bg-emerald-50' : 'bg-slate-300'}`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-black text-slate-800 truncate max-w-[200px]">{user.name}</p>
                                                    {user.socialData && Object.keys(user.socialData).length > 0 && (
                                                        <div title="Sincronizado via Censo" className="text-indigo-600 animate-pulse"><Zap size={10} fill="currentColor" /></div>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Unid. {user.unit || '---'} • SRE Core</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-black text-slate-600 font-mono tracking-tighter">{user.cpf_cnpj}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">{user.phone || user.email || 'Canal Pendente'}</p>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className="text-[10px] font-black uppercase text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100">{user.role}</span>
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full transition-all duration-1000 ${user.socialData?.risk > 70 ? 'bg-rose-500' : user.socialData?.risk > 30 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${Math.max(20, user.socialData?.risk || 10)}%` }} />
                                            </div>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{user.socialData?.risk > 70 ? 'Alto Risco' : 'Normal'}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{user.status}</span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-3">
                                            {user.status === 'PENDING' && (
                                                <button onClick={() => handleActivate(user.id)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-500 transition-all flex items-center gap-2"><CheckCircle2 size={14} /> Ativar</button>
                                            )}
                                            <button onClick={() => { setEditingUser(user); setActiveTab('PERSONAL'); setDossierResult(null); }} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-lg rounded-2xl transition-all border border-transparent hover:border-indigo-100"><Edit2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FORMULÁRIO IMERSIVO (Editor) */}
            {editingUser && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container">
                        {/* Header do PopUp */}
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/5">
                            <div className="flex items-center gap-5">
                                <div className="p-3.5 bg-indigo-600 rounded-[1.25rem] shadow-xl"><Shield size={22} className="text-white" /></div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Editor de Governança</h3>
                                    <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-[0.3em]">Protocolo SRE V25.9 • Cluster Alpha</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => handleGenerateInvite(editingUser.id)} className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/5 flex items-center gap-3 font-black text-[10px] uppercase tracking-widest group">
                                    <Key size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" /> Gerar Convite
                                </button>
                                <button onClick={handlePrintID} className="p-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/5 group" title="Imprimir ID">
                                    <Printer size={18} className="group-hover:scale-110 transition-transform" />
                                </button>
                                <button onClick={handleSave} disabled={isSaving} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.25rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl active:scale-95 disabled:opacity-50">
                                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Sincronizar Registro
                                </button>
                                <div className="h-8 w-px bg-white/10 mx-2"></div>
                                <button onClick={() => { setEditingUser(null); setIsCameraActive(false); setInviteToken(null); }} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex bg-slate-50 p-2 border-b shrink-0 gap-2 relative z-10">
                            {[
                                { id: 'PERSONAL', label: 'Dados Biográficos', icon: Info },
                                { id: 'FAMILY', label: 'Núcleo Familiar', icon: Users },
                                { id: 'SOCIAL', label: 'Dossiê Social', icon: Heart },
                                { id: 'FINANCIAL', label: 'Solvência SRE', icon: Wallet },
                                { id: 'HISTORY', label: 'Engajamento', icon: History },
                                { id: 'AI_DOSSIER', label: 'Previsão Neural', icon: Brain }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-4.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-lg border border-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}><tab.icon size={14} /> {tab.label}</button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#fdfdfe] relative">
                            {inviteToken && (
                                <div className="mb-8 p-6 bg-indigo-900 text-white rounded-3xl border border-indigo-500 shadow-2xl animate-slide-up flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-white/10 rounded-2xl"><Send size={24}/></div>
                                        <div>
                                            <h4 className="font-black uppercase tracking-tight">Link de Primeiro Acesso Gerado</h4>
                                            <p className="text-xs text-indigo-300">Copie o link e envie ao morador via WhatsApp.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-black/30 p-3 rounded-2xl border border-white/10 w-full md:w-auto">
                                        <code className="text-xs font-mono text-emerald-400 truncate max-w-[300px]">{window.location.origin}/activate/{inviteToken}</code>
                                        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/activate/${inviteToken}`); alert("Link copiado!"); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase whitespace-nowrap">Copiar Link</button>
                                        <button onClick={() => setInviteToken(null)} className="p-2 text-white/50 hover:text-white"><X size={18}/></button>
                                    </div>
                                </div>
                            )}

                            <div className="absolute inset-0 opacity-[0.01] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 2px, transparent 2px)', backgroundSize: '40px 40px' }} />

                            <div className="max-w-[1200px] mx-auto pb-10 relative z-10">
                                {activeTab === 'PERSONAL' && (
                                    <div className="space-y-12 animate-fade-in">
                                        <div className="flex flex-col lg:flex-row gap-12 items-start">
                                            <div className="bg-slate-50 p-6 rounded-[3.5rem] border border-slate-200 shadow-inner flex flex-col items-center gap-6 shrink-0 w-full lg:w-72">
                                                <div className="relative group">
                                                    <div className="w-48 h-48 rounded-[3rem] overflow-hidden border-[4px] border-white shadow-2xl bg-white flex items-center justify-center group-hover:border-indigo-50 transition-all">
                                                        {isCameraActive ? (
                                                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-110" />
                                                        ) : editingUser.avatar_url ? (
                                                            <img src={editingUser.avatar_url} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <UserIcon size={64} className="text-slate-100" />
                                                        )}
                                                    </div>
                                                    {!isCameraActive && (
                                                        <div className="absolute -bottom-4 -right-4 flex gap-2">
                                                            <label className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl cursor-pointer hover:bg-indigo-700 transition-all hover:scale-110"><Upload size={18} /><input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} /></label>
                                                            <button onClick={startCamera} className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-indigo-600 transition-all hover:scale-110"><Camera size={18} /></button>
                                                        </div>
                                                    )}
                                                    {isCameraActive && (
                                                        <div className="absolute -bottom-4 -right-4 flex gap-2">
                                                            <button onClick={capturePhoto} className="p-3 bg-emerald-600 text-white rounded-2xl shadow-xl hover:bg-emerald-700 transition-all hover:scale-110"><Camera size={18} /></button>
                                                            <button onClick={stopCamera} className="p-3 bg-rose-600 text-white rounded-2xl shadow-xl hover:bg-rose-700 transition-all hover:scale-110"><X size={18} /></button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-center"><h4 className="font-black text-slate-800 text-base uppercase">Biometria Ativa</h4><p className="text-[8px] text-slate-400 font-bold uppercase mt-1">ID SRE OPERACIONAL</p></div>
                                            </div>

                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
                                                <div className="md:col-span-12 space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.2em] flex items-center gap-2"><UserIcon size={12} /> Nome Completo do Membro</label>
                                                    <input className="w-full font-black h-16 bg-slate-50 border-slate-200 rounded-[1.5rem] px-6 text-2xl shadow-inner focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} />
                                                </div>
                                                <div className="md:col-span-6 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.2em] flex items-center gap-2"><Fingerprint size={12} /> CPF Protocolado</label><input className="w-full font-mono font-black h-14 bg-slate-50 border-slate-200 rounded-xl px-6 text-xl shadow-inner" value={editingUser.cpf_cnpj} onChange={e => setEditingUser({ ...editingUser, cpf_cnpj: formatCPF(e.target.value) })} maxLength={18} /></div>
                                                <div className="md:col-span-6 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.2em] flex items-center gap-2"><Phone size={12} /> WhatsApp</label><input className="w-full font-black h-14 bg-slate-50 border-slate-200 rounded-xl px-6 text-lg shadow-inner" value={editingUser.phone} onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })} /></div>
                                                <div className="md:col-span-6 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.2em] flex items-center gap-2"><Shield size={12} /> Cargo</label><select className="w-full font-black h-14 bg-slate-50 border-slate-200 rounded-xl px-6 text-sm uppercase shadow-inner" value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value as any })}>{AVAILABLE_ROLES.map(role => <option key={role} value={role}>{role}</option>)}</select></div>
                                                <div className="md:col-span-6 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.2em] flex items-center gap-2"><CreditCard size={12} /> Unidade</label><input className="w-full font-black h-14 bg-slate-50 border-slate-200 rounded-xl px-6 text-lg shadow-inner uppercase" value={editingUser.unit} onChange={e => setEditingUser({ ...editingUser, unit: e.target.value })} /></div>
                                                <div className="md:col-span-6 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label><select className="w-full font-black h-14 bg-slate-50 border rounded-xl px-6" value={editingUser.status} onChange={e => setEditingUser({ ...editingUser, status: e.target.value as any })}><option value="ACTIVE">ATIVO</option><option value="PENDING">PENDENTE</option><option value="BANNED">BLOQUEADO</option></select></div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between px-2">
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><MapPin size={24} className="text-indigo-600" /> Localização do Ativo</h4>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Arraste o marcador para a posição exata da residência/lote</p>
                                                </div>
                                                <div className="bg-slate-900 text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-black font-mono shadow-xl border border-white/5">
                                                    COORD: {editingUser.coordinates?.lat?.toFixed(4) || '0.0000'}, {editingUser.coordinates?.lng?.toFixed(4) || '0.0000'}
                                                </div>
                                            </div>
                                            <div ref={mapContainerRef} className="w-full h-80 rounded-[3rem] border-4 border-white shadow-2xl overflow-hidden grayscale-[0.4] hover:grayscale-0 transition-all z-10" />
                                        </div>

                                        <div className="bg-indigo-900/5 p-8 rounded-[3.5rem] border-2 border-dashed border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-8 group">
                                            <div className="flex items-center gap-6 relative z-10">
                                                <div className="p-4 bg-white text-indigo-600 rounded-2xl shadow-xl group-hover:scale-110 transition-transform"><Brain size={32} /></div>
                                                <div><p className="text-xl font-black text-indigo-950 uppercase tracking-tight">Vision Assist Core</p><p className="text-[9px] text-indigo-400 font-black uppercase mt-1 tracking-[0.3em]">Mapeamento de entidades via OCR Neural</p></div>
                                            </div>
                                            <button onClick={() => setShowOCR(true)} className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-indigo-700 transition-all shadow-2xl active:scale-95">Executar Scanner</button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'FAMILY' && (
                                    <div className="space-y-8 animate-fade-in">
                                        <div className="bg-slate-950 p-10 rounded-[3rem] text-white flex justify-between items-center relative overflow-hidden shadow-2xl">
                                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none"><Users size={150} /></div>
                                            <div className="relative z-10">
                                                <h4 className="text-2xl font-black uppercase tracking-tightest">Dependentes & Agregados</h4>
                                                <p className="text-[9px] text-indigo-300 font-bold uppercase mt-1 tracking-[0.4em]">Membros vinculados à conta de {editingUser.name}</p>
                                            </div>
                                            <button onClick={() => {
                                                const name = prompt("Nome completo do dependente:");
                                                if (name) {
                                                    api.post('/users', { name, parent_id: editingUser.id, role: 'RESIDENT', status: 'ACTIVE', unit: editingUser.unit })
                                                        .then(() => { alert("Dependente adicionado."); loadIntegrations(); })
                                                        .catch(() => alert("Falha ao registrar dependente."));
                                                }
                                            }} className="px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-2xl relative z-10 hover:bg-indigo-50 transition-all active:scale-95"><Plus size={18} /> Incluir Dependente</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {dependents.length === 0 ? (
                                                <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                                    <Users size={48} className="mx-auto text-slate-200 mb-4 opacity-20" />
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum núcleo familiar mapeado.</p>
                                                </div>
                                            ) : dependents.map(dep => (
                                                <div key={dep.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex justify-between items-center group hover:border-indigo-200 transition-all hover:shadow-lg">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"><UserIcon size={24} /></div>
                                                        <div><p className="text-base font-black text-slate-800">{dep.name}</p><p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Status: {dep.status} • SRE ID OK</p></div>
                                                    </div>
                                                    <button onClick={async () => { await api.delete(`/users/${dep.id}`); loadIntegrations(); }} className="p-3 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'SOCIAL' && <SocialQuestionnaire user={editingUser} onSave={(data) => { setEditingUser({ ...editingUser, socialData: data }); alert("Dossiê Sincronizado."); }} onCancel={() => setEditingUser(null)} />}

                                {activeTab === 'FINANCIAL' && (
                                    <div className="space-y-12 animate-fade-in">
                                        <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
                                            <div>
                                                <h4 className="text-xl font-black uppercase tracking-widest">Atalhos Financeiros</h4>
                                                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-[0.2em] mt-1">Lançamentos diretos para este membro</p>
                                            </div>
                                            <div className="flex gap-4">
                                                <button onClick={() => { setNewFinRecord({ ...newFinRecord, category: 'DOAÇÃO', description: `Doação - ${editingUser.name}` }); setIsFinanceModalOpen(true); }} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2 transition-all"><Heart size={14} /> Registrar Doação</button>
                                                <button onClick={() => { setNewFinRecord({ ...newFinRecord, category: 'CONDOMÍNIO', description: `Mensalidade - ${editingUser.name}`, is_recurring: 1, billing_cycle: 'MONTHLY' }); setIsFinanceModalOpen(true); }} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg"><RefreshCw size={14} /> Nova Recorrência</button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center min-h-[160px]">
                                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Total Contribuído</p>
                                                <h4 className="text-3xl font-black text-emerald-600 tracking-tightest">R$ {userFinances.reduce((acc, c) => acc + (c.type === 'INCOME' && c.status === 'PAID' ? Number(c.amount) : 0), 0).toLocaleString('pt-BR')}</h4>
                                            </div>
                                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center min-h-[160px]">
                                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Títulos em Aberto</p>
                                                <h4 className="text-3xl font-black text-rose-600 tracking-tightest">R$ {userFinances.reduce((acc, c) => acc + (c.status !== 'PAID' ? Number(c.amount) : 0), 0).toLocaleString('pt-BR')}</h4>
                                            </div>
                                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center min-h-[160px]">
                                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Histórico SRE</p>
                                                <h4 className="text-3xl font-black text-slate-800 tracking-tightest">{userFinances.length} Protocolos</h4>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b"><tr><th className="p-6">Identificador</th><th className="p-6">Categoria</th><th className="p-6 text-right">Montante Efetivo</th></tr></thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {userFinances.length === 0 ? <tr><td colSpan={3} className="p-16 text-center text-slate-300 font-black uppercase text-[9px] tracking-[0.4em]">Nenhuma transação protocolada.</td></tr> : userFinances.map(r => (
                                                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="p-6">
                                                                <div className="flex items-center gap-5">
                                                                    <div className={`p-3 rounded-xl shadow-lg ${r.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{r.type === 'INCOME' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}</div>
                                                                    <div><p className="font-black text-slate-800 text-sm">{r.description}</p><p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{new Date(r.date).toLocaleDateString('pt-BR')}</p></div>
                                                                </div>
                                                            </td>
                                                            <td className="p-6"><span className="px-3 py-1 bg-slate-100 text-[8px] font-black uppercase text-slate-500 rounded-lg">{r.category}</span></td>
                                                            <td className={`p-6 text-right font-black text-base ${r.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {Number(r.amount).toLocaleString('pt-BR')}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'HISTORY' && (
                                    <div className="space-y-8 animate-fade-in">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl flex items-center justify-between relative overflow-hidden"><div className="absolute top-0 right-0 p-6 opacity-10 scale-150 rotate-12"><CheckCircle2 size={80} /></div><div className="relative z-10"><p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-70">Soberania Participativa</p><h4 className="text-3xl font-black mt-1">Nível Ouro</h4></div><CheckCircle2 size={48} className="opacity-30 relative z-10" /></div>
                                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl flex items-center justify-between relative overflow-hidden"><div className="relative z-10"><p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Score de Engajamento</p><h4 className="text-3xl font-black text-slate-800 mt-1">9.2 / 10</h4></div><Activity size={48} className="text-indigo-100 opacity-50" /></div>
                                        </div>
                                        <div className="space-y-4">
                                            <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-2 flex items-center gap-2"><History size={14} /> Cronologia de Atividade</h5>
                                            {userHistory.map((h, i) => (
                                                <div key={i} className="p-6 bg-white border border-slate-100 rounded-[1.5rem] flex justify-between items-center hover:border-indigo-200 transition-all hover:shadow-xl group">
                                                    <div className="flex items-center gap-6"><span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase border shadow-sm ${h.origin === 'RESERVA' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{h.origin}</span><div><p className="text-sm font-black text-slate-800 uppercase tracking-tight">{h.area_name || h.title}</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest">{new Date(h.date || h.created_at).toLocaleDateString('pt-BR')} às {new Date(h.date || h.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p></div></div>
                                                    <ChevronRight size={20} className="text-slate-100 group-hover:text-indigo-300 transition-colors" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'AI_DOSSIER' && (
                                    <div className="space-y-10 animate-fade-in">
                                        <div className="bg-slate-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
                                            <div className="flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
                                                <div className="flex items-center gap-6"><div className="p-6 bg-indigo-600 rounded-[2rem] shadow-2xl animate-pulse"><Brain size={42} /></div><div><h4 className="text-2xl font-black uppercase tracking-tightest leading-none">Análise Preditiva SRE</h4><p className="text-[10px] text-indigo-300 font-black uppercase tracking-[0.4em] mt-2 opacity-80">Geração de Relatório de Risco Individual</p></div></div>
                                                <button onClick={async () => {
                                                    setIsGeneratingDossier(true);
                                                    try {
                                                        const res = await aiService.generateUserDossier(editingUser.id);
                                                        setDossierResult(res.data.text);
                                                    } catch (e) { alert("⚠️ Falha neural."); }
                                                    finally { setIsGeneratingDossier(false); }
                                                }} disabled={isGeneratingDossier} className="px-10 py-5 bg-white text-indigo-950 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50">
                                                    {isGeneratingDossier ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} {isGeneratingDossier ? 'Processando...' : 'Gerar Dossiê Neural'}
                                                </button>
                                            </div>
                                        </div>
                                        {dossierResult && (
                                            <div className="bg-slate-50 border-4 border-white rounded-[3rem] shadow-xl p-10 lg:p-16 animate-fade-in relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-20" />
                                                <div className="prose prose-indigo max-w-none"><div className="whitespace-pre-wrap font-medium text-slate-700 leading-relaxed text-base italic">{dossierResult}</div></div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronização Ativa</span></div>
                            <div className="flex gap-4">
                                <button onClick={() => { setEditingUser(null); setIsCameraActive(false); setInviteToken(null); }} className="px-8 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Fechar</button>
                                <button onClick={handleSave} disabled={isSaving} className="px-10 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-600 transition-all">Salvar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FINANCE ATALHO MODAL */}
            {isFinanceModalOpen && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-md self-center">
                        <form onSubmit={handleSaveFinance}>
                            <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                                <div className="flex items-center gap-5">
                                    <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl"><DollarSign size={22} /></div>
                                    <div>
                                        <h4 className="font-black text-xl tracking-tight uppercase leading-none">Lançar Título SRE</h4>
                                        <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">DIRECT LEDGER INJECTION</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setIsFinanceModalOpen(false)} className="p-2 text-slate-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all"><X size={28}/></button>
                            </div>
                            <div className="p-10 space-y-8 bg-[#fdfdfe]">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Descrição do Título</label>
                                    <input required className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 focus:bg-white focus:border-indigo-500 shadow-inner" value={newFinRecord.description || ''} onChange={e => setNewFinRecord({ ...newFinRecord, description: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor (R$)</label>
                                        <input type="number" required className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xl focus:bg-white focus:border-indigo-500 shadow-inner" value={newFinRecord.amount || ''} onChange={e => setNewFinRecord({ ...newFinRecord, amount: e.target.value })} />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Categoria</label>
                                        <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-[11px] uppercase appearance-none" value={newFinRecord.category || 'CONDOMÍNIO'} onChange={e => setNewFinRecord({ ...newFinRecord, category: e.target.value })}>
                                            {FINANCIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex items-center gap-5 shadow-sm">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={!!newFinRecord.is_recurring} onChange={e => setNewFinRecord({ ...newFinRecord, is_recurring: e.target.checked ? 1 : 0, billing_cycle: e.target.checked ? 'MONTHLY' : undefined })} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                    <div>
                                        <p className="text-[11px] font-black uppercase text-indigo-950">Habilitar Recorrência</p>
                                        <p className="text-[9px] font-bold uppercase text-indigo-400">Lançamento automático mensal.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 border-t border-slate-100 flex justify-end gap-6 bg-slate-50">
                                <button type="button" onClick={() => setIsFinanceModalOpen(false)} className="px-8 py-4 text-slate-400 font-black text-xs uppercase tracking-widest">Abortar</button>
                                <button type="submit" disabled={isSaving} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95">
                                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Commitar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showOCR && <OCRScanner context="IDENTITY" title="Vision Neural: Identidade" onResult={(data) => {
                if (editingUser) setEditingUser({ ...editingUser, name: data.nome || editingUser.name, cpf_cnpj: data.cpf || editingUser.cpf_cnpj, rg: data.rg || editingUser.rg });
            }} onClose={() => setShowOCR(false)} />}
        </div>
    );
};

export default UserManagement;

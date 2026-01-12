
import React, { useState, useEffect, useCallback } from 'react';
import { AVAILABLE_ROLES, FINANCIAL_CATEGORIES } from '../constants';
import { User, FinancialRecord } from '../types';
import { userService, financialService, aiService } from '../services/api';
import { formatCPF } from '../utils/cpf';
import {
    Save, Search, Edit2, X, Plus, UserPlus, Loader2,
    ChevronLeft, ChevronRight, Download, Camera,
    ShieldCheck, Sparkles, Brain, Wallet, Heart, Trash2, Phone, Mail, Fingerprint, Shield, Info, CreditCard, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownLeft,
    Activity, History, Filter, Printer, CheckCircle
} from 'lucide-react';
import SocialQuestionnaire from './SocialQuestionnaire';
import OCRScanner from './OCRScanner';
import axios from 'axios';

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<'PERSONAL' | 'SOCIAL' | 'FINANCIAL' | 'AI_DOSSIER'>('PERSONAL');
    const [showOCR, setShowOCR] = useState(false);

    const [userFinancials, setUserFinancials] = useState<FinancialRecord[]>([]);
    const [userScore, setUserScore] = useState({ score: 0, status: 'N/A' });
    const [isLoadingFinance, setIsLoadingFinance] = useState(false);
    
    // IA Dossier States
    const [dossierContent, setDossierContent] = useState('');
    const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);

    const [isAddingFinance, setIsAddingFinance] = useState(false);
    const [newFinanceData, setNewFinanceData] = useState<Partial<FinancialRecord>>({
        description: 'MENSALIDADE', amount: 0, type: 'INCOME', category: 'CONDOMÍNIO', status: 'PENDING'
    });

    const [isSaving, setIsSaving] = useState(false);

    const loadUsers = useCallback(async (page: number, searchTerm: string = '') => {
        setIsLoading(true);
        try {
            const response = await userService.getAll(page, 10, searchTerm);
            setUsers(response.data.data || []);
            setPagination(response.data.pagination || { page: 1, total: 0, pages: 1 });
        } catch (error) { 
            console.error("[SRE] Falha ao carregar membros:", error); 
        } finally { 
            setIsLoading(false); 
        }
    }, []);

    const loadUserData = async (userId: string | number) => {
        setIsLoadingFinance(true);
        try {
            const token = localStorage.getItem('sie_auth_token');
            const [finRes, scoreRes] = await Promise.all([
                financialService.getAll({ user_id: userId }),
                axios.get(`/api/users/${userId}/score`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { score: 0, status: 'N/A' } }))
            ]);
            setUserFinancials(finRes.data.data || []);
            setUserScore(scoreRes.data);
        } catch (e) {
            setUserFinancials([]);
        } finally {
            setIsLoadingFinance(false);
        }
    };

    useEffect(() => {
        if (editingUser?.id && !String(editingUser.id).startsWith('temp_')) {
            loadUserData(editingUser.id);
            setDossierContent(''); // Reset dossier when changing user
        }
    }, [editingUser?.id]);

    useEffect(() => {
        loadUsers(pagination.page, search);
    }, [pagination.page, search, loadUsers]);

    const generateAIDossier = async () => {
        if (!editingUser?.id) return;
        setIsGeneratingDossier(true);
        try {
            const res = await axios.post('/api/ai/member-dossier', { userId: editingUser.id });
            setDossierContent(res.data.analysis);
        } catch (e) {
            alert("Falha no Motor Neural. Verifique se há chaves de IA ativas.");
        } finally {
            setIsGeneratingDossier(false);
        }
    };

    const handleCreateFinance = async () => {
        if (!editingUser?.id) return;
        if (!newFinanceData.description || !newFinanceData.amount) return alert("Preencha todos os campos.");
        
        setIsSaving(true);
        try {
            await financialService.create({ 
                ...newFinanceData, 
                user_id: editingUser.id,
                date: new Date().toISOString().split('T')[0],
                status: 'PAID'
            });
            setIsAddingFinance(false);
            loadUserData(editingUser.id);
            alert("✅ Título financeiro protocolado.");
        } catch (e) {
            alert("Erro ao registrar no financeiro.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleOCRResult = (data: any) => {
        if (editingUser) {
            setEditingUser({
                ...editingUser,
                name: data.nome_completo || data.name || editingUser.name,
                cpf_cnpj: data.cpf || data.documento || editingUser.cpf_cnpj,
                rg: data.rg || editingUser.rg
            });
            alert("✅ Dados extraídos com sucesso via Vision.");
        }
    };

    const saveUser = async () => {
        if (!editingUser) return;
        setIsSaving(true);
        try {
            const payload = { ...editingUser };
            delete (payload as any).updated_at;
            delete (payload as any).created_at;

            if (typeof editingUser.id === 'string' && editingUser.id.startsWith('temp_')) {
                const { id, ...cleanPayload } = payload;
                await userService.create(cleanPayload);
            } else {
                await userService.update(editingUser.id, payload);
            }
            setEditingUser(null);
            loadUsers(pagination.page, search);
            alert("✅ Registro de membro comitado.");
        } catch (e) {
            alert("Erro ao comitar registro.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl shrink-0">
                <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Famílias & Membros</h2>
                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2">Database Governança V105.0</p>
                </div>
                <button onClick={() => { setEditingUser({ id: `temp_${Date.now()}`, name: '', role: 'RESIDENT', status: 'ACTIVE', active: 1, cpf_cnpj: '', username: '', phone: '', email: '', unit: '', rg: '', rg_issuing_body: '' } as any); setActiveTab('PERSONAL'); }} className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl">
                    <UserPlus size={18} /> Novo Registro
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input type="text" placeholder="Nome, Unidade ou CPF..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 bg-white h-12 rounded-xl border-slate-100 text-xs font-bold focus:border-indigo-500 transition-colors" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10 backdrop-blur-md">
                            <tr><th className="p-6">Identidade / Unidade</th><th className="p-6 text-center">Papel</th><th className="p-6 text-center">Status</th><th className="p-6 text-right">Ações</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" /></td></tr>
                            ) : users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black bg-indigo-50 text-indigo-400 shadow-inner shrink-0">{user.name?.[0] || '?'}</div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800 truncate">{user.name || 'Sem Nome'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{user.unit || 'Sem Unidade'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center"><span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{user.role}</span></td>
                                    <td className="p-6 text-center">
                                        <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase border ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{user.status}</span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingUser(user); setActiveTab('PERSONAL'); }} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/30 shrink-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Página {pagination.page} de {pagination.pages}</p>
                    <div className="flex gap-2">
                        <button disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} className="p-2 bg-white border border-slate-200 rounded-xl disabled:opacity-30"><ChevronLeft size={18}/></button>
                        <button disabled={pagination.page >= pagination.pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} className="p-2 bg-white border border-slate-200 rounded-xl disabled:opacity-30"><ChevronRight size={18}/></button>
                    </div>
                </div>
            </div>

            {editingUser && (
                <div className="fixed inset-0 flex items-center justify-center bg-slate-900/95 z-[9999] p-0 lg:p-6 backdrop-blur-xl animate-fade-in">
                    <div className="bg-white rounded-none lg:rounded-[3.5rem] shadow-2xl w-full max-w-6xl h-full lg:h-[92vh] overflow-hidden border border-white/10 flex flex-col animate-scale-in">
                        <div className="p-8 lg:p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-lg text-white"><Shield size={28}/></div>
                                <div><h3 className="font-black text-3xl tracking-tightest text-slate-800 uppercase leading-none">Prontuário de Membro</h3><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">Matrícula SRE: {editingUser.id}</p></div>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="p-5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all border border-slate-100 bg-white shadow-sm">
                                <X size={36} />
                            </button>
                        </div>
                        <div className="flex bg-slate-50 p-2 border-b shrink-0 overflow-x-auto custom-scrollbar">
                            {[
                                { id: 'PERSONAL', label: 'Identidade', icon: Info },
                                { id: 'SOCIAL', label: 'Censo Social', icon: Heart },
                                { id: 'FINANCIAL', label: 'Financeiro', icon: Wallet },
                                { id: 'AI_DOSSIER', label: 'Análise Neural', icon: Brain }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 whitespace-nowrap min-w-[150px] transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <tab.icon size={18} /> {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 lg:p-16 custom-scrollbar bg-[#fcfcfd]">
                            <div className="max-w-5xl mx-auto">
                                {activeTab === 'PERSONAL' && (
                                    <div className="space-y-12 animate-fade-in pb-10">
                                        <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
                                            <div className="flex items-center gap-5">
                                                <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg animate-pulse"><Camera size={24}/></div>
                                                <div>
                                                    <h4 className="font-black text-indigo-900 uppercase text-xs tracking-widest">SRE Vision Ativo</h4>
                                                    <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1">Escanear Documento para Preenchimento Automático</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setShowOCR(true)} className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3">
                                                <Camera size={18}/> Iniciar Scanner
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label><input className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 focus:border-indigo-500 shadow-sm" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Lote</label><input className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 focus:border-indigo-500 shadow-sm" value={editingUser.unit} onChange={e => setEditingUser({...editingUser, unit: e.target.value})} /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF / CNPJ</label><input className="w-full font-mono font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 shadow-inner" value={editingUser.cpf_cnpj} onChange={e => setEditingUser({...editingUser, cpf_cnpj: formatCPF(e.target.value)})} maxLength={18} /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RG Civil</label><input className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 shadow-inner" value={editingUser.rg || ''} onChange={e => setEditingUser({...editingUser, rg: e.target.value})} /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone</label><input className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 shadow-inner" value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} /></div>
                                        </div>
                                        <div className="pt-10 border-t border-slate-100 flex justify-end">
                                            <button onClick={saveUser} disabled={isSaving} className="px-16 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] flex items-center gap-4 transition-all hover:bg-indigo-600 active:scale-95 shadow-xl">{isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />} Commitar Registro</button>
                                        </div>
                                    </div>
                                )}
                                
                                {activeTab === 'SOCIAL' && <SocialQuestionnaire user={editingUser} onSave={() => {}} onCancel={() => setEditingUser(null)} />}
                                
                                {activeTab === 'FINANCIAL' && (
                                    <div className="space-y-8 animate-fade-in pb-10">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between h-56">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score de Confiança</p>
                                                <h4 className="text-5xl font-black text-slate-800 tracking-tighter">{userScore.score}</h4>
                                                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full w-fit ${userScore.score > 700 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{userScore.status}</span>
                                            </div>
                                            <div className="lg:col-span-2 bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between overflow-hidden relative h-56 shadow-xl">
                                                <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={120}/></div>
                                                <div className="relative z-10">
                                                    <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Saldo Recebido no Hub</p>
                                                    <h4 className="text-4xl font-black mt-2">R$ {userFinancials.filter(f => f.type === 'INCOME' && f.status === 'PAID').reduce((acc, f) => acc + Number(f.amount), 0).toLocaleString('pt-BR')}</h4>
                                                </div>
                                                <button onClick={() => setIsAddingFinance(true)} className="relative z-10 mt-6 px-8 py-4 bg-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 w-fit hover:bg-indigo-500 transition-all shadow-xl active:scale-95"><Plus size={18}/> Lançar Título para este Membro</button>
                                            </div>
                                        </div>

                                        {isAddingFinance && (
                                            <div className="bg-indigo-50 border border-indigo-100 p-10 rounded-[3rem] animate-scale-in relative shadow-inner">
                                                <div className="flex justify-between items-center mb-8">
                                                    <div>
                                                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Protocolar Lançamento Direto</h4>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Vinculado a: {editingUser.name}</p>
                                                    </div>
                                                    <button onClick={() => setIsAddingFinance(false)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400"><X size={20}/></button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="space-y-2"><label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Descrição do Fluxo</label><input className="w-full font-bold h-14 bg-white border-slate-200 rounded-xl px-4" value={newFinanceData.description} onChange={e => setNewFinanceData({...newFinanceData, description: e.target.value})} placeholder="Ex: Mensalidade Jan" /></div>
                                                    <div className="space-y-2"><label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Valor Nominal (R$)</label><input type="number" className="w-full font-bold h-14 bg-white border-slate-200 rounded-xl px-4" value={newFinanceData.amount} onChange={e => setNewFinanceData({...newFinanceData, amount: Number(e.target.value)})} /></div>
                                                    <div className="space-y-2"><label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Rubrica Contábil</label><select className="w-full font-bold h-14 bg-white border-slate-200 rounded-xl px-4" value={newFinanceData.category} onChange={e => setNewFinanceData({...newFinanceData, category: e.target.value})}>{FINANCIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                                </div>
                                                <button onClick={handleCreateFinance} disabled={isSaving} className="mt-10 w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:bg-emerald-600 shadow-2xl active:scale-95">{isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle size={20}/>} Commitar no Fluxo Financeiro</button>
                                            </div>
                                        )}

                                        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                                            <div className="p-8 border-b border-slate-100 font-black uppercase text-[10px] tracking-widest text-slate-500 bg-slate-50/50 flex items-center gap-3"><History size={16}/> Histórico de Movimentações</div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                                                        <tr><th className="p-6">Data</th><th className="p-6">Descrição</th><th className="p-6 text-right">Valor</th><th className="p-6 text-center">Status</th></tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {isLoadingFinance ? (
                                                            <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" /></td></tr>
                                                        ) : userFinancials.length === 0 ? (
                                                            <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.4em] italic">Nenhum título localizado.</td></tr>
                                                        ) : userFinancials.map(f => (
                                                            <tr key={f.id} className="hover:bg-slate-50 transition-colors group">
                                                                <td className="p-6 text-xs font-bold text-slate-400">{new Date(f.date).toLocaleDateString('pt-BR')}</td>
                                                                <td className="p-6 text-sm font-black text-slate-700">{f.description}</td>
                                                                <td className={`p-6 text-right font-black ${f.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {Number(f.amount).toLocaleString('pt-BR')}</td>
                                                                <td className="p-6 text-center"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${f.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{f.status}</span></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {activeTab === 'AI_DOSSIER' && (
                                    <div className="space-y-10 animate-fade-in pb-10">
                                        <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white flex flex-col items-center justify-center relative overflow-hidden shadow-2xl border border-white/5">
                                            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
                                            <Brain size={64} className={`mb-6 text-indigo-400 ${isGeneratingDossier ? 'animate-pulse' : ''}`} />
                                            <h4 className="text-3xl font-black uppercase tracking-tightest leading-none text-center">Auditoria Neural Ativa</h4>
                                            <p className="text-slate-400 text-sm mt-4 max-w-lg font-medium leading-relaxed text-center">O IA Especialista cruzará telemetria financeira, participativa e social para gerar o dossiê preditivo de risco deste membro.</p>
                                            
                                            {!dossierContent && !isGeneratingDossier && (
                                                <button 
                                                    onClick={generateAIDossier}
                                                    className="mt-8 px-12 py-5 bg-indigo-600 rounded-2xl font-black uppercase text-xs tracking-[0.4em] hover:bg-white hover:text-indigo-600 transition-all shadow-2xl active:scale-95 flex items-center gap-4"
                                                >
                                                    <Sparkles size={20}/> Iniciar Auditoria
                                                </button>
                                            )}
                                        </div>

                                        {isGeneratingDossier && (
                                            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                                                <Loader2 className="animate-spin text-indigo-600 mb-4" size={40}/>
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Processando Fluxos de Governança...</p>
                                            </div>
                                        )}

                                        {dossierContent && !isGeneratingDossier && (
                                            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm animate-scale-in">
                                                <div className="flex items-center gap-4 mb-8 border-b border-slate-50 pb-6">
                                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><ShieldCheck size={24}/></div>
                                                    <h5 className="text-sm font-black uppercase text-slate-800 tracking-widest">Relatório Consolidado de IA</h5>
                                                </div>
                                                <div className="prose prose-slate max-w-none text-slate-600 text-lg font-medium leading-relaxed whitespace-pre-wrap">
                                                    {dossierContent}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showOCR && (
                <OCRScanner 
                    context="IDENTITY" 
                    title="Digitalizar Identidade de Membro" 
                    onResult={handleOCRResult} 
                    onClose={() => setShowOCR(false)} 
                />
            )}
        </div>
    );
};

export default UserManagement;

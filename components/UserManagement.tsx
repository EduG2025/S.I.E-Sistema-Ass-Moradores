
import React, { useState, useEffect, useCallback } from 'react';
import { AVAILABLE_ROLES } from '../constants';
import { User, FinancialRecord } from '../types';
import { userService, financialService, aiService } from '../services/api';
import { formatCPF } from '../utils/cpf';
import {
    Save, Search, Edit2, X, Plus, UserPlus, Loader2,
    ChevronLeft, ChevronRight, Download,
    ShieldCheck, Sparkles, Brain, Wallet, Heart, Trash2, Phone, Mail, Fingerprint, Shield, Info, CreditCard, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownLeft,
    Activity, History, Filter, Printer
} from 'lucide-react';
import SocialQuestionnaire from './SocialQuestionnaire';
import axios from 'axios';

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<'PERSONAL' | 'SOCIAL' | 'FINANCIAL' | 'AI_DOSSIER'>('PERSONAL');

    const [userFinancials, setUserFinancials] = useState<FinancialRecord[]>([]);
    const [userScore, setUserScore] = useState({ score: 0, status: 'N/A' });
    const [isLoadingFinance, setIsLoadingFinance] = useState(false);
    
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
            const [finRes, scoreRes] = await Promise.all([
                financialService.getAll({ user_id: userId }),
                axios.get(`/api/users/${userId}/score`, { headers: { Authorization: `Bearer ${localStorage.getItem('sie_auth_token')}` } })
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
        }
    }, [editingUser?.id]);

    useEffect(() => {
        loadUsers(pagination.page, search);
    }, [pagination.page, search, loadUsers]);

    const saveUser = async () => {
        if (!editingUser) return;
        setIsSaving(true);
        try {
            if (typeof editingUser.id === 'string' && editingUser.id.startsWith('temp_')) {
                const { id, ...payload } = editingUser;
                await userService.create(payload);
            } else {
                await userService.update(editingUser.id, editingUser);
            }
            setEditingUser(null);
            loadUsers(pagination.page, search);
            alert("✅ Registro de membro atualizado.");
        } catch (err) { 
            alert("Erro ao comitar registro."); 
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl shrink-0">
                <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Membros do Cluster</h2>
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
                        <input type="text" placeholder="Nome, Unidade ou CPF..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 bg-white h-12 rounded-xl border-slate-100 text-xs font-bold" />
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
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
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black bg-indigo-50 text-indigo-400 shadow-inner shrink-0">
                                                {user.name?.[0] || '?'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-slate-800 truncate">{user.name || 'Sem Nome'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{user.unit || 'Sem Unidade'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{user.role}</span>
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase border ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{user.status}</span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingUser(user); setActiveTab('PERSONAL'); }} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"><Edit2 size={16}/></button>
                                            <button onClick={() => { if(confirm('Remover membro do Kernel?')) userService.update(user.id, { active: 0 }).then(() => loadUsers(pagination.page, search)); }} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 size={16}/></button>
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

            {/* FICHA CADASTRAL SRE HIGH-DENSITY */}
            {editingUser && (
                <div className="fixed inset-0 bg-slate-900/95 z-[1000] flex items-center justify-center p-0 lg:p-12 backdrop-blur-xl animate-fade-in">
                    <div className="bg-white rounded-none lg:rounded-[3.5rem] shadow-2xl w-full max-w-7xl h-full lg:h-[90vh] overflow-hidden border border-white/10 flex flex-col animate-scale-in">
                        <div className="p-8 lg:p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-lg text-white">
                                    <Shield size={28}/>
                                </div>
                                <div>
                                    <h3 className="font-black text-3xl tracking-tightest text-slate-800 uppercase leading-none">Prontuário de Membro</h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">Matrícula SRE: {editingUser.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="p-5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all border border-slate-100 bg-white"><X size={36}/></button>
                        </div>

                        <div className="flex bg-slate-50 p-2 border-b shrink-0 overflow-x-auto custom-scrollbar">
                            {[
                                { id: 'PERSONAL', label: 'Identidade', icon: Info },
                                { id: 'SOCIAL', label: 'Censo Social', icon: Heart },
                                { id: 'FINANCIAL', label: 'Financeiro', icon: Wallet },
                                { id: 'AI_DOSSIER', label: 'Análise Neural', icon: Brain }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 whitespace-nowrap min-w-[150px] ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <tab.icon size={18} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 lg:p-16 custom-scrollbar bg-[#fcfcfd]">
                            <div className="max-w-5xl mx-auto h-full">
                                {activeTab === 'PERSONAL' && (
                                    <div className="space-y-12 animate-fade-in">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo Oficial</label>
                                                <input className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 shadow-inner text-lg" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Lote de Referência</label>
                                                <input className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 shadow-inner text-lg" value={editingUser.unit} onChange={e => setEditingUser({...editingUser, unit: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF / CNPJ (Assinatura)</label>
                                                <input className="w-full font-mono font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 shadow-inner" value={editingUser.cpf_cnpj} onChange={e => setEditingUser({...editingUser, cpf_cnpj: formatCPF(e.target.value)})} maxLength={18} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RG Civil</label>
                                                <input className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 shadow-inner" value={editingUser.rg} onChange={e => setEditingUser({...editingUser, rg: e.target.value})} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Terminal Telefônico</label>
                                                <input className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 shadow-inner" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correio Eletrônico</label>
                                                <input className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 shadow-inner" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Papel de Governança</label>
                                                <select className="w-full font-black h-16 bg-white border-slate-200 rounded-2xl px-6 shadow-inner appearance-none uppercase text-xs" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})}>
                                                    {AVAILABLE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="pt-10 border-t border-slate-100 flex justify-end">
                                            <button onClick={saveUser} disabled={isSaving} className="w-full lg:w-auto px-16 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 active:scale-95">
                                                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />} Commitar Registro
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'SOCIAL' && <SocialQuestionnaire user={editingUser} onSave={() => {}} onCancel={() => setEditingUser(null)} />}
                                
                                {activeTab === 'FINANCIAL' && (
                                    <div className="space-y-8 animate-fade-in">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Score S.I.E</p>
                                                <h4 className="text-5xl font-black text-slate-800 tracking-tighter mt-4">{userScore.score}</h4>
                                                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full w-fit mt-4 ${userScore.score > 700 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{userScore.status}</span>
                                            </div>
                                            <div className="lg:col-span-2 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
                                                <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={120}/></div>
                                                <div>
                                                    <p className="text-indigo-300 text-[10px] font-black uppercase">Saldo Devedor / Crédito</p>
                                                    <h4 className="text-4xl font-black mt-2">R$ 0,00</h4>
                                                </div>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-8 flex items-center gap-2">
                                                    <AlertCircle size={12}/> Protocolo de adimplência ativo via ERP integrado.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                                            <div className="p-8 border-b border-slate-100 font-black uppercase text-[10px] tracking-widest text-slate-500 bg-slate-50/50">Histórico de Transações do Nó</div>
                                            <div className="p-20 text-center text-slate-300 uppercase font-black text-[10px] tracking-widest italic">Nenhuma transação vinculada no Kernel.</div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'AI_DOSSIER' && (
                                    <div className="space-y-8 animate-fade-in h-full flex flex-col">
                                        <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white flex-1 relative shadow-2xl border border-white/5">
                                            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                                            <div className="flex items-center gap-6 mb-12 relative z-10">
                                                <div className="p-6 bg-indigo-600 rounded-[2.5rem] shadow-xl"><Brain size={40} className="text-white animate-pulse" /></div>
                                                <div>
                                                    <h4 className="text-3xl font-black uppercase tracking-tightest leading-none">Auditoria Neural SRE</h4>
                                                    <p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                                                        <Sparkles size={14}/> Motor Gemini Pro V3.1 Active
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="h-full flex flex-col items-center justify-center text-center py-20 relative z-10">
                                                <Sparkles className="text-indigo-400 mb-10 opacity-20" size={120} />
                                                <h5 className="text-2xl font-black text-white uppercase tracking-widest mb-6">Pronto para Handshake Neural</h5>
                                                <p className="text-slate-400 text-base max-w-lg mb-14 font-medium leading-relaxed">A IA cruzará telemetria financeira, social e participativa para gerar um dossiê preditivo de governança.</p>
                                                <button className="w-full max-w-sm py-8 bg-indigo-600 hover:bg-white hover:text-indigo-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.5em] transition-all shadow-2xl active:scale-95">
                                                    Iniciar Auditoria de Risco
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;

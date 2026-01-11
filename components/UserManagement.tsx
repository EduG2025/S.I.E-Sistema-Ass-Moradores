
import React, { useState, useEffect, useCallback } from 'react';
import { AVAILABLE_ROLES } from '../constants';
import { User, FinancialRecord } from '../types';
import { userService, financialService, aiService } from '../services/api';
import { formatCPF } from '../utils/cpf';
// Fix: Added missing Activity icon import from lucide-react
import {
    Save, Search, Edit2, X, Plus, UserPlus, Loader2,
    ChevronLeft, ChevronRight, Download,
    ShieldCheck, Sparkles, Brain, Wallet, Heart, Trash2, Phone, Mail, Fingerprint, Shield, Info, CreditCard, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownLeft,
    Activity
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
    const [aiDossierText, setAiDossierText] = useState<string | null>(null);
    const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);

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
        setAiDossierText(null);
        try {
            const [finRes, scoreRes] = await Promise.all([
                financialService.getAll({ user_id: userId }),
                axios.get(`/api/users/${userId}/score`)
            ]);
            setUserFinancials(finRes.data.data || []);
            setUserScore(scoreRes.data);
        } catch (e) {
            console.error("[SRE] Falha ao vincular dados financeiros", e);
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

    const handleSaveSocial = async (socialData: any) => {
        if (!editingUser) return;
        try {
            setIsLoading(true);
            await userService.update(editingUser.id, { socialData });
            setEditingUser({ ...editingUser, socialData });
            alert("✅ Dossiê Social Sincronizado com o Kernel.");
            loadUsers(pagination.page, search);
        } catch (err) {
            alert("Erro ao salvar dados sociais.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateDossier = async () => {
        if (!editingUser) return;
        setIsGeneratingDossier(true);
        try {
            const prompt = `Gere um dossiê de análise de risco e perfil para o membro:
            Nome: ${editingUser.name}
            Social: ${JSON.stringify(editingUser.socialData || {})}
            Score: ${userScore.score}
            Analise vulnerabilidade e adimplência.`;
            const res = await aiService.generateDocument(prompt);
            setAiDossierText(res.data.text);
        } catch (e) {
            alert("IA indisponível.");
        } finally {
            setIsGeneratingDossier(false);
        }
    };

    const saveUser = async () => {
        if (!editingUser) return;
        if (!editingUser.name || !editingUser.cpf_cnpj) {
            alert("Protocolo Inválido: Nome e CPF são obrigatórios para o Kernel.");
            return;
        }

        try {
            if (typeof editingUser.id === 'string' && editingUser.id.startsWith('temp_')) {
                const { id, ...payload } = editingUser;
                await userService.create(payload);
            } else {
                await userService.update(editingUser.id, editingUser);
            }
            setEditingUser(null);
            loadUsers(pagination.page, search);
            alert("✅ Registro comitado com sucesso.");
        } catch (err) { 
            alert("Erro ao salvar no banco de dados."); 
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
                <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Governança de Membros</h2>
                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2">Database Operacional Ativo V91.0</p>
                </div>
                <button onClick={() => { setEditingUser({ id: `temp_${Date.now()}`, name: '', role: 'RESIDENT', status: 'ACTIVE', active: 1, cpf_cnpj: '', username: '', phone: '', email: '', unit: '', rg: '', rg_issuing_body: '' } as any); setActiveTab('PERSONAL'); }} className="flex items-center gap-3 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-50 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl">
                    <UserPlus size={18} /> Novo Registro
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/30">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Buscar por Nome ou CPF..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 bg-white h-12" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                            <tr><th className="p-8">Membro / Unidade</th><th className="p-8 text-center">Status</th><th className="p-8 text-right">Ações</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={3} className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" /></td></tr>
                            ) : users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black bg-indigo-50 text-indigo-400 shadow-inner">
                                                {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover rounded-2xl" /> : (user.name?.[0] || '?')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{user.name || 'Sem Nome'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.unit || 'Sem Unidade'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-8 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{user.status}</span>
                                    </td>
                                    <td className="p-8 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingUser(user); setActiveTab('PERSONAL'); }} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"><Edit2 size={16}/></button>
                                            <button onClick={() => { if(confirm('Remover do sistema?')) userService.update(user.id, { active: false }).then(() => loadUsers(pagination.page, search)); }} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 border-t border-slate-100 flex justify-between items-center bg-slate-50/30">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Página {pagination.page} de {pagination.pages}</p>
                    <div className="flex gap-2">
                        <button disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} className="p-2 bg-white border border-slate-200 rounded-xl disabled:opacity-30 transition-all"><ChevronLeft size={18}/></button>
                        <button disabled={pagination.page >= pagination.pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} className="p-2 bg-white border border-slate-200 rounded-xl disabled:opacity-30 transition-all"><ChevronRight size={18}/></button>
                    </div>
                </div>
            </div>

            {editingUser && (
                <div className="fixed inset-0 bg-slate-900/90 z-[200] flex items-end justify-center backdrop-blur-xl animate-fade-in">
                    <div className="bg-white rounded-t-[3.5rem] shadow-2xl w-full max-w-5xl h-[95vh] overflow-hidden border-t border-white/20 animate-slide-up flex flex-col">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-black text-2xl tracking-tighter flex items-center gap-3 text-slate-800">
                                    <Shield size={24} className="text-indigo-600"/> Ficha Cadastral do Membro
                                </h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">SRE Master Identity Hub • ID: {editingUser.id}</p>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="p-3 text-slate-400 hover:bg-slate-100 rounded-full transition-all border border-slate-100"><X size={28}/></button>
                        </div>

                        <div className="flex bg-slate-50 p-2 border-b shrink-0">
                            {[
                                { id: 'PERSONAL', label: 'Dados Pessoais', icon: Info },
                                { id: 'SOCIAL', label: 'Dossiê Social', icon: Heart },
                                { id: 'FINANCIAL', label: 'Financeiro ERP', icon: Wallet },
                                { id: 'AI_DOSSIER', label: 'Análise IA', icon: Brain }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <tab.icon size={14} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#fcfcfd]">
                            {activeTab === 'PERSONAL' && (
                                <div className="space-y-10 animate-fade-in">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Identidade Primária</h4>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Completo</label>
                                                <div className="relative group">
                                                    <Info size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                    <input className="w-full pl-12 font-bold h-13" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} placeholder="Ex: João da Silva Santos" />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Unidade / Lote</label>
                                                <div className="relative group">
                                                    <Plus size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                    <input className="w-full pl-12 font-bold h-13" value={editingUser.unit} onChange={e => setEditingUser({...editingUser, unit: e.target.value})} placeholder="Ex: Bloco A - 101" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">CPF / CNPJ</label>
                                                <div className="relative group">
                                                    <Fingerprint size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                    <input className="w-full pl-12 font-bold h-13" value={editingUser.cpf_cnpj} onChange={e => setEditingUser({...editingUser, cpf_cnpj: formatCPF(e.target.value)})} placeholder="000.000.000-00" maxLength={18} />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">RG</label>
                                                <input className="w-full font-bold h-13" value={editingUser.rg} onChange={e => setEditingUser({...editingUser, rg: e.target.value})} placeholder="Apenas números" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Órgão Emissor / UF</label>
                                                <input className="w-full font-bold h-13" value={editingUser.rg_issuing_body} onChange={e => setEditingUser({...editingUser, rg_issuing_body: e.target.value})} placeholder="Ex: SSP/SP" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-6 border-t border-slate-100">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Canais de Contato</h4>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail Principal</label>
                                                <div className="relative group">
                                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                    <input type="email" className="w-full pl-12 font-bold h-13" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} placeholder="seu@email.com" />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Telefone / WhatsApp</label>
                                                <div className="relative group">
                                                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                    <input className="w-full pl-12 font-bold h-13" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} placeholder="(00) 00000-0000" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Função / Cargo</label>
                                                <select className="w-full font-bold h-13" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})}>
                                                    {AVAILABLE_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Estado Operacional</label>
                                                <select className="w-full font-bold h-13" value={editingUser.status} onChange={e => setEditingUser({...editingUser, status: e.target.value as any})}>
                                                    <option value="ACTIVE">ATIVO</option>
                                                    <option value="PENDING">PENDENTE</option>
                                                    <option value="VALIDATION_REQUIRED">EXIGE VALIDAÇÃO</option>
                                                    <option value="BANNED">BANIDO / BLOQUEADO</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-10">
                                        <button onClick={saveUser} className="w-full py-6 bg-slate-900 hover:bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3">
                                            <Save size={20} /> Commitar Registro no Kernel
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {activeTab === 'SOCIAL' && <SocialQuestionnaire user={editingUser} onSave={handleSaveSocial} onCancel={() => setEditingUser(null)} />}
                            
                            {activeTab === 'FINANCIAL' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform"><TrendingUp size={60} /></div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solvência S.I.E</p>
                                                <h4 className="text-4xl font-black text-slate-800 mt-1">{userScore.score}</h4>
                                            </div>
                                            <div className="mt-4">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${userScore.status === 'SAUDÁVEL' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                    Status: {userScore.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="col-span-2 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
                                            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl"></div>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Saldo Devedor / Crédito</p>
                                                    <h4 className="text-4xl font-black mt-1">R$ {userFinancials.filter(r => r.status !== 'PAID').reduce((acc, r) => acc + (r.type === 'INCOME' ? Number(r.amount) : -Number(r.amount)), 0).toLocaleString('pt-BR')}</h4>
                                                </div>
                                                <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg"><Wallet size={24}/></div>
                                            </div>
                                            <p className="text-slate-400 text-[9px] font-bold uppercase mt-4 flex items-center gap-2">
                                                <AlertCircle size={12}/> Handshake Financeiro com Cluster SRE OK
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                                <Activity size={14} className="text-indigo-600"/> Extrato de Lançamentos Vinculados
                                            </h4>
                                            <button className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Imprimir Extrato</button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                                                    <tr>
                                                        <th className="p-6">Data</th>
                                                        <th className="p-6">Descrição / Categoria</th>
                                                        <th className="p-6 text-center">Status</th>
                                                        <th className="p-6 text-right">Valor Nominal</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {isLoadingFinance ? (
                                                        <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" /></td></tr>
                                                    ) : userFinancials.length > 0 ? userFinancials.map(fin => (
                                                        <tr key={fin.id} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="p-6 whitespace-nowrap">
                                                                <p className="text-xs font-black text-slate-800">{new Date(fin.date).toLocaleDateString('pt-BR')}</p>
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(fin.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                            </td>
                                                            <td className="p-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-2 rounded-lg ${fin.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                        {fin.type === 'INCOME' ? <ArrowUpRight size={14}/> : <ArrowDownLeft size={14}/>}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-black text-slate-700 text-xs uppercase truncate max-w-[200px]">{fin.description}</p>
                                                                        <p className="text-[8px] text-indigo-400 font-black uppercase tracking-tighter">{fin.category}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-6 text-center">
                                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${fin.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                    {fin.status}
                                                                </span>
                                                            </td>
                                                            <td className={`p-6 text-right font-black text-sm ${fin.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                {fin.type === 'INCOME' ? '+' : '-'} R$ {Number(fin.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan={4} className="p-20 text-center text-slate-300 font-black uppercase text-[10px] border-2 border-dashed border-slate-50">
                                                                Nenhum histórico financeiro vinculado a este membro no Cluster.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'AI_DOSSIER' && (
                                <div className="space-y-6 h-full flex flex-col animate-fade-in">
                                    <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex-1 overflow-y-auto relative shadow-2xl">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
                                        <div className="flex items-center gap-4 mb-8 relative z-10">
                                            <div className="p-3 bg-indigo-600 rounded-2xl"><Brain size={32} className="text-white animate-pulse" /></div>
                                            <div>
                                                <h4 className="text-xl font-black uppercase tracking-tighter">Relatório de Auditoria Neural</h4>
                                                <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest">Motor Gemini Pro V3.1 Ativo</p>
                                            </div>
                                        </div>
                                        
                                        {aiDossierText ? (
                                            <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-slate-300 border-l-2 border-indigo-500 pl-6 relative z-10">
                                                {aiDossierText}
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center py-20 relative z-10">
                                                <Sparkles className="text-indigo-400 mb-6 opacity-20" size={64} />
                                                <h5 className="text-lg font-black text-white uppercase tracking-widest mb-4">Pronto para Análise</h5>
                                                <p className="text-slate-400 text-xs max-w-xs mb-10 font-medium">A IA cruzará dados demográficos, financeiros e de comportamento para gerar um dossiê de risco.</p>
                                                <button onClick={handleGenerateDossier} disabled={isGeneratingDossier} className="w-full max-w-sm py-5 bg-indigo-600 hover:bg-indigo-50 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20">
                                                    {isGeneratingDossier ? <Loader2 className="animate-spin mx-auto" /> : "Iniciar Processamento Neural"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};

export default UserManagement;

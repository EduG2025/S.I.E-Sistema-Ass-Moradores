
import React, { useState, useEffect, useCallback } from 'react';
import { AVAILABLE_ROLES, FINANCIAL_CATEGORIES } from '../constants';
import { User, FinancialRecord } from '../types';
import { userService, financialService, aiService } from '../services/api';
import { formatCPF } from '../utils/cpf';
import {
    Save, Search, Edit2, X, Plus, UserPlus, Loader2,
    ChevronLeft, ChevronRight, Camera, ShieldCheck, Brain, Wallet, Heart, Trash2, Shield, Info, History, CheckCircle
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
    const [isLoadingFinance, setIsLoadingFinance] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const loadUsers = useCallback(async (page: number, searchTerm: string = '') => {
        setIsLoading(true);
        try {
            const res = await userService.getAll(page, 10, searchTerm);
            setUsers(res.data.data || []);
            setPagination(res.data.pagination || { page: 1, total: 0, pages: 1 });
        } finally { setIsLoading(false); }
    }, []);

    useEffect(() => { loadUsers(pagination.page, search); }, [pagination.page, search, loadUsers]);

    const handleSave = async () => {
        if (!editingUser) return;
        setIsSaving(true);
        try {
            const payload = { ...editingUser };
            delete (payload as any).updated_at; delete (payload as any).created_at;
            if (typeof editingUser.id === 'string' && editingUser.id.startsWith('temp_')) {
                const { id, ...clean } = payload; await userService.create(clean);
            } else { await userService.update(editingUser.id, payload); }
            setEditingUser(null); loadUsers(pagination.page, search);
            alert("✅ Registro comitado.");
        } catch (e) { alert("Erro de sincronização."); } 
        finally { setIsSaving(false); }
    };

    const handleOCRResult = (data: any) => {
        if (editingUser) {
            setEditingUser({ ...editingUser, name: data.nome || editingUser.name, cpf_cnpj: data.cpf || editingUser.cpf_cnpj, rg: data.rg || editingUser.rg });
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl shrink-0">
                <div><h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Famílias & Membros</h2><p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2">Database Governança V105.0</p></div>
                <button onClick={() => { setEditingUser({ id: `temp_${Date.now()}`, name: '', role: 'RESIDENT', status: 'ACTIVE', active: 1, cpf_cnpj: '', username: '', phone: '', email: '', unit: '', rg: '' } as any); setActiveTab('PERSONAL'); }} className="flex items-center gap-3 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl"><UserPlus size={18} /> Novo Registro</button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="p-6 border-b bg-slate-50/30 shrink-0"><div className="relative w-full md:w-96"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} /><input type="text" placeholder="Pesquisar membro..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 bg-white h-12 rounded-xl border-slate-100 text-xs font-bold" /></div></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10"><tr className="bg-white/80 backdrop-blur-md"><th className="p-6">Membro / Unidade</th><th className="p-6 text-center">Papel</th><th className="p-6 text-center">Status</th><th className="p-6 text-right">Ações</th></tr></thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" /></td></tr> : users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors group"><td className="p-6"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl flex items-center justify-center font-black bg-indigo-50 text-indigo-400 shadow-inner">{user.name?.[0] || '?'}</div><div><p className="text-sm font-black text-slate-800 truncate">{user.name || 'S/N'}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{user.unit || 'Sem Unidade'}</p></div></div></td><td className="p-6 text-center"><span className="text-[10px] font-black uppercase text-indigo-600">{user.role}</span></td><td className="p-6 text-center"><span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase border ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{user.status}</span></td><td className="p-6 text-right"><button onClick={() => { setEditingUser(user); setActiveTab('PERSONAL'); }} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Edit2 size={16}/></button></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingUser && (
                <div className="fixed inset-0 flex items-center justify-center bg-slate-900/95 z-[9999] p-4 backdrop-blur-xl animate-fade-in">
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-6xl h-[92vh] overflow-hidden border border-white/10 flex flex-col animate-scale-in">
                        <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-5"><div className="p-5 bg-indigo-600 rounded-[2rem] shadow-lg text-white"><Shield size={28}/></div><div><h3 className="font-black text-3xl tracking-tightest text-slate-800 uppercase leading-none">Prontuário de Membro</h3><p className="text-[10px] text-slate-400 font-black uppercase mt-1.5">ID SRE: {editingUser.id}</p></div></div>
                            <button onClick={() => setEditingUser(null)} className="p-5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all border border-slate-100 bg-white shadow-sm"><X size={36} /></button>
                        </div>
                        <div className="flex bg-slate-50 p-2 border-b shrink-0">
                            {[ { id: 'PERSONAL', label: 'Identidade', icon: Info }, { id: 'SOCIAL', label: 'Censo Social', icon: Heart }, { id: 'FINANCIAL', label: 'Financeiro', icon: Wallet }, { id: 'AI_DOSSIER', label: 'Análise Neural', icon: Brain }].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}><tab.icon size={18} /> {tab.label}</button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#fcfcfd]">
                            {activeTab === 'PERSONAL' && (
                                <div className="max-w-5xl mx-auto space-y-12 animate-fade-in">
                                    <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2.5rem] flex items-center justify-between shadow-inner"><div className="flex items-center gap-5"><div className="p-4 bg-indigo-600 text-white rounded-2xl animate-pulse"><Camera size={24}/></div><div><h4 className="font-black text-indigo-900 uppercase text-xs">SRE Vision Ativo</h4><p className="text-[10px] text-indigo-400 font-bold mt-1">Escanear RG/CPF para Auto-Preenchimento</p></div></div><button onClick={() => setShowOCR(true)} className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3"><Camera size={18}/> Iniciar Scanner</button></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Completo</label><input className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 focus:border-indigo-500" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Unidade / Lote</label><input className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 focus:border-indigo-500" value={editingUser.unit} onChange={e => setEditingUser({...editingUser, unit: e.target.value})} /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">CPF / CNPJ</label><input className="w-full font-mono font-bold h-16 bg-white border-slate-200 rounded-2xl px-6" value={editingUser.cpf_cnpj} onChange={e => setEditingUser({...editingUser, cpf_cnpj: formatCPF(e.target.value)})} maxLength={18} /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">RG Civil</label><input className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6" value={editingUser.rg || ''} onChange={e => setEditingUser({...editingUser, rg: e.target.value})} /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail</label><input className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Telefone</label><input className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6" value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} /></div>
                                    </div>
                                    <div className="pt-10 border-t flex justify-end"><button onClick={handleSave} disabled={isSaving} className="px-16 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] flex items-center gap-4 transition-all hover:bg-indigo-600 shadow-xl">{isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />} Commitar Registro</button></div>
                                </div>
                            )}
                            {activeTab === 'SOCIAL' && <SocialQuestionnaire user={editingUser} onSave={(data) => setEditingUser({...editingUser, socialData: data})} onCancel={() => setEditingUser(null)} />}
                        </div>
                    </div>
                </div>
            )}
            {showOCR && <OCRScanner context="IDENTITY" title="Digitalizar Identidade" onResult={handleOCRResult} onClose={() => setShowOCR(false)} />}
        </div>
    );
};

export default UserManagement;

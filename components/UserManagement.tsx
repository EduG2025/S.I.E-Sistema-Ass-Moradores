
import React, { useState, useEffect, useCallback } from 'react';
import { AVAILABLE_ROLES } from '../constants';
import { User } from '../types';
import { userService } from '../services/api';
import { formatCPF } from '../utils/cpf';
import {
    Save, Search, Edit2, X, Plus, Loader2, Users,
    Shield, Info, Heart, Wallet, Brain, Camera
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
            alert("✅ Registro sincronizado.");
        } catch (e) { alert("Erro de rede."); } 
        finally { setIsSaving(false); }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-fade-in h-full relative">
            {/* Slim Header - Compacto */}
            <div className="flex flex-row justify-between items-center bg-slate-900 p-4 rounded-2xl text-white shadow-lg shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg"><Users size={18}/></div>
                    <div>
                        <h2 className="text-base font-black tracking-tight uppercase leading-none">Membros</h2>
                        <p className="text-indigo-400 text-[8px] font-black uppercase tracking-widest mt-1">Kernel DB V105</p>
                    </div>
                </div>
                <button onClick={() => { setEditingUser({ id: `temp_${Date.now()}`, name: '', role: 'RESIDENT', status: 'ACTIVE', active: 1, cpf_cnpj: '', username: '', phone: '', email: '', unit: '', rg: '' } as any); setActiveTab('PERSONAL'); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all"><Plus size={14} /> Novo Membro</button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="p-3 border-b bg-slate-50/30 shrink-0">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <input type="text" placeholder="Filtrar..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 h-10 bg-white border border-slate-200 rounded-xl text-xs font-bold" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10"><tr className="bg-white/90 backdrop-blur-md"><th className="p-4">Identidade</th><th className="p-4 text-center">Papel</th><th className="p-4 text-center">Status</th><th className="p-4 text-right">Ação</th></tr></thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" /></td></tr> : users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors group"><td className="p-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded flex items-center justify-center font-black bg-indigo-50 text-indigo-400 text-[10px]">{user.name?.[0]}</div><div><p className="text-[11px] font-black text-slate-800 truncate max-w-[150px]">{user.name}</p><p className="text-[8px] text-slate-400 font-bold uppercase">Unid. {user.unit}</p></div></div></td><td className="p-4 text-center"><span className="text-[9px] font-black uppercase text-indigo-600">{user.role}</span></td><td className="p-4 text-center"><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{user.status}</span></td><td className="p-4 text-right"><button onClick={() => { setEditingUser(user); setActiveTab('PERSONAL'); }} className="p-2 text-slate-300 hover:text-indigo-600"><Edit2 size={14}/></button></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TRUE FULL-CANVAS OVERLAY - Solução para o empacotamento limitado */}
            {editingUser && (
                <div className="fixed inset-y-0 right-0 z-[1000] bg-[#fcfcfd] flex flex-col animate-slide-left shadow-2xl transition-all duration-300"
                     style={{ left: document.querySelector('aside')?.classList.contains('lg:w-24') ? '96px' : '288px' }}>
                    
                    <div className="h-14 px-6 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-lg">
                        <div className="flex items-center gap-3">
                            <Shield size={16} className="text-indigo-400"/>
                            <h3 className="font-black text-[10px] uppercase tracking-widest">Editor de Registro</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2">
                                {isSaving ? <Loader2 className="animate-spin" size={12}/> : <Save size={12}/>} Commitar Alterações
                            </button>
                            <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400 hover:text-rose-400 transition-all"><X size={20} /></button>
                        </div>
                    </div>

                    <div className="flex bg-slate-50 p-1 border-b shrink-0 overflow-x-auto">
                        {[ { id: 'PERSONAL', label: 'Cadastral', icon: Info }, { id: 'SOCIAL', label: 'Social', icon: Heart }, { id: 'FINANCIAL', label: 'Financeiro', icon: Wallet }, { id: 'AI_DOSSIER', label: 'Dossiê IA', icon: Brain }].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[120px] py-3 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><tab.icon size={14} /> {tab.label}</button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#fcfcfd]">
                        <div className="max-w-4xl mx-auto pb-10">
                            {activeTab === 'PERSONAL' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg"><Camera size={16}/></div>
                                            <div>
                                                <h4 className="font-black text-indigo-900 uppercase text-[9px]">Scanner Vision</h4>
                                                <p className="text-[8px] text-indigo-400 font-bold uppercase">OCR Ativado</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowOCR(true)} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-black text-[9px] uppercase shadow-md">Iniciar Scanner</button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nome Completo</label><input className="w-full font-bold h-12 bg-white border rounded-xl px-4" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} /></div>
                                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Unidade</label><input className="w-full font-bold h-12 bg-white border rounded-xl px-4" value={editingUser.unit} onChange={e => setEditingUser({...editingUser, unit: e.target.value})} /></div>
                                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">CPF / CNPJ</label><input className="w-full font-mono font-bold h-12 bg-white border rounded-xl px-4" value={editingUser.cpf_cnpj} onChange={e => setEditingUser({...editingUser, cpf_cnpj: formatCPF(e.target.value)})} maxLength={18} /></div>
                                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Cargo</label>
                                            <select className="w-full font-bold h-12 bg-white border rounded-xl px-4" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})}>
                                                {AVAILABLE_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'SOCIAL' && <SocialQuestionnaire user={editingUser} onSave={(data) => setEditingUser({...editingUser, socialData: data})} onCancel={() => setEditingUser(null)} />}
                        </div>
                    </div>
                </div>
            )}
            {showOCR && <OCRScanner context="IDENTITY" title="OCR Scanner" onResult={(data) => setEditingUser({ ...editingUser!, name: data.nome || editingUser!.name, cpf_cnpj: data.cpf || editingUser!.cpf_cnpj, rg: data.rg || editingUser!.rg })} onClose={() => setShowOCR(false)} />}
        </div>
    );
};

export default UserManagement;

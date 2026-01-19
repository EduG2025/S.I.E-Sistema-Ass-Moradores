
import React, { useState, useEffect, useCallback } from 'react';
import { User, SystemInfo } from '../types';
import { userService, systemService } from '../services/api';
import {
    Search, Edit2, Plus, Loader2, Users, Shield, Heart, User as UserIcon, 
    Fingerprint, Trash2, Zap, ChevronRight, ChevronLeft, CheckCircle2
} from 'lucide-react';
import UserModal from './UserModal';

interface UserManagementProps {
    systemInfo: SystemInfo;
}

const UserManagement = ({ systemInfo }: UserManagementProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const loadData = useCallback(async (page: number, searchTerm: string = '') => {
        setIsLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                userService.getAll(page, 50, searchTerm),
                systemService.getRoles()
            ]);
            setUsers(usersRes.data.data || []);
            setRoles(rolesRes.data.data || []);
            setPagination(usersRes.data.pagination || { page: 1, total: 0, pages: 1 });
        } catch (e) { console.error("Falha ao carregar membros."); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { loadData(pagination.page, search); }, [pagination.page, search, loadData]);

    const filteredUsers = users.filter(u => filterRole === 'ALL' || u.role === filterRole);

    const getRoleLabel = (roleId: string) => {
        const role = roles.find(r => r.id === roleId);
        return role ? role.label : roleId;
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in h-full relative">
            <div className="flex flex-row justify-between items-center bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-xl shrink-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><Fingerprint size={24} /></div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight uppercase leading-none">Membros & Identidades</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-1.5 opacity-80">Base Cadastral - {systemInfo.shortName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <button onClick={() => setEditingUser({ id: `temp_${Date.now()}`, name: '', role: 'RESIDENT', status: 'ACTIVE', active: 1, cpf_cnpj: '', username: '', phone: '', email: '', unit: '', address: '', coordinates: { lat: -23.5505, lng: -46.6333 } } as any)} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-50 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl active:scale-95"><Plus size={18} /> Novo Registro</button>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="p-6 border-b bg-slate-50/30 shrink-0 flex justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input type="text" placeholder="Pesquisar Identidade..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 h-14 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:border-indigo-500 transition-all uppercase" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10 backdrop-blur-md">
                            <tr className="bg-white/95"><th className="p-6 border-b">Identidade</th><th className="p-6 border-b">Documento</th><th className="p-6 border-b text-center">Perfil</th><th className="p-6 border-b text-center">Estado</th><th className="p-6 border-b text-right">Ações</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={40} /></td></tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-[1.25rem] overflow-hidden bg-slate-100 border-2 border-white shadow-md flex items-center justify-center">{user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-slate-300" />}</div><div><p className="text-sm font-black text-slate-800 uppercase">{user.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">Unid. {user.unit || '---'}</p></div></div></td>
                                    <td className="p-6"><p className="text-[11px] font-black text-slate-600 font-mono">{user.cpf_cnpj}</p></td>
                                    <td className="p-6 text-center"><span className="text-[10px] font-black uppercase text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100">{getRoleLabel(user.role as string)}</span></td>
                                    <td className="p-6 text-center"><span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{user.status}</span></td>
                                    <td className="p-6 text-right"><div className="flex justify-end gap-3"><button onClick={() => setEditingUser(user)} className="p-3 text-slate-300 hover:text-indigo-600"><Edit2 size={18} /></button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingUser && <UserModal user={editingUser} onClose={() => setEditingUser(null)} onSaveSuccess={() => { setEditingUser(null); loadData(pagination.page, search); }} />}
        </div>
    );
};

export default UserManagement;

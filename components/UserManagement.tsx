
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AVAILABLE_ROLES } from '../constants';
import { User, UserRole, UserStatus, FinancialRecord } from '../types';
import { userService, financialService } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import { 
  Save, Search, Edit2, X, Plus, UserPlus, Loader2,
  ChevronLeft, ChevronRight, FileText, Download,
  ShieldCheck, Camera, Zap, Fingerprint, CreditCard, QrCode, Upload, AlertCircle, Sparkles, Brain, Info, History, Heart, Wallet, TrendingDown, ArrowUpRight, Trash2
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
  const [dossierText, setDossierText] = useState('');
  const [isGeneratingDossier, setIsLoadingDossier] = useState(false);

  const loadUsers = useCallback(async (page: number, searchTerm: string = '') => {
      setIsLoading(true);
      try {
          const response = await userService.getAll(page, 10, searchTerm);
          setUsers(response.data.data);
          setPagination(response.data.pagination);
      } catch (error) { console.error(error); } finally { setIsLoading(false); }
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
    if (editingUser?.id && (activeTab === 'FINANCIAL' || activeTab === 'PERSONAL')) {
        loadUserData(editingUser.id);
    }
  }, [activeTab, editingUser]);

  useEffect(() => { 
      loadUsers(pagination.page, search); 
  }, [pagination.page, search, loadUsers]);

  const saveUser = async () => {
    if (!editingUser) return;
    try {
        if (typeof editingUser.id === 'string' && editingUser.id.startsWith('temp_')) { 
            await userService.create(editingUser); 
        } else { 
            await userService.update(editingUser.id, editingUser); 
        }
        setEditingUser(null); 
        loadUsers(pagination.page, search);
    } catch (err) { alert("Erro ao salvar registro."); }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
          <div>
            <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Governança de Membros</h2>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2">Database Operacional Ativo V22.0</p>
          </div>
          <button onClick={() => { setEditingUser({ id: `temp_${Date.now()}`, name: '', role: 'RESIDENT', status: 'PENDING', active: true, cpf_cnpj: '', username: '' } as User); setActiveTab('PERSONAL'); }} className="flex items-center gap-3 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl">
            <UserPlus size={18}/> Novo Registro
          </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/30">
              <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                  <input type="text" placeholder="Buscar por Nome, CPF ou Unidade..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 bg-white" />
              </div>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr><th className="p-8">Membro / Unidade</th><th className="p-8 text-center">Status</th><th className="p-8 text-right">Ações</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {isLoading ? (
                          <tr><td colSpan={3} className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto"/></td></tr>
                      ) : (
                          users.map(user => (
                              <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                  <td className="p-8">
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black bg-indigo-50 text-indigo-400 shadow-inner">
                                              {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover rounded-2xl" /> : user.name?.[0]}
                                          </div>
                                          <div>
                                              <p className="text-sm font-black text-slate-800">{user.name}</p>
                                              <p className="text-[10px] text-slate-400 font-bold uppercase">{user.unit || 'Sem Unidade'} • {formatCPF(user.cpf_cnpj)}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-8 text-center">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{user.status}</span>
                                  </td>
                                  <td className="p-8 text-right">
                                    <button onClick={() => {setEditingUser(user); setActiveTab('PERSONAL');}} className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"><Edit2 size={18}/></button>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {editingUser && (
          <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
              <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200">
                  <div className="bg-slate-900 text-white px-10 py-6 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-5">
                          <h2 className="font-black text-2xl tracking-tighter">{editingUser.name || 'Novo Membro'}</h2>
                      </div>
                      <button onClick={() => setEditingUser(null)} className="hover:bg-white/10 p-3 rounded-2xl transition-all"><X size={28}/></button>
                  </div>

                  <div className="flex border-b border-slate-200 px-10 bg-slate-50/50 shrink-0">
                      {['PERSONAL', 'SOCIAL', 'FINANCIAL', 'AI_DOSSIER'].map(t => (
                          <button key={t} onClick={() => setActiveTab(t as any)} className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            {t.replace('_', ' ')}
                          </button>
                      ))}
                  </div>

                  <div className="flex-1 overflow-y-auto bg-slate-50 p-12">
                      {activeTab === 'FINANCIAL' && (
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Social Credit Score</p>
                                    <h3 className="text-4xl font-black text-indigo-600">{userScore.score}</h3>
                                </div>
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Solvência Individual</p>
                                    <h3 className={`text-4xl font-black ${userScore.status === 'AAA' ? 'text-emerald-500' : 'text-amber-500'}`}>{userScore.status}</h3>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                                        <tr><th className="p-6">Descrição</th><th className="p-6 text-center">Data</th><th className="p-6 text-right">Valor</th><th className="p-6 text-center">Status</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {userFinancials.map(f => (
                                            <tr key={f.id}>
                                                <td className="p-6 text-xs font-bold">{f.description}</td>
                                                <td className="p-6 text-center text-xs">{new Date(f.date).toLocaleDateString()}</td>
                                                <td className="p-6 text-right text-xs font-black">R$ {Number(f.amount).toLocaleString()}</td>
                                                <td className="p-6 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${f.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{f.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                      )}
                      
                      {activeTab === 'PERSONAL' && (
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div className="grid grid-cols-2 gap-6 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</label><input className="w-full" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CPF / CNPJ</label><input className="w-full" value={editingUser.cpf_cnpj} onChange={e => setEditingUser({...editingUser, cpf_cnpj: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidade</label><input className="w-full" value={editingUser.unit} onChange={e => setEditingUser({...editingUser, unit: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo</label><select className="w-full font-bold" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})}>
                                    {AVAILABLE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select></div>
                            </div>
                        </div>
                      )}
                  </div>
                  
                  <div className="p-10 border-t border-slate-200 bg-white flex justify-end gap-4">
                      <button onClick={() => setEditingUser(null)} className="px-10 py-4 text-slate-500 font-black text-xs uppercase tracking-widest">Cancelar</button>
                      <button onClick={saveUser} className="px-12 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl flex items-center gap-3"><Save size={18}/> Salvar Registro</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default UserManagement;

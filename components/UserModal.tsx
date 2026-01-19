
import React, { useState, useEffect } from 'react';
import { User, FinancialRecord, FinancialStatus, SystemInfo } from '../types';
import { systemService, userService, financialService, aiService, communicationService, api } from '../services/api';
import { formatCPF } from '../utils/cpf';
import { FINANCIAL_CATEGORIES, DEFAULT_SYSTEM_INFO } from '../constants';
import {
    Save, X, Loader2, Users, Info, Heart, Wallet, Brain, 
    User as UserIcon, Plus, Trash2, AlertCircle, Activity, Sparkles, TrendingUp, RefreshCw, 
    ArrowUpRight, ArrowDownLeft, Receipt, CheckCircle2, MessageCircle, Printer, Filter, Send, CreditCard, Calendar, Clock
} from 'lucide-react';
import SocialQuestionnaire from './SocialQuestionnaire';

interface UserModalProps {
    user: User;
    onClose: () => void;
    onSaveSuccess: () => void;
}

const UserModal = ({ user, onClose, onSaveSuccess }: UserModalProps) => {
    const [editingUser, setEditingUser] = useState<User>(user);
    const [activeTab, setActiveTab] = useState<'PERSONAL' | 'FAMILY' | 'SOCIAL' | 'FINANCIAL' | 'AI_DOSSIER'>('PERSONAL');
    const [isSaving, setIsSaving] = useState(false);
    const [tempPassword, setTempPassword] = useState('');
    const [roles, setRoles] = useState<any[]>([]);
    const [dependents, setDependents] = useState<User[]>([]);
    const [finRecords, setFinRecords] = useState<FinancialRecord[]>([]);
    const [aiDossier, setAiDossier] = useState<string>('');
    const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);
    const [isFinLoading, setIsFinLoading] = useState(false);
    const [systemInfo, setSystemInfo] = useState<SystemInfo>(DEFAULT_SYSTEM_INFO);
    
    const [finFilter, setFinFilter] = useState<'ALL' | FinancialStatus>('ALL');

    const [isAddingFinance, setIsAddingFinance] = useState(false);
    const [newRecord, setNewRecord] = useState<Partial<FinancialRecord>>({
        description: '', 
        amount: '', 
        type: 'INCOME', 
        category: 'CONDOMÍNIO', 
        date: new Date().toISOString().slice(0, 10), 
        status: 'PENDING',
        is_recurring: 0
    });

    useEffect(() => { 
        loadCoreData();
        if (user.id && !String(user.id).startsWith('temp_')) {
            loadDependents();
            loadFinancials();
        }
    }, [user.id]);

    const loadCoreData = async () => {
        try {
            const [rolesRes, sysRes] = await Promise.all([
                systemService.getRoles(),
                systemService.getInfo()
            ]);
            setRoles(rolesRes.data.data || []);
            setSystemInfo(sysRes.data || DEFAULT_SYSTEM_INFO);
        } catch (e) { console.error("SRE Core Fail"); }
    };

    const loadDependents = async () => {
        try {
            const res = await userService.getDependents(user.id);
            setDependents(res.data.data || []);
        } catch (e) {}
    };

    const loadFinancials = async () => {
        setIsFinLoading(true);
        try {
            const res = await financialService.getAll({ user_id: user.id });
            setFinRecords(res.data.data || []);
        } catch (e) { console.error("Ledger Fail"); }
        finally { setIsFinLoading(false); }
    };

    const handleSaveFinance = async () => {
        if (!newRecord.description || !newRecord.amount) return alert("Erro: Campos obrigatórios ausentes.");
        setIsSaving(true);
        try {
            await financialService.create({ ...newRecord, user_id: user.id });
            setIsAddingFinance(false);
            setNewRecord({ description: '', amount: '', type: 'INCOME', category: 'CONDOMÍNIO', date: new Date().toISOString().slice(0, 10), status: 'PENDING', is_recurring: 0 });
            await loadFinancials();
        } catch (e) { alert("🛑 Falha ao comitar lançamento."); }
        finally { setIsSaving(false); }
    };

    const handleConfirmPayment = async (id: number | string) => {
        try {
            await financialService.update(id, { status: 'PAID' });
            loadFinancials();
        } catch (e) { alert("Erro ao liquidar título."); }
    };

    const handleSendReminder = async (record: FinancialRecord) => {
        if (!user.phone) return alert("Membro sem telefone cadastrado.");
        const msg = `Olá ${user.name.split(' ')[0]}, o ${systemInfo.shortName} informa que há um título pendente: ${record.description} no valor de R$ ${Number(record.amount).toLocaleString('pt-BR')} com vencimento em ${new Date(record.date).toLocaleDateString('pt-BR')}.`;
        
        try {
            await api.post('/communication/whatsapp-broadcast', {
                message: msg,
                targetType: 'DIRECT',
                directNumber: user.phone.replace(/\D/g, '')
            });
            alert("✅ Lembrete de faturamento disparado.");
        } catch (e) { alert("Falha no disparo."); }
    };

    const handleScheduleReminder = async (record: FinancialRecord) => {
        if (!user.phone) return alert("Telefone obrigatório para automação.");
        const scheduledDate = prompt("Defina data e hora para o lembrete (Formato: YYYY-MM-DD HH:mm):", `${new Date().toISOString().slice(0, 10)} 09:00`);
        if (!scheduledDate) return;

        const msg = `Olá {nome}, lembramos que o título "${record.description}" de R$ ${Number(record.amount).toLocaleString('pt-BR')} vence em breve (${new Date(record.date).toLocaleDateString('pt-BR')}). Administração ${systemInfo.shortName}.`;
        
        try {
            await communicationService.createSchedule({
                message: msg,
                targetType: 'USER',
                targetValue: user.id,
                scheduledAt: scheduledDate
            });
            alert("✅ Automação protocolada.");
        } catch (e) { alert("Falha ao agendar lembrete."); }
    };

    const handleGenerateAiDossier = async () => {
        setIsGeneratingDossier(true);
        try {
            const res = await aiService.generateUserDossier(user.id);
            setAiDossier(res.data.text || '');
        } catch (e) { alert("Falha no motor de inteligência."); } 
        finally { setIsGeneratingDossier(false); }
    };

    const handleDeleteFinance = async (id: number | string) => {
        if (!confirm("CONFIRMAR EXPURGO: Esta ação removerá o título do balanço. Prosseguir?")) return;
        try {
            await financialService.delete(id);
            loadFinancials();
        } catch (e) { alert("Falha na sincronia de deleção."); }
    };

    const handlePrintStatement = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html><head><title>Extrato Individual - ${user.name}</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; color: #1e293b; }
                    .header { border-bottom: 4px solid ${systemInfo.primaryColor || '#4f46e5'}; padding-bottom: 20px; margin-bottom: 30px; }
                    .title { font-size: 24px; font-weight: 900; text-transform: uppercase; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { text-align: left; padding: 12px; background: #f8fafc; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
                    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
                    .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; }
                </style>
                </head><body>
                <div class="header">
                    <div class="title">Extrato de Adimplência</div>
                    <p>Entidade: ${systemInfo.name} | Membro: ${user.name} | CPF: ${user.cpf_cnpj}</p>
                </div>
                <table>
                    <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Status</th><th>Valor</th></tr></thead>
                    <tbody>
                        ${finRecords.map(r => `
                            <tr>
                                <td>${new Date(r.date).toLocaleDateString('pt-BR')}</td>
                                <td>${r.description}</td>
                                <td>${r.category}</td>
                                <td>${r.status}</td>
                                <td style="text-align:right">R$ ${Number(r.amount).toLocaleString('pt-BR')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="footer">Documento auditado eletronicamente em ${new Date().toLocaleString()}</div>
                </body></html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload: any = { ...editingUser };
            if (tempPassword.trim()) payload.password = tempPassword;
            if (typeof editingUser.id === 'string' && editingUser.id.startsWith('temp_')) {
                const { id, ...clean } = payload;
                await userService.create(clean);
            } else {
                await userService.update(editingUser.id, payload);
            }
            onSaveSuccess();
        } catch (e) { alert("Sincronia Falhou."); }
        finally { setIsSaving(false); }
    };

    const filteredRecords = finRecords.filter(r => finFilter === 'ALL' || r.status === finFilter);
    const totalPaid = finRecords.filter(r => r.status === 'PAID').reduce((acc, r) => acc + Number(r.amount), 0);
    const totalPending = finRecords.filter(r => r.status === 'PENDING' || r.status === 'OVERDUE').reduce((acc, r) => acc + Number(r.amount), 0);

    return (
        <div className="sie-editor-overlay">
            <div className="sie-modal-container">
                {/* MODAL HEADER */}
                <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl border-b border-white/5">
                    <div className="flex items-center gap-5">
                        <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl" style={{ backgroundColor: systemInfo.primaryColor }}><UserIcon size={22}/></div>
                        <div>
                            <h3 className="font-black text-xl uppercase tracking-tighter leading-none">{editingUser.name || 'Nova Identidade'}</h3>
                            <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">{systemInfo.shortName} ID • {editingUser.role}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleSave} disabled={isSaving} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl active:scale-95" style={{ backgroundColor: systemInfo.primaryColor }}>
                            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Sincronizar Registro
                        </button>
                        <button onClick={onClose} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                    </div>
                </div>

                <div className="flex bg-slate-50 p-2 border-b shrink-0 gap-2 overflow-x-auto custom-scrollbar">
                    {[
                        { id: 'PERSONAL', label: 'Cadastro', icon: Info },
                        { id: 'FAMILY', label: 'Dependência', icon: Users },
                        { id: 'SOCIAL', label: 'Dossiê Social', icon: Heart },
                        { id: 'FINANCIAL', label: 'Ledger Financeiro', icon: Wallet },
                        { id: 'AI_DOSSIER', label: 'Analista Mentor', icon: Brain }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[150px] py-4 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-lg border border-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`} style={activeTab === tab.id ? { color: systemInfo.primaryColor } : {}}><tab.icon size={14} /> {tab.label}</button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#fdfdfe]">
                    <div className="max-w-6xl mx-auto space-y-12 pb-10">
                        {activeTab === 'PERSONAL' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fade-in">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xl focus:bg-white focus:border-indigo-500 shadow-inner outline-none uppercase" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil de Acesso</label>
                                    <select className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm uppercase shadow-inner appearance-none focus:bg-white focus:border-indigo-500" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})}>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF / Documento</label>
                                    <input className="w-full font-mono font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xl shadow-inner outline-none" value={editingUser.cpf_cnpj} onChange={e => setEditingUser({...editingUser, cpf_cnpj: formatCPF(e.target.value)})} maxLength={14} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Cluster</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xl uppercase shadow-inner outline-none" value={editingUser.unit} onChange={e => setEditingUser({...editingUser, unit: e.target.value})} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone WhatsApp</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-lg shadow-inner outline-none" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} placeholder="Ex: 11999998888" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado Cadastral</label>
                                    <div className="flex gap-3">
                                        {['ACTIVE', 'PENDING', 'VALIDATION_REQUIRED'].map(st => (
                                            <button key={st} onClick={() => setEditingUser({...editingUser, status: st as any})} className={`flex-1 py-4 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${editingUser.status === st ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`} style={editingUser.status === st ? { backgroundColor: systemInfo.primaryColor, borderColor: systemInfo.primaryColor } : {}}>{st.replace('_', ' ')}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'FAMILY' && (
                            <div className="animate-fade-in space-y-8">
                                <div className="flex justify-between items-center px-4">
                                    <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Grupo de Dependência</h4>
                                    <button onClick={async () => {
                                        const name = prompt("Nome do Membro Vinculado:");
                                        if(!name) return;
                                        try {
                                            await userService.create({ name, cpf_cnpj: `DEP_${Date.now()}`, parent_id: user.id, role: 'RESIDENT', status: 'ACTIVE', unit: user.unit });
                                            loadDependents();
                                        } catch (e) { alert("Erro ao vincular."); }
                                    }} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2"><Plus size={16}/> Vincular Membro</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {dependents.map(dep => (
                                        <div key={dep.id} className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner"><UserIcon size={20}/></div>
                                                <div><p className="text-sm font-black text-slate-800 uppercase leading-none">{dep.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">ID: {dep.id}</p></div>
                                            </div>
                                            <button onClick={() => userService.delete(dep.id).then(loadDependents)} className="p-3 text-slate-300 hover:text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                    {dependents.length === 0 && (
                                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 opacity-40"><Users size={48} className="mx-auto mb-4"/><p className="text-[10px] font-black uppercase">Vazio.</p></div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'SOCIAL' && (
                             <SocialQuestionnaire user={editingUser} onSave={(data) => setEditingUser({...editingUser, socialData: data})} onCancel={() => setActiveTab('PERSONAL')} />
                        )}

                        {activeTab === 'FINANCIAL' && (
                            <div className="animate-fade-in space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-5">
                                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner"><TrendingUp size={24}/></div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Quitados</p>
                                            <h4 className="text-2xl font-black text-slate-800">R$ {totalPaid.toLocaleString('pt-BR')}</h4>
                                        </div>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-5">
                                        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl shadow-inner"><AlertCircle size={24}/></div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Pendentes</p>
                                            <h4 className="text-2xl font-black text-rose-600">R$ {totalPending.toLocaleString('pt-BR')}</h4>
                                        </div>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-5">
                                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner" style={{ color: systemInfo.primaryColor }}><Activity size={24}/></div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Solvência</p>
                                            <h4 className="text-2xl font-black text-indigo-600" style={{ color: systemInfo.primaryColor }}>{totalPending > 0 ? 'ATENÇÃO' : 'EXCELENTE'}</h4>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
                                    <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><Wallet size={18} className="text-indigo-600"/> Ledger de Membro</h4>
                                        <div className="flex gap-3">
                                            <button onClick={handlePrintStatement} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm"><Printer size={18}/></button>
                                            <button onClick={() => setIsAddingFinance(!isAddingFinance)} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg">
                                                {isAddingFinance ? <X size={14}/> : <Plus size={14}/>} {isAddingFinance ? 'Abortar' : 'Lançar Título'}
                                            </button>
                                        </div>
                                    </div>

                                    {isAddingFinance && (
                                        <div className="p-10 bg-indigo-50/30 border-b border-indigo-100 animate-slide-up space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                                <div className="md:col-span-4 space-y-1.5"><label className="text-[9px] font-black uppercase text-indigo-400 ml-1">Descrição</label><input className="w-full h-12 bg-white border border-indigo-100 rounded-xl px-4 text-xs font-bold uppercase outline-none" value={newRecord.description} onChange={e => setNewRecord({...newRecord, description: e.target.value})} /></div>
                                                <div className="md:col-span-2 space-y-1.5"><label className="text-[9px] font-black uppercase text-indigo-400 ml-1">Valor (R$)</label><input type="number" className="w-full h-12 bg-white border border-indigo-100 rounded-xl px-4 text-xs font-bold outline-none" value={newRecord.amount} onChange={e => setNewRecord({...newRecord, amount: e.target.value})} /></div>
                                                <div className="md:col-span-3 space-y-1.5"><label className="text-[9px] font-black uppercase text-indigo-400 ml-1">Natureza</label><select className="w-full h-12 bg-white border border-indigo-100 rounded-xl px-4 text-[10px] font-black uppercase outline-none" value={newRecord.category} onChange={e => setNewRecord({...newRecord, category: e.target.value as any})}><option value="CONDOMÍNIO">Cota Normal</option><option value="OUTROS">Avulsos</option></select></div>
                                                <div className="md:col-span-3 space-y-1.5"><label className="text-[9px] font-black uppercase text-indigo-400 ml-1">Vencimento</label><input type="date" className="w-full h-12 bg-white border border-indigo-100 rounded-xl px-4 text-[10px] font-black outline-none" value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} /></div>
                                            </div>
                                            <button onClick={handleSaveFinance} className="px-12 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Confirmar Lançamento</button>
                                        </div>
                                    )}

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                                                <tr><th className="p-6">Descrição</th><th className="p-6">Vencimento</th><th className="p-6">Status</th><th className="p-6 text-right">Valor</th><th className="p-6 text-right">Ações</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredRecords.map(rec => (
                                                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors group">
                                                        <td className="p-6 text-xs font-black text-slate-800 uppercase">{rec.description}</td>
                                                        <td className="p-6 text-xs font-bold text-slate-500">{new Date(rec.date).toLocaleDateString('pt-BR')}</td>
                                                        <td className="p-6"><span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase border ${rec.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{rec.status}</span></td>
                                                        <td className={`p-6 text-right font-black text-base ${rec.status === 'PAID' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {Number(rec.amount).toLocaleString('pt-BR')}</td>
                                                        <td className="p-6 text-right"><div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">{rec.status === 'PENDING' && (<><button onClick={() => handleConfirmPayment(rec.id)} className="p-2 bg-emerald-500 text-white rounded-lg"><CheckCircle2 size={16}/></button><button onClick={() => handleSendReminder(rec)} className="p-2 bg-indigo-600 text-white rounded-lg"><MessageCircle size={16}/></button></>)}<button onClick={() => handleDeleteFinance(rec.id)} className="p-2 text-slate-300 hover:text-rose-600"><Trash2 size={16}/></button></div></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'AI_DOSSIER' && (
                            <div className="animate-fade-in space-y-10">
                                <div className="p-12 bg-slate-900 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-10">
                                    <div className="absolute top-0 right-0 p-10 opacity-10"><Brain size={240}/></div>
                                    <div className="relative z-10">
                                        <h3 className="text-4xl font-black tracking-tightest uppercase leading-tight">Analista de Perfil <br/> {systemInfo.shortName}.</h3>
                                        <p className="text-slate-400 text-sm font-medium mt-4 uppercase italic">Interpretador neural de solvência e participação.</p>
                                    </div>
                                    <button onClick={handleGenerateAiDossier} disabled={isGeneratingDossier} className="relative z-10 px-12 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl flex items-center gap-4 transition-all">
                                        {isGeneratingDossier ? <Loader2 className="animate-spin" size={24}/> : <Brain size={24}/>} {aiDossier ? 'Refazer Dossiê' : 'Gerar Dossiê IA'}
                                    </button>
                                </div>
                                {aiDossier && <div className="bg-white border border-slate-200 rounded-[3.5rem] p-16 shadow-inner font-serif text-lg leading-loose text-slate-800 uppercase animate-slide-up whitespace-pre-wrap">{aiDossier}</div>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo de Identidade {systemInfo.shortName}</span></div>
                    <button onClick={onClose} className="px-10 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600">Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default UserModal;

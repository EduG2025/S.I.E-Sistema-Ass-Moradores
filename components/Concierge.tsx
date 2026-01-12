
import React, { useState, useEffect } from 'react';
import { 
    UserCheck, Package, Clock, Shield, Search, Plus, 
    X, Save, Loader2, Trash2, Phone, Truck, UserPlus, 
    CheckCircle, AlertTriangle 
} from 'lucide-react';
import api from '../services/api';

const Concierge = () => {
    const [activeTab, setActiveTab] = useState<'VISITORS' | 'DELIVERIES'>('VISITORS');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => { loadData(); }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const route = activeTab === 'VISITORS' ? 'visitors' : 'deliveries';
            const res = await api.get(`/${route}`);
            setData(res.data.data || []);
        } catch (e) { setData([]); }
        finally { setLoading(false); }
    };

    const handleOpenCreate = () => {
        if (activeTab === 'VISITORS') {
            setEditingItem({ name: '', document: '', unit: '', phone: '', status: 'IN_CLUSTER', arrival_time: new Date().toISOString() });
        } else {
            setEditingItem({ courier: '', company: '', unit: '', recipient: '', status: 'PENDING', arrival_time: new Date().toISOString() });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: any) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const route = activeTab === 'VISITORS' ? 'visitors' : 'deliveries';
            if (editingItem.id) await api.put(`/${route}/${editingItem.id}`, editingItem);
            else await api.post(`/${route}`, editingItem);
            setIsModalOpen(false);
            loadData();
        } finally { setIsSaving(false); }
    };

    const handleUpdateStatus = async (item: any, newStatus: string) => {
        const route = activeTab === 'VISITORS' ? 'visitors' : 'deliveries';
        await api.put(`/${route}/${item.id}`, { ...item, status: newStatus });
        loadData();
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black tracking-tighter">Portaria Central</h2>
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">SRE Concierge Suite</p>
                </div>
                <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 relative z-10">
                    <button onClick={() => setActiveTab('VISITORS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'VISITORS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                        <UserPlus size={16}/> Visitantes
                    </button>
                    <button onClick={() => setActiveTab('DELIVERIES')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'DELIVERIES' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                        <Package size={16}/> Encomendas
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden flex-1">
                <div className="p-8 border-b flex justify-between items-center bg-slate-50/30">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                        <input className="w-full pl-12 pr-4 py-3 bg-white border rounded-xl text-[11px] font-bold" placeholder={`Buscar fluxo...`}/>
                    </div>
                    <button onClick={handleOpenCreate} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-600 transition-all flex items-center gap-3">
                        <Plus size={18}/> Registrar Entrada
                    </button>
                </div>
                {loading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40}/></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                                <tr>
                                    <th className="p-8">{activeTab === 'VISITORS' ? 'Identidade / Destino' : 'Courier / Pacote'}</th>
                                    <th className="p-8">Horário</th>
                                    <th className="p-8 text-center">Status</th>
                                    <th className="p-8 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-all group">
                                        <td className="p-8">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    {activeTab === 'VISITORS' ? <UserCheck size={20}/> : <Truck size={20}/>}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{activeTab === 'VISITORS' ? item.name : item.company}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Unid. {item.unit} • {activeTab === 'VISITORS' ? item.document : item.recipient}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <Clock size={14}/> {new Date(item.arrival_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="p-8 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${item.status === 'COMPLETED' || item.status === 'PICKED_UP' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                {item.status === 'IN_CLUSTER' ? 'No Local' : item.status === 'COMPLETED' ? 'Finalizado' : item.status === 'PENDING' ? 'Aguardando Retirada' : 'Entregue'}
                                            </span>
                                        </td>
                                        <td className="p-8 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                {activeTab === 'VISITORS' && item.status === 'IN_CLUSTER' && (
                                                    <button onClick={() => handleUpdateStatus(item, 'COMPLETED')} className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">Registrar Saída</button>
                                                )}
                                                {activeTab === 'DELIVERIES' && item.status === 'PENDING' && (
                                                    <button onClick={() => handleUpdateStatus(item, 'PICKED_UP')} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">Entregar ao Morador</button>
                                                )}
                                                <button onClick={() => api.delete(`/${activeTab.toLowerCase()}/${item.id}`).then(loadData)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {data.length === 0 && (
                                    <tr><td colSpan={4} className="p-32 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic">Nenhum fluxo registrado hoje.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && editingItem && (
                <div className="fixed inset-0 bg-slate-900/95 z-[2000] flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in">
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/10 animate-scale-in">
                        <form onSubmit={handleSave}>
                            <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="font-black text-2xl tracking-tighter uppercase">Novo Registro de Entrada</h3>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400"><X/></button>
                            </div>
                            <div className="p-10 space-y-6">
                                {activeTab === 'VISITORS' ? (
                                    <>
                                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Visitante / Prestador</label><input required className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} /></div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RG / CPF</label><input className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6" value={editingItem.document} onChange={e => setEditingItem({...editingItem, document: e.target.value})} /></div>
                                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unid. Destino</label><input required className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6" value={editingItem.unit} onChange={e => setEditingItem({...editingItem, unit: e.target.value})} /></div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Empresa / Transportadora</label><input required className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6" value={editingItem.company} onChange={e => setEditingItem({...editingItem, company: e.target.value})} /></div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destinatário</label><input required className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6" value={editingItem.recipient} onChange={e => setEditingItem({...editingItem, recipient: e.target.value})} /></div>
                                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unid.</label><input required className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6" value={editingItem.unit} onChange={e => setEditingItem({...editingItem, unit: e.target.value})} /></div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 text-slate-400 font-black text-xs uppercase tracking-widest">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="px-16 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3">
                                    {isSaving ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Protocolar Entrada
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Concierge;

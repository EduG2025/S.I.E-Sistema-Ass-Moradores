
import React, { useState, useEffect } from 'react';
import { Incident } from '../types';
import { operationsService } from '../services/api';
import { 
    Calendar, UserCheck, Search, Plus, MoreHorizontal, Loader2,
    CheckCircle, MapPin, ShieldAlert, X, AlertTriangle, UserPlus, Wrench, Settings2, Timer, Trash2, Edit2, Printer, Save
} from 'lucide-react';

const Operations = () => {
    const [activeTab, setActiveTab] = useState('INCIDENTS' as 'INCIDENTS' | 'CONCIERGE' | 'MAINTENANCE');
    const [isLoading, setIsLoading] = useState(true);
    const [incidents, setIncidents] = useState([] as Incident[]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingIncident, setEditingIncident] = useState<any>(null);

    useEffect(() => { loadData(); }, [activeTab]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const res = await operationsService.getIncidents();
            setIncidents(res.data);
        } finally { setIsLoading(false); }
    };

    const handleOpenCreate = () => {
        setEditingIncident({ title: '', location: '', priority: 'LOW', status: 'OPEN' });
        setIsModalOpen(true);
    };

    // FIX: Use any to bypass namespace 'React' error
    const handleSave = async (e: any) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingIncident.id) {
                await operationsService.updateIncident(editingIncident.id, editingIncident);
            } else {
                await operationsService.createIncident(editingIncident);
            }
            setIsModalOpen(false);
            loadData();
        } finally { setIsSaving(false); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Excluir registro permanentemente?")) return;
        await operationsService.deleteIncident(id);
        loadData();
    };

    const handlePrintReport = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html><head><title>Relatório Operacional</title><style>body{font-family:sans-serif;padding:40px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #eee;padding:12px;text-align:left}</style></head>
                <body>
                    <h1>S.I.E - Log de Ocorrências e SLA</h1>
                    <table><thead><tr><th>Assunto</th><th>Local</th><th>Prioridade</th><th>Status</th><th>Abertura</th></tr></thead>
                    <tbody>${incidents.map(i => `<tr><td>${i.title}</td><td>${i.location}</td><td>${i.priority}</td><td>${i.status}</td><td>${new Date().toLocaleDateString()}</td></tr>`).join('')}</tbody>
                    </table>
                </body></html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const getPriorityStyle = (priority: string) => {
        switch(priority) {
            case 'HIGH': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
             <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Watchdog Operacional</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Monitoramento Ativo de Ocorrências e Manutenção</p>
                </div>
                <div className="flex bg-white rounded-3xl p-1.5 shadow-sm border border-slate-200">
                    <button onClick={handlePrintReport} className="px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition-all flex items-center gap-2"><Printer size={16}/> Relatório SLA</button>
                    <button onClick={handleOpenCreate} className="px-6 py-2.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-600 transition-all flex items-center gap-2"><Plus size={16}/> Abrir Chamado</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex items-center gap-5 shadow-xl">
                    <div className="p-4 bg-rose-500 rounded-2xl shadow-lg shadow-rose-500/20"><AlertTriangle size={24}/></div>
                    <div><p className="text-[10px] font-black uppercase text-rose-300 tracking-widest">Severidade Alta</p><h4 className="text-2xl font-black">{incidents.filter(i => i.priority === 'HIGH').length}</h4></div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center gap-5">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Timer size={24}/></div>
                    <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tickets Ativos</p><h4 className="text-2xl font-black text-slate-800">{incidents.filter(i => i.status !== 'RESOLVED').length}</h4></div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto"/></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                                <tr><th className="p-8">Assunto / Local</th><th className="p-8 text-center">Severidade</th><th className="p-8 text-center">Status</th><th className="p-8 text-right">Ações</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {incidents.map(i => (
                                    <tr key={i.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-8"><div><p className="text-sm font-black text-slate-800">{i.title}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{i.location}</p></div></td>
                                        <td className="p-8 text-center"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${getPriorityStyle(i.priority)}`}>{i.priority}</span></td>
                                        <td className="p-8 text-center"><span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{i.status}</span></td>
                                        <td className="p-8 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                                                <button onClick={() => { setEditingIncident(i); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"><Edit2 size={16}/></button>
                                                <button onClick={() => handleDelete(Number(i.id))} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-scale-in">
                        <form onSubmit={handleSave}>
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="font-black text-xl text-slate-800 tracking-tighter">Gerenciar Ocorrência</h3>
                                <button type="button" onClick={() => setIsModalOpen(false)}><X/></button>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Título do Assunto</label><input required className="w-full" value={editingIncident.title} onChange={e => setEditingIncident({...editingIncident, title: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Localização</label><input required className="w-full" value={editingIncident.location} onChange={e => setEditingIncident({...editingIncident, location: e.target.value})} /></div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Prioridade</label>
                                        <select className="w-full" value={editingIncident.priority} onChange={e => setEditingIncident({...editingIncident, priority: e.target.value})}>
                                            <option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Crítica</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Status</label>
                                        <select className="w-full" value={editingIncident.status} onChange={e => setEditingIncident({...editingIncident, status: e.target.value})}>
                                            <option value="OPEN">Aberto</option><option value="IN_PROGRESS">Em Curso</option><option value="RESOLVED">Resolvido</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-xs uppercase">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-3">
                                    {isSaving ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Commitar Chamado
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Operations;

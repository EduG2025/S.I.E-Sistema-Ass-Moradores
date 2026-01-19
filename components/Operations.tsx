
import React, { useState, useEffect } from 'react';
import { Incident, SystemInfo } from '../types';
import { operationsService } from '../services/api';
import { 
    Plus, Loader2, ShieldAlert, X, Save, Edit2, Shield, Activity, MapPin, AlertCircle
} from 'lucide-react';

interface OperationsProps {
    systemInfo: SystemInfo;
}

const Operations = ({ systemInfo }: OperationsProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [incidents, setIncidents] = useState([] as Incident[]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingIncident, setEditingIncident] = useState<any>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const res = await operationsService.getIncidents();
            setIncidents(res.data?.data || []);
        } catch (e) { setIncidents([]); }
        finally { setIsLoading(false); }
    };

    const handleSave = async (e: any) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            if (editingIncident.id) await operationsService.updateIncident(editingIncident.id, editingIncident);
            else await operationsService.createIncident(editingIncident);
            setIsModalOpen(false);
            loadData();
        } finally { setIsSaving(false); }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in h-full relative">
             <div className="flex flex-row justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shrink-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-rose-600 rounded-2xl shadow-xl" style={{ backgroundColor: systemInfo.primaryColor || '#ef4444' }}><ShieldAlert size={24}/></div>
                    <div>
                        <h2 className="text-2xl font-black uppercase leading-none tracking-tighter">Ocorrências Watchdog</h2>
                        <p className="text-rose-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-80">Protocolo de Resiliência Operacional</p>
                    </div>
                </div>
                <button onClick={() => { setEditingIncident({ title: '', location: '', priority: 'LOW', status: 'OPEN' }); setIsModalOpen(true); }} className="px-10 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3" style={{ backgroundColor: systemInfo.primaryColor || '#ef4444' }}>
                    <Plus size={18}/> Abrir Chamado SRE
                </button>
            </div>

            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
                {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-rose-600 mx-auto" size={40}/></div> : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10">
                                <tr className="bg-white/95 backdrop-blur-md"><th className="p-8 border-b">Assunto / Protocolo</th><th className="p-8 text-center border-b">Severidade</th><th className="p-8 text-center border-b">Estado Atual</th><th className="p-8 text-right border-b">Ações</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {incidents.map(i => (
                                    <tr key={i.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-8">
                                            <div className="flex items-center gap-6">
                                                <div className="p-4 bg-slate-50 rounded-2xl text-slate-300 group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors"><Shield size={20}/></div>
                                                <div>
                                                    <p className="text-base font-black text-slate-800 uppercase tracking-tight">{i.title}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2"><MapPin size={12}/> {i.location}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8 text-center"><span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border shadow-sm ${i.priority === 'HIGH' || i.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>{i.priority}</span></td>
                                        <td className="p-8 text-center"><span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-xl border border-indigo-100 uppercase tracking-widest" style={{ color: systemInfo.primaryColor, borderColor: systemInfo.primaryColor + '40' }}>{i.status}</span></td>
                                        <td className="p-8 text-right"><button onClick={() => { setEditingIncident(i); setIsModalOpen(true); }} className="p-4 text-slate-300 hover:text-indigo-600 hover:bg-white hover:shadow-xl rounded-2xl transition-all border border-transparent hover:border-indigo-100"><Edit2 size={18}/></button></td>
                                    </tr>
                                ))}
                                {incidents.length === 0 && (
                                    <tr><td colSpan={4} className="p-40 text-center text-slate-300 font-black uppercase text-xs tracking-widest italic">Nenhuma ocorrência em aberto.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && editingIncident && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/5">
                            <div className="flex items-center gap-5">
                                <div className="p-3.5 bg-rose-600 rounded-xl shadow-xl"><Shield size={22}/></div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Protocolar Incidente</h3>
                                    <p className="text-rose-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">SRE Watchdog Module V5.0</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={handleSave} disabled={isSaving} className="px-8 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl active:scale-95">
                                    {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Commitar Chamado
                                </button>
                                <button onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#fdfdfe] relative">
                            <form onSubmit={handleSave} className="max-w-3xl mx-auto space-y-12 pb-10">
                                <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200 shadow-inner space-y-10">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título da Ocorrência</label>
                                        <input required className="w-full font-black h-16 bg-white border border-slate-200 rounded-2xl px-8 text-2xl focus:border-rose-500 transition-all shadow-sm" placeholder="Ex: Vazamento no Bloco B..." value={editingIncident.title} onChange={e => setEditingIncident({...editingIncident, title: e.target.value})} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Severidade</label>
                                            <select className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 text-sm uppercase appearance-none" value={editingIncident.priority} onChange={e => setEditingIncident({...editingIncident, priority: e.target.value as any})}>
                                                <option value="LOW">Baixa Severidade</option>
                                                <option value="MEDIUM">Operacional / Média</option>
                                                <option value="HIGH">Crítico / Alta</option>
                                                <option value="CRITICAL">EMERGÊNCIA SRE</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status do Ticket</label>
                                            <select className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 text-sm uppercase appearance-none" value={editingIncident.status} onChange={e => setEditingIncident({...editingIncident, status: e.target.value as any})}>
                                                <option value="OPEN">Aberto / Novo</option>
                                                <option value="IN_PROGRESS">Em Atendimento</option>
                                                <option value="RESOLVED">Resolvido</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Localização Exata</label>
                                        <input required className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 text-lg" value={editingIncident.location} onChange={e => setEditingIncident({...editingIncident, location: e.target.value})} />
                                    </div>
                                </div>
                                <div className="p-8 bg-rose-900/5 border border-rose-100 rounded-[2.5rem] flex items-start gap-6 shadow-sm">
                                    <div className="p-3 bg-white rounded-2xl text-rose-500 shadow-sm"><AlertCircle size={24}/></div>
                                    <div>
                                        <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight">Nota de Segurança</h4>
                                        <p className="text-[10px] text-rose-700 font-bold uppercase mt-1 leading-relaxed">Incidentes marcados como CRITICAL disparam alertas automáticos para a diretoria e canais de emergência.</p>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Watchdog Telemetry Active</span></div>
                            <div className="flex gap-4">
                                <button onClick={() => setIsModalOpen(false)} className="px-8 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Fechar</button>
                                <button onClick={handleSave} disabled={isSaving} className="px-12 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Comitar Chamado</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Operations;

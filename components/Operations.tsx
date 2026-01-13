
import React, { useState, useEffect } from 'react';
import { Incident } from '../types';
import { operationsService } from '../services/api';
import { 
    Plus, Loader2, ShieldAlert, X, Save, Edit2, Shield
} from 'lucide-react';

const Operations = () => {
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
        <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-fade-in h-full relative">
             <div className="flex flex-row justify-between items-center bg-slate-900 p-4 rounded-2xl text-white shadow-lg shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-600 rounded-lg"><ShieldAlert size={18}/></div>
                    <div>
                        <h2 className="text-base font-black uppercase leading-none">Ocorrências</h2>
                        <p className="text-rose-400 text-[8px] font-black uppercase tracking-widest mt-1">Watchdog Protocol</p>
                    </div>
                </div>
                <button onClick={() => { setEditingIncident({ title: '', location: '', priority: 'LOW', status: 'OPEN' }); setIsModalOpen(true); }} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                    <Plus size={14}/> Abrir Chamado
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
                {isLoading ? <div className="p-10 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto"/></div> : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10">
                                <tr className="bg-white/90"><th className="p-4">Assunto</th><th className="p-4 text-center">Severidade</th><th className="p-4 text-center">Status</th><th className="p-4 text-right">Ação</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {incidents.map(i => (
                                    <tr key={i.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-4"><div><p className="text-[11px] font-black text-slate-800">{i.title}</p><p className="text-[8px] text-slate-400 font-bold uppercase">{i.location}</p></div></td>
                                        <td className="p-4 text-center"><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${i.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>{i.priority}</span></td>
                                        <td className="p-4 text-center"><span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{i.status}</span></td>
                                        <td className="p-4 text-right"><button onClick={() => { setEditingIncident(i); setIsModalOpen(true); }} className="p-2 text-slate-300 hover:text-indigo-600"><Edit2 size={12}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && editingIncident && (
                <div className="sie-editor-overlay">
                    <div className="h-16 px-6 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-lg relative z-20">
                        <div className="flex items-center gap-3">
                            <Shield size={20} className="text-rose-400"/>
                            <h3 className="font-black text-xs uppercase tracking-widest leading-none">Protocolar Ocorrência</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg active:scale-95">
                                {isSaving ? <Loader2 className="animate-spin" size={12}/> : <Save size={14}/>} Commitar Chamado
                            </button>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-400 transition-all ml-2"><X size={32}/></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#fcfcfd]">
                        <div className="max-w-3xl mx-auto space-y-8 pb-10">
                            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Incidente</label>
                                    <input required className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-xl focus:bg-white focus:border-rose-500 transition-all shadow-inner" placeholder="Ex: Vazamento no Bloco B" value={editingIncident.title} onChange={e => setEditingIncident({...editingIncident, title: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Severidade</label><select className="w-full font-bold h-14 bg-slate-50 border rounded-2xl px-6 shadow-inner" value={editingIncident.priority} onChange={e => setEditingIncident({...editingIncident, priority: e.target.value as any})}><option value="LOW">Informativo (Baixa)</option><option value="MEDIUM">Operacional (Média)</option><option value="HIGH">Crítico (Alta)</option><option value="CRITICAL">EMERGÊNCIA SRE</option></select></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label><select className="w-full font-bold h-14 bg-slate-50 border rounded-2xl px-6 shadow-inner" value={editingIncident.status} onChange={e => setEditingIncident({...editingIncident, status: e.target.value as any})}><option value="OPEN">Aberto / Novo</option><option value="IN_PROGRESS">Em Curso</option><option value="RESOLVED">Resolvido</option></select></div>
                                </div>
                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Localização Exata</label><input required className="w-full font-bold h-14 bg-slate-50 border rounded-2xl px-6 shadow-inner" value={editingIncident.location} onChange={e => setEditingIncident({...editingIncident, location: e.target.value})} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Operations;


import React, { useState, useEffect } from 'react';
import { reservationService } from '../services/api';
import { Calendar, Plus, X, Loader2, Clock, MapPin, User, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';

const Reservations = () => {
    const [reservations, setReservations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [newRes, setNewRes] = useState({ area_name: 'SALÃO DE FESTAS', date: '', startTime: '10:00', endTime: '22:00' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await reservationService.getAll();
            // SRE FIX: Kernel CRUD retorna { data: [], pagination: {} }. Normalizando para array.
            const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
            setReservations(data);
        } catch (e) {
            console.error("[SRE] Falha ao listar reservas:", e);
            setReservations([]);
        } finally { setIsLoading(false); }
    };

    const handleSave = async (e: any) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        try {
            await reservationService.create(newRes);
            setIsModalOpen(false);
            loadData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Falha ao agendar reserva.');
        } finally { setIsSaving(false); }
    };

    const handleDelete = async (id: number) => {
        if(!confirm("Cancelar esta reserva?")) return;
        try {
            await reservationService.delete(id);
            loadData();
        } catch (e) {
            alert("Erro ao cancelar reserva.");
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter">Reservas de Áreas</h2>
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">SRE Agenda Common Resources</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 shadow-xl transition-all flex items-center gap-2">
                    <Plus size={18}/> Nova Reserva
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40}/></div> : 
                 reservations.map(r => (
                    <div key={r.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all group relative">
                        <button onClick={() => handleDelete(r.id)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Calendar size={20}/></div>
                            <div>
                                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">{r.area_name}</h3>
                                <p className="text-[10px] text-slate-400 font-bold">{new Date(r.date).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                <Clock size={14} className="text-slate-400"/> {r.startTime?.slice(0,5)} às {r.endTime?.slice(0,5)}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                <User size={14} className="text-slate-400"/> {r.userName || 'Membro S.I.E'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 z-[1000] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/10 animate-scale-in">
                        <form onSubmit={handleSave}>
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="font-black text-2xl tracking-tighter">Agendar Espaço</h3>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={24}/></button>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Área Comum</label>
                                    <select className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6" value={newRes.area_name} onChange={e => setNewRes({...newRes, area_name: e.target.value})}>
                                        <option value="SALÃO DE FESTAS">Salão de Festas</option>
                                        <option value="CHURRASQUEIRA 01">Churrasqueira 01</option>
                                        <option value="QUADRA POLIESPORTIVA">Quadra Poliesportiva</option>
                                    </select>
                                </div>
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data</label><input type="date" required className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6" value={newRes.date} onChange={e => setNewRes({...newRes, date: e.target.value})} /></div>
                            </div>
                            <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-xs uppercase">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-indigo-600 flex items-center gap-3">
                                    {isSaving ? <Loader2 className="animate-spin"/> : <CheckCircle size={18}/>} Confirmar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reservations;

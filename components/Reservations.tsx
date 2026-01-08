
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
            setReservations(res.data);
        } finally { setIsLoading(false); }
    };

    const handleSave = async (e: React.FormEvent) => {
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
        await reservationService.delete(id);
        loadData();
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter">Reservas de Áreas</h2>
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">SRE Agenda Common Resources</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-500 shadow-xl transition-all flex items-center gap-2">
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
                                <Clock size={14} className="text-slate-400"/> {r.startTime.slice(0,5)} às {r.endTime.slice(0,5)}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                <User size={14} className="text-slate-400"/> {r.userName} (Apt {r.userUnit})
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-50">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{r.status}</span>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-scale-in">
                        <form onSubmit={handleSave}>
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="font-black text-2xl tracking-tighter">Agendar Espaço</h3>
                                <button type="button" onClick={() => setIsModalOpen(false)}><X/></button>
                            </div>
                            <div className="p-10 space-y-6">
                                {error && <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-[10px] font-black uppercase text-center border border-rose-100 flex items-center justify-center gap-2 animate-bounce"><AlertTriangle size={14}/> {error}</div>}
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Área Comum</label>
                                    <select className="w-full font-bold" value={newRes.area_name} onChange={e => setNewRes({...newRes, area_name: e.target.value})}>
                                        <option value="SALÃO DE FESTAS">Salão de Festas</option><option value="CHURRASQUEIRA 01">Churrasqueira 01</option><option value="QUADRA POLIESPORTIVA">Quadra Poliesportiva</option><option value="ESPAÇO GOURMET">Espaço Gourmet</option>
                                    </select>
                                </div>
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data</label><input type="date" required className="w-full font-bold" value={newRes.date} onChange={e => setNewRes({...newRes, date: e.target.value})} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Início</label><input type="time" className="w-full font-bold" value={newRes.startTime} onChange={e => setNewRes({...newRes, startTime: e.target.value})} /></div>
                                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fim</label><input type="time" className="w-full font-bold" value={newRes.endTime} onChange={e => setNewRes({...newRes, endTime: e.target.value})} /></div>
                                </div>
                            </div>
                            <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-xs uppercase">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-3">
                                    {isSaving ? <Loader2 className="animate-spin"/> : <CheckCircle size={18}/>} Confirmar Agendamento
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

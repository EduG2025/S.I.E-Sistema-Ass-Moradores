import React, { useState, useEffect } from 'react';
import { AgendaEvent } from '../types';
import { agendaService } from '../services/api';
import { 
    Calendar as CalendarIcon, ChevronRight, X, Plus, Clock, Loader2, Trash2, Edit2, Save, Printer, MapPin, Activity
} from 'lucide-react';

const Timeline = () => {
  const [events, setEvents] = useState([] as AgendaEvent[]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
      try {
          setLoading(true);
          const res = await agendaService.getAll();
          const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
          setEvents(data);
      } catch (e) {
          setEvents([]);
      } finally { setLoading(false); }
  };

  const handleOpenCreate = () => {
      setEditingEvent({ title: '', description: '', date: new Date().toISOString().slice(0, 16), type: 'MEETING', status: 'UPCOMING' });
      setIsModalOpen(true);
  };

  const handleSave = async (e: any) => {
      e.preventDefault();
      setIsSaving(true);
      try {
          if (editingEvent.id) {
              await agendaService.update(editingEvent.id, editingEvent);
          } else {
              await agendaService.create(editingEvent);
          }
          setIsModalOpen(false);
          loadData();
      } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number | string) => {
      if (!confirm("Excluir este compromisso permanentemente?")) return;
      await agendaService.delete(id);
      loadData();
  };

  const getEventStyle = (type: AgendaEvent['type']) => {
      switch(type) {
          case 'MEETING': return 'bg-indigo-600 text-white shadow-indigo-600/30';
          case 'MAINTENANCE': return 'bg-amber-500 text-white shadow-amber-500/30';
          case 'DEADLINE': return 'bg-rose-600 text-white shadow-rose-600/30';
          default: return 'bg-emerald-600 text-white shadow-emerald-600/30';
      }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 h-full flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h2 className="text-4xl font-black text-slate-800 tracking-tightest leading-none">Timeline Operacional</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
                    <Activity size={12} className="text-emerald-500"/> SRE Event Stream Active
                </p>
            </div>
            <button onClick={handleOpenCreate} className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">
                <Plus size={20}/> Agendar Marco
            </button>
        </div>

        <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col p-2">
            {loading ? <div className="flex-1 flex flex-col items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={48}/><p className="mt-4 font-black uppercase text-[10px] tracking-widest text-slate-300">Lendo Fluxo Temporal...</p></div> : (
                <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
                    {Array.isArray(events) && events.map((event, idx) => (
                        <div key={event.id} className="relative flex gap-10 group">
                            {/* Linha da Timeline */}
                            {idx !== events.length - 1 && <div className="absolute left-10 top-20 bottom-0 w-1 bg-slate-100 rounded-full"></div>}
                            
                            <div className={`w-20 h-20 rounded-[2rem] shrink-0 flex items-center justify-center shadow-2xl z-10 transition-transform group-hover:scale-110 ${getEventStyle(event.type)}`}>
                                <CalendarIcon size={32}/>
                            </div>

                            <div className="flex-1 bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100 hover:bg-white hover:border-indigo-200 transition-all hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{event.type}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Clock size={12}/> {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <h4 className="font-black text-2xl text-slate-800 tracking-tight">{event.title}</h4>
                                    <p className="text-slate-500 font-medium leading-relaxed max-w-xl">{event.description}</p>
                                </div>

                                <div className="flex flex-col items-end gap-6 w-full md:w-auto shrink-0">
                                    <div className="text-right">
                                        <p className="text-3xl font-black text-slate-800 tracking-tightest">{new Date(event.date).getDate()}</p>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                            {new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' })}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => { setEditingEvent(event); setIsModalOpen(true); }} className="p-3 bg-white border border-slate-200 text-indigo-600 rounded-xl hover:shadow-lg transition-all"><Edit2 size={18}/></button>
                                        <button onClick={() => handleDelete(event.id)} className="p-3 bg-white border border-slate-200 text-rose-500 rounded-xl hover:shadow-lg transition-all"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {(!Array.isArray(events) || events.length === 0) && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-30 select-none">
                            <CalendarIcon size={120} className="mb-6"/>
                            <p className="font-black uppercase text-3xl tracking-[0.3em]">Timeline Limpa</p>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Modal de Agendamento SRE */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/90 z-[300] flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in">
                <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-scale-in">
                    <form onSubmit={handleSave}>
                        <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-indigo-600 rounded-2xl"><Plus size={24} /></div>
                                <div>
                                    <h3 className="font-black text-3xl tracking-tightest uppercase">Novo Marco Temporal</h3>
                                    <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-1">SRE Scheduler Protocol V22</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X size={32}/></button>
                        </div>

                        <div className="p-12 space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Evento</label>
                                <input required className="w-full font-black h-16 text-xl" value={editingEvent.title} onChange={e => setEditingEvent({...editingEvent, title: e.target.value})} placeholder="Ex: Vistoria Estrutural Bloco A" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data & Hora</label>
                                    <input type="datetime-local" className="w-full font-bold h-16" value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo Operacional</label>
                                    <select className="w-full font-bold h-16" value={editingEvent.type} onChange={e => setEditingEvent({...editingEvent, type: e.target.value as any})}>
                                        <option value="MEETING">Reunião de Conselho</option>
                                        <option value="MAINTENANCE">Manutenção Preventiva</option>
                                        <option value="EVENT">Evento Comunitário</option>
                                        <option value="DEADLINE">Prazo de Governança</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detalhamento Técnico</label>
                                <textarea rows={4} className="w-full font-medium" value={editingEvent.description} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} placeholder="Descreva o escopo e observações..." />
                            </div>
                        </div>

                        <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-6">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600">Abortar</button>
                            <button type="submit" disabled={isSaving} className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center gap-4">
                                {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} Commitar Agendamento
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Timeline;
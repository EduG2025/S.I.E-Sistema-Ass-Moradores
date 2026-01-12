
import React, { useState, useEffect } from 'react';
import { AgendaEvent } from '../types';
import { agendaService } from '../services/api';
import { 
    Calendar as CalendarIcon, ChevronRight, X, Plus, Clock, Loader2, Trash2, Edit2, Save, MapPin, Activity, AlertCircle, CheckCircle2
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
          const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setEvents(sorted);
      } catch (e) {
          setEvents([]);
      } finally { setLoading(false); }
  };

  const handleOpenCreate = () => {
      setEditingEvent({ title: '', description: '', date: new Date().toISOString().slice(0, 16), type: 'MEETING' as const, status: 'UPCOMING' as const, location: '' });
      setIsModalOpen(true);
  };

  const handleSave = async (e: any) => {
      e.preventDefault();
      if (!editingEvent.title || !editingEvent.date) return;
      setIsSaving(true);
      try {
          if (editingEvent.id) {
              await agendaService.update(editingEvent.id, editingEvent);
          } else {
              await agendaService.create(editingEvent);
          }
          setIsModalOpen(false);
          loadData();
          alert("✅ Marco sincronizado no Kernel.");
      } catch (err) {
          alert("Erro ao salvar marco temporal.");
      } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number | string) => {
      if (!confirm("Confirmar exclusão deste marco no cronograma?")) return;
      try {
          await agendaService.delete(id);
          loadData();
      } catch (err) {
          alert("Erro ao excluir.");
      }
  };

  const getEventConfig = (type: AgendaEvent['type']) => {
      switch(type) {
          case 'MEETING': return { color: 'bg-indigo-600', icon: CalendarIcon, label: 'Reunião' };
          case 'MAINTENANCE': return { color: 'bg-amber-500', icon: Activity, label: 'Manutenção' };
          case 'DEADLINE': return { color: 'bg-rose-600', icon: AlertCircle, label: 'Prazo' };
          default: return { color: 'bg-emerald-600', icon: CheckCircle2, label: 'Evento' };
      }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl shrink-0">
            <div>
                <h2 className="text-3xl font-black tracking-tightest leading-none">Cronograma Ativo</h2>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-2">SRE Timeline Core V92.5</p>
            </div>
            <button onClick={handleOpenCreate} className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-500 transition-all active:scale-95 shrink-0">
                <Plus size={20}/> Injetar Marco
            </button>
        </div>

        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20">
                    <Loader2 className="animate-spin text-indigo-600" size={48}/>
                    <p className="mt-4 font-black uppercase text-[10px] tracking-widest text-slate-300">Sincronizando Fluxo Temporal...</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-6 lg:p-12 custom-scrollbar">
                    <div className="max-w-5xl mx-auto space-y-8 relative">
                        <div className="absolute left-[39px] md:left-[49px] top-4 bottom-4 w-1 bg-slate-100 rounded-full hidden sm:block"></div>
                        
                        {events.map((event) => {
                            const config = getEventConfig(event.type);
                            const Icon = config.icon;
                            return (
                                <div key={event.id} className="relative flex flex-col sm:flex-row gap-6 md:gap-10 group animate-fade-in">
                                    <div className={`w-20 h-20 md:w-24 md:h-24 rounded-[2rem] shrink-0 flex items-center justify-center shadow-2xl z-10 transition-transform group-hover:scale-110 border-4 border-white ${config.color}`}>
                                        <Icon size={28} className="text-white"/>
                                    </div>
                                    
                                    <div className="flex-1 bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 transition-all hover:shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group/card">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex flex-wrap items-center gap-4">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full text-white ${config.color}`}>{config.label}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                    <Clock size={12}/> {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <h4 className="font-black text-xl md:text-2xl text-slate-800 tracking-tight leading-none">{event.title}</h4>
                                            <p className="text-slate-500 font-medium leading-relaxed max-w-2xl text-sm">{event.description}</p>
                                            {event.location && <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest"><MapPin size={12}/> {event.location}</div>}
                                        </div>
                                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto shrink-0 gap-6">
                                            <div className="text-right">
                                                <p className="text-3xl font-black text-slate-800 tracking-tightest leading-none">{new Date(event.date).getDate()}</p>
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">{new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' })}</p>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover/card:opacity-100 transition-all transform translate-x-4 group-hover/card:translate-x-0">
                                                <button onClick={() => { setEditingEvent(event); setIsModalOpen(true); }} className="p-3 bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-lg rounded-xl transition-all"><Edit2 size={18}/></button>
                                                <button onClick={() => handleDelete(event.id)} className="p-3 bg-slate-50 border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-white hover:shadow-lg rounded-xl transition-all"><Trash2 size={18}/></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {events.length === 0 && (
                            <div className="flex flex-col items-center justify-center text-slate-300 py-32 space-y-6">
                                <CalendarIcon size={80} className="opacity-10"/>
                                <p className="font-black uppercase text-sm tracking-[0.4em]">Fluxo Temporal Vazio</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-950/95 z-[2000] flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in">
                <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/10 animate-scale-in flex flex-col max-h-[90vh]">
                    <form onSubmit={handleSave} className="flex flex-col h-full">
                        <div className="p-8 lg:p-12 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl"><Plus size={24} /></div>
                                <div>
                                    <h3 className="font-black text-2xl lg:text-3xl tracking-tightest uppercase leading-none">Gerenciar Marco</h3>
                                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-2 flex items-center gap-2">Kernel Scheduler Core</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-white/10 rounded-2xl transition-all text-white"><X size={28}/></button>
                        </div>
                        <div className="p-8 lg:p-12 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-[#fcfcfd]">
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Evento</label><input required className="w-full font-black h-16 text-xl bg-white border-slate-200 rounded-2xl px-6 shadow-inner" value={editingEvent.title} onChange={e => setEditingEvent({...editingEvent, title: e.target.value})} /></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data & Hora Agendada</label><input type="datetime-local" className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 shadow-inner" value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} /></div>
                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria de Fluxo</label><select className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 shadow-inner appearance-none" value={editingEvent.type} onChange={e => setEditingEvent({...editingEvent, type: e.target.value as any})}><option value="MEETING">Reunião de Conselho</option><option value="MAINTENANCE">Manutenção Preventiva</option><option value="EVENT">Evento Comunitário</option><option value="DEADLINE">Prazo de Resolução</option></select></div>
                            </div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Localização Física / Virtual</label><input className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 shadow-inner" value={editingEvent.location} onChange={e => setEditingEvent({...editingEvent, location: e.target.value})} placeholder="Ex: Sede Social ou Meet" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição do Protocolo</label><textarea rows={4} className="w-full font-medium bg-white border-slate-200 rounded-2xl p-6 shadow-inner" value={editingEvent.description} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} /></div>
                        </div>
                        <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-6 shrink-0">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 text-slate-400 font-black text-xs uppercase tracking-widest">Abortar</button>
                            <button type="submit" disabled={isSaving} className="px-16 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center gap-4">{isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} Salvar Alterações</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Timeline;

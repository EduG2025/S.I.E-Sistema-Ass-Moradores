
import React, { useState, useEffect } from 'react';
import { AgendaEvent } from '../types';
import { agendaService } from '../services/api';
import { 
    Calendar as CalendarIcon, ChevronRight, X, Plus, Clock, Loader2, Trash2, Edit2, Save, Printer
} from 'lucide-react';

const Timeline = () => {
  const [events, setEvents] = useState([] as AgendaEvent[]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('LIST' as 'LIST' | 'CALENDAR');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
      try {
          setLoading(true);
          const res = await agendaService.getAll();
          setEvents(res.data);
      } finally { setLoading(false); }
  };

  const handleOpenCreate = () => {
      setEditingEvent({ title: '', description: '', date: new Date().toISOString().slice(0, 16), type: 'MEETING', status: 'UPCOMING' });
      setIsModalOpen(true);
  };

  // FIX: Use any to bypass namespace 'React' error
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

  const handlePrintTimeline = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`<html><head><title>Cronograma S.I.E</title><style>body{font-family:sans-serif;padding:50px} table{width:100%;border-collapse:collapse} th,td{border-bottom:1px solid #eee;padding:15px;text-align:left}</style></head><body><h1>Agenda Comunitária Ativa</h1><table><thead><tr><th>Data</th><th>Evento</th><th>Tipo</th></tr></thead><tbody>${events.map(e => `<tr><td>${new Date(e.date).toLocaleDateString()}</td><td><strong>${e.title}</strong><br/>${e.description}</td><td>${e.type}</td></tr>`).join('')}</tbody></table></body></html>`);
        printWindow.document.close();
        printWindow.print();
    }
  };

  const getEventColor = (type: AgendaEvent['type']) => {
      switch(type) {
          case 'MEETING': return 'bg-indigo-50 border-indigo-100 text-indigo-700';
          case 'MAINTENANCE': return 'bg-amber-50 border-amber-100 text-amber-700';
          case 'DEADLINE': return 'bg-rose-50 border-rose-100 text-rose-700';
          default: return 'bg-emerald-50 border-emerald-100 text-emerald-700';
      }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">Timeline Comunitária</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Prazos e Marcos Operacionais</p>
            </div>
            <div className="flex gap-4">
                <button onClick={handlePrintTimeline} className="p-3 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:text-emerald-600 transition-all"><Printer size={20}/></button>
                <button onClick={handleOpenCreate} className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all"><Plus size={16}/> Agendar Evento</button>
            </div>
        </div>

        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 p-10">
            {loading ? <Loader2 className="animate-spin text-indigo-600 mx-auto" size={40}/> : (
                <div className="space-y-4">
                    {events.map((event) => (
                        <div key={event.id} className={`p-8 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-center gap-6 transition-all hover:shadow-xl group ${getEventColor(event.type)}`}>
                            <div className="flex items-center gap-6 flex-1">
                                <div className="p-4 bg-white/50 rounded-2xl shadow-sm shrink-0"><CalendarIcon size={24}/></div>
                                <div><h4 className="font-black text-xl tracking-tight">{event.title}</h4><p className="text-sm font-medium opacity-70 mt-1">{event.description}</p></div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end shrink-0"><span className="text-xs font-black uppercase">{new Date(event.date).toLocaleDateString('pt-BR')}</span><span className="text-[10px] font-bold opacity-60 uppercase">{new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingEvent(event); setIsModalOpen(true); }} className="p-2 bg-white/40 hover:bg-white rounded-lg text-indigo-600"><Edit2 size={16}/></button>
                                    <button onClick={() => handleDelete(event.id)} className="p-2 bg-white/40 hover:bg-white rounded-lg text-rose-600"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && <div className="p-20 text-center text-slate-300 font-black uppercase text-xs">Vácuo temporal detectado. Nenhum evento agendado.</div>}
                </div>
            )}
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
                <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-scale-in">
                    <form onSubmit={handleSave}>
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-black text-2xl tracking-tighter">Gerenciar Compromisso</h3>
                            <button type="button" onClick={() => setIsModalOpen(false)}><X/></button>
                        </div>
                        <div className="p-10 space-y-6">
                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Título</label><input required className="w-full font-bold" value={editingEvent.title} onChange={e => setEditingEvent({...editingEvent, title: e.target.value})} /></div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data/Hora</label><input type="datetime-local" className="w-full font-bold" value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Categoria</label>
                                    <select className="w-full font-bold" value={editingEvent.type} onChange={e => setEditingEvent({...editingEvent, type: e.target.value})}>
                                        <option value="MEETING">Reunião</option><option value="MAINTENANCE">Manutenção</option><option value="EVENT">Evento</option><option value="DEADLINE">Prazo</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descrição</label><textarea rows={3} className="w-full font-medium" value={editingEvent.description} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} /></div>
                        </div>
                        <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-xs uppercase">Cancelar</button>
                            <button type="submit" disabled={isSaving} className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-3">
                                {isSaving ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Salvar na Timeline
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

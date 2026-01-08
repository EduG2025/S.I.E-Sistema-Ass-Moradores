
import React, { useState, useEffect } from 'react';
import { Alert, Notice } from '../types';
import { communicationService } from '../services/api';
import { 
    MessageSquare, Clock, Plus, Trash2, Edit2, X, Save, Printer, Loader2, Megaphone
} from 'lucide-react';

const Communication = () => {
  const [notices, setNotices] = useState([] as Notice[]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
      try {
          setIsLoading(true);
          const res = await communicationService.getNotices();
          setNotices(res.data);
      } finally { setIsLoading(false); }
  };

  const handleOpenCreate = () => {
      setEditingNotice({ title: '', content: '', urgency: 'LOW' });
      setIsModalOpen(true);
  };

  // FIX: Use any to bypass namespace 'React' error
  const handleSave = async (e: any) => {
      e.preventDefault();
      setIsSaving(true);
      try {
          if (editingNotice.id) {
              await communicationService.updateNotice(editingNotice.id, editingNotice);
          } else {
              await communicationService.sendNotice(editingNotice);
          }
          setIsModalOpen(false);
          loadData();
      } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number | string) => {
      if (!confirm("Excluir este comunicado?")) return;
      await communicationService.deleteNotice(id);
      loadData();
  };

  const handlePrintNotice = (notice: Notice) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`<html><head><title>Aviso S.I.E</title><style>body{font-family:sans-serif;padding:60px;text-align:center;border:10px solid #eee;height:90vh} h1{font-size:48px;margin-top:50px} p{font-size:24px;line-height:1.5;max-width:800px;margin:40px auto} .meta{font-size:14px;color:#999;margin-top:100px}</style></head><body><h1>COMUNICADO OFICIAL</h1><div style="font-size:32px;font-weight:bold;margin-bottom:40px">${notice.title}</div><p>${notice.content}</p><div class="meta">Publicado em ${new Date(notice.date).toLocaleDateString()} | S.I.E PRO - Gestão Ativa</div></body></html>`);
        printWindow.document.close();
        printWindow.print();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">Mural Digital & Broadcast</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Transparência e Avisos Comunitários</p>
            </div>
            <button onClick={handleOpenCreate} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-2">
                <Plus size={18}/> Novo Comunicado
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {isLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40}/></div> : 
             notices.map(notice => (
                <div key={notice.id} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 relative overflow-hidden group hover:border-indigo-400 hover:shadow-2xl transition-all flex flex-col">
                    <div className={`absolute left-0 top-0 bottom-0 w-3 ${notice.urgency === 'HIGH' ? 'bg-rose-500' : notice.urgency === 'MEDIUM' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                            <Clock size={12} className="text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(notice.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handlePrintNotice(notice)} className="p-3 text-slate-400 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all"><Printer size={18}/></button>
                            <button onClick={() => { setEditingNotice(notice); setIsModalOpen(true); }} className="p-3 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all"><Edit2 size={18}/></button>
                            <button onClick={() => handleDelete(notice.id)} className="p-3 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all"><Trash2 size={18}/></button>
                        </div>
                    </div>
                    <h3 className="font-black text-slate-800 text-2xl tracking-tight mb-4">{notice.title}</h3>
                    <p className="text-base text-slate-500 font-medium leading-relaxed flex-1">{notice.content}</p>
                    <div className="mt-8 flex justify-end">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${notice.urgency === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-500'}`}>{notice.urgency} Priority</span>
                    </div>
                </div>
            ))}
            {!isLoading && notices.length === 0 && <div className="col-span-full py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center text-slate-300 font-black uppercase text-xs tracking-widest">Silêncio no Mural. Nenhum aviso publicado.</div>}
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
                <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-scale-in">
                    <form onSubmit={handleSave}>
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-black text-2xl tracking-tighter">Configurar Comunicado</h3>
                            <button type="button" onClick={() => setIsModalOpen(false)}><X/></button>
                        </div>
                        <div className="p-10 space-y-6">
                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Título do Aviso</label><input required className="w-full font-bold" value={editingNotice.title} onChange={e => setEditingNotice({...editingNotice, title: e.target.value})} /></div>
                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Urgência</label>
                                <select className="w-full font-bold" value={editingNotice.urgency} onChange={e => setEditingNotice({...editingNotice, urgency: e.target.value})}>
                                    <option value="LOW">Informativo (Baixa)</option><option value="MEDIUM">Alerta (Média)</option><option value="HIGH">Crítico (Alta)</option>
                                </select>
                            </div>
                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Conteúdo</label><textarea rows={5} className="w-full font-medium" value={editingNotice.content} onChange={e => setEditingNotice({...editingNotice, content: e.target.value})} /></div>
                        </div>
                        <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-xs uppercase">Cancelar</button>
                            <button type="submit" disabled={isSaving} className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-3">
                                {isSaving ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Publicar no Mural
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Communication;


import React, { useState, useEffect } from 'react';
import { FinancialRecord } from '../types';
import { financialService } from '../services/api';
import { FINANCIAL_CATEGORIES } from '../constants';
import { 
    Plus, X, CreditCard,
    ArrowDownLeft, ArrowUpRight, Loader2, Save, Edit2, Wallet
} from 'lucide-react';

const Finance = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'RECEIVABLES' | 'PAYABLES'>('DASHBOARD');
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
      setIsLoading(true);
      try {
          const res = await financialService.getAll({ 
              type: activeTab === 'RECEIVABLES' ? 'INCOME' : activeTab === 'PAYABLES' ? 'EXPENSE' : undefined 
          });
          setRecords(res.data.data || []);
      } finally { setIsLoading(false); }
  };

  const handleSave = async () => {
    if (!editingRecord.description || !editingRecord.amount) return alert("Dados incompletos.");
    setIsSaving(true);
    try {
        if (editingRecord.id) await financialService.update(editingRecord.id, editingRecord);
        else await financialService.create(editingRecord);
        setIsModalOpen(false);
        loadData();
    } finally { setIsSaving(false); }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-fade-in relative h-full">
      {/* Slim Header - Ultra Compacto */}
      <div className="flex flex-row justify-between items-center bg-slate-900 p-4 rounded-2xl text-white shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg"><Wallet size={18}/></div>
          <div>
            <h2 className="text-base font-black uppercase leading-none">Tesouraria</h2>
            <p className="text-indigo-400 text-[8px] font-black uppercase tracking-widest mt-1">Gestão de Fluxo S.I.E</p>
          </div>
        </div>
        <button onClick={() => { setEditingRecord({ description: '', amount: '', type: 'INCOME', category: 'CONDOMÍNIO', date: new Date().toISOString().slice(0, 10), status: 'PENDING' }); setIsModalOpen(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center gap-2"><Plus size={14}/> Lançamento</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex bg-slate-50 p-1 border-b overflow-x-auto shrink-0">
              {['DASHBOARD', 'RECEIVABLES', 'PAYABLES'].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                     {tab === 'RECEIVABLES' ? 'Receitas' : tab === 'PAYABLES' ? 'Despesas' : tab}
                 </button>
             ))}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10 backdrop-blur-md">
                      <tr className="bg-white/90"><th className="p-4">Fluxo</th><th className="p-4">Categoria</th><th className="p-4 text-right">Valor</th><th className="p-4 text-right">Ação</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {isLoading ? (
                          <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" /></td></tr>
                      ) : records.map(r => (
                          <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="p-4">
                                  <div className="flex items-center gap-3">
                                      <div className={`p-1.5 rounded-md ${r.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                          {r.type === 'INCOME' ? <ArrowUpRight size={12}/> : <ArrowDownLeft size={12}/>}
                                      </div>
                                      <div><p className="font-black text-slate-800 text-[11px]">{r.description}</p><p className="text-[8px] text-slate-400 font-bold uppercase">{new Date(r.date).toLocaleDateString('pt-BR')}</p></div>
                                  </div>
                              </td>
                              <td className="p-4"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded-md border border-indigo-100">{r.category}</span></td>
                              <td className={`p-4 text-right font-black text-[11px] ${r.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {Number(r.amount).toLocaleString('pt-BR')}</td>
                              <td className="p-4 text-right"><button onClick={() => { setEditingRecord(r); setIsModalOpen(true); }} className="p-2 text-slate-300 hover:text-indigo-600"><Edit2 size={12}/></button></td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* TRUE FULL-CANVAS OVERLAY - Corrige o empacotamento restritivo */}
      {isModalOpen && editingRecord && (
          <div className="fixed inset-y-0 right-0 z-[1000] bg-[#fcfcfd] flex flex-col animate-slide-left shadow-2xl transition-all duration-300"
               style={{ left: document.querySelector('aside')?.classList.contains('lg:w-24') ? '96px' : '288px' }}>
              
              <div className="h-14 px-6 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-lg">
                  <div className="flex items-center gap-3">
                      <CreditCard size={16} className="text-indigo-400"/>
                      <h3 className="font-black text-[10px] uppercase tracking-widest">Protocolar Título</h3>
                  </div>
                  <div className="flex items-center gap-3">
                      <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2">
                          {isSaving ? <Loader2 className="animate-spin" size={12}/> : <Save size={12}/>} Commitar Título
                      </button>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-400"><X size={20}/></button>
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#fcfcfd]">
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                            <input required className="w-full font-bold h-12 bg-slate-50 border rounded-xl px-4 focus:bg-white transition-all shadow-inner" value={editingRecord.description} onChange={e => setEditingRecord({...editingRecord, description: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                                <input type="number" step="0.01" className="w-full font-black h-12 bg-slate-50 border rounded-xl px-4 focus:bg-white shadow-inner" value={editingRecord.amount} onChange={e => setEditingRecord({...editingRecord, amount: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                                <select className="w-full font-bold h-12 bg-slate-50 border rounded-xl px-4 shadow-inner" value={editingRecord.category} onChange={e => setEditingRecord({...editingRecord, category: e.target.value})}>
                                    {FINANCIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                                <select className="w-full font-bold h-12 bg-slate-50 border rounded-xl px-4 shadow-inner" value={editingRecord.type} onChange={e => setEditingRecord({...editingRecord, type: e.target.value as any})}>
                                    <option value="INCOME">Receita</option>
                                    <option value="EXPENSE">Despesa</option>
                                </select>
                            </div>
                        </div>
                    </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Finance;

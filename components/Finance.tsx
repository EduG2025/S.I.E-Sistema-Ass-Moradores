import React, { useState, useEffect } from 'react';
import { FinancialRecord, User } from '../types';
import { financialService, userService } from '../services/api';
import { FINANCIAL_CATEGORIES, RECURRENCE_PERIODS } from '../constants';
import { 
    Plus, Search, X, PieChart, FileText, CreditCard, ChevronRight,
    ArrowDownLeft, ArrowUpRight, Loader2, Save, Heart, Repeat, Calendar, Info, Trash2, Edit2, Printer, Filter,
    TrendingUp
} from 'lucide-react';

const Finance = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'RECEIVABLES' | 'PAYABLES' | 'REPORTS'>('DASHBOARD');
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-8 animate-fade-in overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl shrink-0">
        <div>
          <h2 className="text-2xl font-black tracking-tighter leading-none">Tesouraria S.I.E</h2>
          <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2">SRE Finance Hub V105.0</p>
        </div>
        <div className="flex flex-wrap bg-white/10 backdrop-blur-md rounded-2xl p-1 shrink-0 overflow-x-auto">
             {['DASHBOARD', 'RECEIVABLES', 'PAYABLES'].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-indigo-900 shadow-lg' : 'text-indigo-200 hover:text-white hover:bg-white/5'}`}>
                     {tab === 'RECEIVABLES' ? 'Receitas' : tab === 'PAYABLES' ? 'Despesas' : tab}
                 </button>
             ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
          <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl flex items-center justify-between group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 group-hover:scale-125 transition-transform"><TrendingUp size={80}/></div>
              <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Caixa Disponível</p>
                  <h3 className="text-3xl font-black mt-2 tracking-tighter">R$ {records.filter(r => r.type === 'INCOME').reduce((acc, r) => acc + Number(r.amount), 0).toLocaleString('pt-BR')}</h3>
              </div>
          </div>
          <button onClick={() => { setEditingRecord({ description: '', amount: '', type: 'INCOME', category: 'CONDOMÍNIO', date: new Date().toISOString().slice(0, 10), status: 'PENDING' }); setIsModalOpen(true); }} className="sm:col-span-1 lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-indigo-100 text-indigo-600 shadow-sm flex items-center justify-center gap-4 hover:bg-indigo-600 hover:text-white transition-all group active:scale-[0.98]">
              <Plus size={32} className="group-hover:rotate-90 transition-transform" /><span className="text-xl font-black uppercase tracking-widest">Lançamento Direto</span>
          </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
              <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                  <input type="text" placeholder="Filtrar lançamentos..." className="w-full pl-12 bg-white" />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                  <button className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"><Filter size={14}/> Filtros</button>
                  <button className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"><Printer size={14}/> Imprimir</button>
              </div>
          </div>
          
          <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10 backdrop-blur-md">
                      <tr><th className="p-6">Descrição / Fluxo</th><th className="p-6">Rubrica</th><th className="p-6 text-right">Valor Nominal</th><th className="p-6 text-right">Ações</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {isLoading ? (
                          <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" /></td></tr>
                      ) : records.length > 0 ? records.map(r => (
                          <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="p-6">
                                  <div className="flex items-center gap-4">
                                      <div className={`p-3 rounded-xl ${r.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                          {r.type === 'INCOME' ? <ArrowUpRight size={18}/> : <ArrowDownLeft size={18}/>}
                                      </div>
                                      <div className="min-w-0">
                                          <p className="font-black text-slate-800 text-sm truncate max-w-[200px]">{r.description}</p>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(r.date).toLocaleDateString('pt-BR')}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="p-6">
                                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg border border-indigo-100">{r.category}</span>
                              </td>
                              <td className={`p-6 text-right font-black text-base ${r.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {r.type === 'INCOME' ? '+' : '-'} R$ {Number(r.amount).toLocaleString('pt-BR')}
                              </td>
                              <td className="p-6 text-right">
                                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"><Edit2 size={16}/></button>
                                      <button className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 size={16}/></button>
                                  </div>
                              </td>
                          </tr>
                      )) : (
                          <tr><td colSpan={4} className="p-40 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic">Silêncio financeiro detectado.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/90 z-[1000] flex items-end justify-center backdrop-blur-xl animate-fade-in p-0 lg:p-6">
              <div className="bg-white rounded-t-[3.5rem] lg:rounded-[3.5rem] shadow-2xl w-full max-w-2xl h-[100vh] lg:h-auto overflow-hidden border-t border-white/20 animate-slide-up flex flex-col">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl"><CreditCard size={24}/></div>
                          <div>
                              <h3 className="font-black text-2xl tracking-tighter uppercase leading-none">Novo Lançamento</h3>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">Kernel SRE Protocol</p>
                          </div>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-4 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all border border-slate-100 bg-white"><X size={28}/></button>
                  </div>
                  <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                      <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200 shadow-inner">
                          <button type="button" onClick={() => setEditingRecord({...editingRecord, type: 'INCOME'})} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editingRecord.type === 'INCOME' ? 'bg-white text-emerald-600 shadow-xl border border-emerald-100' : 'text-slate-500'}`}>Receita / Crédito</button>
                          <button type="button" onClick={() => setEditingRecord({...editingRecord, type: 'EXPENSE'})} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editingRecord.type === 'EXPENSE' ? 'bg-white text-rose-600 shadow-xl border border-rose-100' : 'text-slate-500'}`}>Despesa / Débito</button>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição do Título</label>
                          <input required className="w-full font-bold h-14 bg-white border-slate-200 rounded-2xl" value={editingRecord.description} onChange={e => setEditingRecord({...editingRecord, description: e.target.value})} placeholder="Ex: Cota Extra Dezembro" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Nominal (R$)</label>
                              <input type="number" step="0.01" className="w-full font-black h-14 bg-white border-slate-200 rounded-2xl text-lg" value={editingRecord.amount} onChange={e => setEditingRecord({...editingRecord, amount: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rubrica / Categoria</label>
                              <select className="w-full font-black h-14 bg-white border-slate-200 rounded-2xl text-[10px] uppercase tracking-widest" value={editingRecord.category} onChange={e => setEditingRecord({...editingRecord, category: e.target.value})}>
                                  {FINANCIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                          </div>
                      </div>
                  </div>
                  <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50 shrink-0">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 text-slate-400 font-black text-xs uppercase tracking-widest">Abortar</button>
                      <button className="flex-1 md:flex-none px-16 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">Commitar ERP</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Finance;

import React, { useState, useEffect } from 'react';
import { FinancialRecord, User } from '../types';
import { financialService, userService } from '../services/api';
import { FINANCIAL_CATEGORIES, RECURRENCE_PERIODS } from '../constants';
import { 
    Plus, Search, X, PieChart, FileText, CreditCard, ChevronRight,
    ArrowDownLeft, ArrowUpRight, Loader2, Save, Heart, Repeat, Calendar, Info, Trash2, Edit2, Printer
} from 'lucide-react';

const Finance = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'RECEIVABLES' | 'PAYABLES' | 'REPORTS'>('DASHBOARD');
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  useEffect(() => { loadData(); loadUsers(); }, [activeTab]);

  const loadData = async () => {
      setIsLoading(true);
      try {
          const res = await financialService.getAll({ 
              type: activeTab === 'RECEIVABLES' ? 'INCOME' : activeTab === 'PAYABLES' ? 'EXPENSE' : undefined 
          });
          setRecords(res.data.data || []);
      } finally { setIsLoading(false); }
  };

  const loadUsers = async () => {
    try {
        const res = await userService.getAll();
        setUsers(res.data.data || []);
    } catch (e) {}
  };

  const handleOpenCreate = () => {
    setEditingRecord({ user_id: '', description: '', amount: '', type: 'INCOME', category: 'CONDOMÍNIO', date: new Date().toISOString().slice(0, 10), status: 'PENDING' });
    setIsModalOpen(true);
  };

  // FIX: Use any to bypass namespace 'React' error
  const handleSubmit = async (e: any) => {
      e.preventDefault();
      setIsSaving(true);
      try {
          if (editingRecord.id) {
              await financialService.update(editingRecord.id, editingRecord);
          } else {
              await financialService.create({ ...editingRecord, amount: parseFloat(editingRecord.amount) });
          }
          setIsModalOpen(false);
          loadData();
      } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
      if (!confirm("Estornar este lançamento permanentemente?")) return;
      await financialService.delete(id);
      loadData();
  };

  const handlePrintStatement = () => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
          printWindow.document.write(`
            <html><head><title>Balancete S.I.E</title><style>body{font-family:sans-serif;padding:30px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #eee;padding:10px;text-align:left} .header{text-align:center;margin-bottom:30px}</style></head>
            <body>
                <div class="header"><h1>S.I.E - Relatório Financeiro</h1><p>Emissão: ${new Date().toLocaleString()}</p></div>
                <table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor (R$)</th></tr></thead>
                <tbody>${records.map(r => `<tr><td>${new Date(r.date).toLocaleDateString()}</td><td>${r.description}</td><td>${r.category}</td><td>${Number(r.amount).toLocaleString()}</td></tr>`).join('')}</tbody>
                </table>
            </body></html>
          `);
          printWindow.document.close();
          printWindow.print();
      }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Financeiro S.I.E</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Gestão de Arrecadação e Fluxo de Caixa</p>
        </div>
        <div className="flex bg-white rounded-3xl p-1.5 shadow-sm border border-slate-200">
             <button onClick={handlePrintStatement} className="px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition-all flex items-center gap-2"><Printer size={16}/> Balancete</button>
             {['DASHBOARD', 'RECEIVABLES', 'PAYABLES'].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-indigo-600'}`}>
                     {tab === 'RECEIVABLES' ? 'Receitas' : tab === 'PAYABLES' ? 'Despesas' : tab}
                 </button>
             ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl flex items-center justify-between">
              <div><p className="text-[10px] font-black uppercase opacity-70">Recebido</p><h3 className="text-3xl font-black mt-2">R$ {records.filter(r => r.type === 'INCOME').reduce((acc, r) => acc + Number(r.amount), 0).toLocaleString('pt-BR')}</h3></div>
              <ArrowUpRight size={32} />
          </div>
          <button onClick={handleOpenCreate} className="md:col-span-3 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all">
              <Plus size={32} /><span className="text-xl font-black uppercase tracking-widest">Novo Lançamento Financeiro</span>
          </button>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr><th className="p-8">Descrição / Data</th><th className="p-8">Categoria</th><th className="p-8 text-right">Valor</th><th className="p-8 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {records.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="p-8">
                              <p className="font-black text-slate-800">{r.description}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(r.date).toLocaleDateString()}</p>
                          </td>
                          <td className="p-8"><span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg">{r.category}</span></td>
                          <td className={`p-8 text-right font-black ${r.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {Number(r.amount).toLocaleString('pt-BR')}</td>
                          <td className="p-8 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setEditingRecord(r); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"><Edit2 size={16}/></button>
                                  <button onClick={() => handleDelete(Number(r.id))} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 size={16}/></button>
                              </div>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-scale-in">
                  <form onSubmit={handleSubmit}>
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-black text-2xl tracking-tighter">Gerenciar Lançamento</h3>
                        <button type="button" onClick={() => setIsModalOpen(false)}><X size={28}/></button>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="flex bg-slate-100 p-1 rounded-2xl">
                            <button type="button" onClick={() => setEditingRecord({...editingRecord, type: 'INCOME'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${editingRecord.type === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Receita</button>
                            <button type="button" onClick={() => setEditingRecord({...editingRecord, type: 'EXPENSE'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${editingRecord.type === 'EXPENSE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Despesa</button>
                        </div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descrição</label><input required className="w-full font-bold" value={editingRecord.description} onChange={e => setEditingRecord({...editingRecord, description: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Valor (R$)</label><input type="number" step="0.01" className="w-full font-black" value={editingRecord.amount} onChange={e => setEditingRecord({...editingRecord, amount: e.target.value})} /></div>
                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Categoria</label>
                                <select className="w-full font-bold" value={editingRecord.category} onChange={e => setEditingRecord({...editingRecord, category: e.target.value})}>
                                    {FINANCIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-xs uppercase">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-3">
                            {isSaving ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Commitar ERP
                        </button>
                    </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Finance;

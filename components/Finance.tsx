
import React, { useState, useEffect } from 'react';
import { FinancialRecord } from '../types';
import { financialService } from '../services/api';
import { FINANCIAL_CATEGORIES } from '../constants';
import { 
    Plus, X, CreditCard,
    ArrowDownLeft, ArrowUpRight, Loader2, Save, Edit2, Wallet, Receipt, Shield
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
      <div className="flex flex-row justify-between items-center bg-slate-900 p-4 rounded-2xl text-white shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg"><Wallet size={18}/></div>
          <div>
            <h2 className="text-base font-black uppercase leading-none">Tesouraria SRE</h2>
            <p className="text-indigo-400 text-[8px] font-black uppercase tracking-widest mt-1">Gestão de Fluxo de Caixa Ativo</p>
          </div>
        </div>
        <button onClick={() => { setEditingRecord({ description: '', amount: '', type: 'INCOME', category: 'CONDOMÍNIO', date: new Date().toISOString().slice(0, 10), status: 'PENDING' }); setIsModalOpen(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center gap-2"><Plus size={14}/> Novo Lançamento</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex bg-slate-50 p-1 border-b overflow-x-auto shrink-0">
              {['DASHBOARD', 'RECEIVABLES', 'PAYABLES'].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 min-w-[150px] py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                     {tab === 'RECEIVABLES' ? 'Fluxo de Receitas' : tab === 'PAYABLES' ? 'Fluxo de Despesas' : 'Visão Geral'}
                 </button>
             ))}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10 backdrop-blur-md">
                      <tr className="bg-white/90"><th className="p-4">Identificação do Título</th><th className="p-4">Categoria / Classificação</th><th className="p-4 text-right">Montante</th><th className="p-4 text-right">Ação</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {isLoading ? (
                          <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" /></td></tr>
                      ) : records.map(r => (
                          <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="p-4">
                                  <div className="flex items-center gap-4">
                                      <div className={`p-2 rounded-xl shadow-sm ${r.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                          {r.type === 'INCOME' ? <ArrowUpRight size={14}/> : <ArrowDownLeft size={14}/>}
                                      </div>
                                      <div><p className="font-black text-slate-800 text-[12px]">{r.description}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{new Date(r.date).toLocaleDateString('pt-BR')}</p></div>
                                  </div>
                              </td>
                              <td className="p-4"><span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded-lg border border-indigo-100">{r.category}</span></td>
                              <td className={`p-4 text-right font-black text-[13px] ${r.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {Number(r.amount).toLocaleString('pt-BR')}</td>
                              <td className="p-4 text-right"><button onClick={() => { setEditingRecord(r); setIsModalOpen(true); }} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 size={16}/></button></td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {isModalOpen && editingRecord && (
          <div className="sie-editor-overlay">
              <div className="h-20 px-8 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-xl relative z-20">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-600 rounded-xl shadow-lg"><Receipt size={24}/></div>
                      <div>
                        <h3 className="font-black text-sm uppercase tracking-widest leading-none">Protocolar Título Financeiro</h3>
                        <p className="text-indigo-400 text-[8px] font-black uppercase mt-1 tracking-widest">SRE Ledger Compliance</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-4">
                      <button onClick={handleSave} disabled={isSaving} className="px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl active:scale-95">
                          {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={18}/>} Commitar Registro
                      </button>
                      <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-rose-500 hover:text-white text-slate-400 rounded-2xl transition-all border border-white/5 ml-2"><X size={28}/></button>
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar bg-white">
                  <div className="max-w-5xl mx-auto space-y-16 pb-20">
                    <div className="bg-slate-50 p-12 rounded-[4rem] border border-slate-200 shadow-inner space-y-12 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Descrição Detalhada do Título</label>
                            <input required className="w-full font-black h-20 bg-white border border-slate-200 rounded-[2rem] px-8 text-3xl focus:border-indigo-500 transition-all shadow-sm placeholder:text-slate-200" placeholder="Ex: Pagamento Fornecedor Alpha..." value={editingRecord.description} onChange={e => setEditingRecord({...editingRecord, description: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Montante (R$)</label>
                                <input type="number" step="0.01" className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-2xl focus:border-indigo-500 shadow-sm" value={editingRecord.amount} onChange={e => setEditingRecord({...editingRecord, amount: e.target.value})} />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Classificação</label>
                                <select className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-sm uppercase shadow-sm appearance-none focus:border-indigo-500" value={editingRecord.category} onChange={e => setEditingRecord({...editingRecord, category: e.target.value})}>
                                    {FINANCIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Natureza</label>
                                <select className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-sm uppercase shadow-sm appearance-none focus:border-indigo-500" value={editingRecord.type} onChange={e => setEditingRecord({...editingRecord, type: e.target.value as any})}>
                                    <option value="INCOME">Receita / Entrada</option>
                                    <option value="EXPENSE">Despesa / Saída</option>
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

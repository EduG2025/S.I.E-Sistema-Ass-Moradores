
import React, { useState, useEffect } from 'react';
import { FinancialRecord, SystemInfo } from '../types';
import { financialService, api } from '../services/api';
import { FINANCIAL_CATEGORIES } from '../constants';
import { 
    Plus, X, CreditCard,
    ArrowDownLeft, ArrowUpRight, Loader2, Save, Edit2, Wallet, Receipt, Shield,
    BarChart3, FileSpreadsheet, Printer, Download, Filter, RefreshCw, Heart, Calendar, Activity, TrendingUp, History,
    AlertCircle, Search, Eye, DollarSign
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';

interface FinanceProps {
  systemInfo: SystemInfo;
}

const Finance = ({ systemInfo }: FinanceProps) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'RECEIVABLES' | 'PAYABLES' | 'REPORTS' | 'AUDIT'>('DASHBOARD');
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [reportLogs, setReportLogs] = useState<any[]>([]);

  // Stats for Reports
  const [stats, setStats] = useState({ income: 0, expense: 0, pending: 0, donations: 0 });

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
      setIsLoading(true);
      try {
          if (activeTab === 'AUDIT') {
              const [auditRes, reportRes] = await Promise.all([
                  api.get('/audit'),
                  api.get('/reports')
              ]);
              setAuditLogs(auditRes.data.data || []);
              setReportLogs(reportRes.data.data || []);
          } else {
              const res = await financialService.getAll({ 
                  type: activeTab === 'RECEIVABLES' ? 'INCOME' : activeTab === 'PAYABLES' ? 'EXPENSE' : undefined 
              });
              const data = res.data.data || [];
              setRecords(data);
              
              const inc = data.reduce((acc: number, r: any) => r.type === 'INCOME' && r.status === 'PAID' ? acc + Number(r.amount) : acc, 0);
              const exp = data.reduce((acc: number, r: any) => r.type === 'EXPENSE' ? acc + Number(r.amount) : acc, 0);
              const pend = data.reduce((acc: number, r: any) => r.status !== 'PAID' ? acc + Number(r.amount) : acc, 0);
              const don = data.reduce((acc: number, r: any) => r.category === 'DOAÇÃO' ? acc + Number(r.amount) : acc, 0);
              setStats({ income: inc, expense: exp, pending: pend, donations: don });
          }
      } finally { setIsLoading(false); }
  };

  const handleSave = async (e: any) => {
    if (e) e.preventDefault();
    if (!editingRecord.description || !editingRecord.amount) return alert("Dados incompletos.");
    setIsSaving(true);
    try {
        if (editingRecord.id) await financialService.update(editingRecord.id, editingRecord);
        else await financialService.create(editingRecord);
        setIsModalOpen(false);
        loadData();
    } finally { setIsSaving(false); }
  };

  const handleExport = async (type: 'CSV' | 'PDF') => {
      await api.post('/reports/log', { title: `Relatório Financeiro ${type}`, type: 'EXPORT' });
      
      if (type === 'CSV') {
        const headers = ["Data", "Descrição", "Categoria", "Tipo", "Valor", "Status"];
        const csv = records.map(r => [
            new Date(r.date).toLocaleDateString(),
            r.description,
            r.category,
            r.type,
            r.amount,
            r.status
        ].join(";"));
        const content = "data:text/csv;charset=utf-8," + [headers.join(";"), ...csv].join("\n");
        const encodedUri = encodeURI(content);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `finance_${systemInfo.shortName}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
      } else {
          window.print();
      }
  };

  const categoryData = FINANCIAL_CATEGORIES.map(cat => ({
      name: cat,
      value: records.filter(r => r.category === cat).reduce((acc, r) => acc + Number(r.amount), 0)
  })).filter(c => c.value > 0);

  const COLORS = [systemInfo.primaryColor || '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-fade-in relative h-full">
      <div className="flex flex-row justify-between items-center bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-xl shrink-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-2xl" style={{ backgroundColor: systemInfo.primaryColor }}><Wallet size={24}/></div>
          <div>
            <h2 className="text-xl font-black uppercase leading-none tracking-tight">Tesouraria {systemInfo.shortName}</h2>
            <p className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.3em] mt-2 opacity-80">Gestão de Fluxo de Caixa e Governança</p>
          </div>
        </div>
        <div className="flex gap-3 relative z-10">
            <button onClick={() => handleExport('CSV')} className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 shadow-lg"><FileSpreadsheet size={16}/> Planilha</button>
            <button onClick={() => { setEditingRecord({ description: '', amount: '', type: 'INCOME', category: 'CONDOMÍNIO', date: new Date().toISOString().slice(0, 10), status: 'PENDING', is_recurring: 0 }); setIsModalOpen(true); }} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 transition-all" style={{ backgroundColor: systemInfo.primaryColor }}><Plus size={18}/> Novo Lançamento</button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex bg-slate-50 p-2 border-b overflow-x-auto shrink-0 gap-2">
              {[
                  {id: 'DASHBOARD', label: 'Visão Geral', icon: Activity},
                  {id: 'RECEIVABLES', label: 'Contas a Receber', icon: ArrowUpRight},
                  {id: 'PAYABLES', label: 'Contas a Pagar', icon: ArrowDownLeft},
                  {id: 'REPORTS', label: 'Business Intelligence', icon: BarChart3},
                  {id: 'AUDIT', label: 'Trilha de Auditoria', icon: History}
              ].map(tab => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[180px] py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-lg border border-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`} style={activeTab === tab.id ? { color: systemInfo.primaryColor } : {}}>
                     <tab.icon size={14}/> {tab.label}
                 </button>
             ))}
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fdfdfe]">
              {activeTab === 'REPORTS' ? (
                  <div className="p-12 space-y-12 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                           {[
                               { label: 'Efetivo em Caixa', value: stats.income - stats.expense, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                               { label: 'Doações Recebidas', value: stats.donations, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
                               { label: 'Inadimplência', value: stats.pending, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
                               { label: 'Saúde Fiscal', value: `${Math.round((stats.income / (stats.income + stats.pending || 1)) * 100)}%`, icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                           ].map((kpi, i) => (
                               <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                                   <div className={`p-4 rounded-2xl ${kpi.bg} ${kpi.color}`}><kpi.icon size={22}/></div>
                                   <div>
                                       <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{kpi.label}</p>
                                       <h4 className="text-xl font-black text-slate-800">{typeof kpi.value === 'number' ? `R$ ${kpi.value.toLocaleString('pt-BR')}` : kpi.value}</h4>
                                   </div>
                               </div>
                           ))}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                              <h4 className="text-xl font-black text-slate-800 uppercase tracking-tightest mb-10 flex items-center gap-3"><BarChart3 size={20} className="text-indigo-600"/> Alocação de Recursos</h4>
                              <div className="h-[350px]">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                          <Pie data={categoryData} innerRadius={80} outerRadius={110} paddingAngle={10} dataKey="value" stroke="none">
                                              {categoryData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                          </Pie>
                                          <Tooltip contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                                          <Legend verticalAlign="bottom" height={36}/>
                                      </PieChart>
                                  </ResponsiveContainer>
                              </div>
                          </div>
                          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                              <h4 className="text-xl font-black text-slate-800 uppercase tracking-tightest mb-10 flex items-center gap-3"><TrendingUp size={20} className="text-emerald-600"/> Histórico de Evolução</h4>
                              <div className="h-[350px]">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={records.slice(0,10).reverse()}>
                                          <XAxis dataKey="date" hide />
                                          <YAxis hide />
                                          <Tooltip />
                                          <Line type="monotone" dataKey="amount" stroke={systemInfo.primaryColor || "#4f46e5"} strokeWidth={4} dot={{r:6}} activeDot={{r:10}} />
                                      </LineChart>
                                  </ResponsiveContainer>
                              </div>
                          </div>
                      </div>
                  </div>
              ) : activeTab === 'AUDIT' ? (
                  <div className="p-12 animate-fade-in space-y-12">
                      <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex justify-between items-center relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-8 opacity-10"><History size={160}/></div>
                           <div className="relative z-10">
                               <h4 className="text-3xl font-black uppercase tracking-tightest">Compliance {systemInfo.shortName}</h4>
                               <p className="text-indigo-300 text-[11px] font-bold uppercase mt-2 tracking-[0.4em]">Trilha de auditoria para integridade de dados financeiros</p>
                           </div>
                           <div className="flex gap-4 relative z-10">
                                <div className="bg-white/5 px-6 py-4 rounded-2xl border border-white/10 text-center">
                                    <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Ações Logadas</p>
                                    <p className="text-xl font-black text-white">{auditLogs.length}</p>
                                </div>
                                <div className="bg-white/5 px-6 py-4 rounded-2xl border border-white/10 text-center">
                                    <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Exportações</p>
                                    <p className="text-xl font-black text-emerald-400">{reportLogs.length}</p>
                                </div>
                           </div>
                      </div>

                      <div className="space-y-6">
                          <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-3"><Activity size={16}/> Logs de Alteração de Registro</h5>
                          <div className="grid grid-cols-1 gap-4">
                              {auditLogs.filter(l => l.table_name === 'financials').map(log => (
                                  <div key={log.id} className="p-6 bg-white border border-slate-100 rounded-3xl flex justify-between items-center group hover:border-indigo-200 transition-all hover:shadow-lg">
                                      <div className="flex items-center gap-6">
                                          <div className={`p-4 rounded-2xl shadow-inner ${log.action === 'DELETE' ? 'bg-rose-50 text-rose-500' : log.action === 'UPDATE' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                              <Shield size={20}/>
                                          </div>
                                          <div>
                                              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Evento {log.action} #ID:{log.record_id}</p>
                                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                  Executado por UserID: {log.user_id} • {new Date(log.created_at).toLocaleString('pt-BR')}
                                              </p>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                          <span className="text-[10px] font-black text-slate-400 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 max-w-[300px] truncate">{log.details}</span>
                                          <button className="p-3 text-slate-300 hover:text-indigo-600 bg-slate-50 rounded-xl"><Eye size={18}/></button>
                                      </div>
                                  </div>
                              ))}
                              {auditLogs.length === 0 && (
                                  <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                      <History size={48} className="mx-auto text-slate-200 mb-4 opacity-30"/>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhuma alteração registrada nesta sessão.</p>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              ) : (
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10 backdrop-blur-md">
                      <tr className="bg-white/95"><th className="p-8 border-b">Protocolo do Título</th><th className="p-8 border-b">Modo / Classificação</th><th className="p-8 text-right border-b">Montante Efetivo</th><th className="p-8 text-right border-b">Gestão</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {isLoading ? (
                          <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={40} /></td></tr>
                      ) : records.map(r => (
                          <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="p-8">
                                  <div className="flex items-center gap-6">
                                      <div className={`p-4 rounded-2xl shadow-sm ${r.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                          {r.type === 'INCOME' ? <ArrowUpRight size={20}/> : <ArrowDownLeft size={20}/>}
                                      </div>
                                      <div>
                                          <p className="font-black text-slate-800 text-base">{r.description}</p>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                              <Calendar size={12}/> {new Date(r.date).toLocaleDateString('pt-BR')} 
                                              {!!(r as any).user_id && <span className="text-indigo-400 font-black">• Membro Vinculado</span>}
                                          </p>
                                      </div>
                                  </div>
                              </td>
                              <td className="p-8">
                                  <div className="flex items-center gap-3">
                                      <span className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-xl border ${r.category === 'DOAÇÃO' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>{r.category}</span>
                                      {(r as any).is_recurring ? <span title="Recorrência Ativa" className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100"><RefreshCw size={12} /></span> : null}
                                  </div>
                              </td>
                              <td className={`p-8 text-right font-black text-lg ${r.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {Number(r.amount).toLocaleString('pt-BR')}</td>
                              <td className="p-8 text-right"><button onClick={() => { setEditingRecord(r); setIsModalOpen(true); }} className="p-4 text-slate-300 hover:text-indigo-600 hover:bg-white hover:shadow-xl rounded-2xl transition-all border border-transparent hover:border-indigo-100"><Edit2 size={18}/></button></td>
                          </tr>
                      ))}
                      {records.length === 0 && !isLoading && (
                          <tr><td colSpan={4} className="p-40 text-center bg-white"><div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6"><Receipt size={32} className="text-slate-200"/></div><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhum título localizado no cluster.</p></td></tr>
                      )}
                  </tbody>
                </table>
              )}
          </div>
      </div>

      {isModalOpen && editingRecord && (
          <div className="sie-editor-overlay">
              <div className="sie-modal-container">
                  <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/5">
                      <div className="flex items-center gap-5">
                          <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl" style={{ backgroundColor: systemInfo.primaryColor }}><DollarSign size={22}/></div>
                          <div>
                            <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Protocolo Financeiro</h3>
                            <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">Ledger Individual - {systemInfo.shortName}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <button onClick={handleSave} disabled={isSaving} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-2xl active:scale-95" style={{ backgroundColor: systemInfo.primaryColor }}>
                              {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Sincronizar Registro
                          </button>
                          <button onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#fdfdfe] relative">
                    <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-12 pb-10">
                        <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200 shadow-inner space-y-10">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificação do Título</label>
                                <input required className="w-full font-black h-16 bg-white border border-slate-200 rounded-2xl px-8 text-2xl focus:border-indigo-500 transition-all shadow-sm" placeholder="Ex: Mensalidade - Unidade 104..." value={editingRecord.description} onChange={e => setEditingRecord({...editingRecord, description: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Montante (R$)</label>
                                    <input type="number" step="0.01" className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 text-xl focus:border-indigo-500" value={editingRecord.amount} onChange={e => setEditingRecord({...editingRecord, amount: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                                    <select className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 text-sm uppercase appearance-none" value={editingRecord.category} onChange={e => setEditingRecord({...editingRecord, category: e.target.value})}>
                                        {FINANCIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Natureza Ledger</label>
                                    <select className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 text-sm uppercase appearance-none" value={editingRecord.type} onChange={e => setEditingRecord({...editingRecord, type: e.target.value as any})}>
                                        <option value="INCOME">Receita / Entrada</option>
                                        <option value="EXPENSE">Despesa / Saída</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-8 bg-indigo-900/5 border border-indigo-100 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-center shadow-sm">
                                <div className="flex items-center gap-5 flex-1">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm text-indigo-600" style={{ color: systemInfo.primaryColor }}><RefreshCw size={24}/></div>
                                    <div>
                                        <p className="text-sm font-black text-indigo-950 uppercase tracking-tight">Recorrência Periódica</p>
                                        <p className="text-[9px] text-indigo-400 font-bold uppercase mt-1 tracking-widest">Automação de títulos e cobrança ativa.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={!!editingRecord.is_recurring} onChange={e => setEditingRecord({...editingRecord, is_recurring: e.target.checked ? 1 : 0})} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                    {editingRecord.is_recurring === 1 && (
                                        <select className="bg-white border border-indigo-100 rounded-lg px-4 py-2 text-[10px] font-black uppercase" value={editingRecord.billing_cycle || 'MONTHLY'} onChange={e => setEditingRecord({...editingRecord, billing_cycle: e.target.value})}>
                                            <option value="MONTHLY">Mensal</option>
                                            <option value="YEARLY">Anual</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                  </div>
                  
                  <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                       <div className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo Consolidado</span></div>
                       <div className="flex gap-4">
                          <button onClick={() => setIsModalOpen(false)} className="px-8 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Fechar</button>
                          <button onClick={handleSave} disabled={isSaving} className="px-10 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all">Salvar</button>
                       </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Finance;

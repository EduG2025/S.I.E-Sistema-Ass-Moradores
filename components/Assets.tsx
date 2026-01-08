
import React, { useState, useEffect } from 'react';
import { Landmark, Search, Plus, Box, Download, Loader2, DollarSign, ShieldCheck, Trash2, Edit2, X, Save, User as UserIcon, Printer } from 'lucide-react';
import { assetService, userService } from '../services/api';
import { Asset, User } from '../types';

const Assets = () => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => { loadAssets(); loadUsers(); }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const res = await assetService.getAll();
      setItems(res.data);
    } finally { setLoading(false); }
  };

  const loadUsers = async () => {
    try {
      const res = await userService.getAll();
      setUsers(res.data.data);
    } catch (e) {}
  };

  const handleOpenCreate = () => {
    setEditingItem({ name: '', category: 'Equipamento', value: 0, status: 'PERFEITO', date_acquired: new Date().toISOString().split('T')[0], responsible_id: '' });
    setIsModalOpen(true);
  };

  // FIX: Use any to bypass namespace 'React' error
  const handleSave = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingItem.id) {
          await assetService.update(editingItem.id, editingItem);
      } else {
          await assetService.create(editingItem);
      }
      setIsModalOpen(false);
      loadAssets();
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
      if (!confirm("Excluir este ativo permanentemente?")) return;
      await assetService.delete(id);
      loadAssets();
  };

  const handlePrintInventory = () => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
          printWindow.document.write(`
            <html><head><title>Inventário S.I.E</title><style>body{font-family:sans-serif;padding:30px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #eee;padding:10px;text-align:left}</style></head>
            <body>
                <h1>S.I.E - Inventário de Ativos Comunitários</h1>
                <p>Total de Itens: ${items.length} | Valor Total: R$ ${items.reduce((acc, i) => acc + Number(i.value), 0).toLocaleString()}</p>
                <table><thead><tr><th>Item</th><th>Categoria</th><th>Estado</th><th>Valor (R$)</th></tr></thead>
                <tbody>${items.map(i => `<tr><td>${i.name}</td><td>${i.category}</td><td>${i.status}</td><td>${Number(i.value).toLocaleString()}</td></tr>`).join('')}</tbody>
                </table>
            </body></html>
          `);
          printWindow.document.close();
          printWindow.print();
      }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'PERFEITO': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'MANUTENÇÃO': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'BOM': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-amber-500 mx-auto" size={56}/></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Patrimônio S.I.E</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Inventário e Controle de Ativos</p>
        </div>
        <div className="flex gap-2">
            <button onClick={handlePrintInventory} className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:text-emerald-600 transition-all"><Printer size={20}/></button>
            <button onClick={handleOpenCreate} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-amber-600 transition-all flex items-center gap-2">
              <Plus size={18}/> Novo Registro
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-amber-600 p-8 rounded-[2.5rem] text-white shadow-xl">
              <p className="text-[10px] font-black uppercase opacity-80">Valor Total Estimado</p>
              <h3 className="text-4xl font-black mt-2 tracking-tighter">R$ {items.reduce((acc, i) => acc + Number(i.value), 0).toLocaleString('pt-BR')}</h3>
          </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
              <div className="relative max-w-md w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                  <input type="text" placeholder="Pesquisar itens..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 bg-white" />
              </div>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr><th className="p-8">Ativo / ID</th><th className="p-8">Estado</th><th className="p-8 text-right">Avaliação</th><th className="p-8 text-right">Ações</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="p-8"><p className="text-sm font-black text-slate-800">{item.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{item.category}</p></td>
                              <td className="p-8"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${getStatusStyle(item.status)}`}>{item.status}</span></td>
                              <td className="p-8 text-right font-black">R$ {Number(item.value).toLocaleString('pt-BR')}</td>
                              <td className="p-8 text-right">
                                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                                      <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"><Edit2 size={16}/></button>
                                      <button onClick={() => handleDelete(Number(item.id))} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 size={16}/></button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-scale-in">
            <form onSubmit={handleSave}>
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-black text-xl text-slate-800 tracking-tighter">Gerenciar Registro Patrimonial</h3>
                <button type="button" onClick={() => setIsModalOpen(false)}><X/></button>
              </div>
              <div className="p-10 space-y-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Identificação do Ativo</label><input required className="w-full" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Valor (R$)</label><input type="number" step="0.01" className="w-full" value={editingItem.value} onChange={e => setEditingItem({...editingItem, value: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Estado</label>
                      <select className="w-full font-bold" value={editingItem.status} onChange={e => setEditingItem({...editingItem, status: e.target.value})}>
                          <option value="PERFEITO">Perfeito</option><option value="BOM">Bom</option><option value="MANUTENÇÃO">Manutenção</option><option value="DEPRECIADO">Depreciado</option>
                      </select>
                  </div>
                </div>
              </div>
              <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-xs uppercase">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-3">
                  {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Salvar Inventário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;


import React, { useState, useEffect } from 'react';
import { MarketItem, User } from '../types';
import { marketplaceService, authService } from '../services/api';
import { 
  ShoppingBag, Search, Plus, Filter, 
  MessageCircle, Star, MapPin, Loader2,
  Tag, Utensils, Wrench, Package, Info, X, Save,
  Trash2, Edit2, Printer, LayoutGrid, User as UserIcon
} from 'lucide-react';

const MarketPlace = () => {
  const [items, setItems] = useState([] as MarketItem[]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL' as MarketItem['category'] | 'ALL');
  const [viewMode, setViewMode] = useState<'GLOBAL' | 'MY_ITEMS'>('GLOBAL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [itemsRes, userRes] = await Promise.all([
        marketplaceService.getAll(),
        authService.me()
      ]);
      setItems(itemsRes.data);
      setCurrentUser(userRes.data);
    } catch (e) {
      console.error("[SRE] Falha ao carregar marketplace.");
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const res = await marketplaceService.getAll();
      setItems(res.data);
    } catch (e) {}
  };

  const handleOpenCreate = () => {
    setEditingItem({ title: '', description: '', category: 'GOODS', price: 0, whatsapp: '' });
    setIsModalOpen(true);
  };

  // FIX: Use any to bypass namespace 'React' error
  const handleSave = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingItem.id) {
        await marketplaceService.update(editingItem.id, editingItem);
      } else {
        await marketplaceService.create({ ...editingItem, merchant_id: currentUser?.id });
      }
      setIsModalOpen(false);
      loadItems();
    } catch (e) {
      alert("Falha ao salvar anúncio.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover este anúncio permanentemente?")) return;
    try {
      await marketplaceService.delete(id);
      loadItems();
    } catch (e) {
      alert("Erro ao excluir.");
    }
  };

  const handlePrintCatalog = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        const catalogItems = items.filter(i => activeCategory === 'ALL' || i.category === activeCategory);
        printWindow.document.write(`
            <html><head><title>Catálogo S.I.E</title><style>
                body{font-family:sans-serif;padding:40px} 
                .header{border-bottom:2px solid #10b981;margin-bottom:30px;padding-bottom:10px;text-align:center} 
                .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
                .item{border:1px solid #eee;padding:15px;border-radius:10px}
                .price{color:#10b981;font-weight:bold}
                .meta{font-size:10px;color:#666}
            </style></head>
            <body>
                <div class="header"><h1>Vitrine de Economia Circular S.I.E</h1><p>Categoria: ${activeCategory} | Emissão: ${new Date().toLocaleDateString()}</p></div>
                <div class="grid">
                    ${catalogItems.map(i => `
                        <div class="item">
                            <h3>${i.title}</h3>
                            <p>${i.description}</p>
                            <div class="price">R$ ${Number(i.price).toLocaleString('pt-BR')}</div>
                            <div class="meta">${i.merchantName} - Unidade ${i.unit}</div>
                        </div>
                    `).join('')}
                </div>
            </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-emerald-600 mx-auto" size={48}/></div>;

  const filteredItems = items.filter(i => {
    const categoryMatch = activeCategory === 'ALL' || i.category === activeCategory;
    const searchMatch = i.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       i.description.toLowerCase().includes(searchTerm.toLowerCase());
    const ownershipMatch = viewMode === 'GLOBAL' || String(i.merchant_id) === String(currentUser?.id);
    return categoryMatch && searchMatch && ownershipMatch;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="bg-emerald-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
              <div className="space-y-6 max-w-2xl">
                  <div className="flex items-center gap-3 px-4 py-1.5 bg-white/10 rounded-full w-fit border border-white/10 backdrop-blur-md">
                      <ShoppingBag size={16} className="text-emerald-400"/>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Economia Circular Ativa</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">Negócios Locais, <br/>Impacto Global.</h1>
                  <p className="text-emerald-100/70 text-base font-medium leading-relaxed">Conecte-se com vizinhos empreendedores. Compre local, fortaleça sua rede.</p>
              </div>
              <div className="flex flex-col gap-4 shrink-0">
                  <button onClick={handleOpenCreate} className="bg-white text-emerald-900 px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-2xl flex items-center gap-3">
                    <Plus size={20}/> Criar Novo Anúncio
                  </button>
                  <button onClick={handlePrintCatalog} className="bg-emerald-800/50 text-white border border-white/20 px-10 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
                    <Printer size={18}/> Imprimir Catálogo
                  </button>
              </div>
          </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
              <input 
                type="text" 
                placeholder="Pesquisar na vitrine..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
              />
          </div>
          <div className="flex bg-white p-1.5 rounded-[2rem] shadow-sm border border-slate-200 overflow-x-auto w-full lg:w-auto">
              {[
                  { id: 'ALL', label: 'Todos', icon: Package },
                  { id: 'FOOD', label: 'Alimentação', icon: Utensils },
                  { id: 'SERVICE', label: 'Serviços', icon: Wrench },
                  { id: 'GOODS', label: 'Produtos', icon: Tag }
              ].map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id as any)} className={`px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${activeCategory === cat.id ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-500 hover:text-emerald-600'}`}>
                    <cat.icon size={16}/> {cat.label}
                  </button>
              ))}
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
                <button onClick={() => setViewMode('GLOBAL')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'GLOBAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><LayoutGrid size={16} className="inline mr-2"/> Vitrine</button>
                <button onClick={() => setViewMode('MY_ITEMS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'MY_ITEMS' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}><UserIcon size={16} className="inline mr-2"/> Meus Anúncios</button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredItems.map(item => (
              <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative">
                  {String(item.merchant_id) === String(currentUser?.id) && (
                      <div className="absolute top-6 right-6 flex gap-2">
                          <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-2 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"><Edit2 size={16}/></button>
                          <button onClick={() => handleDelete(Number(item.id))} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"><Trash2 size={16}/></button>
                      </div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                      <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors shadow-inner">
                          {item.category === 'FOOD' ? <Utensils size={28}/> : item.category === 'SERVICE' ? <Wrench size={28}/> : <Package size={28}/>}
                      </div>
                      <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl text-xs font-black">R$ {Number(item.price).toLocaleString('pt-BR')}</div>
                  </div>

                  <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2 group-hover:text-emerald-600 transition-colors">{item.title}</h3>
                  <div className="flex items-center gap-2 mb-6">
                      <MapPin size={12} className="text-slate-400"/>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.merchantName} • Unidade {item.unit}</p>
                  </div>

                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 flex-1">{item.description}</p>

                  <div className="flex gap-3 pt-6 border-t border-slate-50">
                      <a 
                        href={`https://wa.me/${item.whatsapp?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                      >
                        <MessageCircle size={16}/> Chat WhatsApp
                      </a>
                      <button className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all"><Info size={20}/></button>
                  </div>
              </div>
          ))}
          {filteredItems.length === 0 && (
              <div className="col-span-full py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
                  <ShoppingBag size={64} className="mb-4 opacity-20"/>
                  <p className="font-black uppercase tracking-widest text-[10px]">Nenhum anúncio localizado nesta visão.</p>
              </div>
          )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-scale-in">
            <form onSubmit={handleSave}>
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-black text-xl text-slate-800 tracking-tighter">{editingItem.id ? 'Editar Anúncio' : 'Publicar na Vitrine'}</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X/></button>
              </div>
              <div className="p-10 space-y-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Título</label><input required className="w-full" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descrição</label><textarea rows={3} required className="w-full" value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Categoria</label>
                    <select className="w-full font-bold" value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value as any})}>
                        <option value="FOOD">Alimentação</option><option value="SERVICE">Serviços</option><option value="GOODS">Produtos</option>
                    </select>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Preço (R$)</label><input type="number" step="0.01" className="w-full font-black" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value)})} /></div>
                </div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">WhatsApp para Vendas</label><input required className="w-full" value={editingItem.whatsapp} onChange={e => setEditingItem({...editingItem, whatsapp: e.target.value})} /></div>
              </div>
              <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-xs uppercase">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-14 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-700 flex items-center gap-3">
                  {isSaving ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Commitar Anúncio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketPlace;

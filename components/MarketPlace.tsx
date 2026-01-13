
import React, { useState, useEffect } from 'react';
import { MarketItem, User } from '../types';
import { marketplaceService, authService } from '../services/api';
import { 
  ShoppingBag, Search, Plus, Filter, 
  MessageCircle, Loader2,
  Tag, Utensils, Wrench, Package, X, Save
} from 'lucide-react';

const MarketPlace = () => {
  const [items, setItems] = useState([] as MarketItem[]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL' as MarketItem['category'] | 'ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [itemsRes, userRes] = await Promise.all([
        marketplaceService.getAll(),
        authService.me()
      ]);
      setItems(itemsRes.data?.data || []);
      setCurrentUser(userRes.data);
    } catch (e) { setItems([]); }
    finally { setLoading(false); }
  };

  const handleSave = async (e: any) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...editingItem };
      // SRE FIX: Remove timestamps para evitar erro de formato no MySQL
      delete payload.created_at;
      delete payload.updated_at;
      
      if (payload.id) await marketplaceService.update(payload.id, payload);
      else await marketplaceService.create({ ...payload, merchant_id: currentUser?.id });
      
      setIsModalOpen(false);
      loadInitialData();
    } finally { setIsSaving(false); }
  };

  const filteredItems = items.filter(i => {
    const categoryMatch = activeCategory === 'ALL' || i.category === activeCategory;
    const searchMatch = (i.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-fade-in relative h-full">
      <div className="bg-emerald-900 rounded-2xl p-4 text-white shadow-lg shrink-0 flex justify-between items-center">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg"><ShoppingBag size={18} className="text-emerald-400"/></div>
              <div>
                  <h1 className="text-base font-black uppercase tracking-tight leading-none">Vitrine</h1>
                  <p className="text-[8px] font-black uppercase tracking-widest text-emerald-300 mt-1">Marketplace Ativo</p>
              </div>
          </div>
          <button onClick={() => { setEditingItem({ title: '', description: '', category: 'GOODS', price: '', whatsapp: '' }); setIsModalOpen(true); }} className="bg-white text-emerald-900 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center gap-2">
            <Plus size={14}/> Novo Anúncio
          </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
              <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 h-10 bg-white border border-slate-200 rounded-xl text-xs font-bold" />
          </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
          {loading ? <div className="p-10 text-center"><Loader2 className="animate-spin text-emerald-600 mx-auto" /></div> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredItems.map(item => (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative">
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-emerald-600">
                                {item.category === 'FOOD' ? <Utensils size={16}/> : item.category === 'SERVICE' ? <Wrench size={16}/> : <Package size={16}/>}
                            </div>
                            <div className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-black border border-emerald-100">R$ {Number(item.price || 0).toLocaleString('pt-BR')}</div>
                        </div>
                        <h3 className="text-xs font-black text-slate-800 truncate mb-1">{item.title}</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-3 flex-1 line-clamp-2">{item.description}</p>
                        <a href={`https://wa.me/${(item.whatsapp || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="w-full bg-emerald-600 text-white py-2 rounded-lg font-black text-[8px] uppercase tracking-widest text-center">WhatsApp</a>
                    </div>
                  ))}
              </div>
          )}
      </div>

      {isModalOpen && editingItem && (
        <div className="fixed inset-y-0 right-0 z-[1000] bg-[#fcfcfd] flex flex-col animate-slide-left shadow-2xl transition-all duration-300" 
             style={{ left: document.querySelector('aside')?.classList.contains('lg:w-24') ? '96px' : '288px' }}>
            
            <div className="h-14 px-6 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-lg">
                <div className="flex items-center gap-3">
                    <Tag size={16} className="text-emerald-400"/>
                    <h3 className="font-black text-[10px] uppercase tracking-widest">Configurar Anúncio</h3>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2">
                        {isSaving ? <Loader2 className="animate-spin" size={12}/> : <Save size={12}/>} Commitar Anúncio
                    </button>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-400"><X size={20}/></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 bg-[#fcfcfd] custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Título</label><input required className="w-full font-bold h-12 bg-white border border-slate-200 rounded-xl px-4" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Categoria</label><select className="w-full font-bold h-12 bg-white border rounded-xl px-4" value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value as any})}><option value="FOOD">Alimentação</option><option value="SERVICE">Serviços</option><option value="GOODS">Bens</option></select></div>
                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Preço (R$)</label><input type="number" step="0.01" className="w-full font-black h-12 bg-white border rounded-xl px-4" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: e.target.value})} /></div>
                    </div>
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Descrição</label><textarea rows={4} className="w-full font-medium bg-white border border-slate-200 rounded-xl p-4" value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">WhatsApp</label><input className="w-full font-bold h-12 bg-white border rounded-xl px-4" value={editingItem.whatsapp} onChange={e => setEditingItem({...editingItem, whatsapp: e.target.value})} placeholder="Ex: 11999998888" /></div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MarketPlace;

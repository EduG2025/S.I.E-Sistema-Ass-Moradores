
import React, { useState, useEffect } from 'react';
import { OfficialDocument, SystemInfo } from '../types';
import { documentService, aiService } from '../services/api';
import {
  FileText, Search, Plus, Sparkles, Save, Trash2, Edit2,
  Loader2, X, ChevronRight, ArrowLeft, FileCheck
} from 'lucide-react';

interface DocumentHubProps {
    systemInfo: SystemInfo;
}

const DocumentHub = ({ systemInfo }: DocumentHubProps) => {
  const [documents, setDocuments] = useState<OfficialDocument[]>([]);
  const [activeDoc, setActiveDoc] = useState<OfficialDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [prompt, setPrompt] = useState('');

  useEffect(() => { loadDocuments(); }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await documentService.getAll();
      setDocuments(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("[SRE] Erro ao carregar documentos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;
    setIsGenerating(true);
    try {
      const context = `Organização: ${systemInfo.name}\nCNPJ: ${systemInfo.cnpj}\n\nInstruções: Cabeçalho institucional e bloco de assinatura inclusos.`;
      const res = await aiService.generateDocument(`${context}\n\nDocumento: ${cleanPrompt}`);
      const content = res.data?.text;
      if (activeDoc) setActiveDoc({ ...activeDoc, content });
      else setActiveDoc({ id: `temp_${Date.now()}`, title: "Rascunho IA", content, type: "OFICIO", status: "DRAFT", updated_at: new Date().toISOString() });
      setPrompt('');
    } catch (e) {
      alert("⚠️ Falha no Ghostwriter.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!activeDoc) return;
    setIsSaving(true);
    try {
      if (typeof activeDoc.id === 'string' && activeDoc.id.startsWith('temp_')) await documentService.create(activeDoc);
      else await documentService.update(String(activeDoc.id), activeDoc);
      loadDocuments();
      alert("✅ Sincronizado.");
    } catch (e) {
      alert("❌ Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Hub de Documentos</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de Atas e Editais</p>
        </div>
        <button onClick={() => setActiveDoc({ id: `temp_${Date.now()}`, title: '', content: '', type: 'OFICIO', status: 'DRAFT', updated_at: '' })} className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-indigo-600"><Plus size={18}/> Novo</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b bg-slate-50/30">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
              <input type="text" placeholder="Filtrar hub..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 bg-white" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {isLoading ? <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" /></div> : 
             documents.filter(d => (d.title || '').toLowerCase().includes(searchTerm.toLowerCase())).map(doc => (
              <button key={doc.id} onClick={() => setActiveDoc(doc)} className={`w-full p-6 rounded-[2rem] border transition-all text-left flex justify-between items-center ${activeDoc?.id === doc.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-slate-100 hover:border-indigo-200 text-slate-600'}`}>
                <div className="flex items-center gap-4"><div className={`p-3 rounded-xl ${activeDoc?.id === doc.id ? 'bg-white/10' : 'bg-slate-50'}`}><FileText size={20}/></div><div><h4 className="font-black text-sm truncate max-w-[150px]">{doc.title || "Sem Título"}</h4><p className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60">{doc.type}</p></div></div>
                <ChevronRight size={18} className={activeDoc?.id === doc.id ? 'opacity-100' : 'opacity-0'} />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
          {activeDoc ? (
            <div className="flex flex-col h-full">
              <div className="p-8 border-b flex justify-between items-center shrink-0">
                <input className="text-2xl font-black text-slate-800 tracking-tighter bg-transparent border-none p-0 outline-none w-full" value={activeDoc.title} onChange={e => setActiveDoc({...activeDoc, title: e.target.value})} placeholder="Título..." />
                <div className="flex gap-4">
                  <select className="bg-slate-50 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg border-none" value={activeDoc.type} onChange={e => setActiveDoc({...activeDoc, type: e.target.value as any})}>
                    <option value="OFICIO">Ofício</option><option value="ATA">Ata</option><option value="EDITAL">Edital</option><option value="CONTRATO">Contrato</option><option value="RELATÓRIO">Relatório</option>
                  </select>
                  <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-600">{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] mb-10 text-white relative overflow-hidden shadow-2xl">
                  <div className="flex items-center gap-3 mb-4"><Sparkles size={20} className="text-indigo-400 animate-pulse"/><h5 className="text-[10px] font-black uppercase text-indigo-300">Ghostwriter Inteligente</h5></div>
                  <div className="flex gap-4"><textarea placeholder="Descreva o conteúdo do documento..." value={prompt} onChange={e => setPrompt(e.target.value)} className="flex-1 bg-white/5 border-white/10 text-white text-sm rounded-2xl p-4 min-h-[80px]" /><button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="px-8 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">{isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}</button></div>
                </div>
                <textarea className="w-full h-full min-h-[600px] text-slate-700 text-base font-serif leading-relaxed bg-transparent border-none focus:ring-0 p-0 resize-none" value={activeDoc.content} onChange={e => setActiveDoc({...activeDoc, content: e.target.value})} placeholder="Inicie a redação..." />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-20 text-center"><div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner"><FileCheck size={48}/></div><h4 className="text-xl font-black text-slate-400 tracking-tighter uppercase">Nenhum documento ativo</h4></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentHub;

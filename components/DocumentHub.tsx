
import React, { useState, useEffect } from 'react';
import { OfficialDocument } from '../types';
import { documentService, aiService } from '../services/api';
import {
  FileText, Search, Plus, Sparkles, Save, Trash2, Edit2,
  FileDown, CheckCircle2, Loader2, X, MoreVertical,
  ChevronRight, ArrowLeft, History, FileCheck
} from 'lucide-react';

const DocumentHub = () => {
  const [documents, setDocuments] = useState<OfficialDocument[]>([]);
  const [activeDoc, setActiveDoc] = useState<OfficialDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await documentService.getAll();
      setDocuments(res.data);
    } catch (e) {
      console.error("[SRE] Falha ao carregar hub de documentos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const res = await aiService.generateDocument(prompt);
      const newDoc: OfficialDocument = {
        id: `temp_${Date.now()}`,
        title: "Documento Gerado por IA",
        content: res.data.text,
        type: "OFICIO",
        status: "DRAFT",
        updated_at: new Date().toISOString()
      };
      setActiveDoc(newDoc);
    } catch (e) {
      alert("❌ Falha no Ghostwriter neural.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!activeDoc) return;
    setIsSaving(true);
    try {
      if (typeof activeDoc.id === 'string' && activeDoc.id.startsWith('temp_')) {
        await documentService.create(activeDoc);
      } else {
        await documentService.update(String(activeDoc.id), activeDoc);
      }
      loadDocuments();
      alert("✅ Documento Sincronizado com o Cluster.");
    } catch (e) {
      alert("❌ Erro ao salvar documento.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Confirmar exclusão permanente deste documento?")) return;
    try {
      await documentService.delete(String(id));
      loadDocuments();
      if (activeDoc?.id === id) setActiveDoc(null);
    } catch (e) {
      alert("Erro ao excluir.");
    }
  };

  return (
    <div className="h-full flex flex-col gap-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">Hub de Documentos Oficiais</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Arquivo Imutável • Protocolo SRE V30.0</p>
        </div>
        <button
          onClick={() => setActiveDoc({ id: `temp_${Date.now()}`, title: '', content: '', type: 'OFICIO', status: 'DRAFT', updated_at: '' })}
          className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all"
        >
          <Plus size={18}/> Novo Documento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
        {/* Sidebar: Document List */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={18}/>
              <input
                type="text"
                placeholder="Pesquisar atas, editais..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 bg-white"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {isLoading ? (
              <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" /></div>
            ) : documents.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase())).map(doc => (
              <button
                key={doc.id}
                onClick={() => setActiveDoc(doc)}
                className={`w-full p-6 rounded-[2rem] border transition-all text-left flex justify-between items-center group ${activeDoc?.id === doc.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-slate-100 hover:border-indigo-200 text-slate-600'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${activeDoc?.id === doc.id ? 'bg-white/10' : 'bg-slate-50'}`}>
                    <FileText size={20}/>
                  </div>
                  <div>
                    <h4 className="font-black text-sm tracking-tight truncate max-w-[150px]">{doc.title || "Sem Título"}</h4>
                    <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${activeDoc?.id === doc.id ? 'text-indigo-200' : 'text-slate-400'}`}>{doc.type} • {doc.status}</p>
                  </div>
                </div>
                <ChevronRight size={18} className={activeDoc?.id === doc.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'} />
              </button>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
          {activeDoc ? (
            <div className="flex flex-col h-full animate-scale-in">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveDoc(null)} className="lg:hidden p-2 text-slate-400"><ArrowLeft/></button>
                  <div>
                    <input
                      className="text-2xl font-black text-slate-800 tracking-tighter bg-transparent border-none p-0 outline-none w-full"
                      value={activeDoc.title}
                      onChange={e => setActiveDoc({...activeDoc, title: e.target.value})}
                      placeholder="Título do Documento..."
                    />
                    <div className="flex gap-4 mt-2">
                      <select
                        className="bg-slate-50 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg border-none"
                        value={activeDoc.type}
                        onChange={e => setActiveDoc({...activeDoc, type: e.target.value})}
                      >
                        <option value="OFICIO">Ofício</option>
                        <option value="ATA">Ata</option>
                        <option value="EDITAL">Edital</option>
                        <option value="CONTRATO">Contrato</option>
                      </select>
                      <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-lg">{activeDoc.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleDelete(activeDoc.id)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={20}/></button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                {/* AI Ghostwriter Pulsing Box */}
                <div className="bg-slate-900 p-8 rounded-[2.5rem] mb-10 text-white relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles size={20} className="text-indigo-400 animate-pulse"/>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Ghostwriter Inteligente</h5>
                  </div>
                  <div className="flex gap-4">
                    <textarea
                      placeholder="Descreva o que o documento deve conter... (ex: Ata de assembleia sobre taxa extra)"
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      className="flex-1 bg-white/5 border-white/10 text-white text-sm font-medium placeholder:text-white/20 rounded-2xl p-4 min-h-[80px]"
                    />
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt}
                      className="px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-30 shadow-xl"
                    >
                      {isGenerating ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20}/>}
                    </button>
                  </div>
                </div>

                <textarea
                  className="w-full h-full min-h-[500px] text-slate-700 text-base font-medium leading-relaxed bg-transparent border-none focus:ring-0 p-0 resize-none font-serif"
                  value={activeDoc.content}
                  onChange={e => setActiveDoc({...activeDoc, content: e.target.value})}
                  placeholder="Inicie a redação aqui..."
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-20 text-center">
              <div className="w-24 h-24 bg-slate-50 text-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner"><FileCheck size={48}/></div>
              <h4 className="text-xl font-black text-slate-400 tracking-tighter">Selecione um documento</h4>
              <p className="text-[10px] font-black uppercase tracking-widest mt-2">ou utilize o Ghostwriter para iniciar uma nova redação assistida.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentHub;

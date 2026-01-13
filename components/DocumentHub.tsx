
import React, { useState, useEffect } from 'react';
import { OfficialDocument, SystemInfo } from '../types';
import { documentService, aiService } from '../services/api';
import {
  FileText, Search, Plus, Sparkles, Save, Trash2, Edit2,
  Loader2, X, ChevronRight, FileCheck, Info, AlertTriangle, Download, Printer, Camera
} from 'lucide-react';
import OCRScanner from './OCRScanner';

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
  const [showOCR, setShowOCR] = useState(false);

  useEffect(() => { loadDocuments(); }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await documentService.getAll();
      // SRE FIX: Mapeia dados vindos do Kernel MySQL correctly
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setDocuments(list);
    } catch (e) {
      console.error("[SRE] Erro ao carregar documentos.");
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;
    setIsGenerating(true);
    try {
      const res = await aiService.generateDocument(cleanPrompt);
      const content = res.data?.text;
      
      if (activeDoc) {
          setActiveDoc({ ...activeDoc, content: (activeDoc.content || '') + '\n\n' + content });
      } else {
          setActiveDoc({ 
              id: `temp_${Date.now()}`, 
              title: "Rascunho IA Ghostwriter", 
              content, 
              type: "OFICIO", 
              status: "DRAFT", 
              updated_at: new Date().toISOString() 
          });
      }
      setPrompt('');
    } catch (e) {
      alert("⚠️ Falha no Ghostwriter Neural. Verifique as chaves de API nas configurações.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOCRResult = (data: any) => {
      const text = data.extracted_text || data.text || JSON.stringify(data, null, 2);
      if (activeDoc) {
          setActiveDoc({ ...activeDoc, content: (activeDoc.content || '') + '\n\n--- ESCANEADO VIA VISION ---\n' + text });
      } else {
          setActiveDoc({
              id: `temp_${Date.now()}`,
              title: "Documento Digitalizado",
              content: text,
              type: "OFICIO",
              status: "DRAFT",
              updated_at: new Date().toISOString()
          });
      }
  };

  const handleSave = async () => {
    if (!activeDoc) return;
    if (!activeDoc.title) return alert("O documento precisa de um título.");
    
    setIsSaving(true);
    try {
      const payload = { ...activeDoc };
      if (typeof activeDoc.id === 'string' && activeDoc.id.startsWith('temp_')) {
          await documentService.create(payload);
      } else {
          await documentService.update(String(activeDoc.id), payload);
      }
      loadDocuments();
      alert("✅ Documento sincronizado com o Kernel.");
    } catch (e) {
      alert("❌ Erro ao comitar documento.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string | number) => {
      if (!confirm("Excluir este documento permanentemente?")) return;
      try {
          await documentService.delete(id);
          if (activeDoc?.id === id) setActiveDoc(null);
          loadDocuments();
      } catch (e) { alert("Falha na exclusão."); }
  };

  const handlePrint = () => {
      if (!activeDoc) return;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
          printWindow.document.write(`
            <html><head><title>${activeDoc.title}</title>
            <style>body{font-family:serif;padding:60px;line-height:1.6}h1{text-align:center;border-bottom:2px solid #000;padding-bottom:10px}p{text-align:justify}</style>
            </head><body>
            <div style="text-align:center;margin-bottom:40px">
                <h2 style="margin:0">${systemInfo.name}</h2>
                <small>${systemInfo.cnpj || ''}</small>
            </div>
            <h1>${activeDoc.title}</h1>
            <div style="white-space:pre-wrap">${activeDoc.content}</div>
            <div style="margin-top:100px;text-align:center">
                <div style="border-top:1px solid #000;width:300px;margin:0 auto"></div>
                <p>Assinatura Responsável</p>
            </div>
            </body></html>
          `);
          printWindow.document.close();
          printWindow.print();
      }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in overflow-hidden">
      <header className="flex justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white shrink-0">
        <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg"><FileText size={28}/></div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Hub de Documentos</h2>
              <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1.5 opacity-80">SRE Governança Imobiliária V25.9</p>
            </div>
        </div>
        <div className="flex gap-3">
            <button onClick={() => setShowOCR(true)} className="px-6 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2">
                <Camera size={18}/> Scanner Vision
            </button>
            <button onClick={() => setActiveDoc({ id: `temp_${Date.now()}`, title: '', content: '', type: 'OFICIO', status: 'DRAFT', updated_at: '' })} className="px-8 py-3.5 bg-white text-slate-900 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-2">
                <Plus size={18}/> Novo Documento
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        <div className="lg:col-span-4 bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
              <input type="text" placeholder="Filtrar por título..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:border-indigo-500 shadow-inner" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {isLoading ? <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={32}/></div> : 
             documents.filter(d => (d.title || '').toLowerCase().includes(searchTerm.toLowerCase())).map(doc => (
              <button key={doc.id} onClick={() => setActiveDoc(doc)} className={`w-full p-6 rounded-[2.5rem] border transition-all text-left flex justify-between items-center group ${activeDoc?.id === doc.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-indigo-200 text-slate-600'}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${activeDoc?.id === doc.id ? 'bg-white/10' : 'bg-slate-50 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}><FileText size={20}/></div>
                    <div className="min-w-0">
                        <h4 className="font-black text-sm truncate">{doc.title || "Sem Título"}</h4>
                        <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${activeDoc?.id === doc.id ? 'text-indigo-200' : 'text-slate-400'}`}>{doc.type} • {new Date(doc.updated_at).toLocaleDateString()}</p>
                    </div>
                </div>
                <ChevronRight size={18} className={`transition-all ${activeDoc?.id === doc.id ? 'opacity-100 translate-x-1' : 'opacity-0'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
          {activeDoc ? (
            <div className="flex flex-col h-full">
              <div className="p-8 border-b bg-white flex flex-col md:flex-row justify-between items-center gap-6 shrink-0 z-10">
                <div className="flex-1 w-full">
                    <input className="text-2xl font-black text-slate-800 tracking-tighter bg-transparent border-none p-0 outline-none w-full placeholder:text-slate-200" value={activeDoc.title} onChange={e => setActiveDoc({...activeDoc, title: e.target.value})} placeholder="Título do Protocolo..." />
                    <div className="flex gap-4 mt-2">
                        <select className="bg-slate-50 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-slate-100 cursor-pointer" value={activeDoc.type} onChange={e => setActiveDoc({...activeDoc, type: e.target.value as any})}>
                            <option value="OFICIO">Ofício</option><option value="ATA">Ata</option><option value="EDITAL">Edital</option><option value="CONTRATO">Contrato</option><option value="RELATÓRIO">Relatório</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handlePrint} className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all border border-slate-100 shadow-sm"><Printer size={20}/></button>
                  <button onClick={() => handleDelete(activeDoc.id)} className="p-4 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all border border-rose-100 shadow-sm"><Trash2 size={20}/></button>
                  <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 shadow-xl disabled:opacity-50">
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Commitar
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar bg-[#fdfdfe] relative">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] mb-12 text-white relative overflow-hidden shadow-2xl border border-white/5">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="p-2 bg-indigo-600 rounded-lg animate-pulse"><Sparkles size={16} className="text-white"/></div>
                      <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">SRE Ghostwriter Ativo</h5>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 relative z-10">
                      <textarea 
                        placeholder="Ex: Redija uma convocação para assembleia de prestação de contas..." 
                        value={prompt} 
                        onChange={e => setPrompt(e.target.value)} 
                        className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-2xl p-5 min-h-[80px] outline-none focus:bg-white/10 transition-all" 
                      />
                      <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating || !prompt.trim()} 
                        className="px-10 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                      >
                        {isGenerating ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20}/>} {isGenerating ? 'Drafting...' : 'Gerar'}
                      </button>
                  </div>
                </div>

                <textarea 
                    className="w-full h-full min-h-[800px] text-slate-700 text-lg font-serif leading-[1.8] bg-transparent border-none focus:ring-0 p-0 resize-none placeholder:text-slate-200" 
                    value={activeDoc.content} 
                    onChange={e => setActiveDoc({...activeDoc, content: e.target.value})} 
                    placeholder="Conteúdo do documento..." 
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-20 text-center animate-fade-in">
              <FileCheck size={80} className="mb-6 opacity-10"/>
              <h4 className="text-2xl font-black text-slate-400 tracking-tightest uppercase">Protocolo de Documentos</h4>
              <p className="text-slate-400 text-sm mt-4 max-w-sm">Selecione um registro no hub lateral ou crie um novo para começar o drafting.</p>
            </div>
          )}
        </div>
      </div>

      {showOCR && (
          <OCRScanner 
            context="DOCUMENT" 
            title="Digitalizar Protocolo Físico" 
            onResult={handleOCRResult} 
            onClose={() => setShowOCR(false)} 
          />
      )}
    </div>
  );
};

export default DocumentHub;

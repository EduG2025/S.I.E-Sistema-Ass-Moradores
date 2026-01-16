
import React, { useState, useEffect, useRef } from 'react';
import { OfficialDocument, SystemInfo } from '../types';
import { documentService, aiService } from '../services/api';
import {
  FileText, Search, Plus, Sparkles, Save, Trash2, Edit2,
  Loader2, X, ChevronRight, Printer, Camera, Bold, Italic, 
  Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Table as TableIcon, Image as ImageIcon, List, ListOrdered, 
  Wand2, Undo2, FileSignature, Palette, Eraser, Highlighter,
  Link, Minus, Maximize2, Minimize2, Type
} from 'lucide-react';
import OCRScanner from './OCRScanner';

interface DocumentHubProps {
    systemInfo: SystemInfo;
}

const DocumentHub = ({ systemInfo }: DocumentHubProps) => {
  const [documents, setDocuments] = useState<OfficialDocument[]>([]);
  const [activeDoc, setActiveDoc] = useState<OfficialDocument | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [showOCR, setShowOCR] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [stats, setStats] = useState({ words: 0, chars: 0 });

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadDocuments(); }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await documentService.getAll();
      setDocuments(res.data?.data || []);
    } catch (e) {
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditor = (doc: OfficialDocument | null) => {
      setActiveDoc(doc || { 
          id: `temp_${Date.now()}`, 
          title: '', 
          content: '<p>Comece a escrever seu protocolo oficial...</p>', 
          type: 'OFICIO', 
          status: 'DRAFT', 
          updated_at: new Date().toISOString() 
      });
      setIsEditorOpen(true);
      setIsFullScreen(false);
      setTimeout(updateStats, 100);
  };

  const handleCloseEditor = () => {
      setIsEditorOpen(false);
      setIsFullScreen(false);
      setActiveDoc(null);
  };

  const updateStats = () => {
      if (editorRef.current) {
          const text = editorRef.current.innerText || '';
          setStats({
              words: text.split(/\s+/).filter(w => w.length > 0).length,
              chars: text.length
          });
      }
  };

  const execCommand = (command: string, value: any = null) => {
      document.execCommand(command, false, value);
      if (editorRef.current) {
          setActiveDoc(prev => prev ? { ...prev, content: editorRef.current?.innerHTML || '' } : null);
      }
      updateStats();
  };

  const insertTable = () => {
      const rows = prompt("Número de linhas:", "3");
      const cols = prompt("Número de colunas:", "3");
      if (!rows || !cols) return;
      
      let tableHtml = `<table style="width:100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #cbd5e1;"><thead><tr style="background: #f1f5f9;">`;
      for(let i=0; i<parseInt(cols); i++) tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 14px;">Título</th>`;
      tableHtml += `</tr></thead><tbody>`;
      for(let r=0; r<parseInt(rows); r++) {
          tableHtml += `<tr>`;
          for(let c=0; c<parseInt(cols); c++) tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 10px; font-size: 14px;">---</td>`;
          tableHtml += `</tr>`;
      }
      tableHtml += `</tbody></table><p><br/></p>`;
      execCommand('insertHTML', tableHtml);
  };

  const insertImage = () => {
      const url = prompt("URL da imagem:", "https://");
      if (url && url !== "https://") {
          execCommand('insertHTML', `<div style="text-align: center; margin: 20px 0;"><img src="${url}" style="max-width: 100%; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);" /></div>`);
      }
  };

  const handleCreateLink = () => {
      const url = prompt("Insira a URL do link:", "https://");
      if (url) execCommand('createLink', url);
  };

  const applyRecipe = (recipe: string) => {
      let p = "";
      if (recipe === 'CONV') p = "Redija uma convocação formal de assembleia geral extraordinária para tratar de [Assunto].";
      if (recipe === 'ATA') p = "Redija uma Ata de Assembleia formal com base nestas notas: ";
      if (recipe === 'NOTIF') p = "Escreva uma notificação extrajudicial formal sobre infração regimental.";
      setAiPrompt(p);
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await aiService.generateDocument(aiPrompt);
      const content = res.data?.text;
      if (editorRef.current && content) {
          // Inserção inteligente: se o editor estiver vazio ou com placeholder, substitui tudo
          if (editorRef.current.innerText.includes("Comece a escrever")) {
              editorRef.current.innerHTML = content;
          } else {
              const formatted = `<div style="margin-top:20px; border-top: 2px dashed #e2e8f0; padding-top: 20px;">${content}</div>`;
              execCommand('insertHTML', formatted);
          }
      }
      setAiPrompt('');
    } catch (e: any) {
      alert(e.response?.data?.error || "⚠️ Falha no Ghostwriter Neural. Verifique se há uma chave de API válida.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!activeDoc || !activeDoc.title) return alert("O documento precisa de um título.");
    setIsSaving(true);
    try {
      const payload = { ...activeDoc, content: editorRef.current?.innerHTML || activeDoc.content };
      if (typeof activeDoc.id === 'string' && activeDoc.id.startsWith('temp_')) {
          await documentService.create(payload);
      } else {
          await documentService.update(String(activeDoc.id), payload);
      }
      handleCloseEditor();
      loadDocuments();
      alert("✅ Documento sincronizado com sucesso.");
    } catch (e) {
      alert("❌ Erro ao salvar documento.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in relative min-h-[800px]">
      <header className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white shrink-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="flex items-center gap-5 relative z-10">
            <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg"><FileSignature size={28}/></div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Hub de Documentos</h2>
              <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-2 opacity-80">SRE Governança Imobiliária V132.0</p>
            </div>
        </div>
        <button onClick={() => handleOpenEditor(null)} className="px-10 py-4 bg-white text-slate-950 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-3 relative z-10 active:scale-95">
            <Plus size={20}/> Criar Protocolo
        </button>
      </header>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
          <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center shrink-0">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
              <input type="text" placeholder="Filtrar base de protocolos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 h-14 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 shadow-inner outline-none transition-all uppercase" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-4 py-2 rounded-full">{documents.length} Registros</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40}/></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {documents.filter(d => (d.title || '').toLowerCase().includes(searchTerm.toLowerCase())).map(doc => (
                        <div key={doc.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 hover:border-indigo-200 hover:shadow-2xl transition-all group flex flex-col min-h-[300px]">
                            <div className="flex justify-between items-start mb-8">
                                <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shadow-inner"><FileText size={24}/></div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                    <button onClick={() => { if(confirm("Excluir registro?")) documentService.delete(doc.id).then(loadDocuments); }} className="p-3 bg-white border border-slate-100 text-slate-300 hover:text-rose-600 rounded-xl shadow-sm"><Trash2 size={16}/></button>
                                    <button onClick={() => handleOpenEditor(doc)} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:scale-110 transition-all"><Edit2 size={18}/></button>
                                </div>
                            </div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4 line-clamp-2 leading-tight flex-1">{doc.title || "Sem Título"}</h3>
                            <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded-lg border border-indigo-100">{doc.type}</span>
                                <button onClick={() => handleOpenEditor(doc)} className="text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:translate-x-2 transition-transform">Editar <ChevronRight size={14}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
      </div>

      {isEditorOpen && activeDoc && (
          <div className={`sie-editor-overlay ${isFullScreen ? '!p-0' : ''}`}>
              <div className={`sie-modal-container ${isFullScreen ? '!w-screen !h-screen !rounded-none !max-w-none border-none' : ''}`}>
                  {/* Header do Editor */}
                  <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-50 border-b border-white/10">
                        <div className="flex items-center gap-8">
                            <div className="p-4 bg-indigo-600 rounded-[1.5rem] shadow-2xl"><FileSignature size={28}/></div>
                            <div className="flex flex-col">
                                <input 
                                    className="font-black text-2xl uppercase bg-transparent border-none outline-none p-0 w-full md:w-[600px] text-white focus:ring-0" 
                                    value={activeDoc.title} 
                                    onChange={e => setActiveDoc({...activeDoc, title: e.target.value})} 
                                    placeholder="Nome do Documento..." 
                                />
                                <p className="text-indigo-400 text-[9px] font-black uppercase mt-1 tracking-widest opacity-80">
                                    {isFullScreen ? 'MODO IMERSIVO ATIVO' : 'EDIÇÃO DE PROTOCOLO'} • {stats.words} PALAVRAS
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-4 bg-white/5 hover:bg-indigo-600 hover:text-white text-white rounded-2xl border border-white/5 transition-all group" title={isFullScreen ? "Sair da Tela Cheia" : "Tela Cheia"}>
                                {isFullScreen ? <Minimize2 size={20}/> : <Maximize2 size={20}/>}
                            </button>
                            <button onClick={() => execCommand('undo')} className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/5 transition-all" title="Desfazer"><Undo2 size={20}/></button>
                            <button onClick={handleSave} disabled={isSaving} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl active:scale-95">
                                {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} Commitar Draft
                            </button>
                            <button onClick={handleCloseEditor} className="p-4 hover:bg-rose-500 hover:text-white text-slate-400 rounded-2xl transition-all border border-white/5 ml-4"><X size={32}/></button>
                        </div>
                  </div>

                  {/* Toolbar WYSIWYG */}
                  <div className="sie-editor-toolbar flex items-center bg-white border-b px-10 py-3 shrink-0 gap-4 z-40 shadow-sm overflow-x-auto custom-scrollbar">
                      <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                          <button onClick={() => execCommand('bold')} className="p-2.5 hover:bg-white hover:text-indigo-600 rounded-xl transition-all text-slate-500" title="Negrito"><Bold size={18}/></button>
                          <button onClick={() => execCommand('italic')} className="p-2.5 hover:bg-white hover:text-indigo-600 rounded-xl transition-all text-slate-500" title="Itálico"><Italic size={18}/></button>
                          <button onClick={() => execCommand('underline')} className="p-2.5 hover:bg-white hover:text-indigo-600 rounded-xl transition-all text-slate-500" title="Sublinhado"><Underline size={18}/></button>
                          <button onClick={() => execCommand('strikethrough')} className="p-2.5 hover:bg-white hover:text-indigo-600 rounded-xl transition-all text-slate-500" title="Riscado"><Type size={18}/></button>
                      </div>
                      
                      <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                          <button onClick={() => execCommand('justifyLeft')} className="p-2.5 hover:bg-white hover:text-indigo-600 rounded-xl transition-all text-slate-500" title="Alinhar Esquerda"><AlignLeft size={18}/></button>
                          <button onClick={() => execCommand('justifyCenter')} className="p-2.5 hover:bg-white hover:text-indigo-600 rounded-xl transition-all text-slate-500" title="Centralizar"><AlignCenter size={18}/></button>
                          <button onClick={() => execCommand('justifyRight')} className="p-2.5 hover:bg-white hover:text-indigo-600 rounded-xl transition-all text-slate-500" title="Alinhar Direita"><AlignRight size={18}/></button>
                          <button onClick={() => execCommand('justifyFull')} className="p-2.5 hover:bg-white hover:text-indigo-600 rounded-xl transition-all text-slate-500" title="Justificar"><AlignJustify size={18}/></button>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                          <button onClick={() => execCommand('insertUnorderedList')} className="p-2.5 hover:bg-white hover:text-indigo-600 rounded-xl transition-all text-slate-500" title="Lista Marcadores"><List size={18}/></button>
                          <button onClick={() => execCommand('insertOrderedList')} className="p-2.5 hover:bg-white hover:text-indigo-600 rounded-xl transition-all text-slate-500" title="Lista Numerada"><ListOrdered size={18}/></button>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                          <button onClick={handleCreateLink} className="p-2.5 hover:bg-white hover:text-indigo-600 rounded-xl transition-all text-slate-500" title="Inserir Link"><Link size={18}/></button>
                          <button onClick={() => execCommand('insertHorizontalRule')} className="p-2.5 hover:bg-white hover:text-indigo-600 rounded-xl transition-all text-slate-500" title="Linha Horizontal"><Minus size={18}/></button>
                      </div>

                      <div className="flex items-center gap-2">
                          <button onClick={insertTable} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all text-slate-600 shadow-sm flex items-center gap-2 text-[9px] font-black uppercase"><TableIcon size={16}/> Tabela</button>
                          <button onClick={insertImage} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all text-slate-600 shadow-sm flex items-center gap-2 text-[9px] font-black uppercase"><ImageIcon size={16}/> Mídia</button>
                          <button onClick={() => setShowOCR(true)} className="px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 text-indigo-600 transition-all shadow-sm flex items-center gap-2 text-[9px] font-black uppercase"><Camera size={16}/> Scan</button>
                      </div>

                      <div className="flex-1 flex justify-end gap-2">
                          <button onClick={() => {
                                const color = prompt("Cor do Texto (Hex):", "#000000");
                                if (color) execCommand('foreColor', color);
                            }} className="p-2.5 bg-slate-50 rounded-xl text-slate-500 hover:bg-white hover:text-indigo-600 shadow-inner" title="Cor do Texto"><Palette size={18}/></button>
                          <button onClick={() => {
                                const color = prompt("Cor de Destaque (Hex):", "#ffff00");
                                if (color) execCommand('hiliteColor', color);
                            }} className="p-2.5 bg-slate-50 rounded-xl text-slate-500 hover:bg-white hover:text-amber-600 shadow-inner" title="Destaque"><Highlighter size={18}/></button>
                          <button onClick={() => execCommand('removeFormat')} className="p-2.5 bg-slate-50 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 shadow-inner" title="Limpar Formatação"><Eraser size={18}/></button>
                      </div>
                  </div>

                  {/* Área de Edição */}
                  <div className="flex-1 flex overflow-hidden bg-slate-200 relative">
                      {/* Sidebar do Ghostwriter (Oculta em Fullscreen para focar) */}
                      {!isFullScreen && (
                          <div className="sie-editor-sidebar hidden xl:flex w-[380px] bg-white border-r p-8 flex-col gap-10 shrink-0 shadow-2xl z-30">
                              <div className="flex items-center gap-5">
                                  <div className="p-4 bg-indigo-600 rounded-2xl text-white animate-pulse shadow-xl shadow-indigo-600/20"><Wand2 size={24}/></div>
                                  <div>
                                    <h5 className="text-[13px] font-black uppercase tracking-widest text-slate-900 leading-none">Ghostwriter IA</h5>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">SRE Neural Drafting</p>
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                  <button onClick={() => applyRecipe('CONV')} className="py-3 px-4 bg-slate-50 hover:bg-indigo-600 hover:text-white text-[9px] font-black uppercase border border-slate-100 rounded-2xl transition-all">Convocação</button>
                                  <button onClick={() => applyRecipe('ATA')} className="py-3 px-4 bg-slate-50 hover:bg-indigo-600 hover:text-white text-[9px] font-black uppercase border border-slate-100 rounded-2xl transition-all">Ata Digital</button>
                                  <button onClick={() => applyRecipe('NOTIF')} className="py-3 px-4 bg-slate-50 hover:bg-indigo-600 hover:text-white text-[9px] font-black uppercase border border-slate-100 rounded-2xl transition-all">Notificação</button>
                              </div>
                              <div className="flex-1 flex flex-col space-y-5">
                                <textarea 
                                    className="flex-1 bg-slate-100 border border-slate-200 rounded-[2rem] p-6 text-sm font-medium outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase shadow-inner leading-relaxed resize-none"
                                    placeholder="Descreva o que a IA deve redigir..."
                                    value={aiPrompt}
                                    onChange={e => setAiPrompt(e.target.value)}
                                />
                                <button 
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !aiPrompt.trim()}
                                    className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 active:scale-95"
                                >
                                    {isGenerating ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20}/>} Gerar Texto
                                </button>
                              </div>
                          </div>
                      )}

                      <div className="flex-1 overflow-y-auto custom-scrollbar p-10 md:p-16 lg:p-24 flex flex-col items-center bg-slate-100">
                          <div 
                              ref={editorRef}
                              contentEditable
                              suppressContentEditableWarning
                              onInput={updateStats}
                              className={`w-full ${isFullScreen ? 'max-w-[1000px]' : 'max-w-[850px]'} min-h-[1200px] bg-white shadow-2xl rounded-sm p-[60px] md:p-[100px] outline-none font-serif text-[18px] leading-[2] text-slate-900 uppercase animate-slide-up border border-slate-300 transition-all duration-500`}
                              dangerouslySetInnerHTML={{ __html: activeDoc.content }}
                          >
                          </div>
                          <div className="h-20 w-full shrink-0"></div> {/* Spacer inferior */}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showOCR && (
          <OCRScanner 
            context="DOCUMENT" 
            title="Vision Capture: Protocolo Digital" 
            onResult={(data) => {
                const text = data.extracted_text || data.text || JSON.stringify(data, null, 2);
                if (editorRef.current) {
                    const formatted = `<div style="background: #f8fafc; padding: 25px; border-radius: 1.5rem; border: 1px solid #e2e8f0; margin: 20px 0; font-family: sans-serif; font-size: 14px; text-transform: none;"><strong>CONTEÚDO ESCANEADO:</strong><br/>${text}</div>`;
                    execCommand('insertHTML', formatted);
                }
            }} 
            onClose={() => setShowOCR(false)} 
          />
      )}
    </div>
  );
};

export default DocumentHub;

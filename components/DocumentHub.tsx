import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OfficialDocument, SystemInfo, User } from '../types';
import { documentService, aiService } from '../services/api';
import {
    FileText, Search, Plus, Sparkles, Save, Trash2, Edit2,
    Loader2, X, ChevronRight, Printer, Camera, Bold, Italic,
    Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Table as TableIcon, Wand2, Undo2, FileSignature, Palette, Eraser,
    Scissors, Layers, SearchCheck, ShieldAlert, AlertCircle,
    Baseline, Redo2, Type as TypeIcon, Ruler, Variable, Calendar, CheckCircle2,
    Minimize2, Maximize2
} from 'lucide-react';
import OCRScanner from './OCRScanner';

interface DocumentHubProps {
    systemInfo: SystemInfo;
    currentUser: User | null;
}

const DocumentHub = ({ systemInfo, currentUser }: DocumentHubProps) => {
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
    const [stats, setStats] = useState({ words: 0, chars: 0, pages: 1 });
    const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS'>('IDLE');

    const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'PRESIDENT' || currentUser?.role === 'SINDIC';
    const editorRef = useRef<HTMLDivElement>(null);
    const initialContentSet = useRef(false);

    useEffect(() => { loadDocuments(); }, []);

    useEffect(() => {
        if (isEditorOpen && activeDoc && editorRef.current && !initialContentSet.current) {
            editorRef.current.innerHTML = activeDoc.content || '';
            initialContentSet.current = true;
            updateStats();
            setTimeout(() => editorRef.current?.focus(), 100);
        }
        if (!isEditorOpen) initialContentSet.current = false;
    }, [isEditorOpen, activeDoc]);

    const loadDocuments = async () => {
        setIsLoading(true);
        try {
            const res = await documentService.getAll();
            setDocuments(res.data?.data || []);
        } catch (e) { setDocuments([]); } 
        finally { setIsLoading(false); }
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
    };

    const updateStats = useCallback(() => {
        if (editorRef.current) {
            const text = editorRef.current.innerText || '';
            const words = text.split(/\s+/).filter(w => w.length > 0).length;
            const currentHeight = editorRef.current.scrollHeight;
            const estPages = Math.ceil(currentHeight / 1123);
            setStats({ words, chars: text.length, pages: estPages });
        }
    }, []);

    const execCommand = (command: string, value: any = null) => {
        document.execCommand(command, false, value);
        updateStats();
    };

    const handleSave = async () => {
        if (!activeDoc || !activeDoc.title) return alert("Defina um título.");
        setIsSaving(true);
        setSaveStatus('SAVING');
        try {
            const currentHTML = editorRef.current?.innerHTML || '';
            const payload = { ...activeDoc, content: currentHTML };
            if (typeof activeDoc.id === 'string' && activeDoc.id.startsWith('temp_')) {
                await documentService.create(payload);
            } else {
                await documentService.update(String(activeDoc.id), payload);
            }
            setSaveStatus('SUCCESS');
            setTimeout(() => { setSaveStatus('IDLE'); setIsEditorOpen(false); loadDocuments(); }, 800);
        } catch (e) { setSaveStatus('IDLE'); } 
        finally { setIsSaving(false); }
    };

    const handleGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        try {
            const res = await aiService.generateDocument(aiPrompt);
            const content = res.data?.text;
            if (editorRef.current && content) {
                // SRE: Inserção Aditiva Inteligente
                if (editorRef.current.innerText.trim() === "" || editorRef.current.innerHTML.length < 100) {
                    editorRef.current.innerHTML = content;
                } else {
                    const separator = `<div style="margin-top:40px; border-top: 2px dashed #e2e8f0; padding-top: 40px;">${content}</div>`;
                    execCommand('insertHTML', separator);
                }
            }
            setAiPrompt('');
            updateStats();
        } catch (e) { alert("IA Mentor instável."); } 
        finally { setIsGenerating(false); }
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in relative min-h-[800px]">
            <header className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white shrink-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg"><FileSignature size={28} /></div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Hub de Documentos</h2>
                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-2">SRE Ghostwriter Active V195.0</p>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    <button onClick={() => setShowOCR(true)} className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 shadow-xl"><Camera size={20} /></button>
                    {canManage && (
                        <button onClick={() => handleOpenEditor(null)} className="px-10 py-4 bg-white text-slate-950 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-3">
                            <Plus size={20} /> Criar Protocolo
                        </button>
                    )}
                </div>
            </header>

            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
                <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center shrink-0">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input type="text" placeholder="Pesquisar protocolos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 h-14 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-inner outline-none transition-all uppercase" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{documents.length} Registros</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} /></div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {documents.filter(d => (d.title || '').toLowerCase().includes(searchTerm.toLowerCase())).map(doc => (
                                <div key={doc.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 hover:border-indigo-200 hover:shadow-2xl transition-all group flex flex-col min-h-[300px]">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shadow-inner"><FileText size={24} /></div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            {canManage && <button onClick={() => { if (confirm("Excluir?")) documentService.delete(doc.id).then(loadDocuments); }} className="p-3 bg-white border border-slate-100 text-slate-300 hover:text-rose-600 rounded-xl shadow-sm"><Trash2 size={16} /></button>}
                                            <button onClick={() => handleOpenEditor(doc)} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:scale-110 transition-all"><Edit2 size={18} /></button>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4 line-clamp-2 leading-tight flex-1">{doc.title || "Sem Título"}</h3>
                                    <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded-lg border border-indigo-100">{doc.type}</span>
                                        <button onClick={() => handleOpenEditor(doc)} className="text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:translate-x-2 transition-transform">Abrir <ChevronRight size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isEditorOpen && activeDoc && (
                <div className="sie-editor-overlay">
                    <div className={`sie-modal-container ${isFullScreen ? '!w-screen !h-screen !rounded-none !max-w-none' : ''}`}>
                        <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-50 border-b border-white/10">
                            <div className="flex items-center gap-8">
                                <div className="p-4 bg-indigo-600 rounded-[1.5rem] shadow-2xl"><FileSignature size={28} /></div>
                                <div className="flex flex-col">
                                    <input className="font-black text-2xl uppercase bg-transparent border-none outline-none p-0 w-full md:w-[600px] text-white focus:ring-0" value={activeDoc.title} onChange={e => setActiveDoc({ ...activeDoc, title: e.target.value })} placeholder="Título do Documento..." />
                                    <div className="flex items-center gap-4 mt-1">
                                        <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest opacity-80">EDITOR SINC • {stats.words} PALAVRAS</p>
                                        <span className="text-emerald-400 text-[9px] font-black uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">EST. {stats.pages} FOLHAS</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-4 bg-white/5 hover:bg-indigo-600 text-white rounded-2xl border border-white/5 transition-all">{isFullScreen ? <Minimize2 size={20}/> : <Maximize2 size={20}/>}</button>
                                <button onClick={handleSave} disabled={isSaving} className={`px-10 py-4 ${saveStatus === 'SUCCESS' ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-500'} text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl active:scale-95`}>
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : saveStatus === 'SUCCESS' ? <CheckCircle2 size={20} /> : <Save size={20} />} 
                                    {saveStatus === 'SUCCESS' ? 'Salvo' : 'Commitar'}
                                </button>
                                <button onClick={() => setIsEditorOpen(false)} className="p-4 hover:bg-rose-500 hover:text-white text-slate-400 rounded-2xl transition-all border border-white/5 ml-4"><X size={32} /></button>
                            </div>
                        </div>

                        <div className="sie-editor-toolbar flex items-center bg-white border-b px-10 py-3 shrink-0 gap-6 z-40 shadow-sm overflow-x-auto custom-scrollbar">
                            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                                <button onClick={() => execCommand('bold')} className="p-2.5 hover:bg-white hover:text-indigo-600 rounded-xl text-slate-500"><Bold size={18} /></button>
                                <button onClick={() => execCommand('italic')} className="p-2.5 hover:bg-white hover:text-indigo-600 rounded-xl text-slate-500"><Italic size={18} /></button>
                                <button onClick={() => execCommand('underline')} className="p-2.5 hover:bg-white hover:text-indigo-600 rounded-xl text-slate-500"><Underline size={18} /></button>
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                                <button onClick={() => execCommand('justifyLeft')} className="p-2.5 hover:bg-white hover:text-indigo-600 rounded-xl text-slate-500"><AlignLeft size={18} /></button>
                                <button onClick={() => execCommand('justifyCenter')} className="p-2.5 hover:bg-white hover:text-indigo-600 rounded-xl text-slate-500"><AlignCenter size={18} /></button>
                                <button onClick={() => execCommand('justifyRight')} className="p-2.5 hover:bg-white hover:text-indigo-600 rounded-xl text-slate-500"><AlignRight size={18} /></button>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => execCommand('insertHTML', '<div class="page-break" style="page-break-before: always; margin: 40px 0; border-top: 1px dashed #ccc;"></div>')} className="px-5 py-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-700 text-[9px] font-black uppercase flex items-center gap-2"><Scissors size={16} /> Quebra de Página</button>
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden bg-slate-100 relative">
                            {!isFullScreen && (
                                <div className="sie-editor-sidebar hidden xl:flex w-[400px] bg-white border-r flex-col gap-0 shrink-0 shadow-2xl z-30">
                                    <div className="flex-1 flex flex-col p-10 gap-8 overflow-y-auto custom-scrollbar">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl animate-pulse"><Wand2 size={24} /></div>
                                            <div>
                                                <h5 className="text-[12px] font-black uppercase tracking-widest text-slate-900 leading-none">Ghostwriter</h5>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">SRE AI Content Engine</p>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-sm font-medium outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase shadow-inner resize-none h-[220px]" placeholder="Descreva o documento (ex: Ata de eleição de síndico com pautas A, B e C)..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
                                            <button onClick={handleGenerate} disabled={isGenerating || !aiPrompt.trim()} className="w-full py-6 bg-slate-950 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} Redigir Neuralmente
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-12 md:p-20 flex flex-col items-center bg-slate-200/40">
                                <div ref={editorRef} contentEditable="true" suppressContentEditableWarning onInput={updateStats} className={`sie-printable-content w-full ${isFullScreen ? 'max-w-[1000px]' : 'max-w-[800px]'} shadow-2xl transition-all duration-700 mx-auto bg-white min-h-[1123px] p-20 outline-none cursor-text font-serif text-lg leading-relaxed`} spellCheck="false" />
                                <div className="h-60 w-full shrink-0"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {showOCR && <OCRScanner context="DOCUMENT" onClose={() => setShowOCR(false)} onResult={(data) => {
                if (editorRef.current) {
                    editorRef.current.innerHTML += `<div style="margin-top:20px; padding:20px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;">${JSON.stringify(data, null, 2)}</div>`;
                }
                setShowOCR(false);
            }} />}

            <style>{`
                .sie-printable-content { color: #0f172a; }
                .sie-printable-content h1 { font-size: 2rem; font-weight: 900; margin-bottom: 2rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; }
                .sie-printable-content p { margin-bottom: 1.5rem; }
                .sie-printable-content table { width: 100%; border-collapse: collapse; margin: 2rem 0; }
                .sie-printable-content th, .sie-printable-content td { border: 1px solid #e2e8f0; padding: 1rem; text-align: left; }
                .sie-printable-content th { background: #f8fafc; font-weight: 900; text-transform: uppercase; font-size: 0.75rem; }
                @media print { .sie-modal-container { position: fixed !important; inset: 0 !important; height: auto !important; width: auto !important; margin: 0 !important; box-shadow: none !important; } .sie-editor-toolbar, .sie-editor-sidebar, header, .h-24 { display: none !important; } .sie-printable-content { padding: 0 !important; box-shadow: none !important; } }
            `}</style>
        </div>
    );
};

export default DocumentHub;
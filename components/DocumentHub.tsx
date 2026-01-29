import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { OfficialDocument, SystemInfo, User, DocumentVersion } from '../types';
import { documentService, aiService, systemService } from '../services/api';
import {
    FileText, Search, Plus, Sparkles, Save, Trash2, Edit2,
    Loader2, X, ChevronRight, Printer, Camera, Bold, Italic,
    Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Table as TableIcon, Wand2, Undo2, Redo2,
    Minimize2, Maximize2, List, ListOrdered, Heading1, Heading2,
    Quote, CheckSquare, Link as LinkIcon, Image as ImageIcon,
    SeparatorHorizontal, Eye, FileSignature, PenTool, Settings,
    LayoutTemplate, ArrowDownCircle, Palette, Indent, Outdent,
    Eraser, Superscript, Subscript, Bookmark, Star, MoreHorizontal,
    FileJson, Variable, Download, AlertTriangle, RefreshCw,
    History, FileClock, RotateCcw, BrainCircuit, UploadCloud, FileType,
    Type, Baseline, Highlighter, Strikethrough, ListTodo, Link2,
    Minus, Plus as PlusIcon, ZoomIn, ZoomOut, PaintBucket,
    Sun, Moon, CheckCircle2, AlertCircle, FileCheck, Database,
    ImagePlus, Move, Trash, SlidersHorizontal, Paperclip, FileOutput
} from 'lucide-react';
import OCRScanner from './OCRScanner';

// --- 1. CONSTANTES E CONFIGURAÇÕES GLOBAIS ---
const PAGE_GAP_PX = 40;

const AMC_DEFAULT_CONTEXT = `
CONTEXTO DO SISTEMA: Você é o secretário da ASSOCIAÇÃO DE MORADORES DE CACARIA (AMC).
CNPJ: 05.548.399/0001-63.
Endereço: Rua Vitorino Tavares, Lote 15 | CEP 27.175-000 | Cacaria | Piraí | RJ.
Presidente: Luis Eduardo da Fonseca Robaina.

REGRAS DE FORMATAÇÃO (RIGOROSO):
1. Fonte: Tamanho 12pt, Tipografia Arial ou Times New Roman.
2. Cabeçalho: Deve conter o Logo (placeholder), Nome da Associação, CNPJ e Endereço alinhados.
3. Título: A palavra "Ofício" deve vir centralizada, em itálico e negrito.
4. Destinatário: "A / T [Secretaria]".
5. Texto: Alinhamento Justificado (text-align: justify). Espaçamento entre parágrafos.
6. Assinatura: Nome do Presidente à esquerda com linha. Data à direita na mesma linha base.
7. Tom de voz: Formal, respeitoso, institucional.
`;

const SYSTEM_PROMPTS = [
    {
        id: 'sys_gab',
        title: 'Ofício Padrão AMC (Gabinete)',
        category: 'ADM',
        content: `Gere um ofício completo seguindo estritamente o modelo visual da AMC.
Destinatário: Chefe de Gabinete do Prefeito de Piraí – RJ.
Solicitação: [INSERIR SOLICITAÇÃO].
Estrutura HTML Obrigatória:
<div style="font-family: 'Times New Roman', serif; font-size: 12pt; color: #000;">
    <div style="display: flex; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
        <div style="flex: 1;">
            <strong style="font-size: 10pt;">ASSOCIAÇÃO DE MORADORES DE CACARIA (AMC)</strong><br/>
            <span style="font-size: 9pt;">CNPJ: 05.548.399/0001-63</span><br/>
            <span style="font-size: 9pt;">Endereço: Rua Vitorino Tavares, Lote 15 | CEP 27.175-000 | Cacaria | Piraí | RJ</span>
        </div>
    </div>
    <p style="text-align: center; font-weight: bold; font-style: italic; font-size: 14pt; margin: 30px 0;">Ofício</p>
    <p style="margin-bottom: 20px;">A / T Chefe de Gabinete do Prefeito de Piraí – RJ</p>
    <p style="text-align: justify; margin-bottom: 15px;">Agradecemos desde já a compreensão e colaboração a nosso município.</p>
    <p style="text-align: justify; margin-bottom: 15px;">Venho por intermédio deste, em nome da <b>Associação de Moradores de Cacaria</b>, solicitar a parceria institucional deste gabinete para <b>[DESCREVA A SOLICITAÇÃO]</b>.</p>
    <p style="text-align: justify; margin-bottom: 15px;">[INSERIR JUSTIFICATIVA TÉCNICA/SOCIAL AQUI].</p>
    <p style="text-align: justify; margin-bottom: 15px;">Solicitamos o apoio político e administrativo para viabilizar esta demanda com celeridade.</p>
    <p style="text-align: justify; margin-bottom: 15px;">Desde já agradecemos a compreensão e apoio. Esta Associação está à disposição para quaisquer dúvidas com relação ao projeto.</p>
    <p style="text-align: justify; margin-bottom: 40px;">Certa(o)s de contarmos com a habitual atenção e o apoio deste Gabinete, renovamos nossos votos de estima e consideração.</p>
    <p style="margin-bottom: 40px;">Atenciosamente,</p>
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px;">
        <div style="text-align: left;">
            _____________________________________<br/>
            <b>Luis Eduardo da Fonseca Robaina</b><br/>
            Presidente
        </div>
        <div style="text-align: right;">
            Piraí/RJ, {{DATA_ATUAL}}.
        </div>
    </div>
</div>`
    },
    {
        id: 'sys_tur',
        title: 'Ofício Padrão AMC (Turismo)',
        category: 'TURISMO',
        content: `Gere um ofício para a Secretaria de Turismo seguindo o layout padrão da imagem.
Destinatário: Secretaria de Turismo de Piraí – RJ.
Assunto: [ASSUNTO].
Estrutura HTML Obrigatória:
<div style="font-family: 'Times New Roman', serif; font-size: 12pt;">
    <div style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
        <strong style="font-size: 10pt;">ASSOCIAÇÃO DE MORADORES DE CACARIA (AMC)</strong><br/>
        <span style="font-size: 9pt;">CNPJ: 05.548.399/0001-63</span><br/>
        <span style="font-size: 9pt;">Endereço: Rua Vitorino Tavares, Lote 15 | CEP 27.175-000 | Cacaria | Piraí | RJ</span>
    </div>
    <p style="text-align: center; font-weight: bold; font-style: italic; font-size: 14pt; margin: 30px 0;">Ofício</p>
    <p>A / T Secretaria de Turismo de Piraí – RJ</p>
    <p style="text-align: justify;">Agradecemos desde já a compreensão desta secretaria a nosso município.</p>
    <p style="text-align: justify;">Venho por intermédio deste, em nome da <b>Associação de Moradores de Cacaria</b>, solicitar a parceria institucional desta Secretaria para a <b>realização de [ASSUNTO]</b> com objetivo de [OBJETIVO].</p>
    <p style="text-align: justify;">A pesquisa tem como objetivo mapear pontos turísticos, comerciantes locais e necessidades de infraestrutura.</p>
    <p style="text-align: justify;">Certa(o)s de contarmos com a habitual atenção e o apoio desta Secretaria, renovamos nossos votos de estima e consideração.</p>
    <p>Atenciosamente,</p>
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px;">
        <div style="text-align: left;">
            _____________________________________<br/>
            <b>Luis Eduardo da Fonseca Robaina</b><br/>
            Presidente
        </div>
        <div style="text-align: right;">
            Piraí/RJ, {{DATA_ATUAL}}.
        </div>
    </div>
</div>`
    }
];

// Tipos
type PaperSizeKey = 'A4' | 'LETTER' | 'LEGAL' | 'CUSTOM';
type PromptCategory = 'JURIDICO' | 'ADM' | 'FINANCEIRO' | 'GERAL' | 'TURISMO' | 'OBRAS' | 'SAÚDE' | 'EDUCAÇÃO';
type DocStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'SIGNED' | 'SENT';

interface PaperConfig { name: string; width: number; height: number; }
interface AIPromptTemplate { id: string | number; title: string; content: string; category: PromptCategory; is_favorite?: boolean; }
interface ToastMsg { id: number; type: 'success' | 'error' | 'info'; msg: string; }

const PAPER_SIZES: Record<PaperSizeKey, PaperConfig> = {
    A4: { name: 'A4 (210 x 297 mm)', width: 794, height: 1123 },
    LETTER: { name: 'Carta (216 x 279 mm)', width: 816, height: 1056 },
    LEGAL: { name: 'Ofício (216 x 356 mm)', width: 816, height: 1344 },
    CUSTOM: { name: 'Personalizado', width: 800, height: 1200 }
};

const FONT_SIZES = [
    { label: '6px', val: '6px' }, { label: '8px', val: '8px' }, { label: '9px', val: '9px' },
    { label: '10px', val: '10px' }, { label: '11px', val: '11px' }, { label: '12px', val: '12px' },
    { label: '14px', val: '14px' }, { label: '16px', val: '16px' }, { label: '18px', val: '18px' },
    { label: '20px', val: '20px' }, { label: '24px', val: '24px' }, { label: '28px', val: '28px' },
    { label: '36px', val: '36px' }, { label: '48px', val: '48px' }
];

const STATUS_LABELS: Record<DocStatus, { label: string; color: string }> = {
    DRAFT: { label: 'Rascunho', color: 'bg-slate-200 text-slate-700' },
    REVIEW: { label: 'Em Revisão', color: 'bg-amber-100 text-amber-700' },
    APPROVED: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-700' },
    SIGNED: { label: 'Assinado', color: 'bg-blue-100 text-blue-700' },
    SENT: { label: 'Enviado', color: 'bg-purple-100 text-purple-700' }
};

interface DocumentHubProps {
    systemInfo: SystemInfo;
    currentUser: User | null;
    sidebarCollapsed?: boolean; // Adicionado prop opcional para integração
}

// --- 2. SUB-COMPONENTES AUXILIARES ---

const ToastNotification = ({ toasts, removeToast }: { toasts: ToastMsg[], removeToast: (id: number) => void }) => (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 print:hidden">
        {toasts.map(t => (
            <div key={t.id} onClick={() => removeToast(t.id)} className={`min-w-[250px] p-4 rounded-lg shadow-xl cursor-pointer animate-slide-in-right flex items-center gap-3 text-sm font-bold border-l-4 ${t.type === 'success' ? 'bg-white text-emerald-700 border-emerald-500' : t.type === 'error' ? 'bg-white text-rose-700 border-rose-500' : 'bg-white text-blue-700 border-blue-500'}`}>
                {t.type === 'success' ? <CheckCircle2 size={18} /> : t.type === 'error' ? <AlertCircle size={18} /> : <FileCheck size={18} />}
                {t.msg}
            </div>
        ))}
    </div>
);

// NOVO: MODAL DE PROGRESSO DE UPLOAD
const UploadProgressModal = ({ progress, title }: { progress: number | null, title?: string }) => {
    if (progress === null) return null;
    return (
        <div className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in print:hidden">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-[400px] text-center">
                <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={40} />
                <h3 className="text-lg font-black text-slate-800 uppercase mb-2">{title || "Enviando Arquivo..."}</h3>
                <div className="w-full bg-slate-200 rounded-full h-2.5 mb-4">
                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-xs font-bold text-slate-500">{progress}% Concluído</p>
            </div>
        </div>
    );
};

const SignaturePadModal = ({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (dataUrl: string) => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).nativeEvent.offsetX;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).nativeEvent.offsetY;
        ctx.beginPath(); ctx.moveTo(x, y); setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).nativeEvent.offsetX;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).nativeEvent.offsetY;
        ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineTo(x, y); ctx.stroke();
    };

    const stopDraw = () => { setIsDrawing(false); };
    const clear = () => { const canvas = canvasRef.current; canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height); };
    const save = () => { if (canvasRef.current) onSave(canvasRef.current.toDataURL()); };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in print:hidden">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-[500px] flex flex-col gap-4">
                <div className="flex justify-between items-center"><h3 className="font-bold text-lg text-slate-800">Assinatura Manual</h3><button onClick={onClose}><X size={20} /></button></div>
                <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 relative">
                    <canvas ref={canvasRef} width={450} height={200} className="cursor-crosshair touch-none" onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
                    <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 pointer-events-none">Desenhe aqui</div>
                </div>
                <div className="flex justify-between">
                    <button onClick={clear} className="text-rose-500 text-xs font-bold uppercase hover:underline">Limpar</button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold uppercase">Cancelar</button>
                        <button onClick={save} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase hover:bg-indigo-700">Inserir</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- NOVO COMPONENTE: MODAL DE CONFIGURAÇÃO DE PÁGINA ---
const PageSetupModal = ({ isOpen, onClose, paperSize, setPaperSize, margins, setMargins }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center animate-fade-in print:hidden">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-[400px]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Settings size={20} /> Configurar Página</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tamanho do Papel</label>
                        <select value={paperSize} onChange={(e) => setPaperSize(e.target.value)} className="w-full border rounded-lg p-2 text-sm bg-slate-50">
                            {Object.keys(PAPER_SIZES).map(key => (
                                <option key={key} value={key}>{PAPER_SIZES[key as PaperSizeKey].name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">Margem Sup. (cm)</label><input type="number" step="0.1" value={margins.top} onChange={(e) => setMargins({ ...margins, top: parseFloat(e.target.value) })} className="w-full border rounded-lg p-2 text-sm" /></div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">Margem Inf. (cm)</label><input type="number" step="0.1" value={margins.bottom} onChange={(e) => setMargins({ ...margins, bottom: parseFloat(e.target.value) })} className="w-full border rounded-lg p-2 text-sm" /></div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">Margem Esq. (cm)</label><input type="number" step="0.1" value={margins.left} onChange={(e) => setMargins({ ...margins, left: parseFloat(e.target.value) })} className="w-full border rounded-lg p-2 text-sm" /></div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">Margem Dir. (cm)</label><input type="number" step="0.1" value={margins.right} onChange={(e) => setMargins({ ...margins, right: parseFloat(e.target.value) })} className="w-full border rounded-lg p-2 text-sm" /></div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end"><button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700">Concluir</button></div>
            </div>
        </div>
    );
};

// --- FUNÇÃO DE SEGURANÇA E PERFORMANCE ---
const sanitizeHtml = (html: string) => {
    // 1. Remoção de tags e atributos perigosos (Sanitização simples sem DOMPurify)
    let cleanHtml = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
    cleanHtml = cleanHtml.replace(/on\w+="[^"]*"/gim, ""); // Remove atributos on* (onClick, onError, etc)
    cleanHtml = cleanHtml.replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, "");

    return cleanHtml;
};

// Otimização de Imagens (Simulação: Retorna URL de data)
const optimizeImageForUpload = (base64Data: string): { url: string, optimized: boolean } => {
    // Em produção, isso seria uma chamada de API para otimização
    if (base64Data.length > 500000) { // Ex: 500KB é o limite
        console.warn("Imagem grande detectada. Em produção, seria enviada para otimização.");
    }
    return { url: base64Data, optimized: base64Data.length < 500000 };
};

// --- 3. COMPONENTE PRINCIPAL ---

const DocumentHub = ({ systemInfo, currentUser, sidebarCollapsed = false }: DocumentHubProps) => {
    // --- ESTADOS ---
    const [documents, setDocuments] = useState<OfficialDocument[]>([]);
    const [activeDoc, setActiveDoc] = useState<OfficialDocument | null>(null);
    const [docStatus, setDocStatus] = useState<DocStatus>('DRAFT');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [darkMode, setDarkMode] = useState(false);

    // AI & RAG
    const [aiPrompt, setAiPrompt] = useState('');
    const [savedPrompts, setSavedPrompts] = useState<AIPromptTemplate[]>([]);
    const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
    const [showPromptLibrary, setShowPromptLibrary] = useState(false);
    const [promptTitle, setPromptTitle] = useState('');
    const [promptCategory, setPromptCategory] = useState<PromptCategory>('GERAL');
    const [useContextRAG, setUseContextRAG] = useState(true);
    const [libraryTab, setLibraryTab] = useState<'SAVED' | 'SYSTEM'>('SYSTEM');
    const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
    const [contextRules, setContextRules] = useState('');
    const [isSavingContext, setIsSavingContext] = useState(false);

    // Anexos de Sessão (Upload Rápido na Sidebar)
    const [sessionAttachment, setSessionAttachment] = useState<string>('');
    const [attachmentName, setAttachmentName] = useState<string>('');

    // Ferramentas UI
    const [showOCR, setShowOCR] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [toasts, setToasts] = useState<ToastMsg[]>([]);
    const [showVariables, setShowVariables] = useState(false);
    const [dynamicVariables, setDynamicVariables] = useState<Record<string, string>>({});
    const [showHistory, setShowHistory] = useState(false);
    const [docVersions, setDocVersions] = useState<DocumentVersion[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // NOVO: Estado de Progresso e Exportação PDF
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    // Imagem Selection State
    const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);

    // Config de Página
    const [showPageSetup, setShowPageSetup] = useState(false);
    const [currentPaper, setCurrentPaper] = useState<PaperSizeKey>('A4');
    const [pageMargins, setPageMargins] = useState({ top: 2.54, right: 2.54, bottom: 2.54, left: 2.54 });
    const [customDims, setCustomDims] = useState({ width: 800, height: 1200 });

    // Config e AutoSave
    const [draftFound, setDraftFound] = useState(false);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [stats, setStats] = useState({ words: 0, chars: 0, pages: 1 });
    const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS'>('IDLE');

    const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'PRESIDENT' || currentUser?.role === 'SINDIC';
    const editorRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageUploadRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null); // Ref para anexo de sessão
    const initialContentSet = useRef(false);

    const addToast = (type: 'success' | 'error' | 'info', msg: string) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, msg }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    // --- 4. EFEITOS (LIFECYCLE) ---
    useEffect(() => {
        loadDocuments();
        loadSavedPrompts();
        loadDynamicVariables();
        checkForDrafts();
        if (systemInfo.settings?.context_rules) setContextRules(systemInfo.settings.context_rules);
        else setContextRules(AMC_DEFAULT_CONTEXT);
    }, [systemInfo]);

    useEffect(() => {
        if (isEditorOpen && activeDoc) {
            if (editorRef.current && !initialContentSet.current) {
                editorRef.current.innerHTML = activeDoc.content || '';
                initialContentSet.current = true;
                setDocStatus((activeDoc.status as DocStatus) || 'DRAFT');
                updateStats();
                setTimeout(() => editorRef.current?.focus(), 100);
            }
            autoSaveToLocal();
            autoSaveTimerRef.current = setInterval(autoSaveToLocal, 5000);
        } else {
            initialContentSet.current = false;
            if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
            setShowHistory(false);
            setShowKnowledgeBase(false);
            setSelectedImage(null);
            setZoomLevel(100);
            if (activeDoc) setActiveDoc(null);
        }
        return () => { if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current); };
    }, [isEditorOpen, activeDoc]);

    // Listener para seleção de imagens
    useEffect(() => {
        const handleSelection = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG' && containerRef.current?.contains(target)) {
                setSelectedImage(target as HTMLImageElement);
            } else if (selectedImage && !target.closest('.sie-image-toolbar')) {
                setSelectedImage(null);
            }
        };
        document.addEventListener('click', handleSelection);
        return () => document.removeEventListener('click', handleSelection);
    }, [selectedImage]);

    // --- 5. LÓGICA DE FONTES & IMAGEM & PASTE ---

    const applyFontSize = (sizeStr: string) => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = sizeStr;

        try {
            if (!selection.isCollapsed) {
                const content = range.extractContents();
                span.appendChild(content);
                range.insertNode(span);
                selection.removeAllRanges();
            } else {
                span.innerHTML = '&#8203;';
                range.insertNode(span);
                range.setStart(span, 1);
                range.setEnd(span, 1);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            updateStats();
        } catch (e) {
            console.error("Erro ao aplicar fonte", e);
            document.execCommand('fontSize', false, '3');
        }
    };

    const triggerImageUpload = () => imageUploadRef.current?.click();

    // UPLOAD COM PROGRESSO (IMAGENS)
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadProgress(0); // Inicia progresso

        const reader = new FileReader();
        reader.onprogress = (data) => {
            if (data.lengthComputable) {
                const progress = Math.round((data.loaded / data.total) * 100);
                setUploadProgress(progress);
            }
        };

        reader.onload = (event) => {
            setUploadProgress(100);
            setTimeout(() => {
                if (event.target?.result) {
                    const imgHtml = `<img src="${event.target.result}" style="max-width:100%; height:auto; display:block; margin: 10px auto;" />`;
                    execCommand('insertHTML', imgHtml);
                }
                setUploadProgress(null); // Fecha modal
            }, 500);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const updateImageStyle = (style: Partial<CSSStyleDeclaration>) => {
        if (selectedImage) {
            Object.assign(selectedImage.style, style);
            if (editorRef.current) editorRef.current.focus();
        }
    };

    const removeSelectedImage = () => {
        if (selectedImage) {
            selectedImage.remove();
            setSelectedImage(null);
        }
    };

    // --- NOVO: Manipulador de Paste (Sanitização e Otimização) ---
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;

        // 1. Tenta colar imagem primeiro
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith("image/")) {
                e.preventDefault();
                const blob = items[i].getAsFile();
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64Data = event.target?.result as string;
                    // Simula otimização
                    const { url } = optimizeImageForUpload(base64Data);
                    const imgHtml = `<img src="${url}" style="max-width:100%; height:auto; display:block; margin: 10px auto;" />`;
                    execCommand('insertHTML', imgHtml);
                };
                if (blob) reader.readAsDataURL(blob);
                return;
            }
        }

        // 2. Se for texto/html, sanitiza
        const html = e.clipboardData.getData('text/html');
        if (html) {
            e.preventDefault();
            const cleanHtml = sanitizeHtml(html);
            execCommand('insertHTML', cleanHtml);
            return;
        }

        // Se for texto plano, deixa o navegador lidar
    };

    // --- 6. LÓGICA DE NEGÓCIO ---

    // RAG: Salvar Regras
    const saveKnowledgeBase = async () => {
        setIsSavingContext(true);
        try {
            const updatedSettings = { ...systemInfo.settings, context_rules: contextRules };
            await systemService.updateInfo({ ...systemInfo, settings: updatedSettings });
            addToast('success', "Cérebro Jurídico atualizado e salvo!");
            setShowKnowledgeBase(false);
        } catch (error) { console.error(error); addToast('error', "Erro ao salvar Regimento."); }
        finally { setIsSavingContext(false); }
    };

    // Upload de Texto para RAG
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadProgress(0);

        if (file.type === "text/plain") {
            const reader = new FileReader();
            reader.onprogress = (data) => {
                if (data.lengthComputable) setUploadProgress(Math.round((data.loaded / data.total) * 100));
            };
            reader.onload = (e) => {
                setUploadProgress(100);
                setTimeout(() => {
                    const text = e.target?.result as string;
                    setContextRules(prev => prev + "\n\n" + text);
                    setUploadProgress(null);
                }, 500);
            };
            reader.readAsText(file);
        } else {
            addToast('error', "Apenas arquivos .TXT suportados.");
            setUploadProgress(null);
        }
    };

    // --- NOVO: Drag & Drop para Contexto Local (Attachment) ---
    const handleAttachmentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadProgress(0);
        setAttachmentName(file.name);

        const reader = new FileReader();
        reader.onprogress = (data) => {
            if (data.lengthComputable) setUploadProgress(Math.round((data.loaded / data.total) * 100));
        };
        reader.onload = (e) => {
            setUploadProgress(100);
            setTimeout(() => {
                const content = e.target?.result as string;
                setSessionAttachment(content); // Guarda o conteúdo na sessão (base64 ou texto)
                addToast('success', `Anexo "${file.name}" carregado na sessão.`);
                setUploadProgress(null);
            }, 500);
        };

        if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file); // Base64 para imagens
        } else {
            reader.readAsText(file); // Texto para TXT/MD
        }
        event.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.currentTarget.classList.add('border-indigo-500', 'bg-indigo-50'); };
    const handleDragLeave = (e: React.DragEvent) => { e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50'); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50');
        const file = e.dataTransfer.files[0];
        if (file) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            // Simula evento de change no input
            handleAttachmentUpload({ target: { files: dataTransfer.files } } as any);
        }
    };

    // Assinatura Inteligente
    const insertSignatureFromSystem = () => {
        const signatureUrl = systemInfo.president_signature || systemInfo.settings?.president_signature;
        const presidentName = systemInfo.president_name || systemInfo.settings?.president_name || "Presidente";
        if (signatureUrl) {
            const signatureHtml = `<div style="margin-top:40px; page-break-inside:avoid; display:inline-block; text-align:left;"><img src="${signatureUrl}" style="height:60px; display:block; margin-bottom:5px;" alt="Assinatura Digital" /><div style="border-top:1px solid #000; min-width:250px; padding-top:5px;"><strong>${presidentName}</strong><br/><span style="font-size:10pt;">Presidente - AMC</span><br/><span style="font-size:8pt; color:#666;">Assinado Digitalmente</span></div></div><p><br/></p>`;
            execCommand('insertHTML', signatureHtml);
            addToast('success', "Assinatura do Sistema inserida.");
        } else {
            addToast('info', "Assinatura não cadastrada. Abrindo modo manual...");
            setShowSignatureModal(true);
        }
    };

    const handleInsertManualSignature = (dataUrl: string) => {
        const presidentName = systemInfo.president_name || "Presidente";
        const signatureHtml = `<div style="margin-top:40px; page-break-inside:avoid; display:inline-block; text-align:left;"><img src="${dataUrl}" style="height:60px; display:block; margin-bottom:5px;" /><div style="border-top:1px solid #000; min-width:250px; padding-top:5px;"><strong>${presidentName} (Manual)</strong><br/><span style="font-size:10pt;">Presidente - AMC</span></div></div><p><br/></p>`;
        execCommand('insertHTML', signatureHtml);
        setShowSignatureModal(false);
        addToast('success', "Assinatura manual inserida!");
    };

    const handleMagicRewrite = async () => {
        const selection = window.getSelection();
        const text = selection?.toString();
        if (!text) return addToast('info', "Selecione um texto para reescrever.");
        setIsGenerating(true);
        try {
            const prompt = `Atue como um advogado experiente. Reescreva o seguinte trecho para torná-lo mais formal, jurídico e adequado a um ofício oficial: "${text}"`;
            const res = await aiService.generateDocument(prompt);
            if (res.data?.text) {
                document.execCommand('insertHTML', false, `<span style="background-color: #d1fae5">${res.data.text}</span>`);
                addToast('success', "Texto reescrito com sucesso!");
            }
        } catch (e) { addToast('error', "Erro ao reescrever."); }
        finally { setIsGenerating(false); }
    };

    const handleGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        try {
            // Combina contexto RAG global + Anexo local da sessão
            let fullContext = useContextRAG ? (contextRules || AMC_DEFAULT_CONTEXT) : '';
            if (sessionAttachment) {
                fullContext += `\n\n[DOCUMENTO DE REFERÊNCIA ANEXADO]:\n${sessionAttachment.substring(0, 5000)}... (Truncado)`;
            }

            const res = await aiService.generateDocument(aiPrompt, fullContext);
            const content = res.data?.text;
            if (editorRef.current && content) {
                execCommand('insertHTML', content);
                addToast('success', "Documento gerado!");
            }
            updateStats();
        } catch (e) { addToast('error', "Erro na geração da IA."); }
        finally { setIsGenerating(false); }
    };

    const loadDocuments = async () => { setIsLoading(true); try { const res = await documentService.getAll(); setDocuments(res.data?.data || []); } catch (e) { setDocuments([]); } finally { setIsLoading(false); } };

    const handleSave = async () => {
        if (!activeDoc || !activeDoc.title) return addToast('error', "Defina um título.");
        setIsSaving(true); setSaveStatus('SAVING');
        try {
            const payload = { ...activeDoc, content: editorRef.current?.innerHTML || '', status: docStatus };
            if (typeof activeDoc.id === 'string' && activeDoc.id.startsWith('temp_')) await documentService.create(payload);
            else await documentService.update(String(activeDoc.id), payload);
            setSaveStatus('SUCCESS'); localStorage.removeItem('sie_doc_draft'); addToast('success', "Salvo com sucesso!");
            setTimeout(() => { setSaveStatus('IDLE'); setIsEditorOpen(false); loadDocuments(); }, 800);
        } catch (e) { setSaveStatus('IDLE'); addToast('error', "Erro ao salvar."); } finally { setIsSaving(false); }
    };

    const loadSavedPrompts = async () => { try { const res = await aiService.listPrompts(); setSavedPrompts(Array.isArray(res.data?.data) ? res.data.data : []); } catch (e) { } };
    const loadDynamicVariables = async () => { try { const vars = { '{{NOME_CONDOMINIO}}': systemInfo.name, '{{CNPJ}}': systemInfo.cnpj || 'N/A', '{{PRESIDENTE}}': systemInfo.president_name || 'N/A', '{{DATA_ATUAL}}': new Date().toLocaleDateString('pt-BR') }; setDynamicVariables(vars); } catch (e) { } };
    const insertVariable = (key: string) => { execCommand('insertHTML', `<span contenteditable="false" class="sie-variable-tag" data-tag="${key}" style="background:#e0e7ff; color:#4338ca; padding:2px 6px; border-radius:4px; font-size:0.85em; font-weight:bold; letter-spacing:0.5px; border:1px solid #c7d2fe; margin:0 2px; user-select:all;">${key}</span>&nbsp;`); setShowVariables(false); };
    const loadDocHistory = async () => { if (!activeDoc || String(activeDoc.id).startsWith('temp')) return; setIsLoadingHistory(true); setShowHistory(true); try { const res = await documentService.getHistory(activeDoc.id); setDocVersions(res.data || []); } catch (e) { } finally { setIsLoadingHistory(false); } };
    const handleRestoreVersion = async (v: DocumentVersion) => { if (confirm("Restaurar?")) { if (editorRef.current) { editorRef.current.innerHTML = v.content; updateStats(); setShowHistory(false); addToast('info', "Versão restaurada."); } } };

    // Salvar Prompt com Categoria
    const handleSavePrompt = async () => {
        if (!promptTitle || !aiPrompt) return addToast('error', "Preencha título e conteúdo.");
        try {
            const payload = { title: promptTitle, content: aiPrompt, category: promptCategory, is_favorite: false };
            await aiService.createPrompt(payload);
            setPromptTitle(''); setShowPromptLibrary(false); setLibraryTab('SAVED');
            addToast('success', "Prompt salvo na Biblioteca!"); loadSavedPrompts();
        } catch (e) { console.error(e); addToast('error', "Erro ao salvar prompt."); }
    };

    const handleDeletePrompt = async (id: any, e: any) => { e.stopPropagation(); if (confirm("Excluir?")) { await aiService.deletePrompt(id); setSavedPrompts(prev => prev.filter(p => p.id !== id)); addToast('info', "Prompt excluído."); } };

    const handleOpenEditor = (doc: OfficialDocument | null) => {
        setActiveDoc(doc || { id: `temp_${Date.now()}`, title: '', content: '<p style="font-size: 12pt;">...</p>', type: 'OFICIO', status: 'DRAFT', updated_at: new Date().toISOString() });
        setIsEditorOpen(true); setIsFullScreen(false); setPreviewMode(false); setCurrentPaper('A4'); setZoomLevel(100);
    };
    const getActiveDimensions = () => (currentPaper === 'CUSTOM' ? { name: 'Personalizado', ...customDims } : PAPER_SIZES[currentPaper]);
    const updateStats = useCallback(() => { if (editorRef.current) { const text = editorRef.current.innerText || ''; const dims = getActiveDimensions(); const estPages = Math.max(1, Math.ceil(editorRef.current.scrollHeight / (dims.height + PAGE_GAP_PX))); setStats({ words: text.split(/\s+/).filter(w => w.length > 0).length, chars: text.length, pages: estPages }); } }, [currentPaper, customDims]);
    const execCommand = (cmd: string, val: string | undefined = undefined) => { document.execCommand(cmd, false, val); if (editorRef.current) editorRef.current.focus(); updateStats(); };

    // --- GERAÇÃO DE PDF REAL (NOVO: html2pdf dinâmico) ---
    const handleRealPDFExport = async () => {
        if (!editorRef.current) return;

        setIsExportingPDF(true);
        addToast('info', "Gerando PDF Real... Aguarde.");

        try {
            // Injeção Dinâmica do Script (para não depender de npm install)
            if (!(window as any).html2pdf) {
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
                    script.onload = () => resolve();
                    script.onerror = () => reject();
                    document.head.appendChild(script);
                });
            }

            const element = editorRef.current;
            const opt = {
                margin: [pageMargins.top, pageMargins.left, pageMargins.bottom, pageMargins.right], // converte cm para unidade padrão do lib
                filename: `${activeDoc?.title || 'documento'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'cm', format: currentPaper === 'CUSTOM' ? [customDims.width / 37.8, customDims.height / 37.8] : currentPaper.toLowerCase(), orientation: 'portrait' }
            };

            // @ts-ignore
            await (window as any).html2pdf().set(opt).from(element).save();
            addToast('success', "PDF baixado com sucesso!");

        } catch (error) {
            console.error("Erro PDF:", error);
            addToast('error', "Erro ao gerar PDF. Use a opção de Imprimir como alternativa.");
        } finally {
            setIsExportingPDF(false);
        }
    };

    // Impressão Nativa (Fallback)
    const handlePrint = () => { window.print(); };

    const checkForDrafts = () => { if (localStorage.getItem('sie_doc_draft')) setDraftFound(true); };
    const autoSaveToLocal = () => { if (editorRef.current && activeDoc && editorRef.current.innerHTML.length > 50) localStorage.setItem('sie_doc_draft', JSON.stringify({ docId: activeDoc.id, content: editorRef.current.innerHTML, timestamp: Date.now() })); };
    const recoverDraft = () => { const draft = JSON.parse(localStorage.getItem('sie_doc_draft') || '{}'); if (editorRef.current) { editorRef.current.innerHTML = draft.content; updateStats(); addToast('info', "Recuperado."); } setDraftFound(false); };
    const discardDraft = () => { localStorage.removeItem('sie_doc_draft'); setDraftFound(false); };

    const insertTable = () => execCommand('insertHTML', `<table style="width:100%; border-collapse: collapse; margin: 1em 0;"><thead><tr><th style="border:1px solid #000; padding:8px; background:#f0f0f0;">H1</th><th style="border:1px solid #000; padding:8px; background:#f0f0f0;">H2</th></tr></thead><tbody><tr><td style="border:1px solid #000; padding:8px;">.</td><td style="border:1px solid #000; padding:8px;">.</td></tr></tbody></table><p><br/></p>`);
    const insertLogo = () => { const logoUrl = systemInfo.logoUrl || systemInfo.settings?.logoUrl; if (!logoUrl) return addToast('error', "Logo não configurado."); execCommand('insertHTML', `<div style="text-align:center; margin-bottom:20px;"><img src="${logoUrl}" style="height:80px; width:auto;" /></div>`); };

    const ToolbarBtn = ({ icon: Icon, action, active = false, title }: any) => (<button onClick={action} title={title} className={`p-1.5 rounded-sm transition-all flex items-center justify-center min-w-[28px] ${active ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-200 text-slate-700'}`}><Icon size={16} strokeWidth={2} /></button>);
    const ToolbarDivider = () => <div className="w-[1px] h-6 bg-slate-300 mx-1"></div>;
    const activeDims = getActiveDimensions();

    // LÓGICA DE AUDITORIA CORRETIVA: Limite da tela de edição
    const SIDEBAR_WIDTH_LG_EXPANDED = 300;
    const SIDEBAR_WIDTH_LG_COLLAPSED = 80;

    const dynamicLeftStyle = useMemo(() => {
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
            const width = sidebarCollapsed ? SIDEBAR_WIDTH_LG_COLLAPSED : SIDEBAR_WIDTH_LG_EXPANDED;
            return { left: `${width}px`, width: `calc(100% - ${width}px)` };
        }
        return {};
    }, [sidebarCollapsed]);

    const printStyles = `
        @media print { 
            @page { 
                size: ${currentPaper} portrait; 
                margin-top: ${pageMargins.top}cm;
                margin-right: ${pageMargins.right}cm;
                margin-bottom: ${pageMargins.bottom}cm;
                margin-left: ${pageMargins.left}cm;
            } 
            body { 
                background: white; 
                -webkit-print-color-adjust: exact; 
                margin: 0; 
                padding: 0; 
                font-family: "Times New Roman", serif;
                font-size: 12pt;
                color: #000 !important; 
            } 
            .sie-editor-overlay { position: static !important; top: 0 !important; left: 0 !important; width: 100% !important; height: auto !important; background: white !important; padding: 0 !important; z-index: 9999 !important; display: block !important; } 
            .sie-editor-overlay > div { box-shadow: none !important; border-radius: 0 !important; width: 100% !important; max-width: none !important; height: auto !important; display: block !important; overflow: visible !important; position: static !important; } 
            .sie-editor-overlay > div > div:not(#printable-canvas):not([contenteditable]), .ToastNotification, .sie-image-toolbar, .fixed:not(.sie-editor-overlay), header, button, .absolute:not(.sie-image-toolbar), .hidden { display: none !important; } 
            .sie-image-toolbar { display: none !important; }
            #printable-canvas { 
                position: static !important; transform: none !important; margin: 0 auto !important; width: 100% !important; height: auto !important; display: block !important; padding: 0 !important; box-shadow: none !important;
            }
            [contenteditable] { box-shadow: none !important; margin: 0 !important; width: 100% !important; min-height: auto !important; height: auto !important; overflow: visible !important; background: none !important; color: black !important; background-image: none !important; padding: 0 !important; position: static !important; } 
            .sie-variable-tag { background: none !important; color: black !important; border: none !important; font-weight: normal !important; user-select: none !important; }
        }
    `;

    return (
        <div className={`h-full flex flex-col gap-6 animate-fade-in relative min-h-[800px] ${darkMode ? 'dark' : ''}`}>
            <input type="file" ref={imageUploadRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            <input type="file" ref={attachmentInputRef} className="hidden" accept=".txt,.md,.jpg,.jpeg,.png" onChange={handleAttachmentUpload} />
            <input type="file" ref={fileInputRef} className="hidden" accept=".txt" />

            <ToastNotification toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
            <UploadProgressModal progress={uploadProgress} />
            <SignaturePadModal isOpen={showSignatureModal} onClose={() => setShowSignatureModal(false)} onSave={handleInsertManualSignature} />
            <PageSetupModal isOpen={showPageSetup} onClose={() => setShowPageSetup(false)} paperSize={currentPaper} setPaperSize={setCurrentPaper} margins={pageMargins} setMargins={setPageMargins} />

            {/* HEADER GERAL */}
            <header className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white shrink-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg"><FileSignature size={28} /></div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Hub de Documentos</h2>
                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-2">SRE Ghostwriter Active V213.0 (Gold Master)</p>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    {canManage && <button onClick={() => handleOpenEditor(null)} className="px-10 py-4 bg-white text-slate-950 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-50 flex items-center gap-3"><Plus size={20} /> Criar Protocolo</button>}
                </div>
            </header>

            {/* LISTAGEM DE DOCUMENTOS */}
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
                <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center shrink-0">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 h-14 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-inner outline-none uppercase" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{documents.length} Docs</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} /></div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {documents.filter(d => (d.title || '').toLowerCase().includes(searchTerm.toLowerCase())).map(doc => (
                                <div key={doc.id} onClick={() => handleOpenEditor(doc)} className="bg-white p-8 rounded-[3rem] border border-slate-100 hover:border-indigo-200 cursor-pointer hover:shadow-2xl transition-all group flex flex-col min-h-[250px]">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600"><FileText size={24} /></div>
                                        <div className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${STATUS_LABELS[doc.status as DocStatus]?.color || 'bg-gray-100'}`}>{STATUS_LABELS[doc.status as DocStatus]?.label || 'Rascunho'}</div>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 uppercase leading-tight line-clamp-2">{doc.title || "Sem Título"}</h3>
                                    <div className="flex justify-between mt-auto pt-4 border-t border-slate-50 items-center">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{new Date(doc.updated_at).toLocaleDateString()}</span>
                                        {canManage && <button onClick={(e) => { e.stopPropagation(); if (confirm("Excluir?")) documentService.delete(doc.id).then(loadDocuments); }} className="text-slate-300 hover:text-rose-600"><Trash2 size={16} /></button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* EDITOR OVERLAY */}
            {isEditorOpen && activeDoc && (
                <div className="sie-editor-overlay fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 animate-fade-in" style={dynamicLeftStyle}>
                    <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} w-full h-full flex flex-col overflow-hidden shadow-2xl relative transition-all duration-300 ${isFullScreen ? 'rounded-none max-w-none' : 'md:rounded-[1.5rem] max-w-[1800px]'}`}>

                        {/* ALERT DRAFT */}
                        {draftFound && (
                            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-amber-50 border border-amber-200 text-amber-800 px-6 py-3 rounded-xl shadow-2xl z-[70] flex items-center gap-4 animate-bounce-in">
                                <AlertTriangle size={20} />
                                <div className="flex flex-col"><span className="font-bold text-xs uppercase">Rascunho não salvo</span><span className="text-[10px]">Recuperar?</span></div>
                                <div className="flex gap-2"><button onClick={recoverDraft} className="px-3 py-1.5 bg-amber-200 rounded text-[10px] font-bold">Sim</button><button onClick={discardDraft} className="px-3 py-1.5 bg-transparent border border-amber-300 rounded text-[10px] font-bold">Não</button></div>
                            </div>
                        )}

                        {/* HEADER EDITOR */}
                        <div className={`h-16 px-6 ${darkMode ? 'bg-slate-900' : 'bg-slate-900'} text-white flex justify-between items-center shrink-0 z-50`}>
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-indigo-600 rounded-lg"><FileSignature size={18} /></div>
                                <input className="font-black text-sm uppercase bg-transparent border-none outline-none p-0 w-[250px] text-white focus:ring-0 placeholder-white/30" value={activeDoc.title} onChange={e => setActiveDoc({ ...activeDoc, title: e.target.value })} placeholder="Título..." />

                                <div className="relative group">
                                    <select value={docStatus} onChange={(e) => setDocStatus(e.target.value as DocStatus)} className="appearance-none bg-slate-800 border border-slate-700 text-white text-[10px] font-bold uppercase rounded px-3 py-1 pr-6 cursor-pointer hover:bg-slate-700 transition-colors">
                                        {Object.entries(STATUS_LABELS).map(([key, val]) => (
                                            <option key={key} value={key}>{val.label}</option>
                                        ))}
                                    </select>
                                    <ChevronRight size={12} className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                                </div>
                                <span className="text-[9px] font-black bg-white/10 px-2 py-0.5 rounded text-indigo-300">{stats.words} PLV</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg" title="Modo Escuro">{darkMode ? <Sun size={16} /> : <Moon size={16} />}</button>
                                <button onClick={loadDocHistory} className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg" title="Histórico"><History size={16} /></button>
                                <button onClick={() => setShowKnowledgeBase(true)} className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg flex items-center gap-2" title="Cérebro Jurídico"><BrainCircuit size={16} /></button>
                                <button onClick={() => setShowVariables(!showVariables)} className="p-2 bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white rounded-lg"><Variable size={16} /></button>
                                {showVariables && (
                                    <div className="absolute top-full right-40 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-[60] text-slate-800">
                                        <div className="p-2 border-b bg-slate-50 text-[9px] font-black uppercase text-slate-400">Variáveis</div>
                                        {Object.keys(dynamicVariables).map(key => <button key={key} onClick={() => insertVariable(key)} className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-indigo-50 text-indigo-700">{key}</button>)}
                                    </div>
                                )}

                                {/* BOTÃO EXPORTAR PDF REAL (HTML2PDF) */}
                                <button onClick={handleRealPDFExport} disabled={isExportingPDF} className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center gap-1" title="Baixar PDF">
                                    {isExportingPDF ? <Loader2 size={16} className="animate-spin" /> : <FileOutput size={16} />}
                                </button>

                                <button onClick={handlePrint} className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg" title="Imprimir (Nativo)"><Printer size={16} /></button>
                                <button onClick={() => setPreviewMode(!previewMode)} className={`p-2 rounded-lg ${previewMode ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400'}`}><Eye size={16} /></button>
                                <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg hidden md:block">{isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
                                <button onClick={handleSave} disabled={isSaving} className={`px-4 py-2 ${saveStatus === 'SUCCESS' ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-500'} text-white rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ml-2`}>
                                    {isSaving ? <Loader2 className="animate-spin" size={14} /> : saveStatus === 'SUCCESS' ? <CheckSquare size={14} /> : <Save size={14} />} {saveStatus === 'SUCCESS' ? 'Salvo' : 'Salvar'}
                                </button>
                                <button onClick={() => { setIsEditorOpen(false); setActiveDoc(null); }} className="p-2 hover:bg-rose-500 hover:text-white text-slate-400 rounded-lg ml-2"><X size={20} /></button>
                            </div>
                        </div>

                        {/* --- BARRA DE FERRAMENTAS --- */}
                        {!previewMode && (
                            <div className={`flex items-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-[#f0f3f9] border-slate-300'} border-b px-4 py-1.5 shrink-0 gap-1 overflow-x-auto custom-scrollbar select-none z-40 h-[48px]`}>
                                <div className="flex gap-0.5"><ToolbarBtn icon={Undo2} action={() => execCommand('undo')} title="Desfazer" /><ToolbarBtn icon={Redo2} action={() => execCommand('redo')} title="Refazer" /></div><ToolbarDivider />
                                <div className="flex items-center gap-2 mr-2">
                                    <select className="h-7 text-xs bg-transparent border-none outline-none font-medium text-slate-700 cursor-pointer hover:bg-slate-200 rounded px-1" onChange={(e) => execCommand('formatBlock', e.target.value)}><option value="P">Normal</option><option value="H1">Título 1</option><option value="H2">Título 2</option></select>
                                    <div className="w-[1px] h-4 bg-slate-300"></div>
                                    <select className="h-7 text-xs bg-transparent border-none outline-none font-medium text-slate-700 cursor-pointer hover:bg-slate-200 rounded px-1 w-24" onChange={(e) => execCommand('fontName', e.target.value)}><option value="Times New Roman">Times New Roman</option><option value="Arial">Arial</option></select>
                                    <div className="w-[1px] h-4 bg-slate-300"></div>
                                    <select className="h-7 text-xs bg-transparent border-none outline-none font-medium text-slate-700 cursor-pointer hover:bg-slate-200 rounded px-1 w-12" onChange={(e) => applyFontSize(e.target.value)}>
                                        <option value="12px">12</option>
                                        {FONT_SIZES.map(fs => <option key={fs.val} value={fs.val}>{fs.label.replace('px', '')}</option>)}
                                    </select>
                                </div><ToolbarDivider />
                                <div className="flex gap-0.5"><ToolbarBtn icon={Bold} action={() => execCommand('bold')} title="Negrito" /><ToolbarBtn icon={Italic} action={() => execCommand('italic')} title="Itálico" /><ToolbarBtn icon={Underline} action={() => execCommand('underline')} title="Sublinhado" /><button onClick={handleMagicRewrite} title="Reescrever com IA" className="p-1.5 rounded-sm transition-all flex items-center justify-center min-w-[28px] bg-purple-100 text-purple-700 hover:bg-purple-200"><Wand2 size={16} strokeWidth={2} /></button></div><ToolbarDivider />
                                <div className="flex gap-0.5"><ToolbarBtn icon={AlignLeft} action={() => execCommand('justifyLeft')} title="Esquerda" /><ToolbarBtn icon={AlignCenter} action={() => execCommand('justifyCenter')} title="Centro" /><ToolbarBtn icon={AlignRight} action={() => execCommand('justifyRight')} title="Direita" /><ToolbarBtn icon={AlignJustify} action={() => execCommand('justifyFull')} title="Justificar" /></div><ToolbarDivider />
                                <div className="flex gap-0.5 items-center">
                                    <ToolbarBtn icon={LinkIcon} action={() => { const url = prompt("URL:"); if (url) execCommand('createLink', url); }} title="Link" />
                                    <ToolbarBtn icon={TableIcon} action={insertTable} title="Tabela" />

                                    {/* UPLOAD IMAGEM */}
                                    <button onClick={triggerImageUpload} title="Inserir Imagem" className="p-1.5 rounded-sm hover:bg-slate-200 text-slate-700"><ImagePlus size={16} /></button>

                                    <ToolbarBtn icon={ImageIcon} action={insertLogo} title="Logo do Sistema" />
                                    {/* BOTÕES DE ASSINATURA */}
                                    <div className="flex bg-slate-200 rounded p-0.5 gap-0.5">
                                        <button onClick={insertSignatureFromSystem} title="Assinar (Banco de Dados)" className="p-1.5 rounded-sm hover:bg-white text-emerald-700"><Database size={16} /></button>
                                        <button onClick={() => setShowSignatureModal(true)} title="Assinar (Manual)" className="p-1.5 rounded-sm hover:bg-white text-slate-700"><PenTool size={16} /></button>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2 bg-white rounded-md border border-slate-300 px-1 py-0.5"><button onClick={() => setZoomLevel(z => Math.max(50, z - 10))} className="p-0.5 hover:bg-slate-100 rounded"><Minus size={12} /></button><span className="text-[10px] font-bold w-8 text-center">{zoomLevel}%</span><button onClick={() => setZoomLevel(z => Math.min(200, z + 10))} className="p-0.5 hover:bg-slate-100 rounded"><PlusIcon size={12} /></button></div>

                                    <ToolbarBtn icon={Settings} action={() => setShowPageSetup(true)} title="Configurar Página" />
                                </div>
                                <button onClick={() => setShowOCR(true)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded shadow-sm text-[10px] font-bold ml-auto hover:bg-indigo-700 transition-colors uppercase tracking-wider"><Camera size={14} /> OCR</button>
                            </div>
                        )}

                        {/* BODY E SIDEBAR */}
                        <div className={`flex-1 flex overflow-hidden ${darkMode ? 'bg-slate-900' : 'bg-[#e2e8f0]'} relative`} ref={containerRef}>
                            {!isFullScreen && !previewMode && (
                                <div className={`hidden xl:flex w-[350px] ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-r flex-col shrink-0 z-30 shadow-lg`}>
                                    <div className={`flex border-b ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                        <button onClick={() => setShowPromptLibrary(false)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${!showPromptLibrary ? 'bg-transparent text-indigo-500 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Ghostwriter</button>
                                        <button onClick={() => setShowPromptLibrary(true)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${showPromptLibrary ? 'bg-transparent text-indigo-500 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Biblioteca</button>
                                    </div>

                                    {!showPromptLibrary ? (
                                        <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
                                            {/* RAG INFO */}
                                            <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                                <div className="flex items-center gap-2 text-indigo-800"><BrainCircuit size={16} /><span className="text-xs font-bold">RAG Ativo</span></div>
                                                <button onClick={() => setUseContextRAG(!useContextRAG)} className={`w-8 h-4 rounded-full relative ${useContextRAG ? 'bg-indigo-600' : 'bg-slate-300'}`}><div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${useContextRAG ? 'translate-x-4' : ''}`}></div></button>
                                            </div>
                                            <div className="text-[10px] text-slate-500">{contextRules ? "Regras carregadas." : "Usando Regras Padrão AMC."}</div>

                                            {/* ÁREA DE ANEXOS (CONTEXTO LOCAL) - DRAG & DROP INTEGRADO */}
                                            <div
                                                className="bg-slate-50 p-3 rounded-xl border border-slate-200 sie-attachment-dropzone transition-colors"
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1"><Paperclip size={12} /> Referência</span>
                                                    {sessionAttachment && <button onClick={() => { setSessionAttachment(''); setAttachmentName(''); }} className="text-[9px] text-rose-500 font-bold hover:underline">Remover</button>}
                                                </div>
                                                {sessionAttachment ? (
                                                    <div className="flex items-center gap-2 bg-white p-2 rounded border border-emerald-200 text-emerald-700">
                                                        <FileCheck size={16} />
                                                        <span className="text-[10px] font-bold truncate">{attachmentName} (Carregado)</span>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => attachmentInputRef.current?.click()} className="w-full py-2 bg-white border border-dashed border-indigo-300 text-indigo-500 rounded text-[10px] font-bold hover:bg-indigo-50">
                                                        Anexar Doc. Base (TXT/IMG)
                                                    </button>
                                                )}
                                            </div>

                                            <textarea className={`w-full h-64 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200'} rounded-xl p-4 text-sm outline-none focus:border-indigo-500 transition-all resize-none shadow-inner`} placeholder="Ex: Redigir notificação..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />

                                            <div className="flex gap-2 w-full mt-auto">
                                                <button onClick={handleGenerate} disabled={isGenerating || !aiPrompt.trim()} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 flex items-center justify-center gap-2 transition-all">
                                                    {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} Gerar
                                                </button>
                                                {/* BOTÃO BOOKMARK QUE LEVA AO FORM DE SALVAR */}
                                                <button onClick={() => { if (aiPrompt.trim()) { setPromptTitle(''); setShowPromptLibrary(true); setLibraryTab('SAVED'); } else { addToast('info', "Escreva um comando antes."); } }} className="px-4 py-3 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 rounded-xl shadow-sm transition-all" title="Salvar Prompt">
                                                    <Bookmark size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col overflow-hidden">
                                            {/* Sub-abas da Biblioteca */}
                                            <div className="flex p-2 gap-2 bg-slate-50 border-b border-slate-100">
                                                <button onClick={() => setLibraryTab('SYSTEM')} className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg uppercase ${libraryTab === 'SYSTEM' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-100'}`}>Modelos AMC</button>
                                                <button onClick={() => setLibraryTab('SAVED')} className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg uppercase ${libraryTab === 'SAVED' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-100'}`}>Meus Prompts</button>
                                            </div>

                                            <div className="p-4 overflow-y-auto">
                                                {/* TAB: SYSTEM PROMPTS */}
                                                {libraryTab === 'SYSTEM' && SYSTEM_PROMPTS.map(p => (
                                                    <div key={p.id} onClick={() => { setAiPrompt(p.content); setShowPromptLibrary(false); }} className="p-3 mb-2 bg-slate-50 border rounded-lg cursor-pointer hover:bg-slate-100">
                                                        <h4 className="font-bold text-xs">{p.title}</h4>
                                                    </div>
                                                ))}

                                                {/* TAB: SAVED PROMPTS & SAVE FORM */}
                                                {libraryTab === 'SAVED' && (
                                                    <>
                                                        {/* FORM DE SALVAR (Só aparece se tiver algo no input da IA) */}
                                                        {aiPrompt && (
                                                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-4 animate-fade-in">
                                                                <span className="text-[10px] font-bold text-emerald-700 uppercase mb-2 block">Salvar Prompt Atual</span>
                                                                <input className="w-full mb-2 text-xs p-2 border rounded focus:outline-none focus:border-emerald-500" placeholder="Título..." value={promptTitle} onChange={e => setPromptTitle(e.target.value)} />
                                                                <select className="w-full mb-2 text-xs p-2 border rounded bg-white" value={promptCategory} onChange={e => setPromptCategory(e.target.value as any)}>
                                                                    <option value="GERAL">Geral</option>
                                                                    <option value="ADM">Administrativo</option>
                                                                    <option value="JURIDICO">Jurídico</option>
                                                                    <option value="FINANCEIRO">Financeiro</option>
                                                                    <option value="TURISMO">Turismo</option>
                                                                    <option value="OBRAS">Obras</option>
                                                                    <option value="SAÚDE">Saúde</option>
                                                                    <option value="EDUCAÇÃO">Educação</option>
                                                                </select>
                                                                <button onClick={handleSavePrompt} className="w-full py-1.5 bg-emerald-600 text-white text-xs font-bold rounded uppercase hover:bg-emerald-700">SALVAR</button>
                                                            </div>
                                                        )}

                                                        {/* LISTA DE SALVOS */}
                                                        {savedPrompts.length === 0 && !aiPrompt && <p className="text-xs text-slate-400 text-center py-4">Nenhum prompt salvo.</p>}

                                                        {savedPrompts.map(prompt => (
                                                            <div key={prompt.id} className="p-3 mb-2 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 relative group cursor-pointer" onClick={() => { setAiPrompt(prompt.content); setShowPromptLibrary(false); }}>
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="text-[9px] bg-slate-100 px-1.5 rounded text-slate-500 font-bold">{prompt.category}</span>
                                                                    <button onClick={(e) => handleDeletePrompt(prompt.id, e)} className="text-slate-300 hover:text-rose-500"><X size={12} /></button>
                                                                </div>
                                                                <h4 className="font-bold text-xs text-slate-800">{prompt.title}</h4>
                                                            </div>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* CANVAS - ID PRINTABLE-CANVAS ADICIONADO PARA IMPRESSÃO CORRETA */}
                            {/* CORREÇÃO 3: Adicionado px-20 para garantir margem segura para o canvas, evitando clipping pela sidebar */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 flex flex-col items-center relative px-2 md:px-20">
                                <div id="printable-canvas" className="relative transition-transform duration-200 origin-top" style={{ transform: `scale(${zoomLevel / 100})` }}>

                                    {/* MENU FLUTUANTE DE IMAGEM (NOVO) - Escondido no PRINT */}
                                    {selectedImage && (
                                        <div className="sie-image-toolbar absolute z-50 flex gap-2 p-2 bg-slate-900 rounded-lg shadow-xl -mt-16 animate-bounce-in left-1/2 -translate-x-1/2 print:hidden" style={{ top: selectedImage.offsetTop }}>
                                            <button onClick={() => updateImageStyle({ width: '25%' })} className="text-[10px] text-white font-bold bg-slate-700 px-2 py-1 rounded hover:bg-slate-600">25%</button>
                                            <button onClick={() => updateImageStyle({ width: '50%' })} className="text-[10px] text-white font-bold bg-slate-700 px-2 py-1 rounded hover:bg-slate-600">50%</button>
                                            <button onClick={() => updateImageStyle({ width: '75%' })} className="text-[10px] text-white font-bold bg-slate-700 px-2 py-1 rounded hover:bg-slate-600">75%</button>
                                            <button onClick={() => updateImageStyle({ width: '100%' })} className="text-[10px] text-white font-bold bg-slate-700 px-2 py-1 rounded hover:bg-slate-600">100%</button>
                                            <div className="w-[1px] bg-slate-600 h-6"></div>
                                            <button onClick={() => updateImageStyle({ display: 'block', margin: '10px 0 10px 0', float: 'none' })} title="Esquerda" className="text-white hover:bg-slate-700 p-1 rounded"><AlignLeft size={14} /></button>
                                            <button onClick={() => updateImageStyle({ display: 'block', margin: '10px auto', float: 'none' })} title="Centro" className="text-white hover:bg-slate-700 p-1 rounded"><AlignCenter size={14} /></button>
                                            <button onClick={() => updateImageStyle({ display: 'block', margin: '10px 0 10px auto', float: 'none' })} title="Direita" className="text-white hover:bg-slate-700 p-1 rounded"><AlignRight size={14} /></button>
                                            <div className="w-[1px] bg-slate-600 h-6"></div>
                                            <button onClick={removeSelectedImage} title="Remover" className="text-rose-400 hover:bg-rose-900 p-1 rounded"><Trash size={14} /></button>
                                        </div>
                                    )}

                                    <div ref={editorRef} contentEditable={!previewMode} suppressContentEditableWarning onInput={updateStats} onPaste={handlePaste} onKeyDown={(e) => { if (e.key === 'Tab') { e.preventDefault(); execCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;'); } }}
                                        className="transition-all duration-300 outline-none cursor-text text-slate-900 leading-relaxed z-10 relative"
                                        style={{
                                            width: isFullScreen ? '100%' : `${activeDims.width}px`,
                                            minHeight: `${activeDims.height}px`,
                                            fontFamily: '"Times New Roman", Times, serif',
                                            fontSize: '12pt',
                                            lineHeight: '1.5',
                                            backgroundColor: 'white',
                                            // Margens dinâmicas baseadas na config
                                            paddingTop: `${pageMargins.top}cm`,
                                            paddingRight: `${pageMargins.right}cm`,
                                            paddingBottom: `${pageMargins.bottom}cm`,
                                            paddingLeft: `${pageMargins.left}cm`,
                                            // Lógica visual de paginação via CSS Gradient (Removida no print)
                                            backgroundImage: `linear-gradient(to bottom, transparent 0px, transparent ${activeDims.height}px, rgba(0,0,0,0.1) ${activeDims.height}px, rgba(0,0,0,0.1) ${activeDims.height + 1}px, transparent ${activeDims.height + 1}px), linear-gradient(to bottom, #ffffff 0px, #ffffff ${activeDims.height}px, #d1d5db ${activeDims.height}px, #d1d5db ${activeDims.height + PAGE_GAP_PX}px)`,
                                            backgroundSize: `100% ${activeDims.height + PAGE_GAP_PX}px`,
                                            backgroundRepeat: 'repeat-y',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                        }} />
                                    {Array.from({ length: stats.pages }).map((_, i) => (<div key={i} className="absolute right-[-40px] text-[10px] text-slate-400 font-bold bg-slate-200 px-1 rounded select-none print:hidden" style={{ top: `${(activeDims.height + PAGE_GAP_PX) * i + 20}px` }}>P{i + 1}</div>))}
                                </div>
                                <div className="h-20 shrink-0 text-center mt-8 opacity-30 text-[10px] uppercase font-black tracking-widest flex flex-col items-center gap-2"><ArrowDownCircle size={14} className="animate-bounce" /> Fim do Documento</div>
                            </div>
                        </div>

                        {showKnowledgeBase && (
                            <div className="absolute inset-0 z-[70] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
                                <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full">
                                    <div className="p-6 border-b bg-slate-50 flex justify-between items-center"><h3 className="font-black text-lg text-slate-800 uppercase">Cérebro Jurídico (RAG)</h3><button onClick={() => setShowKnowledgeBase(false)}><X size={20} className="text-slate-400" /></button></div>
                                    <div className="p-6 flex-1 overflow-y-auto"><div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-6"><h4 className="font-bold text-sm text-indigo-900 mb-1">Upload .TXT</h4><input type="file" accept=".txt" ref={fileInputRef} onChange={handleFileUpload} className="block w-full text-xs" /></div><textarea className="w-full h-64 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono" placeholder="Texto do Regimento..." value={contextRules} onChange={e => setContextRules(e.target.value)} /></div>
                                    <div className="p-6 border-t bg-slate-50 flex justify-end gap-3"><button onClick={saveKnowledgeBase} disabled={isSavingContext} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase flex items-center gap-2">{isSavingContext ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Salvar</button></div>
                                </div>
                            </div>
                        )}

                        {showHistory && (
                            <div className="absolute inset-0 z-[60] bg-slate-900/50 backdrop-blur flex justify-end">
                                <div className="w-[400px] h-full bg-white shadow-2xl p-6 flex flex-col animate-slide-in-right">
                                    <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-2 text-slate-800"><History size={20} /><h3 className="font-black text-lg uppercase">Histórico</h3></div><button onClick={() => setShowHistory(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button></div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                                        {isLoadingHistory ? <Loader2 className="animate-spin mx-auto text-indigo-600" /> : docVersions.length === 0 ? <p className="text-center text-slate-400 text-xs">Sem histórico.</p> : docVersions.map((version) => (<div key={version.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl relative group hover:bg-white hover:shadow-lg transition-all"><div className="absolute top-4 left-4 border-l-2 border-slate-200 h-full"></div><div className="flex items-start gap-3 relative z-10"><div className="p-2 bg-white border border-slate-200 rounded-full text-slate-500"><FileClock size={16} /></div><div className="flex-1"><p className="text-xs font-bold text-slate-800">{new Date(version.created_at).toLocaleString()}</p><p className="text-[10px] text-slate-500 mb-2">Por: {version.created_by}</p><button onClick={() => handleRestoreVersion(version)} className="text-[10px] flex items-center gap-1 text-indigo-600 font-bold hover:underline"><RotateCcw size={10} /> Restaurar</button></div></div></div>))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showOCR && <OCRScanner context="DOCUMENT" onClose={() => setShowOCR(false)} onResult={(text) => { if (editorRef.current) { editorRef.current.focus(); document.execCommand('insertHTML', false, `<span style="background:#f0f9ff;border-bottom:2px solid #0ea5e9;">${text}</span>`); } setShowOCR(false); }} />}

            {/* CSS: IMPRESSÃO CORRETA E ESTILOS */}
            <style>{`
                [contenteditable] { font-size: 12pt !important; font-family: "Times New Roman", serif !important; color: #000; }
                [contenteditable] p { margin-bottom: 12pt; text-align: justify; line-height: 1.5; font-size: 12pt; }
                [contenteditable] h1, [contenteditable] h2, [contenteditable] h3 { font-size: 14pt; font-weight: bold; text-align: center; margin: 12pt 0; text-transform: uppercase; }
                [contenteditable] ul { list-style-type: disc; padding-left: 24pt; margin-bottom: 12pt; }
                [contenteditable] ol { list-style-type: decimal; padding-left: 24pt; margin-bottom: 12pt; }
                [contenteditable] table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
                [contenteditable] th, [contenteditable] td { border: 1px solid #000; padding: 6pt; text-align: left; vertical-align: top; font-size: 11pt; }
                .sie-variable-tag { cursor: pointer; }
                .sie-image-toolbar { animation: fadeIn 0.2s; }
                .animate-slide-in-right { animation: slideInRight 0.3s ease-out; }
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                
                /* DRAG & DROP ESTILOS */
                .sie-attachment-dropzone:hover {
                    border-color: #6366f1 !important; /* indigo-500 */
                    background-color: #eef2ff !important; /* indigo-50 */
                }
                
                /* INJEÇÃO DE ESTILOS DE IMPRESSÃO DINÂMICA E BLINDAGEM WYSIWYG */
                ${printStyles}
            `}</style>
        </div>
    );
};

export default DocumentHub;
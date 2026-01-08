
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Loader2, ShieldCheck, Zap, ScanLine, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import axios from 'axios';

interface OCRScannerProps {
    onResult: (data: any) => void;
    onClose: () => void;
    context: 'IDENTITY' | 'SURVEY_CONFIG' | 'DOCUMENT';
    title?: string;
}

const OCRScanner = ({ onResult, onClose, context, title }: OCRScannerProps) => {
    const [mode, setMode] = useState<'IDLE' | 'CAMERA' | 'PROCESSING' | 'REVIEW'>('IDLE');
    const [image, setImage] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startCamera = async () => {
        try {
            setMode('CAMERA');
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (e) {
            alert("Acesso à câmera negado.");
            setMode('IDLE');
        }
    };

    const stopCamera = () => {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(t => t.stop());
    };

    const capture = () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx?.drawImage(videoRef.current, 0, 0);
            const b64 = canvasRef.current.toDataURL('image/jpeg');
            setImage(b64);
            stopCamera();
            processImage(b64);
        }
    };

    const processImage = async (b64: string) => {
        setMode('PROCESSING');
        setIsLoading(true);
        try {
            const res = await axios.post('/api/ai/ocr', { image: b64, context });
            setResult(res.data);
            setMode('REVIEW');
        } catch (e) {
            alert("Erro no processamento neural. Tente novamente.");
            setMode('IDLE');
        } finally {
            setIsLoading(false);
        }
    };

    // FIX: Use any to bypass namespace 'React' error
    const handleUpload = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const b64 = reader.result as string;
                setImage(b64);
                processImage(b64);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/95 z-[300] flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in">
            <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/10 animate-scale-in">
                
                {/* Header SRE */}
                <div className="bg-slate-900 px-10 py-6 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><Zap size={20} className="text-white" /></div>
                        <div>
                            <h2 className="text-white font-black text-xl tracking-tight">{title || 'Scanner Inteligente S.I.E'}</h2>
                            <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mt-1">Motor OCR Gemini V3 • Contexto: {context}</p>
                        </div>
                    </div>
                    <button onClick={() => { stopCamera(); onClose(); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-400"><X size={24} /></button>
                </div>

                <div className="flex-1 relative overflow-hidden flex bg-slate-50">
                    {mode === 'IDLE' && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-12 text-center">
                            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center shadow-inner"><ScanLine size={48} /></div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Pronto para Digitalizar</h3>
                                <p className="text-slate-500 font-medium text-sm max-w-xs">Posicione o documento em local iluminado para maior precisão neural.</p>
                            </div>
                            <div className="flex gap-4 w-full max-w-md">
                                <button onClick={startCamera} className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"><Camera size={20}/> Câmera Ativa</button>
                                <label className="flex-1 py-5 bg-white border border-slate-200 text-slate-800 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm">
                                    <Upload size={20}/> Upload <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                                </label>
                            </div>
                        </div>
                    )}

                    {mode === 'CAMERA' && (
                        <div className="flex-1 flex flex-col relative">
                            <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover grayscale brightness-110" />
                            <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40">
                                <div className="w-full h-full border-2 border-indigo-500/50 rounded-3xl relative">
                                    <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-indigo-500 shadow-[0_0_20px_#6366f1] animate-[scan_3s_infinite]" />
                                </div>
                            </div>
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6">
                                <button onClick={() => { stopCamera(); setMode('IDLE'); }} className="p-5 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-rose-600 transition-all"><X size={28}/></button>
                                <button onClick={capture} className="p-8 bg-white rounded-full shadow-2xl scale-125 hover:scale-110 transition-transform"><div className="w-4 h-4 bg-indigo-600 rounded-full animate-pulse"/></button>
                            </div>
                        </div>
                    )}

                    {mode === 'PROCESSING' && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-12 bg-white">
                            <div className="relative">
                                <Loader2 className="animate-spin text-indigo-600" size={64}/>
                                <div className="absolute inset-0 flex items-center justify-center"><Zap size={24} className="text-indigo-600 animate-pulse"/></div>
                            </div>
                            <div className="text-center">
                                <h4 className="text-xl font-black text-slate-800 tracking-tighter">Analisando Pixels...</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">O Motor Gemini está estruturando os dados</p>
                            </div>
                        </div>
                    )}

                    {mode === 'REVIEW' && result && (
                        <div className="flex-1 flex flex-col md:flex-row animate-fade-in h-full">
                            <div className="w-full md:w-1/2 bg-slate-100 p-8 flex items-center justify-center overflow-hidden border-r border-slate-200">
                                {image && <img src={image} className="max-h-full rounded-2xl shadow-2xl object-contain border-4 border-white rotate-[-2deg]" alt="Scanned" />}
                            </div>
                            <div className="w-full md:w-1/2 p-10 overflow-y-auto bg-white custom-scrollbar flex flex-col">
                                <div className="flex items-center gap-3 mb-8">
                                    <CheckCircle2 className="text-emerald-500" size={24}/>
                                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Extração Finalizada com Sucesso</h4>
                                </div>
                                <div className="space-y-6 flex-1">
                                    {Object.entries(result).map(([key, val]: any) => (
                                        <div key={key} className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{key.replace(/_/g, ' ')}</label>
                                            <p className="text-sm font-bold text-slate-700">{Array.isArray(val) ? `${val.length} itens detectados` : String(val)}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-8 border-t border-slate-100 mt-auto flex gap-4">
                                    <button onClick={() => setMode('IDLE')} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Descartar</button>
                                    <button onClick={() => { onResult(result); onClose(); }} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">Importar para o S.I.E <ChevronRight size={16}/></button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <canvas ref={canvasRef} className="hidden" />
            </div>
            <style>{`
                @keyframes scan { 0% { top: 0%; } 50% { top: 100%; } 100% { top: 0%; } }
            `}</style>
        </div>
    );
};

export default OCRScanner;

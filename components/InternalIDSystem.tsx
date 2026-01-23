import React, { useState } from 'react';
import { Loader2, Fingerprint, Maximize2, RotateCcw, ExternalLink, ShieldCheck } from 'lucide-react';
import { SystemInfo } from '../types';

interface InternalIDSystemProps {
    systemInfo: SystemInfo;
}

const InternalIDSystem = ({ systemInfo }: InternalIDSystemProps) => {
    const [isLoading, setIsLoading] = useState(true);
    
    // SRE: URL do módulo residente na pasta /id servida pelo Nginx ou subdomínio
    const idAppUrl = "/id/"; 

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col h-full space-y-6 animate-fade-in relative">
            
            {/* Header de Integração */}
            <div className="flex flex-row justify-between items-center bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl shrink-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><Fingerprint size={22}/></div>
                    <div>
                        <h2 className="text-xl font-black uppercase leading-none tracking-tight">Terminal de Identidade</h2>
                        <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mt-2 opacity-80">Módulo Encapsulado • SRE Bridge Active</p>
                    </div>
                </div>
                <div className="flex gap-3 relative z-10">
                    <button onClick={() => window.location.reload()} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all shadow-lg text-slate-300"><RotateCcw size={18}/></button>
                    <a href={idAppUrl} target="_blank" rel="noreferrer" className="px-6 py-3 bg-white text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-2">
                        <ExternalLink size={16}/> Modo Fullscreen
                    </a>
                </div>
            </div>

            {/* Viewport de Integridade (Iframe) */}
            <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative group">
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
                        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} style={{ color: primaryColor }} />
                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] animate-pulse">Sincronizando Viewport ID...</p>
                    </div>
                )}
                
                <iframe 
                    src={idAppUrl}
                    className="w-full h-full border-none"
                    onLoad={() => setIsLoading(false)}
                    title="SIE ID System"
                    sandbox="allow-forms allow-modals allow-popups allow-scripts allow-same-origin allow-downloads allow-camera"
                />

                {/* SRE Footer HUD */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="bg-slate-900/90 backdrop-blur-xl px-8 py-3 rounded-2xl border border-white/10 flex items-center gap-4 shadow-2xl">
                         <ShieldCheck size={14} className="text-emerald-500"/>
                         <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Conexão Segura SRE Bridge Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InternalIDSystem;

import React from 'react';
import { Fingerprint, Monitor, ShieldCheck, Zap } from 'lucide-react';
import { SystemInfo } from '../types';

interface InternalIDSystemProps {
    systemInfo: SystemInfo;
}

const InternalIDSystem = ({ systemInfo }: InternalIDSystemProps) => {
    const idAppUrl = "/id/"; 
    const primaryColor = systemInfo.primaryColor || '#4f46e5'; 

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in relative overflow-hidden">
            {/* Header de Módulo Integrado */}
            <div className="bg-slate-900 px-8 py-6 flex justify-between items-center shrink-0 border-b border-white/5 shadow-xl relative z-10 rounded-t-[2rem]">
                <div className="flex items-center gap-5">
                    <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl" style={{ backgroundColor: primaryColor }}><Fingerprint size={22}/></div>
                    <div>
                        <h2 className="text-white font-black text-xl tracking-tight uppercase">Módulo ID Bridge</h2>
                        <p className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.4em] mt-1">SRE Multi-Front Interface</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                        <ShieldCheck size={14} className="text-emerald-500"/>
                        <span className="text-[9px] font-black text-white uppercase">Sessão Segura</span>
                    </div>
                </div>
            </div>

            {/* Viewport do Iframe */}
            <div className="flex-1 bg-slate-100 border-x border-b border-slate-200 shadow-inner overflow-hidden relative rounded-b-[3rem]">
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <Monitor size={120} className="text-slate-900" />
                </div>
                
                <iframe 
                    src={idAppUrl}
                    className="w-full h-full border-none relative z-20" 
                    title="SIE ID System"
                    sandbox="allow-forms allow-modals allow-popups allow-scripts allow-same-origin allow-downloads allow-camera"
                    allow="camera; microphone; geolocation"
                />
            </div>

            {/* Status Bar Inferior */}
            <div className="mt-4 flex justify-between items-center px-4 opacity-50">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Cross-Origin Handshake Ready</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[8px] font-black uppercase text-slate-400">Endpoint: {idAppUrl}</span>
                    <Zap size={10} className="text-amber-500"/>
                </div>
            </div>
        </div>
    );
};

export default InternalIDSystem;

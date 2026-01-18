import React, { useState, useEffect, useCallback } from 'react';
import { SystemInfo, ResidentUISetting } from '../types';
import { systemService } from '../services/api';
import {
    Settings as SettingsIcon, Building, X, Plus, Trash2, Loader2, Key, Zap, Lock, Activity as PulseIcon, 
    MessageCircle, Terminal, ShieldCheck, Image as ImageIcon, Layout, Eye, EyeOff, Save, Smartphone
} from 'lucide-react';

interface SettingsProps {
    systemInfo: SystemInfo;
    onUpdateSystemInfo: (info: SystemInfo) => void;
}

const Settings = ({ systemInfo, onUpdateSystemInfo }: SettingsProps) => {
    // SRE FIX: Removed 'API' from activeTab as managing AI keys in UI is prohibited by Gemini guidelines
    const [activeTab, setActiveTab] = useState<'INFO' | 'INTERFACE' | 'WHATSAPP'>('INFO');
    const [isSaving, setIsSaving] = useState(false);
    const [localInfo, setLocalInfo] = useState<SystemInfo>(systemInfo);

    useEffect(() => { setLocalInfo(systemInfo); }, [systemInfo]);

    const handleSaveInfo = async () => {
        setIsSaving(true);
        try {
            await systemService.updateInfo(localInfo);
            onUpdateSystemInfo(localInfo);
            alert("✅ Kernel Sincronizado.");
        } finally { setIsSaving(false); }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in h-full relative pb-10">
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 shrink-0 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-xl"><SettingsIcon size={24} /></div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tightest text-slate-900 leading-none">Kernel Control</h1>
                        <p className="text-[9px] font-black uppercase text-indigo-600 mt-2 tracking-widest opacity-80">SRE HUB v238.0</p>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center bg-slate-50 rounded-[1.5rem] p-1.5 border border-slate-100 relative z-10 gap-1">
                    {[
                        { id: 'INFO', label: 'Identidade', icon: Building },
                        { id: 'INTERFACE', label: 'Interface Morador', icon: Layout },
                        { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle }
                        // SRE FIX: Removed API Gateway tab button to comply with security guidelines
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white rounded-[3.5rem] border border-slate-200 shadow-sm p-8 lg:p-14 relative">
                {activeTab === 'INFO' && (
                    <div className="max-w-4xl space-y-12 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Entidade</label>
                                <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xl" value={localInfo.name} onChange={e => setLocalInfo({...localInfo, name: e.target.value})} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sigla SRE</label>
                                <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xl uppercase" value={localInfo.shortName} onChange={e => setLocalInfo({...localInfo, shortName: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL do Logotipo (Base64 ou Link)</label>
                            <textarea rows={4} className="w-full font-mono text-xs bg-slate-50 border border-slate-200 rounded-2xl p-6" value={localInfo.logoUrl} onChange={e => setLocalInfo({...localInfo, logoUrl: e.target.value})} />
                        </div>
                        <button onClick={handleSaveInfo} disabled={isSaving} className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3">
                            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18}/>} Commitar Identidade
                        </button>
                    </div>
                )}

                {activeTab === 'INTERFACE' && (
                    <div className="max-w-5xl space-y-10 animate-fade-in">
                        <div className="p-10 bg-indigo-900 rounded-[3rem] text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Smartphone size={120}/></div>
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black uppercase tracking-tight">Experiência do Residente</h2>
                                <p className="text-indigo-300 text-[10px] font-bold uppercase mt-2 tracking-widest">Controle SRE de Visibilidade de Módulos</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(localInfo.resident_ui_settings || []).map((widget, idx) => (
                                <div key={widget.id} className="p-8 bg-white border border-slate-200 rounded-[2.5rem] flex justify-between items-center group hover:border-indigo-300 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className={`p-4 rounded-2xl shadow-inner ${widget.enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                                            <Layout size={24}/>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 uppercase text-sm">{widget.label}</h4>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{widget.detail}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const next = [...(localInfo.resident_ui_settings || [])];
                                            next[idx].enabled = !next[idx].enabled;
                                            setLocalInfo({...localInfo, resident_ui_settings: next});
                                        }}
                                        className={`p-4 rounded-2xl transition-all ${widget.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}
                                    >
                                        {widget.enabled ? <Eye size={20}/> : <EyeOff size={20}/>}
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        <button onClick={handleSaveInfo} disabled={isSaving} className="px-14 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 transition-all">
                            Salvar Configuração de Interface
                        </button>
                    </div>
                )}
                
                {activeTab === 'WHATSAPP' && (
                    <div className="max-w-4xl space-y-10 animate-fade-in">
                        <div className="p-10 bg-emerald-950 rounded-[3rem] text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><MessageCircle size={120}/></div>
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black uppercase tracking-tight text-emerald-400">Gateway JennyAI</h2>
                                <p className="text-emerald-500/60 text-[10px] font-bold uppercase mt-2 tracking-widest">Protocolo de Mensageria Ativa</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">API Key (JennyAI)</label>
                                {/* SRE FIX: Corrected state update to satisfy TypeScript requirement that all non-optional properties of WhatsAppConfig (api_key, sender, footer) are present */}
                                <input type="password" placeholder="••••••••" className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6" value={localInfo.whatsapp_config?.api_key || ''} onChange={e => setLocalInfo({...localInfo, whatsapp_config: { api_key: e.target.value, sender: localInfo.whatsapp_config?.sender || '', footer: localInfo.whatsapp_config?.footer || '', webhook_url: localInfo.whatsapp_config?.webhook_url }})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Device ID / Sender ID</label>
                                {/* SRE FIX: Corrected state update to satisfy TypeScript requirement that all non-optional properties of WhatsAppConfig (api_key, sender, footer) are present */}
                                <input placeholder="SRE-DEVICE-01" className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 uppercase" value={localInfo.whatsapp_config?.sender || ''} onChange={e => setLocalInfo({...localInfo, whatsapp_config: { api_key: localInfo.whatsapp_config?.api_key || '', sender: e.target.value, footer: localInfo.whatsapp_config?.footer || '', webhook_url: localInfo.whatsapp_config?.webhook_url }})} />
                            </div>
                        </div>
                        <button onClick={handleSaveInfo} className="px-14 py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Salvar Bridge WhatsApp</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;

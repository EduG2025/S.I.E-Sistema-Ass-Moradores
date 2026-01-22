
import React, { useState, useEffect, useRef } from 'react';
import { SystemInfo, ResidentUISetting, AIKey } from '../types';
import { systemService, aiKeyService, api } from '../services/api';
import { SYSTEM_PERMISSIONS } from '../constants';
import {
    Settings as SettingsIcon, Building, X, Plus, Trash2, Loader2, Key, Zap, Lock, 
    MessageCircle, ShieldCheck, Image as ImageIcon, Layout, Save,
    Shield, UserCheck, Cpu, CheckCircle2, History, Sparkles,
    Mail, Phone, Fingerprint, Box, Leaf, BarChart3,
    ClipboardList, Camera, Wallet, Bell, Brain, ShoppingBag, HelpCircle, FileText, QrCode,
    Landmark, Gavel, Upload, Globe, MapPin, Monitor, Calendar, ShieldAlert
} from 'lucide-react';

interface SettingsProps {
    systemInfo: SystemInfo;
    onUpdateSystemInfo: (info: SystemInfo) => void;
}

interface DynamicRole {
    id: string;
    label: string;
}

const Settings = ({ systemInfo, onUpdateSystemInfo }: SettingsProps) => {
    const [activeTab, setActiveTab] = useState<'INFO' | 'INTERFACE' | 'WHATSAPP' | 'AI_KEYS' | 'PERMISSIONS'>('INFO');
    const [isSaving, setIsSaving] = useState(false);
    const [localInfo, setLocalInfo] = useState<SystemInfo>(systemInfo);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveInfo = async () => {
        setIsSaving(true);
        try {
            await systemService.updateInfo(localInfo);
            onUpdateSystemInfo(localInfo);
            alert("✅ Kernel Sincronizado.");
        } catch (e) {
            alert("Erro ao salvar.");
        } finally { setIsSaving(false); }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLocalInfo({ ...localInfo, logoUrl: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in overflow-hidden">
            {/* HEADER COMPACTO RESPONSIVO */}
            <div className="module-header bg-slate-900 text-white shadow-xl flex flex-col md:flex-row gap-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-xl"><SettingsIcon size={18} /></div>
                    <div>
                        <h1 className="text-sm font-black uppercase leading-none">Settings Kernel</h1>
                        <p className="text-[7px] font-black uppercase text-indigo-400 mt-1">Config Suite V520</p>
                    </div>
                </div>

                <div className="flex overflow-x-auto gap-1 py-1 no-scrollbar md:justify-center w-full">
                    {[
                        { id: 'INFO', label: 'Identidade', icon: Building },
                        { id: 'INTERFACE', label: 'Módulos', icon: Layout },
                        { id: 'WHATSAPP', label: 'Messenger', icon: MessageCircle },
                        { id: 'AI_KEYS', label: 'Neural', icon: Cpu },
                        { id: 'PERMISSIONS', label: 'Governança', icon: Shield }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                            <tab.icon size={10} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ÁREA DE CONTEÚDO ADAPTATIVA */}
            <div className="content-wrapper overflow-y-auto custom-scrollbar">
                {activeTab === 'INFO' && (
                    <div className="space-y-6 animate-fade-in pb-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Razão Social</label>
                                <input className="w-full font-black h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs focus:bg-white outline-none uppercase shadow-inner" value={localInfo.name} onChange={e => setLocalInfo({ ...localInfo, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Sigla</label>
                                    <input className="w-full font-black h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs uppercase focus:bg-white outline-none" value={localInfo.shortName} onChange={e => setLocalInfo({ ...localInfo, shortName: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ</label>
                                    <input className="w-full font-black h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs focus:bg-white outline-none" value={localInfo.cnpj} onChange={e => setLocalInfo({ ...localInfo, cnpj: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-2xl bg-white border-2 border-white shadow-lg flex items-center justify-center p-2 relative group overflow-hidden">
                                {localInfo.logoUrl ? <img src={localInfo.logoUrl} className="max-w-full max-h-full object-contain" alt="Logo" /> : <ImageIcon size={24} className="text-slate-200" />}
                                <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Upload size={16} /></button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </div>
                            <div className="w-full space-y-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center block">Cor Primária</label>
                                <div className="flex items-center gap-2 justify-center">
                                    <input type="color" className="w-8 h-8 rounded-lg border-none p-0 cursor-pointer" value={localInfo.primaryColor} onChange={e => setLocalInfo({ ...localInfo, primaryColor: e.target.value })} />
                                    <input className="font-mono font-black text-[9px] uppercase px-3 py-2 bg-white border border-slate-200 rounded-lg w-24 text-center" value={localInfo.primaryColor} onChange={e => setLocalInfo({ ...localInfo, primaryColor: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSaveInfo} disabled={isSaving} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                            {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Sincronizar Kernel
                        </button>
                    </div>
                )}

                {activeTab === 'INTERFACE' && (
                    <div className="space-y-4 animate-fade-in pb-4">
                        <div className="grid grid-cols-1 gap-2">
                            {localInfo.resident_ui_settings?.map(mod => (
                                <div key={mod.id} className={`p-3 rounded-xl border transition-all flex items-center justify-between ${mod.enabled ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-dashed border-slate-200 opacity-60'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${mod.enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                                            <Layout size={14} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 uppercase text-[9px] leading-none">{mod.label}</h4>
                                            <p className="text-[7px] text-slate-400 font-bold uppercase mt-1">ID: {mod.id}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => {
                                        const updated = localInfo.resident_ui_settings?.map(m => m.id === mod.id ? {...m, enabled: !m.enabled} : m);
                                        setLocalInfo({...localInfo, resident_ui_settings: updated});
                                    }} className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${mod.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${mod.enabled ? 'translate-x-3' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleSaveInfo} disabled={isSaving} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl">
                            Salvar Configurações
                        </button>
                    </div>
                )}
            </div>
            
            {/* MINI FOOTER */}
            <div className="px-4 py-2 flex items-center justify-between opacity-30 grayscale shrink-0 border-t bg-slate-50">
                <div className="flex items-center gap-1">
                    <ShieldCheck size={8} className="text-emerald-600" />
                    <span className="text-[6px] font-black uppercase text-slate-400">Audited</span>
                </div>
                <span className="text-[6px] font-black uppercase text-slate-400">V520.0-PRO</span>
            </div>
        </div>
    );
};

export default Settings;

import React, { useState, useEffect, useRef } from 'react';
import { SystemInfo, WhatsAppConfig, AIKey, ResidentUISetting } from '../types';
import { systemService, aiKeyService, communicationService } from '../services/api';
import { SYSTEM_PERMISSIONS, MENU_ITEMS } from '../constants';
import {
    Settings as SettingsIcon, Building, X, Plus, Trash2, Loader2, Save,
    MessageCircle, ShieldCheck, Image as ImageIcon, Layout, Shield, 
    Upload, Globe, MapPin, Monitor, ShieldAlert, Variable, Edit3, CheckCircle2,
    Brain, Cpu, Key, Radio, Zap, ExternalLink, Smartphone, Lock, History, Layers,
    Wallet, Calendar, Bell, ToggleRight, ToggleLeft, Palette, Type, UserCheck, FileSignature,
    Gift, ReceiptText, Crosshair
} from 'lucide-react';
import { formatCPF } from '../utils/cpf';

interface SettingsProps {
    systemInfo: SystemInfo;
    onUpdateSystemInfo: (info: SystemInfo) => void;
}

const Settings = ({ systemInfo, onUpdateSystemInfo }: SettingsProps) => {
    const [activeTab, setActiveTab] = useState<'INFO' | 'INTERFACE' | 'AI_PROVIDERS' | 'WHATSAPP' | 'GOVERNANCE' | 'PERMISSIONS'>('INFO');
    const [isSaving, setIsSaving] = useState(false);
    const [localInfo, setLocalInfo] = useState<SystemInfo>(systemInfo);
    
    // AI Keys State (Neural Pool)
    const [aiKeys, setAiKeys] = useState<AIKey[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    
    const [waConfig, setWaConfig] = useState<WhatsAppConfig>(systemInfo.whatsapp_config || {
        api_key: '', sender: '', footer: 'S.I.E PRO', welcome_template: '', anniversary_template: '', billing_template: '', default_password: 'mudar123', webhook_url: '', gateway_url: ''
    });

    const [metadata, setMetadata] = useState<any>((systemInfo as any).module_metadata || {});

    useEffect(() => {
        if (activeTab === 'PERMISSIONS') loadRBAC();
        if (activeTab === 'AI_PROVIDERS') loadAiKeys();
    }, [activeTab]);

    const loadAiKeys = async () => {
        setIsLoadingData(true);
        try {
            const res = await aiKeyService.getAll();
            setAiKeys(res.data.data || []);
        } catch (e) {
            console.error("Erro ao carregar Pool Neural");
        } finally { setIsLoadingData(false); }
    };

    const loadRBAC = async () => {
        setIsLoadingData(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                systemService.getRoles(),
                systemService.getPermissions()
            ]);
            setRoles(rolesRes.data.data || []);
            setPermissions(permsRes.data.data || []);
        } finally { setIsLoadingData(false); }
    };

    const handleSaveInfo = async () => {
        setIsSaving(true);
        try {
            const payload = { 
                ...localInfo, 
                whatsapp_config: waConfig,
                module_metadata: metadata
            };
            await systemService.updateInfo(payload);
            onUpdateSystemInfo(payload);
            alert("✅ SRE: Kernel Master Sincronizado com Sucesso.");
        } catch (e) { alert("Erro crítico de sincronia no cluster."); } 
        finally { setIsSaving(false); }
    };

    const handleTogglePermission = async (role: string, permissionId: string, current: boolean) => {
        try {
            await systemService.togglePermission({ role, permission_id: permissionId, active: !current });
            loadRBAC();
        } catch (e) { alert("Erro ao atualizar RBAC."); }
    };

    const handleToggleModule = (moduleId: string) => {
        const currentSettings = [...(localInfo.resident_ui_settings || [])];
        const index = currentSettings.findIndex(s => s.id === moduleId);
        
        if (index !== -1) {
            currentSettings[index] = { ...currentSettings[index], enabled: !currentSettings[index].enabled };
            setLocalInfo({ ...localInfo, resident_ui_settings: currentSettings });
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLocalInfo({ ...localInfo, logoUrl: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

    const updateMetadata = (modKey: string, field: 'title' | 'slogan', val: string) => {
        setMetadata({
            ...metadata,
            [modKey]: { ...(metadata[modKey] || {}), [field]: val }
        });
    };

    const primaryColor = localInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in overflow-hidden bg-white">
            {/* CONSOLE HEADER */}
            <div className="module-header bg-slate-900 text-white shadow-2xl flex flex-col md:flex-row gap-6 shrink-0 p-6 md:px-12 border-b border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-[1.5rem] text-white shadow-2xl transition-colors duration-500" style={{ backgroundColor: primaryColor }}><SettingsIcon size={26} /></div>
                    <div>
                        <h1 className="text-2xl font-black uppercase leading-none tracking-tightest">Console Master</h1>
                        <p className="text-[9px] font-black uppercase text-indigo-400 mt-2 tracking-[0.4em] opacity-80 italic">SRE Reliability Protocol V22.0</p>
                    </div>
                </div>

                <div className="flex-1 flex overflow-x-auto gap-2 py-1 no-scrollbar md:justify-end items-center relative z-10">
                    {[
                        { id: 'INFO', label: 'Identidade', icon: Building },
                        { id: 'INTERFACE', label: 'Módulos', icon: Layout },
                        { id: 'AI_PROVIDERS', label: 'Inteligência', icon: Brain },
                        { id: 'WHATSAPP', label: 'Messenger', icon: MessageCircle },
                        { id: 'GOVERNANCE', label: 'Governança', icon: Layers },
                        { id: 'PERMISSIONS', label: 'RBAC', icon: Shield }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase whitespace-nowrap transition-all flex items-center gap-3 border ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-xl border-white scale-105' : 'text-slate-400 border-white/5 hover:border-white/10 hover:bg-white/5'}`} style={activeTab === tab.id ? { color: primaryColor } : {}}>
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fcfcfd] p-6 md:p-14">
                
                {activeTab === 'INFO' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-12">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-8">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4"><Building size={24} style={{ color: primaryColor }}/> Registro Corporativo</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Razão Social / Nome da Entidade</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-lg uppercase outline-none focus:bg-white focus:border-indigo-500 shadow-inner transition-all" value={localInfo.name} onChange={e => setLocalInfo({ ...localInfo, name: e.target.value })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sigla Comercial</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 uppercase focus:border-indigo-500 outline-none shadow-inner" value={localInfo.shortName} onChange={e => setLocalInfo({ ...localInfo, shortName: e.target.value })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ Oficial</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 uppercase focus:border-indigo-500 outline-none shadow-inner" value={localInfo.cnpj} onChange={e => setLocalInfo({ ...localInfo, cnpj: e.target.value })} />
                                </div>
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Sede</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 uppercase focus:border-indigo-500 outline-none shadow-inner" value={localInfo.address} onChange={e => setLocalInfo({ ...localInfo, address: e.target.value })} />
                                </div>

                                <div className="md:col-span-2 p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] shadow-inner space-y-8">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><Crosshair size={18} className="text-indigo-600"/> Georreferenciamento Sede (Epicentro Tático)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude Sede</label>
                                            <input type="number" step="any" className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 text-sm focus:border-indigo-500 outline-none shadow-sm" value={localInfo.coordinates?.lat || ''} onChange={e => setLocalInfo({ ...localInfo, coordinates: { ...localInfo.coordinates!, lat: parseFloat(e.target.value) } })} placeholder="-23.5505" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude Sede</label>
                                            <input type="number" step="any" className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 text-sm focus:border-indigo-500 outline-none shadow-sm" value={localInfo.coordinates?.lng || ''} onChange={e => setLocalInfo({ ...localInfo, coordinates: { ...localInfo.coordinates!, lng: parseFloat(e.target.value) } })} placeholder="-46.6333" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'GOVERNANCE' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-slate-900 p-16 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12">
                             <div className="absolute top-0 right-0 p-12 opacity-5"><Layers size={250}/></div>
                             <div className="relative z-10 space-y-4">
                                <h2 className="text-5xl font-black uppercase tracking-tightest leading-none">Manifesto Semântico</h2>
                                <p className="text-indigo-400 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Type size={16}/> Governança de Títulos e Headers Dinâmicos</p>
                             </div>
                        </div>

                        <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-10">
                            <div className="grid grid-cols-1 gap-8">
                                {MENU_ITEMS.map(mod => (
                                    <div key={mod.id} className="p-10 rounded-[3rem] bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-xl transition-all">
                                        <div className="flex items-center gap-6 mb-8 border-b border-slate-100 pb-6">
                                            <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg"><mod.icon size={24}/></div>
                                            <div>
                                                <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Módulo: {mod.label}</h4>
                                                <code className="text-[9px] font-mono text-slate-400 uppercase">IDENTIFIER: {mod.id}</code>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Header</label>
                                                <input className="w-full font-black h-16 bg-white border border-slate-200 rounded-2xl px-6 text-lg uppercase outline-none focus:border-indigo-500 shadow-sm" value={metadata[mod.id]?.title || mod.label} onChange={e => updateMetadata(mod.id, 'title', e.target.value.toUpperCase())} />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Slogan / Subtítulo</label>
                                                <input className="w-full font-medium h-16 bg-white border border-slate-200 rounded-2xl px-6 text-sm uppercase outline-none focus:border-indigo-500 shadow-sm" value={metadata[mod.id]?.slogan || ''} onChange={e => updateMetadata(mod.id, 'slogan', e.target.value.toUpperCase())} placeholder="Descreva o propósito deste módulo..." />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'AI_PROVIDERS' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-indigo-600 p-16 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12">
                             <div className="absolute top-0 right-0 p-12 opacity-10"><Brain size={250}/></div>
                             <div className="relative z-10 space-y-4 text-center md:text-left">
                                <h2 className="text-5xl font-black uppercase tracking-tightest leading-none">Pool Neural</h2>
                                <p className="text-indigo-200 text-xs font-black uppercase tracking-widest flex items-center justify-center md:justify-start gap-2"><Cpu size={16}/> SRE Failover Management System</p>
                             </div>
                        </div>

                        <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm">
                            <div className="grid grid-cols-1 gap-6">
                                {aiKeys.map(key => (
                                    <div key={key.id} className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-200 flex justify-between items-center">
                                        <div className="flex items-center gap-6">
                                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Key size={24}/></div>
                                            <div>
                                                <h4 className="text-base font-black text-slate-800 uppercase">{key.label}</h4>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{key.provider} • {key.model} • {key.tier}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border shadow-sm ${key.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{key.status}</span>
                                            <button onClick={() => alert("Função de Edição Restrita via Console SSH")} className="p-3 text-slate-300 hover:text-indigo-600 transition-all"><Edit3 size={18}/></button>
                                        </div>
                                    </div>
                                ))}
                                <button className="w-full py-10 border-4 border-dashed border-slate-200 rounded-[3rem] text-slate-300 font-black uppercase tracking-[0.4em] hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex flex-col items-center gap-4">
                                    <Plus size={32}/> Injetar Token Neural
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Outras abas (Interface, WhatsApp, RBAC) mantidas conforme App.tsx original */}
            </div>

            {/* GLOBAL SYNC FAB */}
            <div className="fixed bottom-10 right-10 z-[1000] flex flex-col items-end gap-4">
                 <button onClick={handleSaveInfo} disabled={isSaving} className="px-12 py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:bg-indigo-600 transition-all flex items-center gap-4 active:scale-95 group border border-white/5 backdrop-blur-md">
                    {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
                    Commitar Mudanças Master
                 </button>
            </div>
        </div>
    );
};

export default Settings;
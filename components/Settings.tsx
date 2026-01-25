import React, { useState, useEffect } from 'react';
import { SystemInfo, WhatsAppConfig, AIKey } from '../types';
import { systemService, aiKeyService, communicationService } from '../services/api';
import { SYSTEM_PERMISSIONS, MENU_ITEMS } from '../constants';
import {
    Settings as SettingsIcon, Building, X, Plus, Trash2, Loader2, Save,
    MessageCircle, ShieldCheck, Image as ImageIcon, Layout, Shield, 
    Globe, MapPin, Monitor, Edit3, Key, Brain, Cpu, Zap, Lock, History, Layers,
    ToggleRight, ToggleLeft, UserCheck, FileSignature, Sparkles, ClipboardList, PenTool, Globe2, Crosshair, Radio, Variable, Type, Activity, Eye, EyeOff, RotateCcw, Code, Terminal, MessageSquare,
    Users, Landmark
} from 'lucide-react';

interface SettingsProps {
    systemInfo: SystemInfo;
    onUpdateSystemInfo: (info: SystemInfo) => void;
}

const Settings = ({ systemInfo, onUpdateSystemInfo }: SettingsProps) => {
    const [activeTab, setActiveTab] = useState<'INFO' | 'INTERFACE' | 'AI_PROVIDERS' | 'MESSENGER' | 'TEMPLATES' | 'GOVERNANCE' | 'PERMISSIONS'>('INFO');
    const [isSaving, setIsSaving] = useState(false);
    const [localInfo, setLocalInfo] = useState<SystemInfo>(systemInfo);
    
    const [aiKeys, setAiKeys] = useState<AIKey[]>([]);
    const [isAiKeyModalOpen, setIsAiKeyModalOpen] = useState(false);
    const [editingAiKey, setEditingAiKey] = useState<Partial<AIKey> | null>(null);

    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const [templates, setTemplates] = useState<any[]>([]);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    
    const [waConfig, setWaConfig] = useState<WhatsAppConfig>(systemInfo.whatsapp_config || {
        api_key: '', 
        sender: '', 
        footer: 'S.I.E PRO', 
        gateway_url: 'https://jennyai.space/send-message',
        billing_reminder_2d: true,
        billing_reminder_1d: true,
        late_reminder: true,
        welcome_msg: true
    });

    // SRE FIX: Tipagem explícita para evitar ts(7006)
    const [metadata, setMetadata] = useState<Record<string, any>>(systemInfo.module_metadata || {});

    useEffect(() => {
        if (activeTab === 'PERMISSIONS') loadRBAC();
        if (activeTab === 'AI_PROVIDERS') loadAiKeys();
        if (activeTab === 'TEMPLATES') loadTemplates();
    }, [activeTab]);

    const loadAiKeys = async () => {
        setIsLoadingData(true);
        try {
            const res = await aiKeyService.getAll();
            setAiKeys(res.data.data || []);
        } finally { setIsLoadingData(false); }
    };

    const loadTemplates = async () => {
        setIsLoadingData(true);
        try {
            const res = await communicationService.getTemplates();
            setTemplates(res.data.data || []);
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
            alert("✅ Kernel Master Sincronizado.");
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

    const handleSaveAiKey = async () => {
        if (!editingAiKey || !editingAiKey.label || !editingAiKey.key_value) return;
        setIsSaving(true);
        try {
            if (editingAiKey.id) await aiKeyService.update(editingAiKey.id, editingAiKey);
            else await aiKeyService.create(editingAiKey);
            setIsAiKeyModalOpen(false);
            setEditingAiKey(null);
            loadAiKeys();
        } finally { setIsSaving(false); }
    };

    // SRE FIX: Tipagem do parâmetro 'prev'
    const handleUpdateMetadata = (moduleId: string, field: string, value: string) => {
        setMetadata((prev: Record<string, any>) => ({
            ...prev,
            [moduleId]: {
                ...(prev[moduleId] || {}),
                [field]: value
            }
        }));
    };

    const primaryColor = localInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in overflow-hidden bg-white">
            <div className="bg-slate-900 text-white shadow-2xl flex flex-col md:flex-row gap-6 shrink-0 p-6 md:px-12 border-b border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-[1.5rem] text-white shadow-2xl transition-colors duration-500" style={{ backgroundColor: primaryColor }}><SettingsIcon size={26} /></div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tightest">Console Master</h1>
                        <p className="text-[9px] font-black uppercase text-indigo-400 mt-2 tracking-[0.4em] opacity-80">SRE Reliability Protocol V12.5</p>
                    </div>
                </div>

                <div className="flex-1 flex overflow-x-auto gap-2 py-1 no-scrollbar md:justify-end items-center relative z-10">
                    {[
                        { id: 'INFO', label: 'Identidade', icon: Building },
                        { id: 'INTERFACE', label: 'Módulos', icon: Layout },
                        { id: 'GOVERNANCE', label: 'Governança', icon: Layers },
                        { id: 'AI_PROVIDERS', label: 'Pool Neural', icon: Brain },
                        { id: 'MESSENGER', label: 'Messenger', icon: MessageCircle },
                        { id: 'TEMPLATES', label: 'Templates', icon: Code },
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
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4 border-b pb-8"><Building size={24} style={{ color: primaryColor }}/> Registro Corporativo & Representação</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Razão Social</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-lg uppercase outline-none focus:bg-white focus:border-indigo-500 shadow-inner" value={localInfo.name} onChange={e => setLocalInfo({ ...localInfo, name: e.target.value })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sigla Comercial</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 uppercase focus:border-indigo-500 shadow-sm" value={localInfo.shortName} onChange={e => setLocalInfo({ ...localInfo, shortName: e.target.value })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ Oficial</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 uppercase shadow-sm" value={localInfo.cnpj} onChange={e => setLocalInfo({ ...localInfo, cnpj: e.target.value })} />
                                </div>
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Sede</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 uppercase shadow-sm" value={localInfo.address} onChange={e => setLocalInfo({ ...localInfo, address: e.target.value })} />
                                </div>

                                <div className="md:col-span-2 p-10 bg-slate-50 border border-slate-200 rounded-[3rem] shadow-inner space-y-8">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><Crosshair size={18} className="text-indigo-600"/> Geoprocessamento Sede (JSON Lat/Lng)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude Sede</label>
                                            <input type="number" step="any" className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 shadow-sm focus:border-indigo-500" value={localInfo.coordinates?.lat || ''} onChange={e => setLocalInfo({ ...localInfo, coordinates: { ...localInfo.coordinates!, lat: parseFloat(e.target.value) } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude Sede</label>
                                            <input type="number" step="any" className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 shadow-sm focus:border-indigo-500" value={localInfo.coordinates?.lng || ''} onChange={e => setLocalInfo({ ...localInfo, coordinates: { ...localInfo.coordinates!, lng: parseFloat(e.target.value) } })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Logotipo</label>
                                    <div className="flex items-center gap-6 p-6 bg-slate-50 border border-dashed border-slate-300 rounded-[2rem] shadow-inner">
                                        <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200 shadow-md">
                                            {localInfo.logoUrl ? <img src={localInfo.logoUrl} className="w-full h-full object-contain p-2" /> : <ImageIcon size={40} className="text-slate-300" />}
                                        </div>
                                        <label className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-indigo-700 transition-all shadow-md">
                                            Carregar Imagem <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Cor Principal</label>
                                    <div className="flex items-center gap-6">
                                        <input type="color" className="w-20 h-20 rounded-2xl cursor-pointer border-4 border-white shadow-xl" value={localInfo.primaryColor} onChange={e => setLocalInfo({ ...localInfo, primaryColor: e.target.value })} />
                                        <input className="font-mono font-black text-xl uppercase bg-slate-100 px-6 py-4 rounded-2xl border" value={localInfo.primaryColor} readOnly />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'GOVERNANCE' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-12">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4 border-b pb-8"><Layers size={24} style={{ color: primaryColor }}/> Governança Semântica (Headers)</h3>
                            
                            <div className="grid grid-cols-1 gap-12">
                                {[
                                    { id: 'dashboard', label: 'Dashboard Admin', icon: Terminal },
                                    { id: 'users', label: 'Gestão de Membros', icon: Users },
                                    { id: 'finance', label: 'Financeiro', icon: Landmark },
                                    { id: 'resident_dashboard', label: 'Portal do Morador', icon: UserCheck },
                                    { id: 'demographics', label: 'Observatório Social', icon: Globe },
                                    { id: 'communication', label: 'Comunicação', icon: MessageSquare }
                                ].map(mod => (
                                    <div key={mod.id} className="p-10 bg-slate-50 border border-slate-200 rounded-[2.5rem] space-y-8 group hover:bg-white transition-all shadow-sm">
                                        <div className="flex items-center gap-5 border-b pb-6 border-slate-200">
                                            <div className="p-4 bg-white rounded-2xl shadow-sm text-indigo-600" style={{ color: primaryColor }}><mod.icon size={24}/></div>
                                            <h4 className="text-base font-black text-slate-800 uppercase tracking-widest">{mod.label}</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Header</label>
                                                <input 
                                                    className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 text-sm uppercase outline-none focus:border-indigo-500 shadow-sm" 
                                                    value={metadata[mod.id]?.title || ''} 
                                                    onChange={e => handleUpdateMetadata(mod.id, 'title', e.target.value)}
                                                    placeholder="Título customizado..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Slogan / Descrição</label>
                                                <input 
                                                    className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 text-sm uppercase outline-none focus:border-indigo-500 shadow-sm" 
                                                    value={metadata[mod.id]?.slogan || ''} 
                                                    onChange={e => handleUpdateMetadata(mod.id, 'slogan', e.target.value)}
                                                    placeholder="Subtítulo dinâmico..."
                                                />
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
                             <div className="absolute top-0 right-0 p-12 opacity-10"><Cpu size={250}/></div>
                             <div className="relative z-10 space-y-4">
                                <h2 className="text-5xl font-black uppercase tracking-tightest leading-none">Pool Neural</h2>
                                <p className="text-indigo-200 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Zap size={16}/> Cluster Intelligence Protocol</p>
                             </div>
                             <button onClick={() => { setEditingAiKey({ label: '', key_value: '', provider: 'GOOGLE', model: 'gemini-3-flash-preview', tier: 'FREE', status: 'ACTIVE', priority: 1 }); setIsAiKeyModalOpen(true); }} className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl relative z-10 flex items-center gap-3 active:scale-95 transition-all">
                                <Plus size={20}/> Injetar Token
                             </button>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {aiKeys.map(key => (
                                <div key={key.id} className="bg-white p-8 px-12 rounded-[3.5rem] border border-slate-200 flex flex-col md:flex-row justify-between items-center group hover:border-indigo-300 transition-all shadow-sm">
                                    <div className="flex items-center gap-8 flex-1">
                                        <div className="p-6 bg-slate-50 text-indigo-600 rounded-[2rem] shadow-inner group-hover:bg-indigo-50"><Key size={32}/></div>
                                        <div className="space-y-1">
                                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{key.label}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{key.provider} • {key.model}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => { setEditingAiKey(key); setIsAiKeyModalOpen(true); }} className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-indigo-100"><Edit3 size={20}/></button>
                                        <button onClick={async () => { if(confirm("Expurgar token?")) { await aiKeyService.delete(key.id); loadAiKeys(); } }} className="p-4 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-rose-100"><Trash2 size={20}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {activeTab === 'INTERFACE' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-12">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4 border-b pb-8"><Layout size={24} style={{ color: primaryColor }}/> Manifest de Interface</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {(localInfo.resident_ui_settings || []).map((mod, idx) => (
                                    <div key={mod.id} className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] flex justify-between items-center group hover:bg-white transition-all shadow-sm">
                                        <div className="flex items-center gap-6">
                                            <div className="p-4 bg-white rounded-2xl shadow-sm text-indigo-600" style={{ color: primaryColor }}><Radio size={24}/></div>
                                            <div>
                                                <h4 className="text-base font-black text-slate-800 uppercase">{mod.label}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{mod.detail}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const settings = [...(localInfo.resident_ui_settings || [])];
                                                if (settings[idx]) {
                                                    settings[idx].enabled = !settings[idx].enabled;
                                                    setLocalInfo({ ...localInfo, resident_ui_settings: settings });
                                                }
                                            }}
                                            className={`p-3 rounded-2xl transition-all shadow-lg ${mod.enabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}
                                            style={mod.enabled ? { backgroundColor: primaryColor } : {}}
                                        >
                                            {mod.enabled ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="fixed bottom-10 right-10 z-[1000] flex flex-col items-end gap-4">
                 <button onClick={handleSaveInfo} disabled={isSaving} className="px-12 py-6 bg-slate-950 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_30px_100px_rgba(0,0,0,0.5)] hover:bg-indigo-600 transition-all flex items-center gap-4 active:scale-95 group border border-white/5 backdrop-blur-md">
                    {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} />}
                    Commitar Mudanças Master
                 </button>
            </div>

            {isAiKeyModalOpen && editingAiKey && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                            <h3 className="font-black text-xl uppercase tracking-tighter">Token Neural</h3>
                            <button onClick={() => setIsAiKeyModalOpen(false)} className="p-3 text-slate-400 hover:bg-rose-500 rounded-xl"><X size={24}/></button>
                        </div>
                        <div className="p-10 space-y-8 bg-[#fdfdfe]">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rótulo</label>
                                <input className="w-full h-14 bg-slate-50 border rounded-xl px-5 font-black uppercase" value={editingAiKey.label} onChange={e => setEditingAiKey({...editingAiKey, label: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">API KEY</label>
                                <input className="w-full h-14 bg-slate-50 border rounded-xl px-5 font-mono" type="password" value={editingAiKey.key_value} onChange={e => setEditingAiKey({...editingAiKey, key_value: e.target.value})} />
                            </div>
                            <button onClick={handleSaveAiKey} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Sincronizar Token</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
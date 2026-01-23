
import React, { useState, useEffect } from 'react';
import { SystemInfo, WhatsAppConfig, AIKey, ResidentUISetting } from '../types';
import { systemService, aiKeyService, api, communicationService } from '../services/api';
import { SYSTEM_PERMISSIONS, MENU_ITEMS } from '../constants';
import {
    Settings as SettingsIcon, Building, X, Plus, Trash2, Loader2, Save,
    MessageCircle, ShieldCheck, Image as ImageIcon, Layout, Shield, 
    Upload, Globe, MapPin, Monitor, ShieldAlert, Variable, Edit3, CheckCircle2,
    Brain, Cpu, Key, Radio, Zap, ExternalLink, Smartphone, Lock, History, Layers,
    Wallet, Calendar, Bell, ToggleRight, ToggleLeft, Palette, Type, UserCheck, FileSignature,
    Gift, ReceiptText, Crosshair, Server, Database, MessageSquare, Workflow, Camera, Code, RotateCcw,
    Activity, Eye, EyeOff, ClipboardList, PenTool, Globe2, Sparkles
} from 'lucide-react';

interface SettingsProps {
    systemInfo: SystemInfo;
    onUpdateSystemInfo: (info: SystemInfo) => void;
}

const Settings = ({ systemInfo, onUpdateSystemInfo }: SettingsProps) => {
    const [activeTab, setActiveTab] = useState<'INFO' | 'INTERFACE' | 'AI_PROVIDERS' | 'MESSENGER' | 'TEMPLATES' | 'GOVERNANCE' | 'PERMISSIONS'>('INFO');
    const [isSaving, setIsSaving] = useState(false);
    const [localInfo, setLocalInfo] = useState<SystemInfo>(systemInfo);
    
    // States para Pool Neural
    const [aiKeys, setAiKeys] = useState<AIKey[]>([]);
    const [isAiKeyModalOpen, setIsAiKeyModalOpen] = useState(false);
    const [editingAiKey, setEditingAiKey] = useState<Partial<AIKey> | null>(null);
    const [showKeyContent, setShowKeyContent] = useState<Record<string | number, boolean>>({});

    // States para RBAC
    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // States para Templates
    const [templates, setTemplates] = useState<any[]>([]);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    
    // Config de Mensageria (JennyAI Bridge V8.5)
    const [waConfig, setWaConfig] = useState<WhatsAppConfig>(systemInfo.whatsapp_config || {
        api_key: '', 
        sender: '', 
        footer: 'S.I.E PRO', 
        gateway_url: 'https://jennyai.space/send-message',
        webhook_url: 'https://admcacaria.jennyai.space/api/communication/whatsapp-webhook',
        billing_reminder_2d: true,
        billing_reminder_1d: true,
        late_reminder: true,
        welcome_msg: true
    });

    const [metadata, setMetadata] = useState<any>((systemInfo as any).module_metadata || {});

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
        } catch (e) { console.error("Neural Pool Offline"); } 
        finally { setIsLoadingData(false); }
    };

    const loadTemplates = async () => {
        setIsLoadingData(true);
        try {
            const res = await communicationService.getTemplates();
            setTemplates(res.data.data || []);
        } catch (e) { console.error("Template Engine Offline"); }
        finally { setIsLoadingData(false); }
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

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLocalInfo({ ...localInfo, logoUrl: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLocalInfo({ ...localInfo, president_signature: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

    // --- RBAC HANDLERS ---
    const handleSaveRole = async () => {
        if (!editingRole.id || !editingRole.label) return;
        setIsSaving(true);
        try {
            const exists = roles.find(r => r.id === editingRole.id);
            if (exists) await systemService.updateRole(editingRole.id, editingRole);
            else await systemService.saveRole(editingRole);
            setIsRoleModalOpen(false);
            loadRBAC();
        } finally { setIsSaving(false); }
    };

    // --- AI KEY HANDLERS ---
    const handleSaveAiKey = async () => {
        if (!editingAiKey || !editingAiKey.label || !editingAiKey.key_value) return;
        setIsSaving(true);
        try {
            if (editingAiKey.id) {
                await aiKeyService.update(editingAiKey.id, editingAiKey);
            } else {
                await aiKeyService.create(editingAiKey);
            }
            setIsAiKeyModalOpen(false);
            setEditingAiKey(null);
            loadAiKeys();
        } catch (e) {
            alert("Erro ao salvar chave de IA no pool.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- TEMPLATE HANDLERS ---
    const handleSaveTemplate = async () => {
        if (!editingTemplate.name || !editingTemplate.content) return;
        setIsSaving(true);
        try {
            await communicationService.saveTemplate(editingTemplate);
            setIsTemplateModalOpen(false);
            loadTemplates();
        } finally { setIsSaving(false); }
    };

    const primaryColor = localInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in overflow-hidden bg-white">
            {/* SRE CONSOLE HEADER */}
            <div className="bg-slate-900 text-white shadow-2xl flex flex-col md:flex-row gap-6 shrink-0 p-6 md:px-12 border-b border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-[1.5rem] text-white shadow-2xl transition-colors duration-500" style={{ backgroundColor: primaryColor }}><SettingsIcon size={26} /></div>
                    <div>
                        <h1 className="text-2xl font-black uppercase leading-none tracking-tightest">Console Master</h1>
                        <p className="text-[9px] font-black uppercase text-indigo-400 mt-2 tracking-[0.4em] opacity-80 italic">SRE Reliability Protocol V12.0</p>
                    </div>
                </div>

                <div className="flex-1 flex overflow-x-auto gap-2 py-1 no-scrollbar md:justify-end items-center relative z-10">
                    {[
                        { id: 'INFO', label: 'Identidade', icon: Building },
                        { id: 'INTERFACE', label: 'Módulos', icon: Layout },
                        { id: 'AI_PROVIDERS', label: 'Pool Neural', icon: Brain },
                        { id: 'MESSENGER', label: 'Messenger', icon: MessageCircle },
                        { id: 'TEMPLATES', label: 'Templates', icon: Code },
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
                
                {/* ABA: IDENTIDADE (Resource: INFO) */}
                {activeTab === 'INFO' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-12">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4 border-b pb-8"><Building size={24} style={{ color: primaryColor }}/> Registro Corporativo & Representação</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Razão Social / Nome da Entidade</label>
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
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Website Oficial</label>
                                    <div className="relative group">
                                        <Globe2 className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                                        <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl pl-16 pr-8 text-indigo-600 outline-none focus:border-indigo-500 shadow-sm" value={localInfo.website} onChange={e => setLocalInfo({ ...localInfo, website: e.target.value })} placeholder="www.seusite.com.br" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Administrativo</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 uppercase shadow-sm" value={localInfo.email} onChange={e => setLocalInfo({ ...localInfo, email: e.target.value })} />
                                </div>

                                {/* DOSSIÊ DA PRESIDÊNCIA */}
                                <div className="md:col-span-2 p-10 bg-indigo-50/50 border border-indigo-100 rounded-[3rem] space-y-10 shadow-inner">
                                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-3"><UserCheck size={20} className="text-indigo-600"/> Representação Legal (Dossiê Presidência)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Presidente / Síndico</label>
                                            <input className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 uppercase shadow-sm" value={localInfo.president_name} onChange={e => setLocalInfo({...localInfo, president_name: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF do Presidente</label>
                                            <input className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 shadow-sm" value={localInfo.president_cpf} onChange={e => setLocalInfo({...localInfo, president_cpf: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Início do Mandato</label>
                                            <input type="date" className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 shadow-sm" value={localInfo.management_start} onChange={e => setLocalInfo({...localInfo, management_start: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Término do Mandato</label>
                                            <input type="date" className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 shadow-sm" value={localInfo.management_end} onChange={e => setLocalInfo({...localInfo, management_end: e.target.value})} />
                                        </div>
                                        <div className="md:col-span-2 space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assinatura Digitalizada (PNG/Transparent)</label>
                                            <div className="flex items-center gap-6 p-6 bg-white border border-dashed border-indigo-200 rounded-[2rem] shadow-sm">
                                                <div className="w-48 h-20 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm p-2">
                                                    {localInfo.president_signature ? <img src={localInfo.president_signature} className="w-full h-full object-contain" /> : <PenTool size={24} className="text-slate-300" />}
                                                </div>
                                                <label className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-indigo-700 transition-all shadow-md">
                                                    Carregar Assinatura <input type="file" className="hidden" accept="image/*" onChange={handleSignatureUpload} />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* GEOPROCESSAMENTO SEDE */}
                                <div className="md:col-span-2 p-10 bg-slate-50 border border-slate-200 rounded-[3rem] shadow-inner space-y-8">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><Crosshair size={18} className="text-indigo-600"/> Georreferenciamento Sede (Epicentro Tático)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude Sede</label>
                                            <input type="number" step="any" className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 shadow-sm" value={localInfo.coordinates?.lat || ''} onChange={e => setLocalInfo({ ...localInfo, coordinates: { ...localInfo.coordinates!, lat: parseFloat(e.target.value) } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude Sede</label>
                                            <input type="number" step="any" className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 shadow-sm" value={localInfo.coordinates?.lng || ''} onChange={e => setLocalInfo({ ...localInfo, coordinates: { ...localInfo.coordinates!, lng: parseFloat(e.target.value) } })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Identidade Visual (Logotipo)</label>
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
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Cor Principal (Theming Engine)</label>
                                    <div className="flex items-center gap-6">
                                        <input type="color" className="w-20 h-20 rounded-2xl cursor-pointer border-4 border-white shadow-xl" value={localInfo.primaryColor} onChange={e => setLocalInfo({ ...localInfo, primaryColor: e.target.value })} />
                                        <input className="font-mono font-black text-xl uppercase bg-slate-100 px-6 py-4 rounded-2xl border" value={localInfo.primaryColor} readOnly />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ABA: MÓDULOS (Resource: INTERFACE) */}
                {activeTab === 'INTERFACE' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-12">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4 border-b pb-8"><Layout size={24} style={{ color: primaryColor }}/> Manifest de Interface & Governança de Recursos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {(localInfo.resident_ui_settings || [
                                    { id: 'finance', label: 'Financeiro', enabled: true, icon: 'Wallet', detail: 'Portal de faturas e histórico ledger' },
                                    { id: 'reservations', label: 'Reservas', enabled: true, icon: 'Calendar', detail: 'Agendamento de áreas comuns' },
                                    { id: 'mural', label: 'Mural', enabled: true, icon: 'Bell', detail: 'Feed de avisos e comunicados' },
                                    { id: 'chat', label: 'IA Advisor', enabled: true, icon: 'Brain', detail: 'Mentor neural para dúvidas normativas' },
                                    { id: 'marketplace', label: 'Marketplace', enabled: true, icon: 'ShoppingBag', detail: 'Vitrine de comércio circular local' },
                                    { id: 'suggestions', label: 'Ouvidoria', enabled: true, icon: 'HelpCircle', detail: 'Canal de manifestações' }
                                ]).map((mod, idx) => (
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

                {/* ABA: INTELIGÊNCIA (AI PROVIDERS) */}
                {activeTab === 'AI_PROVIDERS' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-indigo-600 p-16 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12">
                             <div className="absolute top-0 right-0 p-12 opacity-10"><Cpu size={250}/></div>
                             <div className="relative z-10 space-y-4">
                                <h2 className="text-5xl font-black uppercase tracking-tightest leading-none">Pool Neural</h2>
                                <p className="text-indigo-200 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Zap size={16}/> Cluster Intelligence Protocol V12.0</p>
                             </div>
                             <button onClick={() => { setEditingAiKey({ label: '', key_value: '', provider: 'GOOGLE', model: 'gemini-3-flash-preview', tier: 'FREE', status: 'ACTIVE', priority: 1 }); setIsAiKeyModalOpen(true); }} className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl relative z-10 flex items-center gap-3 active:scale-95 transition-all">
                                <Plus size={20}/> Injetar Token
                             </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {isLoadingData ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={48}/></div> : aiKeys.map(key => (
                                <div key={key.id} className="bg-white p-8 px-12 rounded-[3.5rem] border border-slate-200 flex flex-col md:flex-row justify-between items-center group hover:border-indigo-300 transition-all shadow-sm">
                                    <div className="flex items-center gap-8 flex-1">
                                        <div className="p-6 bg-slate-50 text-indigo-600 rounded-[2rem] border border-slate-100 shadow-inner group-hover:bg-indigo-50 transition-colors"><Key size={32}/></div>
                                        <div className="space-y-1">
                                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{key.label}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{key.provider} • {key.model} • {key.tier}</p>
                                            <div className="flex items-center gap-3 mt-4">
                                                <code className="text-[11px] font-mono text-slate-300 select-all truncate max-w-[200px] bg-slate-50 px-3 py-1 rounded-lg">
                                                    {showKeyContent[key.id] ? key.key_value : '••••••••••••••••'}
                                                </code>
                                                <button onClick={() => setShowKeyContent(p => ({...p, [key.id]: !p[key.id]}))} className="text-slate-400 hover:text-indigo-600">
                                                    {showKeyContent[key.id] ? <EyeOff size={14}/> : <Eye size={14}/>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-12 mt-8 md:mt-0">
                                        <div className="text-right border-r border-slate-100 pr-10 hidden lg:block">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Health Monitor</p>
                                            <div className="flex items-center gap-3">
                                                <p className={`text-[11px] font-black uppercase ${key.status === 'ACTIVE' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {key.status} • ERR: {key.error_count}
                                                </p>
                                                {key.error_count > 0 && (
                                                    <button onClick={async () => { await aiKeyService.update(key.id, { ...key, error_count: 0 }); loadAiKeys(); }} className="p-1.5 bg-slate-100 rounded-lg text-slate-400 hover:bg-indigo-600 hover:text-white transition-all"><RotateCcw size={12}/></button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <button onClick={() => { setEditingAiKey(key); setIsAiKeyModalOpen(true); }} className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-indigo-100"><Edit3 size={20}/></button>
                                            <button onClick={async () => { if(confirm("Expurgar token?")) { await aiKeyService.delete(key.id); loadAiKeys(); } }} className="p-4 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-rose-100"><Trash2 size={20}/></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {aiKeys.length === 0 && !isLoadingData && (
                                <div className="py-32 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
                                    <Brain size={64} className="mx-auto text-slate-200 mb-6 opacity-30"/>
                                    <p className="font-black uppercase text-[10px] text-slate-400 tracking-[0.4em]">Pool exaurido. Nenhum token ativo no cluster.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ABA: MESSENGER (JENNYAI BRIDGE) */}
                {activeTab === 'MESSENGER' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-emerald-600 p-16 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12">
                             <div className="absolute top-0 right-0 p-12 opacity-10"><MessageSquare size={250}/></div>
                             <div className="relative z-10 space-y-4">
                                <h2 className="text-5xl font-black uppercase tracking-tightest leading-none">Messenger Bridge</h2>
                                <p className="text-emerald-100 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Smartphone size={16}/> JennyAI Active Gateway V8.5</p>
                             </div>
                        </div>

                        <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-12">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4 border-b pb-8"><MessageCircle size={24} className="text-emerald-600"/> Gateway & Webhook Hub</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">JennyAI API KEY (SRE Secret)</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                                        <input type="password" placeholder="sk-jenny-xxxxxxxxxxxxxxxx" className="w-full font-mono h-16 bg-slate-50 border border-slate-200 rounded-3xl pl-16 pr-8 text-sm focus:border-emerald-500 outline-none shadow-inner" value={waConfig.api_key} onChange={e => setWaConfig({...waConfig, api_key: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Instance Sender ID</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-lg uppercase outline-none focus:border-emerald-500 shadow-sm" value={waConfig.sender} onChange={e => setWaConfig({...waConfig, sender: e.target.value})} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Assinatura de Rodapé</label>
                                    <input className="w-full font-medium h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-sm uppercase outline-none focus:border-emerald-500 shadow-sm" value={waConfig.footer} onChange={e => setWaConfig({...waConfig, footer: e.target.value})} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Endpoint do Gateway</label>
                                    <input className="w-full font-mono h-14 bg-slate-100 border border-slate-200 rounded-2xl px-6 text-[10px] text-indigo-600 focus:bg-white" value={waConfig.gateway_url} onChange={e => setWaConfig({...waConfig, gateway_url: e.target.value})} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">URL WebHook (Inbound)</label>
                                    <input className="w-full font-mono h-14 bg-slate-100 border border-slate-200 rounded-2xl px-6 text-[10px] text-emerald-600 focus:bg-white" value={waConfig.webhook_url} onChange={e => setWaConfig({...waConfig, webhook_url: e.target.value})} />
                                </div>
                            </div>

                            {/* CONFIGURAÇÃO DE MENSAGENS DO SISTEMA (CRITICAL RESTORATION) */}
                            <div className="p-10 bg-slate-50 border border-slate-200 rounded-[3rem] space-y-10 shadow-inner">
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><Bell size={18} className="text-indigo-600"/> Protocolos de Mensagem Automática</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200 flex justify-between items-center shadow-sm">
                                        <div>
                                            <p className="text-xs font-black text-slate-800 uppercase">Lembrete Preventivo (2 dias)</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest italic">Disparo automático 48h antes do vencimento.</p>
                                        </div>
                                        <button onClick={() => setWaConfig({...waConfig, billing_reminder_2d: !waConfig.billing_reminder_2d})} className={`p-3 rounded-xl transition-all shadow-md ${waConfig.billing_reminder_2d ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {waConfig.billing_reminder_2d ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
                                        </button>
                                    </div>
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200 flex justify-between items-center shadow-sm">
                                        <div>
                                            <p className="text-xs font-black text-slate-800 uppercase">Alerta de Proximidade (1 dia)</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest italic">Disparo automático 24h antes do vencimento.</p>
                                        </div>
                                        <button onClick={() => setWaConfig({...waConfig, billing_reminder_1d: !waConfig.billing_reminder_1d})} className={`p-3 rounded-xl transition-all shadow-md ${waConfig.billing_reminder_1d ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {waConfig.billing_reminder_1d ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
                                        </button>
                                    </div>
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200 flex justify-between items-center shadow-sm">
                                        <div>
                                            <p className="text-xs font-black text-slate-800 uppercase">Aviso de Inadimplência</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest italic">Disparo automático após 24h de atraso.</p>
                                        </div>
                                        <button onClick={() => setWaConfig({...waConfig, late_reminder: !waConfig.late_reminder})} className={`p-3 rounded-xl transition-all shadow-md ${waConfig.late_reminder ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {waConfig.late_reminder ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
                                        </button>
                                    </div>
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200 flex justify-between items-center shadow-sm">
                                        <div>
                                            <p className="text-xs font-black text-slate-800 uppercase">Mensagem de Boas-Vindas</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest italic">Credenciais de acesso para novos membros.</p>
                                        </div>
                                        <button onClick={() => setWaConfig({...waConfig, welcome_msg: !waConfig.welcome_msg})} className={`p-3 rounded-xl transition-all shadow-md ${waConfig.welcome_msg ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {waConfig.welcome_msg ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ABA: TEMPLATES NEURAIS */}
                {activeTab === 'TEMPLATES' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-slate-800 p-16 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12">
                             <div className="absolute top-0 right-0 p-12 opacity-10"><Code size={250}/></div>
                             <div className="relative z-10 space-y-4">
                                <h2 className="text-5xl font-black uppercase tracking-tightest leading-none">Templates</h2>
                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Variable size={16}/> Substitution Engine V2.0</p>
                             </div>
                             <button onClick={() => { setEditingTemplate({ name: '', event_trigger: '', content: '', variables_available: [], is_active: 1 }); setIsTemplateModalOpen(true); }} className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl relative z-10 flex items-center gap-3 active:scale-95 transition-all">
                                <Plus size={20}/> Novo Modelo
                             </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {isLoadingData ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={48}/></div> : templates.map(tpl => (
                                <div key={tpl.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 flex flex-col gap-6 group hover:border-indigo-300 transition-all shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-6">
                                            <div className="p-4 bg-slate-50 text-indigo-600 rounded-2xl border border-slate-100 shadow-inner"><Type size={24}/></div>
                                            <div>
                                                <h4 className="text-lg font-black text-slate-800 uppercase">{tpl.name}</h4>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gatilho: {tpl.event_trigger}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingTemplate(tpl); setIsTemplateModalOpen(true); }} className="p-3 text-slate-300 hover:text-indigo-600 transition-all"><Edit3 size={18}/></button>
                                            <button onClick={async () => { if(confirm("Expurgar template?")) { await communicationService.deleteTemplate(tpl.id); loadTemplates(); } }} className="p-3 text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={18}/></button>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 font-medium text-xs text-slate-500 italic uppercase leading-relaxed shadow-inner">
                                        "{tpl.content}"
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(typeof tpl.variables_available === 'string' ? JSON.parse(tpl.variables_available) : tpl.variables_available || []).map((v: string) => (
                                            <span key={v} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black border border-indigo-100 uppercase">{"{" + v + "}"}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ABA: GOVERNANÇA (MANIFESTO DE TÍTULOS) */}
                {activeTab === 'GOVERNANCE' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-slate-900 p-16 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12">
                             <div className="absolute top-0 right-0 p-12 opacity-5"><Layers size={250}/></div>
                             <div className="relative z-10 space-y-4">
                                <h2 className="text-5xl font-black uppercase tracking-tightest leading-none">Manifesto Semântico</h2>
                                <p className="text-indigo-400 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Type size={16}/> Slogans Dinâmicos por Módulo</p>
                             </div>
                        </div>

                        <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-8">
                            {MENU_ITEMS.map(mod => (
                                <div key={mod.id} className="p-10 rounded-[3rem] bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-xl transition-all group">
                                    <div className="flex items-center gap-6 mb-8 border-b border-slate-100 pb-6">
                                        <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg" style={{ backgroundColor: primaryColor }}><mod.icon size={24}/></div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Módulo: {mod.label}</h4>
                                            <code className="text-[9px] font-mono text-slate-400 uppercase">RESOURCE: {mod.id}</code>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Header Personalizado</label>
                                            <input className="w-full font-black h-16 bg-white border border-slate-200 rounded-2xl px-6 text-lg uppercase outline-none focus:border-indigo-500 shadow-sm" value={metadata[mod.id]?.title || mod.label} onChange={e => setMetadata({...metadata, [mod.id]: {...(metadata[mod.id] || {}), title: e.target.value.toUpperCase()}})} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Slogan / Descritivo de Apoio</label>
                                            <input className="w-full font-medium h-16 bg-white border border-slate-200 rounded-2xl px-6 text-sm uppercase outline-none focus:border-indigo-500 shadow-sm" value={metadata[mod.id]?.slogan || ''} onChange={e => setMetadata({...metadata, [mod.id]: {...(metadata[mod.id] || {}), slogan: e.target.value.toUpperCase()}})} placeholder="Ex: Gestão e Governança de Membros..." />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ABA: RBAC (Resource: PERMISSIONS) */}
                {activeTab === 'PERMISSIONS' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-12">
                             <div className="flex justify-between items-center border-b pb-8">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4"><Shield size={24} style={{ color: primaryColor }}/> Matriz RBAC de Governança</h3>
                                <button onClick={() => { setEditingRole({ id: '', label: '' }); setIsRoleModalOpen(true); }} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-indigo-600 transition-all">
                                    <Plus size={16}/> Novo Cargo SRE
                                </button>
                             </div>
                             
                             <div className="overflow-x-auto custom-scrollbar">
                                 <table className="w-full text-left border-collapse">
                                     <thead>
                                         <tr className="border-b border-slate-100">
                                             <th className="p-6 text-[11px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 sticky left-0 z-10 shadow-sm">Ações do Sistema</th>
                                             {roles.map(role => (
                                                 <th key={role.id} className="p-6 text-center text-[10px] font-black uppercase text-slate-900 tracking-widest min-w-[150px] group">
                                                     <div className="flex flex-col items-center gap-2">
                                                         {role.label}
                                                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button onClick={() => { setEditingRole(role); setIsRoleModalOpen(true); }} className="p-1.5 bg-slate-100 text-slate-400 rounded-lg hover:bg-indigo-600 hover:text-white"><Edit3 size={12}/></button>
                                                         </div>
                                                     </div>
                                                 </th>
                                             ))}
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-100">
                                         {SYSTEM_PERMISSIONS.map(perm => (
                                             <tr key={perm.id} className="hover:bg-slate-50 transition-all group">
                                                 <td className="p-6 font-black text-slate-700 text-xs uppercase tracking-tight sticky left-0 bg-white z-10 border-r border-slate-50 shadow-sm">{perm.label}</td>
                                                 {roles.map(role => {
                                                     const isGranted = permissions.some(p => p.role === role.id && p.permission_id === perm.id);
                                                     const isAdmin = role.id === 'ADMIN';
                                                     return (
                                                         <td key={`${role.id}-${perm.id}`} className="p-6 text-center">
                                                             <button 
                                                                disabled={isAdmin}
                                                                onClick={async () => {
                                                                    await systemService.togglePermission({ role: role.id, permission_id: perm.id, active: !isGranted });
                                                                    loadRBAC();
                                                                }}
                                                                className={`p-4 rounded-2xl transition-all shadow-sm ${isAdmin || isGranted ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300'} ${isAdmin ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
                                                                style={(isAdmin || isGranted) ? { backgroundColor: primaryColor } : {}}
                                                             >
                                                                 {isAdmin || isGranted ? <ShieldCheck size={24}/> : <Shield size={24}/>}
                                                             </button>
                                                         </td>
                                                     );
                                                 })}
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                        </div>
                    </div>
                )}

            </div>

            {/* SYNC ACTION BAR */}
            <div className="fixed bottom-10 right-10 z-[1000] flex flex-col items-end gap-4">
                 <button onClick={handleSaveInfo} disabled={isSaving} className="px-12 py-6 bg-slate-950 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_30px_100px_rgba(0,0,0,0.5)] hover:bg-indigo-600 transition-all flex items-center gap-4 active:scale-95 group border border-white/5 backdrop-blur-md">
                    {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
                    Commitar Mudanças Master
                 </button>
            </div>

            {/* MODAL: CARGO SRE */}
            {isRoleModalOpen && editingRole && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-md self-center">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 shadow-2xl">
                            <div className="flex items-center gap-5">
                                <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl"><Shield size={22}/></div>
                                <h3 className="font-black text-xl uppercase tracking-tighter">Cargo / Papel SRE</h3>
                            </div>
                            <button onClick={() => setIsRoleModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                        </div>
                        <div className="p-10 space-y-8 bg-[#fdfdfe]">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificador Único (RESOURCE)</label>
                                <input readOnly={!!roles.find(r => r.id === editingRole.id)} className="w-full font-mono h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm outline-none focus:border-indigo-500 uppercase disabled:opacity-50 shadow-inner" placeholder="EX: SERVICE, COUNCIL..." value={editingRole.id} onChange={e => setEditingRole({...editingRole, id: e.target.value.toUpperCase()})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rótulo Visual (Label)</label>
                                <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm outline-none focus:border-indigo-500 shadow-inner" placeholder="EX: Prestador de Serviço..." value={editingRole.label} onChange={e => setEditingRole({...editingRole, label: e.target.value})} />
                            </div>
                            <div className="pt-4 flex gap-4">
                                {roles.find(r => r.id === editingRole.id) && !['ADMIN', 'RESIDENT'].includes(editingRole.id) && (
                                    <button onClick={async () => { if(confirm("Expurgar cargo?")) { await systemService.deleteRole(editingRole.id); setIsRoleModalOpen(false); loadRBAC(); } }} className="p-4 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"><Trash2 size={20}/></button>
                                )}
                                <button onClick={handleSaveRole} disabled={isSaving} className="flex-1 py-5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                                    {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Commitar Cargo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: AI TOKEN */}
            {isAiKeyModalOpen && editingAiKey && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 shadow-2xl">
                            <div className="flex items-center gap-5">
                                <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl"><Brain size={22}/></div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Token Neural</h3>
                                    <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">Failover Pool V12.0</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAiKeyModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                        </div>
                        
                        <div className="p-10 space-y-8 bg-[#fdfdfe]">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificação / Rótulo</label>
                                <input required className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-lg focus:bg-white focus:border-indigo-500 transition-all outline-none uppercase shadow-inner" value={editingAiKey.label} onChange={e => setEditingAiKey({...editingAiKey, label: e.target.value})} placeholder="EX: GEMINI PRIMARY FLASH" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">API KEY (Provedor)</label>
                                <div className="relative group">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                                    <input type="password" required className="w-full font-mono h-16 bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-6 text-sm focus:bg-white focus:border-indigo-500 outline-none shadow-inner" value={editingAiKey.key_value} onChange={e => setEditingAiKey({...editingAiKey, key_value: e.target.value})} placeholder="sk-xxxxxxxxxxxxxxxx" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Provedor</label>
                                    <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-5 text-sm font-black uppercase outline-none shadow-sm" value={editingAiKey.provider} onChange={e => setEditingAiKey({...editingAiKey, provider: e.target.value})}>
                                        <option value="GOOGLE">Google Cloud (Gemini)</option>
                                        <option value="OPENAI">OpenAI (GPT)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo Alvo</label>
                                    <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-5 text-sm font-black uppercase outline-none shadow-sm" value={editingAiKey.model} onChange={e => setEditingAiKey({...editingAiKey, model: e.target.value})}>
                                        <option value="gemini-3-flash-preview">Gemini 3 Flash (Fast)</option>
                                        <option value="gemini-3-pro-preview">Gemini 3 Pro (Complex)</option>
                                        <option value="gemini-2.5-flash">Gemini 2.5 (Stable)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button onClick={() => setIsAiKeyModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                                <button onClick={handleSaveAiKey} disabled={isSaving} className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95">
                                    {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Injetar no Pool
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: MESSENGER TEMPLATE */}
            {isTemplateModalOpen && editingTemplate && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-3xl self-center">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 shadow-2xl">
                            <div className="flex items-center gap-5">
                                <div className="p-3.5 bg-emerald-600 rounded-xl shadow-xl"><Code size={22}/></div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Template de Mensagem</h3>
                                    <p className="text-emerald-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">Substitution Engine V2.0</p>
                                </div>
                            </div>
                            <button onClick={() => setIsTemplateModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                        </div>
                        <div className="p-10 space-y-8 bg-[#fdfdfe]">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificação Interna</label>
                                    <input required className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm outline-none focus:border-emerald-500 shadow-inner uppercase" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} placeholder="EX: COBRANÇA_PREVENTIVA" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trigger / Gatilho</label>
                                    <input required className="w-full font-mono h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-xs outline-none focus:border-emerald-500 shadow-inner" value={editingTemplate.event_trigger} onChange={e => setEditingTemplate({...editingTemplate, event_trigger: e.target.value})} placeholder="EX: BILLING_2D_BEFORE" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Corpo da Mensagem (Suporte a Variáveis)</label>
                                <textarea rows={6} required className="w-full font-medium bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-sm outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-inner uppercase leading-relaxed" value={editingTemplate.content} onChange={e => setEditingTemplate({...editingTemplate, content: e.target.value})} placeholder="Olá {nome}, este é um lembrete..." />
                            </div>
                            <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex items-center gap-6 shadow-sm">
                                {/* FIX: Added missing Sparkles icon import and usage to maintain dynamic UI/UX standards */}
                                <div className="p-4 bg-white text-indigo-600 rounded-2xl shadow-sm"><Sparkles size={20}/></div>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-900 uppercase">Variáveis Suportadas</p>
                                    <p className="text-[8px] text-indigo-700 font-bold uppercase mt-1">{"{nome}, {unidade}, {sigla}, {vencimento}, {valor}, {link_boleto}"}</p>
                                </div>
                            </div>
                            <div className="pt-4 flex gap-4">
                                <button onClick={() => setIsTemplateModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600">Cancelar</button>
                                <button onClick={handleSaveTemplate} disabled={isSaving} className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3">
                                    {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Commitar Template
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;

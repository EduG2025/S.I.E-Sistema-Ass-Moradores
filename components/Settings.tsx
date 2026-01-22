import React, { useState, useEffect, useRef } from 'react';
import { SystemInfo, AIKey, WhatsAppConfig } from '../types';
import { systemService, aiKeyService, communicationService } from '../services/api';
import { SYSTEM_PERMISSIONS } from '../constants';
import {
    Settings as SettingsIcon, Building, X, Plus, Trash2, Loader2, Key, Zap, Lock, 
    MessageCircle, ShieldCheck, Image as ImageIcon, Layout, Save,
    Shield, UserCheck, Cpu, CheckCircle2, History, Sparkles,
    Mail, Phone, Fingerprint, Box, Leaf, BarChart3,
    ClipboardList, Camera, Wallet, Bell, Brain, ShoppingBag, HelpCircle, FileText, QrCode,
    Landmark, Gavel, Upload, Globe, MapPin, Monitor, Calendar, ShieldAlert, Layers, Variable, Edit3, Power
} from 'lucide-react';

interface SettingsProps {
    systemInfo: SystemInfo;
    onUpdateSystemInfo: (info: SystemInfo) => void;
}

const Settings = ({ systemInfo, onUpdateSystemInfo }: SettingsProps) => {
    const [activeTab, setActiveTab] = useState<'INFO' | 'INTERFACE' | 'WHATSAPP' | 'TEMPLATES' | 'PERMISSIONS'>('INFO');
    const [isSaving, setIsSaving] = useState(false);
    const [localInfo, setLocalInfo] = useState<SystemInfo>(systemInfo);
    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [waConfig, setWaConfig] = useState<WhatsAppConfig>(systemInfo.whatsapp_config || {
        api_key: '', sender: '', footer: 'S.I.E PRO', welcome_template: '', default_password: 'mudar123'
    });

    const [editingTpl, setEditingTpl] = useState<any>(null);

    useEffect(() => {
        if (activeTab === 'PERMISSIONS') loadRBAC();
        if (activeTab === 'TEMPLATES') loadTemplates();
    }, [activeTab]);

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

    const loadTemplates = async () => {
        setIsLoadingData(true);
        try {
            const res = await communicationService.getTemplates();
            setTemplates(res.data.data || []);
        } finally { setIsLoadingData(false); }
    };

    const handleSaveInfo = async () => {
        setIsSaving(true);
        try {
            const payload = { ...localInfo, whatsapp_config: waConfig };
            await systemService.updateInfo(payload);
            onUpdateSystemInfo(payload);
            alert("✅ SRE: Kernel Sincronizado e Persistente.");
        } catch (e) { alert("Erro crítico de sincronia."); } 
        finally { setIsSaving(false); }
    };

    const handleSaveTemplate = async () => {
        if (!editingTpl.name || !editingTpl.content) return;
        setIsSaving(true);
        try {
            await communicationService.saveTemplate(editingTpl);
            setEditingTpl(null);
            loadTemplates();
        } catch (e) { alert("Falha ao salvar template."); }
        finally { setIsSaving(false); }
    };

    const handleTogglePermission = async (role: string, permissionId: string, current: boolean) => {
        try {
            await systemService.togglePermission({ role, permission_id: permissionId, active: !current });
            loadRBAC();
        } catch (e) { alert("Erro ao atualizar RBAC."); }
    };

    const handleAddRole = async () => {
        const id = prompt("ID do Cargo (Ex: MANAGER):")?.toUpperCase();
        const label = prompt("Nome Legível (Ex: Gerente Administrativo):");
        if (!id || !label) return;
        try {
            await systemService.saveRole({ id, label });
            loadRBAC();
        } catch (e) { alert("Falha ao criar cargo."); }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLocalInfo({ ...localInfo, logoUrl: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

    const primaryColor = localInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in overflow-hidden bg-white">
            <div className="module-header bg-slate-900 text-white shadow-2xl flex flex-col md:flex-row gap-6 shrink-0 p-6 md:px-12 border-b border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-[1.5rem] text-white shadow-2xl" style={{ backgroundColor: primaryColor }}><SettingsIcon size={26} /></div>
                    <div>
                        <h1 className="text-2xl font-black uppercase leading-none tracking-tightest">Settings Console</h1>
                        <p className="text-[9px] font-black uppercase text-indigo-400 mt-2 tracking-[0.4em] opacity-80 italic">SRE Reliability Protocol V8.5</p>
                    </div>
                </div>

                <div className="flex-1 flex overflow-x-auto gap-2 py-1 no-scrollbar md:justify-end items-center relative z-10">
                    {[
                        { id: 'INFO', label: 'Identidade', icon: Building },
                        { id: 'INTERFACE', label: 'Módulos', icon: Layout },
                        { id: 'WHATSAPP', label: 'Messenger', icon: MessageCircle },
                        { id: 'TEMPLATES', label: 'Templates', icon: Variable },
                        { id: 'PERMISSIONS', label: 'Governança', icon: Shield }
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
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-12 relative overflow-hidden">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4 border-b border-slate-100 pb-8"><Building size={24} className="text-indigo-600" style={{ color: primaryColor }}/> Identidade Corporativa</h3>
                            <div className="grid grid-cols-1 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Associação</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-lg focus:bg-white focus:border-indigo-500 outline-none uppercase shadow-inner" value={localInfo.name} onChange={e => setLocalInfo({ ...localInfo, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sigla (ShortName)</label>
                                        <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-base uppercase focus:bg-white focus:border-indigo-500 outline-none shadow-inner" value={localInfo.shortName} onChange={e => setLocalInfo({ ...localInfo, shortName: e.target.value })} />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ</label>
                                        <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-base focus:bg-white focus:border-indigo-500 outline-none shadow-inner" value={localInfo.cnpj} onChange={e => setLocalInfo({ ...localInfo, cnpj: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row items-center gap-16 p-12 bg-slate-50 rounded-[3rem] border border-slate-100 shadow-inner">
                                <div className="w-40 h-40 rounded-[3rem] bg-white border-8 border-white shadow-2xl flex items-center justify-center p-4 relative group overflow-hidden shrink-0">
                                    {localInfo.logoUrl ? <img src={localInfo.logoUrl} className="max-w-full max-h-full object-contain" alt="Logo" /> : <ImageIcon size={48} className="text-slate-200" />}
                                    <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-indigo-600/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm"><Upload size={32} /></button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                </div>
                                <div className="flex-1 space-y-8">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Esquema de Cores</label>
                                    <input type="color" className="w-20 h-20 rounded-[1.5rem] border-4 border-white p-0 cursor-pointer shadow-2xl" value={localInfo.primaryColor} onChange={e => setLocalInfo({ ...localInfo, primaryColor: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <button onClick={handleSaveInfo} disabled={isSaving} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-5 active:scale-95 group">
                            {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />} Commitar Alterações
                        </button>
                    </div>
                )}

                {activeTab === 'TEMPLATES' && (
                    <div className="space-y-10 animate-fade-in pb-12 max-w-7xl mx-auto">
                        <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-10 relative overflow-hidden">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-8">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4"><Variable size={24} className="text-indigo-600" style={{ color: primaryColor }}/> Templates de Mensagem</h3>
                                <button onClick={() => setEditingTpl({ name: '', event_trigger: '', content: '', variables_available: [], is_active: 1 })} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3"><Plus size={16}/> Novo Template</button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {templates.map(tpl => (
                                    <div key={tpl.id} className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:shadow-xl transition-all group flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="p-4 bg-white rounded-2xl shadow-sm text-indigo-600" style={{ color: primaryColor }}><MessageCircle size={24}/></div>
                                                <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${tpl.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-200 text-slate-400'}`}>
                                                    {tpl.is_active ? 'Ativo' : 'Pausado'}
                                                </div>
                                            </div>
                                            <h4 className="font-black text-slate-800 uppercase text-sm tracking-tight">{tpl.name}</h4>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 tracking-widest">Gatilho: {tpl.event_trigger}</p>
                                            <p className="text-xs text-slate-500 mt-4 line-clamp-3 uppercase leading-relaxed font-medium italic">{tpl.content}</p>
                                        </div>
                                        <div className="mt-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => setEditingTpl(tpl)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl font-black text-[9px] uppercase transition-all flex items-center justify-center gap-2"><Edit3 size={14}/> Editar</button>
                                            <button onClick={() => communicationService.deleteTemplate(tpl.id).then(loadTemplates)} className="p-3 bg-white border border-slate-200 text-slate-300 hover:text-rose-600 rounded-xl transition-all"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                                {templates.length === 0 && !isLoadingData && (
                                    <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest italic">Nenhum template protocolado.</div>
                                )}
                            </div>
                        </div>

                        {editingTpl && (
                            <div className="sie-editor-overlay">
                                <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                                    <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                                        <div className="flex items-center gap-5">
                                            <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl" style={{ backgroundColor: primaryColor }}><Variable size={22}/></div>
                                            <h4 className="font-black text-xl tracking-tight uppercase">Configurar Fluxo</h4>
                                        </div>
                                        <button onClick={() => setEditingTpl(null)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                                    </div>
                                    <div className="p-10 space-y-8 bg-[#fdfdfe]">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Descritivo</label>
                                                <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm uppercase outline-none focus:bg-white focus:border-indigo-500 shadow-inner" value={editingTpl.name} onChange={e => setEditingTpl({...editingTpl, name: e.target.value})} placeholder="Ex: Boas-vindas" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gatilho SRE (Unique)</label>
                                                <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm uppercase outline-none focus:bg-white focus:border-indigo-500 shadow-inner" value={editingTpl.event_trigger} onChange={e => setEditingTpl({...editingTpl, event_trigger: e.target.value.toUpperCase()})} placeholder="Ex: ONBOARDING" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conteúdo do Template</label>
                                                <div className="flex gap-2">
                                                    {['nome', 'sigla', 'unidade', 'valor', 'vencimento'].map(v => (
                                                        <button key={v} onClick={() => setEditingTpl({...editingTpl, content: editingTpl.content + `{${v}}`})} className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all">+{v}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <textarea rows={6} className="w-full font-medium bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-base focus:bg-white focus:border-indigo-500 transition-all outline-none uppercase leading-relaxed shadow-inner" value={editingTpl.content} onChange={e => setEditingTpl({...editingTpl, content: e.target.value})} placeholder="Olá {nome}, seu acesso..." />
                                        </div>
                                        <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                            <button onClick={() => setEditingTpl({...editingTpl, is_active: !editingTpl.is_active})} className={`w-14 h-7 rounded-full flex items-center px-1 transition-colors ${editingTpl.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-xl transform transition-transform ${editingTpl.is_active ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                            </button>
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Estado Ativo do Fluxo</span>
                                        </div>
                                        <button onClick={handleSaveTemplate} disabled={isSaving} className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 active:scale-95">
                                            {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} Commitar Template
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'INTERFACE' && (
                    <div className="space-y-10 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-10 relative overflow-hidden">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4 border-b border-slate-100 pb-8"><Layout size={24} className="text-indigo-600" style={{ color: primaryColor }}/> Manifest de Interface</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                                {localInfo.resident_ui_settings?.map(mod => (
                                    <div key={mod.id} className={`p-8 rounded-[2.5rem] border transition-all flex items-center justify-between group ${mod.enabled ? 'bg-white border-slate-200 shadow-lg' : 'bg-slate-50 border-dashed border-slate-200 opacity-50'}`}>
                                        <div className="flex items-center gap-6">
                                            <div className={`p-5 rounded-2xl ${mod.enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'}`} style={mod.enabled ? { color: primaryColor, backgroundColor: primaryColor + '10' } : {}}><Layout size={24} /></div>
                                            <div>
                                                <h4 className="font-black text-slate-800 uppercase text-sm tracking-tight">{mod.label}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 italic">{mod.detail}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => {
                                            const updated = localInfo.resident_ui_settings?.map(m => m.id === mod.id ? {...m, enabled: !m.enabled} : m);
                                            setLocalInfo({...localInfo, resident_ui_settings: updated});
                                        }} className={`w-14 h-7 rounded-full flex items-center px-1 transition-colors ${mod.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <div className={`w-5 h-5 bg-white rounded-full shadow-xl transform transition-transform ${mod.enabled ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={handleSaveInfo} disabled={isSaving} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-widest shadow-2xl">
                           Salvar Configurações
                        </button>
                    </div>
                )}

                {activeTab === 'WHATSAPP' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-emerald-950 p-16 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12">
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4 px-6 py-2.5 bg-white/10 rounded-full w-fit border border-white/10 backdrop-blur-xl">
                                    <Sparkles size={20} className="text-emerald-400 animate-pulse"/>
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-200">JennyAI Bridge V8.0</span>
                                </div>
                                <h2 className="text-5xl font-black uppercase tracking-tightest leading-tight">Messenger Gateway</h2>
                            </div>
                        </div>
                        <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-12">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">API KEY (Bridge)</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-base focus:bg-white focus:border-emerald-500 outline-none shadow-inner" type="password" value={waConfig.api_key} onChange={e => setWaConfig({...waConfig, api_key: e.target.value})} placeholder="••••••••••••••••••••••••" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sender Instance</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-base focus:bg-white focus:border-emerald-500 outline-none shadow-inner" value={waConfig.sender} onChange={e => setWaConfig({...waConfig, sender: e.target.value})} placeholder="Ex: SIE_BRIDGE" />
                                </div>
                             </div>
                        </div>
                        <button onClick={handleSaveInfo} disabled={isSaving} className="w-full py-8 bg-emerald-600 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-5 active:scale-95">
                            {isSaving ? <Loader2 className="animate-spin" size={24} /> : <MessageCircle size={24} />} Commitar Messenger Protocol
                        </button>
                    </div>
                )}

                {activeTab === 'PERMISSIONS' && (
                    <div className="space-y-10 animate-fade-in pb-12 max-w-7xl mx-auto">
                        <div className="bg-white rounded-[4.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                            <div className="p-12 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-8 shrink-0">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4"><Shield size={26} className="text-indigo-600" style={{ color: primaryColor }}/> Matriz RBAC de Governança</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">Sincronia MySQL Ativa</p>
                                </div>
                                <button onClick={handleAddRole} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3"><Plus size={16}/> Novo Cargo</button>
                            </div>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                                        <tr>
                                            <th className="p-10 bg-slate-50/80 sticky left-0 z-20 backdrop-blur-md">Permissão / Recurso</th>
                                            {roles.map(role => <th key={role.id} className="p-10 text-center">{role.label}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {SYSTEM_PERMISSIONS.map(perm => (
                                            <tr key={perm.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="p-10 bg-white group-hover:bg-slate-50/50 sticky left-0 z-10 transition-colors border-r">
                                                    <div className="flex flex-col">
                                                        <p className="text-sm font-black text-slate-700 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{perm.label}</p>
                                                        <code className="text-[9px] text-slate-300 uppercase mt-2 font-mono">{perm.id}</code>
                                                    </div>
                                                </td>
                                                {roles.map(role => {
                                                    const isGranted = permissions.some(p => p.role === role.id && (p.permission_id === perm.id || p.permission_id === '*'));
                                                    const isLocked = role.id === 'ADMIN';
                                                    return (
                                                        <td key={`${role.id}-${perm.id}`} className="p-10 text-center">
                                                            <button 
                                                                disabled={isLocked}
                                                                onClick={() => handleTogglePermission(role.id, perm.id, isGranted)}
                                                                className={`w-12 h-12 rounded-[1.25rem] mx-auto flex items-center justify-center transition-all border-2 ${isGranted ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl scale-110' : 'bg-white border-slate-100 text-slate-200 hover:border-slate-300 hover:text-slate-400'}`}
                                                                style={isGranted ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                                                            >
                                                                {isGranted ? <CheckCircle2 size={22}/> : <X size={18}/>}
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
        </div>
    );
};

export default Settings;
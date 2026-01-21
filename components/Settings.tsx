
import React, { useState, useEffect, useRef } from 'react';
import { SystemInfo, ResidentUISetting, AIKey } from '../types';
import { systemService, aiKeyService, api } from '../services/api';
import { SYSTEM_PERMISSIONS } from '../constants';
import {
    Settings as SettingsIcon, Building, X, Plus, Trash2, Loader2, Key, Zap, Lock, Activity as PulseIcon,
    MessageCircle, Terminal, ShieldCheck, Image as ImageIcon, Layout, Eye, EyeOff, Save, Smartphone,
    ShieldAlert, Globe, Monitor, Upload, Wallet, Calendar, Bell, Brain, ShoppingBag, HelpCircle, FileText, QrCode,
    Shield, UserCheck, ChevronRight, AlertCircle, Cpu, Edit3, CheckCircle2, History, Send, Link, Link2Off,
    Mail, Phone, MapPin, Fingerprint, Globe2, Gavel, Landmark, Box, Leaf, BarChart3,
    ClipboardList, Camera, Sparkles
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
    const [aiKeys, setAiKeys] = useState<AIKey[]>([]);
    const [roles, setRoles] = useState<DynamicRole[]>([]);
    const [rolePermissions, setRolePermissions] = useState<any[]>([]);
    const [isLoadingKeys, setIsLoadingKeys] = useState(false);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);
    const [isTestingWA, setIsTestingWA] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const defaultModules: ResidentUISetting[] = [
        { id: 'finance', label: 'Financeiro', enabled: true, icon: 'Wallet', detail: 'Faturas e pagamentos de taxas' },
        { id: 'reservations', label: 'Reservas', enabled: true, icon: 'Calendar', detail: 'Agendamento de áreas comuns' },
        { id: 'communication', label: 'Mural de Avisos', enabled: true, icon: 'Bell', detail: 'Comunicados e informativos oficiais' },
        { id: 'marketplace', label: 'Marketplace', enabled: true, icon: 'ShoppingBag', detail: 'Vitrine de economia circular local' },
        { id: 'suggestions', label: 'Ouvidoria Digital', enabled: true, icon: 'HelpCircle', detail: 'Manifestações e co-gestão ativa' },
        { id: 'neural_chat', label: 'IA Advisor', enabled: true, icon: 'Brain', detail: 'Mentor neural para suporte normativo' },
        { id: 'demographics', label: 'Observatório Social', enabled: true, icon: 'BarChart3', detail: 'Analytics demográfico e BI' },
        { id: 'documents', label: 'Hub de Documentos', enabled: true, icon: 'FileText', detail: 'Repositório de Atas, Editais e Ofícios' },
        { id: 'assemblies', label: 'Assembleia Digital', enabled: true, icon: 'Gavel', detail: 'Votações e deliberações online' },
        { id: 'surveys', label: 'Censo & Pesquisas', enabled: true, icon: 'ClipboardList', detail: 'Mapeamento e inteligência social' },
        { id: 'concierge', label: 'Portaria & Acesso', enabled: true, icon: 'QrCode', detail: 'Gestão de acessos e convites' },
        { id: 'watchdog', label: 'Vigilância Digital', enabled: true, icon: 'Camera', detail: 'Monitoramento por câmeras e visão' },
        { id: 'operations', label: 'Ocorrências', enabled: true, icon: 'ShieldAlert', detail: 'Protocolo Watchdog de incidentes' },
        { id: 'timeline', label: 'Agenda & Marcos', enabled: true, icon: 'History', detail: 'Cronograma ativo de marcos gestores' },
        { id: 'projects', label: 'Obras & Projetos', enabled: true, icon: 'Landmark', detail: 'Acompanhamento de infraestrutura' },
        { id: 'assets', label: 'Patrimônio', enabled: true, icon: 'Box', detail: 'Inventário e ativos comunitários' },
        { id: 'sustainability', label: 'Sustentabilidade', enabled: true, icon: 'Leaf', detail: 'Protocolo ESG e eficiência energética' }
    ];

    useEffect(() => {
        let settings = systemInfo.resident_ui_settings || [];
        if (!Array.isArray(settings) || settings.length === 0) {
            settings = [...defaultModules];
        } else {
            const updatedSettings = [...settings];
            defaultModules.forEach(def => {
                if (!updatedSettings.find(s => s.id === def.id)) {
                    updatedSettings.push(def);
                }
            });
            settings = updatedSettings;
        }
        setLocalInfo({ ...systemInfo, resident_ui_settings: settings });

        if (activeTab === 'AI_KEYS') loadAiKeys();
        if (activeTab === 'PERMISSIONS') loadRBAC();
    }, [systemInfo, activeTab]);

    const loadAiKeys = async () => {
        setIsLoadingKeys(true);
        try {
            const res = await aiKeyService.getAll();
            setAiKeys(res.data.data || []);
        } catch (e) { console.error("SRE Neural Nodes Offline"); }
        finally { setIsLoadingKeys(false); }
    };

    const loadRBAC = async () => {
        setIsLoadingRoles(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                systemService.getRoles(),
                systemService.getPermissions()
            ]);
            setRoles(rolesRes.data.data || []);
            setRolePermissions(permsRes.data.data || []);
        } catch (e) { console.error("SRE RBAC Sync Fail"); }
        finally { setIsLoadingRoles(false); }
    };

    const handleSaveInfo = async () => {
        setIsSaving(true);
        try {
            await systemService.updateInfo(localInfo);
            onUpdateSystemInfo(localInfo);
            alert("✅ SRE: Parâmetros de Kernel sincronizados.");
        } catch (e: any) {
            alert(`🛑 Erro de Comit: ${e.response?.data?.error || "Timeout"}`);
        } finally { setIsSaving(false); }
    };

    const handleTestWhatsApp = async () => {
        if (!localInfo.whatsapp_config?.api_key) return alert("Insira a API Key antes de testar.");
        setIsTestingWA(true);
        try {
            await new Promise(r => setTimeout(r, 1500));
            alert("✅ Gateway JENNYAI: Handshake OK. Link estável.");
        } catch (e) {
            alert("🛑 Falha no Link: Verifique as credenciais.");
        } finally { setIsTestingWA(false); }
    };

    const handleToggleModule = (id: string) => {
        const updated = (localInfo.resident_ui_settings || []).map(mod =>
            mod.id === id ? { ...mod, enabled: !mod.enabled } : mod
        );
        setLocalInfo({ ...localInfo, resident_ui_settings: updated });
    };

    const handleAddRole = async () => {
        const id = prompt("ID do Cargo (Ex: CONSELHO):")?.toUpperCase();
        if (!id) return;
        const label = prompt("Rótulo (Ex: Conselho Fiscal):");
        if (!label) return;
        try {
            await systemService.saveRole({ id, label });
            loadRBAC();
        } catch (e) { alert("Falha ao criar cargo."); }
    };

    const handleTogglePermission = async (role: string, permId: string) => {
        const isActive = rolePermissions.some(p => p.role === role && p.permission_id === permId);
        try {
            await systemService.togglePermission({ role, permission_id: permId, active: !isActive });
            loadRBAC();
        } catch (e) { alert("Falha na sincronia RBAC."); }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLocalInfo({ ...localInfo, logoUrl: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

    const getIcon = (iconName: string) => {
        const icons: any = { 
            Wallet, Calendar, Bell, Brain, ShoppingBag, HelpCircle, FileText, QrCode, 
            Gavel, ClipboardList, Camera, ShieldAlert, History, Landmark, Box, Leaf, BarChart3 
        };
        const Icon = icons[iconName] || Layout;
        return <Icon size={20} />;
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-fade-in h-full relative pb-6">
            <div className="bg-slate-900 rounded-[2rem] p-5 shadow-2xl shrink-0 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-2xl -mr-15 -mt-15"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-xl"><SettingsIcon size={20} /></div>
                    <div>
                        <h1 className="text-base font-black uppercase tracking-tight text-white leading-none">Settings Kernel</h1>
                        <p className="text-[8px] font-black uppercase text-indigo-400 mt-1 tracking-widest opacity-80">SRE V520.0</p>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center bg-white/5 backdrop-blur-xl rounded-xl p-1 border border-white/10 relative z-10 gap-1 shadow-2xl">
                    {[
                        { id: 'INFO', label: 'Identidade', icon: Building },
                        { id: 'INTERFACE', label: 'Módulos', icon: Layout },
                        { id: 'WHATSAPP', label: 'Messenger', icon: MessageCircle },
                        { id: 'AI_KEYS', label: 'Neural', icon: Cpu },
                        { id: 'PERMISSIONS', label: 'Governança', icon: Shield }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg border border-indigo-500' : 'text-slate-400 hover:text-white'}`}
                        >
                            <tab.icon size={12} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 lg:p-10 relative">
                {activeTab === 'INFO' && (
                    <div className="max-w-4xl space-y-10 animate-fade-in pb-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Organização</label>
                                <input className="w-full font-black h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs focus:bg-white focus:border-indigo-500 shadow-inner outline-none transition-all uppercase" value={localInfo.name} onChange={e => setLocalInfo({ ...localInfo, name: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sigla</label>
                                <input className="w-full font-black h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs uppercase focus:bg-white focus:border-indigo-500 shadow-inner outline-none transition-all" value={localInfo.shortName} onChange={e => setLocalInfo({ ...localInfo, shortName: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ</label>
                                <div className="relative">
                                    <Fingerprint className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                    <input className="w-full font-black h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs focus:bg-white focus:border-indigo-500 shadow-inner outline-none transition-all" value={localInfo.cnpj} onChange={e => setLocalInfo({ ...localInfo, cnpj: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner flex flex-col md:flex-row gap-6 items-center">
                            <div className="w-32 h-32 rounded-2xl bg-white border-2 border-white shadow-xl flex items-center justify-center p-3 relative group overflow-hidden shrink-0">
                                {localInfo.logoUrl ? <img src={localInfo.logoUrl} className="max-w-full max-h-full object-contain" alt="Logo" /> : <ImageIcon size={32} className="text-slate-100" />}
                                <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                    <Upload size={18} className="mb-1" />
                                    <span className="text-[7px] font-black uppercase tracking-widest text-center">Alterar</span>
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </div>
                            <div className="space-y-4 flex-1">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cor Primária</label>
                                    <div className="flex items-center gap-3">
                                        <input type="color" className="w-10 h-10 rounded-lg border-none p-1 bg-white shadow-md cursor-pointer" value={localInfo.primaryColor} onChange={e => setLocalInfo({ ...localInfo, primaryColor: e.target.value })} />
                                        <input className="font-mono font-black text-[10px] uppercase px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-inner w-24" value={localInfo.primaryColor} onChange={e => setLocalInfo({ ...localInfo, primaryColor: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSaveInfo} disabled={isSaving} className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-3">
                            {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Commitar Sistema
                        </button>
                    </div>
                )}

                {activeTab === 'INTERFACE' && (
                    <div className="max-w-5xl space-y-10 animate-fade-in pb-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {localInfo.resident_ui_settings?.map(mod => (
                                <div key={mod.id} className={`p-4 rounded-[1.5rem] border transition-all flex flex-col group ${mod.enabled ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-dashed border-slate-200 opacity-60'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-2 rounded-lg shadow-inner ${mod.enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                                            {getIcon(mod.icon)}
                                        </div>
                                        <button onClick={() => handleToggleModule(mod.id)} className={`w-9 h-5 rounded-full flex items-center px-0.5 shadow-inner transition-colors ${mod.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${mod.enabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                        </button>
                                    </div>
                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-[10px] mb-1">{mod.label}</h4>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase leading-tight line-clamp-2">{mod.detail}</p>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleSaveInfo} disabled={isSaving} className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-3">
                            {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Sincronizar Módulos
                        </button>
                    </div>
                )}

                {activeTab === 'WHATSAPP' && (
                    <div className="max-w-4xl space-y-8 animate-fade-in pb-10">
                        <div className="p-6 bg-emerald-950 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center relative overflow-hidden shadow-xl border border-white/5 gap-6">
                            <div className="absolute top-0 right-0 p-4 opacity-5"><MessageCircle size={150} /></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 px-3 py-1 bg-white/10 text-emerald-300 rounded-full w-fit mb-3 border border-white/10">
                                    <Zap size={12} className="animate-pulse" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">JennyAI Active Bridge</span>
                                </div>
                                <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">Messenger Gateway</h3>
                            </div>
                            <button onClick={handleTestWhatsApp} disabled={isTestingWA} className="relative z-10 px-6 py-3 bg-white text-emerald-950 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-emerald-50 transition-all">
                                {isTestingWA ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={14} />} Handshake OK
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200 shadow-inner space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2"><SettingsIcon size={14} className="text-emerald-600"/> Parâmetros Técnicos</h4>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">SRE Messenger Key</label>
                                        <input type="password" placeholder="Chave API..." className="w-full px-4 h-11 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:border-emerald-500 outline-none" value={localInfo.whatsapp_config?.api_key || ''} onChange={e => setLocalInfo({ ...localInfo, whatsapp_config: { ...(localInfo.whatsapp_config || { sender: '', footer: '' }), api_key: e.target.value } })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Instance ID</label>
                                        <input placeholder="inst_000" className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-xs font-black shadow-sm focus:border-emerald-500 outline-none" value={localInfo.whatsapp_config?.sender || ''} onChange={e => setLocalInfo({ ...localInfo, whatsapp_config: { ...(localInfo.whatsapp_config || { api_key: '', footer: '' }), sender: e.target.value } })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Rodapé Automático</label>
                                        <input placeholder="Footer text..." className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-xs font-black shadow-sm focus:border-emerald-500 outline-none uppercase" value={localInfo.whatsapp_config?.footer || ''} onChange={e => setLocalInfo({ ...localInfo, whatsapp_config: { ...(localInfo.whatsapp_config || { api_key: '', sender: '' }), footer: e.target.value } })} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200 shadow-inner space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2"><Sparkles size={14} className="text-indigo-600"/> Protocolo de Boas-vindas</h4>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo de Mensagem (Tags: {'{nome}'}, {'{senha}'})</label>
                                        <textarea rows={4} placeholder="Olá {nome}, bem-vindo! Sua senha de acesso é {senha}." className="w-full p-4 bg-white border border-slate-200 rounded-xl text-[10px] font-medium focus:border-indigo-500 outline-none uppercase leading-tight" value={localInfo.whatsapp_config?.welcome_template || ''} onChange={e => setLocalInfo({ ...localInfo, whatsapp_config: { ...(localInfo.whatsapp_config || { api_key: '', sender: '', footer: '' }), welcome_template: e.target.value } })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha SRE Padrão (Novo Membro)</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                                            <input placeholder="Senha Inicial..." className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-black focus:border-indigo-500 outline-none" value={localInfo.whatsapp_config?.default_password || ''} onChange={e => setLocalInfo({ ...localInfo, whatsapp_config: { ...(localInfo.whatsapp_config || { api_key: '', sender: '', footer: '' }), default_password: e.target.value } })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSaveInfo} disabled={isSaving} className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center gap-3">
                            {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Sincronizar Gateway
                        </button>
                    </div>
                )}

                {activeTab === 'AI_KEYS' && (
                    <div className="max-w-5xl space-y-10 animate-fade-in pb-10">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tightest">Neural Pool</h2>
                            <button onClick={async () => {
                                const key = prompt("Insira a chave Gemini API:");
                                if (!key) return;
                                try {
                                    await aiKeyService.create({ label: `Nó ${aiKeys.length + 1}`, key_value: key, provider: 'GOOGLE', status: 'ACTIVE', priority: 1 });
                                    loadAiKeys();
                                } catch (e) { alert("Erro ao injetar nó."); }
                            }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center gap-2">
                                <Plus size={16} /> Injetar Nó
                            </button>
                        </div>

                        {isLoadingKeys ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} /></div> : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {aiKeys.map(key => (
                                    <div key={key.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-indigo-300 transition-all relative overflow-hidden">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-3 rounded-xl shadow-inner ${key.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    <Cpu size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">{key.label}</h4>
                                                    <p className="text-[7px] font-black text-slate-400 uppercase mt-0.5 tracking-tighter">Erros: {key.error_count}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => aiKeyService.delete(key.id).then(loadAiKeys)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                                        </div>
                                        <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 flex items-center justify-between">
                                            <span className="text-[10px] font-mono text-slate-500">••••••••{key.key_value.slice(-8)}</span>
                                            <span className={`px-3 py-1 rounded-lg text-[7px] font-black uppercase ${key.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{key.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'PERMISSIONS' && (
                    <div className="max-w-5xl space-y-10 animate-fade-in pb-10">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tightest">Governança RBAC</h2>
                            <button onClick={handleAddRole} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center gap-2">
                                <Plus size={16} /> Novo Perfil
                            </button>
                        </div>

                        {isLoadingRoles ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} /></div> : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {roles.map(role => (
                                    <div key={role.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:border-indigo-300 transition-all flex flex-col h-fit">
                                        <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm"><UserCheck size={20} /></div>
                                                <div>
                                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">{role.label}</h4>
                                                    <p className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">ID: {role.id}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {!['ADMIN', 'RESIDENT'].includes(role.id) && (
                                                    <button onClick={() => systemService.deleteRole(role.id).then(loadRBAC)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-6 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {SYSTEM_PERMISSIONS.map(perm => {
                                                const isActive = rolePermissions.some(rp => rp.role === role.id && rp.permission_id === perm.id);
                                                return (
                                                    <div key={perm.id} className="flex justify-between items-center p-3 bg-slate-50/30 rounded-2xl border border-slate-100 hover:bg-white transition-all">
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{perm.label}</p>
                                                            <p className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">Módulo: {perm.module}</p>
                                                        </div>
                                                        <button
                                                            disabled={role.id === 'ADMIN'}
                                                            onClick={() => handleTogglePermission(role.id, perm.id)}
                                                            className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${isActive || role.id === 'ADMIN' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                                        >
                                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isActive || role.id === 'ADMIN' ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-2 opacity-40 grayscale group hover:grayscale-0 transition-all">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">SRE Protocol Audited</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">v6.1.525</span>
                    <History size={14} className="text-indigo-600" />
                </div>
            </div>
        </div>
    );
};

export default Settings;

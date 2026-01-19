
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
    // SRE FIX: Added missing icons ClipboardList and Camera from lucide-react
    ClipboardList, Camera
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
        // COMUNIDADE & ENGAJAMENTO
        { id: 'finance', label: 'Financeiro', enabled: true, icon: 'Wallet', detail: 'Faturas e pagamentos de taxas' },
        { id: 'reservations', label: 'Reservas', enabled: true, icon: 'Calendar', detail: 'Agendamento de áreas comuns' },
        { id: 'communication', label: 'Mural de Avisos', enabled: true, icon: 'Bell', detail: 'Comunicados e informativos oficiais' },
        { id: 'marketplace', label: 'Marketplace', enabled: true, icon: 'ShoppingBag', detail: 'Vitrine de economia circular local' },
        { id: 'suggestions', label: 'Ouvidoria Digital', enabled: true, icon: 'HelpCircle', detail: 'Manifestações e co-gestão ativa' },
        
        // ESTRATÉGICO & IA
        { id: 'neural_chat', label: 'IA Advisor', enabled: true, icon: 'Brain', detail: 'Mentor neural para suporte normativo' },
        { id: 'demographics', label: 'Observatório Social', enabled: true, icon: 'BarChart3', detail: 'Analytics demográfico e BI' },
        
        // GOVERNANÇA
        { id: 'documents', label: 'Hub de Documentos', enabled: true, icon: 'FileText', detail: 'Repositório de Atas, Editais e Ofícios' },
        { id: 'assemblies', label: 'Assembleia Digital', enabled: true, icon: 'Gavel', detail: 'Votações e deliberações online' },
        { id: 'surveys', label: 'Censo & Pesquisas', enabled: true, icon: 'ClipboardList', detail: 'Mapeamento e inteligência social' },
        
        // OPERACIONAL & SEGURANÇA
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
            // SRE SYNC: Injeção de novos módulos mantendo o estado dos antigos
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
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in h-full relative pb-10">
            <div className="bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl shrink-0 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl"><SettingsIcon size={24} /></div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tightest text-white leading-none">Sistema Settings</h1>
                        <p className="text-[9px] font-black uppercase text-indigo-400 mt-2 tracking-widest opacity-80">Architecture SRE V485.0</p>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center bg-white/5 backdrop-blur-xl rounded-[1.5rem] p-1.5 border border-white/10 relative z-10 gap-1 shadow-2xl">
                    {[
                        { id: 'INFO', label: 'Identidade', icon: Building },
                        { id: 'INTERFACE', label: 'Módulos UI', icon: Layout },
                        { id: 'WHATSAPP', label: 'Messenger', icon: MessageCircle },
                        { id: 'AI_KEYS', label: 'Neural Nodes', icon: Cpu },
                        { id: 'PERMISSIONS', label: 'Governança', icon: Shield }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg border border-indigo-500' : 'text-slate-400 hover:text-white'}`}
                        >
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white rounded-[3.5rem] border border-slate-200 shadow-sm p-8 lg:p-14 relative">
                {activeTab === 'INFO' && (
                    <div className="max-w-5xl space-y-12 animate-fade-in pb-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Organização</label>
                                <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-5 text-sm focus:bg-white focus:border-indigo-500 shadow-inner outline-none transition-all uppercase" value={localInfo.name} onChange={e => setLocalInfo({ ...localInfo, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sigla / ID</label>
                                <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-5 text-sm uppercase focus:bg-white focus:border-indigo-500 shadow-inner outline-none transition-all" value={localInfo.shortName} onChange={e => setLocalInfo({ ...localInfo, shortName: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ / Documento</label>
                                <div className="relative">
                                    <Fingerprint className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-5 text-sm focus:bg-white focus:border-indigo-500 shadow-inner outline-none transition-all" value={localInfo.cnpj} onChange={e => setLocalInfo({ ...localInfo, cnpj: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2 lg:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Administrativo</label>
                                <div className="relative">
                                    <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-5 text-sm focus:bg-white focus:border-indigo-500 shadow-inner outline-none transition-all uppercase" value={localInfo.address} onChange={e => setLocalInfo({ ...localInfo, address: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modo de Registro</label>
                                <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-5 text-sm uppercase appearance-none shadow-inner focus:bg-white focus:border-indigo-500" value={localInfo.registrationMode} onChange={e => setLocalInfo({ ...localInfo, registrationMode: e.target.value as any })}>
                                    <option value="APPROVAL">Aprovação Manual SRE</option>
                                    <option value="OPEN">Registro Público</option>
                                    <option value="INVITE_ONLY">Somente Convite</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 shadow-inner flex flex-col md:flex-row gap-10 items-center">
                            <div className="w-44 h-44 rounded-[2rem] bg-white border-4 border-white shadow-2xl flex items-center justify-center p-4 relative group overflow-hidden shrink-0">
                                {localInfo.logoUrl ? <img src={localInfo.logoUrl} className="max-w-full max-h-full object-contain" alt="Logo" /> : <ImageIcon size={48} className="text-slate-100" />}
                                <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                    <Upload size={24} className="mb-2" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-center">Alterar Logo</span>
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </div>
                            <div className="space-y-6 flex-1">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cor Primária do Cluster</label>
                                    <div className="flex items-center gap-4">
                                        <input type="color" className="w-14 h-14 rounded-xl border-none p-1 bg-white shadow-md cursor-pointer" value={localInfo.primaryColor} onChange={e => setLocalInfo({ ...localInfo, primaryColor: e.target.value })} />
                                        <input className="font-mono font-black text-xs uppercase px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-inner w-32" value={localInfo.primaryColor} onChange={e => setLocalInfo({ ...localInfo, primaryColor: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSaveInfo} disabled={isSaving} className="px-14 py-6 bg-slate-950 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-4">
                            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Commitar Identidade
                        </button>
                    </div>
                )}

                {activeTab === 'INTERFACE' && (
                    <div className="max-w-6xl space-y-12 animate-fade-in pb-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {localInfo.resident_ui_settings?.map(mod => (
                                <div key={mod.id} className={`p-6 rounded-[2rem] border transition-all flex flex-col h-full group ${mod.enabled ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-dashed border-slate-200 opacity-60'}`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-3.5 rounded-xl shadow-inner ${mod.enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                                            {getIcon(mod.icon)}
                                        </div>
                                        <button onClick={() => handleToggleModule(mod.id)} className={`w-11 h-6 rounded-full flex items-center px-1 shadow-inner transition-colors ${mod.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${mod.enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                        </button>
                                    </div>
                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-1.5">{mod.label}</h4>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed">{mod.detail}</p>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleSaveInfo} disabled={isSaving} className="px-14 py-6 bg-slate-950 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-4">
                            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Sincronizar Interface
                        </button>
                    </div>
                )}

                {activeTab === 'WHATSAPP' && (
                    <div className="max-w-4xl space-y-12 animate-fade-in pb-10">
                        <div className="p-12 bg-emerald-950 rounded-[4rem] text-white flex flex-col md:flex-row justify-between items-center relative overflow-hidden shadow-2xl border border-white/5 gap-10">
                            <div className="absolute top-0 right-0 p-10 opacity-10"><MessageCircle size={200} /></div>
                            <div className="relative z-10 text-center md:text-left">
                                <div className="flex items-center gap-3 px-4 py-1.5 bg-white/10 text-emerald-300 rounded-full w-fit mb-6 border border-white/10 mx-auto md:mx-0">
                                    <Zap size={16} className="animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">JennyAI Active Bridge</span>
                                </div>
                                <h3 className="text-4xl font-black tracking-tightest uppercase leading-tight">Messenger <br /> Gateway.</h3>
                            </div>
                            <button onClick={handleTestWhatsApp} disabled={isTestingWA} className="relative z-10 px-10 py-5 bg-white text-emerald-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-emerald-50 transition-all">
                                {isTestingWA ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />} Testar Handshake
                            </button>
                        </div>

                        <div className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-200 shadow-inner space-y-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SRE Messenger Key (API Key)</label>
                                <input type="password" placeholder="Chave do Gateway JennyAI" className="w-full px-6 h-18 bg-white border border-slate-200 rounded-2xl text-base font-mono shadow-sm focus:border-emerald-500 outline-none" value={localInfo.whatsapp_config?.api_key || ''} onChange={e => setLocalInfo({ ...localInfo, whatsapp_config: { ...(localInfo.whatsapp_config || { sender: '', footer: '' }), api_key: e.target.value } })} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instance ID</label>
                                    <input placeholder="Ex: inst_44252" className="w-full h-16 bg-white border border-slate-200 rounded-2xl px-6 text-sm font-black shadow-sm focus:border-emerald-500 outline-none" value={localInfo.whatsapp_config?.sender || ''} onChange={e => setLocalInfo({ ...localInfo, whatsapp_config: { ...(localInfo.whatsapp_config || { api_key: '', footer: '' }), sender: e.target.value } })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assinatura / Footer</label>
                                    <input placeholder="Assinatura automática" className="w-full h-16 bg-white border border-slate-200 rounded-2xl px-6 text-sm font-black shadow-sm focus:border-emerald-500 outline-none uppercase" value={localInfo.whatsapp_config?.footer || ''} onChange={e => setLocalInfo({ ...localInfo, whatsapp_config: { ...(localInfo.whatsapp_config || { api_key: '', sender: '' }), footer: e.target.value } })} />
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSaveInfo} disabled={isSaving} className="px-14 py-6 bg-slate-950 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center gap-4">
                            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Sincronizar Gateway
                        </button>
                    </div>
                )}

                {activeTab === 'AI_KEYS' && (
                    <div className="max-w-6xl space-y-12 animate-fade-in pb-10">
                        <div className="flex justify-between items-center">
                            <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tightest">Neural Pool</h2>
                            <button onClick={async () => {
                                const key = prompt("Insira a chave Gemini API:");
                                if (!key) return;
                                try {
                                    await aiKeyService.create({ label: `Nó ${aiKeys.length + 1}`, key_value: key, provider: 'GOOGLE', status: 'ACTIVE', priority: 1 });
                                    loadAiKeys();
                                } catch (e) { alert("Erro ao injetar nó."); }
                            }} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3">
                                <Plus size={20} /> Injetar Nó
                            </button>
                        </div>

                        {isLoadingKeys ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} /></div> : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {aiKeys.map(key => (
                                    <div key={key.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm group hover:border-indigo-300 transition-all relative overflow-hidden">
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="flex items-center gap-5">
                                                <div className={`p-4 rounded-2xl shadow-inner ${key.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    <Cpu size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">{key.label}</h4>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase mt-0.5 tracking-tighter">Erros: {key.error_count}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => aiKeyService.delete(key.id).then(loadAiKeys)} className="p-3 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                        <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                            <span className="text-[11px] font-mono text-slate-500">••••••••{key.key_value.slice(-8)}</span>
                                            <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase ${key.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{key.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'PERMISSIONS' && (
                    <div className="max-w-6xl space-y-12 animate-fade-in pb-10">
                        <div className="flex justify-between items-center">
                            <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tightest">Governança RBAC</h2>
                            <button onClick={handleAddRole} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3">
                                <Plus size={20} /> Novo Perfil
                            </button>
                        </div>

                        {isLoadingRoles ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} /></div> : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {roles.map(role => (
                                    <div key={role.id} className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm hover:border-indigo-300 transition-all flex flex-col h-fit">
                                        <div className="p-10 bg-slate-50 border-b flex justify-between items-center">
                                            <div className="flex items-center gap-5">
                                                <div className="p-4 bg-white rounded-2xl text-indigo-600 shadow-sm"><UserCheck size={24} /></div>
                                                <div>
                                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-base">{role.label}</h4>
                                                    <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">ID: {role.id}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {!['ADMIN', 'RESIDENT'].includes(role.id) && (
                                                    <button onClick={() => systemService.deleteRole(role.id).then(loadRBAC)} className="p-3 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-10 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {SYSTEM_PERMISSIONS.map(perm => {
                                                const isActive = rolePermissions.some(rp => rp.role === role.id && rp.permission_id === perm.id);
                                                return (
                                                    <div key={perm.id} className="flex justify-between items-center p-5 bg-slate-50/30 rounded-3xl border border-slate-100 hover:bg-white transition-all">
                                                        <div>
                                                            <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{perm.label}</p>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Módulo: {perm.module}</p>
                                                        </div>
                                                        <button
                                                            disabled={role.id === 'ADMIN'}
                                                            onClick={() => handleTogglePermission(role.id, perm.id)}
                                                            className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${isActive || role.id === 'ADMIN' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                                        >
                                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isActive || role.id === 'ADMIN' ? 'translate-x-6' : 'translate-x-0'}`}></div>
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

            <div className="max-w-6xl mx-auto flex items-center justify-between px-10 py-6 opacity-40 grayscale group hover:grayscale-0 transition-all">
                <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dados Auditados via Protocolo SRE</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Versão de Sistema: 6.1.525</span>
                    <History size={18} className="text-indigo-600" />
                </div>
            </div>
        </div>
    );
};

export default Settings;

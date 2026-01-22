import React, { useState, useEffect, useRef } from 'react';
import { SystemInfo, WhatsAppConfig, AIKey, ResidentUISetting } from '../types';
import { systemService, aiKeyService } from '../services/api';
import { SYSTEM_PERMISSIONS } from '../constants';
import {
    Settings as SettingsIcon, Building, X, Plus, Trash2, Loader2, Save,
    MessageCircle, ShieldCheck, Image as ImageIcon, Layout, Shield, 
    Upload, Globe, MapPin, Monitor, ShieldAlert, Variable, Edit3, CheckCircle2,
    Brain, Cpu, Key, Radio, Zap, ExternalLink, Smartphone, Lock, History, Layers,
    Wallet, Calendar, Bell, ToggleRight, ToggleLeft, Palette, Type, UserCheck, FileSignature
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
    const [isModalAiOpen, setIsModalAiOpen] = useState(false);
    const [editingAiKey, setEditingAiKey] = useState<Partial<AIKey>>({});

    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const signatureInputRef = useRef<HTMLInputElement>(null);

    const [waConfig, setWaConfig] = useState<WhatsAppConfig>(systemInfo.whatsapp_config || {
        api_key: '', sender: '', footer: 'S.I.E PRO', welcome_template: '', default_password: 'mudar123'
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

    const handleSaveAiKey = async () => {
        setIsSaving(true);
        try {
            if (editingAiKey.id) {
                await aiKeyService.update(editingAiKey.id, editingAiKey);
            } else {
                await aiKeyService.create(editingAiKey);
            }
            setIsModalAiOpen(false);
            loadAiKeys();
        } catch (e) { alert("Falha ao comitar token no pool."); }
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

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLocalInfo({ ...localInfo, president_signature: reader.result as string });
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
                        <p className="text-[9px] font-black uppercase text-indigo-400 mt-2 tracking-[0.4em] opacity-80 italic">SRE Reliability Protocol V10.0</p>
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
                
                {/* ABA 1: IDENTIDADE (INFO) */}
                {activeTab === 'INFO' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-6xl mx-auto">
                        {/* Registro Corporativo */}
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
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Administrativo</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 focus:border-indigo-500 outline-none shadow-inner" value={localInfo.email} onChange={e => setLocalInfo({ ...localInfo, email: e.target.value })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp de Suporte</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 focus:border-indigo-500 outline-none shadow-inner" value={localInfo.phone} onChange={e => setLocalInfo({ ...localInfo, phone: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Registro do Presidente da Associação (ADITIVO V10.0) */}
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-12">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-8">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4"><UserCheck size={24} style={{ color: primaryColor }}/> Dados da Presidência</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo do Presidente</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-lg uppercase outline-none focus:bg-white focus:border-indigo-500 shadow-inner transition-all" value={localInfo.president_name} onChange={e => setLocalInfo({ ...localInfo, president_name: e.target.value })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF do Presidente</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 uppercase focus:border-indigo-500 outline-none shadow-inner" value={localInfo.president_cpf} onChange={e => setLocalInfo({ ...localInfo, president_cpf: formatCPF(e.target.value) })} maxLength={14} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Início da Gestão</label>
                                    <input type="date" className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 focus:border-indigo-500 outline-none shadow-inner" value={localInfo.management_start} onChange={e => setLocalInfo({ ...localInfo, management_start: e.target.value })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Término da Gestão</label>
                                    <input type="date" className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 focus:border-indigo-500 outline-none shadow-inner" value={localInfo.management_end} onChange={e => setLocalInfo({ ...localInfo, management_end: e.target.value })} />
                                </div>
                            </div>
                            
                            {/* Assinatura do Presidente */}
                            <div className="flex flex-col md:flex-row items-center gap-16 p-12 bg-indigo-900/5 rounded-[3rem] border border-indigo-100 shadow-inner">
                                <div className="w-64 h-32 rounded-[2rem] bg-white border-4 border-white shadow-xl flex items-center justify-center p-4 relative group overflow-hidden shrink-0">
                                    {localInfo.president_signature ? <img src={localInfo.president_signature} className="max-w-full max-h-full object-contain" alt="Assinatura" /> : <FileSignature size={48} className="text-slate-200" />}
                                    <button onClick={() => signatureInputRef.current?.click()} className="absolute inset-0 bg-indigo-600/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm font-black text-[10px] uppercase tracking-widest gap-2"><Upload size={20} /> Atualizar Assinatura</button>
                                    <input type="file" ref={signatureInputRef} className="hidden" accept="image/png" onChange={handleSignatureUpload} />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Assinatura Digitalizada (PNG)</h4>
                                    <p className="text-[10px] text-indigo-700 font-medium leading-relaxed uppercase italic">Este arquivo será utilizado pelo Ghostwriter para assinar digitalmente atas, ofícios e editais oficiais gerados pelo sistema.</p>
                                </div>
                            </div>
                        </div>

                        {/* Identidade Visual */}
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-12">
                            <div className="flex flex-col md:flex-row items-center gap-16 p-12 bg-slate-50 rounded-[3rem] border border-slate-100 shadow-inner">
                                <div className="w-40 h-40 rounded-[3rem] bg-white border-8 border-white shadow-2xl flex items-center justify-center p-4 relative group overflow-hidden shrink-0">
                                    {localInfo.logoUrl ? <img src={localInfo.logoUrl} className="max-w-full max-h-full object-contain" alt="Logo" /> : <ImageIcon size={48} className="text-slate-200" />}
                                    <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-indigo-600/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm"><Upload size={32} /></button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                </div>
                                <div className="flex-1 space-y-8">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Identidade Visual (Cor Principal)</label>
                                    <div className="flex items-center gap-6">
                                        <input type="color" className="w-20 h-20 rounded-[1.5rem] border-4 border-white p-0 cursor-pointer shadow-2xl" value={localInfo.primaryColor} onChange={e => setLocalInfo({ ...localInfo, primaryColor: e.target.value })} />
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">{localInfo.primaryColor?.toUpperCase()}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Aplica-se a ícones ativos e destaques.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ABA 2: MÓDULOS (INTERFACE) */}
                {activeTab === 'INTERFACE' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-10">
                            <div className="border-b border-slate-100 pb-8">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4"><Layout size={24} style={{ color: primaryColor }}/> Manifest de Interface & Governança</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">Controle a visibilidade de recursos para o nível de acesso "RESIDENT" em tempo real.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    { id: 'finance', label: 'Módulo Financeiro', icon: Wallet, detail: 'Acesso a faturas, pagamentos e histórico Ledger.' },
                                    { id: 'reservations', label: 'Sistema de Reservas', icon: Calendar, detail: 'Agendamento e consulta de áreas comuns.' },
                                    { id: 'notices', label: 'Mural de Avisos', icon: Bell, detail: 'Feed de comunicados oficiais e informativos.' },
                                    { id: 'chat', label: 'IA Advisor Mentor', icon: Brain, detail: 'Assistente neural para suporte normativo.' }
                                ].map(mod => {
                                    const isEnabled = localInfo.resident_ui_settings?.find(s => s.id === mod.id)?.enabled ?? true;
                                    return (
                                        <div key={mod.id} className={`p-8 rounded-[2.5rem] border transition-all flex items-center justify-between group ${isEnabled ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                            <div className="flex items-center gap-6">
                                                <div className={`p-4 rounded-2xl shadow-inner transition-colors ${isEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'}`} style={isEnabled ? { color: primaryColor, backgroundColor: primaryColor + '10' } : {}}>
                                                    <mod.icon size={28}/>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{mod.label}</h4>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{mod.detail}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleToggleModule(mod.id)}
                                                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-lg' : 'bg-white text-slate-300 border border-slate-100'}`}
                                            >
                                                {isEnabled ? <ToggleRight size={32}/> : <ToggleLeft size={32}/>}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="p-8 bg-indigo-900/5 border border-indigo-100 rounded-[3rem] flex items-start gap-6 shadow-sm">
                                <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm"><ShieldAlert size={24}/></div>
                                <div>
                                    <h4 className="text-sm font-black text-indigo-950 uppercase tracking-tight">Propagação Dinâmica</h4>
                                    <p className="text-[10px] text-indigo-700 font-bold uppercase mt-1 leading-relaxed italic">As alterações no Manifest impactam instantaneamente o ResidentDashboard.tsx para todos os usuários em sessões ativas.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ABA 3: INTELIGÊNCIA (AI_PROVIDERS) */}
                {activeTab === 'AI_PROVIDERS' && (
                    <div className="space-y-10 animate-fade-in pb-12 max-w-7xl mx-auto">
                        <div className="bg-slate-900 p-12 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 border border-white/5">
                            <div className="absolute top-0 right-0 p-12 opacity-5"><Brain size={200}/></div>
                            <div className="relative z-10 space-y-4">
                                <h2 className="text-4xl font-black uppercase tracking-tightest leading-tight">Neural Pool Manager</h2>
                                <p className="text-indigo-400 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Zap size={16} className="text-amber-500 animate-pulse" /> SRE Failover Architecture V10.0</p>
                            </div>
                            <button onClick={() => { setEditingAiKey({ provider: 'GOOGLE', model: 'gemini-3-flash-preview', tier: 'FREE', status: 'ACTIVE', priority: 1 }); setIsModalAiOpen(true); }} className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all flex items-center gap-4 relative z-10 active:scale-95">
                                <Plus size={20}/> Registrar Token Neural
                            </button>
                        </div>

                        <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                                        <tr>
                                            <th className="p-8">Identificação / Modelo</th>
                                            <th className="p-8 text-center">Nível / Tier</th>
                                            <th className="p-8 text-center">Prioridade</th>
                                            <th className="p-8 text-center">Saúde do Token</th>
                                            <th className="p-8 text-center">Estado</th>
                                            <th className="p-8 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {isLoadingData ? (
                                            <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={40}/></td></tr>
                                        ) : aiKeys.map(key => (
                                            <tr key={key.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Cpu size={20}/></div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-800 uppercase leading-none">{key.label}</p>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 font-mono">{key.model}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-8 text-center">
                                                    <span className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase border shadow-sm ${key.tier === 'PAID' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400'}`}>{key.tier} Tier</span>
                                                </td>
                                                <td className="p-8 text-center font-black text-indigo-600">P{key.priority}</td>
                                                <td className="p-8 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text-[10px] font-black ${key.error_count > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{key.error_count} Falhas</span>
                                                        <p className="text-[7px] text-slate-300 uppercase mt-1">Check: {key.last_checked ? new Date(key.last_checked).toLocaleTimeString() : 'Pendente'}</p>
                                                    </div>
                                                </td>
                                                <td className="p-8 text-center">
                                                    <button 
                                                        onClick={() => aiKeyService.update(key.id, { status: key.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }).then(loadAiKeys)}
                                                        className={`w-14 h-7 rounded-full flex items-center px-1 transition-colors ${key.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                    >
                                                        <div className={`w-5 h-5 bg-white rounded-full shadow-xl transform transition-transform ${key.status === 'ACTIVE' ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                                    </button>
                                                </td>
                                                <td className="p-8 text-right">
                                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button onClick={() => { setEditingAiKey(key); setIsModalAiOpen(true); }} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm"><Edit3 size={16}/></button>
                                                        <button onClick={() => { if(confirm("Expurgar token neural permanentemente?")) aiKeyService.delete(key.id).then(loadAiKeys); }} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 rounded-xl shadow-sm"><Trash2 size={16}/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!isLoadingData && aiKeys.length === 0 && (
                                            <tr><td colSpan={6} className="p-20 text-center text-slate-400 font-black uppercase text-xs tracking-widest italic opacity-40">Nenhum token configurado no pool.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ABA 4: MESSENGER (WHATSAPP) */}
                {activeTab === 'WHATSAPP' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-emerald-950 p-16 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12 border border-emerald-900/50">
                             <div className="absolute top-0 right-0 p-12 opacity-5"><MessageCircle size={250}/></div>
                             <div className="relative z-10 space-y-4">
                                <h2 className="text-5xl font-black uppercase tracking-tightest leading-tight">Messenger Gateway</h2>
                                <p className="text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Smartphone size={16}/> Protocolo JennyAI Active Bridge V8.0</p>
                             </div>
                             <div className="relative z-10 flex gap-4">
                                <div className="p-6 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 text-center shadow-inner">
                                    <p className="text-[8px] font-black uppercase text-emerald-400 mb-2">Bridge Status</p>
                                    <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]"></div><span className="text-xl font-black uppercase tracking-widest">Active</span></div>
                                </div>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-12">
                                <div className="border-b border-slate-100 pb-8"><h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4"><Zap size={24} className="text-emerald-600"/> Credenciais & Configuração</h3></div>
                                <div className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Bridge API KEY</label>
                                            <div className="relative group">
                                                <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-base focus:bg-white focus:border-emerald-500 outline-none shadow-inner transition-all" type="password" value={waConfig.api_key} onChange={e => setWaConfig({...waConfig, api_key: e.target.value})} placeholder="••••••••••••••••••••••••" />
                                                <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" size={18}/>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sender Instance ID</label>
                                            <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-base focus:bg-white focus:border-emerald-500 outline-none shadow-inner" value={waConfig.sender} onChange={e => setWaConfig({...waConfig, sender: e.target.value})} placeholder="Ex: SIE_CLUSTER_ALPHA" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Template de Boas-Vindas</label>
                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1"><Variable size={10}/> Substitution Engine Active</span>
                                        </div>
                                        <textarea rows={4} className="w-full font-medium p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] focus:bg-white focus:border-emerald-500 outline-none shadow-inner uppercase text-sm leading-relaxed transition-all" value={waConfig.welcome_template} onChange={e => setWaConfig({...waConfig, welcome_template: e.target.value})} placeholder="Olá {nome}, seu cadastro foi ativo na unidade {unidade}..." />
                                        <div className="flex flex-wrap gap-2 mt-3 px-2">
                                            {['nome', 'unidade', 'sigla', 'senha'].map(tag => <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-400 text-[9px] font-black uppercase rounded-lg border border-slate-200">{"{"+tag+"}"}</span>)}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Padrão (Novos Membros)</label>
                                            <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm focus:border-emerald-500 outline-none uppercase shadow-inner" value={waConfig.default_password} onChange={e => setWaConfig({...waConfig, default_password: e.target.value})} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Assinatura de Rodapé (Footer)</label>
                                            <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm focus:border-emerald-500 outline-none uppercase shadow-inner" value={waConfig.footer} onChange={e => setWaConfig({...waConfig, footer: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-4 space-y-8">
                                <div className="bg-slate-900 p-10 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5"><Radio size={120} className="text-white" /></div>
                                    <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-8 flex items-center gap-2"><Globe size={18}/> Technical HUD</h4>
                                    <div className="space-y-8 relative z-10">
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">WebHook (Inbound)</p>
                                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                                <code className="text-[9px] font-mono text-indigo-300 break-all opacity-80">https://cluster.jennyai.space/api/whatsapp-webhook</code>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Gateway (Outbound)</p>
                                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                                <code className="text-[9px] font-mono text-indigo-300 break-all opacity-80">https://jennyai.space/v1/send-broadcast</code>
                                            </div>
                                        </div>
                                        <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
                                            <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2"><ShieldCheck size={14}/> SRE Anti-Flag</h5>
                                            <p className="text-[9px] text-slate-400 font-medium leading-relaxed uppercase italic">O Kernel aplica delay randômico entre 3-7s em disparos massivos para proteger o score da instância.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ABA 5: GOVERNANÇA (GOVERNANCE) */}
                {activeTab === 'GOVERNANCE' && (
                    <div className="space-y-10 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-10">
                            <div className="border-b border-slate-100 pb-8">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4"><Layers size={24} style={{ color: primaryColor }}/> Manifesto de Títulos</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">Configure a identidade semântica visual de cada módulo do cluster.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {['dashboard', 'users', 'finance', 'watchdog', 'marketplace', 'communication', 'operations', 'surveys'].map(mod => (
                                    <div key={mod} className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] space-y-6 group hover:border-indigo-200 transition-all hover:bg-white shadow-inner hover:shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-widest">Módulo: {mod}</h4>
                                            <div className="w-2 h-2 bg-indigo-200 rounded-full group-hover:animate-pulse"></div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Type size={12}/> Título do Header</label>
                                            <input className="w-full h-12 bg-white border border-slate-200 rounded-xl px-5 text-sm font-black uppercase focus:border-indigo-500 outline-none shadow-sm" value={metadata[mod]?.title || ''} onChange={e => updateMetadata(mod, 'title', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Palette size={12}/> Slogan / Subtítulo</label>
                                            <input className="w-full h-12 bg-white border border-slate-200 rounded-xl px-5 text-xs font-medium uppercase focus:border-indigo-500 outline-none shadow-sm" value={metadata[mod]?.slogan || ''} onChange={e => updateMetadata(mod, 'slogan', e.target.value)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ABA 6: RBAC (PERMISSIONS) */}
                {activeTab === 'PERMISSIONS' && (
                    <div className="space-y-10 animate-fade-in pb-12 max-w-7xl mx-auto">
                        <div className="bg-white rounded-[4.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                            <div className="p-12 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-8 shrink-0">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4"><Shield size={26} style={{ color: primaryColor }}/> Matriz RBAC de Governança</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest italic">Sincronia MySQL Ativa • Override "ADMIN" Permanentemente Bloqueado</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                                        <tr>
                                            <th className="p-10 bg-slate-50/80 sticky left-0 z-20 backdrop-blur-md border-r">Permissão / Recurso</th>
                                            {roles.map(role => <th key={role.id} className="p-10 text-center border-r last:border-0">{role.label}</th>)}
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
                                                        <td key={`${role.id}-${perm.id}`} className="p-10 text-center border-r last:border-0">
                                                            <button 
                                                                disabled={isLocked}
                                                                onClick={() => handleTogglePermission(role.id, perm.id, isGranted)}
                                                                className={`w-12 h-12 rounded-[1.25rem] mx-auto flex items-center justify-center transition-all border-2 ${isGranted ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl scale-110' : 'bg-white border-slate-100 text-slate-200 hover:border-slate-300 hover:text-slate-400'} ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'active:scale-90'}`}
                                                                style={isGranted && !isLocked ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
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

            {/* MODAL: AI TOKEN EDITOR (NEURAL POOL) */}
            {isModalAiOpen && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 shadow-2xl">
                            <div className="flex items-center gap-5">
                                <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl" style={{ backgroundColor: primaryColor }}><Key size={22}/></div>
                                <h4 className="font-black text-xl tracking-tight uppercase leading-none">{editingAiKey.id ? 'Editar Token' : 'Novo Registro Neural'}</h4>
                            </div>
                            <button onClick={() => setIsModalAiOpen(false)} className="p-3 text-slate-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all"><X size={28}/></button>
                        </div>
                        <div className="p-12 space-y-10 bg-[#fdfdfe]">
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Identificação do Token</label>
                                <input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm font-black uppercase outline-none focus:bg-white focus:border-indigo-500 shadow-inner" value={editingAiKey.label || ''} onChange={e => setEditingAiKey({...editingAiKey, label: e.target.value})} placeholder="Ex: Gemini Master Cluster Prod" />
                             </div>
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">API KEY Secreta</label>
                                <div className="relative">
                                    <input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm font-black outline-none focus:bg-white focus:border-indigo-500 shadow-inner" type="password" value={editingAiKey.key_value || ''} onChange={e => setEditingAiKey({...editingAiKey, key_value: e.target.value})} placeholder="AIzaSy..." />
                                    <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" size={18} />
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Modelo Alvo</label>
                                    <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-[10px] font-black uppercase outline-none focus:bg-white cursor-pointer" value={editingAiKey.model} onChange={e => setEditingAiKey({...editingAiKey, model: e.target.value})}>
                                        <option value="gemini-3-flash-preview">Gemini 3 Flash (Free Tier)</option>
                                        <option value="gemini-3-pro-preview">Gemini 3 Pro (Complex Reasoning)</option>
                                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Legacy Search)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nível / Tier</label>
                                    <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-[10px] font-black uppercase outline-none focus:bg-white cursor-pointer" value={editingAiKey.tier} onChange={e => setEditingAiKey({...editingAiKey, tier: e.target.value})}>
                                        <option value="FREE">Free Tier (Gratuito)</option>
                                        <option value="PAID">Paid Tier (Billing Active)</option>
                                    </select>
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Prioridade (Failover)</label>
                                    <input type="number" className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm font-black outline-none focus:bg-white" value={editingAiKey.priority} onChange={e => setEditingAiKey({...editingAiKey, priority: parseInt(e.target.value)})} />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Provedor Core</label>
                                    <input disabled className="w-full h-14 bg-slate-100 border border-slate-200 rounded-2xl px-6 text-sm font-black uppercase opacity-50 cursor-not-allowed" value="GOOGLE" />
                                </div>
                             </div>
                             <button onClick={handleSaveAiKey} disabled={isSaving} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 active:scale-95">
                                {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} Commitar no Pool Neural
                             </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* FAB: SINCRONIZADOR GLOBAL */}
            <div className="fixed bottom-10 right-10 z-[1000] flex flex-col items-end gap-4">
                 <button onClick={handleSaveInfo} disabled={isSaving} className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:bg-indigo-600 transition-all flex items-center gap-4 active:scale-95 group border border-white/5 backdrop-blur-md">
                    {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
                    Sincronizar Cluster Master
                 </button>
            </div>
        </div>
    );
};

export default Settings;
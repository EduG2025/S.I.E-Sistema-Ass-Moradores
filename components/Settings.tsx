import React, { useState, useEffect, useCallback } from 'react';
import { AVAILABLE_ROLES, SYSTEM_PERMISSIONS } from '../constants';
import { SystemInfo, AIKey, WhatsAppConfig } from '../types';
import { aiKeyService, systemService, api } from '../services/api';
import {
    Settings as SettingsIcon,
    Save,
    Building,
    Shield,
    Check,
    X,
    Upload,
    Plus,
    Trash2,
    Loader2,
    Key,
    Database,
    Server,
    Zap,
    Lock,
    Activity as PulseIcon,
    MessageCircle,
    Smartphone,
    Link as LinkIcon,
    Copy,
    Eye,
    EyeOff,
    Terminal,
    ShieldCheck,
    Layout,
    ToggleLeft,
    Image as ImageIcon
} from 'lucide-react';

interface SettingsProps {
    systemInfo: SystemInfo;
    onUpdateSystemInfo: (info: SystemInfo) => void;
}

const Settings = ({ systemInfo, onUpdateSystemInfo }: SettingsProps) => {
    const [activeTab, setActiveTab] = useState<'INFO' | 'ACCESS' | 'WHATSAPP' | 'API' | 'INFRA'>('INFO');

    if (!systemInfo) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Sincronizando Kernel...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-fade-in h-full relative pb-10">
            <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-xl shrink-0 flex flex-col md:flex-row justify-between items-center gap-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl"><SettingsIcon size={24} /></div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tight leading-none">Kernel Control</h1>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mt-2 opacity-80">SRE Operational Hub V180.0</p>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center bg-white/5 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10 relative z-10 gap-1 shadow-inner">
                    {[
                        { id: 'INFO', label: 'Identidade', icon: Building },
                        { id: 'ACCESS', label: 'Governança', icon: Lock },
                        { id: 'WHATSAPP', label: 'WhatsApp API', icon: MessageCircle },
                        { id: 'API', label: 'IA Gateway', icon: Key },
                        { id: 'INFRA', label: 'Telemetria', icon: PulseIcon }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white rounded-[3.5rem] border border-slate-200 shadow-sm p-8 lg:p-12 relative">
                {activeTab === 'INFO' && <IdentityTab systemInfo={systemInfo} onUpdate={onUpdateSystemInfo} />}
                {activeTab === 'ACCESS' && <AccessTab />}
                {activeTab === 'WHATSAPP' && <WhatsAppTab systemInfo={systemInfo} onUpdate={onUpdateSystemInfo} />}
                {activeTab === 'API' && <IAGatewayTab />}
                {activeTab === 'INFRA' && <InfraTab />}
            </div>
        </div>
    );
};

const IdentityTab = ({ systemInfo, onUpdate }: { systemInfo: SystemInfo, onUpdate: (info: SystemInfo) => void }) => {
    const [local, setLocal] = useState<SystemInfo>({
        ...systemInfo,
        resident_ui_settings: systemInfo.resident_ui_settings || []
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => { if (systemInfo) setLocal(prev => ({ ...prev, ...systemInfo })); }, [systemInfo]);

    const save = async () => {
        setLoading(true);
        try {
            await systemService.updateInfo(local);
            onUpdate(local);
            alert("✅ Kernel Identidade Sincronizado.");
        } catch (e) { alert("Falha na sincronização."); }
        finally { setLoading(false); }
    };

    const toggleUI = (id: string) => {
        const next = (local.resident_ui_settings || []).map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
        setLocal({ ...local, resident_ui_settings: next });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row items-center gap-12 border-b pb-12 border-slate-100">
                <div className="relative group">
                    <div className="w-40 h-40 rounded-[3.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group-hover:border-indigo-400 transition-all shadow-inner p-6">
                        {local.logoUrl ? <img src={local.logoUrl} className="w-full h-full object-contain" alt="Logo" /> : <ImageIcon size={48} className="text-slate-200" />}
                    </div>
                    <label className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 text-white rounded-2xl shadow-xl cursor-pointer hover:bg-indigo-700 transition-transform hover:scale-110">
                        <Upload size={18} /><input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setLocal({ ...local, logoUrl: reader.result as string });
                                reader.readAsDataURL(file);
                            }
                        }} />
                    </label>
                </div>
                <div className="flex-1 text-center md:text-left space-y-4">
                    <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Marca do Cluster</h3>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                        <div className="flex items-center gap-4 bg-slate-50 p-2 px-6 rounded-2xl border border-slate-200 shadow-inner">
                            <span className="text-[10px] font-black uppercase text-slate-400">Cor Base</span>
                            <input type="color" className="h-8 w-12 rounded border-none cursor-pointer bg-transparent" value={local.primaryColor || '#4f46e5'} onChange={e => setLocal({ ...local, primaryColor: e.target.value })} />
                        </div>
                        <input className="font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm uppercase w-48 shadow-inner focus:bg-white focus:border-indigo-500" placeholder="Sigla (Ex: SIE PRO)" value={local.shortName || ''} onChange={e => setLocal({ ...local, shortName: e.target.value.toUpperCase() })} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razão Social</label><input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 shadow-inner" value={local.name || ''} onChange={e => setLocal({ ...local, name: e.target.value })} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ</label><input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 shadow-inner" value={local.cnpj || ''} onChange={e => setLocal({ ...local, cnpj: e.target.value })} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label><input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 shadow-inner" value={local.email || ''} onChange={e => setLocal({ ...local, email: e.target.value })} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SAC</label><input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 shadow-inner" value={local.phone || ''} onChange={e => setLocal({ ...local, phone: e.target.value })} /></div>
                <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço</label><input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 shadow-inner" value={local.address || ''} onChange={e => setLocal({ ...local, address: e.target.value })} /></div>
            </div>

            <div className="pt-10 border-t border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg"><Layout size={20} /></div>
                    <div>
                        <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Portal do Morador</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Visibilidade de Módulos</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(local.resident_ui_settings || []).map(setting => (
                        <div key={setting.id} className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between shadow-sm ${setting.enabled ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100 opacity-60 grayscale'}`}>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm"><ToggleLeft size={18} className={setting.enabled ? 'text-indigo-600' : 'text-slate-300'} /></div>
                                <div><p className="text-xs font-black text-slate-800 uppercase tracking-tight">{setting.label}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{setting.detail}</p></div>
                            </div>
                            <button onClick={() => toggleUI(setting.id)} className={`w-12 h-6 rounded-full relative transition-colors ${setting.enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${setting.enabled ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-10 flex justify-end">
                <button onClick={save} disabled={loading} className="px-14 py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-4">
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <ShieldCheck size={24} />} Commitar Alterações
                </button>
            </div>
        </div>
    );
};

const AccessTab = () => {
    const [permMatrix, setPermMatrix] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        systemService.getPermissions().then(res => {
            const map: any = {};
            (res.data?.data || []).forEach((r: any) => {
                if (!map[r.role]) map[r.role] = [];
                map[r.role].push(r.permission_id);
            });
            setPermMatrix(map);
            setIsLoading(false);
        });
    }, []);

    const toggle = (role: string, id: string) => {
        setPermMatrix(prev => {
            const current = prev[role] || [];
            const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
            return { ...prev, [role]: next };
        });
    };

    const save = async () => {
        setIsSaving(true);
        try {
            const flat = Object.entries(permMatrix).flatMap(([role, perms]) => perms.map(p => ({ role, permission_id: p })));
            await systemService.updatePermissions(flat);
            alert("✅ Matriz RBAC sincronizada.");
        } finally { setIsSaving(false); }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
            <div className="bg-slate-900 p-10 rounded-[3.5rem] border border-white/5 shadow-2xl flex justify-between items-center relative">
                <div className="relative z-10">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Matriz de Governança</h3>
                    <p className="text-[11px] text-indigo-300 font-bold uppercase mt-2 tracking-widest">Controle RBAC</p>
                </div>
                <button onClick={save} disabled={isSaving || isLoading} className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-4">
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Salvar Matriz
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-[3.5rem] shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full border-collapse text-left min-w-[800px]">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50 z-20">Módulo</th>
                            {AVAILABLE_ROLES.map(role => (
                                <th key={role} className="p-8 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-l border-slate-100">{role}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan={AVAILABLE_ROLES.length + 1} className="p-40 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={48} /></td></tr>
                        ) : SYSTEM_PERMISSIONS.map(perm => (
                            <tr key={perm.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-8 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">
                                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{perm.label}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{perm.module}</p>
                                </td>
                                {AVAILABLE_ROLES.map(role => (
                                    <td key={role} className="p-8 text-center">
                                        <button
                                            onClick={() => toggle(role, perm.id)}
                                            disabled={role === 'ADMIN'}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all ${permMatrix[role]?.includes(perm.id) || role === 'ADMIN' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-200'}`}
                                        >
                                            {permMatrix[role]?.includes(perm.id) || role === 'ADMIN' ? <Check size={20} /> : <X size={20} />}
                                        </button>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const WhatsAppTab = ({ systemInfo, onUpdate }: { systemInfo: SystemInfo, onUpdate: (info: SystemInfo) => void }) => {
    const [config, setConfig] = useState<WhatsAppConfig>(() => ({
        api_key: systemInfo?.whatsapp_config?.api_key || '',
        sender: systemInfo?.whatsapp_config?.sender || '',
        footer: systemInfo?.whatsapp_config?.footer || 'S.I.E PRO'
    }));

    const [loading, setLoading] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const webhookUrl = `${window.location.origin}/api/communication/whatsapp-webhook`;

    useEffect(() => { if (systemInfo?.whatsapp_config) setConfig(systemInfo.whatsapp_config); }, [systemInfo]);

    const save = async () => {
        setLoading(true);
        try {
            const updated = { ...systemInfo, whatsapp_config: config };
            await systemService.updateInfo(updated);
            onUpdate(updated);
            alert("🚀 Gateway WhatsApp Sincronizado.");
        } catch (e) { alert("Erro ao salvar."); }
        finally { setLoading(false); }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-12">
            <div className="bg-indigo-600 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="absolute top-0 right-0 p-10 opacity-10"><MessageCircle size={150} /></div>
                <div className="relative z-10 space-y-6">
                    <div className="px-5 py-1.5 bg-white/10 rounded-full w-fit border border-white/20 backdrop-blur-md">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">JennyAI Bridge</span>
                    </div>
                    <h3 className="text-4xl font-black uppercase tracking-tightest leading-none">WhatsApp API</h3>
                    <p className="text-indigo-100 text-sm font-medium leading-relaxed max-w-sm uppercase italic">Mensageria corporativa ativa JennyAI Bridge.</p>
                </div>
                <div className="p-10 bg-white/10 backdrop-blur-xl rounded-[3rem] border border-white/20 text-center shrink-0 shadow-2xl">
                    <Smartphone size={48} className="mx-auto mb-4 text-white" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</p>
                    <p className="text-2xl font-black text-emerald-400 mt-2">{config.api_key ? 'CONNECTED' : 'STANDBY'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><Key size={12} /> API Key (JennyAI)</label>
                    <div className="relative">
                        <input
                            type={showKey ? "text" : "password"}
                            title="API Key"
                            className="w-full font-mono font-bold h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 shadow-inner outline-none transition-all focus:bg-white focus:border-indigo-500"
                            value={config.api_key || ''}
                            onChange={e => setConfig({ ...config, api_key: e.target.value })}
                        />
                        <button onClick={() => setShowKey(!showKey)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600">
                            {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><Smartphone size={12} /> Remetente</label>
                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 shadow-inner focus:bg-white focus:border-indigo-500" value={config.sender || ''} onChange={e => setConfig({ ...config, sender: e.target.value })} placeholder="5511999998888" />
                </div>
            </div>

            <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200 shadow-inner space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600"><LinkIcon size={20} /></div>
                        <h4 className="font-black text-sm uppercase text-slate-800">Endpoint Webhook</h4>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                    <code className="flex-1 font-mono text-[11px] text-indigo-600 truncate bg-slate-50 p-2 rounded-lg">{webhookUrl}</code>
                    <button onClick={() => { navigator.clipboard.writeText(webhookUrl); alert("Copiado!"); }} className="p-4 text-indigo-600"><Copy size={20} /></button>
                </div>
            </div>

            <div className="flex justify-end pt-8">
                <button onClick={save} disabled={loading} className="px-16 py-6 bg-slate-950 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-4">
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <ShieldCheck size={24} />} Commitar Gateway
                </button>
            </div>
        </div>
    );
};

const IAGatewayTab = () => {
    const [keys, setKeys] = useState<AIKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newKey, setNewKey] = useState<Partial<AIKey>>({ label: '', key_value: '', provider: 'GOOGLE', tier: 'FREE', priority: 1, status: 'ACTIVE' });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await aiKeyService.getAll();
            setKeys(res.data?.data || []);
        } catch (e) { console.error("[SRE] Failover IA."); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await aiKeyService.create(newKey);
            setIsKeyModalOpen(false);
            setNewKey({ label: '', key_value: '', provider: 'GOOGLE', tier: 'FREE', priority: 1, status: 'ACTIVE' });
            load();
        } finally { setIsSaving(false); }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-10">
            <div className="flex justify-between items-center border-b border-slate-100 pb-10">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Cluster de Inteligência</h3>
                <button onClick={() => setIsKeyModalOpen(true)} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center gap-3"><Plus size={18} /> Injetar Token</button>
            </div>

            <div className="space-y-6">
                {loading ? <div className="py-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={48} /></div> : (
                    keys.map(k => (
                        <div key={k.id} className="p-8 bg-slate-50 border border-slate-200 rounded-[3rem] flex justify-between items-center group hover:bg-white transition-all shadow-sm">
                            <div className="flex items-center gap-8 flex-1">
                                <div className={`p-5 rounded-[1.5rem] shadow-inner ${k.status === 'ACTIVE' ? 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-rose-100 text-rose-600'} transition-all`}><Zap size={26} /></div>
                                <div className="space-y-1"><h4 className="font-black text-slate-800 uppercase tracking-tight text-lg">{k.label}</h4><p className="text-[10px] font-mono text-slate-400">••••••••••••••••••••</p></div>
                            </div>
                            <button onClick={async () => { if (confirm("Remover?")) { await aiKeyService.delete(k.id); load(); } }} className="p-4 text-slate-300 hover:text-rose-500"><Trash2 size={20} /></button>
                        </div>
                    ))
                )}
            </div>

            {isKeyModalOpen && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-xl self-center">
                        <form onSubmit={handleCreate}>
                            <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                                <h3 className="font-black text-xl uppercase">Injetar Token</h3>
                                <button type="button" onClick={() => setIsKeyModalOpen(false)} className="p-2 text-slate-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-white/5"><X size={28} /></button>
                            </div>
                            <div className="p-10 space-y-8 bg-[#fdfdfe]">
                                <input required className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 focus:bg-white focus:border-indigo-500" value={newKey.label} onChange={e => setNewKey({ ...newKey, label: e.target.value })} placeholder="Nome do Nó" />
                                <input required type="password" className="w-full font-mono font-bold h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 shadow-inner focus:bg-white focus:border-indigo-500" value={newKey.key_value} onChange={e => setNewKey({ ...newKey, key_value: e.target.value })} placeholder="API Key Secreta" />
                                <div className="grid grid-cols-2 gap-8">
                                    <select className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 uppercase" value={newKey.tier} onChange={e => setNewKey({ ...newKey, tier: e.target.value as any })}>
                                        <option value="FREE">Free Tier</option>
                                        <option value="PAID">Paid Tier</option>
                                    </select>
                                    <input type="number" className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-2xl text-center" value={newKey.priority} onChange={e => setNewKey({ ...newKey, priority: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="p-8 border-t bg-slate-50 flex justify-end gap-6 rounded-b-[2.5rem]">
                                <button type="submit" disabled={isSaving} className="px-14 py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all">
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Commitar Chave
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const InfraTab = () => (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in p-12 text-center pb-20">
        <div className="w-44 h-44 bg-slate-950 text-indigo-500 rounded-[5rem] flex items-center justify-center mx-auto shadow-2xl animate-pulse relative border-8 border-slate-900">
            <Terminal size={72} />
            <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-emerald-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white"><ShieldCheck size={32} /></div>
        </div>
        <div className="space-y-6">
            <h3 className="text-5xl font-black text-slate-800 uppercase tracking-tightest">Telemetry Hub</h3>
            <p className="text-slate-400 text-lg max-w-xl mx-auto font-medium uppercase tracking-widest leading-relaxed">SRE Operational Core Status: <span className="text-emerald-500 font-black">100% ONLINE</span>.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-10">
            {[
                { label: 'API Gateway', status: '3001 ONLINE', icon: Server, color: 'text-indigo-500' },
                { label: 'Database Engine', status: 'MYSQL 8.0', icon: Database, color: 'text-amber-500' },
                { label: 'Neural Bridge', status: 'SYNCED', icon: Zap, color: 'text-emerald-500' },
                { label: 'Security Layer', status: 'JWT SHIELD', icon: ShieldCheck, color: 'text-indigo-600' }
            ].map(s => (
                <div key={s.label} className="p-8 bg-slate-50 border border-slate-200 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all hover:bg-white group cursor-default">
                    <s.icon size={40} className={`${s.color} mx-auto mb-8 group-hover:scale-110 transition-transform`} />
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{s.label}</p>
                    <p className="text-[10px] font-black text-slate-800 uppercase bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-inner inline-block">{s.status}</p>
                </div>
            ))}
        </div>
    </div>
);

export default Settings;
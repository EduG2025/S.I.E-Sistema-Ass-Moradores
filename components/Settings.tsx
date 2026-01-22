import React, { useState, useEffect, useRef } from 'react';
import { SystemInfo, ResidentUISetting, AIKey, WhatsAppConfig, UserRole } from '../types';
import { systemService, aiKeyService, api } from '../services/api';
import { SYSTEM_PERMISSIONS } from '../constants';
import {
    Settings as SettingsIcon, Building, X, Plus, Trash2, Loader2, Key, Zap, Lock, 
    MessageCircle, ShieldCheck, Image as ImageIcon, Layout, Save,
    Shield, UserCheck, Cpu, CheckCircle2, History, Sparkles,
    Mail, Phone, Fingerprint, Box, Leaf, BarChart3,
    ClipboardList, Camera, Wallet, Bell, Brain, ShoppingBag, HelpCircle, FileText, QrCode,
    Landmark, Gavel, Upload, Globe, MapPin, Monitor, Calendar, ShieldAlert, Layers
} from 'lucide-react';

interface SettingsProps {
    systemInfo: SystemInfo;
    onUpdateSystemInfo: (info: SystemInfo) => void;
}

const Settings = ({ systemInfo, onUpdateSystemInfo }: SettingsProps) => {
    const [activeTab, setActiveTab] = useState<'INFO' | 'INTERFACE' | 'WHATSAPP' | 'AI_KEYS' | 'PERMISSIONS'>('INFO');
    const [isSaving, setIsSaving] = useState(false);
    const [localInfo, setLocalInfo] = useState<SystemInfo>(systemInfo);
    const [aiKeys, setAiKeys] = useState<AIKey[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Messenger Local State
    const [waConfig, setWaConfig] = useState<WhatsAppConfig>(systemInfo.whatsapp_config || {
        api_key: '', sender: '', footer: 'S.I.E PRO', welcome_template: '', default_password: 'mudar123'
    });

    useEffect(() => {
        if (activeTab === 'AI_KEYS') loadAIKeys();
        if (activeTab === 'PERMISSIONS') loadRBAC();
    }, [activeTab]);

    const loadAIKeys = async () => {
        setIsLoadingData(true);
        try {
            const res = await aiKeyService.getAll();
            setAiKeys(res.data.data || []);
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
            const payload = { ...localInfo, whatsapp_config: waConfig };
            await systemService.updateInfo(payload);
            onUpdateSystemInfo(payload);
            alert("✅ SRE: Kernel Sincronizado e Persistente.");
        } catch (e) {
            alert("Erro crítico de sincronia MySQL.");
        } finally { setIsSaving(false); }
    };

    const handleTogglePermission = async (role: string, permissionId: string, current: boolean) => {
        try {
            await systemService.togglePermission({ role, permission_id: permissionId, active: !current });
            loadRBAC();
        } catch (e) { alert("Erro ao atualizar matriz RBAC."); }
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

    const handleDeleteRole = async (id: string) => {
        if (['ADMIN', 'RESIDENT'].includes(id)) return alert("Cargos nucleares não podem ser removidos.");
        if (!confirm(`Excluir cargo "${id}"? Isso removerá todas as permissões vinculadas.`)) return;
        try {
            await systemService.deleteRole(id);
            loadRBAC();
        } catch (e) { alert("Erro ao remover cargo."); }
    };

    const handleAddKey = async () => {
        const label = prompt("Etiqueta da Chave (Ex: Gemini Cluster 01):");
        const val = prompt("Valor da API Key (Secreto):");
        if (!label || !val) return;
        try {
            await aiKeyService.create({ label, key_value: val, provider: 'GOOGLE', status: 'ACTIVE', priority: 1 });
            loadAIKeys();
        } catch (e) { alert("Falha ao registrar gateway neural."); }
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
            {/* TERMINAL HEADER SRE - COMANDO MASTER */}
            <div className="module-header bg-slate-900 text-white shadow-2xl flex flex-col md:flex-row gap-6 shrink-0 p-6 md:px-12 border-b border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-[1.5rem] text-white shadow-2xl" style={{ backgroundColor: primaryColor }}><SettingsIcon size={26} /></div>
                    <div>
                        <h1 className="text-2xl font-black uppercase leading-none tracking-tightest">{localInfo.shortName || 'S.I.E'} Control Console</h1>
                        <p className="text-[9px] font-black uppercase text-indigo-400 mt-2 tracking-[0.4em] opacity-80 italic">System Reliability Protocol V7.5 • Secure Session Active</p>
                    </div>
                </div>

                <div className="flex-1 flex overflow-x-auto gap-2 py-1 no-scrollbar md:justify-end items-center relative z-10">
                    {[
                        { id: 'INFO', label: 'Identidade', icon: Building },
                        { id: 'INTERFACE', label: 'Módulos', icon: Layout },
                        { id: 'WHATSAPP', label: 'Messenger', icon: MessageCircle },
                        { id: 'AI_KEYS', label: 'Neural', icon: Cpu },
                        { id: 'PERMISSIONS', label: 'Governança', icon: Shield }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase whitespace-nowrap transition-all flex items-center gap-3 border ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-xl border-white scale-105' : 'text-slate-400 border-white/5 hover:border-white/10 hover:bg-white/5'}`} style={activeTab === tab.id ? { color: primaryColor } : {}}>
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ÁREA DE CONFIGURAÇÃO IMERSIVA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fcfcfd] p-6 md:p-14">
                
                {activeTab === 'INFO' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none"><Building size={200}/></div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4 border-b border-slate-100 pb-8"><Building size={24} className="text-indigo-600" style={{ color: primaryColor }}/> Identidade Corporativa</h3>
                            
                            <div className="grid grid-cols-1 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Razão Social / Nome da Associação</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-lg focus:bg-white focus:border-indigo-500 outline-none uppercase shadow-inner" value={localInfo.name} onChange={e => setLocalInfo({ ...localInfo, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sigla de Operação (ShortName)</label>
                                        <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-base uppercase focus:bg-white focus:border-indigo-500 outline-none shadow-inner" value={localInfo.shortName} onChange={e => setLocalInfo({ ...localInfo, shortName: e.target.value })} />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Documento CNPJ Oficial</label>
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
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Esquema de Cores do Cluster</label>
                                    <div className="flex items-center gap-10">
                                        <input type="color" className="w-20 h-20 rounded-[1.5rem] border-4 border-white p-0 cursor-pointer shadow-2xl" value={localInfo.primaryColor} onChange={e => setLocalInfo({ ...localInfo, primaryColor: e.target.value })} />
                                        <div className="space-y-2">
                                            <input className="font-mono font-black text-lg uppercase px-6 py-3 bg-white border border-slate-200 rounded-2xl w-44 text-center shadow-sm" value={localInfo.primaryColor} onChange={e => setLocalInfo({ ...localInfo, primaryColor: e.target.value })} />
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Sincronização de Marca OK</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSaveInfo} disabled={isSaving} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-5 active:scale-95 group">
                            {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} className="group-hover:scale-110 transition-transform"/>} Commitar Alterações de Identidade
                        </button>
                    </div>
                )}

                {activeTab === 'INTERFACE' && (
                    <div className="space-y-10 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none"><Layout size={240}/></div>
                            <div className="space-y-3">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4 border-b border-slate-100 pb-8"><Layout size={24} className="text-indigo-600" style={{ color: primaryColor }}/> Manifest de Interface do Morador</h3>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-3xl">Controle quais módulos estarão visíveis no terminal do residente. Desativar um módulo não apaga seus dados, apenas remove o acesso frontal.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                                {localInfo.resident_ui_settings?.map(mod => (
                                    <div key={mod.id} className={`p-8 rounded-[2.5rem] border transition-all flex items-center justify-between group ${mod.enabled ? 'bg-white border-slate-200 shadow-lg ring-1 ring-slate-100' : 'bg-slate-50 border-dashed border-slate-200 opacity-50'}`}>
                                        <div className="flex items-center gap-6">
                                            <div className={`p-5 rounded-2xl shadow-inner ${mod.enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'}`} style={mod.enabled ? { color: primaryColor, backgroundColor: primaryColor + '10' } : {}}>
                                                <Layout size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 uppercase text-sm tracking-tight">{mod.label}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 italic">{mod.detail}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => {
                                            const updated = localInfo.resident_ui_settings?.map(m => m.id === mod.id ? {...m, enabled: !m.enabled} : m);
                                            setLocalInfo({...localInfo, resident_ui_settings: updated});
                                        }} className={`w-14 h-7 rounded-full flex items-center px-1 transition-colors ${mod.enabled ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`}>
                                            <div className={`w-5 h-5 bg-white rounded-full shadow-xl transform transition-transform ${mod.enabled ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={handleSaveInfo} disabled={isSaving} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-widest shadow-2xl">
                           Salvar Configurações de Módulos
                        </button>
                    </div>
                )}

                {activeTab === 'WHATSAPP' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-emerald-950 p-16 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12">
                            <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none transform rotate-12 scale-150"><MessageCircle size={280}/></div>
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4 px-6 py-2.5 bg-white/10 rounded-full w-fit border border-white/10 backdrop-blur-xl">
                                    <Sparkles size={20} className="text-emerald-400 animate-pulse"/>
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-200">JennyAI Bridge V6.0</span>
                                </div>
                                <h2 className="text-5xl font-black uppercase tracking-tightest leading-tight">Messenger <br/>Active Gateway.</h2>
                                <p className="text-emerald-100/70 text-base font-medium leading-relaxed max-w-md italic uppercase">Automação neural de faturamento, boas-vindas e alertas de vigilância via WhatsApp.</p>
                            </div>
                        </div>

                        <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-12">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">API KEY (JennyAI Cluster)</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-base focus:bg-white focus:border-emerald-500 outline-none shadow-inner" type="password" value={waConfig.api_key} onChange={e => setWaConfig({...waConfig, api_key: e.target.value})} placeholder="••••••••••••••••••••••••" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sender ID / Instance</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-base focus:bg-white focus:border-emerald-500 outline-none shadow-inner" value={waConfig.sender} onChange={e => setWaConfig({...waConfig, sender: e.target.value})} placeholder="Ex: SIE_PRO_MASTER" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Padrão (Novos Membros)</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-base focus:bg-white focus:border-emerald-500 outline-none shadow-inner" value={waConfig.default_password} onChange={e => setWaConfig({...waConfig, default_password: e.target.value})} placeholder="mudar123" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Rodapé das Mensagens</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-base focus:bg-white focus:border-emerald-500 outline-none shadow-inner" value={waConfig.footer} onChange={e => setWaConfig({...waConfig, footer: e.target.value})} placeholder="S.I.E PRO" />
                                </div>
                             </div>
                             <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Template de Boas-vindas Neural</label>
                                <textarea rows={5} className="w-full font-medium bg-slate-50 border border-slate-200 rounded-[2.5rem] p-10 text-base focus:bg-white focus:border-emerald-500 outline-none uppercase shadow-inner leading-loose" value={waConfig.welcome_template} onChange={e => setWaConfig({...waConfig, welcome_template: e.target.value})} placeholder="Olá {nome}, seu registro no cluster {sigla} foi ativado..." />
                                <div className="flex gap-4 ml-4">
                                    <code className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{"{nome}"}</code>
                                    <code className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{"{senha}"}</code>
                                    <code className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{"{sigla}"}</code>
                                </div>
                             </div>
                        </div>

                        <button onClick={handleSaveInfo} disabled={isSaving} className="w-full py-8 bg-emerald-600 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-5 active:scale-95">
                            {isSaving ? <Loader2 className="animate-spin" size={24} /> : <MessageCircle size={24} />} Commitar Messenger Protocol
                        </button>
                    </div>
                )}

                {activeTab === 'AI_KEYS' && (
                    <div className="space-y-10 animate-fade-in pb-12 max-w-6xl mx-auto">
                        <div className="bg-slate-950 rounded-[4.5rem] p-16 text-white shadow-2xl relative overflow-hidden border border-white/5">
                            <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none transform -rotate-12 scale-150"><Brain size={300}/></div>
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 px-6 py-2 bg-indigo-500/20 rounded-full w-fit border border-indigo-500/30 backdrop-blur-xl">
                                        <Zap size={20} className="text-indigo-400 animate-pulse"/>
                                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-300">Inteligência Soberana</span>
                                    </div>
                                    <h2 className="text-6xl font-black uppercase tracking-tightest leading-none">Gateway <br/>Neural.</h2>
                                    <p className="text-slate-400 text-base font-medium leading-relaxed max-w-md italic uppercase opacity-70">O Kernel rotaciona chaves dinamicamente para garantir disponibilidade crítica do Advisor e Vision.</p>
                                </div>
                                <button onClick={handleAddKey} className="px-12 py-8 bg-white text-slate-950 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-5 active:scale-95">
                                    <Plus size={24}/> Registrar Provedor
                                </button>
                            </div>
                        </div>

                        {isLoadingData ? <div className="p-32 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={56}/></div> : (
                            <div className="grid grid-cols-1 gap-6">
                                {aiKeys.map(key => (
                                    <div key={key.id} className="bg-white border-2 border-slate-100 p-10 rounded-[3rem] shadow-sm flex flex-col md:flex-row items-center justify-between group hover:border-indigo-400 transition-all hover:shadow-2xl">
                                        <div className="flex items-center gap-10">
                                            <div className="p-6 bg-indigo-50 text-indigo-600 rounded-3xl shadow-inner"><Cpu size={32}/></div>
                                            <div>
                                                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-3">{key.label}</h4>
                                                <div className="flex flex-wrap items-center gap-6">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">{key.provider} • PRIO {key.id}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981] animate-pulse"></div>
                                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Ativo</span>
                                                    </div>
                                                    <code className="text-[11px] font-mono text-indigo-400 bg-indigo-50 px-4 py-1.5 rounded-xl border border-indigo-100 shadow-inner">••••••••{key.key_value.slice(-6)}</code>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 mt-8 md:mt-0 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                            <button onClick={() => aiKeyService.delete(key.id).then(loadAIKeys)} className="p-5 bg-rose-50 text-rose-300 hover:text-rose-600 hover:bg-rose-100 rounded-2xl transition-all border border-rose-100 shadow-sm"><Trash2 size={24}/></button>
                                        </div>
                                    </div>
                                ))}
                                {aiKeys.length === 0 && (
                                    <div className="p-24 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                        <Cpu size={48} className="mx-auto text-slate-300 mb-6 opacity-40"/>
                                        <p className="font-black uppercase text-[10px] text-slate-400 tracking-[0.4em]">Nenhum gateway neural ativo no DB.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'PERMISSIONS' && (
                    <div className="space-y-12 animate-fade-in pb-12 max-w-7xl mx-auto">
                        {/* Gestão de Cargos (Roles) */}
                        <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-10">
                            <div className="flex justify-between items-center border-b pb-8">
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-4"><Layers size={24} className="text-indigo-600"/> Hierarquia de Cargos</h3>
                                <button onClick={handleAddRole} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3"><Plus size={16}/> Novo Cargo</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {roles.map(role => (
                                    <div key={role.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex justify-between items-center group">
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{role.id}</p>
                                            <h4 className="text-sm font-black text-slate-800 uppercase mt-1">{role.label}</h4>
                                        </div>
                                        {!['ADMIN', 'RESIDENT'].includes(role.id) && (
                                            <button onClick={() => handleDeleteRole(role.id)} className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Matriz RBAC */}
                        <div className="bg-white rounded-[4.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                            <div className="p-12 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-8 shrink-0">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4"><Shield size={26} className="text-indigo-600" style={{ color: primaryColor }}/> Matriz RBAC de Governança</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">Sincronia MySQL Ativa • Alterações de privilégio são propagadas em tempo real.</p>
                                </div>
                                <div className="flex items-center gap-3 px-6 py-2.5 bg-white rounded-full border border-slate-200 shadow-xl">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Cluster Synced</span>
                                </div>
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
            
            {/* SRE INTEGRITY FOOTER */}
            <div className="px-12 py-6 flex items-center justify-between opacity-60 shrink-0 border-t bg-slate-50">
                <div className="flex items-center gap-4">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em]">SRE Master Cluster Integrity Protocol V7.5 • Persistent Ledger Active</span>
                </div>
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-2">
                       <span className="text-[9px] font-black uppercase text-slate-400">Node ID: Master_Primary</span>
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
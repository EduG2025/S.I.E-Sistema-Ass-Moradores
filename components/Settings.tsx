
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AVAILABLE_ROLES, SYSTEM_PERMISSIONS, DEFAULT_ID_CARD_TEMPLATE, DEFAULT_SYSTEM_INFO } from '../constants';
import { SystemInfo, IdCardTemplate, User, AIKey, CardElement } from '../types';
import { aiKeyService, templateService } from '../services/api';
import axios from 'axios';
import {
  Save, Building, Shield, Check, X, Upload,
  Image as ImageIcon, Plus, Trash2,
  Loader2, Key, Cpu, Zap, Edit2, CheckCircle2,
  Lock, Unlock, Server, Signal, Activity, RefreshCw, AlertTriangle,
  Globe, Phone, Mail, Map, Wallet, ShieldCheck,
  TrendingUp, Type, Maximize, Copy, MousePointer2, Sparkles, ChevronRight, Database, Layout, CloudDownload, Camera
} from 'lucide-react';

interface SettingsProps {
  systemInfo: SystemInfo;
  onUpdateSystemInfo: (info: SystemInfo) => void;
  templates: IdCardTemplate[];
  onUpdateTemplates: (templates: IdCardTemplate[]) => void;
  initialTab?: 'INFO' | 'STUDIO' | 'ACCESS' | 'API';
}

const Settings = ({
  systemInfo = DEFAULT_SYSTEM_INFO,
  onUpdateSystemInfo,
  templates = [],
  onUpdateTemplates,
  initialTab = 'INFO'
}: SettingsProps) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'STUDIO' | 'ACCESS' | 'API'>(initialTab);
  const [isSaving, setIsSaving] = useState(false);
  
  const [localInfo, setLocalInfo] = useState<SystemInfo>(systemInfo);
  const [aiKeys, setAiKeys] = useState<AIKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyFormData, setKeyFormData] = useState<Partial<AIKey>>({
    label: '', key_value: '', provider: 'GEMINI', tier: 'FREE', priority: 1
  });

  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  const apiHeaders = useMemo(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('sie_auth_token')}` }
  }), []);

  const loadAIKeys = useCallback(async () => {
    setIsLoadingKeys(true);
    try {
      const res = await aiKeyService.getAll();
      setAiKeys(res.data?.data || (Array.isArray(res.data) ? res.data : []));
    } catch (e) {
      setAiKeys([]);
    } finally {
      setIsLoadingKeys(false);
    }
  }, []);

  const loadPermissions = useCallback(async () => {
    setIsLoadingPermissions(true);
    try {
      const res = await axios.get('/api/settings/permissions', apiHeaders);
      setRolePermissions(res.data || {});
    } catch (e) {
      console.error("[SRE] Erro ao carregar permissões.");
    } finally {
      setIsLoadingPermissions(false);
    }
  }, [apiHeaders]);

  useEffect(() => {
    if (activeTab === 'API') loadAIKeys();
    if (activeTab === 'ACCESS') loadPermissions();
  }, [activeTab, loadAIKeys, loadPermissions]);

  const handleSaveSystemInfo = async () => {
    setIsSaving(true);
    try {
        // SRE SHIELD: Sanitiza o payload localInfo antes de enviar (evita erro de data)
        const payload = { ...localInfo };
        delete (payload as any).updated_at;
        delete (payload as any).created_at;

        await axios.post('/api/settings/system', payload, apiHeaders);
        onUpdateSystemInfo(localInfo);
        alert("✅ Parâmetros de Identidade atualizados.");
    } catch (e) {
        alert("Falha crítica ao gravar no banco. Verifique o console.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) return alert("Arquivo muito grande (Máximo 2MB)");
        const reader = new FileReader();
        reader.onloadend = () => {
            setLocalInfo({ ...localInfo, logoUrl: reader.result as string });
        };
        reader.readAsDataURL(file);
    }
  };

  const togglePermission = (role: string, permId: string) => {
    setRolePermissions(prev => {
      const current = prev[role] || [];
      const updated = current.includes(permId) 
        ? current.filter(p => p !== permId) 
        : [...current, permId];
      return { ...prev, [role]: updated };
    });
  };

  const handleSavePermissions = async () => {
    setIsSaving(true);
    try {
      await axios.post('/api/settings/permissions', rolePermissions, apiHeaders);
      alert("✅ Matriz de Governança comitada com sucesso.");
    } catch (e) {
      alert("Erro ao gravar permissões RBAC.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await aiKeyService.create(keyFormData);
      setIsKeyModalOpen(false);
      loadAIKeys();
      setKeyFormData({ label: '', key_value: '', provider: 'GEMINI', tier: 'FREE', priority: 1 });
    } catch (e) {
      alert("Erro ao salvar chave neural.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in pb-24 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl overflow-hidden relative shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-xl"><Cpu size={32} /></div>
          <div>
              <h2 className="text-4xl font-black tracking-tightest uppercase">Console Master</h2>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2">Kernel Settings & Infrastructure</p>
          </div>
        </div>

        <div className="flex bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-1.5 border border-white/10 relative z-10 overflow-x-auto max-w-full custom-scrollbar">
          {[
            { id: 'INFO', label: 'Identidade', icon: Building },
            { id: 'STUDIO', label: 'Studio Digital', icon: Sparkles },
            { id: 'ACCESS', label: 'Governança', icon: Shield },
            { id: 'API', label: 'AI Gateway', icon: Key }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}>
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="animate-scale-in h-full">
            {activeTab === 'INFO' && (
              <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-12 max-w-5xl mx-auto">
                <div className="flex items-center gap-8">
                    <div className="relative group">
                        <div className="w-40 h-40 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-indigo-400 transition-colors">
                            {localInfo.logoUrl ? (
                                <img src={localInfo.logoUrl} className="w-full h-full object-contain p-4" alt="Logo" />
                            ) : (
                                <ImageIcon size={48} className="text-slate-200" />
                            )}
                        </div>
                        <label className="absolute -bottom-4 -right-4 p-4 bg-indigo-600 text-white rounded-2xl shadow-2xl cursor-pointer hover:bg-indigo-700 transition-all">
                            <Upload size={20} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </label>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Marca da Organização</h3>
                        <p className="text-slate-400 font-medium text-sm mt-2">A logo será utilizada em cartões de identificação, editais e no dashboard principal.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Oficial</label>
                        <input className="w-full font-bold h-16 bg-slate-50 border-slate-200 rounded-2xl px-6 focus:bg-white" value={localInfo.name} onChange={e => setLocalInfo({...localInfo, name: e.target.value})} />
                    </div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ / Identificação</label>
                        <input className="w-full font-bold h-16 bg-slate-50 border-slate-200 rounded-2xl px-6 focus:bg-white" value={localInfo.cnpj} onChange={e => setLocalInfo({...localInfo, cnpj: e.target.value})} />
                    </div>
                    <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço da Sede</label>
                        <input className="w-full font-bold h-16 bg-slate-50 border-slate-200 rounded-2xl px-6 focus:bg-white" value={localInfo.address || ''} onChange={e => setLocalInfo({...localInfo, address: e.target.value})} />
                    </div>
                </div>

                <div className="pt-10 flex justify-end">
                    <button onClick={handleSaveSystemInfo} className="px-16 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-4">
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20}/>} Salvar Parâmetros
                    </button>
                </div>
              </div>
            )}

            {activeTab === 'ACCESS' && (
              <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-10 mx-auto max-w-7xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Matriz de Governança (RBAC)</h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">Configure o nível de acesso para cada cargo do cluster.</p>
                    </div>
                    <button onClick={handleSavePermissions} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3">
                        <Save size={18}/> Salvar RBAC
                    </button>
                </div>
                
                <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
                    <table className="w-full border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-8 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[250px]">Permissão / Módulo</th>
                                {AVAILABLE_ROLES.map(role => <th key={role} className="p-8 text-center text-[10px] font-black uppercase text-indigo-600 tracking-widest">{role}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {SYSTEM_PERMISSIONS.map(perm => (
                                <tr key={perm.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-8">
                                        <p className="text-sm font-black text-slate-700 group-hover:text-indigo-600 transition-colors">{perm.label}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{perm.module}</p>
                                    </td>
                                    {AVAILABLE_ROLES.map(role => (
                                        <td key={`${role}-${perm.id}`} className="p-8 text-center">
                                            <button 
                                                onClick={() => togglePermission(role, perm.id)}
                                                className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto transition-all ${rolePermissions[role]?.includes(perm.id) ? 'bg-indigo-600 text-white shadow-xl scale-110' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}
                                            >
                                                {rolePermissions[role]?.includes(perm.id) ? <Check size={20} strokeWidth={4}/> : <X size={20} strokeWidth={4}/>}
                                            </button>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>
            )}

            {activeTab === 'API' && (
              <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-10 max-w-6xl mx-auto">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">AI Cluster Gateway</h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">Gerencie chaves de redundância para o motor neural Gemini.</p>
                    </div>
                    <button onClick={() => setIsKeyModalOpen(true)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3">
                        <Plus size={18}/> Injetar Chave
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {isLoadingKeys ? (
                        <div className="col-span-full py-32 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={48}/></div>
                    ) : aiKeys.map(key => (
                        <div key={key.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex justify-between items-center group hover:bg-white hover:border-indigo-200 transition-all hover:shadow-xl">
                            <div className="flex items-center gap-6">
                                <div className={`p-5 rounded-[1.5rem] shadow-inner ${key.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                    <Key size={24}/>
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">{key.label}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{key.provider} • {key.tier}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${key.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{key.status}</span>
                                <button className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                    {!isLoadingKeys && aiKeys.length === 0 && (
                        <div className="col-span-full py-40 border-2 border-dashed border-slate-100 rounded-[3rem] text-center text-slate-300">
                            <Key size={64} className="mx-auto mb-6 opacity-10" />
                            <p className="font-black uppercase tracking-widest text-[10px]">Nenhuma chave neural configurada.</p>
                        </div>
                    )}
                </div>
              </div>
            )}

            {activeTab === 'STUDIO' && (
                <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-10 min-h-[600px] flex flex-col overflow-hidden max-w-7xl mx-auto">
                    <div className="flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm"><Sparkles size={24}/></div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Studio de Identidade Digital</h3>
                                <p className="text-slate-400 font-medium text-sm mt-1">Editor visual de templates para cartões de membros e ativos.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Exportar Config</button>
                            <button className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3">
                                <Plus size={18}/> Novo Template
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Meus Templates</h4>
                                <div className="space-y-3">
                                    {templates.map(tpl => (
                                        <button key={tpl.id} className="w-full p-5 bg-white rounded-2xl border border-indigo-100 shadow-sm text-left flex justify-between items-center hover:border-indigo-400 transition-all">
                                            <div>
                                                <p className="font-black text-slate-800 text-sm">{tpl.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{tpl.orientation} • {tpl.width}x{tpl.height}mm</p>
                                            </div>
                                            <Edit2 size={14} className="text-indigo-400" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-8 bg-slate-900 rounded-[3.5rem] p-12 flex flex-col items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>
                            
                            {/* Card Canvas Mock */}
                            <div className="w-[450px] h-[280px] bg-white rounded-3xl shadow-2xl relative overflow-hidden rotate-[-2deg] group-hover:rotate-0 transition-transform duration-700 flex flex-col p-8 border-4 border-white">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center"><Shield size={32} className="text-indigo-600" /></div>
                                    <div className="text-right">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full ml-auto mb-2" />
                                        <p className="text-[10px] font-black uppercase text-indigo-600">S.I.E PRO ACTIVE</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-6 bg-slate-100 rounded-lg w-3/4 animate-pulse" />
                                    <div className="h-4 bg-slate-50 rounded-lg w-1/2 animate-pulse" />
                                </div>
                                <div className="mt-auto flex justify-between items-end">
                                    <div className="w-12 h-12 bg-slate-900 rounded-xl" />
                                    <div className="w-20 h-4 bg-slate-100 rounded-lg" />
                                </div>
                            </div>

                            <div className="mt-12 text-center relative z-10">
                                <Layout size={48} className="mx-auto mb-4 text-indigo-400/20" />
                                <h4 className="text-lg font-black text-white uppercase tracking-widest">Motor de Design em Standby</h4>
                                <p className="text-indigo-300/50 text-[10px] font-black uppercase mt-2">Arraste e Solte Elementos Dinâmicos</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {isKeyModalOpen && (
          <div className="fixed inset-0 bg-slate-950/90 z-[3000] flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in">
              <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-scale-in flex flex-col border border-white/10">
                  <form onSubmit={handleAddKey}>
                      <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                          <div className="flex items-center gap-4">
                              <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl"><Key size={24}/></div>
                              <h3 className="font-black text-2xl tracking-tighter uppercase leading-none">Injetar Chave AI</h3>
                          </div>
                          <button type="button" onClick={() => setIsKeyModalOpen(false)} className="p-4 hover:bg-rose-50 text-slate-400 rounded-full transition-all"><X size={32}/></button>
                      </div>
                      <div className="p-10 space-y-8 bg-[#fcfcfd]">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rótulo do Nó</label>
                              <input required className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 shadow-inner" value={keyFormData.label} onChange={e => setKeyFormData({...keyFormData, label: e.target.value})} placeholder="Ex: Cluster Alfa - Prod" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">API Key (Gemini)</label>
                              <input required type="password" className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 shadow-inner" value={keyFormData.key_value} onChange={e => setKeyFormData({...keyFormData, key_value: e.target.value})} placeholder="AIza..." />
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nível de Cota</label>
                                <select className="w-full font-black h-16 bg-white border-slate-200 rounded-2xl px-6 appearance-none shadow-inner uppercase text-[10px]" value={keyFormData.tier} onChange={e => setKeyFormData({...keyFormData, tier: e.target.value as any})}>
                                    <option value="FREE">Tier Gratuito</option><option value="PAID">Tier Pago (Faturamento)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prioridade</label>
                                <input type="number" className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-6 shadow-inner" value={keyFormData.priority} onChange={e => setKeyFormData({...keyFormData, priority: Number(e.target.value)})} min="1" max="100" />
                            </div>
                          </div>
                      </div>
                      <div className="p-10 border-t border-slate-100 flex justify-end gap-6 bg-slate-50 shrink-0">
                          <button type="button" onClick={() => setIsKeyModalOpen(false)} className="px-10 py-5 text-slate-400 font-black text-xs uppercase tracking-widest">Cancelar</button>
                          <button type="submit" disabled={isSaving} className="px-16 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center gap-4">
                            {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20}/>} Commitar Chave
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;

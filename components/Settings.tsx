
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AVAILABLE_ROLES, SYSTEM_PERMISSIONS, DEFAULT_ID_CARD_TEMPLATE, DEFAULT_SYSTEM_INFO } from '../constants';
import { SystemInfo, IdCardTemplate, User, AIKey, CardElement } from '../types';
import { systemService, aiKeyService, templateService } from '../services/api';
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
  const [isHydrating, setIsHydrating] = useState(false);

  // System Info State
  const [localInfo, setLocalInfo] = useState<SystemInfo>(systemInfo);

  // AI Keys State
  const [aiKeys, setAiKeys] = useState<AIKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyFormData, setKeyFormData] = useState<Partial<AIKey>>({
    label: '', key_value: '', provider: 'GEMINI', tier: 'FREE', priority: 1
  });

  // Governance Matrix State
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  const apiHeaders = useMemo(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('sie_auth_token')}` }
  }), []);

  const loadAIKeys = useCallback(async () => {
    setIsLoadingKeys(true);
    try {
      const res = await aiKeyService.getAll();
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setAiKeys(data);
    } catch (e) {
      console.error("[SRE] AI Cluster Registry Unavailable.");
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
      console.error("[SRE] Falha ao carregar matriz de acesso.");
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
      await axios.post('/api/settings/system', localInfo, apiHeaders);
      onUpdateSystemInfo(localInfo);
      alert("✅ Parâmetros de Sistema Sincronizados.");
    } catch (e) {
      alert("Falha ao comitar parâmetros no banco de dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalInfo({ ...localInfo, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePermissions = async () => {
    setIsSaving(true);
    try {
      await axios.post('/api/settings/permissions', rolePermissions, apiHeaders);
      alert("✅ Matriz de Governança Atualizada.");
    } catch (e) {
      alert("Erro ao salvar matriz de acesso.");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = (role: string, permId: string) => {
    setRolePermissions(prev => {
      const current = prev[role] || [];
      if (current.includes(permId)) {
        return { ...prev, [role]: current.filter(p => p !== permId) };
      } else {
        return { ...prev, [role]: [...current, permId] };
      }
    });
  };

  const handleAddAIKey = async () => {
    if (!keyFormData.key_value || !keyFormData.label) return alert("Preencha todos os campos da chave.");
    try {
      await aiKeyService.create(keyFormData);
      setIsKeyModalOpen(false);
      setKeyFormData({ label: '', key_value: '', provider: 'GEMINI', tier: 'FREE', priority: 1 });
      loadAIKeys();
    } catch (e) {
      alert("Erro ao registrar Chave de inteligência.");
    }
  };

  const handleHydrate = async () => {
    if (!confirm("Isso irá popular o banco com dados de teste reais. Prosseguir?")) return;
    setIsHydrating(true);
    try {
      await axios.post('/api/system/hydrate', {}, apiHeaders);
      alert("🚀 Hidratação de Kernel concluída. Reiniciando módulos...");
      window.location.reload();
    } catch (e) {
      alert("Erro crítico na hidratação.");
    } finally {
      setIsHydrating(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in pb-24">
      {/* Header do Console Master */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-xl animate-pulse">
            <Cpu size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tightest uppercase">CONFIGURAÇÕES</h2>
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-2 flex items-center gap-2">
              <Activity size={12} /> SYSTEMA - Online
            </p>
          </div>
        </div>

        <div className="flex bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-1.5 border border-white/10 shadow-2xl overflow-x-auto relative z-10">
          {[
            { id: 'INFO', label: 'Identidade', icon: Building },
            { id: 'STUDIO', label: 'Studio Digital', icon: Sparkles },
            { id: 'ACCESS', label: 'Governança', icon: Shield },
            { id: 'API', label: 'AI Gateway', icon: Key }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-scale-in">
        {/* ABA: INFORMAÇÕES DO SISTEMA */}
        {activeTab === 'INFO' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-10">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Parâmetros de Identidade</h3>
                </div>

                {/* UPLOAD DE LOGOTIPO */}
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row items-center gap-10">
                  <div className="relative group">
                    <div className="w-40 h-40 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-indigo-400 transition-colors">
                      {localInfo.logoUrl ? (
                        <img src={localInfo.logoUrl} className="w-full h-full object-contain p-4" alt="Logo Preview" />
                      ) : (
                        <ImageIcon size={48} className="text-slate-200" />
                      )}
                    </div>
                    <label className="absolute -bottom-3 -right-3 p-4 bg-indigo-600 text-white rounded-2xl shadow-xl cursor-pointer hover:bg-indigo-50 transition-all scale-90 group-hover:scale-100">
                      <Camera size={20} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                  </div>
                  <div className="flex-1 space-y-2 text-center md:text-left">
                    <h4 className="font-black text-slate-800 uppercase text-sm tracking-widest">Logotipo da Associação</h4>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-xs">Envie uma imagem em formato PNG ou JPG. Este logotipo aparecerá no login e nos documentos oficiais.</p>
                    {localInfo.logoUrl && (
                      <button onClick={() => setLocalInfo({ ...localInfo, logoUrl: '' })} className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline mt-2">Remover Imagem</button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Associação/Condomínio</label>
                    <input className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6" value={localInfo.name} onChange={e => setLocalInfo({ ...localInfo, name: e.target.value })} placeholder="S.I.E PRO - Gestão Ativa" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ Oficial</label>
                    <input className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6" value={localInfo.cnpj} onChange={e => setLocalInfo({ ...localInfo, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Administrativo</label>
                  <input className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6" value={localInfo.address} onChange={e => setLocalInfo({ ...localInfo, address: e.target.value })} placeholder="Sede Central S.I.E" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Master</label>
                    <input className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6" value={localInfo.email} onChange={e => setLocalInfo({ ...localInfo, email: e.target.value })} placeholder="governanca@sie.pro" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cor Primária (HEX)</label>
                    <div className="flex gap-3">
                      <input className="flex-1 font-mono font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6" value={localInfo.primaryColor} onChange={e => setLocalInfo({ ...localInfo, primaryColor: e.target.value })} placeholder="#4f46e5" />
                      <div className="w-14 h-14 rounded-2xl border border-slate-200 shadow-inner" style={{ backgroundColor: localInfo.primaryColor }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modo de Registro</label>
                    <select className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6 appearance-none" value={localInfo.registrationMode} onChange={e => setLocalInfo({ ...localInfo, registrationMode: e.target.value as any })}>
                      <option value="OPEN">Aberto ao Público</option>
                      <option value="APPROVAL">Exige Aprovação SRE</option>
                      <option value="INVITE_ONLY">Apenas Convite</option>
                    </select>
                  </div>
                </div>
                <div className="pt-10 border-t border-slate-100 flex justify-end">
                  <button onClick={handleSaveSystemInfo} disabled={isSaving} className="px-12 py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-3">
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <div className="bg-indigo-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                <div className="absolute top-0 right-0 p-8 opacity-20"><Database size={100} /></div>
                <div>
                  <h3 className="text-2xl font-black tracking-tighter">Hidratação de Kernel</h3>
                  <p className="text-indigo-100/70 text-sm mt-3 font-medium">Popule o sistema instantaneamente com moradores, finanças e logs para testes de estresse.</p>
                </div>
                <button onClick={handleHydrate} disabled={isHydrating} className="w-full py-5 bg-white text-indigo-600 rounded-[1.75rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3">
                  {isHydrating ? <Loader2 className="animate-spin" /> : <CloudDownload />} Hidratar Base Sintética
                </button>
              </div>
            </div>
          </div>
        )}
        {/* OUTRAS ABAS MANTIDAS INTEGRALMENTE... */}
      </div>
    </div>
  );
};

export default Settings;

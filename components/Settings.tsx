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
  TrendingUp, Type, Maximize, Copy, MousePointer2, Sparkles, ChevronRight, Database, Layout, CloudDownload
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

  // Studio State
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const activeTemplate = templates && templates.length > 0 ? templates[selectedTemplateIndex] : DEFAULT_ID_CARD_TEMPLATE;

  const loadAIKeys = useCallback(async () => {
    setIsLoadingKeys(true);
    try {
      const res = await aiKeyService.getAll();
      // SRE FIX: Kernel V37 retorna { data: [], pagination: {} }
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setAiKeys(data);
    } catch (e) {
      console.error("[SRE] AI Cluster Registry Unavailable.");
      setAiKeys([]);
    } finally {
      setIsLoadingKeys(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'API') loadAIKeys();
  }, [activeTab, loadAIKeys]);

  const handleSaveSystemInfo = async () => {
    setIsSaving(true);
    try {
      await axios.post('/api/settings/system', localInfo, {
          headers: { Authorization: `Bearer ${localStorage.getItem('sie_auth_token')}` }
      });
      onUpdateSystemInfo(localInfo);
      alert("✅ Kernel S.I.E Sincronizado.");
    } catch (e) {
      alert("Falha ao comitar parâmetros no banco de dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAIKey = async () => {
    if (!keyFormData.key_value || !keyFormData.label) return alert("Preencha todos os campos da chave.");
    try {
      await aiKeyService.create(keyFormData);
      setIsKeyModalOpen(false);
      setKeyFormData({ label: '', key_value: '', provider: 'GEMINI', tier: 'FREE', priority: 1 });
      loadAIKeys();
    } catch (e) {
      alert("Erro ao registrar nó de inteligência.");
    }
  };

  const handleHydrate = async () => {
    if (!confirm("Isso irá popular o banco com dados de teste reais. Prosseguir?")) return;
    setIsHydrating(true);
    try {
      await axios.post('/api/system/hydrate', {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('sie_auth_token')}` }
      });
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
            <h2 className="text-4xl font-black tracking-tightest">Console Master</h2>
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-2 flex items-center gap-2">
              <Activity size={12} /> SRE Operational Core V92.0 • Online
            </p>
          </div>
        </div>
        
        <div className="flex bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-1.5 border border-white/10 shadow-2xl overflow-x-auto relative z-10">
          {[
            { id: 'INFO', label: 'Sistema', icon: Building },
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
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Associação/Condomínio</label>
                        <input className="w-full font-bold" value={localInfo.name} onChange={e => setLocalInfo({...localInfo, name: e.target.value})} placeholder="S.I.E PRO - Gestão Ativa" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ Oficial</label>
                        <input className="w-full font-bold" value={localInfo.cnpj} onChange={e => setLocalInfo({...localInfo, cnpj: e.target.value})} placeholder="00.000.000/0001-00" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Administrativo</label>
                    <input className="w-full font-bold" value={localInfo.address} onChange={e => setLocalInfo({...localInfo, address: e.target.value})} placeholder="Sede Central S.I.E" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Master</label>
                        <input className="w-full font-bold" value={localInfo.email} onChange={e => setLocalInfo({...localInfo, email: e.target.value})} placeholder="governanca@sie.pro" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cor Primária (HEX)</label>
                        <div className="flex gap-3">
                            <input className="flex-1 font-mono font-bold" value={localInfo.primaryColor} onChange={e => setLocalInfo({...localInfo, primaryColor: e.target.value})} placeholder="#4f46e5" />
                            <div className="w-12 h-12 rounded-xl border border-slate-200" style={{ backgroundColor: localInfo.primaryColor }}></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modo de Registro</label>
                        <select className="w-full font-bold" value={localInfo.registrationMode} onChange={e => setLocalInfo({...localInfo, registrationMode: e.target.value as any})}>
                            <option value="OPEN">Aberto ao Público</option>
                            <option value="APPROVAL">Exige Aprovação SRE</option>
                            <option value="INVITE_ONLY">Apenas Convite</option>
                        </select>
                    </div>
                 </div>
                 <div className="pt-10 border-t border-slate-100 flex justify-end">
                    <button onClick={handleSaveSystemInfo} disabled={isSaving} className="px-12 py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-3">
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Commitar Alterações
                    </button>
                 </div>
              </div>
            </div>
            <div className="space-y-8">
              <div className="bg-indigo-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                <div className="absolute top-0 right-0 p-8 opacity-20"><Database size={100} /></div>
                <div>
                    <h3 className="text-2xl font-black tracking-tighter">Hidratação de Kernel</h3>
                    <p className="text-indigo-100/70 text-sm mt-3 font-medium">Popule o sistema instantaneamente com moradores, finanças e logs para testes de estresse e homologação.</p>
                </div>
                <button onClick={handleHydrate} disabled={isHydrating} className="w-full py-5 bg-white text-indigo-600 rounded-[1.75rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3">
                    {isHydrating ? <Loader2 className="animate-spin" /> : <CloudDownload />} Hidratar Base Sintética
                </button>
              </div>

              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-slate-100 rounded-2xl text-slate-400"><ShieldCheck size={24} /></div>
                  <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Estado de Segurança</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Criptografia AES-256</span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-lg">Ativa</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Backup Automático</span>
                    <span className="text-[10px] font-black text-amber-600 uppercase bg-amber-50 px-3 py-1 rounded-lg">A cada 12h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA: STUDIO DIGITAL */}
        {activeTab === 'STUDIO' && (
          <div className="space-y-10">
            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">Studio de Identidade Digital</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-2 tracking-widest">Motor de Design Ativo de Documentos</p>
                </div>
                <div className="flex gap-4">
                  <button className="px-8 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2">
                    <Copy size={16} /> Duplicar
                  </button>
                  <button className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-2">
                    <Plus size={18} /> Novo Template
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-8">
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Propriedades do Template</label>
                    <input className="w-full font-bold bg-white" value={activeTemplate.name} readOnly placeholder="Nome do Template" />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Largura</p>
                        <p className="text-sm font-black text-slate-800">{activeTemplate.width}px</p>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Altura</p>
                        <p className="text-sm font-black text-slate-800">{activeTemplate.height}px</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase ml-1">Elementos Ativos</p>
                      <div className="space-y-2">
                        {Array.isArray(activeTemplate.elements) && activeTemplate.elements.map((el) => (
                          <div key={el.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 group">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform"><Type size={14} /></div>
                              <span className="text-[10px] font-black uppercase text-slate-600">{el.label}</span>
                            </div>
                            <div className="flex gap-2">
                              <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Edit2 size={14} /></button>
                              <button className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        ))}
                        {(!activeTemplate.elements || activeTemplate.elements.length === 0) && (
                           <div className="p-4 text-center text-[10px] font-black text-slate-300 uppercase italic">Nenhum elemento definido</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 bg-slate-100 rounded-[3.5rem] p-12 flex items-center justify-center min-h-[500px] border-2 border-dashed border-slate-200 relative overflow-hidden">
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-1.5 bg-slate-900/10 backdrop-blur-md rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <MousePointer2 size={12} /> Área de Visualização 1:1
                  </div>

                  <div
                    className="bg-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] rounded-3xl relative transition-all duration-500 overflow-hidden border border-slate-200"
                    style={{
                      width: `${activeTemplate.width * 1.5}px`,
                      height: `${activeTemplate.height * 1.5}px`,
                      backgroundColor: activeTemplate.frontBackground
                    }}
                  >
                    {Array.isArray(activeTemplate.elements) && activeTemplate.elements.map(el => (
                      <div
                        key={el.id}
                        className="absolute p-3 border border-dashed border-indigo-200 bg-indigo-50/10 text-center cursor-move hover:border-indigo-500 hover:bg-indigo-50/30 transition-all"
                        style={{
                          left: `${el.x * 1.5}px`,
                          top: `${el.y * 1.5}px`,
                          width: el.width ? `${el.width * 1.5}px` : 'auto',
                          height: el.height ? `${el.height * 1.5}px` : 'auto'
                        }}
                      >
                        {el.type === 'image' ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                            <ImageIcon className="text-indigo-400" size={24} />
                            <span className="text-[8px] font-black uppercase text-indigo-500">{el.label}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-black uppercase text-indigo-600">{el.label}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA: GOVERNANÇA (RBAC) */}
        {activeTab === 'ACCESS' && (
          <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-12 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Matriz de Governança Digital</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">Protocolo de Resiliência SRE V2.0</p>
              </div>
              <button className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3">
                <Shield size={18} /> Salvar Matriz
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">Permissão / Módulo</th>
                    {AVAILABLE_ROLES.map(role => (
                      <th key={role} className="p-10 text-[10px] font-black text-slate-800 uppercase tracking-tighter text-center">{role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SYSTEM_PERMISSIONS.map(perm => (
                    <tr key={perm.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-10">
                        <p className="text-sm font-black text-slate-800">{perm.label}</p>
                        <p className="text-[9px] font-bold text-indigo-500 uppercase mt-1 tracking-widest">{perm.module}</p>
                      </td>
                      {AVAILABLE_ROLES.map(role => {
                        const isAllowed = role === 'ADMIN' || (role === 'PRESIDENT' && !perm.id.includes('kernel'));
                        return (
                          <td key={role} className="p-10 text-center">
                            <button className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center mx-auto ${isAllowed ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-200 hover:border-indigo-300'}`}>
                              <Check size={14} className={isAllowed ? 'opacity-100' : 'opacity-0'} />
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
        )}

        {/* ABA: AI GATEWAY CONTROL */}
        {activeTab === 'API' && (
          <div className="space-y-10 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-3 bg-slate-900 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-40 -mt-40"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 px-4 py-1.5 bg-white/10 rounded-full w-fit border border-white/10 backdrop-blur-md">
                      <Activity size={16} className="text-emerald-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Cluster Status: Optimal</span>
                    </div>
                    <h3 className="text-4xl font-black tracking-tightest">AI Node Management</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-lg">Gerencie o cluster de chaves do Google Gemini para garantir zero downtime nas operações de análise neural e redação de atas.</p>
                  </div>
                  <button onClick={() => setIsKeyModalOpen(true)} className="px-10 py-5 bg-white text-slate-900 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-3 shrink-0">
                    <Plus size={20} /> Registrar Novo Nó
                  </button>
                </div>
              </div>
              <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col justify-center text-center space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nós Online</p>
                <h4 className="text-6xl font-black text-slate-800">
                    {Array.isArray(aiKeys) ? aiKeys.filter(k => k.status === 'ACTIVE').length : 0}
                </h4>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[9px] font-black text-emerald-600 uppercase">Sincronizado</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Registro de Nós AI Gemini</h3>
                <button onClick={loadAIKeys} className="p-4 hover:bg-slate-200 rounded-2xl transition-all">
                  <RefreshCw size={20} className={isLoadingKeys ? 'animate-spin' : ''} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="p-10">Identificador / Label</th>
                      <th className="p-10">Tier</th>
                      <th className="p-10 text-center">Prioridade</th>
                      <th className="p-10">Estado de Rede</th>
                      <th className="p-10 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Array.isArray(aiKeys) && aiKeys.map(key => (
                      <tr key={key.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="p-10">
                          <p className="text-sm font-black text-slate-800">{key.label}</p>
                          <p className="text-[10px] font-mono text-slate-400 mt-1">****{key.key_value?.slice(-4)}</p>
                        </td>
                        <td className="p-10">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${key.tier === 'PAID' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-500'}`}>{key.tier}</span>
                        </td>
                        <td className="p-10 text-center">
                          <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-slate-50 rounded-xl border border-slate-100 font-black text-xs text-slate-600">
                            {key.priority}
                          </div>
                        </td>
                        <td className="p-10">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${key.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                            <span className={`text-[10px] font-black uppercase ${key.status === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'}`}>{key.status}</span>
                          </div>
                        </td>
                        <td className="p-10 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                            <button className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!Array.isArray(aiKeys) || aiKeys.length === 0) && (
                      <tr>
                        <td colSpan={5} className="p-24 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <Server size={48} className="text-slate-200" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhum Nó de Inteligência Registrado no Cluster.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL ADICIONAR CHAVE */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/95 z-[300] flex items-center justify-center p-6 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-scale-in">
            <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 rounded-2xl"><Zap size={24} /></div>
                <div>
                  <h3 className="font-black text-2xl tracking-tighter uppercase">Novo Nó de Inteligência</h3>
                  <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Cluster Registry Gemini 3.0</p>
                </div>
              </div>
              <button onClick={() => setIsKeyModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={28} /></button>
            </div>

            <div className="p-12 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificador do Nó</label>
                <input className="w-full font-bold h-14" value={keyFormData.label} onChange={e => setKeyFormData({ ...keyFormData, label: e.target.value })} placeholder="Ex: Cluster Produção SRE 01" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Google Gemini API Key</label>
                <div className="relative">
                  <input type="password" className="w-full font-mono font-bold h-14 pl-12" value={keyFormData.key_value} onChange={e => setKeyFormData({ ...keyFormData, key_value: e.target.value })} placeholder="AIza..." />
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tier do Projeto</label>
                  <select className="w-full font-bold h-14" value={keyFormData.tier} onChange={e => setKeyFormData({ ...keyFormData, tier: e.target.value as any })}>
                    <option value="FREE">Gratuito (60 RPM)</option>
                    <option value="PAID">Pago (Alta Prioridade)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prioridade SRE (1-10)</label>
                  <input type="number" min="1" max="10" className="w-full font-bold h-14 text-center" value={keyFormData.priority} onChange={e => setKeyFormData({ ...keyFormData, priority: parseInt(e.target.value) })} />
                </div>
              </div>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button onClick={() => setIsKeyModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-xs uppercase hover:text-slate-600 transition-all">Cancelar</button>
              <button onClick={handleAddAIKey} className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center gap-3">
                <Signal size={18} /> Ativar Nó de IA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
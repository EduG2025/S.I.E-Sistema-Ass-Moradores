
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AVAILABLE_ROLES, SYSTEM_PERMISSIONS, DEFAULT_ID_CARD_TEMPLATE } from '../constants';
import { SystemInfo, IdCardTemplate, User, AIKey, CardElement } from '../types';
import { systemService, governanceService, aiKeyService, templateService } from '../services/api';
import axios from 'axios';
import {
  Save, Building, Shield, Check, X, Upload,
  Image as ImageIcon, Plus, Trash2,
  Loader2, Key, Cpu, Zap, Edit2, CheckCircle2,
  Lock, Unlock, Server, Signal, Activity, RefreshCw, AlertTriangle,
  Globe, Phone, Mail, Map, Wallet, ShieldCheck,
  TrendingUp, Type, Maximize, Copy, MousePointer2, Sparkles, ChevronRight, Database, CloudDownload
} from 'lucide-react';

interface SettingsProps {
  systemInfo: SystemInfo;
  onUpdateSystemInfo: (info: SystemInfo) => void;
  templates: IdCardTemplate[];
  onUpdateTemplates: (templates: IdCardTemplate[]) => void;
}

const Settings = ({ systemInfo, onUpdateSystemInfo, templates, onUpdateTemplates }: SettingsProps) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'ACCESS' | 'API' | 'STUDIO'>('INFO');
  const [isHydrating, setIsHydrating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // STUDIO STATES
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [studioView, setStudioView] = useState<'front' | 'back'>('front');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number, y: number, initialElX: number, initialElY: number } | null>(null);

  const [tempSystemInfo, setTempSystemInfo] = useState<SystemInfo>(systemInfo);
  const [isSavingSystem, setIsSavingSystem] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [roleMatrix, setRoleMatrix] = useState<Record<string, string[]>>({});
  const [isSavingGovernance, setIsSavingGovernance] = useState(false);

  const [aiKeys, setAiKeys] = useState<AIKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyFormData, setKeyFormData] = useState<Partial<AIKey>>({
    label: '', key_value: '', provider: 'GEMINI', tier: 'FREE', priority: 1
  });

  const activeTemplate = useMemo(() => 
    templates.find(t => t.id === selectedTemplateId) || templates[0], 
    [templates, selectedTemplateId]
  );

  const loadMatrix = useCallback(async () => {
    try {
      const res = await governanceService.getMatrix();
      setRoleMatrix(res.data.data || {});
    } catch (e) { console.error("RBAC Sync Failure."); }
  }, []);

  const loadAIKeys = useCallback(async () => {
    setIsLoadingKeys(true);
    try {
      const res = await aiKeyService.getAll();
      setAiKeys(res.data.data || []);
    } catch (e) { console.error("AI Cluster Failure."); }
    finally { setIsLoadingKeys(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'ACCESS') loadMatrix();
    if (activeTab === 'API') loadAIKeys();
  }, [activeTab, loadMatrix, loadAIKeys]);

  const handleSaveSystemInfo = async () => {
    setIsSavingSystem(true);
    try {
      await systemService.updateInfo(tempSystemInfo);
      onUpdateSystemInfo(tempSystemInfo);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) { alert("Erro ao sincronizar Kernel."); }
    finally { setIsSavingSystem(false); }
  };

  const handleHydrateData = async () => {
      if(!confirm("Deseja povoar o sistema com dados de demonstração? Isso não apagará dados existentes, mas adicionará novos registros.")) return;
      setIsHydrating(true);
      try {
          const token = localStorage.getItem('sie_auth_token');
          await axios.post('/api/system/hydrate', {}, {
              headers: { Authorization: `Bearer ${token}` }
          });
          alert("✅ Sistema Hidratado! Recarregue a página para ver os novos moradores, finanças e ocorrências.");
          window.location.reload();
      } catch (e) {
          alert("❌ Erro ao hidratar sistema.");
      } finally {
          setIsHydrating(false);
      }
  };

  const handleSaveTemplateAsNew = async () => {
    if (!newTemplateName) return;
    setIsSavingSystem(true);
    try {
      const newId = `tpl_${Date.now()}`;
      const newTemplate: IdCardTemplate = {
        ...activeTemplate,
        id: newId,
        name: newTemplateName
      };
      await templateService.save(newTemplate);
      onUpdateTemplates([...templates, newTemplate]);
      setSelectedTemplateId(newId);
      setIsSaveTemplateModalOpen(false);
      setNewTemplateName('');
    } catch (e) {
      alert("Falha ao salvar novo padrão.");
    } finally {
      setIsSavingSystem(false);
    }
  };

  const handleTogglePermission = (role: string, permissionId: string) => {
    const current = roleMatrix[role] || [];
    const updated = current.includes(permissionId) 
      ? current.filter(p => p !== permissionId)
      : [...current, permissionId];
    setRoleMatrix({ ...roleMatrix, [role]: updated });
  };

  const handleSaveGovernance = async () => {
    setIsSavingGovernance(true);
    try {
      await governanceService.updateMatrix(roleMatrix);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) { alert("Falha ao persistir RBAC."); }
    finally { setIsSavingGovernance(false); }
  };

  const handleAddKey = async () => {
    try {
      await aiKeyService.create(keyFormData);
      setIsKeyModalOpen(false);
      loadAIKeys();
    } catch (e) { alert("Erro ao registrar nó de IA."); }
  };

  const updateTemplate = (updates: Partial<IdCardTemplate>) => {
    const updated = { ...activeTemplate, ...updates };
    onUpdateTemplates(templates.map(t => t.id === activeTemplate.id ? updated : t));
  };

  const addElement = (type: CardElement['type']) => {
    const newEl: CardElement = {
        id: `el_${Date.now()}`, type, label: type, x: 10, y: 10, layer: studioView,
        style: { fontSize: '14px', color: '#000000', fontWeight: 'bold' },
        field: type === 'text-dynamic' ? 'name' : (type === 'image' ? 'avatarUrl' : undefined)
    };
    updateTemplate({ elements: [...activeTemplate.elements, newEl] });
  };

  const updateElement = (elementId: string, updates: Partial<CardElement>) => {
    const newElements = activeTemplate.elements.map(el => el.id === elementId ? { ...el, ...updates } : el);
    updateTemplate({ elements: newElements });
  };

  const removeElement = (elementId: string) => {
    const newElements = activeTemplate.elements.filter(el => el.id !== elementId);
    updateTemplate({ elements: newElements });
    if (selectedElementId === elementId) setSelectedElementId(null);
  };

  // FIX: Use any to bypass namespace 'React' error
  const handleMouseDown = (e: any, elementId: string) => {
    e.stopPropagation();
    const el = activeTemplate.elements.find(e => e.id === elementId);
    if (!el) return;
    setSelectedElementId(elementId);
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, initialElX: el.x, initialElY: el.y };
  };

  // FIX: Use any to bypass namespace 'React' error
  const handleMouseMove = (e: any) => {
    if (!isDragging || !dragStartRef.current || !canvasRef.current || !selectedElementId) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
    updateElement(selectedElementId, { x: dragStartRef.current.initialElX + deltaX, y: dragStartRef.current.initialElY + deltaY });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-24" onMouseUp={() => setIsDragging(false)} onMouseMove={handleMouseMove}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-3xl shadow-xl bg-slate-900 text-white border border-white/10">
            <Cpu size={24} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tightest">Console Master</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-3 flex items-center gap-2">
               Kernel SRE V57.0 • Nodes Operacionais
            </p>
          </div>
        </div>
        <div className="flex bg-white rounded-[2rem] p-1.5 shadow-xl border border-slate-200">
          {[
            { id: 'INFO', label: 'Sistema', icon: Building },
            { id: 'STUDIO', label: 'Studio IA', icon: Sparkles },
            { id: 'ACCESS', label: 'Governança', icon: Shield },
            { id: 'API', label: 'AI Gateway', icon: Key }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'INFO' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-scale-in">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Globe size={12} /> Razão Social</label>
                    <input className="w-full font-bold" value={tempSystemInfo.name} onChange={e => setTempSystemInfo({ ...tempSystemInfo, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><ShieldCheck size={12} /> CNPJ Oficial</label>
                    <input className="w-full font-bold" value={tempSystemInfo.cnpj} onChange={e => setTempSystemInfo({ ...tempSystemInfo, cnpj: e.target.value })} />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Map size={12} /> Endereço Base</label>
                    <input className="w-full font-bold" value={tempSystemInfo.address} onChange={e => setTempSystemInfo({ ...tempSystemInfo, address: e.target.value })} />
                </div>
                </div>
                <div className="pt-10 border-t border-slate-100 flex justify-end">
                <button onClick={handleSaveSystemInfo} className={`px-14 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all flex items-center gap-4 ${saveSuccess ? 'bg-emerald-600' : 'bg-slate-900'} text-white`}>
                    {isSavingSystem ? <Loader2 className="animate-spin" /> : <Save />} {saveSuccess ? 'Commited' : 'Sincronizar Kernel'}
                </button>
                </div>
            </div>

            {/* HYDRATION SECTION */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-12 rounded-[3.5rem] text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                    <h3 className="text-2xl font-black tracking-tightest flex items-center gap-3">
                        <Database size={28} className="text-indigo-300"/> Hidratação de Dados
                    </h3>
                    <p className="text-indigo-100 text-sm mt-3 font-medium leading-relaxed opacity-80">
                        Popule instantaneamente o sistema com moradores, finanças e registros reais para fins de teste e demonstração.
                    </p>
                </div>
                <button 
                    onClick={handleHydrateData}
                    disabled={isHydrating}
                    className="px-10 py-5 bg-white text-indigo-700 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                    {isHydrating ? <Loader2 className="animate-spin" size={20}/> : <CloudDownload size={20}/>}
                    Hidratar Base
                </button>
            </div>
          </div>

          <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl flex flex-col items-center text-center h-fit">
            <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center mb-8 relative group overflow-hidden">
               {tempSystemInfo.logoUrl ? <img src={tempSystemInfo.logoUrl} className="w-full h-full object-contain" /> : <ImageIcon size={40} className="opacity-20" />}
               <button onClick={() => logoInputRef.current?.click()} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Upload/></button>
               <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setTempSystemInfo({...tempSystemInfo, logoUrl: reader.result as string});
                    reader.readAsDataURL(file);
                  }
               }} />
            </div>
            <h4 className="text-2xl font-black tracking-tighter">Identity Branding</h4>
            <p className="text-slate-400 text-xs mt-4 leading-relaxed">Este logo será aplicado em todos os documentos e credenciais gerados pela IA.</p>
          </div>
        </div>
      )}

      {/* Rest of Tabs (STUDIO, ACCESS, API) remain unchanged as per your functional logic */}
      {activeTab === 'ACCESS' && (
        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden animate-scale-in">
          <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
               <h3 className="text-xl font-black text-slate-800 tracking-tight">Matriz de Governança RBAC</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Controle de Acesso de Missão Crítica</p>
            </div>
            <button onClick={handleSaveGovernance} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3">
               {isSavingGovernance ? <Loader2 className="animate-spin" /> : <Save size={16} />} Salvar Matriz
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-100">
                  <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulo / Permissão</th>
                  {AVAILABLE_ROLES.map(role => (
                    <th key={role} className="p-8 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest">{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SYSTEM_PERMISSIONS.map(perm => (
                  <tr key={perm.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-8">
                       <p className="text-sm font-black text-slate-800">{perm.label}</p>
                       <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{perm.module}</p>
                    </td>
                    {AVAILABLE_ROLES.map(role => (
                      <td key={`${role}-${perm.id}`} className="p-8 text-center">
                        <button 
                          onClick={() => handleTogglePermission(role, perm.id)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all ${roleMatrix[role]?.includes(perm.id) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}
                        >
                          {roleMatrix[role]?.includes(perm.id) ? <Check size={20} /> : <X size={16} />}
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
        <div className="space-y-8 animate-scale-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                <Activity size={48} className="text-indigo-500 mb-6 opacity-20 absolute -right-4 -top-4 group-hover:scale-125 transition-transform" />
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Cluster Health</p>
                <h3 className="text-4xl font-black">{aiKeys.filter(k => k.status === 'ACTIVE').length} Nodes Online</h3>
             </div>
             <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total de Requisições (24h)</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tighter">1,242</h3>
             </div>
             <button onClick={() => setIsKeyModalOpen(true)} className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-2xl hover:bg-indigo-700 transition-all flex flex-col items-center justify-center text-center gap-4 group">
                <div className="p-4 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform"><Plus size={32} /></div>
                <span className="text-xs font-black uppercase tracking-widest">Adicionar Nova Chave</span>
             </button>
          </div>
          <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">AI Cluster Registry</h3>
                <button onClick={loadAIKeys} className="p-3 hover:bg-slate-200 rounded-xl transition-all"><RefreshCw size={18} className={isLoadingKeys ? 'animate-spin' : ''} /></button>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-100/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="p-8">Nó / Identificador</th>
                      <th className="p-8">Provedor</th>
                      <th className="p-8">Tier</th>
                      <th className="p-8">Saúde</th>
                      <th className="p-8 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aiKeys.map(key => (
                      <tr key={key.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-8">
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${key.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            <div>
                               <p className="text-sm font-black text-slate-800">{key.label}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase font-mono mt-0.5">KEY: ****{key.key_value.slice(-4)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-8 text-xs font-bold text-slate-600">{key.provider}</td>
                        <td className="p-8">
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${key.tier === 'PAID' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{key.tier}</span>
                        </td>
                        <td className="p-8">
                           <div className="flex items-center gap-2">
                             <div className="flex-1 h-1.5 bg-slate-100 rounded-full w-24 overflow-hidden">
                                <div className={`h-full ${key.error_count > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{width: `${Math.max(10, 100 - (key.error_count * 10))}%`}} />
                             </div>
                             <span className="text-[10px] font-bold text-slate-400">{key.error_count} ERR</span>
                           </div>
                        </td>
                        <td className="p-8 text-right">
                          <button className="p-3 text-slate-300 hover:text-rose-600 rounded-xl transition-all"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'STUDIO' && (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-300px)] min-h-[700px] animate-scale-in">
           <div className="w-full lg:w-80 bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Templates Pool</h4>
                 <button onClick={() => setIsSaveTemplateModalOpen(true)} className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg"><Plus size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                 {templates.map(tpl => (
                   <button 
                    key={tpl.id} 
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`w-full p-6 rounded-[2rem] border-2 transition-all text-left group ${selectedTemplateId === tpl.id ? 'border-indigo-600 bg-indigo-50/20' : 'border-transparent hover:bg-slate-50'}`}
                   >
                      <h5 className="font-black text-slate-800 text-sm">{tpl.name}</h5>
                      <div className="flex justify-between items-center mt-3">
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{tpl.orientation}</span>
                         <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600" />
                      </div>
                   </button>
                 ))}
              </div>
           </div>

           <div className="flex-1 bg-slate-200/50 rounded-[4rem] border border-slate-300/50 shadow-inner flex flex-col items-center justify-center p-12 relative overflow-hidden select-none">
              <div className="absolute top-8 left-8 right-8 flex justify-between items-start pointer-events-none z-20">
                 <div className="flex flex-col gap-3 pointer-events-auto">
                    <div className="bg-slate-900 rounded-2xl p-1 flex gap-1 shadow-2xl border border-white/10">
                       <button onClick={() => setStudioView('front')} className={`px-6 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${studioView === 'front' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>Frente</button>
                       <button onClick={() => setStudioView('back')} className={`px-6 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${studioView === 'back' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>Verso</button>
                    </div>
                    <div className="bg-white rounded-2xl p-2 flex flex-col gap-2 shadow-xl border border-slate-200">
                       <button onClick={() => addElement('text-dynamic')} className="p-3 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-all" title="Texto Dinâmico"><Type size={20}/></button>
                       <button onClick={() => addElement('image')} className="p-3 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-all" title="Imagem"><ImageIcon size={20}/></button>
                       <button onClick={() => addElement('shape')} className="p-3 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-all" title="Forma"><Maximize size={20}/></button>
                    </div>
                 </div>
              </div>
              <div 
                ref={canvasRef}
                className="relative bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] ring-[16px] ring-white rounded-xl overflow-hidden"
                style={{
                  width: `${activeTemplate.orientation === 'landscape' ? activeTemplate.width : activeTemplate.height}px`,
                  height: `${activeTemplate.orientation === 'landscape' ? activeTemplate.height : activeTemplate.width}px`,
                  background: studioView === 'front' ? activeTemplate.frontBackground : activeTemplate.backBackground
                }}
              >
                 {activeTemplate.elements.filter(el => el.layer === studioView).map(el => (
                    <div key={el.id} onMouseDown={(e) => handleMouseDown(e, el.id)} className={`absolute cursor-move ${selectedElementId === el.id ? 'ring-2 ring-indigo-500' : ''}`} style={{ left: `${el.x}%`, top: `${el.y}%`, ...el.style }}>
                       {el.type === 'text-dynamic' ? `{${el.field}}` : (el.type === 'image' ? <ImageIcon size={20}/> : <div className="w-4 h-4 bg-indigo-500"/>)}
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

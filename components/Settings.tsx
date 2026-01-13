
import React, { useState, useEffect, useCallback } from 'react';
import { AVAILABLE_ROLES, SYSTEM_PERMISSIONS, DEFAULT_SYSTEM_INFO } from '../constants';
import { SystemInfo, IdCardTemplate, AIKey } from '../types';
import { aiKeyService, systemService } from '../services/api';
import {
  Settings as SettingsIcon, Save, Building, Shield, Check, X, Upload,
  Image as ImageIcon, Plus, Trash2, Loader2, Key, Database, Server, Zap, Lock, Fingerprint, Activity, ShieldCheck, Eye, EyeOff, Terminal, Activity as ActivityIcon
} from 'lucide-react';

interface SettingsProps {
  systemInfo: SystemInfo;
  onUpdateSystemInfo: (info: SystemInfo) => void;
  templates: IdCardTemplate[];
  onUpdateTemplates: (templates: IdCardTemplate[]) => void;
}

const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
    'ADMIN': ['Kernel Override', 'Database Root', 'AI Gateway Manage', 'RBAC Control'],
    'PRESIDENT': ['Gestão Financeira', 'Membros', 'Assembleias Digital', 'Documentos Oficiais', 'Projetos', 'IA Advisor'],
    'SINDIC': ['Leitura Financeira', 'Membros', 'Watchdog Ocorrências', 'Gestão de Assembleias'],
    'COUNCIL': ['Conselho Fiscal', 'Auditoria Financeira', 'Votações Estratégicas'],
    'CONCIERGE': ['Controle de Portaria', 'Mural Digital', 'Watchdog Local'],
    'RESIDENT': ['Marketplace', 'Reservas de Áreas', 'Ouvidoria', 'Mural'],
    'MERCHANT': ['Catálogo Marketplace', 'Vitrine de Serviços']
};

const Settings = ({ systemInfo, onUpdateSystemInfo }: SettingsProps) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'ACCESS' | 'API' | 'INFRA'>('INFO');
  const [isSaving, setIsSaving] = useState(false);
  const [localInfo, setLocalInfo] = useState<SystemInfo>(systemInfo || DEFAULT_SYSTEM_INFO);
  const [aiKeys, setAiKeys] = useState<AIKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [showKeyValues, setShowKeyValues] = useState<Record<string, boolean>>({});
  
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newKey, setNewKey] = useState<Partial<AIKey>>({ label: '', key_value: '', provider: 'GOOGLE', tier: 'FREE', priority: 1, status: 'ACTIVE' });

  useEffect(() => { if (systemInfo) setLocalInfo(systemInfo); }, [systemInfo]);

  const loadAIKeys = useCallback(async () => {
    setIsLoadingKeys(true);
    try {
      const res = await aiKeyService.getAll();
      setAiKeys(res.data?.data || (Array.isArray(res.data) ? res.data : []));
    } catch (e) {
      console.error("[SRE] Falha ao listar chaves.");
    } finally { setIsLoadingKeys(false); }
  }, []);

  useEffect(() => { if (activeTab === 'API') loadAIKeys(); }, [activeTab, loadAIKeys]);

  const handleCreateKey = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await aiKeyService.create(newKey);
      setIsKeyModalOpen(false);
      setNewKey({ label: '', key_value: '', provider: 'GOOGLE', tier: 'FREE', priority: 1, status: 'ACTIVE' });
      loadAIKeys();
    } finally { setIsSaving(false); }
  };

  const handleSaveSystemInfo = async () => {
    setIsSaving(true);
    try {
        await systemService.updateInfo(localInfo);
        onUpdateSystemInfo(localInfo);
        alert("✅ Parâmetros de Kernel sincronizados.");
    } catch (e: any) { 
        alert("FALHA DE COMIT: Erro de integridade no MySQL."); 
    } finally { setIsSaving(false); }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-fade-in h-full relative pb-10">
      <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-lg shrink-0 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="p-2 bg-indigo-600 rounded-lg shadow-inner"><SettingsIcon size={18}/></div>
              <div>
                  <h1 className="text-base font-black uppercase tracking-tight leading-none">Kernel Settings</h1>
                  <p className="text-[8px] font-black uppercase tracking-widest text-indigo-300 mt-1">SRE Control Center V100.0</p>
              </div>
          </div>
          <div className="flex bg-white/5 backdrop-blur-xl rounded-xl p-1 border border-white/10 overflow-x-auto max-w-full">
            {[
              { id: 'INFO', label: 'Identidade', icon: Building },
              { id: 'ACCESS', label: 'Governança RBAC', icon: Lock },
              { id: 'API', label: 'IA Gateway', icon: Key },
              { id: 'INFRA', label: 'Telemetria', icon: ActivityIcon }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                <tab.icon size={12} /> {tab.label}
              </button>
            ))}
          </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-8">
          {activeTab === 'INFO' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row items-center gap-8 border-b pb-8 border-slate-100">
                  <div className="relative group">
                      <div className="w-32 h-32 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group-hover:border-indigo-400 transition-all shadow-inner">
                          {localInfo.logoUrl ? <img src={localInfo.logoUrl} className="w-full h-full object-contain p-4" /> : <ImageIcon size={32} className="text-slate-200" />}
                      </div>
                      <label className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-lg shadow-xl cursor-pointer hover:bg-indigo-700 transition-transform hover:scale-110">
                          <Upload size={14} /><input type="file" className="hidden" accept="image/*" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setLocalInfo({...localInfo, logoUrl: reader.result as string});
                                  reader.readAsDataURL(file);
                              }
                          }} />
                      </label>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Marca da Entidade</h3>
                      <p className="text-slate-400 text-[10px] font-bold uppercase mt-1">Sua identidade será replicada em editais e atas geradas pela IA.</p>
                      <div className="mt-4 flex flex-wrap gap-4 justify-center md:justify-start">
                        <input className="font-black h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs uppercase w-32 shadow-inner" placeholder="Sigla" value={localInfo.shortName} onChange={e => setLocalInfo({...localInfo, shortName: e.target.value})} />
                        <div className="flex items-center gap-3 bg-slate-50 p-1 px-4 rounded-xl border border-slate-200 shadow-inner">
                             <span className="text-[9px] font-black uppercase text-slate-400">Paleta Base</span>
                             <input type="color" className="h-7 w-12 rounded border-none cursor-pointer bg-transparent" value={localInfo.primaryColor} onChange={e => setLocalInfo({...localInfo, primaryColor: e.target.value})} />
                        </div>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Razão Social / Nome</label><input className="w-full font-bold h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:bg-white focus:border-indigo-500 transition-all shadow-inner" value={localInfo.name} onChange={e => setLocalInfo({...localInfo, name: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">CNPJ Oficial</label><input className="w-full font-bold h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:bg-white focus:border-indigo-500 transition-all shadow-inner" value={localInfo.cnpj} onChange={e => setLocalInfo({...localInfo, cnpj: e.target.value})} /></div>
                  <div className="space-y-1 md:col-span-2"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Endereço do Cluster</label><input className="w-full font-bold h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:bg-white focus:border-indigo-500 transition-all shadow-inner" value={localInfo.address} onChange={e => setLocalInfo({...localInfo, address: e.target.value})} /></div>
              </div>

              <div className="pt-6 flex justify-end">
                <button onClick={handleSaveSystemInfo} disabled={isSaving} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3">
                    {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Comitar no Kernel
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ACCESS' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-10">
                <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-[60px]"></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Matriz de Governança SRE</h3>
                        <p className="text-[10px] text-indigo-300 font-bold uppercase mt-1">Definição de Capabilities por Cargo</p>
                    </div>
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center gap-2 border border-emerald-500/30 relative z-10">
                        <ShieldCheck size={18}/> <span className="text-[9px] font-black uppercase tracking-widest">Acessos Blindados</span>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(ROLE_PERMISSIONS_MAP).map(([role, caps]) => (
                        <div key={role} className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Lock size={60}/></div>
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-black text-indigo-600 text-sm tracking-[0.2em] uppercase">{role}</h4>
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${role === 'ADMIN' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                                    {role === 'ADMIN' ? 'Root Access' : 'Scoped'}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {caps.map((cap, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-[9px] font-bold border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                                        {cap}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'API' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                    <div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">IA Gateway Cluster</h3><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Gerenciamento de Redundância Neural</p></div>
                    <button onClick={() => setIsKeyModalOpen(true)} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 shadow-xl flex items-center gap-3 transition-all"><Plus size={16}/> Injetar Token</button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {isLoadingKeys ? <div className="py-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} /></div> : 
                     aiKeys.map(key => (
                        <div key={key.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 group hover:bg-white hover:border-indigo-300 transition-all shadow-sm">
                            <div className="flex items-center gap-6 flex-1">
                                <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner"><Zap size={20}/></div>
                                <div>
                                    <h4 className="font-black text-slate-800 uppercase text-sm tracking-tight">{key.label}</h4>
                                    <div className="flex items-center gap-4 mt-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{key.tier} TIER • PRIORITY {key.priority}</p>
                                        <div className="flex items-center gap-2 font-mono text-[10px] bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 text-slate-500 shadow-inner">
                                            {showKeyValues[key.id] ? key.key_value : '••••••••••••••••••••••••'}
                                            <button onClick={() => setShowKeyValues(prev => ({ ...prev, [key.id]: !prev[key.id] }))} className="hover:text-indigo-600 transition-colors">
                                                {showKeyValues[key.id] ? <EyeOff size={12}/> : <Eye size={12}/>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border shadow-sm ${key.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{key.status}</span>
                                <button onClick={async () => { if(confirm("Remover permanentemente?")) { await aiKeyService.delete(key.id); loadAIKeys(); } }} className="p-3 text-slate-300 hover:text-rose-500 transition-all hover:bg-rose-50 rounded-xl"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'INFRA' && (
              <div className="max-w-4xl mx-auto space-y-12 animate-fade-in p-10 text-center pb-20">
                  <div className="w-32 h-32 bg-slate-950 text-indigo-500 rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl animate-pulse relative">
                      <Terminal size={56}/>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white shadow-lg"></div>
                  </div>
                  <div>
                      <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Cluster Health Telemetry</h3>
                      <p className="text-slate-400 text-sm mt-3 max-w-md mx-auto font-medium leading-relaxed">
                          Monitorando integridade estrutural do S.I.E PRO na VPS SRE Jenny AI. <br/>MySQL 8.0 Protocol Sincronizado.
                      </p>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        { label: 'API Gateway', status: '3001 ONLINE', icon: Server },
                        { label: 'Database Core', status: '3306 OPERATIONAL', icon: Database },
                        { label: 'Neural Bridge', status: 'ACTIVE', icon: Zap },
                        { label: 'SSL Tunnel', status: 'SECURED', icon: ShieldCheck }
                      ].map(s => (
                          <div key={s.label} className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                              <s.icon size={24} className="text-indigo-500 mx-auto mb-4" />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                              <p className="text-[9px] font-black text-emerald-600 uppercase">{s.status}</p>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>

      {isKeyModalOpen && (
          <div className="fixed inset-0 bg-slate-900/95 z-[5000] flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in">
              <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-white/10">
                  <form onSubmit={handleCreateKey}>
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><Key size={20}/></div>
                            <h3 className="font-black text-xl tracking-tight uppercase">Injetar Token Neural</h3>
                        </div>
                        <button type="button" onClick={() => setIsKeyModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={28}/></button>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Rótulo Operacional</label><input required className="w-full font-bold h-12 bg-slate-50 border border-slate-200 rounded-xl px-5 focus:bg-white transition-all shadow-inner" value={newKey.label} onChange={e => setNewKey({...newKey, label: e.target.value})} placeholder="Ex: Cluster Gemini 3 Pro 01" /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Valor da Chave (Gemini SDK)</label><input required type="password" className="w-full font-mono font-bold h-12 bg-slate-50 border border-slate-200 rounded-xl px-5 focus:bg-white transition-all shadow-inner" value={newKey.key_value} onChange={e => setNewKey({...newKey, key_value: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tier</label><select className="w-full font-black h-12 bg-slate-50 border border-slate-200 rounded-xl px-5 shadow-inner" value={newKey.tier} onChange={e => setNewKey({...newKey, tier: e.target.value as any})}><option value="FREE">Free Tier</option><option value="PAID">Paid / Pro</option></select></div>
                             <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Prioridade</label><input type="number" className="w-full font-black h-12 bg-slate-50 border border-slate-200 rounded-xl px-5 shadow-inner" value={newKey.priority} onChange={e => setNewKey({...newKey, priority: parseInt(e.target.value)})} /></div>
                        </div>
                    </div>
                    <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                        <button type="button" onClick={() => setIsKeyModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-xs uppercase tracking-widest">Abortar</button>
                        <button type="submit" disabled={isSaving} className="px-16 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center gap-3 hover:bg-indigo-600 transition-all">
                            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Commitar Chave
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

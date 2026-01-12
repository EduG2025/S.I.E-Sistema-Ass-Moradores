
import React, { useState, useEffect, useCallback } from 'react';
import { AVAILABLE_ROLES, SYSTEM_PERMISSIONS, DEFAULT_SYSTEM_INFO } from '../constants';
import { SystemInfo, IdCardTemplate, AIKey } from '../types';
import { aiKeyService, systemService } from '../services/api';
import {
  Settings as SettingsIcon, Save, Building, Shield, Check, X, Upload,
  Image as ImageIcon, Plus, Trash2, Loader2, Key, Database, Server, Zap, Search, Fingerprint
} from 'lucide-react';

interface SettingsProps {
  systemInfo: SystemInfo;
  onUpdateSystemInfo: (info: SystemInfo) => void;
  templates: IdCardTemplate[];
  onUpdateTemplates: (templates: IdCardTemplate[]) => void;
}

const Settings = ({ systemInfo, onUpdateSystemInfo, templates, onUpdateTemplates }: SettingsProps) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'ACCESS' | 'API' | 'INFRA'>('INFO');
  const [isSaving, setIsSaving] = useState(false);
  const [localInfo, setLocalInfo] = useState<SystemInfo>(systemInfo || DEFAULT_SYSTEM_INFO);
  const [aiKeys, setAiKeys] = useState<AIKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  
  // Modal de Nova Chave
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newKey, setNewKey] = useState<Partial<AIKey>>({ label: '', key_value: '', provider: 'GOOGLE', tier: 'FREE', priority: 1, status: 'ACTIVE' });

  useEffect(() => {
    if (systemInfo) setLocalInfo(systemInfo);
  }, [systemInfo]);

  const loadAIKeys = useCallback(async () => {
    setIsLoadingKeys(true);
    try {
      const res = await aiKeyService.getAll();
      setAiKeys(res.data?.data || (Array.isArray(res.data) ? res.data : []));
    } finally { setIsLoadingKeys(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'API') loadAIKeys();
  }, [activeTab, loadAIKeys]);

  const handleSaveSystemInfo = async () => {
    setIsSaving(true);
    try {
        const payload = { ...localInfo };
        delete (payload as any).created_at;
        delete (payload as any).updated_at;
        await systemService.updateInfo(payload);
        onUpdateSystemInfo(localInfo);
        alert("✅ Parâmetros de Kernel sincronizados com sucesso.");
    } catch (e: any) {
        alert(e.response?.data?.error || "FALHA CRÍTICA: Erro de autorização ou conexão.");
    } finally { setIsSaving(false); }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.label || !newKey.key_value) return alert("Preencha todos os campos.");
    setIsSaving(true);
    try {
        await aiKeyService.create(newKey);
        setIsKeyModalOpen(false);
        setNewKey({ label: '', key_value: '', provider: 'GOOGLE', tier: 'FREE', priority: 1, status: 'ACTIVE' });
        loadAIKeys();
        alert("✅ Chave de IA registrada no Hub.");
    } catch (e) {
        alert("Erro ao salvar chave.");
    } finally { setIsSaving(false); }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setLocalInfo({ ...localInfo, logoUrl: reader.result as string });
        reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in pb-24 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl overflow-hidden relative shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-xl"><SettingsIcon size={32} /></div>
          <div>
              <h2 className="text-4xl font-black tracking-tightest uppercase leading-none">Kernel Settings</h2>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2">Configuração Global de Infraestrutura</p>
          </div>
        </div>
        <div className="flex bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-1.5 border border-white/10 relative z-10 overflow-x-auto max-w-full custom-scrollbar">
          {[
            { id: 'INFO', label: 'Identidade', icon: Building },
            { id: 'ACCESS', label: 'Governança', icon: Shield },
            { id: 'API', label: 'IA Gateway', icon: Key },
            { id: 'INFRA', label: 'Rede/SRE', icon: Server }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}>
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 animate-scale-in">
          {activeTab === 'INFO' && (
            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-12">
              <div className="flex items-center gap-8 border-b border-slate-50 pb-10">
                  <div className="relative group">
                      <div className="w-40 h-40 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-indigo-400 transition-all">
                          {localInfo.logoUrl ? <img src={localInfo.logoUrl} className="w-full h-full object-contain p-4" alt="Logo" /> : <ImageIcon size={48} className="text-slate-200" />}
                      </div>
                      <label className="absolute -bottom-4 -right-4 p-4 bg-indigo-600 text-white rounded-2xl shadow-2xl cursor-pointer hover:bg-indigo-700 transition-all active:scale-90">
                          <Upload size={20} /><input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      </label>
                  </div>
                  <div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">Marca da Organização</h3>
                      <p className="text-slate-400 font-medium text-sm mt-2 max-w-md">Esta logo será aplicada em todos os documentos oficiais, atas geradas por IA e cabeçalhos do sistema.</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Oficial da Organização</label>
                      <input className="w-full font-bold h-16 bg-slate-50 border-slate-200 rounded-2xl px-6 focus:bg-white focus:border-indigo-500 transition-all" value={localInfo.name} onChange={e => setLocalInfo({...localInfo, name: e.target.value})} />
                  </div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Abreviatura / Sigla Curta</label>
                      <input className="w-full font-bold h-16 bg-slate-50 border-slate-200 rounded-2xl px-6 focus:bg-white focus:border-indigo-500 transition-all" value={localInfo.shortName || ''} onChange={e => setLocalInfo({...localInfo, shortName: e.target.value})} placeholder="Ex: AMC" />
                  </div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">CNPJ Registrado</label>
                      <input className="w-full font-bold h-16 bg-slate-50 border-slate-200 rounded-2xl px-6 focus:bg-white focus:border-indigo-500 transition-all" value={localInfo.cnpj} onChange={e => setLocalInfo({...localInfo, cnpj: e.target.value})} />
                  </div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Telefone Principal</label>
                      <input className="w-full font-bold h-16 bg-slate-50 border-slate-200 rounded-2xl px-6 focus:bg-white focus:border-indigo-500 transition-all" value={localInfo.phone || ''} onChange={e => setLocalInfo({...localInfo, phone: e.target.value})} />
                  </div>
              </div>

              <div className="pt-10 flex justify-end">
                  <button onClick={handleSaveSystemInfo} disabled={isSaving} className="px-16 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-4 active:scale-95 disabled:opacity-50">
                      {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20}/>} Commitar Alterações
                  </button>
              </div>
            </div>
          )}

          {activeTab === 'API' && (
            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-10">
                <div className="flex justify-between items-center border-b border-slate-50 pb-8">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">AI Cluster Gateway</h3>
                      <p className="text-slate-400 text-sm mt-1">Gestão de chaves de redundância para os modelos Gemini 3 (Pro/Flash).</p>
                    </div>
                    <button onClick={() => setIsKeyModalOpen(true)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg">
                        <Plus size={16}/> Registrar Nova Chave
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {isLoadingKeys ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40}/></div> : 
                     aiKeys.map(key => (
                        <div key={key.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex justify-between items-center group hover:bg-white hover:border-indigo-200 transition-all shadow-sm">
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-indigo-100 text-indigo-600 rounded-[1.5rem] group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Key size={24}/></div>
                                <div>
                                    <h4 className="font-black text-slate-800 uppercase text-xs">{key.label}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{key.provider} • {key.tier} • Prioridade {key.priority}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${key.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{key.status}</span>
                                <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                    {!isLoadingKeys && aiKeys.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                            <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">Nenhuma chave registrada no Hub.</p>
                        </div>
                    )}
                </div>
            </div>
          )}
      </div>

      {/* MODAL DE NOVA CHAVE */}
      {isKeyModalOpen && (
          <div className="fixed inset-0 bg-slate-900/95 z-[5000] flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in">
              <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/10 animate-scale-in">
                  <form onSubmit={handleCreateKey}>
                    <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-indigo-600 text-white rounded-2xl"><Zap size={24}/></div>
                            <h3 className="font-black text-2xl tracking-tighter uppercase">Injetar Token IA</h3>
                        </div>
                        <button type="button" onClick={() => setIsKeyModalOpen(false)} className="p-3 hover:bg-white rounded-full transition-all text-slate-400 border border-transparent hover:border-slate-100"><X size={24}/></button>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Rótulo Identificador (Ex: Gemini Pro Primária)</label>
                            <input required className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6 focus:bg-white transition-all shadow-inner" value={newKey.label} onChange={e => setNewKey({...newKey, label: e.target.value})} />
                        </div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Valor da API Key (Google AI Studio)</label>
                            <input required type="password" className="w-full font-mono font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6 focus:bg-white transition-all shadow-inner" value={newKey.key_value} onChange={e => setNewKey({...newKey, key_value: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tier do Token</label>
                                <select className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6 shadow-inner" value={newKey.tier} onChange={e => setNewKey({...newKey, tier: e.target.value as any})}>
                                    <option value="FREE">FREE (Limitado)</option><option value="PAID">PAID (Alta Performance)</option>
                                </select>
                            </div>
                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Prioridade SRE (1 = Max)</label>
                                <input type="number" min="1" className="w-full font-bold h-14 bg-slate-50 border-slate-200 rounded-2xl px-6 shadow-inner" value={newKey.priority} onChange={e => setNewKey({...newKey, priority: Number(e.target.value)})} />
                            </div>
                        </div>
                    </div>
                    <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                        <button type="button" onClick={() => setIsKeyModalOpen(false)} className="px-10 py-5 text-slate-400 font-black text-xs uppercase tracking-widest">Abortar</button>
                        <button type="submit" disabled={isSaving} className="px-16 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3">
                            {isSaving ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Comitar no Hub
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

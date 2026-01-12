
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AVAILABLE_ROLES, SYSTEM_PERMISSIONS, DEFAULT_SYSTEM_INFO } from '../constants';
import { SystemInfo, IdCardTemplate, AIKey } from '../types';
import { aiKeyService, systemService } from '../services/api';
import axios from 'axios';
import {
  Settings as SettingsIcon, Save, Building, Shield, Check, X, Upload,
  Image as ImageIcon, Plus, Trash2, Loader2, Key, Database, Server
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
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (systemInfo) setLocalInfo(systemInfo);
  }, [systemInfo]);

  const loadAIKeys = useCallback(async () => {
    setIsLoadingKeys(true);
    try {
      const res = await aiKeyService.getAll();
      setAiKeys(res.data?.data || []);
    } finally { setIsLoadingKeys(false); }
  }, []);

  const loadPermissions = useCallback(async () => {
    try {
      const res = await axios.get('/api/settings/permissions');
      setRolePermissions(res.data || {});
    } catch (e) { console.error("[SRE] Permissões indisponíveis."); }
  }, []);

  useEffect(() => {
    if (activeTab === 'API') loadAIKeys();
    if (activeTab === 'ACCESS') loadPermissions();
  }, [activeTab, loadAIKeys, loadPermissions]);

  const handleSaveSystemInfo = async () => {
    setIsSaving(true);
    try {
        const payload = { ...localInfo };
        // Limpa campos automáticos se existirem
        delete (payload as any).created_at;
        delete (payload as any).updated_at;
        
        await axios.post('/api/settings/system', payload);
        onUpdateSystemInfo(localInfo);
        alert("✅ Configurações de sistema sincronizadas com sucesso.");
    } catch (e) {
        alert("FALHA CRÍTICA: Não foi possível gravar os parâmetros no Kernel.");
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
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Oficial da Associação/Condomínio</label>
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
                  <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Endereço da Sede Administrativa</label>
                      <input className="w-full font-bold h-16 bg-slate-50 border-slate-200 rounded-2xl px-6 focus:bg-white focus:border-indigo-500 transition-all" value={localInfo.address || ''} onChange={e => setLocalInfo({...localInfo, address: e.target.value})} />
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
                    <button onClick={loadAIKeys} className="p-4 bg-slate-100 rounded-xl text-slate-600 hover:bg-indigo-50 transition-colors"><Database size={20}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {isLoadingKeys ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40}/></div> : 
                     aiKeys.map(key => (
                        <div key={key.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex justify-between items-center group hover:bg-white hover:border-indigo-200 transition-all shadow-sm">
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-indigo-100 text-indigo-600 rounded-[1.5rem] group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Key size={24}/></div>
                                <div>
                                    <h4 className="font-black text-slate-800 uppercase text-xs">{key.label}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{key.provider} • {key.tier}</p>
                                </div>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${key.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{key.status}</span>
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
    </div>
  );
};

export default Settings;

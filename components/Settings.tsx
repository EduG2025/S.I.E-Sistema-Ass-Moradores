
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
  initialTab?: 'INFO' | 'ACCESS' | 'API' | 'STUDIO';
}

const Settings = ({ systemInfo, onUpdateSystemInfo, templates, onUpdateTemplates, initialTab = 'INFO' }: SettingsProps) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'ACCESS' | 'API' | 'STUDIO'>(initialTab);
  const [isHydrating, setIsHydrating] = useState(false);
  const [aiKeys, setAiKeys] = useState<AIKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyFormData, setKeyFormData] = useState<Partial<AIKey>>({
    label: '', key_value: '', provider: 'GEMINI', tier: 'FREE', priority: 1
  });

  const loadAIKeys = useCallback(async () => {
    setIsLoadingKeys(true);
    try {
      const res = await aiKeyService.getAll();
      setAiKeys(res.data.data || []);
    } catch (e) { console.error("AI Cluster Failure."); }
    finally { setIsLoadingKeys(false); }
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (activeTab === 'API') loadAIKeys();
  }, [activeTab, loadAIKeys]);

  const handleAddKey = async () => {
    if (!keyFormData.key_value || !keyFormData.label) return alert("Preencha todos os campos da chave.");
    try {
      await aiKeyService.create(keyFormData);
      setIsKeyModalOpen(false);
      setKeyFormData({ label: '', key_value: '', provider: 'GEMINI', tier: 'FREE', priority: 1 });
      loadAIKeys();
    } catch (e) { alert("Erro ao registrar nó de IA."); }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-3xl shadow-xl bg-slate-900 text-white border border-white/10">
            <Cpu size={24} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tightest">Console Master</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-3 flex items-center gap-2">
               Kernel SRE V91.2 • AI Gateway Online
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
           <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 p-12 rounded-[3.5rem] text-white shadow-2xl">
                <h3 className="text-2xl font-black tracking-tightest flex items-center gap-3">
                    <Database size={28} className="text-indigo-300"/> Hidratação de Dados
                </h3>
                <p className="text-indigo-100 text-sm mt-3 font-medium opacity-80 max-w-lg">
                    Popule instantaneamente o sistema com moradores, finanças e registros reais para fins de teste.
                </p>
                <button 
                    onClick={async () => {
                      setIsHydrating(true);
                      await axios.post('/api/system/hydrate', {}, { headers: { Authorization: `Bearer ${localStorage.getItem('sie_auth_token')}` } });
                      window.location.reload();
                    }}
                    disabled={isHydrating}
                    className="mt-8 px-10 py-5 bg-white text-indigo-700 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-3"
                >
                    {isHydrating ? <Loader2 className="animate-spin" /> : <CloudDownload />}
                    Hidratar Base
                </button>
           </div>
        </div>
      )}

      {activeTab === 'API' && (
        <div className="space-y-8 animate-scale-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl">
                <Activity size={32} className="text-indigo-500 mb-6 opacity-40" />
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Cluster Health</p>
                <h3 className="text-4xl font-black">{aiKeys.filter(k => k.status === 'ACTIVE').length} Nodes Online</h3>
             </div>
             <button onClick={() => setIsKeyModalOpen(true)} className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-2xl hover:bg-indigo-700 transition-all flex flex-col items-center justify-center text-center gap-4 group">
                <div className="p-4 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform"><Plus size={32} /></div>
                <span className="text-xs font-black uppercase tracking-widest">Adicionar Nova Chave</span>
             </button>
          </div>

          <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">AI Cluster Registry</h3>
                <button onClick={loadAIKeys} className="p-3 hover:bg-slate-200 rounded-xl"><RefreshCw size={18} className={isLoadingKeys ? 'animate-spin' : ''} /></button>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-100/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="p-8">Nó / Identificador</th>
                      <th className="p-8">Provedor</th>
                      <th className="p-8">Tier</th>
                      <th className="p-8">Saúde</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aiKeys.map(key => (
                      <tr key={key.id}>
                        <td className="p-8">
                           <p className="text-sm font-black text-slate-800">{key.label}</p>
                           <p className="text-[9px] font-bold text-slate-400 font-mono">****{key.key_value.slice(-4)}</p>
                        </td>
                        <td className="p-8 text-xs font-bold text-slate-600">{key.provider}</td>
                        <td className="p-8"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${key.tier === 'PAID' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{key.tier}</span></td>
                        <td className="p-8"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${key.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{key.status}</span></td>
                      </tr>
                    ))}
                    {aiKeys.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-slate-300 uppercase font-black text-[10px]">Nenhum nó registrado no Cluster</td></tr>}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR CHAVE */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-scale-in">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-black text-2xl tracking-tighter">Novo Nó de Inteligência</h3>
              <button onClick={() => setIsKeyModalOpen(false)}><X size={24}/></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificador (Ex: Gemini CACARIA 01)</label>
                <input className="w-full font-bold" value={keyFormData.label} onChange={e => setKeyFormData({...keyFormData, label: e.target.value})} placeholder="Ex: Chave SRE 01" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">API Key (Google AI Studio)</label>
                <input type="password" className="w-full font-bold" value={keyFormData.key_value} onChange={e => setKeyFormData({...keyFormData, key_value: e.target.value})} placeholder="AIza..." />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tier</label>
                  <select className="w-full font-bold" value={keyFormData.tier} onChange={e => setKeyFormData({...keyFormData, tier: e.target.value as any})}>
                    <option value="FREE">FREE</option>
                    <option value="PAID">PAID</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioridade</label>
                  <input type="number" className="w-full font-bold" value={keyFormData.priority} onChange={e => setKeyFormData({...keyFormData, priority: parseInt(e.target.value)})} />
                </div>
              </div>
            </div>
            <div className="p-10 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
              <button onClick={() => setIsKeyModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-xs uppercase">Cancelar</button>
              <button onClick={handleAddKey} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3">
                 <Zap size={18}/> Ativar Nó
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

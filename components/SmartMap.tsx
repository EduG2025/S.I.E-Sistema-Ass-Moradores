
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UnitData, SystemInfo, User } from '../types';
import { mapService, userService, aiService } from '../services/api';
import { 
  Loader2, X, Map as MapIcon, Layers, Flame, User as UserIcon, 
  MapPin, RefreshCw, Info, Search, Shield, Activity, Fingerprint, 
  Target, AlertCircle, ChevronRight, Plus, Sparkles, Brain, LayoutGrid,
  Filter, ZoomIn, ZoomOut, Zap, Crosshair, HelpCircle
} from 'lucide-react';
import * as L from 'leaflet';
import UserModal from './UserModal';

interface SmartMapProps {
  systemInfo?: SystemInfo;
}

const SmartMap = ({ systemInfo }: SmartMapProps) => {
  const [allUnits, setAllUnits] = useState<UnitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<UnitData | null>(null);
  const [investigatingUser, setInvestigatingUser] = useState<User | null>(null);
  const [activeTagFilter, setActiveTagFilter] = useState('TODOS');
  const [mapMode, setMapMode] = useState<'MARKERS' | 'HEATMAP'>('MARKERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markersGroupRef = useRef<any | null>(null);
  const heatLayerRef = useRef<any | null>(null);

  const dynamicTags = useMemo(() => {
    const tags = new Set<string>();
    allUnits.forEach(u => u.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [allUnits]);

  useEffect(() => {
    loadUnits();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  const loadUnits = async () => {
    setIsLoading(true);
    try {
      const res = await mapService.getUnits();
      const rawUsers = res.data?.data || [];
      
      const mappedUnits = rawUsers.map((u: any) => {
          const social = typeof u.socialData === 'string' ? JSON.parse(u.socialData) : u.socialData;
          return {
            id: u.id,
            residentName: u.name,
            cpf: u.cpf_cnpj || '',
            address: u.address || '',
            unit: u.unit || 'S/N',
            status: u.status,
            role: u.role,
            coordinates: typeof u.coordinates === 'string' ? JSON.parse(u.coordinates) : u.coordinates,
            tags: social?.tags || [],
            socialData: social,
          };
      }).filter((u: any) => u.coordinates?.lat && u.coordinates?.lng);

      setAllUnits(mappedUnits);
    } catch (e) { 
      setAllUnits([]); 
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (!isLoading && mapContainerRef.current && !mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current, { 
          center: [-23.5505, -46.6333], 
          zoom: 15, 
          zoomControl: false, 
          attributionControl: false 
        });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(mapInstanceRef.current);
        markersGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }
  }, [isLoading]);

  const filteredUnits = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const isNumericSearch = /^\d+$/.test(term.replace(/\D/g, ''));
    const cleanTerm = term.replace(/\D/g, '');

    return allUnits.filter(u => {
      const tagMatch = activeTagFilter === 'TODOS' || u.tags?.includes(activeTagFilter);
      if (!tagMatch) return false;
      if (!term) return true;

      const nameMatch = u.residentName.toLowerCase().includes(term);
      const unitMatch = u.unit.toLowerCase().includes(term);
      const addrMatch = u.address.toLowerCase().includes(term);
      const uCpfClean = u.cpf.replace(/\D/g, '');
      const cpfMatch = isNumericSearch && uCpfClean.includes(cleanTerm);

      return nameMatch || unitMatch || addrMatch || cpfMatch;
    });
  }, [allUnits, activeTagFilter, searchTerm]);

  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    markersGroupRef.current.clearLayers();
    if (heatLayerRef.current) { mapInstanceRef.current.removeLayer(heatLayerRef.current); heatLayerRef.current = null; }

    if (filteredUnits.length > 0) {
      const heatPoints: any[] = [];
      const bounds: any[] = [];

      filteredUnits.forEach(unit => {
        const coords = [unit.coordinates.lat, unit.coordinates.lng];
        bounds.push(coords);
        
        const riskWeight = (unit.socialData?.risk || 50) / 100;
        heatPoints.push([...coords, riskWeight]);

        if (mapMode === 'MARKERS') {
          const isSelected = selectedUnit?.id === unit.id;
          const riskColor = (unit.socialData?.risk || 0) > 70 ? '#ef4444' : (unit.socialData?.risk || 0) > 40 ? '#f59e0b' : '#10b981';
          
          const marker = L.marker(coords as any, {
            icon: L.divIcon({ 
              className: 'custom-marker', 
              html: `
                <div class="relative flex items-center justify-center">
                  ${isSelected ? `<div class="absolute w-14 h-14 bg-white/20 rounded-full animate-ping"></div>` : ''}
                  <div class="w-10 h-10 rounded-2xl border-4 border-slate-900 shadow-2xl flex items-center justify-center transition-all ${isSelected ? 'scale-125 ring-4 ring-indigo-500/50' : 'hover:scale-110'}" style="background-color: ${riskColor}">
                    <div class="w-2.5 h-2.5 bg-white rounded-full"></div>
                  </div>
                </div>
              ` 
            })
          }).on('click', () => {
              setSelectedUnit(unit);
              setAiSummary(null);
              mapInstanceRef.current.setView(coords, 18, { animate: true });
          });
          markersGroupRef.current.addLayer(marker);
        }
      });

      if (mapMode === 'HEATMAP' && (window as any).L.heatLayer) {
          heatLayerRef.current = (window as any).L.heatLayer(heatPoints, { 
            radius: 45, 
            blur: 30,
            max: 1.0,
            gradient: {0.2: '#4f46e5', 0.4: '#06b6d4', 0.6: '#10b981', 0.8: '#f59e0b', 1: '#ef4444'}
          }).addTo(mapInstanceRef.current);
      }
      
      if (searchTerm && filteredUnits.length === 1 && !selectedUnit) {
        mapInstanceRef.current.setView([filteredUnits[0].coordinates.lat, filteredUnits[0].coordinates.lng], 18, { animate: true });
      } else if (filteredUnits.length > 0 && !selectedUnit && !searchTerm) {
        mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), { padding: [100, 100], maxZoom: 16 });
      }
    }
  }, [filteredUnits, mapMode, selectedUnit, searchTerm]);

  const handleInvestigate = async (unit: UnitData) => {
    try {
      const res = await userService.getAll(1, 1, unit.cpf.replace(/\D/g, ''));
      const users = res.data?.data || [];
      if (users.length) {
          setInvestigatingUser(users[0]);
      } else {
          setInvestigatingUser(unit as any);
      }
    } catch (e) { 
        alert("Falha ao abrir dossiê de campo."); 
    }
  };

  const generateQuickAiSummary = async (unit: UnitData) => {
      setIsGeneratingSummary(true);
      try {
          const res = await aiService.chat(`Como Analista SRE, gere um dossiê executivo sobre o morador ${unit.residentName} (Unid ${unit.unit}). Tags: ${unit.tags.join(', ')}. Risco: ${unit.socialData?.risk || 0}%. Curto e técnico.`);
          setAiSummary(res.data.text);
      } catch (e) {
          setAiSummary("Kernel Neural Offline.");
      } finally {
          setIsGeneratingSummary(false);
      }
  };

  return (
    <div className="h-full w-full flex flex-col relative bg-slate-950 rounded-[3rem] overflow-hidden min-h-[750px] border border-white/5 shadow-2xl">
      <div ref={mapContainerRef} className="absolute inset-0 z-0 grayscale-[0.2] contrast-[1.1] brightness-[0.8]"></div>
      
      <div className="absolute top-8 left-8 right-8 z-[1000] flex flex-col md:flex-row gap-4 items-start justify-center">
        <div className="bg-slate-900/90 backdrop-blur-3xl p-2 rounded-[2.5rem] shadow-2xl border border-white/10 flex items-center gap-4 w-full max-w-3xl">
          <div className="pl-6 text-indigo-400"><Search size={22}/></div>
          <input 
            type="text" 
            placeholder="Pesquisar por Nome, CPF, Unidade ou Endereço..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-white font-black text-sm placeholder:text-slate-500 py-5 uppercase tracking-wide"
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="p-4 text-slate-500 hover:text-white transition-colors"><X size={20}/></button>}
        </div>

        <div className="bg-slate-900/90 backdrop-blur-3xl p-2 rounded-[2.5rem] shadow-2xl border border-white/10 flex items-center gap-1">
            <button onClick={() => setMapMode('MARKERS')} className={`p-4 rounded-2xl transition-all flex items-center gap-3 ${mapMode === 'MARKERS' ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-white'}`}>
              <LayoutGrid size={20}/> <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">Identidades</span>
            </button>
            <button onClick={() => setMapMode('HEATMAP')} className={`p-4 rounded-2xl transition-all flex items-center gap-3 ${mapMode === 'HEATMAP' ? 'bg-rose-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-white'}`}>
              <Flame size={20}/> <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">Calor Social</span>
            </button>
        </div>
      </div>

      <div className="absolute top-32 left-8 z-[1000] flex flex-col gap-4 animate-fade-in">
        <div className="bg-slate-900/95 backdrop-blur-3xl p-7 rounded-[3rem] shadow-2xl border border-white/10 min-w-[280px] max-h-[550px] flex flex-col">
          <div className="flex items-center justify-between mb-6 px-1">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3"><Filter size={14}/> Camadas Sociais</p>
            <button onClick={loadUnits} className="text-slate-500 hover:text-indigo-400 transition-colors"><RefreshCw size={14}/></button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2.5">
            <button onClick={() => setActiveTagFilter('TODOS')} className={`w-full text-left px-6 py-4 text-[9px] font-black uppercase rounded-2xl transition-all border ${activeTagFilter === 'TODOS' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}>MAPA INTEGRAL (TODOS)</button>
            {dynamicTags.map(tag => (
              <button key={tag} onClick={() => setActiveTagFilter(tag)} className={`group block w-full text-left px-6 py-4 text-[9px] font-black uppercase rounded-2xl transition-all border ${activeTagFilter === tag ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}>
                <div className="flex items-center justify-between"><span>{tag.replace(/_/g, ' ')}</span><ChevronRight size={10}/></div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-4">
         <div className="bg-slate-900/90 backdrop-blur-3xl p-2 rounded-2xl border border-white/10 flex flex-col gap-1 shadow-2xl">
            <button onClick={() => mapInstanceRef.current?.zoomIn()} className="p-4 text-slate-400 hover:text-white rounded-xl transition-all"><ZoomIn size={22}/></button>
            <button onClick={() => mapInstanceRef.current?.zoomOut()} className="p-4 text-slate-400 hover:text-white rounded-xl transition-all"><ZoomOut size={22}/></button>
            <div className="h-px bg-white/5 mx-2 my-1" />
            <button onClick={() => mapInstanceRef.current?.setView([-23.5505, -46.6333], 15)} className="p-4 text-slate-400 hover:text-indigo-400 rounded-xl transition-all"><Crosshair size={22}/></button>
         </div>
      </div>

      {selectedUnit && (
          <div className="absolute bottom-10 left-10 right-10 z-[2000] animate-slide-up">
              <div className="bg-slate-900/95 backdrop-blur-3xl rounded-[4rem] p-10 lg:p-16 shadow-2xl border border-white/10 max-w-[1600px] mx-auto overflow-hidden relative">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
                      <div className="lg:col-span-4 space-y-10">
                          <div className="flex items-center gap-10">
                              <div className={`w-32 h-32 rounded-[3.5rem] flex items-center justify-center shadow-2xl border-4 border-slate-800 ${(selectedUnit.socialData?.risk || 0) > 65 ? 'bg-rose-500/20 text-rose-500' : 'bg-indigo-500/20 text-indigo-500'}`}><UserIcon size={56}/></div>
                              <div className="flex-1">
                                  <h4 className="text-4xl font-black text-white uppercase tracking-tightest leading-tight">{selectedUnit.residentName}</h4>
                                  <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] mt-3">{selectedUnit.role} • CLUSTER ATIVO</p>
                              </div>
                          </div>
                          <div className="space-y-6 bg-white/5 p-8 rounded-[3rem] border border-white/5 shadow-inner">
                              <div className="flex items-center gap-5 text-slate-300"><div className="p-2 bg-indigo-500/20 rounded-lg"><Fingerprint size={20} className="text-indigo-400"/></div><span className="text-sm font-mono font-bold tracking-widest">{selectedUnit.cpf}</span></div>
                              <div className="flex items-center gap-5 text-slate-300"><div className="p-2 bg-indigo-500/20 rounded-lg"><MapPin size={20} className="text-indigo-400"/></div><span className="text-xs font-black uppercase">UNIDADE {selectedUnit.unit}</span></div>
                          </div>
                      </div>

                      <div className="lg:col-span-5 border-l border-white/5 pl-16 flex flex-col justify-center">
                          <div className="mb-8 flex items-center justify-between">
                              <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-3"><Brain size={18}/> Diagnóstico Neural Ativo</p>
                              {!aiSummary && !isGeneratingSummary && <button onClick={() => generateQuickAiSummary(selectedUnit)} className="text-[10px] font-black text-white bg-indigo-600 px-6 py-2.5 rounded-2xl hover:bg-indigo-500 transition-all flex items-center gap-3 active:scale-95"><Sparkles size={14}/> Gerar Relatório</button>}
                          </div>
                          <div className="min-h-[160px] flex flex-col justify-center">
                            {isGeneratingSummary ? (
                                <div className="flex flex-col items-start gap-5 animate-pulse">
                                    <div className="flex items-center gap-4"><Loader2 className="animate-spin text-indigo-400" size={28}/><span className="text-xs font-black text-slate-400 uppercase">Consultando Core Gemini...</span></div>
                                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 w-1/3 animate-[progress_2s_infinite]"></div></div>
                                </div>
                            ) : aiSummary ? (
                                <div className="animate-fade-in"><p className="text-lg text-slate-300 font-medium leading-[1.8] italic uppercase border-l-8 border-indigo-600/50 pl-8">"{aiSummary}"</p></div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 opacity-30 group cursor-pointer" onClick={() => generateQuickAiSummary(selectedUnit)}>
                                    <Zap size={40} className="text-slate-500 mb-5 group-hover:text-indigo-400 group-hover:scale-110 transition-all"/>
                                    <p className="text-[10px] font-black uppercase">Clique para Análise Situacional</p>
                                </div>
                            )}
                          </div>
                      </div>

                      <div className="lg:col-span-3 border-l border-white/5 pl-16 flex flex-col justify-center gap-10">
                          <div className="text-center bg-white/5 p-10 rounded-[3.5rem] border border-white/5 shadow-inner transition-all">
                              <p className="text-[11px] font-black text-slate-500 uppercase mb-4">Vulnerabilidade Social</p>
                              <div className="flex items-center justify-center gap-6">
                                  <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden shadow-inner"><div className={`h-full transition-all duration-[2000ms] ease-out ${(selectedUnit.socialData?.risk || 0) > 70 ? 'bg-rose-500' : (selectedUnit.socialData?.risk || 0) > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{width: `${selectedUnit.socialData?.risk || 50}%`}}></div></div>
                                  <span className={`text-4xl font-black tracking-tighter ${(selectedUnit.socialData?.risk || 0) > 70 ? 'text-rose-500' : (selectedUnit.socialData?.risk || 0) > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>{selectedUnit.socialData?.risk || 0}%</span>
                              </div>
                          </div>
                          <div className="flex flex-col gap-4">
                              <button onClick={() => handleInvestigate(selectedUnit)} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black text-[12px] uppercase transition-all flex items-center justify-center gap-4 active:scale-95 shadow-2xl"><Target size={22}/> Investigar Alvo</button>
                              <button onClick={() => setSelectedUnit(null)} className="w-full py-6 bg-white/5 text-slate-500 hover:bg-rose-600 hover:text-white rounded-[2rem] font-black text-[12px] uppercase transition-all border border-white/5">Encerrar Vista</button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {isLoading && (
          <div className="absolute inset-0 z-[3000] bg-slate-950/85 backdrop-blur-2xl flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-indigo-500 mb-6" size={64}/>
              <h4 className="text-3xl font-black text-white uppercase tracking-tightest">Mesh Visualization Active</h4>
          </div>
      )}

      {investigatingUser && <UserModal user={investigatingUser} onClose={() => setInvestigatingUser(null)} onSaveSuccess={() => { setInvestigatingUser(null); loadUnits(); }} />}

      <style>{`
        .leaflet-container { background: #020617 !important; cursor: crosshair !important; }
        .custom-marker { background: none !important; border: none !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
        @keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
      `}</style>
    </div>
  );
};

export default SmartMap;

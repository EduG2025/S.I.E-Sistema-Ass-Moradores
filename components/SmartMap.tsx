
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UnitData, SystemInfo, User } from '../types';
import { mapService, userService, aiService } from '../services/api';
import { 
  Loader2, X, Map as MapIcon, Layers, Flame, User as UserIcon, 
  MapPin, RefreshCw, Info, Search, Shield, Activity, Fingerprint, 
  Target, AlertCircle, ChevronRight, Plus, Sparkles, Brain, LayoutGrid,
  Filter, ZoomIn, ZoomOut, Zap, Crosshair, HelpCircle, Globe, ExternalLink, Navigation,
  ShieldAlert
} from 'lucide-react';
import * as L from 'leaflet';
import UserModal from './UserModal';

interface SmartMapProps {
  systemInfo?: SystemInfo;
}

const SmartMap = ({ systemInfo }: SmartMapProps) => {
  const [allUnits, setAllUnits] = useState<UnitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializingHQ, setIsInitializingHQ] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitData | null>(null);
  const [investigatingUser, setInvestigatingUser] = useState<User | null>(null);
  const [activeTagFilter, setActiveTagFilter] = useState('TODOS');
  const [mapMode, setMapMode] = useState<'MARKERS' | 'HEATMAP'>('MARKERS');
  const [apiError, setApiError] = useState<string | null>(null);
  
  // GROUNDING STATE
  const [geoQuery, setGeoQuery] = useState('');
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [geoResults, setGeoResults] = useState<{text: string, groundingChunks: any[]} | null>(null);
  const [useLiveSearch, setUseLiveSearch] = useState(true);

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
      const mappedUnits = rawUsers.map((u: any) => ({
        id: u.id,
        residentName: u.name,
        cpf: u.cpf_cnpj || '',
        address: u.address || '',
        unit: u.unit || 'S/N',
        status: u.status,
        role: u.role,
        coordinates: typeof u.coordinates === 'string' ? JSON.parse(u.coordinates) : u.coordinates,
        tags: (typeof u.socialData === 'string' ? JSON.parse(u.socialData) : u.socialData)?.tags || [],
        socialData: typeof u.socialData === 'string' ? JSON.parse(u.socialData) : u.socialData,
      })).filter((u: any) => u.coordinates?.lat && u.coordinates?.lng);
      setAllUnits(mappedUnits);
    } catch (e) { setAllUnits([]); } 
    finally { setIsLoading(false); }
  };

  // Neural Geocoding HQ
  const locateHQ = async () => {
      if (!systemInfo?.address || !mapInstanceRef.current) return;
      setIsInitializingHQ(true);
      setApiError(null);
      try {
          const res = await aiService.chat(
              `Localize as coordenadas geográficas (latitude e longitude) exatas do seguinte endereço: ${systemInfo.address}. Retorne APENAS um objeto JSON no formato {"lat": valor, "lng": valor}.`, 
              { maps: true }
          );
          
          // Tenta extrair JSON da resposta
          const jsonMatch = res.data.text.match(/\{.*\}/s);
          if (jsonMatch) {
              const coords = JSON.parse(jsonMatch[0]);
              if (coords.lat && coords.lng) {
                  mapInstanceRef.current.flyTo([coords.lat, coords.lng], 17, { animate: true, duration: 2 });
                  // Adiciona marcador da sede
                  L.marker([coords.lat, coords.lng], {
                      icon: L.divIcon({
                          className: 'hq-marker',
                          html: `<div class="w-12 h-12 bg-slate-900 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-indigo-400 animate-bounce"><Shield size={24}/></div>`
                      })
                  }).addTo(mapInstanceRef.current).bindPopup(`<b class="uppercase font-black">Sede Administrativa</b><br/>${systemInfo.shortName}`).openPopup();
              }
          }
      } catch (e: any) {
          console.error("Geocoding Fail", e);
          if (e.response?.data?.error?.includes("NEURAL_LINK_INVALID") || e.message?.includes("NEURAL_LINK_INVALID")) {
              setApiError("FALHA DE COMUNICAÇÃO NEURAL: Chave de API inválida ou expirada.");
          }
      } finally {
          setIsInitializingHQ(false);
      }
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
        
        // Se houver endereço, tenta localizar HQ após pequeno delay para estabilidade do mapa
        if (systemInfo?.address) {
            setTimeout(locateHQ, 1000);
        }
    }
  }, [isLoading, systemInfo]);

  const filteredUnits = useMemo(() => {
    return allUnits.filter(u => activeTagFilter === 'TODOS' || u.tags?.includes(activeTagFilter));
  }, [allUnits, activeTagFilter]);

  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    markersGroupRef.current.clearLayers();
    if (heatLayerRef.current) { mapInstanceRef.current.removeLayer(heatLayerRef.current); heatLayerRef.current = null; }

    if (filteredUnits.length > 0) {
      filteredUnits.forEach(unit => {
        if (mapMode === 'MARKERS') {
          const riskColor = (unit.socialData?.risk || 0) > 70 ? '#ef4444' : (unit.socialData?.risk || 0) > 40 ? '#f59e0b' : '#10b981';
          L.marker([unit.coordinates.lat, unit.coordinates.lng] as any, {
            icon: L.divIcon({ 
              className: 'custom-marker', 
              html: `<div class="w-8 h-8 rounded-xl border-2 border-slate-900 shadow-lg flex items-center justify-center transition-all hover:scale-125" style="background-color: ${riskColor}"><div class="w-1.5 h-1.5 bg-white rounded-full"></div></div>` 
            })
          }).on('click', () => { setSelectedUnit(unit); setGeoResults(null); }).addTo(markersGroupRef.current);
        }
      });
      if (mapMode === 'HEATMAP' && (window as any).L.heatLayer) {
          const heatPoints = filteredUnits.map(u => [u.coordinates.lat, u.coordinates.lng, (u.socialData?.risk || 50) / 100]);
          heatLayerRef.current = (window as any).L.heatLayer(heatPoints, { radius: 35, blur: 20 }).addTo(mapInstanceRef.current);
      }
    }
  }, [filteredUnits, mapMode]);

  const handleGeoSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!geoQuery.trim()) return;
      setIsGeoLoading(true);
      setGeoResults(null);
      setApiError(null);
      try {
          const center = mapInstanceRef.current.getCenter();
          const res = await aiService.chat(geoQuery, { 
              search: useLiveSearch, 
              maps: true, 
              location: { lat: center.lat, lng: center.lng } 
          });
          setGeoResults(res.data);
      } catch (e: any) { 
          setApiError(e.response?.data?.error || "Falha na consulta geo-neural."); 
      }
      finally { setIsGeoLoading(false); }
  };

  return (
    <div className="h-full w-full flex flex-col relative bg-slate-950 rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
      <div ref={mapContainerRef} className="absolute inset-0 z-0 brightness-[0.7] contrast-[1.2]"></div>
      
      {/* ERROR BANNER SRE */}
      {apiError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] animate-bounce">
              <div className="bg-rose-600 text-white px-8 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-rose-500 font-black text-[10px] uppercase tracking-widest">
                  <ShieldAlert size={18}/> {apiError}
              </div>
          </div>
      )}

      {/* HQ INITIALIZING OVERLAY */}
      {isInitializingHQ && (
          <div className="absolute inset-0 z-[1500] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-white">
                  <Loader2 className="animate-spin text-indigo-400" size={48}/>
                  <p className="font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Localizando Sede Administrativa...</p>
              </div>
          </div>
      )}
      
      {/* GROUNDED GEO-INTELLIGENCE CONSOLE */}
      <div className="absolute top-8 left-8 right-8 z-[1000] flex flex-col gap-4 items-center">
        <form onSubmit={handleGeoSearch} className="bg-slate-900/90 backdrop-blur-3xl p-2 rounded-[2.5rem] shadow-2xl border border-white/10 flex items-center gap-4 w-full max-w-4xl group focus-within:border-indigo-500/50 transition-all">
          <div className="pl-6 text-indigo-400 group-focus-within:animate-pulse"><Globe size={24}/></div>
          <input 
            type="text" 
            placeholder="Pergunte ao SRE Vision: 'Onde há hospitais próximos?' ou 'Como está o trânsito?'" 
            value={geoQuery}
            onChange={(e) => setGeoQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-white font-bold text-sm placeholder:text-slate-500 py-5 uppercase tracking-wide"
          />
          <div className="flex items-center gap-2 pr-4">
              <button type="button" onClick={() => setUseLiveSearch(!useLiveSearch)} className={`p-3 rounded-xl transition-all ${useLiveSearch ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-500'}`} title="Search Grounding">
                  <Zap size={16}/>
              </button>
              <button type="submit" disabled={isGeoLoading} className="p-4 bg-white text-slate-950 rounded-2xl hover:bg-indigo-500 hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-30">
                  {isGeoLoading ? <Loader2 className="animate-spin" size={20}/> : <ChevronRight size={20}/>}
              </button>
          </div>
        </form>

        {geoResults && (
            <div className="w-full max-w-4xl bg-slate-900/95 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/10 shadow-2xl animate-slide-up max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg"><Brain size={20}/></div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Resposta Grounded</p>
                    </div>
                    <button onClick={() => setGeoResults(null)} className="p-2 text-slate-500 hover:text-white"><X size={20}/></button>
                </div>
                <p className="text-slate-100 text-lg font-medium leading-relaxed uppercase italic mb-8 border-l-4 border-indigo-600 pl-6">"{geoResults.text}"</p>
                
                {geoResults.groundingChunks.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Navigation size={12}/> Fontes de Ancoragem (Grounding):</p>
                        <div className="flex flex-wrap gap-3">
                            {geoResults.groundingChunks.map((chunk, idx) => (
                                <a key={idx} href={chunk.maps?.uri || chunk.web?.uri} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-indigo-300 uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                    {chunk.maps?.title || chunk.web?.title} <ExternalLink size={12}/>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      <div className="absolute top-32 left-8 z-[1000] flex flex-col gap-4 animate-fade-in">
        <div className="bg-slate-900/95 backdrop-blur-3xl p-7 rounded-[3rem] shadow-2xl border border-white/10 min-w-[280px]">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-3"><Filter size={14}/> Camadas Sociais</p>
          <div className="space-y-2">
            <button onClick={() => setActiveTagFilter('TODOS')} className={`w-full text-left px-6 py-4 text-[9px] font-black uppercase rounded-2xl transition-all border ${activeTagFilter === 'TODOS' ? 'bg-indigo-600 text-white' : 'bg-white/5 border-white/5 text-slate-400'}`}>MAPA INTEGRAL</button>
            {dynamicTags.map(tag => (
              <button key={tag} onClick={() => setActiveTagFilter(tag)} className={`w-full text-left px-6 py-4 text-[9px] font-black uppercase rounded-2xl transition-all border ${activeTagFilter === tag ? 'bg-indigo-600 text-white' : 'bg-white/5 border-white/5 text-slate-400'}`}>{tag}</button>
            ))}
          </div>
        </div>
        <div className="bg-slate-900/90 backdrop-blur-3xl p-2 rounded-[2rem] border border-white/10 flex flex-col gap-1">
            <button onClick={() => setMapMode('MARKERS')} className={`p-4 rounded-xl ${mapMode === 'MARKERS' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><LayoutGrid size={20}/></button>
            <button onClick={() => setMapMode('HEATMAP')} className={`p-4 rounded-xl ${mapMode === 'HEATMAP' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}><Flame size={20}/></button>
        </div>
      </div>

      {selectedUnit && (
          <div className="absolute bottom-10 left-10 right-10 z-[2000] animate-slide-up">
              <div className="bg-slate-900/95 backdrop-blur-3xl rounded-[4rem] p-10 lg:p-16 shadow-2xl border border-white/10 max-w-[1400px] mx-auto overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 items-center">
                      <div className="lg:col-span-4 flex items-center gap-8">
                          <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-600/20 text-indigo-500 flex items-center justify-center border-4 border-slate-800"><UserIcon size={48}/></div>
                          <div>
                              <h4 className="text-3xl font-black text-white uppercase leading-none">{selectedUnit.residentName}</h4>
                              <p className="text-[10px] font-black text-indigo-400 uppercase mt-3 tracking-widest">Unid {selectedUnit.unit} • {selectedUnit.role}</p>
                          </div>
                      </div>
                      <div className="lg:col-span-5 bg-white/5 p-8 rounded-[3rem] border border-white/5 flex flex-col justify-center">
                          <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Vulnerabilidade Local</p>
                          <div className="flex items-center gap-6">
                              <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden"><div className={`h-full ${(selectedUnit.socialData?.risk || 0) > 70 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{width: `${selectedUnit.socialData?.risk || 0}%`}}></div></div>
                              <span className="text-3xl font-black text-white">{selectedUnit.socialData?.risk || 0}%</span>
                          </div>
                      </div>
                      <div className="lg:col-span-3 flex flex-col gap-4">
                          <button onClick={() => setInvestigatingUser(selectedUnit as any)} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase shadow-xl hover:bg-indigo-500 transition-all">Abrir Dossiê</button>
                          <button onClick={() => setSelectedUnit(null)} className="w-full py-5 bg-white/5 text-slate-500 rounded-[2rem] font-black text-[10px] uppercase">Fechar</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {investigatingUser && <UserModal user={investigatingUser} onClose={() => setInvestigatingUser(null)} onSaveSuccess={() => { setInvestigatingUser(null); loadUnits(); }} />}

      <style>{`
        .leaflet-container { background: #020617 !important; }
        .custom-marker { background: none !important; border: none !important; }
        .hq-marker { background: none !important; border: none !important; }
      `}</style>
    </div>
  );
};

export default SmartMap;

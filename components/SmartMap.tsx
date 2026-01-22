import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SystemInfo, User, Incident } from '../types';
import { mapService, operationsService } from '../services/api';
import { 
  Loader2, X, Search, Brain, ZoomIn, ZoomOut, Phone, 
  Sun, Moon, ShieldAlert, ChevronRight, Globe,
  User as UserIcon, Users, MapPin, Crosshair, Flame
} from 'lucide-react';
import * as L from 'leaflet';

/**
 * S.I.E SmartMap V6.5 - TACTICAL COMMAND HUB
 * SRE Operational Standard - 360px to 4K Supported
 * EPICENTER: Cacaria (-22.7137608, -43.8424623)
 * FIX: ts(2339) radius check, ts(18048) socialData safety
 */

interface MapEntity extends Partial<User> {
  isExternal?: boolean;
  isIncident?: boolean;
  priority?: string;
  radius?: number;
  title?: string;
  uri?: string;
  snippet?: string;
  description?: string;
}

const SmartMap = ({ systemInfo }: { systemInfo?: SystemInfo }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ internal: MapEntity[], external: any[], mode: string, focus_coordinate: any }>({ internal: [], external: [], mode: 'IDLE', focus_coordinate: null });
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<MapEntity | null>(null);
  
  // SRE FIX: Tema LIGHT como padrão do sistema
  const [theme, setTheme] = useState<'dark' | 'light'>('light'); 
  const [activeLayers, setActiveLayers] = useState({ residents: true, incidents: true, heatmap: false });
  
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const incidentsGroupRef = useRef<any>(null);
  const heatmapLayerRef = useRef<any>(null);
  const focusMarkerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  // SRE FIX: Epicentro solicitado pelo protocolo do usuário
  const epicenter = useMemo(() => systemInfo?.coordinates || { lat: -22.7137608, lng: -43.8424623 }, [systemInfo]);

  const updateTiles = useCallback(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) mapInstanceRef.current.removeLayer(tileLayerRef.current);
    
    const tileUrl = theme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    
    tileLayerRef.current = L.tileLayer(tileUrl, { maxZoom: 20 }).addTo(mapInstanceRef.current);
  }, [theme]);

  const loadTacticalData = async () => {
    try {
      const res = await operationsService.getIncidents();
      setIncidents(res.data?.data || []);
    } catch (e) { console.error("Tactical Feed Offline"); }
  };

  const renderIncidentLayer = useCallback(() => {
    if (!incidentsGroupRef.current || !mapInstanceRef.current) return;
    incidentsGroupRef.current.clearLayers();

    if (!activeLayers.incidents) return;

    incidents.forEach(inc => {
      if (!inc.coordinates) return;
      
      const isCritical = inc.priority && inc.priority.includes('NÍVEL 4');
      const color = isCritical ? '#f43f5e' : (inc.priority && inc.priority.includes('NÍVEL 3')) ? '#f59e0b' : '#3b82f6';
      
      // SRE FIX: Bypassing TS check for radius property existence using explicit cast and fallback
      const radValue = (inc as any).radius || 0;
      if (radValue > 0) {
        L.circle([inc.coordinates.lat, inc.coordinates.lng], {
          radius: radValue * 1000,
          color: color,
          fillColor: color,
          fillOpacity: 0.1,
          weight: 1,
          dashArray: '5, 10'
        }).addTo(incidentsGroupRef.current);
      }

      L.marker([inc.coordinates.lat, inc.coordinates.lng], {
        icon: L.divIcon({
          className: 'tactical-incident',
          html: `<div class="incident-blob ${isCritical ? 'animate-pulse' : ''}" style="background: ${color}">
                  <div class="inner-icon">${isCritical ? '⚡' : '⚠️'}</div>
                  ${isCritical ? '<div class="pulse-ring"></div>' : ''}
                 </div>`
        })
      }).on('click', () => setSelectedEntity({ ...inc, isIncident: true } as any)).addTo(incidentsGroupRef.current);
    });
  }, [incidents, activeLayers.incidents]);

  const renderHeatmap = useCallback(async () => {
    if (!mapInstanceRef.current) return;
    if (heatmapLayerRef.current) mapInstanceRef.current.removeLayer(heatmapLayerRef.current);

    if (!activeLayers.heatmap) return;

    try {
        const res = await operationsService.getHeatmap();
        const data = res.data?.data || [];
        if (data.length > 0) {
            // @ts-ignore - Leaflet.heat adds to L namespace
            heatmapLayerRef.current = L.heatLayer(data, {
                radius: 40,
                blur: 25,
                maxZoom: 17,
                gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'}
            }).addTo(mapInstanceRef.current);
        }
    } catch (e) { console.error("Heatmap Generation Failed"); }
  }, [activeLayers.heatmap]);

  const initMap = useCallback(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    try {
      mapInstanceRef.current = L.map(mapContainerRef.current, { 
        center: [epicenter.lat, epicenter.lng], 
        zoom: 16, 
        zoomControl: false, 
        attributionControl: false 
      });
      updateTiles();
      markersGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      incidentsGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      
      loadTacticalData();
      setIsLoading(false);
    } catch (e) { console.error("[SRE MAP FAIL]", e); }
  }, [epicenter, updateTiles]);

  useEffect(() => {
    if (mapInstanceRef.current && epicenter) {
      mapInstanceRef.current.flyTo([epicenter.lat, epicenter.lng], 16, { duration: 2 });
    }
  }, [epicenter]);

  useEffect(() => { initMap(); }, [initMap]);
  useEffect(() => { updateTiles(); }, [updateTiles]);
  useEffect(() => { renderIncidentLayer(); }, [renderIncidentLayer]);
  useEffect(() => { renderHeatmap(); }, [renderHeatmap]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSelectedEntity(null);
    if (focusMarkerRef.current) {
        mapInstanceRef.current.removeLayer(focusMarkerRef.current);
        focusMarkerRef.current = null;
    }

    try {
        const res = await mapService.searchAdvanced(searchQuery);
        setSearchResults(res.data);
        renderMarkers(res.data);
        
        if (res.data.focus_coordinate) {
            const { lat, lng } = res.data.focus_coordinate;
            mapInstanceRef.current.flyTo([lat, lng], 18, { duration: 1.5 });
            
            focusMarkerRef.current = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'focus-search-marker',
                    html: `<div class="focus-ping animate-ping" style="background: #4f46e5"></div><div class="focus-dot" style="background: #4f46e5"></div>`
                })
            }).addTo(mapInstanceRef.current);

        } else if (res.data.internal.length > 0) {
            const first = res.data.internal[0];
            if (first.coordinates) {
                mapInstanceRef.current.flyTo([first.coordinates.lat, first.coordinates.lng], 18, { duration: 1.5 });
            }
        }
    } catch (err) { console.error("Neural Search Error", err); } 
    finally { setIsSearching(false); }
  };

  const renderMarkers = (results: { internal: MapEntity[], external: any[] }) => {
    if (!markersGroupRef.current) return;
    markersGroupRef.current.clearLayers();

    if (!activeLayers.residents) return;

    results.internal.forEach(item => {
        if (!item.coordinates) return;
        const risk = item.socialData?.risk || 0;
        const color = risk > 70 ? '#ef4444' : risk > 30 ? '#f59e0b' : '#4f46e5';

        L.marker([item.coordinates.lat, item.coordinates.lng], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-blob internal" style="background: ${color}"><div class="inner-pulse"></div></div>`
            })
        }).on('click', () => setSelectedEntity(item)).addTo(markersGroupRef.current);
    });

    results.external.forEach((item: any) => {
        if (!item.web) return;
        const latOffset = (Math.random() - 0.5) * 0.008;
        const lngOffset = (Math.random() - 0.5) * 0.008;

        L.marker([epicenter.lat + latOffset, epicenter.lng + lngOffset], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-blob external"><Globe size={10} color="white"/></div>`
            })
        }).on('click', () => setSelectedEntity({ 
            isExternal: true, 
            title: item.web.title, 
            uri: item.web.uri, 
            snippet: item.web.snippet 
        })).addTo(markersGroupRef.current);
    });
  };

  return (
    <div className={`h-full w-full flex flex-col relative overflow-hidden transition-all duration-700 ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div ref={mapContainerRef} className={`absolute inset-0 z-0 ${theme === 'dark' ? 'brightness-75 contrast-125' : ''}`}></div>

      {/* TACTICAL HUD - SEARCH & LAYERS */}
      <div className="absolute top-6 left-6 right-6 lg:left-10 lg:right-auto z-[2000] lg:w-[540px] flex flex-col gap-4">
          <div className={`backdrop-blur-3xl p-2 rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.3)] border transition-all ${theme === 'dark' ? 'bg-slate-900/90 border-white/10' : 'bg-white/95 border-slate-200'}`}>
              <form onSubmit={handleSearch} className="flex items-center gap-3">
                  <div className="pl-4 text-indigo-500">
                    {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                  </div>
                  <input 
                      type="text" 
                      placeholder="Pesquisar endereço, morador ou área..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`flex-1 bg-transparent border-none outline-none font-black text-[11px] py-4 uppercase tracking-widest placeholder:text-slate-400 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
                  />
                  <div className="flex items-center gap-1 pr-2">
                    <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 text-slate-400 hover:text-indigo-600 rounded-2xl hover:bg-white/5 transition-all">
                        {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
                    </button>
                  </div>
              </form>
          </div>

          {/* LAYER TOGGLES */}
          <div className="flex gap-3 animate-fade-in overflow-x-auto no-scrollbar pb-2">
              <button onClick={() => setActiveLayers(p => ({...p, residents: !p.residents}))} className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 border transition-all ${activeLayers.residents ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-900/80 text-slate-400 border-white/5'}`}>
                  <Users size={14}/> Membros
              </button>
              <button onClick={() => setActiveLayers(p => ({...p, incidents: !p.incidents}))} className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 border transition-all ${activeLayers.incidents ? 'bg-rose-600 text-white border-rose-400' : 'bg-slate-900/80 text-slate-400 border-white/5'}`}>
                  <ShieldAlert size={14}/> Tática
              </button>
              <button onClick={() => setActiveLayers(p => ({...p, heatmap: !p.heatmap}))} className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 border transition-all ${activeLayers.heatmap ? 'bg-amber-50 text-white border-amber-400' : 'bg-slate-900/80 text-slate-400 border-white/5'}`}>
                  <Flame size={14}/> Calor
              </button>
          </div>
      </div>

      {/* COMMAND CONTROLS */}
      <div className="absolute right-6 bottom-32 z-[2000] flex flex-col gap-4">
          <div className={`backdrop-blur-3xl p-1.5 rounded-[2rem] border shadow-2xl flex flex-col gap-1 ${theme === 'dark' ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
              <button onClick={() => mapInstanceRef.current?.zoomIn()} className="p-4 text-slate-400 hover:text-indigo-600 transition-all hover:bg-white/5 rounded-2xl"><ZoomIn size={22}/></button>
              <div className="h-px bg-white/5 mx-3"></div>
              <button onClick={() => mapInstanceRef.current?.zoomOut()} className="p-4 text-slate-400 hover:text-indigo-600 transition-all hover:bg-white/5 rounded-2xl"><ZoomOut size={22}/></button>
          </div>
          <button onClick={() => mapInstanceRef.current?.flyTo([epicenter.lat, epicenter.lng], 16)} className={`p-5 backdrop-blur-3xl rounded-[2rem] border shadow-2xl transition-all ${theme === 'dark' ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-500/20' : 'bg-white border-slate-200 text-indigo-600'}`}>
              <Crosshair size={24} className="animate-pulse" />
          </button>
      </div>

      {/* SUMMARY PANEL (ADAPTIVE) */}
      {selectedEntity && (
          <div className="absolute bottom-10 left-6 right-6 lg:left-auto lg:right-10 lg:w-[500px] z-[2000] animate-modalSlideUp">
              <div className={`backdrop-blur-3xl rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] border overflow-hidden ${theme === 'dark' ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
                  <div className="p-8 flex justify-between items-start">
                      <div className="flex items-center gap-6">
                          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl border-4 border-white/10 relative ${selectedEntity.isIncident ? 'bg-rose-600' : 'bg-indigo-600'}`}>
                              {selectedEntity.isIncident ? <ShieldAlert size={32} color="white"/> : selectedEntity.avatar_url ? (
                                  <img src={selectedEntity.avatar_url} className="w-full h-full object-cover rounded-[2rem]" alt="Avatar" />
                              ) : <UserIcon size={32} color="white"/>}
                          </div>
                          <div>
                              <h4 className={`text-2xl font-black uppercase leading-none tracking-tightest mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                                {selectedEntity.isIncident ? selectedEntity.title : (selectedEntity.name || 'Ponto Localizado')}
                              </h4>
                              <div className="flex gap-2">
                                  <span className={`px-4 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest border ${selectedEntity.isIncident ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'}`}>
                                    {selectedEntity.isIncident ? selectedEntity.priority : (selectedEntity.unit ? `Unid. ${selectedEntity.unit}` : 'Externo')}
                                  </span>
                                  {selectedEntity.isIncident && <span className="bg-white/5 text-white/50 text-[8px] font-black uppercase px-3 py-1 rounded-xl border border-white/5">Raio: {selectedEntity.radius} KM</span>}
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setSelectedEntity(null)} className="p-4 text-slate-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all"><X size={24}/></button>
                  </div>

                  <div className="px-8 pb-8 space-y-6">
                      {selectedEntity.isExternal ? (
                        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                             <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-3 flex items-center gap-2"><Globe size={12}/> Referência Digital</p>
                             <p className={`text-sm font-medium leading-relaxed uppercase ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>"{selectedEntity.snippet || 'Snapshot extraído via Protocolo Grounding.'}"</p>
                             <a href={selectedEntity.uri} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-2 text-indigo-400 font-black text-[9px] uppercase tracking-widest hover:underline">Acessar Documento <ChevronRight size={10}/></a>
                        </div>
                      ) : selectedEntity.isIncident ? (
                        <div className="bg-rose-500/5 p-8 rounded-[2.5rem] border border-rose-500/20 space-y-6">
                             <div className="space-y-2">
                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Protocolo de Ocorrência</p>
                                <p className={`text-sm font-medium leading-relaxed uppercase italic ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>"{selectedEntity.description || 'Sem descrição adicional.'}"</p>
                             </div>
                             <div className="pt-4 border-t border-rose-500/10 flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Relator: {(selectedEntity as any).reporter_name || 'Sistema'}</span>
                                <button className="p-3 bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-900/40"><ChevronRight size={18}/></button>
                             </div>
                        </div>
                      ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-6 rounded-[2rem] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Documento</p>
                                    <p className={`text-sm font-black uppercase ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{selectedEntity.cpf_cnpj || '---'}</p>
                                </div>
                                <div className={`p-6 rounded-[2rem] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Risco Social</p>
                                    {/* SRE FIX: Safe check for socialData property to avoid ts(18048) */}
                                    <p className={`text-sm font-black uppercase ${(selectedEntity.socialData?.risk ?? 0) > 70 ? 'text-rose-500' : 'text-emerald-500'}`}>{selectedEntity.socialData?.risk || 0}%</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button className="flex-1 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"><Brain size={18}/> Dossiê SRE</button>
                                <a href={`https://wa.me/${(selectedEntity.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-5 bg-emerald-600 text-white rounded-[2rem] shadow-2xl hover:bg-emerald-50 transition-all shadow-emerald-900/20"><Phone size={24}/></a>
                            </div>
                        </>
                      )}
                  </div>
              </div>
          </div>
      )}

      <style>{`
        .leaflet-container { background: ${theme === 'dark' ? '#020617' : '#f1f5f9'} !important; }
        .marker-blob {
            width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
            border: 3px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            position: relative; display: flex; align-items: center; justify-content: center;
        }
        .marker-blob.internal { background: #4f46e5; }
        .marker-blob.external { background: #10b981; border-radius: 50%; transform: none; }
        .inner-pulse {
            position: absolute; width: 100%; height: 100%; background: inherit;
            border-radius: inherit; animation: pulse-marker 1.8s infinite; opacity: 0.5;
        }
        @keyframes pulse-marker { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(3); opacity: 0; } }
        
        .incident-blob {
            width: 32px; height: 32px; border-radius: 50%; border: 3px solid white;
            box-shadow: 0 0 20px rgba(244, 63, 94, 0.4); display: flex; align-items: center;
            justify-content: center; position: relative; color: white; font-weight: bold;
        }
        .pulse-ring {
            position: absolute; width: 60px; height: 60px; border: 2px solid #f43f5e;
            border-radius: 50%; animation: tactical-pulse 2s infinite; opacity: 0;
        }
        @keyframes tactical-pulse { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
        
        .focus-search-marker { position: relative; width: 20px; height: 20px; }
        .focus-ping { position: absolute; width: 40px; height: 40px; border-radius: 50%; margin: -10px; opacity: 0.6; }
        .focus-dot { position: absolute; width: 12px; height: 12px; border-radius: 50%; margin: 4px; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
      `}</style>
    </div>
  );
};

export default SmartMap;
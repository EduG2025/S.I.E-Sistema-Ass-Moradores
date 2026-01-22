import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UnitData, SystemInfo } from '../types';
import { mapService } from '../services/api';
import { 
  Loader2, X, Map as MapIcon, Layers, Flame, User as UserIcon, 
  MapPin, Search, Plus, Brain, LayoutGrid,
  ZoomIn, ZoomOut, Navigation2, Phone, Calendar,
  Fingerprint, ShieldCheck, Sun, Moon,
  Home, Radio, Zap
} from 'lucide-react';
import * as L from 'leaflet';

interface SmartMapProps {
  systemInfo?: SystemInfo;
}

const SmartMap = ({ systemInfo }: SmartMapProps) => {
  const [allUnits, setAllUnits] = useState<UnitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<UnitData | null>(null);
  const [mapMode, setMapMode] = useState<'MARKERS' | 'HEATMAP' | 'PATROL'>('MARKERS');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markersGroupRef = useRef<any | null>(null);
  const tileLayerRef = useRef<any | null>(null);
  const heatLayerRef = useRef<any | null>(null);
  const patrolLayerRef = useRef<any | null>(null);

  useEffect(() => {
    loadUnits();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  const loadUnits = async () => {
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
          phone: u.phone || '',
          age: u.age || 0,
          coordinates: typeof u.coordinates === 'string' ? JSON.parse(u.coordinates) : u.coordinates,
          tags: social?.tags || [],
          socialData: social,
        };
      }).filter((u: any) => u.coordinates?.lat && u.coordinates?.lng);
      setAllUnits(mappedUnits);
    } catch (e) { 
        console.error("Map Load Fail", e);
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (!isLoading && mapContainerRef.current && !mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current, { 
          center: [-23.5505, -46.6333], 
          zoom: 16, 
          zoomControl: false, 
          attributionControl: false 
        });

        updateTiles();
        markersGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }
  }, [isLoading]);

  const updateTiles = () => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) mapInstanceRef.current.removeLayer(tileLayerRef.current);
    
    const tileUrl = theme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    
    tileLayerRef.current = L.tileLayer(tileUrl).addTo(mapInstanceRef.current);
  };

  useEffect(() => {
      updateTiles();
  }, [theme]);

  const searchResults = useMemo(() => {
      if (!searchQuery.trim() || searchQuery.length < 2) return [];
      const q = searchQuery.toLowerCase();
      return allUnits.filter(u => {
          const searchableFields = [
              u.residentName, u.cpf, u.unit, u.phone, u.address, u.role,
              u.tags.join(' ')
          ].join(' ').toLowerCase();
          return searchableFields.includes(q);
      }).slice(0, 6);
  }, [allUnits, searchQuery]);

  const handleSelectFromSearch = (unit: UnitData) => {
      setSearchQuery('');
      focusOnUnit(unit);
  };

  const focusOnUnit = (unit: UnitData) => {
      setSelectedUnit(unit);
      mapInstanceRef.current.flyTo([unit.coordinates.lat, unit.coordinates.lng], 18, { 
          animate: true, 
          duration: 1.5 
      });
  };

  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    markersGroupRef.current.clearLayers();
    if (heatLayerRef.current) { mapInstanceRef.current.removeLayer(heatLayerRef.current); heatLayerRef.current = null; }
    if (patrolLayerRef.current) { mapInstanceRef.current.removeLayer(patrolLayerRef.current); patrolLayerRef.current = null; }

    if (mapMode === 'MARKERS' || mapMode === 'PATROL') {
      allUnits.forEach(unit => {
        const riskColor = (unit.socialData?.risk || 0) > 70 ? '#ef4444' : (unit.socialData?.risk || 0) > 40 ? '#f59e0b' : '#4f46e5';
        const isActive = selectedUnit?.id === unit.id;

        L.marker([unit.coordinates.lat, unit.coordinates.lng] as any, {
          icon: L.divIcon({ 
            className: 'custom-marker', 
            html: `
              <div class="relative group">
                <div class="w-8 h-8 rounded-full border-2 ${isActive ? 'border-white scale-125 shadow-lg' : 'border-white/50 shadow-md'} transition-all flex items-center justify-center" style="background-color: ${riskColor}">
                  <div class="w-1 h-1 bg-white rounded-full"></div>
                </div>
              </div>`
          })
        }).on('click', () => focusOnUnit(unit)).addTo(markersGroupRef.current);
      });
    }

    if (mapMode === 'HEATMAP' && (window as any).L.heatLayer) {
        const heatPoints = allUnits.map(u => [u.coordinates.lat, u.coordinates.lng, (u.socialData?.risk || 50) / 100]);
        heatLayerRef.current = (window as any).L.heatLayer(heatPoints, { radius: 35, blur: 15 }).addTo(mapInstanceRef.current);
    }

    if (mapMode === 'PATROL') {
        const routeCoords = allUnits.map(u => [u.coordinates.lat, u.coordinates.lng]);
        if (routeCoords.length > 1) {
            patrolLayerRef.current = L.polyline(routeCoords as any, { 
                color: '#4f46e5', 
                weight: 2, 
                dashArray: '10, 10', 
                opacity: 0.6,
                className: 'patrol-animate'
            }).addTo(mapInstanceRef.current);
        }
    }
  }, [allUnits, mapMode, selectedUnit, theme]);

  return (
    <div className={`h-full w-full flex flex-col relative overflow-hidden transition-all duration-700 ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div ref={mapContainerRef} className={`absolute inset-0 z-0 ${theme === 'dark' ? 'brightness-[0.7] contrast-[1.1]' : ''}`}></div>

      {/* TOP SEARCH BAR */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[2000] w-[92%] max-w-2xl px-4 lg:px-0">
          <div className={`backdrop-blur-3xl p-2 rounded-3xl shadow-2xl border transition-all ${theme === 'dark' ? 'bg-slate-900/90 border-white/10' : 'bg-white/95 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                  <div className="pl-4 text-indigo-500"><Search size={20} /></div>
                  <input 
                      type="text" 
                      placeholder="Identidade, Unidade, Perfil..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`flex-1 bg-transparent border-none outline-none font-bold text-[11px] py-3 uppercase tracking-widest placeholder:text-slate-400 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
                  />
                  <div className="flex items-center gap-1 pr-2">
                    <button onClick={() => setLayersPanelOpen(!layersPanelOpen)} className={`p-3 rounded-2xl transition-all ${layersPanelOpen ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}>
                        <Layers size={18}/>
                    </button>
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all">
                        {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
                    </button>
                  </div>
              </div>

              {searchResults.length > 0 && (
                  <div className={`mt-2 py-2 border-t overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                      {searchResults.map(res => (
                          <button key={res.id} onClick={() => handleSelectFromSearch(res)} className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-all border-b last:border-0 ${theme === 'dark' ? 'hover:bg-white/5 border-white/5' : 'hover:bg-slate-50 border-slate-50'}`}>
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                                  <UserIcon size={16}/>
                              </div>
                              <div className="min-w-0 flex-1">
                                  <div className="flex justify-between items-center">
                                      <p className={`text-[10px] font-black uppercase truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{res.residentName}</p>
                                      <span className="text-[7px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase border border-slate-200">Unid {res.unit}</span>
                                  </div>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">{res.cpf}</p>
                              </div>
                          </button>
                      ))}
                  </div>
              )}
          </div>
      </div>

      {/* LAYER SELECTOR HUD */}
      {layersPanelOpen && (
          <div className={`absolute top-24 left-6 z-[2000] w-64 backdrop-blur-3xl rounded-[2.5rem] border shadow-2xl animate-fade-in p-6 ${theme === 'dark' ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <h5 className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Protocolos de Visão</h5>
                <button onClick={() => setLayersPanelOpen(false)} className="text-slate-400 hover:text-rose-500"><X size={16}/></button>
              </div>
              <div className="space-y-3">
                  <button onClick={() => setMapMode('MARKERS')} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all border ${mapMode === 'MARKERS' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-50 border-transparent text-slate-500'}`}>
                    <LayoutGrid size={18}/>
                    <span className="text-[9px] font-black uppercase tracking-widest">Unidades</span>
                  </button>
                  <button onClick={() => setMapMode('HEATMAP')} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all border ${mapMode === 'HEATMAP' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-50 border-transparent text-slate-500'}`}>
                    <Flame size={18}/>
                    <span className="text-[9px] font-black uppercase tracking-widest">Calor Social</span>
                  </button>
                  <button onClick={() => setMapMode('PATROL')} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all border ${mapMode === 'PATROL' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-50 border-transparent text-slate-500'}`}>
                    <Radio size={18} className="animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Patrulha Drone</span>
                  </button>
              </div>
          </div>
      )}

      {/* UNIT DOSSIER FLOATING FOOTER */}
      {selectedUnit && (
          <div className="absolute bottom-6 left-6 right-6 lg:left-auto lg:w-[450px] z-[2000] animate-scale-in">
              <div className={`backdrop-blur-3xl rounded-[3rem] shadow-2xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
                  <div className="p-8 pb-4 flex justify-between items-start">
                      <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-xl border-2 border-white/10">
                              <UserIcon size={28}/>
                          </div>
                          <div>
                              <h4 className={`text-xl font-black uppercase leading-none tracking-tight mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{selectedUnit.residentName}</h4>
                              <div className="flex gap-2">
                                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-indigo-500/20">Unid {selectedUnit.unit}</span>
                                  <span className="px-3 py-1 bg-slate-500/10 text-slate-400 rounded-lg text-[8px] font-black uppercase tracking-widest">{selectedUnit.role}</span>
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setSelectedUnit(null)} className="p-3 text-slate-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all"><X size={20}/></button>
                  </div>

                  <div className="px-8 pb-8 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                          <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Fingerprint size={12} className="text-indigo-500"/> Documento</p>
                              <p className={`text-[10px] font-black uppercase ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{selectedUnit.cpf}</p>
                          </div>
                          <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Calendar size={12} className="text-indigo-500"/> Idade</p>
                              <p className={`text-[10px] font-black uppercase ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{selectedUnit.age} Anos</p>
                          </div>
                      </div>

                      <div className="flex gap-3">
                          <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"><Brain size={14}/> Dossiê</button>
                          <a href={`https://wa.me/${selectedUnit.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl hover:bg-emerald-500 active:scale-95 flex items-center justify-center transition-all"><Phone size={20}/></a>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MAP CONTROLS FLOATING */}
      <div className="absolute top-1/2 -translate-y-1/2 right-6 z-[2000] flex flex-col gap-4">
          <div className={`backdrop-blur-3xl p-1.5 rounded-2xl border shadow-xl flex flex-col gap-1 ${theme === 'dark' ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
              <button onClick={() => mapInstanceRef.current?.zoomIn()} className="p-3 text-slate-400 hover:text-indigo-600 transition-all hover:bg-slate-50 rounded-xl"><Plus size={20}/></button>
              <div className="h-px bg-slate-200 mx-2"></div>
              <button onClick={() => mapInstanceRef.current?.zoomOut()} className="p-3 text-slate-400 hover:text-indigo-600 transition-all hover:bg-slate-50 rounded-xl"><ZoomOut size={20}/></button>
          </div>
          <button className={`p-4 backdrop-blur-3xl rounded-3xl border shadow-xl transition-all ${theme === 'dark' ? 'bg-slate-900/80 border-white/10 text-indigo-400' : 'bg-white/80 border-slate-200 text-indigo-600'}`}>
              <Home size={22} />
          </button>
          <button onClick={() => { if(selectedUnit) focusOnUnit(selectedUnit); }} className={`p-4 backdrop-blur-3xl rounded-3xl border shadow-xl transition-all ${theme === 'dark' ? 'bg-slate-900/80 border-white/10 text-indigo-400' : 'bg-white/80 border-slate-200 text-indigo-600'}`}>
              <Navigation2 size={22} className="animate-pulse" />
          </button>
      </div>

      <style>{`
        .leaflet-container { background: ${theme === 'dark' ? '#020617' : '#f1f5f9'} !important; }
        .custom-marker { background: none !important; border: none !important; }
        .patrol-animate { 
            stroke-dasharray: 10, 10;
            animation: dash 20s linear infinite; 
        }
        @keyframes dash {
            from { stroke-dashoffset: 200; }
            to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};

export default SmartMap;
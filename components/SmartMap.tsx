
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UnitData, SystemInfo, SocialData } from '../types';
import { mapService, aiService } from '../services/api';
import { 
  Loader2, X, Map as MapIcon, Layers, Flame, User as UserIcon, 
  MapPin, Search, Plus, Sparkles, Brain, LayoutGrid,
  ZoomIn, ZoomOut, Navigation2, Phone, Calendar, Heart,
  Fingerprint, Briefcase, GraduationCap, ShieldCheck, Sun, Moon,
  Home, Building2, MapPinned, AlertCircle
} from 'lucide-react';
import * as L from 'leaflet';

interface SmartMapProps {
  systemInfo?: SystemInfo;
}

const SmartMap = ({ systemInfo }: SmartMapProps) => {
  const [allUnits, setAllUnits] = useState<UnitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<UnitData | null>(null);
  const [mapMode, setMapMode] = useState<'MARKERS' | 'HEATMAP'>('MARKERS');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markersGroupRef = useRef<any | null>(null);
  const tileLayerRef = useRef<any | null>(null);
  const heatLayerRef = useRef<any | null>(null);

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

  // MOTOR DE BUSCA EM TEMPO REAL
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

    allUnits.forEach(unit => {
      const riskColor = (unit.socialData?.risk || 0) > 70 ? '#ef4444' : (unit.socialData?.risk || 0) > 40 ? '#f59e0b' : '#4f46e5';
      const isActive = selectedUnit?.id === unit.id;

      if (mapMode === 'MARKERS') {
        L.marker([unit.coordinates.lat, unit.coordinates.lng] as any, {
          icon: L.divIcon({ 
            className: 'custom-marker', 
            html: `
              <div class="relative group">
                <div class="w-10 h-10 rounded-full border-4 ${isActive ? 'border-white scale-125 shadow-[0_0_30px_rgba(79,70,229,0.8)]' : 'border-white shadow-xl'} transition-all flex items-center justify-center" style="background-color: ${riskColor}">
                  <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </div>`
          })
        }).on('click', () => focusOnUnit(unit)).addTo(markersGroupRef.current);
      }
    });

    if (mapMode === 'HEATMAP' && (window as any).L.heatLayer) {
        const heatPoints = allUnits.map(u => [u.coordinates.lat, u.coordinates.lng, (u.socialData?.risk || 50) / 100]);
        heatLayerRef.current = (window as any).L.heatLayer(heatPoints, { radius: 35, blur: 15 }).addTo(mapInstanceRef.current);
    }
  }, [allUnits, mapMode, selectedUnit, theme]);

  return (
    <div className={`h-screen w-full flex flex-col relative overflow-hidden transition-all duration-700 ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div ref={mapContainerRef} className={`absolute inset-0 z-0 ${theme === 'dark' ? 'brightness-[0.7] contrast-[1.2]' : ''}`}></div>

      {/* FLOATING SEARCH HUD (GOOGLE MAPS STYLE) */}
      <div className="absolute top-10 left-10 z-[2000] w-full max-w-[500px] px-6 lg:px-0">
          <div className={`backdrop-blur-3xl p-3 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] border transition-all ${theme === 'dark' ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
              <div className="flex items-center gap-4">
                  <div className="pl-6 text-indigo-500"><Search size={22} className="animate-pulse" /></div>
                  <input 
                      type="text" 
                      placeholder="Pesquisar Membro, Unid, CPF..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`flex-1 bg-transparent border-none outline-none font-black text-sm py-4 uppercase tracking-widest placeholder:text-slate-300 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
                  />
                  <div className="flex items-center gap-2 pr-4">
                    <button onClick={() => setLayersPanelOpen(!layersPanelOpen)} title="Camadas" className={`p-4 rounded-2xl transition-all ${layersPanelOpen ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}>
                        <Layers size={20}/>
                    </button>
                    <div className="w-px h-8 bg-slate-200 mx-2"></div>
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-4 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all">
                        {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
                    </button>
                  </div>
              </div>

              {/* SEARCH RESULTS DINÂMICOS */}
              {searchResults.length > 0 && (
                  <div className={`mt-4 py-3 border-t overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                      {searchResults.map(res => (
                          <button key={res.id} onClick={() => handleSelectFromSearch(res)} className={`w-full flex items-center gap-5 px-6 py-5 text-left transition-all border-b last:border-0 ${theme === 'dark' ? 'hover:bg-white/5 border-white/5' : 'hover:bg-slate-50 border-slate-50'}`}>
                              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                                  <UserIcon size={20}/>
                              </div>
                              <div className="min-w-0 flex-1">
                                  <div className="flex justify-between items-center mb-1">
                                      <p className={`text-sm font-black uppercase truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{res.residentName}</p>
                                      <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase border border-slate-200">Unid {res.unit}</span>
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Documento: {res.cpf}</p>
                              </div>
                          </button>
                      ))}
                  </div>
              )}
          </div>
      </div>

      {/* MODAL DE CAMADAS (HUD) */}
      {layersPanelOpen && (
          <div className={`absolute top-40 left-10 z-[2000] w-[340px] backdrop-blur-3xl rounded-[3rem] border shadow-2xl animate-slide-up p-10 ${theme === 'dark' ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
              <div className="flex justify-between items-center mb-8 px-2">
                <h5 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em]">Malha Territorial</h5>
                <button onClick={() => setLayersPanelOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={18}/></button>
              </div>
              <div className="space-y-4">
                  <button onClick={() => setMapMode('MARKERS')} className={`w-full flex items-center justify-between p-6 rounded-[2rem] transition-all border ${mapMode === 'MARKERS' ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}>
                    <div className="flex items-center gap-4">
                        <LayoutGrid size={20}/>
                        <span className="text-[11px] font-black uppercase tracking-widest">Registros Ativos</span>
                    </div>
                    {mapMode === 'MARKERS' && <ShieldCheck size={18}/>}
                  </button>
                  <button onClick={() => setMapMode('HEATMAP')} className={`w-full flex items-center justify-between p-6 rounded-[2rem] transition-all border ${mapMode === 'HEATMAP' ? 'bg-rose-600 text-white border-rose-500 shadow-xl' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}>
                    <div className="flex items-center gap-4">
                        <Flame size={20}/>
                        <span className="text-[11px] font-black uppercase tracking-widest">Calor Social</span>
                    </div>
                    {mapMode === 'HEATMAP' && <ShieldCheck size={18}/>}
                  </button>
              </div>
          </div>
      )}

      {/* DOSSIÊ DO MORADOR (HUD INFERIOR) */}
      {selectedUnit && (
          <div className="absolute bottom-10 right-10 left-10 lg:left-auto lg:w-[500px] z-[2000] animate-slide-up">
              <div className={`backdrop-blur-3xl rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)] border overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
                  <div className="p-10 pb-6 flex justify-between items-start">
                      <div className="flex items-center gap-8">
                          <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl border-4 border-white/10 transition-transform hover:rotate-3">
                              <UserIcon size={40}/>
                          </div>
                          <div>
                              <h4 className={`text-3xl font-black uppercase leading-none tracking-tight mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{selectedUnit.residentName}</h4>
                              <div className="flex gap-3">
                                  <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-indigo-500/20"><MapPin size={12}/> Unid {selectedUnit.unit}</span>
                                  <span className="px-4 py-1.5 bg-slate-500/10 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-500/20">{selectedUnit.role}</span>
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setSelectedUnit(null)} className="p-4 text-slate-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all border border-transparent shadow-inner"><X size={24}/></button>
                  </div>

                  <div className="px-10 pb-10 space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                          <div className={`p-6 rounded-[2rem] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Fingerprint size={14} className="text-indigo-500"/> Documento</p>
                              <p className={`text-sm font-black uppercase ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{selectedUnit.cpf}</p>
                          </div>
                          <div className={`p-6 rounded-[2rem] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Calendar size={14} className="text-indigo-500"/> Idade</p>
                              <p className={`text-sm font-black uppercase ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{selectedUnit.age} Anos</p>
                          </div>
                      </div>

                      <div className="flex gap-4">
                          <button className="flex-1 py-6 bg-slate-950 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"><Brain size={18}/> Dossiê Master</button>
                          <a href={`https://wa.me/${selectedUnit.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-6 bg-emerald-600 text-white rounded-[2rem] shadow-2xl hover:bg-emerald-500 transition-all active:scale-95 flex items-center justify-center"><Phone size={24}/></a>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MAP TOOLS FLOATING (RIGHT) */}
      <div className="absolute top-1/2 -translate-y-1/2 right-10 z-[2000] flex flex-col gap-6">
          <div className={`backdrop-blur-3xl p-2 rounded-[2rem] border shadow-2xl flex flex-col gap-2 ${theme === 'dark' ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
              <button onClick={() => mapInstanceRef.current?.zoomIn()} className="p-5 text-slate-400 hover:text-indigo-600 transition-all hover:bg-slate-50 rounded-2xl"><Plus size={28}/></button>
              <div className="h-px bg-slate-200 mx-4"></div>
              <button onClick={() => mapInstanceRef.current?.zoomOut()} className="p-5 text-slate-400 hover:text-indigo-600 transition-all hover:bg-slate-50 rounded-2xl"><ZoomOut size={28}/></button>
          </div>
          <button className={`p-8 backdrop-blur-3xl rounded-[2.5rem] border shadow-2xl transition-all ${theme === 'dark' ? 'bg-slate-900/80 border-white/10 text-indigo-400' : 'bg-white/80 border-slate-200 text-indigo-600'}`}>
              <Home size={28} />
          </button>
          <button onClick={() => { if(selectedUnit) focusOnUnit(selectedUnit); }} className={`p-8 backdrop-blur-3xl rounded-[2.5rem] border shadow-2xl transition-all ${theme === 'dark' ? 'bg-slate-900/80 border-white/10 text-indigo-400' : 'bg-white/80 border-slate-200 text-indigo-600'}`}>
              <Navigation2 size={28} className="animate-pulse" />
          </button>
      </div>

      <style>{`
        .leaflet-container { background: ${theme === 'dark' ? '#020617' : '#f1f5f9'} !important; cursor: crosshair !important; }
        .custom-marker { background: none !important; border: none !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(79, 70, 229, 0.4); border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default SmartMap;

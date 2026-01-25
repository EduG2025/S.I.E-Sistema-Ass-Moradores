import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SystemInfo, User, Incident } from '../types';
import { mapService, operationsService } from '../services/api';
import { Search, Loader2, Target, Crosshair, Users, ShieldAlert, Fingerprint, ChevronRight, Globe, MapPin } from 'lucide-react';

/**
 * S.I.E SmartMap V21.0 - TACTICAL COMMAND INTERFACE
 * SRE Operational Standard - Global Object Persistence & Address Prioritization.
 */

declare const L: any;

interface SmartMapProps {
  systemInfo?: SystemInfo;
  activeLayers: { residents: boolean, incidents: boolean, heatmap: boolean };
  onSelectEntity: (entity: any) => void;
  focusCoord?: { lat: number, lng: number } | null;
  showSearch?: boolean;
}

const SmartMap = ({ systemInfo, activeLayers, onSelectEntity, focusCoord, showSearch = true }: SmartMapProps) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [units, setUnits] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  
  const registry = useRef<any>({
    markersGroup: null,
    incidentsGroup: null,
    circlesGroup: null,
    heatGroup: null,
    pingLayer: null
  });

  const primaryColor = systemInfo?.primaryColor || '#4f46e5';

  const epicenter = useMemo(() => {
    let raw = systemInfo?.coordinates;
    const fallback = { lat: -22.6288, lng: -43.8975 };
    if (!raw) return fallback;
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number' && !isNaN(parsed.lat) && !isNaN(parsed.lng)) {
            return parsed;
        }
        return fallback;
    } catch (e) { return fallback; }
  }, [systemInfo]);

  const loadMapData = async () => {
    try {
      const [resUnits, resIncidents] = await Promise.allSettled([
        mapService.getUnits(),
        operationsService.getIncidents()
      ]);
      if (resUnits.status === 'fulfilled') setUnits(resUnits.value.data?.data || []);
      if (resIncidents.status === 'fulfilled') setIncidents(resIncidents.value.data?.data || []);
    } catch (e) { console.warn("SRE: Map layer degradation."); }
  };

  const initMap = useCallback(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || !window.hasOwnProperty('L')) return;
    
    const container = mapContainerRef.current;
    if (container.clientHeight === 0) container.style.minHeight = "400px";

    const map = L.map(container, {
      center: [epicenter.lat, epicenter.lng],
      zoom: 16,
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { 
        maxZoom: 20 
    }).addTo(map);

    registry.current.markersGroup = L.layerGroup().addTo(map);
    registry.current.incidentsGroup = L.layerGroup().addTo(map);
    registry.current.circlesGroup = L.layerGroup().addTo(map);
    registry.current.heatGroup = L.layerGroup().addTo(map);
    registry.current.pingLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    loadMapData();

    setTimeout(() => {
        map.invalidateSize();
    }, 250);

    const observer = new ResizeObserver(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [epicenter]);

  useEffect(() => {
    const timer = setTimeout(initMap, 100);
    return () => {
        clearTimeout(timer);
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, [initMap]);

  const triggerPing = (lat: number, lng: number) => {
    if (!mapInstanceRef.current || !registry.current.pingLayer) return;
    const map = mapInstanceRef.current;
    map.flyTo([lat, lng], 18, { duration: 2.5, easeLinearity: 0.25 });
    
    registry.current.pingLayer.clearLayers();
    const pingIcon = L.divIcon({
        className: 'sat-ping-effect',
        html: `<div style="border-color: ${primaryColor};" class="sat-pulse-container"><div class="sat-pulse-ring"></div><div class="sat-pulse-dot" style="background-color: ${primaryColor};"></div></div>`,
        iconSize: [80, 80]
    });
    L.marker([lat, lng], { icon: pingIcon, interactive: false }).addTo(registry.current.pingLayer);
    setTimeout(() => {
        if (registry.current.pingLayer) registry.current.pingLayer.clearLayers();
    }, 4000);
  };

  useEffect(() => { if (focusCoord) triggerPing(focusCoord.lat, focusCoord.lng); }, [focusCoord]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;
    
    setIsSearching(true);
    setSearchResults([]);
    setShowResults(false);

    try {
        const localRes = await mapService.searchAdvanced(searchQuery);
        const internalResults = localRes.data.internal || [];
        
        // SRE Protocol: Se a query parecer endereço (contém Rua, Av, CEP ou número), prioriza o Nominatim
        const isLikelyAddress = /rua|av|avenida|travessa|alameda|rodovia|cep|\d{5}-\d{3}/i.test(searchQuery);

        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=4`, {
            headers: { 'User-Agent': 'SIE-Pro-Tactical-Map/2.0' }
        });
        const geoData = await geoRes.json();
        const addressResults = geoData.map((item: any) => ({
            id: `geo_${item.place_id}`,
            name: item.display_name,
            isAddress: true,
            coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
        }));

        // Consolidação inteligente
        const combined = isLikelyAddress ? [...addressResults, ...internalResults] : [...internalResults, ...addressResults];
        setSearchResults(combined);
        setShowResults(combined.length > 0);

        if (localRes.data.focus_coordinate) {
            triggerPing(localRes.data.focus_coordinate.lat, localRes.data.focus_coordinate.lng);
            if (internalResults.length === 1) {
                onSelectEntity(internalResults[0]);
                setShowResults(false);
            }
        } else if (combined.length === 1) {
            handleSelectItem(combined[0]);
        }
    } catch (e) {
        console.error("SRE Tactical Search Failure");
    } finally {
        setIsSearching(false);
    }
  };

  const handleSelectItem = (item: any) => {
    if (item.isAddress) {
        triggerPing(item.coordinates.lat, item.coordinates.lng);
    } else {
        onSelectEntity(item);
        if (item.coordinates) {
            const coords = typeof item.coordinates === 'string' ? JSON.parse(item.coordinates) : item.coordinates;
            triggerPing(coords.lat, coords.lng);
        }
    }
    setShowResults(false);
  };

  useEffect(() => {
    if (mapInstanceRef.current) setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50);
  }, [activeLayers]);

  useEffect(() => {
    if (!mapInstanceRef.current || !registry.current.heatGroup) return;
    registry.current.heatGroup.clearLayers();
    if (activeLayers.heatmap) {
      operationsService.getHeatmap().then(res => {
        const points = res.data?.data || [];
        if (points.length > 0 && L.heatLayer) {
          L.heatLayer(points, { radius: 35, blur: 25, maxZoom: 17, gradient: { 0.4: 'blue', 0.6: '#4f46e5', 1: '#ef4444' } }).addTo(registry.current.heatGroup);
        }
      }).catch(() => {});
    }
  }, [activeLayers.heatmap]);

  useEffect(() => {
    if (!mapInstanceRef.current || !registry.current.markersGroup) return;
    registry.current.markersGroup.clearLayers();
    if (activeLayers.residents) {
      units.forEach(u => {
        if (!u.coordinates) return;
        try {
            const coords = typeof u.coordinates === 'string' ? JSON.parse(u.coordinates) : u.coordinates;
            const icon = L.divIcon({
              className: 'custom-marker',
              html: `<div style="background-color: ${primaryColor}; box-shadow: 0 0 10px ${primaryColor}40;" class="w-3.5 h-3.5 rounded-full border-2 border-white transition-all hover:scale-150"></div>`,
              iconSize: [14, 14]
            });
            L.marker([coords.lat, coords.lng], { icon }).on('click', () => onSelectEntity(u)).addTo(registry.current.markersGroup);
        } catch(err) {}
      });
    }
  }, [units, activeLayers.residents, primaryColor, onSelectEntity]);

  useEffect(() => {
    if (!mapInstanceRef.current || !registry.current.incidentsGroup) return;
    registry.current.incidentsGroup.clearLayers();
    registry.current.circlesGroup.clearLayers();
    if (activeLayers.incidents) {
      incidents.forEach((inc: Incident) => {
        if (!inc.coordinates) return;
        try {
            const coords = typeof inc.coordinates === 'string' ? JSON.parse(inc.coordinates) : inc.coordinates;
            const color = inc.priority?.includes('NÍVEL 4') ? '#f43f5e' : '#fbbf24';
            const radMeters = (inc.radius || 0.1) * 1000;
            L.circle([coords.lat, coords.lng], { radius: radMeters, color, fillColor: color, fillOpacity: 0.1, weight: 1.5 }).addTo(registry.current.circlesGroup);
            const icon = L.divIcon({ className: 'tactical-pulse', html: `<div style="background-color: ${color};" class="w-8 h-8 rounded-full animate-pulse border-2 border-white shadow-2xl flex items-center justify-center text-white font-black text-[10px] shadow-rose-500/20">!</div>`, iconSize: [32, 32] });
            L.marker([coords.lat, coords.lng], { icon }).on('click', () => onSelectEntity({ ...inc, isIncident: true })).addTo(registry.current.incidentsGroup);
        } catch(err) {}
      });
    }
  }, [incidents, activeLayers.incidents, onSelectEntity]);

  return (
    <div className="h-full w-full relative bg-[#020617] overflow-hidden flex flex-col">
      {showSearch && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-2xl px-6">
            <div className="relative">
                <form onSubmit={handleSearch} className="group relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                        {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                    </div>
                    <input 
                        type="text" 
                        placeholder="BUSCAR ENDEREÇO, CEP OU MEMBRO..." 
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); if(!e.target.value) setShowResults(false); }}
                        className="w-full pl-16 pr-24 py-6 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl text-[11px] font-black uppercase text-white tracking-[0.2em] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6)] outline-none focus:border-indigo-500/50 focus:ring-8 focus:ring-indigo-500/5 transition-all placeholder:text-slate-600"
                    />
                    <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-3.5 bg-indigo-600/20 text-indigo-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/20 shadow-lg">
                        <Target size={18}/>
                    </button>
                </form>

                {showResults && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-down max-h-[400px]">
                        <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{searchResults.length} Resultados Localizados</span>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar">
                            {searchResults.map(item => (
                                <div key={item.id} onClick={() => handleSelectItem(item)} className="p-5 hover:bg-white/5 cursor-pointer flex items-center justify-between group transition-colors">
                                    <div className="flex items-center gap-5">
                                        <div className="w-11 h-11 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
                                            {item.isAddress ? <MapPin size={18}/> : <Users size={18}/>}
                                        </div>
                                        <div className="max-w-[400px]">
                                            <p className="text-xs font-black text-white uppercase truncate">{item.name || item.display_name}</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                                                {item.isAddress ? 'Localização Global' : `Unid. ${item.unit || '---'} • Membro`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                        <ChevronRight size={16}/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      <div className="absolute bottom-10 right-10 z-[1000] flex flex-col gap-4">
          <div className="bg-slate-900/90 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-2xl space-y-3">
              <button onClick={() => mapInstanceRef.current?.flyTo([epicenter.lat, epicenter.lng], 16)} className="p-4 bg-white/5 text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Sede Central"><Crosshair size={24}/></button>
              <div className="w-full h-px bg-white/5"></div>
              <div className="flex flex-col items-center gap-4 py-2">
                  <div className="flex flex-col items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"></div><span className="text-[7px] font-black text-slate-500 uppercase">SAT-1</span></div>
                  <div className="flex flex-col items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></div><span className="text-[7px] font-black text-slate-500 uppercase">SYNC</span></div>
              </div>
          </div>
      </div>

      <div ref={mapContainerRef} className="flex-1 w-full h-full relative z-0 outline-none grayscale-[0.2] hover:grayscale-0 transition-all duration-1000 overflow-hidden" />
      <style>{`
        .leaflet-container { background: #020617 !important; border: none !important; width: 100% !important; height: 100% !important; flex-grow: 1; display: block; }
        .sat-pulse-container { position: relative; display: flex; align-items: center; justify-content: center; }
        .sat-pulse-ring { position: absolute; width: 100%; height: 100%; border: 4px solid; border-radius: 50%; animation: sat-pulse-anim 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1); opacity: 0; }
        .sat-pulse-dot { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 20px currentColor; }
        @keyframes sat-pulse-anim { 0% { transform: scale(0.1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
        .custom-marker { cursor: pointer; }
        .tactical-pulse { cursor: pointer; filter: drop-shadow(0 0 10px rgba(244,63,94,0.4)); }
      `}</style>
    </div>
  );
};

export default SmartMap;
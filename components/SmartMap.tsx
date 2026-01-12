
import React, { useState, useEffect, useRef } from 'react';
import { UnitData, SystemInfo } from '../types';
import { mapService } from '../services/api';
import { Loader2, X, Map as MapIcon, Layers, Flame, User, MapPin, RefreshCw, Info } from 'lucide-react';
import * as L from 'leaflet';

interface SmartMapProps {
  systemInfo?: SystemInfo;
}

const SmartMap = ({ systemInfo }: SmartMapProps) => {
  const [allUnits, setAllUnits] = useState<UnitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<UnitData | null>(null);
  const [activeLayer, setActiveLayer] = useState('TODOS');
  const [mapMode, setMapMode] = useState<'MARKERS' | 'HEATMAP'>('MARKERS');
  
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markersGroupRef = useRef<any | null>(null);
  const heatLayerRef = useRef<any | null>(null);

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
          unit: u.unit || 'S/N',
          coordinates: typeof u.coordinates === 'string' ? JSON.parse(u.coordinates) : u.coordinates,
          tags: (typeof u.socialData === 'string' ? JSON.parse(u.socialData) : u.socialData)?.tags || [],
      })).filter((u: any) => u.coordinates?.lat && u.coordinates?.lng);

      setAllUnits(mappedUnits);
    } catch (e) { setAllUnits([]); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (!isLoading && mapContainerRef.current && !mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current, { center: [-23.5505, -46.6333], zoom: 15, zoomControl: false, attributionControl: false });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstanceRef.current);
        markersGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    markersGroupRef.current.clearLayers();
    if (heatLayerRef.current) { mapInstanceRef.current.removeLayer(heatLayerRef.current); heatLayerRef.current = null; }

    const filtered = allUnits.filter(u => activeLayer === 'TODOS' || u.tags?.includes(activeLayer));
    if (filtered.length > 0) {
      const heatPoints: any[] = [];
      const bounds: any[] = [];

      filtered.forEach(unit => {
        const coords = [unit.coordinates.lat, unit.coordinates.lng];
        bounds.push(coords);
        heatPoints.push([...coords, 0.6]);

        if (mapMode === 'MARKERS') {
          const marker = L.marker(coords as any, {
            icon: L.divIcon({ className: 'custom-marker', html: `<div class="w-4 h-4 rounded-full border-2 border-white shadow-xl bg-indigo-600"></div>` })
          }).on('click', () => setSelectedUnit(unit));
          markersGroupRef.current.addLayer(marker);
        }
      });

      if (mapMode === 'HEATMAP' && (window as any).L.heatLayer) {
          heatLayerRef.current = (window as any).L.heatLayer(heatPoints, { radius: 30, blur: 15 }).addTo(mapInstanceRef.current);
      }
      mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), { padding: [100, 100] });
    }
  }, [allUnits, activeLayer, mapMode]);

  return (
    <div className="h-full w-full flex flex-col relative bg-slate-50 rounded-[3rem] overflow-hidden min-h-[600px] border border-slate-200 shadow-inner">
      <div ref={mapContainerRef} className="absolute inset-0 z-0 grayscale-[0.5] contrast-[1.1]"></div>
      
      <div className="absolute top-8 left-8 z-[1000] flex flex-col gap-4">
        <div className="bg-slate-900/90 backdrop-blur-2xl p-6 rounded-[2.5rem] shadow-2xl border border-white/10 min-w-[240px]">
          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4 ml-1">Filtros Geográficos</p>
          {['TODOS', 'ALTO_RISCO', 'IDOSO_SOLO', 'PCD'].map(layer => (
            <button key={layer} onClick={() => setActiveLayer(layer)} className={`block w-full text-left px-5 py-3.5 text-[10px] font-black uppercase rounded-2xl mb-2 transition-all border ${activeLayer === layer ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}>
              {layer.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      
      <div className="absolute top-8 right-8 z-[1000]">
         <div className="bg-white/90 backdrop-blur-2xl p-2 rounded-[2rem] shadow-2xl border border-slate-200 flex gap-2">
            <button onClick={() => setMapMode('MARKERS')} className={`p-4 rounded-xl transition-all ${mapMode === 'MARKERS' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-indigo-600'}`}><Layers size={22}/></button>
            <button onClick={() => setMapMode('HEATMAP')} className={`p-4 rounded-xl transition-all ${mapMode === 'HEATMAP' ? 'bg-rose-600 text-white shadow-xl' : 'text-slate-400 hover:text-rose-600'}`}><Flame size={22}/></button>
         </div>
      </div>

      {selectedUnit && (
          <div className="absolute bottom-10 left-10 right-10 z-[2000] animate-slide-up">
              <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-slate-200 flex justify-between items-center max-w-4xl mx-auto">
                  <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner"><User size={32}/></div>
                      <div>
                          <h4 className="text-xl font-black text-slate-800 tracking-tight">{selectedUnit.residentName}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">UNIDADE: {selectedUnit.unit} • CLUSTER AMC</p>
                      </div>
                  </div>
                  <button onClick={() => setSelectedUnit(null)} className="p-4 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-all"><X size={24}/></button>
              </div>
          </div>
      )}

      {isLoading && (
          <div className="absolute inset-0 z-[3000] bg-slate-900/10 backdrop-blur-md flex flex-col items-center justify-center">
              <div className="p-10 bg-white rounded-[3rem] shadow-2xl flex flex-col items-center">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Processando Smart Map...</p>
              </div>
          </div>
      )}
    </div>
  );
};

export default SmartMap;

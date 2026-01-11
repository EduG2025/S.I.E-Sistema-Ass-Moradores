import React, { useState, useEffect, useRef } from 'react';
import { UnitData, SystemInfo } from '../types';
import { mapService } from '../services/api';
import { Loader2, X, Map as MapIcon, Layers, Flame, User, MapPin } from 'lucide-react';
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
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const loadUnits = async () => {
    setIsLoading(true);
    try {
      const res = await mapService.getUnits();
      const rawUsers = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      
      const mappedUnits = rawUsers.map((u: any) => {
          const social = typeof u.socialData === 'string' ? JSON.parse(u.socialData) : u.socialData;
          return {
              id: u.id,
              residentName: u.name,
              unit: u.unit || 'S/N',
              coordinates: typeof u.coordinates === 'string' ? JSON.parse(u.coordinates) : u.coordinates,
              tags: social?.tags || [],
              incomeRange: social?.incomeRange || 'N/A'
          };
      }).filter((u: any) => u.coordinates?.lat);

      setAllUnits(mappedUnits);
    } catch (e) {
      console.error("Erro no Geoprocessamento", e);
      setAllUnits([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && mapContainerRef.current && !mapInstanceRef.current) {
      setTimeout(() => {
        if (!mapContainerRef.current) return;
        mapInstanceRef.current = L.map(mapContainerRef.current, {
          center: [-23.5505, -46.6333],
          zoom: 16,
          zoomControl: false,
          attributionControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstanceRef.current);
        markersGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
        mapInstanceRef.current.invalidateSize();
      }, 100);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    if (heatLayerRef.current) { mapInstanceRef.current.removeLayer(heatLayerRef.current); }

    const filtered = allUnits.filter(u => 
      activeLayer === 'TODOS' || (u.tags && u.tags.includes(activeLayer as any))
    );

    if (filtered.length > 0) {
      const bounds: any[] = [];
      const heatPoints: any[] = [];

      filtered.forEach(unit => {
        if (!unit.coordinates) return;
        const intensity = unit.tags?.includes('AJUDA_URGENTE') ? 1.0 : 0.4;
        heatPoints.push([unit.coordinates.lat, unit.coordinates.lng, intensity]);

        if (mapMode === 'MARKERS') {
          const color = unit.tags?.includes('AJUDA_URGENTE') ? '#ef4444' : '#4f46e5';
          const marker = L.marker([unit.coordinates.lat, unit.coordinates.lng], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="background:${color}; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px ${color}88;"></div>`
            })
          }).on('click', () => setSelectedUnit(unit));
          markersGroupRef.current.addLayer(marker);
        }
        bounds.push([unit.coordinates.lat, unit.coordinates.lng]);
      });

      if (mapMode === 'HEATMAP') {
        // @ts-ignore
        heatLayerRef.current = L.heatLayer(heatPoints, { radius: 25, blur: 15 }).addTo(mapInstanceRef.current);
      }
      if (bounds.length > 0) mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] });
    }
  }, [allUnits, activeLayer, mapMode]);

  return (
    <div className="h-full w-full flex flex-col relative bg-slate-100 rounded-3xl overflow-hidden min-h-[500px]">
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-200">
          <p className="text-[8px] font-black text-slate-400 uppercase px-3 mb-2 tracking-tighter">Observatório SRE</p>
          {['TODOS', 'AJUDA_URGENTE', 'BAIXA_RENDA', 'IDOSO_SOLO'].map(layer => (
            <button key={layer} onClick={() => setActiveLayer(layer)} className={`block w-full text-left px-4 py-2 text-[9px] font-black uppercase rounded-xl mb-1 transition-all ${activeLayer === layer ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-200'}`}>
              {layer.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      <div className="absolute top-4 right-4 z-[1000] flex gap-2">
         <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-200 flex gap-1">
            <button onClick={() => setMapMode('MARKERS')} className={`p-3 rounded-xl ${mapMode === 'MARKERS' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Layers size={18}/></button>
            <button onClick={() => setMapMode('HEATMAP')} className={`p-3 rounded-xl ${mapMode === 'HEATMAP' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}><Flame size={18}/></button>
         </div>
      </div>
      <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>
      
      {selectedUnit && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4 animate-scale-in">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><User size={24}/></div>
                <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">{selectedUnit.residentName}</h3>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1"><MapPin size={10}/> Unidade {selectedUnit.unit}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUnit(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-300"><X size={24}/></button>
            </div>
            <div className="flex flex-wrap gap-2">
                {selectedUnit.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 text-[8px] font-black uppercase rounded-lg">{tag}</span>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartMap;

import React, { useState, useEffect, useRef } from 'react';
import { UnitData, SystemInfo } from '../types';
import { mapService } from '../services/api';
import { Loader2, X, Map as MapIcon, Layers, Flame, User, MapPin, RefreshCw } from 'lucide-react';
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
          const coords = typeof u.coordinates === 'string' ? JSON.parse(u.coordinates) : u.coordinates;
          return {
              id: u.id,
              residentName: u.name,
              unit: u.unit || 'S/N',
              coordinates: coords,
              tags: social?.tags || [],
              incomeRange: social?.incomeRange || 'N/A'
          };
      }).filter((u: any) => u.coordinates?.lat && u.coordinates?.lng);

      setAllUnits(mappedUnits);
    } catch (e) {
      console.error("[SRE MAP] Erro no Geoprocessamento:", e);
      setAllUnits([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && mapContainerRef.current && !mapInstanceRef.current) {
      setTimeout(() => {
        if (!mapContainerRef.current) return;
        
        const defaultCenter: [number, number] = [-23.5505, -46.6333];

        mapInstanceRef.current = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 15,
          zoomControl: false,
          attributionControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstanceRef.current);
        markersGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
        mapInstanceRef.current.invalidateSize();
      }, 300);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    
    // SRE HEAT LAYER FIX: Acesso via instância global window para evitar erro de runtime
    const globalL = (window as any).L;
    if (heatLayerRef.current) { 
        mapInstanceRef.current.removeLayer(heatLayerRef.current); 
        heatLayerRef.current = null;
    }

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
                html: `<div style="background:${color}; width:16px; height:16px; border-radius:50%; border:3px solid white;"></div>`
            })
          }).on('click', () => setSelectedUnit(unit));
          markersGroupRef.current.addLayer(marker);
        }
        bounds.push([unit.coordinates.lat, unit.coordinates.lng]);
      });

      if (mapMode === 'HEATMAP' && globalL?.heatLayer) {
        try {
            heatLayerRef.current = globalL.heatLayer(heatPoints, { radius: 35, blur: 15 }).addTo(mapInstanceRef.current);
        } catch (err) {
            console.error("[SRE] Falha ao injetar HeatLayer:", err);
        }
      }
      
      if (bounds.length > 0) {
          mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), { padding: [100, 100], maxZoom: 17 });
      }
    }
  }, [allUnits, activeLayer, mapMode]);

  return (
    <div className="h-full w-full flex flex-col relative bg-slate-100 rounded-[3rem] overflow-hidden min-h-[600px] border border-slate-200">
      <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>
      
      <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
        <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border border-slate-200 min-w-[220px]">
          {['TODOS', 'AJUDA_URGENTE', 'BAIXA_RENDA', 'IDOSO_SOLO'].map(layer => (
            <button 
                key={layer} 
                onClick={() => setActiveLayer(layer)} 
                className={`block w-full text-left px-4 py-3 text-[10px] font-black uppercase rounded-xl mb-1.5 transition-all ${activeLayer === layer ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              {layer.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      
      <div className="absolute top-6 right-6 z-[1000]">
         <div className="bg-white/90 backdrop-blur-xl p-2 rounded-[1.5rem] shadow-2xl border border-slate-200 flex gap-2">
            <button onClick={() => setMapMode('MARKERS')} className={`p-4 rounded-xl transition-all ${mapMode === 'MARKERS' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Layers size={22}/></button>
            <button onClick={() => setMapMode('HEATMAP')} className={`p-4 rounded-xl transition-all ${mapMode === 'HEATMAP' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}><Flame size={22}/></button>
         </div>
      </div>

      {isLoading && (
          <div className="absolute inset-0 z-[2000] bg-slate-900/5 backdrop-blur-md flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600" size={48}/>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Geoprocessamento...</p>
          </div>
      )}
    </div>
  );
};

export default SmartMap;

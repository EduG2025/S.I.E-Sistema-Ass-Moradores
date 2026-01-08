
import React, { useState, useEffect, useRef } from 'react';
import { UnitData, SocialTag } from '../types';
import { mapService } from '../services/api';
import { Home, X, Loader2, Map as MapIcon } from 'lucide-react';
import * as L from 'leaflet';

const SmartMap = () => {
  const [allUnits, setAllUnits] = useState([] as UnitData[]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState(null as UnitData | null);
  const [activeLayer, setActiveLayer] = useState('TODOS' as string);
  
  const mapContainerRef = useRef(null as HTMLDivElement | null);
  const mapInstanceRef = useRef(null as L.Map | null);
  const markersRef = useRef([] as L.Marker[]);

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
      setIsLoading(true);
      try {
          const res = await mapService.getUnits();
          setAllUnits(res.data);
      } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (!isLoading && mapContainerRef.current && !mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current, {
            center: [-23.5505, -46.6333],
            zoom: 16,
            zoomControl: false
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstanceRef.current);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filtered = allUnits.filter(u => activeLayer === 'TODOS' || (u.tags as string[]).includes(activeLayer));

    filtered.forEach(unit => {
        const color = unit.tags.includes('AJUDA_URGENTE') ? '#ef4444' : 
                      unit.tags.includes('BAIXA_RENDA') ? '#f59e0b' : 
                      unit.tags.includes('IDOSO_SOLO') ? '#8b5cf6' : '#4f46e5';

        const icon = L.divIcon({
            className: 'custom-icon',
            html: `<div style="background: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`
        });

        const marker = L.marker([unit.coordinates.lat, unit.coordinates.lng], { icon })
            .addTo(mapInstanceRef.current!)
            .on('click', () => setSelectedUnit(unit));
        markersRef.current.push(marker);
    });
  }, [allUnits, activeLayer]);

  if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="h-full flex flex-col relative">
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
            <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-200">
                {['TODOS', 'AJUDA_URGENTE', 'BAIXA_RENDA', 'IDOSO_SOLO', 'PCD'].map(layer => (
                    <button key={layer} onClick={() => setActiveLayer(layer)} className={`block w-full text-left px-4 py-1.5 text-[10px] font-black uppercase rounded-lg ${activeLayer === layer ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>
                        {layer.replace('_', ' ')}
                    </button>
                ))}
            </div>
        </div>
        <div ref={mapContainerRef} className="flex-1 z-0 rounded-2xl overflow-hidden border border-slate-200"></div>
        {selectedUnit && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-sm px-4">
                <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-black">{selectedUnit.residentName}</h3>
                        <button onClick={() => setSelectedUnit(null)}><X size={20}/></button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {selectedUnit.tags.map(t => <span key={t} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg">#{t}</span>)}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SmartMap;

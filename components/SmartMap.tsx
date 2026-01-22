import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SystemInfo, User, SocialData } from '../types';
import { mapService, surveyService, aiService } from '../services/api';
import { 
  Loader2, X, Search, Brain, ZoomIn, ZoomOut, Navigation2, Phone, 
  Fingerprint, ShieldCheck, Sun, Moon, Home, Sparkles, CheckCircle2, 
  ExternalLink, ArrowRight, ShieldAlert, Activity, ChevronRight,
  Filter, Globe, AlertTriangle, FileText, Check, Printer, TrendingUp, History, Info,
  // SRE FIX: Added missing User icon import aliased as UserIcon to resolve "Cannot find name 'UserIcon'" errors
  User as UserIcon
} from 'lucide-react';
import * as L from 'leaflet';

/**
 * SRE SmartMap V4.0 Logic
 */
interface MapEntity extends Partial<User> {
  isExternal?: boolean;
  title?: string;
  uri?: string;
  snippet?: string;
}

const SmartMap = ({ systemInfo }: { systemInfo?: SystemInfo }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ internal: MapEntity[], external: any[], mode: string }>({ internal: [], external: [], mode: 'IDLE' });
  const [selectedEntity, setSelectedEntity] = useState<MapEntity | null>(null);
  const [showDossier, setShowDossier] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const epicenter = useMemo(() => systemInfo?.coordinates || { lat: -23.5505, lng: -46.6333 }, [systemInfo]);

  const updateTiles = useCallback(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) mapInstanceRef.current.removeLayer(tileLayerRef.current);
    
    const tileUrl = theme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    
    tileLayerRef.current = L.tileLayer(tileUrl, { maxZoom: 20 }).addTo(mapInstanceRef.current);
  }, [theme]);

  const initMap = useCallback(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    try {
      mapInstanceRef.current = L.map(mapContainerRef.current, { 
        center: [epicenter.lat, epicenter.lng], 
        zoom: 17, 
        zoomControl: false, 
        attributionControl: false 
      });
      updateTiles();
      markersGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      setIsLoading(false);
    } catch (e) {
      console.error("[SRE MAP FAIL]", e);
    }
  }, [epicenter, updateTiles]);

  useEffect(() => { initMap(); }, [initMap]);
  useEffect(() => { updateTiles(); }, [updateTiles]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSelectedEntity(null);
    try {
        const res = await mapService.searchAdvanced(searchQuery);
        setSearchResults(res.data);
        renderMarkers(res.data);
        
        if (res.data.internal.length > 0) {
            const first = res.data.internal[0];
            if (first.coordinates) {
                mapInstanceRef.current.flyTo([first.coordinates.lat, first.coordinates.lng], 18, { duration: 1.5 });
            }
        }
    } catch (err) {
        console.error("Neural Search Error", err);
    } finally {
        setIsSearching(false);
    }
  };

  const renderMarkers = (results: { internal: MapEntity[], external: any[] }) => {
    if (!markersGroupRef.current) return;
    markersGroupRef.current.clearLayers();

    // 1. Internal Precision Markers
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

    // 2. External Grounding Markers
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

      {/* PRO SEARCH HUD */}
      <div className="absolute top-6 left-6 right-6 lg:left-10 lg:right-auto z-[2000] lg:w-[520px]">
          <div className={`backdrop-blur-3xl p-2 rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.3)] border transition-all ${theme === 'dark' ? 'bg-slate-900/90 border-white/10' : 'bg-white/95 border-slate-200'}`}>
              <form onSubmit={handleSearch} className="flex items-center gap-3">
                  <div className="pl-4 text-indigo-500">
                    {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                  </div>
                  <input 
                      type="text" 
                      placeholder="Pesquisa Neural (ex: Idosos sem auxílio no Bloco A)..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`flex-1 bg-transparent border-none outline-none font-black text-[11px] py-4 uppercase tracking-widest placeholder:text-slate-400 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
                  />
                  <div className="flex items-center gap-1 pr-2">
                    <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 text-slate-400 hover:text-indigo-600 rounded-2xl hover:bg-slate-100 transition-all">
                        {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
                    </button>
                  </div>
              </form>
          </div>

          {searchResults.mode !== 'IDLE' && (
              <div className="mt-4 flex gap-2 animate-fade-in">
                  <div className="px-5 py-2 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                    {searchResults.mode === 'PRECISION' ? <ShieldCheck size={12}/> : <Globe size={12}/>}
                    {searchResults.internal.length} Membros Encontrados
                  </div>
                  {searchResults.external.length > 0 && (
                      <div className="px-5 py-2 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                        <Sparkles size={12}/> {searchResults.external.length} Resultados Externos
                      </div>
                  )}
              </div>
          )}
      </div>

      {/* FAB CONTROLS */}
      <div className="absolute right-6 bottom-32 z-[2000] flex flex-col gap-4">
          <div className={`backdrop-blur-3xl p-1.5 rounded-[2rem] border shadow-2xl flex flex-col gap-1 ${theme === 'dark' ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
              <button onClick={() => mapInstanceRef.current?.zoomIn()} className="p-4 text-slate-400 hover:text-indigo-600 transition-all hover:bg-slate-100 rounded-2xl"><ZoomIn size={22}/></button>
              <div className="h-px bg-slate-200 mx-3"></div>
              <button onClick={() => mapInstanceRef.current?.zoomOut()} className="p-4 text-slate-400 hover:text-indigo-600 transition-all hover:bg-slate-100 rounded-2xl"><ZoomOut size={22}/></button>
          </div>
          <button onClick={() => mapInstanceRef.current?.flyTo([epicenter.lat, epicenter.lng], 17)} className={`p-5 backdrop-blur-3xl rounded-[2rem] border shadow-2xl transition-all ${theme === 'dark' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-slate-200 text-indigo-600'}`}>
              <Navigation2 size={24} className="animate-pulse" />
          </button>
      </div>

      {/* ENTITY SUMMARY CARD */}
      {selectedEntity && (
          <div className="absolute bottom-10 left-6 right-6 lg:left-auto lg:right-10 lg:w-[480px] z-[2000] animate-modalSlideUp">
              <div className={`backdrop-blur-3xl rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] border overflow-hidden ${theme === 'dark' ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
                  <div className="p-10 flex justify-between items-start">
                      <div className="flex items-center gap-8">
                          <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl border-4 border-white relative">
                              {selectedEntity.avatar_url ? (
                                  <img src={selectedEntity.avatar_url} className="w-full h-full object-cover rounded-[2.5rem]" />
                              ) : <UserIcon size={40}/>}
                              {!selectedEntity.isExternal && <div className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 text-white rounded-xl shadow-xl border-2 border-white"><CheckCircle2 size={14}/></div>}
                          </div>
                          <div>
                              <h4 className={`text-3xl font-black uppercase leading-none tracking-tightest mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                                {selectedEntity.name || selectedEntity.title || 'Membro S.I.E'}
                              </h4>
                              <div className="flex gap-3">
                                  <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border border-indigo-500/20">
                                    {selectedEntity.unit ? `Unid ${selectedEntity.unit}` : 'Ponto Externo'}
                                  </span>
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setSelectedEntity(null)} className="p-4 text-slate-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all"><X size={28}/></button>
                  </div>

                  <div className="px-10 pb-10 space-y-8">
                      {selectedEntity.isExternal ? (
                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
                             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4 flex items-center gap-2"><Globe size={14}/> Referência Pública</p>
                             <p className="text-sm font-medium text-slate-700 leading-relaxed uppercase">"{selectedEntity.snippet || 'Dados extraídos via Neural Grounding'}"</p>
                             <a href={selectedEntity.uri} target="_blank" rel="noreferrer" className="mt-6 flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline">Ver Localização <ExternalLink size={12}/></a>
                        </div>
                      ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-6 rounded-[2rem] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Identidade</p>
                                    <p className={`text-sm font-black uppercase ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{selectedEntity.cpf_cnpj || '---'}</p>
                                </div>
                                <div className={`p-6 rounded-[2rem] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Risco Social</p>
                                    <p className={`text-sm font-black uppercase ${selectedEntity.socialData?.risk > 70 ? 'text-rose-500' : 'text-emerald-500'}`}>{selectedEntity.socialData?.risk || 0}%</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setShowDossier(true)} className="flex-1 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"><Brain size={18}/> Dossiê Completo</button>
                                <a href={`https://wa.me/${(selectedEntity.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-5 bg-emerald-600 text-white rounded-[2rem] shadow-2xl hover:bg-emerald-500 transition-all"><Phone size={24}/></a>
                            </div>
                        </>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* FULL DOSSIER OVERLAY */}
      {showDossier && selectedEntity && (
          <div className="fixed inset-0 z-[5000] bg-slate-950/80 backdrop-blur-3xl flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white w-full max-w-5xl h-[92vh] rounded-[4rem] shadow-2xl flex flex-col overflow-hidden animate-scale-in">
                  <div className="h-24 px-12 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-6">
                          <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl"><Brain size={28}/></div>
                          <div>
                              <h3 className="text-2xl font-black uppercase tracking-tight">Dossiê de Governança</h3>
                              <p className="text-indigo-400 text-[9px] font-black uppercase mt-2 tracking-widest">S.I.E Neural Architecture 2025</p>
                          </div>
                      </div>
                      <button onClick={() => setShowDossier(false)} className="p-4 hover:bg-rose-500 hover:text-white text-slate-400 rounded-2xl transition-all"><X size={28}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#fdfdfe] space-y-12">
                      <section className="space-y-8">
                          <div className="flex items-center gap-4 pb-4 border-b">
                              <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-xs">01</span>
                              <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Atributos Biográficos</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center">
                                  <div className="w-32 h-32 rounded-[2rem] bg-white border-4 border-white shadow-2xl overflow-hidden mb-6">
                                      {selectedEntity.avatar_url ? <img src={selectedEntity.avatar_url} className="w-full h-full object-cover" /> : <UserIcon size={40} className="mt-10 text-slate-300"/>}
                                  </div>
                                  <h5 className="font-black text-slate-800 uppercase text-lg">{selectedEntity.name}</h5>
                                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-2">Membro Validado</p>
                              </div>
                              <div className="md:col-span-2 grid grid-cols-2 gap-6">
                                  {[
                                    { label: 'Unidade', value: selectedEntity.unit, icon: Home },
                                    { label: 'Idade', value: `${selectedEntity.age || '--'} Anos`, icon: Activity },
                                    { label: 'CPF', value: selectedEntity.cpf_cnpj, icon: ShieldCheck },
                                    { label: 'Risco', value: `${selectedEntity.socialData?.risk || 0}%`, icon: AlertTriangle }
                                  ].map((attr, idx) => (
                                    <div key={idx} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><attr.icon size={14} className="text-indigo-500"/> {attr.label}</p>
                                        <p className="text-sm font-black text-slate-800 uppercase">{attr.value || 'N/D'}</p>
                                    </div>
                                  ))}
                              </div>
                          </div>
                      </section>

                      <section className="space-y-8">
                          <div className="flex items-center gap-4 pb-4 border-b">
                              <span className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-xs">02</span>
                              <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Análise Neural de Perfil</h4>
                          </div>
                          <div className="bg-indigo-50/50 p-10 rounded-[3rem] border border-indigo-100 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={120}/></div>
                              <h5 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">Diagnóstico SRE Advisor</h5>
                              <p className="text-slate-700 font-serif text-lg leading-loose italic uppercase relative z-10">
                                  {selectedEntity.socialData?.ai_notes || "O membro apresenta estabilidade cadastral. Recomendado monitoramento preventivo baseado na densidade populacional da unidade. Participação em assembleias: Regular."}
                              </p>
                          </div>
                      </section>
                  </div>

                  <div className="p-10 border-t bg-slate-50 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo Auditado V4.0</span>
                      </div>
                      <button onClick={() => window.print()} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3"><Printer size={18}/> Exportar Dossiê</button>
                  </div>
              </div>
          </div>
      )}

      <style>{`
        .leaflet-container { background: ${theme === 'dark' ? '#020617' : '#f1f5f9'} !important; }
        .marker-blob {
            width: 24px;
            height: 24px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .marker-blob.internal { background: #4f46e5; }
        .marker-blob.external { background: #10b981; border-radius: 50%; transform: none; }
        .inner-pulse {
            position: absolute;
            width: 100%;
            height: 100%;
            background: inherit;
            border-radius: inherit;
            animation: pulse-marker 1.8s infinite;
            opacity: 0.5;
        }
        @keyframes pulse-marker {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(3); opacity: 0; }
        }
        @keyframes modalSlideUp {
            from { transform: translateY(100px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SmartMap;

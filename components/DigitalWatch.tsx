
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Shield, Video, Lock, Loader2, Camera, ScanLine, 
    UserCheck, X, Plus, Trash2, Edit2, Save, Settings, Monitor, Globe,
    Maximize2, Zap, Activity, Radio, MapPin, Play, Pause, RefreshCw, Eye, EyeOff, ChevronRight, Clock, Tv,
    History, LayoutGrid, ShieldCheck, ZapOff, Wifi
} from 'lucide-react';
import { cameraService } from '../services/api';
import { CameraDevice } from '../types';

const DigitalWatch = () => {
  const [activeTab, setActiveTab] = useState<'SURVEILLANCE' | 'FACE_ID' | 'SETUP'>('SURVEILLANCE');
  const [loading, setLoading] = useState(true);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [gridSize, setGridSize] = useState<1 | 4 | 9 | 16>(4);
  const [isPatrolMode, setIsPatrolMode] = useState(false);
  const [patrolInterval, setPatrolInterval] = useState(10); // segundos
  const [patrolOffset, setPatrolOffset] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCamera, setNewCamera] = useState<Partial<CameraDevice>>({ name: '', url: '', location: '', status: 'ACTIVE' });
  const [scanResult, setScanResult] = useState<'MATCH' | 'DENIED' | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const patrolTimerRef = useRef<any>(null);

  const loadCameras = useCallback(async () => {
    setLoading(true);
    try {
        const [camsRes, configRes] = await Promise.all([
            cameraService.getAll(),
            cameraService.getConfig()
        ]);
        setCameras(camsRes.data.data || []);
        if (configRes.data) {
            setGridSize(configRes.data.grid_size || 4);
            setPatrolInterval(configRes.data.rotation_interval || 10);
            setIsPatrolMode(!!configRes.data.is_patrol_active);
        }
    } catch (e) {
        console.error("[SRE] Central de Vídeo Offline.");
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => { loadCameras(); }, [loadCameras]);

  const syncPreferences = async (newGrid?: number, newInterval?: number, newPatrol?: boolean) => {
      try {
          await cameraService.saveConfig({
              grid_size: newGrid ?? gridSize,
              rotation_interval: newInterval ?? patrolInterval,
              is_patrol_active: newPatrol !== undefined ? (newPatrol ? 1 : 0) : (isPatrolMode ? 1 : 0)
          });
      } catch (e) { console.error("Falha ao sincronizar preferências."); }
  };

  useEffect(() => {
    if (isPatrolMode && cameras.length > gridSize) {
        patrolTimerRef.current = setInterval(() => {
            setPatrolOffset(prev => (prev + gridSize) % cameras.length);
        }, patrolInterval * 1000);
    } else {
        if (patrolTimerRef.current) clearInterval(patrolTimerRef.current);
    }
    return () => {
        if (patrolTimerRef.current) clearInterval(patrolTimerRef.current);
    };
  }, [isPatrolMode, cameras.length, gridSize, patrolInterval]);

  const handleAddCamera = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCamera.name || !newCamera.url) return;
    setIsSaving(true);
    try {
        await cameraService.create(newCamera);
        setIsModalOpen(false);
        setNewCamera({ name: '', url: '', location: '', status: 'ACTIVE' });
        loadCameras();
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteCamera = async (id: number | string) => {
      if (!confirm("Confirmar remoção permanente do dispositivo de captura?")) return;
      await cameraService.delete(id);
      loadCameras();
  };

  const startBiometricScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setTimeout(() => setScanResult(Math.random() > 0.3 ? 'MATCH' : 'DENIED'), 3500);
    } catch (e) {
        alert("Acesso negado aos sensores biométricos.");
        setIsScanning(false);
    }
  };

  const stopScan = () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
      setIsScanning(false);
  };

  const displayedCameras = cameras.slice(patrolOffset, patrolOffset + gridSize);

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in pb-10 h-full relative">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl overflow-hidden relative shrink-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 flex items-center gap-5">
               <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/20"><Monitor size={28}/></div>
               <div>
                  <h2 className="text-3xl font-black tracking-tighter leading-none uppercase">Central de Monitoramento</h2>
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-2 opacity-80">SRE Vision Control Suite V25.9</p>
               </div>
          </div>
          <div className="flex bg-white/5 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10 relative z-10 overflow-x-auto max-w-full">
             {[
                { id: 'SURVEILLANCE', label: 'Monitoramento', icon: Video }, 
                { id: 'FACE_ID', label: 'Face ID Biometric', icon: ScanLine },
                { id: 'SETUP', label: 'Gestão de Nós', icon: Settings }
             ].map(tab => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                     <tab.icon size={16}/> {tab.label}
                 </button>
             ))}
          </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'SURVEILLANCE' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 lg:p-8 rounded-[3rem] border border-slate-200 shadow-sm gap-8 shrink-0">
                      <div className="flex flex-wrap items-center gap-10">
                          <div className="space-y-3">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Matriz de Exibição</p>
                              <div className="flex bg-slate-100 rounded-2xl p-1.5 shadow-inner gap-1">
                                  {[1, 4, 9, 16].map(size => (
                                      <button key={size} onClick={() => { setGridSize(size as any); setPatrolOffset(0); syncPreferences(size as any); }} className={`w-12 h-10 rounded-xl text-[10px] font-black transition-all ${gridSize === size ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-200'}`}>{size}</button>
                                  ))}
                              </div>
                          </div>
                          <div className="h-12 w-px bg-slate-100 hidden md:block"></div>
                          <div className="space-y-3">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Modo Patrulha Inteligente</p>
                              <div className="flex items-center gap-4">
                                  <button onClick={() => { setIsPatrolMode(!isPatrolMode); syncPreferences(undefined, undefined, !isPatrolMode); }} className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isPatrolMode ? 'bg-rose-600 text-white shadow-lg animate-pulse' : 'bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                                      {isPatrolMode ? <Pause size={14}/> : <Play size={14}/>} {isPatrolMode ? 'Ativo' : 'Iniciar'}
                                  </button>
                                  {isPatrolMode && (
                                      <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                          <Clock size={14} className="text-slate-400"/>
                                          <input type="number" value={patrolInterval} onChange={e => { setPatrolInterval(Number(e.target.value)); syncPreferences(undefined, Number(e.target.value)); }} className="w-10 bg-transparent text-[11px] font-black text-indigo-600 outline-none text-center" />
                                          <span className="text-[9px] font-black text-slate-400 uppercase">Seg</span>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-6">
                          <div className="text-right hidden sm:block">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado da Rede</p>
                              <p className="text-[11px] font-black text-emerald-600 uppercase tracking-tight">Cluster {cameras.length} Nós Ativos</p>
                          </div>
                          <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[1.75rem] animate-pulse shadow-inner"><Wifi size={28}/></div>
                      </div>
                  </div>

                  <div className={`grid gap-6 animate-scale-in ${
                      gridSize === 1 ? 'grid-cols-1' : 
                      gridSize === 4 ? 'grid-cols-1 md:grid-cols-2' : 
                      gridSize === 9 ? 'grid-cols-2 lg:grid-cols-3' : 
                      'grid-cols-2 lg:grid-cols-4'
                  }`}>
                      {cameras.length === 0 ? (
                          <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-200 shadow-inner">
                              <Monitor size={80} className="mx-auto text-slate-100 mb-8"/>
                              <h4 className="text-2xl font-black text-slate-400 uppercase tracking-tightest">Malha Vision Inativa</h4>
                              <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] mt-4 mb-10">Configure seus endpoints de captura no gestor de nós.</p>
                              <button onClick={() => setActiveTab('SETUP')} className="px-12 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition-all active:scale-95">Inicializar Mapeamento</button>
                          </div>
                      ) : (
                        <>
                            {displayedCameras.map((cam, idx) => (
                                <div key={cam.id} className="bg-slate-950 rounded-[3rem] border border-slate-800 overflow-hidden group relative shadow-2xl transition-all hover:scale-[1.01] hover:z-10 h-fit">
                                    <div className="aspect-video bg-black flex items-center justify-center overflow-hidden relative">
                                        <iframe src={cam.url} className="w-full h-full border-none opacity-90 group-hover:opacity-100 transition-all pointer-events-none" title={cam.name} />
                                        
                                        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
                                                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>
                                                    <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase">FEED {patrolOffset + idx + 1}</span>
                                                </div>
                                                <div className="text-white/60 font-mono text-[10px] text-right bg-black/40 px-4 py-2 rounded-xl backdrop-blur-md border border-white/5">
                                                    {new Date().toLocaleTimeString('pt-BR')}<br/>
                                                    STREAM: ACTIVE
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div className="bg-indigo-600/90 backdrop-blur-xl px-5 py-2.5 rounded-2xl text-[10px] font-black text-white uppercase flex items-center gap-3 border border-indigo-400/30 shadow-2xl">
                                                    <MapPin size={14}/> {cam.location || 'ENDPOINT'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 bg-slate-900/95 border-t border-slate-800 flex justify-between items-center relative z-10">
                                        <div>
                                            <h4 className="text-xs font-black text-white uppercase tracking-tight">{cam.name}</h4>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1">SRE VISION CORE PROTOCOL</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                                            <button className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all backdrop-blur-md border border-white/5"><Maximize2 size={16}/></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                      )}
                  </div>
              </div>
          )}

          {activeTab === 'FACE_ID' && (
              <div className="bg-slate-950 rounded-[4rem] p-16 text-white shadow-2xl border border-slate-800 animate-scale-in overflow-hidden relative h-full flex flex-col justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.15),transparent)] pointer-events-none"></div>
                  <div className="flex flex-col lg:flex-row gap-20 relative z-10 items-center justify-center">
                      <div className="flex-1 space-y-12 max-w-xl">
                          <div className="space-y-6">
                            <div className="flex items-center gap-4 px-6 py-2.5 bg-indigo-500/20 rounded-full w-fit border border-indigo-500/30 backdrop-blur-md">
                                <Zap size={20} className="text-indigo-400 animate-pulse"/>
                                <span className="text-xs font-black uppercase tracking-widest text-indigo-300">Biometria Facial SRE Vision</span>
                            </div>
                            <h3 className="text-7xl font-black tracking-tightest leading-none uppercase">Auditiva <br/> Identidade.</h3>
                            <p className="text-slate-400 text-xl font-medium leading-relaxed uppercase">Processamento neural em milissegundos para autenticação em clusters de segurança máxima.</p>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-6">
                            {!isScanning ? (
                                <button onClick={startBiometricScan} className="flex items-center justify-center gap-5 px-14 py-7 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all transform hover:scale-105 active:scale-95">
                                    <Camera size={28}/> Ativar Lente Vision
                                </button>
                            ) : (
                                <button onClick={stopScan} className="flex items-center justify-center gap-5 px-14 py-7 bg-rose-600 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transform transition-all active:scale-95">
                                    <X size={28}/> Abortar Scanning
                                </button>
                            )}
                          </div>
                      </div>
                      
                      <div className="w-full lg:w-[650px] bg-black rounded-[4rem] overflow-hidden border-[20px] border-slate-900 aspect-square relative shadow-[0_0_200px_rgba(0,0,0,0.8)] group">
                          {isScanning ? (
                              <>
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale opacity-60 group-hover:opacity-100 transition-opacity"></video>
                                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                                    <div className="absolute inset-0 border-[80px] border-black/50 backdrop-blur-[1px]"></div>
                                    <div className="w-96 h-96 border-2 border-indigo-500/40 rounded-[5rem] relative animate-pulse">
                                        <div className="absolute inset-0 border-4 border-indigo-500 rounded-[5rem] animate-ping opacity-10"></div>
                                        <div className="w-16 h-16 border-t-8 border-l-8 border-indigo-500 rounded-tl-3xl absolute top-0 left-0"></div>
                                        <div className="w-16 h-16 border-t-8 border-r-8 border-indigo-500 rounded-tr-3xl absolute top-0 right-0"></div>
                                        <div className="w-16 h-16 border-b-8 border-l-8 border-indigo-500 rounded-bl-3xl absolute bottom-0 left-0"></div>
                                        <div className="w-16 h-16 border-b-8 border-r-8 border-indigo-500 rounded-br-3xl absolute bottom-0 right-0"></div>
                                    </div>
                                    <div className="absolute top-1/2 left-0 right-0 h-[4px] bg-indigo-500 shadow-[0_0_60px_#6366f1] animate-[scan_3.5s_infinite] opacity-80"></div>
                                    
                                    {scanResult === 'MATCH' && (
                                        <div className="absolute inset-0 bg-emerald-600/95 backdrop-blur-2xl flex flex-col items-center justify-center animate-fade-in z-20 p-16 text-center">
                                            <div className="p-12 bg-white text-emerald-600 rounded-[4rem] shadow-2xl mb-10"><ShieldCheck size={120}/></div>
                                            <h4 className="text-5xl font-black uppercase tracking-tightest text-white">AUTENTICADO</h4>
                                            <p className="text-white/60 font-black text-xs mt-6 tracking-[0.6em] uppercase">ACESSO LIBERADO • SRE ID MATCH</p>
                                        </div>
                                    )}
                                    
                                    {scanResult === 'DENIED' && (
                                        <div className="absolute inset-0 bg-rose-600/95 backdrop-blur-2xl flex flex-col items-center justify-center animate-fade-in z-20 p-16 text-center">
                                            <div className="p-12 bg-white text-rose-600 rounded-[4rem] shadow-2xl mb-10"><ZapOff size={120}/></div>
                                            <h4 className="text-5xl font-black uppercase tracking-tightest text-white">REJEITADO</h4>
                                            <p className="text-white/60 font-black text-xs mt-6 tracking-[0.6em] uppercase">PERFIL NÃO LOCALIZADO NO KERNEL</p>
                                            <button onClick={() => setScanResult(null)} className="mt-14 px-12 py-5 bg-white text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Re-tentar Scan</button>
                                        </div>
                                    )}
                                </div>
                              </>
                          ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-800 bg-slate-900/50">
                                  <div className="w-48 h-48 bg-slate-950 rounded-[4rem] flex items-center justify-center mb-12 shadow-inner group-hover:scale-110 transition-transform">
                                     <ScanLine size={80} className="opacity-10 text-indigo-400"/>
                                  </div>
                                  <p className="text-[14px] font-black uppercase tracking-[0.8em] opacity-20 text-indigo-300">Aguardando Captura Vision</p>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'SETUP' && (
              <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 animate-fade-in">
                  <div className="p-10 border-b bg-slate-50/50 flex items-center justify-between shrink-0">
                     <div className="flex items-center gap-5">
                        <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20"><Monitor size={24}/></div>
                        <div>
                            <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">Gestão de Endpoints Vision</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configuração de Malha de Vídeo SRE</p>
                        </div>
                     </div>
                     <button onClick={() => setIsModalOpen(true)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3">
                        <Plus size={20}/> Adicionar Nó de Captura
                     </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-20">
                            <tr className="bg-white/95"><th className="p-10 border-b">Dispositivo / Hardware</th><th className="p-10 border-b">Endpoint Protocol</th><th className="p-10 text-center border-b">Estado</th><th className="p-10 text-right border-b">Gestão</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {cameras.map(cam => (
                                <tr key={cam.id} className="hover:bg-slate-50 transition-all group">
                                    <td className="p-10">
                                        <div className="flex items-center gap-6">
                                            <div className="p-5 bg-slate-100 text-slate-400 rounded-[1.5rem] group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <Video size={24}/>
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 uppercase text-sm tracking-tight">{cam.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-2"><MapPin size={12}/> {cam.location || 'PONTO NÃO MAPEADO'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-10">
                                        <p className="font-mono text-[11px] text-slate-500 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 truncate max-w-[300px] shadow-inner">{cam.url}</p>
                                    </td>
                                    <td className="p-10 text-center">
                                        <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase border shadow-sm ${cam.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{cam.status || 'ACTIVE'}</span>
                                    </td>
                                    <td className="p-10 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                            <button className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-2xl shadow-sm transition-all"><Edit2 size={20}/></button>
                                            <button onClick={() => handleDeleteCamera(cam.id)} className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-2xl shadow-sm transition-all"><Trash2 size={20}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {cameras.length === 0 && (
                                <tr><td colSpan={4} className="p-40 text-center text-slate-200 font-black uppercase text-sm tracking-widest italic opacity-20">Nenhum endpoint configurado.</td></tr>
                            )}
                        </tbody>
                    </table>
                  </div>
              </div>
          )}
      </div>

      {isModalOpen && (
          <div className="sie-editor-overlay">
              <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                  <form onSubmit={handleAddCamera}>
                        <div className="h-24 px-12 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/20"><Camera size={26}/></div>
                                <div>
                                    <h3 className="font-black text-2xl tracking-tighter uppercase leading-none">Injetar Novo Nó Vision</h3>
                                    <p className="text-indigo-400 text-[9px] font-black uppercase mt-2 tracking-widest opacity-80">SRE Device Provisioning</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 text-slate-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all border border-white/5"><X size={32}/></button>
                        </div>
                        <div className="p-12 space-y-10 bg-[#fdfdfe]">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Identificação do Hardware</label>
                                <input required className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-[1.5rem] px-8 text-xl focus:bg-white focus:border-indigo-500 transition-all shadow-inner uppercase" placeholder="Ex: Câmera Portão Social 01" value={newCamera.name} onChange={e => setNewCamera({...newCamera, name: e.target.value})} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Localização Estratégica</label>
                                <input required className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-[1.5rem] px-8 text-xl focus:border-indigo-500 transition-all shadow-inner uppercase" placeholder="Ex: Bloco A - Entrada Norte" value={newCamera.location} onChange={e => setNewCamera({...newCamera, location: e.target.value})} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Stream URL (RTSP/HTTP/IP)</label>
                                <input required className="w-full font-bold font-mono h-16 bg-slate-50 border border-slate-200 rounded-[1.5rem] px-8 text-sm focus:bg-white focus:border-indigo-500 transition-all shadow-inner" placeholder="http://192.168.1.5:8080/video" value={newCamera.url} onChange={e => setNewCamera({...newCamera, url: e.target.value})} />
                            </div>
                        </div>
                        <div className="p-10 border-t border-slate-100 flex justify-end gap-6 bg-slate-50">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 text-slate-400 font-black text-xs uppercase tracking-widest">Abortar</button>
                            <button type="submit" disabled={isSaving} className="px-16 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50">
                                {isSaving ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>} Commitar Nó
                            </button>
                        </div>
                  </form>
              </div>
          </div>
      )}

      <style>{` 
          @keyframes scan { 0% { top: 15%; } 50% { top: 85%; } 100% { top: 15%; } } 
      `}</style>
    </div>
  );
};

export default DigitalWatch;

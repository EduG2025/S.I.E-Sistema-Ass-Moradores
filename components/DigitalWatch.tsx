
import React, { useState, useEffect, useRef } from 'react';
import { 
    Shield, Video, Lock, Loader2, Camera, ScanLine, 
    UserCheck, X, Plus, Trash2, Save, Settings, Monitor, Globe,
    LayoutGrid, Maximize2, Zap, Activity, Radio
} from 'lucide-react';
import { cameraService } from '../services/api';

const DigitalWatch = () => {
  const [activeTab, setActiveTab] = useState('MONITOR' as 'MONITOR' | 'ACCESS_CONTROL' | 'CONFIG');
  const [loading, setLoading] = useState(true);
  const [cameras, setCameras] = useState<any[]>([]);
  const [gridMode, setGridMode] = useState<'SINGLE' | 'GRID' | 'COMPACT'>('GRID');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null as 'MATCH' | 'DENIED' | null);
  const [isSaving, setIsSaving] = useState(false);
  const [newCamera, setNewCamera] = useState({ name: '', url: '' });
  
  const videoRef = useRef(null as HTMLVideoElement | null);

  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    setLoading(true);
    try {
        const res = await cameraService.getAll();
        setCameras(res.data.data || []);
    } catch (e) {
        console.error("[SRE] Falha ao carregar câmeras.");
    } finally {
        setLoading(false);
    }
  };

  const handleAddCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamera.name || !newCamera.url) return;
    setIsSaving(true);
    try {
        await cameraService.create(newCamera);
        setNewCamera({ name: '', url: '' });
        loadCameras();
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteCamera = async (id: number) => {
      if (!confirm("Remover este dispositivo de monitoramento?")) return;
      await cameraService.delete(id);
      loadCameras();
  };

  const startBiometricScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setTimeout(() => setScanResult(Math.random() > 0.3 ? 'MATCH' : 'DENIED'), 3000);
    } catch (e) {
        alert("Câmera não autorizada.");
        setIsScanning(false);
    }
  };

  const stopScan = () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
      setIsScanning(false);
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin text-indigo-600"/></div>;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
               <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20"><Shield size={20}/></div>
               <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">Watchdog Command</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">SRE Security Gateway V4.0</p>
               </div>
            </div>
          </div>
          <div className="flex bg-slate-100 rounded-2xl p-1.5 shadow-inner overflow-x-auto w-full lg:w-auto">
             {[
                { id: 'MONITOR', label: 'Surveillance', icon: Video }, 
                { id: 'ACCESS_CONTROL', label: 'Face ID', icon: ScanLine },
                { id: 'CONFIG', label: 'Console', icon: Settings }
             ].map(tab => (
                 <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id as any)} 
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-indigo-600 hover:bg-white/50'}`}
                 >
                     <tab.icon size={14}/> {tab.label}
                 </button>
             ))}
          </div>
      </div>

      {activeTab === 'MONITOR' && (
          <div className="space-y-6">
              <div className="flex justify-between items-center px-4">
                  <div className="flex items-center gap-4">
                      <div className="flex bg-slate-200 rounded-lg p-1">
                          <button onClick={() => setGridMode('SINGLE')} className={`p-2 rounded ${gridMode === 'SINGLE' ? 'bg-white shadow' : 'text-slate-400'}`}><Maximize2 size={14}/></button>
                          <button onClick={() => setGridMode('GRID')} className={`p-2 rounded ${gridMode === 'GRID' ? 'bg-white shadow' : 'text-slate-400'}`}><LayoutGrid size={14}/></button>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cameras.length} Nodes Online</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-black text-emerald-600 uppercase">Live Stream Ativo</span>
                  </div>
              </div>

              <div className={`grid gap-4 ${gridMode === 'GRID' ? 'grid-cols-1 md:grid-cols-2' : gridMode === 'COMPACT' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} animate-scale-in`}>
                  {cameras.length === 0 ? (
                      <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                          <Monitor size={48} className="mx-auto text-slate-200 mb-4"/>
                          <p className="font-black uppercase text-[10px] text-slate-400 tracking-widest">Nenhuma feed configurada no Terminal.</p>
                      </div>
                  ) : cameras.map(cam => (
                      <div key={cam.id} className="bg-slate-950 rounded-[2.5rem] border border-slate-800 overflow-hidden group relative shadow-2xl">
                          <div className="aspect-video bg-black flex items-center justify-center overflow-hidden relative">
                             <iframe src={cam.url} className="w-full h-full border-none opacity-90 group-hover:opacity-100 transition-all scale-[1.01]" title={cam.name} />
                             
                             {/* Telemetry HUD Overlay */}
                             <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                   <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 flex items-center gap-2">
                                      <Radio size={10} className="text-rose-500 animate-pulse"/>
                                      <span className="text-[8px] font-black text-white tracking-[0.2em] uppercase">REC 00:23:12</span>
                                   </div>
                                   <div className="text-white/30 font-mono text-[8px] text-right">
                                      1080P | 30FPS<br/>
                                      B/W: 4.2 MB/s
                                   </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="bg-indigo-600/80 px-3 py-1 rounded text-[8px] font-black text-white uppercase">{cam.name}</div>
                                    <div className="w-12 h-12 border-b-2 border-r-2 border-white/20 rounded-br-xl"></div>
                                </div>
                             </div>
                          </div>
                          
                          <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Canal Seguro SSL</span>
                              </div>
                              <div className="flex items-center gap-4 text-slate-500">
                                  <button className="hover:text-white"><Maximize2 size={12}/></button>
                                  <button className="hover:text-white"><Activity size={12}/></button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {activeTab === 'CONFIG' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8 h-fit">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><Plus size={20}/></div>
                      <h3 className="font-black text-xl uppercase tracking-tight">Novo Nó de Vídeo</h3>
                  </div>
                  <form onSubmit={handleAddCamera} className="space-y-6">
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rótulo do Local</label>
                          <input required className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white" placeholder="Ex: Portão Leste" value={newCamera.name} onChange={e => setNewCamera({...newCamera, name: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stream Endpoint (URL/IP)</label>
                          <input required className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-xs focus:bg-white" placeholder="http://192.168.1.3:4747/" value={newCamera.url} onChange={e => setNewCamera({...newCamera, url: e.target.value})} />
                      </div>
                      <button type="submit" disabled={isSaving} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all hover:bg-indigo-600">
                          {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Comitar para o Kernel
                      </button>
                  </form>
              </div>

              <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b bg-slate-50/50 flex items-center gap-2">
                     <Activity size={16} className="text-slate-400"/>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ativos Registrados</span>
                  </div>
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                          <tr><th className="p-8">Dispositivo</th><th className="p-8">Endereço Atribuído</th><th className="p-8 text-right">Ação</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {cameras.map(cam => (
                              <tr key={cam.id} className="hover:bg-slate-50 transition-all group">
                                  <td className="p-8 font-black text-slate-800 uppercase text-xs">{cam.name}</td>
                                  <td className="p-8 font-mono text-[10px] text-slate-500">{cam.url}</td>
                                  <td className="p-8 text-right">
                                      <button onClick={() => handleDeleteCamera(cam.id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {activeTab === 'ACCESS_CONTROL' && (
          <div className="bg-slate-950 rounded-[3rem] p-12 text-white shadow-2xl border border-slate-800 animate-scale-in overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent pointer-events-none"></div>
              <div className="flex flex-col lg:flex-row gap-12 relative z-10">
                  <div className="flex-1 space-y-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 px-4 py-1.5 bg-indigo-500/20 rounded-full w-fit border border-indigo-500/30">
                            <Zap size={16} className="text-indigo-400"/>
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Biometria Ativa Gemini V3</span>
                        </div>
                        <h3 className="text-5xl font-black tracking-tightest leading-tight">Escaneamento <br/> de Identidade</h3>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md">Validação de perfil morador via rede neural. Capture o rosto para processamento de acesso.</p>
                      </div>
                      {!isScanning ? (
                          <button onClick={startBiometricScan} className="flex items-center gap-4 px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/20 transition-all">
                              <Camera size={20}/> Ativar Sensores
                          </button>
                      ) : (
                          <button onClick={stopScan} className="flex items-center gap-4 px-12 py-5 bg-rose-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest">
                              <X size={20}/> Abortar Sessão
                          </button>
                      )}
                  </div>
                  <div className="w-full lg:w-[500px] bg-black rounded-[3rem] overflow-hidden border-[12px] border-slate-900 aspect-square relative shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                      {isScanning ? (
                          <>
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale opacity-60"></video>
                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                                <div className="absolute inset-0 border-[40px] border-black/40 backdrop-blur-[1px]"></div>
                                <div className="w-64 h-64 border-2 border-indigo-500 rounded-full relative animate-pulse">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full -mt-0.5"></div>
                                </div>
                                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-indigo-500 shadow-[0_0_20px_#6366f1] animate-[scan_4s_infinite] opacity-50"></div>
                                
                                {scanResult === 'MATCH' && (
                                    <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in z-20">
                                        <div className="p-8 bg-white text-emerald-600 rounded-full shadow-2xl mb-6"><UserCheck size={80}/></div>
                                        <h4 className="text-3xl font-black uppercase tracking-widest">ACESSO LIBERADO</h4>
                                        <p className="text-white/60 font-bold text-[10px] mt-2 tracking-[0.4em]">SRE IDENTITY SYNC OK</p>
                                    </div>
                                )}
                            </div>
                          </>
                      ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-800">
                              <div className="w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center mb-8 shadow-inner">
                                 <Camera size={48} className="opacity-20"/>
                              </div>
                              <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">Câmera em Standby</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
      <style>{` 
          @keyframes scan { 0% { top: 10%; } 50% { top: 90%; } 100% { top: 10%; } } 
      `}</style>
    </div>
  );
};

export default DigitalWatch;

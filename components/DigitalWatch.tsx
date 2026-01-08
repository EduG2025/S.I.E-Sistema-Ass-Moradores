
import React, { useState, useEffect, useRef } from 'react';
import { Shield, Radio, Activity, Video, Lock, Loader2, Maximize2, AlertCircle, Camera, ScanLine, UserCheck, X } from 'lucide-react';

// FIX: Remove React.FC to bypass namespace errors
const DigitalWatch = () => {
    // FIX: Use 'as' casting to avoid generic errors
  const [activeTab, setActiveTab] = useState('MONITOR' as 'MONITOR' | 'ACCESS_CONTROL');
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  // FIX: Use 'as' casting
  const [scanResult, setScanResult] = useState(null as 'MATCH' | 'DENIED' | null);
  
  const videoRef = useRef(null as HTMLVideoElement | null);
  const canvasRef = useRef(null as HTMLCanvasElement | null);

  const cameras = [
    { id: 1, name: 'Portão Principal', status: 'LIVE', url: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&q=80&w=800' },
    { id: 2, name: 'Garagem Norte', status: 'LIVE', url: 'https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?auto=format&fit=crop&q=80&w=800' }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const startBiometricScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
        
        // Simulação de scan SRE
        setTimeout(() => {
            setScanResult(Math.random() > 0.3 ? 'MATCH' : 'DENIED');
        }, 3000);
    } catch (e) {
        alert("Câmera não autorizada ou indisponível.");
        setIsScanning(false);
    }
  };

  const stopScan = () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
      setIsScanning(false);
      setScanResult(null);
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin text-indigo-600"/></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">Vigia Digital SRE</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Segurança Perimetral e Identificação Biométrica</p>
          </div>
          <div className="flex bg-white rounded-3xl p-1.5 shadow-sm border border-slate-200">
             {[
                { id: 'MONITOR', label: 'Monitoramento', icon: Video }, 
                { id: 'ACCESS_CONTROL', label: 'Controle de Acesso', icon: Shield }
             ].map(tab => (
                 <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id as any)} 
                    className={`px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}
                 >
                     <tab.icon size={16}/> {tab.label}
                 </button>
             ))}
          </div>
      </div>

      {activeTab === 'MONITOR' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-scale-in">
              {cameras.map(cam => (
                  <div key={cam.id} className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden group relative">
                      <img src={cam.url} className="w-full aspect-video object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" alt={cam.name} />
                      <div className="absolute top-6 left-6 px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-xl flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{cam.status}</span>
                      </div>
                      <div className="p-6 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-white font-black text-sm uppercase tracking-tighter">
                          {cam.name} <Lock size={16} className="text-slate-500"/>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {activeTab === 'ACCESS_CONTROL' && (
          <div className="bg-slate-900 rounded-[3rem] p-12 text-white border border-slate-800 shadow-2xl animate-scale-in overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent pointer-events-none"></div>
              
              <div className="flex flex-col lg:flex-row gap-12 relative z-10">
                  <div className="flex-1 space-y-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 px-4 py-1.5 bg-indigo-500/20 rounded-full w-fit border border-indigo-500/30">
                            <Shield size={16} className="text-indigo-400"/>
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Portaria Biométrica Ativa</span>
                        </div>
                        <h3 className="text-5xl font-black tracking-tighter">Identificação Facial</h3>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed">Utilize o protocolo WebRTC para validar moradores em tempo real através da câmera do dispositivo.</p>
                      </div>

                      {!isScanning ? (
                          <button onClick={startBiometricScan} className="flex items-center gap-4 px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95">
                              <Camera size={20}/> Iniciar Verificação
                          </button>
                      ) : (
                          <button onClick={stopScan} className="flex items-center gap-4 px-12 py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all">
                              <X size={20}/> Encerrar Sessão
                          </button>
                      )}
                  </div>

                  <div className="w-full lg:w-[480px] bg-black rounded-[3rem] overflow-hidden border-4 border-slate-800 shadow-2xl aspect-video md:aspect-square relative">
                      {isScanning ? (
                          <>
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale opacity-50"></video>
                            <div className="absolute inset-0 pointer-events-none">
                                {/* SCANNING ANIMATION */}
                                <div className="absolute inset-10 border-2 border-indigo-500/30 rounded-[2rem]"></div>
                                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-indigo-500 shadow-[0_0_20px_#6366f1] animate-[scan_3s_infinite] opacity-50"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ScanLine size={120} className="text-indigo-400/20"/>
                                </div>
                                
                                {scanResult === 'MATCH' && (
                                    <div className="absolute inset-0 bg-emerald-600/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
                                        <div className="p-8 bg-white text-emerald-600 rounded-full shadow-2xl mb-6"><UserCheck size={64}/></div>
                                        <h4 className="text-2xl font-black uppercase tracking-widest">ACESSO AUTORIZADO</h4>
                                        <p className="text-emerald-100 font-bold uppercase text-[10px] mt-2">Morador Identificado • Unidade A102</p>
                                    </div>
                                )}
                                {scanResult === 'DENIED' && (
                                    <div className="absolute inset-0 bg-rose-600/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
                                        <div className="p-8 bg-white text-rose-600 rounded-full shadow-2xl mb-6"><AlertCircle size={64}/></div>
                                        <h4 className="text-2xl font-black uppercase tracking-widest">ACESSO NEGADO</h4>
                                        <p className="text-rose-100 font-bold uppercase text-[10px] mt-2">Protocolo Desconhecido • Alertar SRE</p>
                                    </div>
                                )}
                            </div>
                          </>
                      ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-950">
                              <Camera size={64} className="mb-6 opacity-10"/>
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Câmera Offline</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
      <style>{`
        @keyframes scan {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
        }
      `}</style>
    </div>
  );
};

export default DigitalWatch;
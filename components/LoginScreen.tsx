
import React, { useState, useEffect, useRef } from 'react';
import { User, SystemInfo } from '../types';
import { authService } from '../services/api';
import { 
    Lock, ArrowRight, ArrowLeft, Loader2, Fingerprint, Shield, Zap,
    Mail, Smartphone, ShieldAlert, User as UserIcon
} from 'lucide-react';
import { formatCPF } from '../utils/cpf';

const LoginScreen = ({ onLoginSuccess, systemInfo }: { onLoginSuccess: (user: User, token: string) => void; systemInfo: SystemInfo }) => {
    const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [auditLogs, setAuditLogs] = useState<string[]>(["[SYSTEM] Kernel V200.0 Ready"]);
    const [credentialType, setCredentialType] = useState<'CPF' | 'EMAIL' | 'UNKNOWN'>('UNKNOWN');

    const logEndRef = useRef<HTMLDivElement>(null);

    const addLog = (msg: string) => {
        setAuditLogs(prev => [...prev.slice(-8), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [auditLogs]);

    useEffect(() => {
        const input = loginIdentifier.trim();
        if (!input) { setCredentialType('UNKNOWN'); return; }
        if (input.includes('@')) setCredentialType('EMAIL');
        else if (input.replace(/\D/g, '').length >= 4) setCredentialType('CPF');
        else setCredentialType('UNKNOWN');
    }, [loginIdentifier]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        addLog(`[HANDSHAKE] Verificando ${credentialType}...`);

        try {
            const response = await authService.login({ 
                username: loginIdentifier.trim(), 
                password: loginPass 
            });
            
            addLog(`[SUCCESS] Sincronizado: ${response.data.user.name}`);
            
            setTimeout(() => {
                onLoginSuccess(response.data.user, response.data.token);
            }, 800);

        } catch (err: any) {
            const status = err.response?.status;
            const errorKey = err.response?.data?.error;
            
            if (status === 404 || errorKey === 'MEMBRO_NAO_LOCALIZADO') {
                setError('MEMBRO NÃO LOCALIZADO NO CLUSTER.');
                addLog(`[WARN] Identidade não localizada.`);
            } else if (status === 401 || errorKey === 'CREDENCIAIS_INVALIDAS') {
                setError('CHAVE SOBERANA INCORRETA.');
                addLog(`[DENIED] Falha na chave.`);
            } else {
                setError('FALHA DE COMUNICAÇÃO COM KERNEL.');
                addLog(`[ERROR] Timeout de rede.`);
            }
            setIsLoading(false);
        }
    };

    const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Se for puramente números, aplica máscara de CPF
        if (/^\d+$/.test(val.replace(/\D/g, '')) && !val.includes('@')) {
            setLoginIdentifier(formatCPF(val));
        } else {
            setLoginIdentifier(val);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 lg:p-10 relative overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            
            <div className="w-full max-w-6xl flex flex-col lg:flex-row bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] shadow-2xl overflow-hidden relative z-10 animate-fade-in min-h-[650px]">
                
                <div className="lg:w-5/12 p-12 lg:p-20 flex flex-col border-r border-white/5 justify-center">
                    <div className="space-y-8 text-center lg:text-left">
                        <div className="w-24 h-24 bg-slate-900 border border-white/10 rounded-3xl flex items-center justify-center text-white shadow-2xl mx-auto lg:mx-0 relative">
                            {systemInfo.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain p-4" alt="Logo" /> : <Shield size={42} className="text-indigo-400" />}
                            <div className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-xl"><Zap size={14} fill="currentColor"/></div>
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tightest leading-none">{systemInfo.name}</h1>
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.5em] opacity-70">Handshake de Identidade V200.0</p>
                        </div>
                        
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-[10px] text-indigo-300 space-y-2 h-40 overflow-y-auto custom-scrollbar shadow-inner text-left">
                            {auditLogs.map((log, i) => <div key={i} className="opacity-80 border-b border-white/5 pb-1">{log}</div>)}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-[#f8fafc] p-12 lg:p-24 rounded-t-[4rem] lg:rounded-t-none lg:rounded-l-[5rem] shadow-inner flex flex-col justify-center relative">
                    {view === 'LOGIN' ? (
                        <form onSubmit={handleLogin} className="max-w-md mx-auto w-full space-y-10">
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-slate-800 tracking-tightest uppercase">Handshake</h2>
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Acesse via admin@siepro.com.br ou pelo seu CPF.</p>
                            </div>

                            {error && (
                                <div className="bg-rose-50 text-rose-600 p-5 rounded-2xl text-[10px] font-black uppercase text-center border border-rose-100 flex items-center justify-center gap-3 animate-shake">
                                    <ShieldAlert size={18}/> {error}
                                </div>
                            )}
                            
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Identidade Cluster</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-slate-100 text-slate-400 group-focus-within:text-indigo-600 transition-all shadow-sm">
                                            {credentialType === 'EMAIL' ? <Mail size={20}/> : <Fingerprint size={20}/>}
                                        </div>
                                        <input 
                                            type="text" 
                                            value={loginIdentifier} 
                                            onChange={handleIdentifierChange}
                                            placeholder="admin@siepro.com.br ou CPF" 
                                            required 
                                            className="w-full pl-16 pr-6 py-6 bg-white border border-slate-200 rounded-[2rem] font-black text-lg focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-200 shadow-sm" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Chave Soberana</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-slate-100 text-slate-400 group-focus-within:text-indigo-600 transition-all shadow-sm"><Lock size={20}/></div>
                                        <input 
                                            type="password" 
                                            value={loginPass} 
                                            onChange={e => setLoginPass(e.target.value)} 
                                            placeholder="••••••••" 
                                            required 
                                            className="w-full pl-16 pr-6 py-6 bg-white border border-slate-200 rounded-[2rem] font-black text-lg focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-200 shadow-sm" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full py-8 bg-slate-950 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                                {isLoading ? <Loader2 className="animate-spin" size={24}/> : <>Entrar no Cluster <ArrowRight size={24}/></>}
                            </button>

                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">S.I.E PRO SECURITY LAYER V200</p>
                        </form>
                    ) : (
                        <div className="max-w-md mx-auto w-full animate-fade-in space-y-10 text-center">
                            <button onClick={() => setView('LOGIN')} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 mb-10 hover:text-indigo-600 transition-all"><ArrowLeft size={18}/> Voltar ao Handshake</button>
                            <div className="p-10 bg-indigo-50 rounded-[3rem] border border-indigo-100 shadow-inner">
                                <Zap size={48} className="text-indigo-600 mx-auto mb-6 animate-pulse"/>
                                <h3 className="text-2xl font-black text-slate-800 uppercase">Acesso Solicitado</h3>
                                <p className="text-xs text-slate-500 font-medium uppercase mt-4 leading-relaxed">Sua identidade está sendo processada pelo Kernel. Aguarde a liberação administrativa.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;

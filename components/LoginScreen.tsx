import React, { useState, useEffect, useRef } from 'react';
import { User, SystemInfo } from '../types';
import { authService, api } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import { AxiosError } from 'axios';
import { z } from 'zod';
import { 
    Lock, ArrowRight, AlertCircle, AlertTriangle, ArrowLeft, CheckCircle, 
    Loader2, Fingerprint, ShieldCheck, Terminal, UserPlus, HelpCircle, Shield, Zap, Key,
    Eye, EyeOff, Activity, ShieldAlert, Cpu, Send, Smartphone, User as UserIcon
} from 'lucide-react';

// SCHEMA VALIDATION (SUGESTÃO ID #2) - Rigor SRE V180
const registrationSchema = z.object({
  name: z.string()
    .min(5, "Nome completo deve ter pelo menos 5 caracteres")
    .max(100, "Nome excessivamente longo")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, "Nome deve conter apenas letras e espaços"),
  cpf: z.string()
    .refine(val => validateCPF(normalizeCPF(val)), "Assinatura de CPF matematicamente inválida"),
  phone: z.string()
    .min(10, "WhatsApp deve ter pelo menos 10 dígitos (DDD + Número)")
    .max(15, "WhatsApp fora dos parâmetros internacionais")
    .regex(/^\d+$/, "WhatsApp deve conter apenas caracteres numéricos")
});

interface LoginScreenProps {
    onLoginSuccess: (user: User, token: string) => void;
    systemInfo: SystemInfo;
}

const LoginScreen = ({ onLoginSuccess, systemInfo }: LoginScreenProps) => {
    const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'FORGOT' | 'ACTIVATE'>('LOGIN');
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showAudit, setShowAudit] = useState(false);
    const [auditLogs, setAuditLogs] = useState<string[]>(["[SYSTEM] Kernel Initialized", "[AUTH] Waiting for credentials..."]);
    const [loginValidation, setLoginValidation] = useState('IDLE' as 'VALID' | 'INVALID' | 'IDLE');

    // Registration Form State
    const [regForm, setRegForm] = useState({ name: '', cpf: '', phone: '' });
    const [regErrors, setRegErrors] = useState<Record<string, string>>({});

    const logEndRef = useRef<HTMLDivElement>(null);

    const addLog = (msg: string) => {
        setAuditLogs(prev => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [auditLogs]);

    useEffect(() => {
        const input = loginIdentifier.trim();
        if (!input) { setLoginValidation('IDLE'); return; }
        const isEmail = input.includes('@');
        const cleanCpf = normalizeCPF(input);
        
        if (isEmail) {
            setLoginValidation(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input) ? 'VALID' : 'INVALID');
        } else if (cleanCpf.length === 11) {
            const isValid = validateCPF(cleanCpf);
            setLoginValidation(isValid ? 'VALID' : 'INVALID');
            if(isValid) addLog(`[DETECT] Valid CPF sequence: ${cleanCpf.substring(0,3)}***`);
        } else {
            setLoginValidation('IDLE');
        }
    }, [loginIdentifier]);

    // HANDLER DE LOGIN COM TIPAGEM ESTRITA (SUGESTÃO ID #1)
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        const identifier = loginIdentifier.trim();
        addLog(`[AUTH] Handshake iniciado para: ${identifier.substring(0,5)}...`);
        
        try {
            addLog(`[DB] Consultando kernel de membros...`);
            const response = await authService.login({ username: identifier, password: loginPass });
            
            addLog(`[AUTH] Handshake completo. Provisionando JWT...`);
            addLog(`[SYSTEM] Bem-vindo(a), ${response.data.user.name}`);
            
            setTimeout(() => {
                onLoginSuccess(response.data.user, response.data.token);
            }, 800);

        } catch (err: unknown) {
            let errorMsg = 'SRE_DENIED: FALHA NÃO IDENTIFICADA NO HANDSHAKE';
            
            if (err instanceof AxiosError) {
                errorMsg = err.response?.data?.error || `ERRO_PROTOCOLO_${err.response?.status}`;
                addLog(`[CRITICAL] Falha de Rede/API: ${errorMsg}`);
            } else if (err instanceof Error) {
                errorMsg = err.message;
                addLog(`[CRITICAL] Falha de Runtime: ${errorMsg}`);
            }
            
            setError(errorMsg);
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setRegErrors({});
        setError('');

        try {
            // VALIDAÇÃO DE SCHEMA (ZOD)
            const validatedData = registrationSchema.parse({
                ...regForm,
                phone: regForm.phone.replace(/\D/g, '')
            });

            addLog(`[REGISTER] Protocolando solicitação para: ${validatedData.name}`);
            
            // INTEGRAÇÃO REAL COM ENDPOINT
            await api.post('/auth/register', {
                name: validatedData.name,
                cpf_cnpj: normalizeCPF(validatedData.cpf),
                phone: validatedData.phone,
                unit: 'PENDENTE',
                role: 'RESIDENT'
            });

            addLog(`[SUCCESS] Solicitação comitada. Aguardando auditoria do conselho.`);
            alert("Solicitação enviada com sucesso! Seu acesso será liberado após a auditoria administrativa.");
            setView('LOGIN');
        } catch (err: unknown) {
            if (err instanceof z.ZodError) {
                const formattedErrors: Record<string, string> = {};
                err.issues.forEach(issue => {
                    if (issue.path[0]) formattedErrors[issue.path[0].toString()] = issue.message;
                });
                setRegErrors(formattedErrors);
                addLog(`[VALIDATION] Erro de integridade: ${err.issues[0].message}`);
            } else if (err instanceof AxiosError) {
                const msg = err.response?.data?.error || "Falha ao registrar protocolo";
                setError(msg);
                addLog(`[DB_ERROR] ${msg}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 lg:p-10 relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%234f46e5\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
            <div className="absolute top-0 -left-40 w-[60rem] h-[60rem] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse"></div>
            <div className="absolute -bottom-40 -right-20 w-[60rem] h-[60rem] bg-emerald-600/5 rounded-full blur-[160px] animate-pulse delay-700"></div>

            <div className="w-full max-w-6xl flex flex-col lg:flex-row bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] overflow-hidden relative z-10 animate-scale-in min-h-[700px]">
                
                <div className="lg:w-5/12 p-12 lg:p-20 flex flex-col border-r border-white/5">
                    <div className="flex-1 flex flex-col justify-center items-center lg:items-start text-center lg:text-left space-y-8">
                        <div className="w-24 h-24 bg-slate-900 border border-white/10 rounded-3xl flex items-center justify-center text-white shadow-2xl relative group">
                            <div className="absolute inset-0 bg-indigo-600/20 rounded-3xl blur-2xl group-hover:bg-indigo-600/40 transition-all"></div>
                            {systemInfo.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain p-4 relative z-10" alt="Logo" /> : <Shield size={42} className="text-indigo-400 relative z-10" />}
                            <div className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-xl z-20"><Zap size={14} fill="currentColor"/></div>
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tightest leading-none">{systemInfo.name}</h1>
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.5em] opacity-70">Sistema Inteligente Ativo</p>
                        </div>
                        
                        <div className="w-full pt-10 border-t border-white/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <button onClick={() => setShowAudit(!showAudit)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
                                    <Terminal size={14}/> {showAudit ? 'Ocultar Terminal' : 'Ver Auditoria SRE'}
                                </button>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Master Synced</span>
                                </div>
                            </div>

                            {showAudit && (
                                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-[10px] text-indigo-300 space-y-2 h-48 overflow-y-auto custom-scrollbar shadow-inner animate-fade-in">
                                    {auditLogs.map((log, i) => (
                                        <div key={i} className="flex gap-3 opacity-80 border-b border-white/5 pb-1 last:border-0">
                                            <span className="text-slate-600 shrink-0">[{i}]</span>
                                            <span className="whitespace-pre-wrap">{log}</span>
                                        </div>
                                    ))}
                                    <div ref={logEndRef} />
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-10 pt-10 border-t border-white/5 flex gap-10 justify-center lg:justify-start opacity-40">
                         <div className="text-center"><Cpu size={20} className="text-white mx-auto mb-2"/><p className="text-[8px] font-black text-white uppercase">Neural Core</p></div>
                         <div className="text-center"><ShieldCheck size={20} className="text-white mx-auto mb-2"/><p className="text-[8px] font-black text-white uppercase">JWT Protected</p></div>
                         <div className="text-center"><Activity size={20} className="text-white mx-auto mb-2"/><p className="text-[8px] font-black text-white uppercase">Uptime 99.9%</p></div>
                    </div>
                </div>

                <div className="flex-1 bg-[#f8fafc] p-12 lg:p-24 rounded-t-[4rem] lg:rounded-t-none lg:rounded-l-[5rem] shadow-inner flex flex-col justify-center overflow-y-auto custom-scrollbar">
                    {view === 'LOGIN' && (
                        <form onSubmit={handleLogin} className="max-w-md mx-auto w-full space-y-10 animate-fade-in">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-black text-slate-800 tracking-tightest uppercase">Handshake Central</h2>
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Acesse com E-mail ou Membro ID (CPF).</p>
                            </div>

                            {error && (
                                <div className="bg-rose-50 text-rose-600 p-5 rounded-3xl text-[10px] font-black uppercase text-center border border-rose-100 flex items-center justify-center gap-3 animate-shake">
                                    <ShieldAlert size={18}/> {error}
                                </div>
                            )}
                            
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Membro ID (CPF ou E-mail)</label>
                                    <div className="relative group">
                                        <div className={`absolute left-5 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all shadow-sm ${loginValidation === 'VALID' ? 'bg-emerald-100 text-emerald-600' : loginValidation === 'INVALID' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {loginValidation === 'VALID' ? <CheckCircle size={20}/> : <Fingerprint size={20}/>}
                                        </div>
                                        <input 
                                            type="text" 
                                            value={loginIdentifier} 
                                            onChange={e => setLoginIdentifier(e.target.value)} 
                                            placeholder="Ex: 000.000.000-00 ou email@exemplo.com" 
                                            required 
                                            className="w-full pl-16 pr-6 py-6 bg-white border border-slate-200 rounded-[2rem] font-black text-lg focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-200" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-2">
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Senha Criptografada</label>
                                        <button type="button" onClick={() => setView('FORGOT')} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Esqueci a Senha</button>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-slate-100 text-slate-400 group-focus-within:bg-indigo-100 group-focus-within:text-indigo-600 transition-all shadow-sm">
                                            <Lock size={20}/>
                                        </div>
                                        <input 
                                            type="password" 
                                            value={loginPass} 
                                            onChange={e => setLoginPass(e.target.value)} 
                                            placeholder="••••••••" 
                                            required 
                                            className="w-full pl-16 pr-6 py-6 bg-white border border-slate-200 rounded-[2rem] font-black text-lg focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading} 
                                className="w-full py-8 bg-slate-950 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={24}/> : <>Autenticar Protocolo <ArrowRight size={24}/></>}
                            </button>

                            <div className="flex justify-center pt-4">
                                <button type="button" onClick={() => setView('REGISTER')} className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 hover:text-indigo-600 transition-all group">
                                    Não é membro? <span className="text-indigo-600 group-hover:translate-x-2 transition-transform flex items-center gap-1"><UserPlus size={16}/> Solicitar Cadastro</span>
                                </button>
                            </div>
                        </form>
                    )}

                    {view === 'REGISTER' && (
                        <form onSubmit={handleRegister} className="max-w-md mx-auto w-full animate-fade-in space-y-10">
                             <button type="button" onClick={() => setView('LOGIN')} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-all"><ArrowLeft size={18}/> Voltar</button>
                             <div className="space-y-4">
                                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tightest">Solicitação de Acesso</h2>
                                <p className="text-slate-500 text-sm font-medium uppercase italic">Suas credenciais serão auditadas pelo Kernel.</p>
                             </div>

                             {error && (
                                <div className="bg-rose-50 text-rose-600 p-5 rounded-2xl text-[9px] font-black uppercase border border-rose-100 flex items-center gap-3 animate-shake">
                                    <ShieldAlert size={16}/> {error}
                                </div>
                             )}

                             <div className="space-y-5">
                                <div className="p-8 bg-white border border-slate-200 rounded-[3rem] shadow-sm space-y-6">
                                    <div className="space-y-1">
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-500"><UserIcon size={18}/></div>
                                            <input 
                                                placeholder="NOME COMPLETO" 
                                                value={regForm.name}
                                                onChange={e => setRegForm({...regForm, name: e.target.value.toUpperCase()})}
                                                className={`w-full pl-12 pr-5 py-4 bg-slate-50 border ${regErrors.name ? 'border-rose-300' : 'border-slate-100'} rounded-2xl font-bold text-xs outline-none focus:bg-white focus:border-indigo-500 transition-all`} 
                                            />
                                        </div>
                                        {regErrors.name && <p className="text-[8px] text-rose-500 font-black ml-2 uppercase">{regErrors.name}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-500"><Fingerprint size={18}/></div>
                                            <input 
                                                placeholder="CPF (APENAS NÚMEROS)" 
                                                value={regForm.cpf}
                                                onChange={e => setRegForm({...regForm, cpf: formatCPF(e.target.value)})}
                                                maxLength={14}
                                                className={`w-full pl-12 pr-5 py-4 bg-slate-50 border ${regErrors.cpf ? 'border-rose-300' : 'border-slate-100'} rounded-2xl font-bold text-xs outline-none focus:bg-white focus:border-indigo-500 transition-all`} 
                                            />
                                        </div>
                                        {regErrors.cpf && <p className="text-[8px] text-rose-500 font-black ml-2 uppercase">{regErrors.cpf}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-500"><Smartphone size={18}/></div>
                                            <input 
                                                placeholder="WHATSAPP (DDD + NÚMERO)" 
                                                value={regForm.phone}
                                                onChange={e => setRegForm({...regForm, phone: e.target.value.replace(/\D/g, '')})}
                                                className={`w-full pl-12 pr-5 py-4 bg-slate-50 border ${regErrors.phone ? 'border-rose-300' : 'border-slate-100'} rounded-2xl font-bold text-xs outline-none focus:bg-white focus:border-indigo-500 transition-all`} 
                                            />
                                        </div>
                                        {regErrors.phone && <p className="text-[8px] text-rose-500 font-black ml-2 uppercase">{regErrors.phone}</p>}
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={20}/> : <><Send size={18}/> Enviar Protocolo</>}
                                </button>
                             </div>
                        </form>
                    )}

                    {view === 'FORGOT' && (
                        <div className="max-w-md mx-auto w-full animate-fade-in text-center space-y-8">
                             <button onClick={() => setView('LOGIN')} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-all"><ArrowLeft size={18}/> Voltar</button>
                             <div className="p-10 bg-white border border-slate-200 rounded-[3.5rem] shadow-xl flex flex-col items-center gap-6">
                                <div className="p-6 bg-rose-50 text-rose-500 rounded-full shadow-inner"><AlertTriangle size={48}/></div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Lockdown de Segurança</h3>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed uppercase">Recuperação de acesso soberana via auditoria física administrativa.</p>
                                <a href={`mailto:${systemInfo.email}`} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-indigo-600 transition-all">Contatar Administrador</a>
                             </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none opacity-20">
                <p className="text-[10px] font-black text-white uppercase tracking-[1.5em] leading-none">SRE ANALYTICS • SECURED BY KERNEL ALPHA</p>
            </div>
        </div>
    );
};

export default LoginScreen;
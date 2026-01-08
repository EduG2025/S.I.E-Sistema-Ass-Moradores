
import React, { useState, useEffect } from 'react';
import { User, SystemInfo } from '../types';
import { authService } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import { Lock, ArrowRight, AlertCircle, ArrowLeft, CheckCircle, Loader2, Fingerprint, ShieldCheck, Terminal, Check, Mail } from 'lucide-react';

interface LoginScreenProps {
    onLoginSuccess: (user: User, token: string) => void;
    systemInfo: SystemInfo;
}

const LoginScreen = ({ onLoginSuccess, systemInfo }: LoginScreenProps) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Reg States
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regCPF, setRegCPF] = useState('');
    const [regPass, setRegPass] = useState('');
    const [lgpdAccepted, setLgpdAccepted] = useState(false);
    const [regSuccess, setRegSuccess] = useState(false);
    const [cpfValidation, setCpfValidation] = useState('IDLE' as 'VALID' | 'INVALID' | 'IDLE');
    const [loginValidation, setLoginValidation] = useState('IDLE' as 'VALID' | 'INVALID' | 'IDLE');

    // Identificação Dinâmica (E-mail ou CPF)
    useEffect(() => {
        const input = loginIdentifier.trim();
        if (!input) {
            setLoginValidation('IDLE');
            return;
        }

        const isEmail = input.includes('@');
        const cleanCpf = normalizeCPF(input);

        if (isEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            setLoginValidation(emailRegex.test(input) ? 'VALID' : 'INVALID');
        } else if (cleanCpf.length === 11) {
            setLoginValidation(validateCPF(cleanCpf) ? 'VALID' : 'INVALID');
        } else if (cleanCpf.length > 0 && cleanCpf.length < 11) {
            setLoginValidation('IDLE');
        } else {
            setLoginValidation('INVALID');
        }
    }, [loginIdentifier]);

    // CPF Real-time Validation for Register
    useEffect(() => {
        const clean = normalizeCPF(regCPF);
        if (clean.length === 11) {
            setCpfValidation(validateCPF(clean) ? 'VALID' : 'INVALID');
        } else if (clean.length > 0) {
            setCpfValidation('INVALID');
        } else {
            setCpfValidation('IDLE');
        }
    }, [regCPF]);

    useEffect(() => {
        setError('');
        setCpfValidation('IDLE');
        setLoginValidation('IDLE');
    }, [isRegistering]);

    const handleLogin = async (e: any) => {
        e.preventDefault();
        
        if (loginValidation === 'INVALID') {
            setError('PROTOCOL_ERROR: IDENTIFICADOR INVÁLIDO (USE CPF OU E-MAIL)');
            return;
        }

        setIsLoading(true);
        setError('');
        
        try {
            // Enviamos o identificador como 'username' para o backend (que tratará como CPF ou E-mail)
            const response = await authService.login({ username: loginIdentifier.trim(), password: loginPass });
            onLoginSuccess(response.data.user, response.data.token);
        } catch (err: any) {
            setError(err.response?.data?.error || 'SRE_DENIED: CREDENCIAIS INVÁLIDAS');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: any) => {
        e.preventDefault();
        if (!lgpdAccepted) { setError('LGPD_REQUIREMENT: ACEITE OBRIGATÓRIO'); return; }
        
        const cleanCPF = normalizeCPF(regCPF);
        if (!validateCPF(cleanCPF)) {
            setError('PROTOCOL_ERROR: CPF INVÁLIDO');
            return;
        }
        
        setIsLoading(true);
        try {
            await authService.register({
                name: regName,
                email: regEmail,
                cpf_cnpj: cleanCPF,
                password: regPass,
                username: cleanCPF,
                lgpd_consent: true
            });
            setRegSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'SRE_REJECTED: FALHA NO COMMIT');
        } finally {
            setIsLoading(false);
        }
    };

    // FIX: Use any to bypass namespace 'React' error
    const handleIdentifierChange = (e: any) => {
        const val = e.target.value;
        if (!val.includes('@') && !/[a-zA-Z]/.test(val)) {
            setLoginIdentifier(formatCPF(val));
        } else {
            setLoginIdentifier(val);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
            
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 -left-40 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute -bottom-40 -right-20 w-[40rem] h-[40rem] bg-emerald-600/5 rounded-full blur-[120px] animate-pulse delay-700"></div>
            </div>

            <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative z-10 animate-scale-in">
                
                <div className="p-12 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
                    
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl mb-8 ring-4 ring-white/5 group hover:scale-105 transition-transform">
                        {systemInfo.logoUrl ? (
                            <img src={systemInfo.logoUrl} className="w-16 h-16 object-contain" alt="Logo"/>
                        ) : (
                            <Terminal size={48} className="group-hover:animate-pulse" />
                        )}
                    </div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{systemInfo.name || 'S.I.E PRO'}</h1>
                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mt-4 opacity-80">Terminal de Governança SRE</p>
                </div>

                <div className="bg-[#f8fafc] p-10 rounded-t-[4rem] shadow-inner flex-1">
                    {isRegistering ? (
                        regSuccess ? (
                            <div className="text-center py-10 animate-fade-in">
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
                                    <CheckCircle size={40}/>
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Registro Protocolado</h3>
                                <p className="text-slate-500 text-sm mt-4 mb-10 font-medium px-4">Seu acesso foi enviado para a fila de auditoria SRE. Você será notificado por e-mail.</p>
                                <button onClick={() => { setIsRegistering(false); setRegSuccess(false); }} 
                                        className="w-full py-4.5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95">
                                    Retornar ao Login
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
                                <div className="flex items-center gap-2 mb-2">
                                    <button type="button" onClick={() => setIsRegistering(false)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                        <ArrowLeft size={20}/>
                                    </button>
                                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Nova Credencial</h2>
                                </div>

                                {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl text-[10px] font-black uppercase text-center border border-rose-100 flex items-center justify-center gap-2 animate-bounce"><AlertCircle size={14}/> {error}</div>}
                                
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Nome Completo</label>
                                        <input type="text" value={regName} onChange={e => setRegName(e.target.value)} required className="w-full bg-slate-50 border-slate-200 focus:border-indigo-500" placeholder="Nome Completo"/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">E-mail Corporativo</label>
                                        <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required className="w-full bg-slate-50 border-slate-200 focus:border-indigo-500" placeholder="seu@email.com"/>
                                    </div>
                                    <div className="space-y-1 relative">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">CPF Oficial</label>
                                        <input 
                                            type="text" 
                                            value={regCPF} 
                                            onChange={e => setRegCPF(formatCPF(e.target.value))} 
                                            required 
                                            maxLength={14} 
                                            className={`w-full bg-slate-50 border-slate-200 transition-all ${cpfValidation === 'VALID' ? 'border-emerald-500' : cpfValidation === 'INVALID' ? 'border-rose-500' : ''}`} 
                                            placeholder="000.000.000-00"
                                        />
                                        <div className="absolute right-4 bottom-3.5">
                                            {cpfValidation === 'VALID' && <CheckCircle size={16} className="text-emerald-500 animate-fade-in"/>}
                                            {cpfValidation === 'INVALID' && <AlertCircle size={16} className="text-rose-500 animate-fade-in"/>}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Senha de Acesso</label>
                                        <input type="password" value={regPass} onChange={e => setRegPass(e.target.value)} required className="w-full bg-slate-50 border-slate-200 focus:border-indigo-500" placeholder="••••••••"/>
                                    </div>
                                </div>

                                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 group cursor-pointer" onClick={() => setLgpdAccepted(!lgpdAccepted)}>
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <div className={`mt-1 w-5 h-5 rounded flex items-center justify-center transition-all ${lgpdAccepted ? 'bg-indigo-600 shadow-lg' : 'bg-white border border-slate-300'}`}>
                                            {lgpdAccepted && <Check size={14} className="text-white"/>}
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-bold leading-relaxed select-none">
                                            Autorizo o tratamento de meus dados pessoais em conformidade com a <span className="text-indigo-600 underline">LGPD</span>.
                                        </span>
                                    </label>
                                </div>

                                <button type="submit" disabled={isLoading || cpfValidation === 'INVALID'} className="w-full py-4.5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex justify-center shadow-xl shadow-indigo-200 disabled:opacity-50">
                                    {isLoading ? <Loader2 className="animate-spin" size={20}/> : 'Commit Registro'}
                                </button>
                            </form>
                        )
                    ) : (
                        <div className="space-y-8 animate-fade-in">
                            <form onSubmit={handleLogin} className="space-y-6">
                                {error && <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-[10px] font-black uppercase text-center border border-rose-100 flex items-center justify-center gap-2"><AlertCircle size={16}/> {error}</div>}
                                
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificação (CPF ou E-mail)</label>
                                        <div className="relative group">
                                            {loginIdentifier.includes('@') ? (
                                                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${loginValidation === 'VALID' ? 'text-emerald-500' : loginValidation === 'INVALID' ? 'text-rose-500' : 'text-slate-400 group-focus-within:text-indigo-500'}`} size={20}/>
                                            ) : (
                                                <Fingerprint className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${loginValidation === 'VALID' ? 'text-emerald-500' : loginValidation === 'INVALID' ? 'text-rose-500' : 'text-slate-400 group-focus-within:text-indigo-500'}`} size={20}/>
                                            )}
                                            <input 
                                                type="text" 
                                                value={loginIdentifier} 
                                                onChange={handleIdentifierChange} 
                                                placeholder="CPF ou E-mail" 
                                                required 
                                                className={`w-full pl-12 pr-12 py-4.5 bg-white border rounded-2xl font-bold shadow-inner focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none ${loginValidation === 'VALID' ? 'border-emerald-500' : loginValidation === 'INVALID' ? 'border-rose-500' : 'border-slate-200'}`} 
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                {loginValidation === 'VALID' && <CheckCircle size={18} className="text-emerald-500"/>}
                                                {loginValidation === 'INVALID' && <AlertCircle size={18} className="text-rose-500"/>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha Terminal</label>
                                            <button type="button" className="text-[9px] font-black text-indigo-500 uppercase hover:underline">Recuperar</button>
                                        </div>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20}/>
                                            <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="••••••••" required className="w-full pl-12 pr-4 py-4.5 bg-white border border-slate-200 rounded-2xl font-bold shadow-inner focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none" />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={isLoading || loginValidation === 'INVALID'} className="w-full py-5 bg-slate-900 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50">
                                    {isLoading ? <Loader2 className="animate-spin" size={20}/> : <><span className="mt-0.5">Autenticar Sistema</span> <ShieldCheck size={20}/></>}
                                </button>
                            </form>

                            <div className="flex flex-col items-center gap-6">
                                <div className="w-full h-[1px] bg-slate-100 relative">
                                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f8fafc] px-4 text-[9px] font-black text-slate-300 uppercase">Ou</span>
                                </div>
                                
                                <button type="button" onClick={() => setIsRegistering(true)} className="group flex items-center gap-3 text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-all">
                                    Solicitar Token SRE <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;


import React, { useState, useEffect } from 'react';
import { User, SystemInfo } from '../types';
import { authService } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import { 
    Lock, ArrowRight, AlertCircle, ArrowLeft, CheckCircle, 
    Loader2, Fingerprint, ShieldCheck, Terminal, UserPlus, HelpCircle 
} from 'lucide-react';

interface LoginScreenProps {
    onLoginSuccess: (user: User, token: string) => void;
    systemInfo: SystemInfo;
}

const LoginScreen = ({ onLoginSuccess, systemInfo }: LoginScreenProps) => {
    const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loginValidation, setLoginValidation] = useState('IDLE' as 'VALID' | 'INVALID' | 'IDLE');

    // Registration States
    const [regData, setRegData] = useState({ name: '', cpf: '', email: '', unit: '', password: '' });

    useEffect(() => {
        const input = loginIdentifier.trim();
        if (!input) { setLoginValidation('IDLE'); return; }
        const isEmail = input.includes('@');
        const cleanCpf = normalizeCPF(input);
        if (isEmail) {
            setLoginValidation(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input) ? 'VALID' : 'INVALID');
        } else if (cleanCpf.length === 11) {
            setLoginValidation(validateCPF(cleanCpf) ? 'VALID' : 'INVALID');
        } else {
            setLoginValidation('IDLE');
        }
    }, [loginIdentifier]);

    const handleLogin = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
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
        setIsLoading(true);
        try {
            await authService.register({ ...regData, cpf_cnpj: normalizeCPF(regData.cpf) });
            alert("Solicitação enviada. Aguarde aprovação do SRE.");
            setView('LOGIN');
        } catch (e) {
            setError("Falha ao registrar solicitação.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
            
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 -left-40 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute -bottom-40 -right-20 w-[40rem] h-[40rem] bg-emerald-600/5 rounded-full blur-[120px] animate-pulse delay-700"></div>
            </div>

            <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative z-10 animate-scale-in">
                <div className="p-12 text-center relative overflow-hidden shrink-0">
                    <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[2.5rem] mx-auto flex items-center justify-center text-white shadow-2xl mb-6 ring-4 ring-white/5 overflow-hidden p-1">
                        {systemInfo.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain p-2" alt="Logo"/> : <Terminal size={40} className="text-indigo-400" />}
                    </div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{systemInfo.name}</h1>
                    <p className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.4em] mt-3 opacity-80">Terminal SRE v25.9</p>
                </div>

                <div className="bg-[#f8fafc] p-10 rounded-t-[4rem] shadow-inner flex-1">
                    {view === 'LOGIN' && (
                        <form onSubmit={handleLogin} className="space-y-6 animate-fade-in">
                            {error && <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-[10px] font-black uppercase text-center border border-rose-100 flex items-center justify-center gap-2"><AlertCircle size={16}/> {error}</div>}
                            
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificação</label>
                                    <div className="relative group">
                                        <Fingerprint className={`absolute left-4 top-1/2 -translate-y-1/2 ${loginValidation === 'VALID' ? 'text-emerald-500' : 'text-slate-400'}`} size={20}/>
                                        <input type="text" value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} placeholder="CPF ou E-mail" required className="w-full pl-12 pr-4 py-4.5 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Terminal</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                                        <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="••••••••" required className="w-full pl-12 pr-4 py-4.5 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none" />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full py-5 bg-slate-900 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                                {isLoading ? <Loader2 className="animate-spin" size={20}/> : <>Acessar Sistema <ShieldCheck size={20}/></>}
                            </button>

                            <div className="flex justify-between items-center px-2">
                                <button type="button" onClick={() => setView('REGISTER')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><UserPlus size={14}/> Solicitar Acesso</button>
                                <button type="button" onClick={() => setView('FORGOT')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><HelpCircle size={14}/> Recuperar</button>
                            </div>
                        </form>
                    )}

                    {view === 'REGISTER' && (
                        <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2"><ArrowLeft size={18} className="cursor-pointer" onClick={() => setView('LOGIN')}/> Novo Registro</h3>
                            <input placeholder="Nome Completo" className="w-full p-4 bg-white border rounded-xl font-bold text-sm" value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} />
                            <input placeholder="CPF" className="w-full p-4 bg-white border rounded-xl font-bold text-sm" value={regData.cpf} onChange={e => setRegData({...regData, cpf: formatCPF(e.target.value)})} />
                            <input placeholder="Unidade / Lote" className="w-full p-4 bg-white border rounded-xl font-bold text-sm" value={regData.unit} onChange={e => setRegData({...regData, unit: e.target.value})} />
                            <input placeholder="E-mail" type="email" className="w-full p-4 bg-white border rounded-xl font-bold text-sm" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} />
                            <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Protocolar Cadastro</button>
                        </form>
                    )}

                    {view === 'FORGOT' && (
                        <div className="text-center py-10 animate-fade-in">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center justify-center gap-2"><ArrowLeft size={18} className="cursor-pointer" onClick={() => setView('LOGIN')}/> Recuperação</h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8">Por motivos de segurança SRE, a recuperação de senha deve ser solicitada presencialmente ou via canal oficial de suporte do administrador.</p>
                            <a href={`mailto:${systemInfo.email}`} className="px-8 py-4 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-indigo-600 inline-block">Contatar Administrador</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;

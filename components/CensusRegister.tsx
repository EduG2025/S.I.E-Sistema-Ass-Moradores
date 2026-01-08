import React, { useState, useEffect } from 'react';
import { censusService } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import { Loader2, CheckCircle2 } from 'lucide-react';

const CensusRegister = () => {
    const [name, setName] = useState('');
    const [cpf, setCpf] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successId, setSuccessId] = useState<number | null>(null);

    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const cpfParam = params.get('cpf');
            if (cpfParam) setCpf(formatCPF(cpfParam));
        } catch (e) { /* ignore for SSR */ }
    }, []);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError('');
        const cpfClean = normalizeCPF(cpf);
        if (!validateCPF(cpfClean)) { setError('CPF inválido'); return; }
        setIsLoading(true);
        try {
            const res = await censusService.register({ name, cpf_cnpj: cpfClean, birth_date: birthDate, gender, address, phone, email });
            setSuccessId(res.data.id || null);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Falha ao registrar');
        } finally { setIsLoading(false); }
    };

    if (successId) return (
        <div className="p-8 bg-white rounded-2xl shadow-lg text-center">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
            <h3 className="font-black text-lg">Registro realizado com sucesso</h3>
            <p className="text-sm text-slate-500 mt-2">ID: {successId}</p>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-8 rounded-2xl shadow-lg">
            {error && <div className="text-rose-600 text-sm font-bold">{error}</div>}
            <div>
                <label className="text-xs font-black">Nome completo</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded" />
            </div>
            <div>
                <label className="text-xs font-black">CPF</label>
                <input required value={cpf} onChange={e => setCpf(formatCPF(e.target.value))} maxLength={14} className="w-full p-3 border rounded" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-black">Data de Nascimento</label>
                    <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full p-3 border rounded" />
                </div>
                <div>
                    <label className="text-xs font-black">Gênero</label>
                    <input value={gender} onChange={e => setGender(e.target.value)} className="w-full p-3 border rounded" />
                </div>
            </div>
            <div>
                <label className="text-xs font-black">Endereço</label>
                <input value={address} onChange={e => setAddress(e.target.value)} className="w-full p-3 border rounded" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefone" className="w-full p-3 border rounded" />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" className="w-full p-3 border rounded" />
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-3 bg-indigo-600 text-white rounded font-black">
                {isLoading ? <Loader2 className="animate-spin" /> : 'Registrar'}
            </button>
        </form>
    );
};

export default CensusRegister;

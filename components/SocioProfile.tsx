import React, { useState } from 'react';
import { censusService } from '../services/api';
import { Loader2, CheckCircle2 } from 'lucide-react';

const SocioProfile = ({ registryId }: { registryId?: number }) => {
    const [income, setIncome] = useState('');
    const [education, setEducation] = useState('');
    const [household, setHousehold] = useState(1);
    const [employment, setEmployment] = useState('');
    const [benefits, setBenefits] = useState(false);
    const [additional, setAdditional] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [profileId, setProfileId] = useState<number | null>(null);
    const [error, setError] = useState('');

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!registryId) { setError('Registry ID obrigatório'); return; }
        setIsLoading(true); setError('');
        try {
            const res = await censusService.createProfile(registryId, { income_range: income, education_level: education, household_size: household, employment_status: employment, social_benefits: benefits, additional: { notes: additional } });
            setProfileId(res.data.profileId || null);
        } catch (err: any) { setError(err?.response?.data?.error || 'Falha ao criar perfil'); }
        finally { setIsLoading(false); }
    };

    if (profileId) return (
        <div className="p-6 bg-white rounded shadow text-center">
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-2" />
            <p className="font-black">Perfil criado: {profileId}</p>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-3 bg-white p-6 rounded shadow">
            {error && <div className="text-rose-600">{error}</div>}
            <input placeholder="Renda" value={income} onChange={e => setIncome(e.target.value)} className="w-full p-2 border rounded" />
            <input placeholder="Escolaridade" value={education} onChange={e => setEducation(e.target.value)} className="w-full p-2 border rounded" />
            <input type="number" min={1} value={household} onChange={e => setHousehold(Number(e.target.value))} className="w-full p-2 border rounded" />
            <input placeholder="Emprego" value={employment} onChange={e => setEmployment(e.target.value)} className="w-full p-2 border rounded" />
            <label className="flex items-center gap-2"><input type="checkbox" checked={benefits} onChange={e => setBenefits(e.target.checked)} /> Recebe benefícios</label>
            <textarea placeholder="Observações" value={additional} onChange={e => setAdditional(e.target.value)} className="w-full p-2 border rounded" />
            <button type="submit" disabled={isLoading} className="w-full py-2 bg-indigo-600 text-white rounded">{isLoading ? <Loader2 className="animate-spin" /> : 'Criar Perfil'}</button>
        </form>
    );
};

export default SocioProfile;

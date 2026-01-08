
import React from 'react';
import { User, SocialQuestionnaireData } from '../types';
import { Check, X, Save } from 'lucide-react';

interface SocialQuestionnaireProps {
  user: User;
  onSave: (data: SocialQuestionnaireData) => void;
  onCancel: () => void;
}

// FIX: Removed React.FC and used type assertion in useState to bypass untyped function generic errors
const SocialQuestionnaire = ({ user, onSave, onCancel }: SocialQuestionnaireProps) => {
  // FIX: Use 'as' casting to avoid generic errors on potentially untyped React.useState
  const [formData, setFormData] = React.useState((user.socialData || {}) as SocialQuestionnaireData);

  const handleChange = (field: keyof SocialQuestionnaireData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto animate-fade-in">
      <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100 mb-8">
        <h3 className="text-indigo-900 font-black text-lg tracking-tight mb-2 uppercase">Perfil Socioeconômico</h3>
        <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">Coleta de dados para inteligência demográfica e assistência</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
           <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Núcleo Familiar</h4>
           <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade de Moradores</label>
             <input type="number" className="w-full" value={formData.residentsCount || 0} onChange={e => handleChange('residentsCount', parseInt(e.target.value))} />
           </div>
           <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Crianças (0-12 anos)</label>
             <input type="number" className="w-full" value={formData.childrenCount || 0} onChange={e => handleChange('childrenCount', parseInt(e.target.value))} />
           </div>
           <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pessoas com Deficiência?</label>
             <div className="flex gap-2">
                <button onClick={() => handleChange('hasDisabledPerson', true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${formData.hasDisabledPerson ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200'}`}>Sim</button>
                <button onClick={() => handleChange('hasDisabledPerson', false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${formData.hasDisabledPerson === false ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-400 border-slate-200'}`}>Não</button>
             </div>
           </div>
        </div>

        <div className="space-y-4">
           <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Renda e Trabalho</h4>
           <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Faixa de Renda Familiar</label>
             <select className="w-full" value={formData.incomeRange || ''} onChange={e => handleChange('incomeRange', e.target.value)}>
                <option value="">Selecione...</option>
                <option value="LOW">Até R$ 1.200</option>
                <option value="MID_LOW">R$ 1.201 - R$ 2.500</option>
                <option value="MID">R$ 2.501 - R$ 5.000</option>
                <option value="HIGH">Acima de R$ 5.000</option>
             </select>
           </div>
           <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Necessidade Urgente?</label>
             <input type="text" className="w-full" value={formData.urgentNeed || ''} onChange={e => handleChange('urgentNeed', e.target.value)} placeholder="Ex: Cesta básica, Medicamentos..." />
           </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-10 border-t border-slate-100">
        <button onClick={onCancel} className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Descartar</button>
        <button onClick={() => onSave(formData)} className="flex items-center gap-2 px-10 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">
          <Save size={16}/> Sincronizar Ficha
        </button>
      </div>
    </div>
  );
};

export default SocialQuestionnaire;

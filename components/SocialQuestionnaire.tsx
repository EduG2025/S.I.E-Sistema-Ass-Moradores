
import React, { useEffect, useState } from 'react';
import { User, Survey, SurveyQuestion } from '../types';
import { AlertTriangle, Activity, Loader2, Save, RefreshCw, ClipboardCheck, History, X } from 'lucide-react';
import { surveyService } from '../services/api';
import { normalizeCPF } from '../utils/cpf';

interface SocialQuestionnaireProps {
  user: User;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const SocialQuestionnaire = ({ user, onSave, onCancel }: SocialQuestionnaireProps) => {
  const [formData, setFormData] = useState({} as Record<string, any>);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [availableSurveys, setAvailableSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historicalResponses, setHistoricalResponses] = useState<any[]>([]);

  const initDossier = async () => {
    setLoading(true);
    setError(null);
    try {
      const surveysRes = await surveyService.getAll();
      const allSurveys = surveysRes.data?.data || surveysRes.data || [];
      setAvailableSurveys(Array.isArray(allSurveys) ? allSurveys : []);

      const cleanCPF = normalizeCPF(user.cpf_cnpj);
      const responsesRes = await surveyService.getResponsesByCpf(cleanCPF);
      const responses = responsesRes.data?.data || responsesRes.data || [];
      setHistoricalResponses(Array.isArray(responses) ? responses : []);

      let targetSurvey: Survey | null = null;
      let initialAnswers = {};

      if (responses.length > 0) {
          const lastResponse = responses[0];
          targetSurvey = allSurveys.find((s: Survey) => s.id === lastResponse.survey_id) || null;
          initialAnswers = typeof lastResponse.answers === 'string' ? JSON.parse(lastResponse.answers) : lastResponse.answers;
          if (initialAnswers && (initialAnswers as any).social) {
              initialAnswers = (initialAnswers as any).social;
          }
      }

      if (!targetSurvey) {
          targetSurvey = allSurveys.find((s: Survey) => s.type === 'CENSUS' && s.status === 'ACTIVE') || allSurveys[0] || null;
          initialAnswers = typeof user.socialData === 'string' ? JSON.parse(user.socialData) : (user.socialData || {});
      }

      setSurvey(targetSurvey);
      setFormData(initialAnswers || {});

    } catch (e) {
      console.error("[SRE] Falha crítica na sincronização do Dossiê.");
      setError("O Kernel não conseguiu mapear o histórico social deste CPF.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { initDossier(); }, [user.id]);

  const handleChange = (questionId: string | number, value: any) => {
    setFormData((prev: any) => ({ ...prev, [questionId]: value }));
  };

  const calculateRisk = () => {
      const questions = survey?.questions;
      if (!questions || !Array.isArray(questions) || questions.length === 0) return 0;
      let risk = 0;
      questions.forEach(q => {
          const val = formData[q.id];
          if (!val) return;
          if (q.mapping_tag === 'INCOME' && String(val).toLowerCase().includes('baixa')) risk += 40;
          if (q.mapping_tag === 'VULNERABILITY' && (val === 'SIM' || val === true || val === 'S')) risk += 30;
          if (q.mapping_tag === 'HOUSEHOLD' && Number(val) > 5) risk += 10;
      });
      return Math.min(risk, 100);
  };

  if (loading) return (
    <div className="h-full w-full flex flex-col items-center justify-center py-20">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Importando Histórico Neural...</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          <div className="md:col-span-2 bg-slate-900 p-6 rounded-[2rem] border border-white/5 flex flex-col justify-center text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><ClipboardCheck size={60} /></div>
            <h3 className="font-black text-lg tracking-tight mb-1 uppercase">Dossiê Socioeconômico</h3>
            <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest truncate">
                {survey ? `VINCULADO: ${survey.title}` : 'STATUS: AGUARDANDO RESPOSTA'}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Histórico</p>
              <div className="flex items-center gap-2">
                  <History size={16} className="text-indigo-500" />
                  <h4 className="text-2xl font-black text-slate-800">{historicalResponses.length}</h4>
              </div>
          </div>

          <div className={`p-6 rounded-[2rem] border flex flex-col items-center justify-center text-center transition-all ${calculateRisk() > 60 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'} shadow-sm`}>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Risco Social</p>
              <div className="flex items-center gap-2">
                  <Activity size={20} className={calculateRisk() > 60 ? 'text-rose-500' : 'text-emerald-500'} />
                  <h4 className={`text-2xl font-black ${calculateRisk() > 60 ? 'text-rose-600' : 'text-emerald-600'}`}>{calculateRisk()}%</h4>
              </div>
          </div>
      </div>

      <div className="flex-1 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {error || !survey || !Array.isArray(survey.questions) || survey.questions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="p-6 bg-rose-50 rounded-full mb-6 border border-rose-100"><AlertTriangle className="text-rose-500" size={48}/></div>
                  <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Nenhum Registro Ativo</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-4 max-w-xs leading-relaxed">
                      Este CPF ainda não possui participações registradas em Censos Ativos.
                  </p>
                  <button onClick={initDossier} className="mt-8 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <RefreshCw size={14} /> Re-Sincronizar
                  </button>
              </div>
          ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 pb-10">
                      {survey.questions.map((q, idx) => (
                          <div key={q.id} className="space-y-2 group">
                              <label className="flex items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-hover:text-indigo-600">
                                  <span className="w-5 h-5 bg-slate-100 rounded-md flex items-center justify-center text-[8px] text-slate-500">{idx + 1}</span>
                                  {q.text}
                              </label>

                              <div className="relative">
                                {q.type === 'select' ? (
                                    <select 
                                        value={formData[q.id] || ''} 
                                        onChange={e => handleChange(q.id, e.target.value)}
                                        className="w-full bg-slate-50 border-slate-100 focus:bg-white text-xs font-bold h-11 rounded-xl px-4"
                                    >
                                        <option value="">NÃO INFORMADO</option>
                                        {(q.options || []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                ) : q.type === 'boolean' ? (
                                    <div className="flex gap-2 h-11">
                                        {['SIM', 'NÃO'].map(val => (
                                            <button 
                                                key={val} 
                                                type="button"
                                                onClick={() => handleChange(q.id, val)}
                                                className={`flex-1 rounded-xl text-[9px] font-black border transition-all ${formData[q.id] === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <input 
                                        type={q.type} 
                                        value={formData[q.id] || ''} 
                                        onChange={e => handleChange(q.id, e.target.value)} 
                                        className="w-full bg-slate-50 border-slate-100 focus:bg-white text-xs font-bold h-11 rounded-xl px-4" 
                                    />
                                )}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>

      <div className="flex justify-end gap-4 shrink-0 pt-4">
        <button onClick={onCancel} className="px-6 py-3 text-slate-400 font-black text-[9px] uppercase tracking-widest">Fechar</button>
        <button 
          onClick={() => onSave(formData)} 
          disabled={!survey}
          className="flex items-center gap-3 px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-30"
        >
          <Save size={16}/> Comitar Alterações
        </button>
      </div>
    </div>
  );
};

export default SocialQuestionnaire;

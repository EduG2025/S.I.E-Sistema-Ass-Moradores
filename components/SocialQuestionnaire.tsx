
import React, { useEffect, useState } from 'react';
import { User, Survey, SurveyQuestion } from '../types';
import { AlertTriangle, Activity, Loader2, Save, RefreshCw, ClipboardCheck, History } from 'lucide-react';
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
      // 1. Carrega todos os esquemas de formulários (Censos, Pesquisas)
      const surveysRes = await surveyService.getAll();
      const allSurveys = surveysRes.data?.data || surveysRes.data || [];
      setAvailableSurveys(allSurveys);

      // 2. Busca respostas vinculadas ao CPF do usuário na tabela de auditoria
      const cleanCPF = normalizeCPF(user.cpf_cnpj);
      const responsesRes = await surveyService.getResponsesByCpf(cleanCPF);
      const responses = responsesRes.data?.data || responsesRes.data || [];
      setHistoricalResponses(responses);

      // 3. Define qual censo exibir (Prioridade: O mais recente respondido, senão o primeiro ativo)
      let targetSurvey: Survey | null = null;
      let initialAnswers = {};

      if (responses.length > 0) {
          const lastResponse = responses[0]; // Ordenado por ID DESC no backend
          targetSurvey = allSurveys.find((s: Survey) => s.id === lastResponse.survey_id) || null;
          initialAnswers = typeof lastResponse.answers === 'string' ? JSON.parse(lastResponse.answers) : lastResponse.answers;
          
          // Se a resposta for o objeto de auditoria do PublicSenso, extrai a parte social
          if (initialAnswers && (initialAnswers as any).social) {
              initialAnswers = (initialAnswers as any).social;
          }
      }

      if (!targetSurvey) {
          targetSurvey = allSurveys.find((s: Survey) => s.type === 'CENSUS' && s.status === 'ACTIVE') || allSurveys[0];
          // Fallback para o dado legado no objeto User
          initialAnswers = typeof user.socialData === 'string' ? JSON.parse(user.socialData) : (user.socialData || {});
      }

      setSurvey(targetSurvey);
      setFormData(initialAnswers);

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
      const questions = survey?.questions || [];
      if (questions.length === 0) return 0;
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
    <div className="py-20 text-center">
      <Loader2 className="animate-spin text-indigo-600 mx-auto" size={40}/>
      <p className="text-[10px] font-black text-slate-400 uppercase mt-4 tracking-widest">Importando Histórico Neural...</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-8">
      {/* Indicadores de Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 bg-slate-900 p-8 rounded-[2rem] border border-white/5 flex flex-col justify-center text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><ClipboardCheck size={60} /></div>
            <h3 className="font-black text-xl tracking-tight mb-1 uppercase">Dossiê Socioeconômico</h3>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                {survey ? `VINCULADO: ${survey.title}` : 'STATUS: AGUARDANDO RESPOSTA'}
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Respostas Identificadas</p>
              <div className="flex items-center gap-3">
                  <History size={20} className="text-indigo-500" />
                  <h4 className="text-3xl font-black text-slate-800">{historicalResponses.length}</h4>
              </div>
          </div>

          <div className={`p-8 rounded-[2rem] border flex flex-col items-center justify-center text-center transition-all ${calculateRisk() > 60 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'} shadow-sm`}>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Score de Vulnerabilidade</p>
              <div className="flex items-center gap-3">
                  <Activity size={24} className={calculateRisk() > 60 ? 'text-rose-500' : 'text-emerald-500'} />
                  <h4 className={`text-4xl font-black ${calculateRisk() > 60 ? 'text-rose-600' : 'text-emerald-600'}`}>{calculateRisk()}%</h4>
              </div>
          </div>
      </div>

      {/* Switcher de Formulários se houver múltiplos */}
      {availableSurveys.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {availableSurveys.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setSurvey(s)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${survey?.id === s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'}`}
                  >
                      {s.title}
                  </button>
              ))}
          </div>
      )}

      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
          {error || !survey || !survey.questions || survey.questions.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center">
                  <div className="p-6 bg-rose-50 rounded-full mb-6 border border-rose-100"><AlertTriangle className="text-rose-500" size={48}/></div>
                  <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Nenhum Registro Ativo</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-4 max-w-xs leading-relaxed">
                      Este CPF ainda não possui participações registradas em Censos ou Pesquisas Ativas.
                  </p>
                  <button onClick={initDossier} className="mt-8 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <RefreshCw size={14} /> Atualizar Hub
                  </button>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  {survey.questions.map((q, idx) => (
                      <div key={q.id} className="space-y-3 group">
                          <label className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-hover:text-indigo-600">
                              <span className="w-5 h-5 bg-slate-100 rounded-md flex items-center justify-center text-[8px] text-slate-500">{idx + 1}</span>
                              {q.text}
                          </label>

                          <div className="relative">
                            {q.type === 'select' ? (
                                <select 
                                    value={formData[q.id] || ''} 
                                    onChange={e => handleChange(q.id, e.target.value)}
                                    className="w-full bg-slate-50 border-slate-100 focus:bg-white text-sm font-bold h-12 rounded-2xl"
                                >
                                    <option value="">NÃO INFORMADO</option>
                                    {(q.options || []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            ) : q.type === 'boolean' ? (
                                <div className="flex gap-2 h-12">
                                    {['SIM', 'NÃO'].map(val => (
                                        <button 
                                            key={val} 
                                            type="button"
                                            onClick={() => handleChange(q.id, val)}
                                            className={`flex-1 rounded-2xl text-[10px] font-black border transition-all ${formData[q.id] === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            ) : q.type === 'textarea' ? (
                                <textarea 
                                    rows={2} 
                                    value={formData[q.id] || ''} 
                                    onChange={e => handleChange(q.id, e.target.value)} 
                                    className="w-full bg-slate-50 border-slate-100 focus:bg-white text-sm font-bold rounded-2xl p-4" 
                                />
                            ) : (
                                <input 
                                    type={q.type} 
                                    value={formData[q.id] || ''} 
                                    onChange={e => handleChange(q.id, e.target.value)} 
                                    className="w-full bg-slate-50 border-slate-100 focus:bg-white text-sm font-bold h-12 rounded-2xl px-4" 
                                />
                            )}
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      <div className="flex justify-end gap-4 pt-8 border-t border-slate-200/60">
        <button onClick={onCancel} className="px-8 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Fechar Ficha</button>
        <button 
          onClick={() => onSave(formData)} 
          disabled={!survey}
          className="flex items-center gap-3 px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-30"
        >
          <Save size={18}/> Salvar & Sincronizar Cache
        </button>
      </div>
    </div>
  );
};

export default SocialQuestionnaire;

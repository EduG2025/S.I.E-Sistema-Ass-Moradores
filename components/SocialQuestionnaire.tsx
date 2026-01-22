import React, { useEffect, useState } from 'react';
import { User, Survey, SurveyQuestion } from '../types';
import { AlertTriangle, Activity, Loader2, Save, RefreshCw, ClipboardCheck, History, X, ChevronRight, FileText, Sparkles, Brain } from 'lucide-react';
import { surveyService } from '../services/api';
import { normalizeCPF } from '../utils/cpf';

interface SocialQuestionnaireProps {
  user: User;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const SocialQuestionnaire = ({ user, onSave, onCancel }: SocialQuestionnaireProps) => {
  const [formData, setFormData] = useState({} as Record<string, any>);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [historicalResponses, setHistoricalResponses] = useState<any[]>([]);
  const [selectedResponseIndex, setSelectedResponseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initDossier = async () => {
    setLoading(true);
    setError(null);
    try {
      const cleanCPF = normalizeCPF(user.cpf_cnpj);
      
      // 1. Carregar todos os censos disponíveis para mapeamento de estrutura
      const surveysRes = await surveyService.getAll();
      const allSurveys = surveysRes.data?.data || surveysRes.data || [];
      
      // 2. Carregar histórico de respostas vinculadas ao CPF
      const responsesRes = await surveyService.getResponsesByCpf(cleanCPF);
      const responses = responsesRes.data?.data || responsesRes.data || [];
      
      const sortedResponses = Array.isArray(responses) 
        ? [...responses].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : [];

      setHistoricalResponses(sortedResponses);

      if (sortedResponses.length > 0) {
          // Selecionar a resposta mais recente como padrão
          const latest = sortedResponses[0];
          const surveyStructure = allSurveys.find((s: Survey) => s.id === latest.survey_id);
          
          setActiveSurvey(surveyStructure || allSurveys[0] || null);
          const parsedAnswers = typeof latest.answers === 'string' ? JSON.parse(latest.answers) : latest.answers;
          setFormData(parsedAnswers || {});
      } else {
          // Se não houver histórico, carrega o censo ativo atual para preenchimento manual
          const currentActive = allSurveys.find((s: Survey) => s.type === 'CENSUS' && s.status === 'ACTIVE') || allSurveys[0];
          setActiveSurvey(currentActive || null);
          setFormData(typeof user.socialData === 'string' ? JSON.parse(user.socialData) : (user.socialData || {}));
      }

    } catch (e) {
      console.error("[SRE] Falha crítica na sincronização do Dossiê.");
      setError("O Kernel não conseguiu mapear o histórico social deste CPF.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { initDossier(); }, [user.id, user.cpf_cnpj]);

  const handleSwitchResponse = (index: number) => {
    setSelectedResponseIndex(index);
    const resp = historicalResponses[index];
    const parsedAnswers = typeof resp.answers === 'string' ? JSON.parse(resp.answers) : resp.answers;
    setFormData(parsedAnswers || {});
  };

  const handleChange = (questionId: string | number, value: any) => {
    setFormData((prev: any) => ({ ...prev, [questionId]: value }));
  };

  const calculateRisk = () => {
      const questions = activeSurvey?.questions;
      if (!questions || !Array.isArray(questions) || questions.length === 0) return 0;
      let risk = 0;
      questions.forEach(q => {
          const val = formData[q.id];
          if (!val) return;
          const valStr = String(val).toUpperCase();
          if (q.mapping_tag === 'INCOME' && (valStr.includes('BAIXA') || valStr.includes('ATÉ 2'))) risk += 40;
          if (q.mapping_tag === 'VULNERABILITY' && (valStr === 'SIM' || val === true || valStr === 'S')) risk += 30;
          if (q.mapping_tag === 'HOUSEHOLD' && Number(val) > 5) risk += 10;
          if (q.mapping_tag === 'HEALTH' && valStr === 'SIM') risk += 20;
      });
      return Math.min(risk, 100);
  };

  if (loading) return (
    <div className="h-full w-full flex flex-col items-center justify-center py-20">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Consultando Ledger Social SRE...</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col lg:flex-row gap-8 animate-fade-in overflow-hidden min-h-[600px]">
      
      {/* SIDEBAR DE HISTÓRICO (LOOKUP LEDGER) */}
      <div className="w-full lg:w-[350px] flex flex-col gap-6 shrink-0">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-center text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Brain size={120} /></div>
            <div className="relative z-10">
                <h3 className="font-black text-xl tracking-tight mb-1 uppercase">Dossiê Social</h3>
                <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest">Lookup de Identidade Ativo</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
              <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2">
                  <History size={14} className="text-indigo-600"/> Histórico de Protocolos
              </h5>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                  {historicalResponses.length > 0 ? historicalResponses.map((resp, idx) => (
                      <button 
                        key={resp.id} 
                        onClick={() => handleSwitchResponse(idx)}
                        className={`w-full p-5 rounded-2xl border text-left transition-all group ${selectedResponseIndex === idx ? 'bg-indigo-600 border-indigo-600 shadow-lg scale-[1.02]' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}
                      >
                          <div className="flex justify-between items-start mb-2">
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${selectedResponseIndex === idx ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>Protocolo #{resp.id}</span>
                              <ChevronRight size={14} className={selectedResponseIndex === idx ? 'text-white' : 'text-slate-300'}/>
                          </div>
                          <p className={`text-xs font-black uppercase truncate ${selectedResponseIndex === idx ? 'text-white' : 'text-slate-800'}`}>Censo {new Date(resp.created_at).getFullYear()}</p>
                          <p className={`text-[9px] font-bold mt-1 ${selectedResponseIndex === idx ? 'text-indigo-200' : 'text-slate-400'}`}>{new Date(resp.created_at).toLocaleDateString('pt-BR')}</p>
                      </button>
                  )) : (
                      <div className="py-12 text-center">
                          <AlertTriangle size={32} className="mx-auto text-slate-200 mb-4 opacity-50"/>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Sem registros no Ledger</p>
                      </div>
                  )}
              </div>

              <div className={`mt-6 p-6 rounded-[2rem] border flex flex-col items-center justify-center text-center transition-all ${calculateRisk() > 60 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'} shadow-inner`}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Score de Risco Social</p>
                  <div className="flex items-center gap-2">
                      <Activity size={24} className={calculateRisk() > 60 ? 'text-rose-500' : 'text-emerald-500'} />
                      <h4 className={`text-3xl font-black ${calculateRisk() > 60 ? 'text-rose-600' : 'text-emerald-600'}`}>{calculateRisk()}%</h4>
                  </div>
              </div>
          </div>
      </div>

      {/* ÁREA DE RESPOSTAS DINÂMICAS */}
      <div className="flex-1 bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100 shrink-0">
              <div>
                  <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                      <ClipboardCheck size={24} className="text-indigo-600"/> 
                      {activeSurvey?.title || 'Protocolo de Coleta'}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Snapshot de dados extraídos via Sincronia Neural</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 shadow-sm">
                  <Sparkles size={14} className="animate-pulse"/>
                  <span className="text-[9px] font-black uppercase">Active IA Analysis</span>
              </div>
          </div>

          {error ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="p-8 bg-rose-50 rounded-full mb-6 border border-rose-100 shadow-inner"><AlertTriangle className="text-rose-500" size={48}/></div>
                  <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Inconsistência de Ledger</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-4 max-w-xs leading-relaxed italic">
                      O cluster não localizou as definições estruturais para este dossiê.
                  </p>
                  <button onClick={initDossier} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl active:scale-95">
                      <RefreshCw size={16} /> Tentar Reconexão
                  </button>
              </div>
          ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 pb-20">
                      {activeSurvey?.questions?.map((q, idx) => (
                          <div key={q.id} className="space-y-3 group border-l-2 border-slate-100 pl-6 hover:border-indigo-500 transition-all">
                              <label className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-hover:text-indigo-600">
                                  <span className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-[9px] text-slate-500 font-mono">{(idx + 1).toString().padStart(2, '0')}</span>
                                  {q.text}
                              </label>

                              <div className="relative">
                                {q.type === 'select' ? (
                                    <select 
                                        value={formData[q.id] || ''} 
                                        onChange={e => handleChange(q.id, e.target.value)}
                                        className="w-full bg-slate-50 border-slate-200 focus:bg-white text-xs font-black h-12 rounded-xl px-4 uppercase shadow-inner outline-none focus:border-indigo-500"
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
                                                className={`flex-1 rounded-xl text-[10px] font-black border-2 transition-all ${String(formData[q.id]).toUpperCase() === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-300 hover:bg-slate-50'}`}
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
                                        className="w-full bg-slate-50 border-slate-200 focus:bg-white text-xs font-black h-12 rounded-xl px-6 shadow-inner outline-none focus:border-indigo-500 uppercase" 
                                        placeholder="Valor Extraído..."
                                    />
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2 opacity-50">
                                  <span className="text-[8px] font-black text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">Tag: {q.mapping_tag || 'GENERAL'}</span>
                              </div>
                          </div>
                      ))}
                      {(!activeSurvey?.questions || activeSurvey.questions.length === 0) && (
                          <div className="col-span-full py-20 text-center">
                              <FileText size={48} className="mx-auto text-slate-100 mb-4"/>
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhum atributo mapeado neste snapshot.</p>
                          </div>
                      )}
                  </div>
              </div>
          )}

          <div className="mt-auto pt-8 border-t border-slate-100 flex justify-end gap-4 shrink-0">
            <button onClick={onCancel} className="px-10 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Abortar Snapshot</button>
            <button 
              onClick={() => onSave(formData)} 
              disabled={!activeSurvey}
              className="flex items-center gap-4 px-12 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-30"
            >
              <Save size={18}/> Commitar no Perfil
            </button>
          </div>
      </div>
    </div>
  );
};

export default SocialQuestionnaire;
import React, { useState, useEffect, useMemo } from 'react';
import { Survey, SurveyQuestion, SystemInfo } from '../types';
import { surveyService } from '../services/api';
import {
    Plus, X, Trash2, Edit2, Loader2, Save, Share2, Link, Eye, Brain, Database,
    Sparkles, ClipboardCheck, GraduationCap, HandHelping, ChevronRight, AlertCircle,
    Info, Search, Layout, Settings, ListPlus, GitBranch, Table, Activity, Zap,
    Gauge, Target, Users, Wand2, BarChart3, ShieldCheck, Thermometer, Fingerprint,
    Briefcase, Scale, Landmark, HardHat, HeartPulse, GraduationCap as School, Users2,
    ShieldAlert, TrendingUp, Lightbulb, GitMerge, ListTree, ArrowDownRight,
    // NOVOS ÍCONES PARA O CENSO 360
    MapPin, Bus, Leaf, ShoppingBag, Siren, Coins, LayoutDashboard, PieChart
} from 'lucide-react';

/**
 * 🧠 DOUTRINA TÉCNICA: SISTEMA DE ARQUITETURA MULTISSETORIAL
 * Versão: 13.0.0 - CENSUS 360º DATA-DRIVEN ENGINE
 */

const SYSTEM_TEXTS = {
    TITLE_MAIN: "Censo & Inteligência 360º",
    SUBTITLE_MAIN: "Full Urban Architecture • Protocolo SRE V13.0",
    TITLE_MODAL: "Arquiteto de Senso",
    SUBTITLE_MODAL: "Neural Branching Core • V2 UI",

    // Configuração Mestre
    MASTER_TITLE: 'Censo 360º Data-Driven 2026',
    MASTER_DESC: 'Mapeamento sistêmico integrado: Infraestrutura, Social, Mobilidade e Economia Local. Base para KPIs de Políticas Públicas.',

    // Botões
    BTN_INJECT_MASTER: "Injetar Censo 360º", // Atualizado
    BTN_NEW_PROTOCOL: "Novo Protocolo",
    BTN_IA_PREDICT: "IA Architect",
    BTN_COMMIT_PROTOCOL: "Commitar Protocolo",
    BTN_ABORT: "Abortar",
    BTN_SAVE_STRUCTURE: "Salvar Estrutura",
    BTN_ADD_ATTRIBUTE: "Adicionar Atributo ao Protocolo",
    BTN_GENERATE_CONFIRM: "Executar Geração Neural",

    // Lógica Condicional
    LBL_LOGIC_FLOW: "Regras de Exibição (Fluxo Lógico)",
    LBL_LOGIC_PARENT: "Mostrar apenas se a pergunta...",
    LBL_LOGIC_TRIGGER: "...tiver o valor:",
    LBL_LOGIC_NONE: "Sempre visível (Linear)",
    LBL_LOGIC_HINT: "A lógica condicional permite criar formulários inteligentes e dinâmicos.",

    // Mensagens Gerais
    PLACEHOLDER_SEARCH: "Filtrar protocolos setoriais...",
    LBL_RECORDS_MAPPED: "Protocolos Ativos",
    CONFIRM_DELETE: "Remover protocolo permanentemente?",
    LBL_NO_TITLE: "Sem Título",
    LBL_ATTRIBUTES: "Atributos",
    LBL_NO_PROTOCOLS: "Nenhum protocolo ativo no cluster.",
    LBL_FOOTER_STATUS: "SRE Core Sync Active • Neural Branching Enabled",

    // Alertas
    ALERT_NO_TITLE_IA: "Defina um título para iniciar a arquitetura neural.",
    ALERT_NO_TITLE_SAVE: "O título do protocolo é obrigatório.",
    ALERT_COMMIT_FAIL: "Erro ao comitar estrutura no banco de dados.",
    ALERT_IA_OFFLINE: "IA Orquestradora temporariamente offline.",
    ALERT_LINK_COPIED: "Link público copiado para a área de transferência.",

    // Form
    LBL_TITLE: "Título do Protocolo",
    PLACEHOLDER_TITLE: "Ex: Auditoria de Obras 2025 ou Censo de Saúde...",
    LBL_OBJECTIVE: "Pilar Estratégico (Core)",
    LBL_STATUS: "Status do Link",
    LBL_DESCRIPTION: "Descrição / Instruções Técnicas",
    PLACEHOLDER_DESCRIPTION: "Descreva a finalidade técnica e o alcance deste mapeamento...",

    // Pilares Setoriais
    TYPE_GENERAL: "Geral / Multidisciplinar",
    TYPE_ADMIN: "Administrativo / Gestão Pública",
    TYPE_LEGAL: "Jurídico / Compliance",
    TYPE_FINANCE: "Financeiro / Orçamentário",
    TYPE_TURISM: "Turismo / Eventos / Cultura",
    TYPE_WORKS: "Obras / Infraestrutura / Urbanismo",
    TYPE_HEALTH: "Saúde / Vigilância Epidemiológica",
    TYPE_EDUCATION: "Educação / Formação Acadêmica",
    TYPE_SOCIAL: "Social / Assistência / Vulnerabilidade",

    STATUS_ACTIVE: "Online / Recebendo Respostas",
    STATUS_INACTIVE: "Offline / Link Bloqueado",

    // Matriz de Atributos
    TITLE_ATTRIBUTES: "Matriz de Atributos",
    LBL_FIELDS_MAPPED: "Campos Mapeados",
    LBL_PROTOCOL_QUESTION: "Pergunta do Protocolo",
    LBL_RESPONSE_FORMAT: "Formato de Resposta",
    LBL_BI_MAPPING: "Eixo Temático (BI Tag)", // Atualizado

    RESP_TEXT: "Texto Livre",
    RESP_NUMBER: "Número / Quantidade",
    RESP_BOOLEAN: "Sim ou Não (Binário)",
    RESP_SELECT: "Seleção Única (Dropdown)",
    RESP_DATE: "Data (Digitação Manual)",
    RESP_REPEATER: "Repetidor (Add Dinâmico)",

    // Tags Originais
    TAG_IDENTITY: "Identidade / Demografia",
    TAG_EDUCATION: "Educação / Capital Humano",
    TAG_DIGITAL: "Acesso Digital / Conectividade",
    TAG_GOV_AID: "Social / Benefícios",
    TAG_HEALTH: "Saúde / Vulnerabilidade",
    TAG_FINANCE: "Financeiro (Legado)",
    TAG_WORK: "Trabalho (Legado)",

    // Novas Tags 360º (Refatoração Aditiva)
    TAG_INFRA: "Infraestrutura Urbana / Obras",
    TAG_SECURITY: "Segurança Pública / Defesa",
    TAG_ECONOMY: "Economia / Emprego / Renda",
    TAG_ENV: "Meio Ambiente / Sustentabilidade",
    TAG_MOBILITY: "Mobilidade / Transporte",
    TAG_CONSUMPTION: "Consumo / Comércio Local",
    TAG_LEISURE: "Esporte / Lazer / Cultura",

    LBL_SELECT_OPTIONS: "Opções de Seleção (Separadas por Vírgula)",
    PLACEHOLDER_SELECT: "Opção 1, Opção 2, Opção 3...",
    DEFAULT_NEW_ATTRIBUTE: "Novo Atributo",

    IA_SECTION_TITLE: "Orquestrador Neural",
    IA_WIZARD_AUDIENCE: "Público Alvo / Setor Responsável",
    IA_WIZARD_DEPTH: "Profundidade do Diagnóstico",
    IA_WIZARD_STRATEGY: "Objetivo Estratégico da IA",

    AUDIT_TITLE: "Auditoria Heurística",
    AUDIT_SCORE: "Score de Qualidade",
    AUDIT_LOAD: "Carga Cognitiva Estimada",
    AUDIT_COVERAGE: "Cobertura de BI",

    METRIC_LOW: "Baixa (Otimizado)",
    METRIC_MED: "Média (Atenção)",
    METRIC_HIGH: "Alta (Crítico)",

    TIP_ADD_SELECT: "Dica: Use mais 'Seleção' para acelerar a coleta.",
    TIP_ADD_TAGS: "Alerta: Baixa cobertura de dados setoriais.",
    TIP_BALANCED: "Protocolo 360º Balanceado",

    // Aditivos V12.1
    LBL_INDEX_BI: "Indexar KPI no Dashboard",
    LBL_SLUG_HELPER: "ID Técnico para Filtro",
    TIP_INDEX_SUCCESS: "Este indicador gerará gráficos automáticos."
};

interface SurveysProps {
    systemInfo: SystemInfo;
}

interface IAConfig {
    targetAudience: 'GENERAL' | 'ADMIN' | 'LEGAL' | 'FINANCE' | 'TURISM' | 'WORKS' | 'HEALTH' | 'EDUCATION' | 'SOCIAL';
    depth: 'TRIAGE' | 'STANDARD' | 'DIAGNOSTIC';
    strategy: 'COMPLIANCE' | 'EFFICIENCY' | 'INSIGHT';
}

// --- TEMPLATE ESTRUTURAL DO CENSO 360º (DATA-DRIVEN) ---
// Adicionado para suportar a geração automática completa com lógica condicional
const CENSUS_360_DEF = [
    // 1. Identificação e Demografia (Base)
    { text: 'Quantas pessoas residem neste domicílio?', type: 'number', tag: 'IDENTITY', slug: 'kpi_densidade_domiciliar' },
    { text: 'Qual o tempo de residência no bairro?', type: 'select', options: ['Menos de 1 ano', '1 a 5 anos', '5 a 10 anos', 'Mais de 10 anos'], tag: 'IDENTITY', slug: 'kpi_raizes_locais' },

    // 2. Saúde
    { text: 'Como avalia o atendimento no posto de saúde local?', type: 'select', options: ['Excelente', 'Bom', 'Regular', 'Ruim', 'Não Utilizo'], tag: 'HEALTH', slug: 'kpi_satisfacao_saude' },
    { text: 'Há moradores com doenças crônicas ou deficiência?', type: 'boolean', tag: 'HEALTH', slug: 'kpi_vulnerabilidade_saude' },
    // Lógica Condicional: Só pergunta qual a doença se a resposta anterior for Sim (true)
    { text: 'Qual a maior dificuldade de saúde hoje?', type: 'select', options: ['Marcar Consulta', 'Falta de Remédios', 'Falta de Especialistas', 'Transporte/Acesso', 'Nenhuma'], tag: 'HEALTH', logic_parent_slug: 'kpi_vulnerabilidade_saude', logic_trigger: 'true', slug: 'kpi_gargalo_saude' },

    // 3. Educação
    { text: 'Crianças/Jovens em idade escolar frequentam a escola?', type: 'select', options: ['Sim, todos', 'Alguns não', 'Não há crianças', 'Não'], tag: 'EDUCATION', slug: 'kpi_evasao_escolar' },
    // Lógica Condicional: Só pergunta motivo se houver evasão
    { text: 'Qual o principal motivo da não frequência?', type: 'select', options: ['Falta de Vagas', 'Distância/Transporte', 'Trabalho Infantil', 'Desinteresse'], tag: 'EDUCATION', logic_parent_slug: 'kpi_evasao_escolar', logic_trigger: 'Alguns não', slug: 'kpi_motivo_evasao' },

    // 4. Infraestrutura Urbana (Novo Eixo)
    { text: 'Qual a situação da pavimentação na sua rua?', type: 'select', options: ['Asfalto Bom', 'Asfalto Precário/Buracos', 'Paralelepípedo', 'Terra/Sem Pavimento'], tag: 'INFRASTRUCTURE', slug: 'kpi_pavimentacao' },
    { text: 'Como você avalia a iluminação pública na sua rua?', type: 'select', options: ['Ótima (Clara)', 'Regular', 'Ruim (Escura)', 'Inexistente'], tag: 'INFRASTRUCTURE', slug: 'kpi_iluminacao' },
    { text: 'Existe rede de esgoto conectada no domicílio?', type: 'select', options: ['Sim, Rede Pública', 'Fossa Séptica', 'Céu Aberto/Vala'], tag: 'INFRASTRUCTURE', slug: 'kpi_saneamento' },
    { text: 'A rua sofre com alagamentos em dias de chuva?', type: 'select', options: ['Nunca', 'Raramente', 'Frequentemente', 'Sempre'], tag: 'INFRASTRUCTURE', slug: 'kpi_drenagem_risco' },

    // 5. Segurança Pública (Novo Eixo)
    { text: 'Qual sua sensação de segurança no bairro à noite?', type: 'select', options: ['Seguro', 'Pouco Seguro', 'Inseguro', 'Pânico/Muito Inseguro'], tag: 'SECURITY', slug: 'kpi_sensacao_seguranca' },
    { text: 'Já foi vítima de algum delito no bairro nos últimos 12 meses?', type: 'boolean', tag: 'SECURITY', slug: 'kpi_vitimizacao' },

    // 6. Empregabilidade e Renda (Novo Eixo)
    { text: 'Qual a faixa de renda familiar total (Salários Mínimos)?', type: 'select', options: ['Até 1 SM', '1 a 3 SM', '3 a 5 SM', 'Acima de 5 SM'], tag: 'ECONOMY', slug: 'kpi_renda_media' },
    { text: 'Quantas pessoas da casa estão desempregadas buscando trabalho?', type: 'number', tag: 'ECONOMY', slug: 'kpi_taxa_desemprego' },
    // Banco de Talentos
    { text: 'Possui alguma habilidade técnica ou manual para trabalho?', type: 'select', options: ['Não', 'Culinária', 'Construção Civil', 'Costura/Artesanato', 'Beleza/Estética', 'Mecânica', 'Informática/Tech'], tag: 'ECONOMY', slug: 'kpi_banco_talentos' },

    // 7. Meio Ambiente (Novo Eixo)
    { text: 'Como é feito o descarte do lixo doméstico?', type: 'select', options: ['Coleta Pública (Caminhão)', 'Queimado', 'Enterrado', 'Jogado em Terreno Baldio'], tag: 'ENVIRONMENT', slug: 'kpi_coleta_lixo' },
    { text: 'Você separa materiais para reciclagem?', type: 'boolean', tag: 'ENVIRONMENT', slug: 'kpi_reciclagem' },

    // 8. Mobilidade Urbana (Novo Eixo)
    { text: 'Qual o principal meio de transporte para trabalho/estudo?', type: 'select', options: ['Ônibus', 'Carro Próprio', 'Moto', 'Bicicleta', 'A pé', 'Trem/Metrô'], tag: 'MOBILITY', slug: 'kpi_modal_transporte' },
    { text: 'Quanto tempo você gasta no deslocamento diário (ida)?', type: 'select', options: ['Até 15 min', '15 a 30 min', '30 a 60 min', 'Mais de 1 hora'], tag: 'MOBILITY', slug: 'kpi_tempo_deslocamento' },

    // 9. Perfil de Consumo (Novo Eixo)
    { text: 'Onde você costuma fazer as compras de supermercado?', type: 'select', options: ['No Próprio Bairro', 'Em Bairros Vizinhos', 'No Centro da Cidade', 'Atacarejo Distante'], tag: 'CONSUMPTION', slug: 'kpi_local_compras' },
    { text: 'Qual serviço faz mais falta no bairro hoje?', type: 'select', options: ['Farmácia', 'Padaria', 'Banco/Lotérica', 'Oficina', 'Academia', 'Nenhum'], tag: 'CONSUMPTION', slug: 'kpi_demanda_comercio' },

    // 10. Esporte e Lazer
    { text: 'Com que frequência pratica atividades físicas?', type: 'select', options: ['Diariamente', 'Semanalmente', 'Raramente', 'Nunca'], tag: 'LEISURE', slug: 'kpi_atividade_fisica' }
];

const Surveys = ({ systemInfo }: SurveysProps) => {
    // Estados Operacionais
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingIA, setIsGeneratingIA] = useState(false);
    const [editingSurvey, setEditingSurvey] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Estados IA Wizard
    const [showIAWizard, setShowIAWizard] = useState(false);
    const [iaConfig, setIaConfig] = useState<IAConfig>({
        targetAudience: 'GENERAL',
        depth: 'STANDARD',
        strategy: 'EFFICIENCY'
    });
    const [showAuditPanel, setShowAuditPanel] = useState(true);

    useEffect(() => { loadSurveys(); }, []);

    // --- LÓGICA DE AUDITORIA HEURÍSTICA (Atualizada para novos eixos) ---
    const auditMetrics = useMemo(() => {
        const defaultMetrics = { score: 0, load: 0, coverage: 0, missingTags: [], loadLabel: 'N/A', loadColor: 'text-slate-400', count: 0 };
        if (!editingSurvey?.questions) return defaultMetrics;
        const qs = editingSurvey.questions;
        const count = qs.length;
        if (count === 0) return defaultMetrics;

        let cognitiveLoadPoints = 0;
        qs.forEach((q: SurveyQuestion) => {
            if (q.type === 'text') cognitiveLoadPoints += 3;
            else if (q.type === 'repeater') cognitiveLoadPoints += 4;
            else if (q.type === 'date') cognitiveLoadPoints += 2;
            else cognitiveLoadPoints += 1;
        });

        const loadScore = Math.round((cognitiveLoadPoints / count) * 10);
        let loadLabel = SYSTEM_TEXTS.METRIC_LOW;
        let loadColor = 'text-emerald-500';
        if (loadScore > 15) { loadLabel = SYSTEM_TEXTS.METRIC_MED; loadColor = 'text-amber-500'; }
        if (loadScore > 25) { loadLabel = SYSTEM_TEXTS.METRIC_HIGH; loadColor = 'text-rose-500'; }

        // Atualizado para considerar os 10 eixos do Censo 360
        const uniqueTags = new Set(qs.map((q: SurveyQuestion) => q.mapping_tag));
        const totalTags = 10;
        const coveragePct = Math.round((uniqueTags.size / totalTags) * 100);
        const qualityScore = Math.min(100, Math.round((coveragePct * 0.7) + ((100 - (loadScore * 2)) * 0.3)));

        return { score: qualityScore, load: cognitiveLoadPoints, coverage: coveragePct, loadLabel, loadColor, count };
    }, [editingSurvey?.questions]);

    const loadSurveys = async () => {
        setIsLoading(true);
        try {
            const res = await surveyService.getAll();
            setSurveys(res.data?.data || []);
        } catch (err) { setSurveys([]); }
        finally { setIsLoading(false); }
    };

    // --- NOVA LÓGICA DE INJEÇÃO DO CENSO 360º (Refatorado handleInjectMaster) ---
    const handleInjectCensus360 = () => {
        const timestamp = Date.now();

        // Passo 1: Mapeia o template estático para o formato dinâmico do formulário
        const generatedQuestions = CENSUS_360_DEF.map((def, index) => {
            const qId = `q360_${timestamp}_${index}`;

            return {
                id: qId,
                text: def.text,
                type: def.type,
                options: (def as any).options || [],
                required: 1,
                mapping_tag: def.tag,
                filterable: true, // Auto-indexação para Dashboards
                slug: def.slug,
                // Placeholder para lógica (será preenchido no passo 2)
                logic_parent_id: '',
                logic_trigger_value: (def as any).logic_trigger || ''
            };
        });

        // Passo 2: Pós-processamento para conectar a lógica condicional (Linkagem Neural)
        // Isso permite que perguntas definidas estaticamente encontrem o ID dinâmico de seus "pais"
        generatedQuestions.forEach(q => {
            const def = CENSUS_360_DEF.find(d => d.slug === q.slug);
            if (def && (def as any).logic_parent_slug) {
                const parent = generatedQuestions.find(p => p.slug === (def as any).logic_parent_slug);
                if (parent) {
                    q.logic_parent_id = parent.id;
                }
            }
        });

        setEditingSurvey({
            title: SYSTEM_TEXTS.MASTER_TITLE,
            description: SYSTEM_TEXTS.MASTER_DESC,
            type: 'GENERAL', // Tipo Multissetorial
            status: 'ACTIVE',
            questions: generatedQuestions
        });
        setIsModalOpen(true);
    };

    const handleCopyLink = (id: string | number) => {
        const url = `${window.location.origin}/census/${id}`;
        navigator.clipboard.writeText(url);
        alert(`✅ ${SYSTEM_TEXTS.ALERT_LINK_COPIED}`);
    };

    const handleSuggestIA = async () => {
        if (!editingSurvey?.title) return alert(SYSTEM_TEXTS.ALERT_NO_TITLE_IA);
        setIsGeneratingIA(true);
        setShowIAWizard(false);

        try {
            const res = await surveyService.suggestQuestions({
                title: editingSurvey.title,
                description: editingSurvey.description,
                type: editingSurvey.type,
                config: iaConfig
            });
            const suggested = res.data.data.map((q: any) => ({
                id: `ia_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                ...q,
                required: 1,
                logic_parent_id: '',
                logic_trigger_value: '',
                filterable: false,
                slug: (q.text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '_')
            }));
            setEditingSurvey({ ...editingSurvey, questions: [...(editingSurvey.questions || []), ...suggested] });
        } catch (e) { alert(SYSTEM_TEXTS.ALERT_IA_OFFLINE); }
        finally { setIsGeneratingIA(false); }
    };

    const handleSave = async () => {
        if (!editingSurvey?.title) return alert(SYSTEM_TEXTS.ALERT_NO_TITLE_SAVE);
        setIsSaving(true);
        try {
            const payload = { ...editingSurvey };
            if (payload.id && !String(payload.id).startsWith('temp_')) {
                await surveyService.update(payload.id, payload);
            } else {
                delete payload.id;
                await surveyService.create(payload);
            }
            setIsModalOpen(false);
            loadSurveys();
        } catch (err: any) { alert(SYSTEM_TEXTS.ALERT_COMMIT_FAIL); }
        finally { setIsSaving(false); }
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const qs = [...(editingSurvey?.questions || [])];
        if (qs[index]) {
            qs[index] = { ...qs[index], [field]: value };

            // --- INÍCIO DA LÓGICA ADITIVA DE INDEXAÇÃO ---
            // Se o campo alterado for o texto da pergunta, gera o slug de busca automaticamente
            if (field === 'text') {
                const generatedSlug = value
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
                    .replace(/[^a-z0-9]/g, '_')     // Troca espaços e símbolos por _
                    .replace(/_+/g, '_')            // Remove duplicatas de _
                    .substring(0, 40);              // Limita o tamanho

                qs[index].slug = generatedSlug;
            }
            // --- FIM DA LÓGICA ADITIVA ---

            setEditingSurvey({ ...editingSurvey, questions: qs });
        }
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in h-full relative font-sans">
            {/* Header do Módulo */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl shrink-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-2xl" style={{ backgroundColor: primaryColor }}><LayoutDashboard size={28} /></div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">{SYSTEM_TEXTS.TITLE_MAIN}</h2>
                        <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mt-2 opacity-80">{SYSTEM_TEXTS.SUBTITLE_MAIN}</p>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    {/* Botão de Injeção Censo 360 Atualizado */}
                    <button onClick={handleInjectCensus360} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg shadow-emerald-500/20 active:scale-95 border border-emerald-400/50">
                        <PieChart size={20} /> {SYSTEM_TEXTS.BTN_INJECT_MASTER}
                    </button>
                    <button onClick={() => { setEditingSurvey({ title: '', description: '', type: 'GENERAL', questions: [], status: 'ACTIVE' }); setIsModalOpen(true); }} className="px-10 py-4 bg-white text-slate-950 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all active:scale-95 flex items-center gap-3">
                        <Plus size={22} /> {SYSTEM_TEXTS.BTN_NEW_PROTOCOL}
                    </button>
                </div>
            </div>

            {/* Listagem de Formulários */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-12">
                <div className="p-8 bg-white rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col min-h-full">
                    <div className="flex justify-between items-center mb-10 pb-8 border-b border-slate-100">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <input type="text" placeholder={SYSTEM_TEXTS.PLACEHOLDER_SEARCH} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 h-14 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none focus:bg-white focus:border-indigo-500 transition-all" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-100">{surveys.length} {SYSTEM_TEXTS.LBL_RECORDS_MAPPED}</span>
                    </div>

                    {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={48} /></div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {surveys.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                                <div key={s.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 hover:border-indigo-200 hover:shadow-2xl transition-all group flex flex-col min-h-[340px] relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-2 h-full ${s.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-slate-300'}`}></div>
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shadow-inner"><ClipboardCheck size={24} /></div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                            <button onClick={() => handleCopyLink(s.id)} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm" title="Link Público"><Link size={18} /></button>
                                            <button onClick={() => { setEditingSurvey(s); setIsModalOpen(true); }} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-amber-600 rounded-xl shadow-sm"><Edit2 size={18} /></button>
                                            <button onClick={() => { if (confirm(SYSTEM_TEXTS.CONFIRM_DELETE)) surveyService.delete(s.id).then(loadSurveys); }} className="p-3 bg-white border border-slate-100 text-slate-300 hover:text-rose-600 rounded-xl shadow-sm"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-4 leading-tight flex-1 line-clamp-2">{s.title || SYSTEM_TEXTS.LBL_NO_TITLE}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-8 line-clamp-3 leading-relaxed italic">{s.description}</p>

                                    <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>{s.status}</span>
                                        <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest"><Table size={14} /> {s.questions?.length || 0} {SYSTEM_TEXTS.LBL_ATTRIBUTES}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: ARQUITETO DE SENSO */}
            {isModalOpen && editingSurvey && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container bg-[#fdfdfe] flex flex-col h-full w-full">

                        <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 shadow-2xl relative z-20">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><Brain size={28} /></div>
                                <div>
                                    <h3 className="font-black text-2xl uppercase tracking-tighter leading-none">{SYSTEM_TEXTS.TITLE_MODAL}</h3>
                                    <p className="text-indigo-400 text-[10px] font-black uppercase mt-2 tracking-widest opacity-80">{SYSTEM_TEXTS.SUBTITLE_MODAL}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setShowAuditPanel(!showAuditPanel)} className={`p-3 rounded-xl transition-all border border-white/10 ${showAuditPanel ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'}`}>
                                    <Activity size={18} />
                                </button>
                                <button onClick={() => setShowIAWizard(!showIAWizard)} disabled={isGeneratingIA} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-indigo-300 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 border border-white/10 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    {isGeneratingIA ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} className="text-amber-400" />} {SYSTEM_TEXTS.BTN_IA_PREDICT}
                                </button>
                                <button onClick={handleSave} disabled={isSaving} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all" style={{ backgroundColor: primaryColor }}>
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} {SYSTEM_TEXTS.BTN_COMMIT_PROTOCOL}
                                </button>
                                <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-rose-500 hover:text-white text-slate-400 rounded-2xl transition-all border border-white/5 ml-4"><X size={32} /></button>
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden relative">
                            <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar bg-slate-50/50">
                                <div className="w-full max-w-none space-y-12 pb-20">

                                    {/* ORQUESTRADOR NEURAL (WIZARD) */}
                                    {showIAWizard && (
                                        <div className="bg-slate-900 text-white p-10 rounded-[3rem] border border-indigo-500/30 shadow-2xl relative overflow-hidden animate-slide-down">
                                            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
                                            <div className="flex justify-between items-start mb-8 relative z-10">
                                                <div>
                                                    <h4 className="text-xl font-black uppercase flex items-center gap-3 text-emerald-400"><Sparkles size={20} /> {SYSTEM_TEXTS.IA_SECTION_TITLE}</h4>
                                                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-2 ml-8">Configure os parâmetros neurais para geração assistida multissetorial.</p>
                                                </div>
                                                <button onClick={() => setShowIAWizard(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                                <div className="space-y-3 bg-white/5 p-6 rounded-3xl border border-white/5">
                                                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2"><Briefcase size={14} /> {SYSTEM_TEXTS.IA_WIZARD_AUDIENCE}</label>
                                                    <select className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-bold uppercase rounded-xl p-3 outline-none focus:border-indigo-500" value={iaConfig.targetAudience} onChange={(e: any) => setIaConfig({ ...iaConfig, targetAudience: e.target.value })}>
                                                        <option value="GENERAL">Geral</option>
                                                        <option value="ADMIN">Administrativo</option>
                                                        <option value="LEGAL">Jurídico</option>
                                                        <option value="FINANCE">Financeiro</option>
                                                        <option value="TURISM">Turismo</option>
                                                        <option value="WORKS">Obras</option>
                                                        <option value="HEALTH">Saúde</option>
                                                        <option value="EDUCATION">Educação</option>
                                                        <option value="SOCIAL">Social</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-3 bg-white/5 p-6 rounded-3xl border border-white/5">
                                                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2"><Target size={14} /> {SYSTEM_TEXTS.IA_WIZARD_DEPTH}</label>
                                                    <select className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-bold uppercase rounded-xl p-3 outline-none focus:border-indigo-500" value={iaConfig.depth} onChange={(e: any) => setIaConfig({ ...iaConfig, depth: e.target.value })}>
                                                        <option value="TRIAGE">Triagem / Check-list</option>
                                                        <option value="STANDARD">Padrão SRE</option>
                                                        <option value="DIAGNOSTIC">Diagnóstico / Auditoria</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-3 bg-white/5 p-6 rounded-3xl border border-white/5">
                                                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2"><Fingerprint size={14} /> {SYSTEM_TEXTS.IA_WIZARD_STRATEGY}</label>
                                                    <select className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-bold uppercase rounded-xl p-3 outline-none focus:border-indigo-500" value={iaConfig.strategy} onChange={(e: any) => setIaConfig({ ...iaConfig, strategy: e.target.value })}>
                                                        <option value="EFFICIENCY">Eficiência / UX Ágil</option>
                                                        <option value="COMPLIANCE">Conformidade / Jurídico</option>
                                                        <option value="INSIGHT">Insights / Decisão</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="mt-8 flex justify-end relative z-10">
                                                <button onClick={handleSuggestIA} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-3">
                                                    <Sparkles size={16} /> {SYSTEM_TEXTS.BTN_GENERATE_CONFIRM}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Definição de Pilar (Core) */}
                                    <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-10 hover:shadow-lg transition-shadow w-full">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">{SYSTEM_TEXTS.LBL_TITLE}</label>
                                            <input className="w-full font-black h-20 bg-slate-50 border border-slate-100 rounded-[2rem] px-8 text-3xl focus:bg-white focus:border-indigo-500 outline-none uppercase transition-colors" placeholder={SYSTEM_TEXTS.PLACEHOLDER_TITLE} value={editingSurvey.title} onChange={e => setEditingSurvey({ ...editingSurvey, title: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">{SYSTEM_TEXTS.LBL_OBJECTIVE}</label>
                                                <select className="w-full font-black h-16 bg-slate-50 border border-slate-100 rounded-[1.5rem] px-8 text-sm uppercase shadow-sm outline-none focus:border-indigo-500 appearance-none cursor-pointer" value={editingSurvey.type} onChange={e => setEditingSurvey({ ...editingSurvey, type: e.target.value })}>
                                                    <option value="GENERAL">{SYSTEM_TEXTS.TYPE_GENERAL}</option>
                                                    <option value="ADMIN">{SYSTEM_TEXTS.TYPE_ADMIN}</option>
                                                    <option value="LEGAL">{SYSTEM_TEXTS.TYPE_LEGAL}</option>
                                                    <option value="FINANCE">{SYSTEM_TEXTS.TYPE_FINANCE}</option>
                                                    <option value="TURISM">{SYSTEM_TEXTS.TYPE_TURISM}</option>
                                                    <option value="WORKS">{SYSTEM_TEXTS.TYPE_WORKS}</option>
                                                    <option value="HEALTH">{SYSTEM_TEXTS.TYPE_HEALTH}</option>
                                                    <option value="EDUCATION">{SYSTEM_TEXTS.TYPE_EDUCATION}</option>
                                                    <option value="SOCIAL">{SYSTEM_TEXTS.TYPE_SOCIAL}</option>
                                                </select>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">{SYSTEM_TEXTS.LBL_STATUS}</label>
                                                <select className="w-full font-black h-16 bg-slate-50 border border-slate-100 rounded-[1.5rem] px-8 text-sm uppercase shadow-sm outline-none focus:border-indigo-500 appearance-none cursor-pointer" value={editingSurvey.status} onChange={e => setEditingSurvey({ ...editingSurvey, status: e.target.value })}>
                                                    <option value="ACTIVE">{SYSTEM_TEXTS.STATUS_ACTIVE}</option>
                                                    <option value="INACTIVE">{SYSTEM_TEXTS.STATUS_INACTIVE}</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">{SYSTEM_TEXTS.LBL_DESCRIPTION}</label>
                                            <textarea rows={4} className="w-full font-medium bg-slate-50 border border-slate-100 rounded-[2.5rem] p-10 text-lg focus:bg-white focus:border-indigo-500 outline-none transition-colors uppercase leading-relaxed" placeholder={SYSTEM_TEXTS.PLACEHOLDER_DESCRIPTION} value={editingSurvey.description} onChange={e => setEditingSurvey({ ...editingSurvey, description: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* Matriz de Atributos */}
                                    <section className="space-y-8 w-full">
                                        <div className="flex items-center justify-between px-4">
                                            <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-4">
                                                <ListPlus size={28} className="text-indigo-600" /> {SYSTEM_TEXTS.TITLE_ATTRIBUTES}
                                            </h4>
                                            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-5 py-2 rounded-full border border-emerald-100 shadow-sm">{editingSurvey.questions?.length || 0} {SYSTEM_TEXTS.LBL_FIELDS_MAPPED}</span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 w-full">
                                            {editingSurvey.questions?.map((q: any, qIdx: number) => (
                                                <div key={q.id || qIdx} className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all relative group w-full overflow-hidden">

                                                    {/* Header com ícone da tag (Novo Visual) */}
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className={`p-3 rounded-xl ${q.mapping_tag === 'INFRASTRUCTURE' ? 'bg-amber-100 text-amber-600' :
                                                                q.mapping_tag === 'SECURITY' ? 'bg-rose-100 text-rose-600' :
                                                                    q.mapping_tag === 'ENVIRONMENT' ? 'bg-emerald-100 text-emerald-600' :
                                                                        q.mapping_tag === 'MOBILITY' ? 'bg-blue-100 text-blue-600' :
                                                                            'bg-slate-100 text-slate-500'
                                                            }`}>
                                                            {q.mapping_tag === 'INFRASTRUCTURE' ? <HardHat size={20} /> :
                                                                q.mapping_tag === 'SECURITY' ? <Siren size={20} /> :
                                                                    q.mapping_tag === 'MOBILITY' ? <Bus size={20} /> :
                                                                        q.mapping_tag === 'ECONOMY' ? <Coins size={20} /> :
                                                                            q.mapping_tag === 'ENVIRONMENT' ? <Leaf size={20} /> :
                                                                                <Database size={20} />}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                            {q.mapping_tag || 'Atributo Geral'}
                                                        </span>
                                                        <button onClick={() => {
                                                            const qs = [...editingSurvey.questions]; qs.splice(qIdx, 1); setEditingSurvey({ ...editingSurvey, questions: qs });
                                                        }} className="ml-auto p-3 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={20} /></button>
                                                    </div>

                                                    {/* Indicador Visual de Dependência */}
                                                    {q.logic_parent_id && (
                                                        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
                                                    )}

                                                    <div className="flex flex-col gap-10">
                                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full">
                                                            <div className="md:col-span-6 space-y-2">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_PROTOCOL_QUESTION}</label>
                                                                <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-base focus:bg-white focus:border-indigo-500 outline-none uppercase" value={q.text} onChange={e => updateQuestion(qIdx, 'text', e.target.value)} />
                                                            </div>
                                                            <div className="md:col-span-3 space-y-2">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_RESPONSE_FORMAT}</label>
                                                                <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-[10px] uppercase outline-none focus:bg-white focus:border-indigo-500" value={q.type} onChange={e => updateQuestion(qIdx, 'type', e.target.value)}>
                                                                    <option value="text">{SYSTEM_TEXTS.RESP_TEXT}</option>
                                                                    <option value="number">{SYSTEM_TEXTS.RESP_NUMBER}</option>
                                                                    <option value="boolean">{SYSTEM_TEXTS.RESP_BOOLEAN}</option>
                                                                    <option value="select">{SYSTEM_TEXTS.RESP_SELECT}</option>
                                                                    <option value="date">{SYSTEM_TEXTS.RESP_DATE}</option>
                                                                    <option value="repeater">{SYSTEM_TEXTS.RESP_REPEATER}</option>
                                                                </select>
                                                            </div>
                                                            <div className="md:col-span-3 space-y-2">
                                                                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_BI_MAPPING}</label>
                                                                <select className="w-full font-black h-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl px-6 text-[10px] uppercase outline-none focus:bg-white" value={q.mapping_tag} onChange={e => updateQuestion(qIdx, 'mapping_tag', e.target.value)}>
                                                                    <optgroup label="Base Social">
                                                                        <option value="IDENTITY">{SYSTEM_TEXTS.TAG_IDENTITY}</option>
                                                                        <option value="EDUCATION">{SYSTEM_TEXTS.TAG_EDUCATION}</option>
                                                                        <option value="HEALTH">{SYSTEM_TEXTS.TAG_HEALTH}</option>
                                                                        <option value="GOV_AID">{SYSTEM_TEXTS.TAG_GOV_AID}</option>
                                                                    </optgroup>
                                                                    <optgroup label="Infra & Urbano (Novo)">
                                                                        <option value="INFRASTRUCTURE">{SYSTEM_TEXTS.TAG_INFRA}</option>
                                                                        <option value="MOBILITY">{SYSTEM_TEXTS.TAG_MOBILITY}</option>
                                                                        <option value="ENVIRONMENT">{SYSTEM_TEXTS.TAG_ENV}</option>
                                                                    </optgroup>
                                                                    <optgroup label="Estratégico">
                                                                        <option value="SECURITY">{SYSTEM_TEXTS.TAG_SECURITY}</option>
                                                                        <option value="ECONOMY">{SYSTEM_TEXTS.TAG_ECONOMY}</option>
                                                                        <option value="CONSUMPTION">{SYSTEM_TEXTS.TAG_CONSUMPTION}</option>
                                                                        <option value="LEISURE">{SYSTEM_TEXTS.TAG_LEISURE}</option>
                                                                    </optgroup>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {/* Opções de Seleção */}
                                                        {q.type === 'select' && (
                                                            <div className="md:col-span-12 space-y-2 animate-fade-in">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_SELECT_OPTIONS}</label>
                                                                <input className="w-full font-bold h-12 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xs uppercase outline-none focus:bg-white focus:border-indigo-500"
                                                                    placeholder={SYSTEM_TEXTS.PLACEHOLDER_SELECT}
                                                                    value={Array.isArray(q.options) ? q.options.join(', ') : q.options}
                                                                    onChange={e => updateQuestion(qIdx, 'options', e.target.value.split(',').map((s: string) => s.trim()))}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* LÓGICA ADITIVA: INDEXAÇÃO BI */}
                                                        <div className="md:col-span-12 flex flex-wrap items-center gap-4 bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100">
                                                            <div className="flex items-center gap-4">
                                                                <label className="relative inline-flex items-center cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="sr-only peer"
                                                                        checked={q.filterable || false}
                                                                        onChange={(e) => updateQuestion(qIdx, 'filterable', e.target.checked)}
                                                                    />
                                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                                                </label>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
                                                                        {SYSTEM_TEXTS.LBL_INDEX_BI}
                                                                    </span>
                                                                    {q.filterable && (
                                                                        <span className="text-[8px] text-slate-400 font-bold uppercase mt-1 italic leading-none">
                                                                            {SYSTEM_TEXTS.TIP_INDEX_SUCCESS}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {q.filterable && (
                                                                <div className="flex items-center gap-3 animate-fade-in border-l border-indigo-200 pl-6 ml-2">
                                                                    <Fingerprint size={16} className="text-indigo-400" />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{SYSTEM_TEXTS.LBL_SLUG_HELPER}</span>
                                                                        <span className="text-[10px] font-mono font-bold text-indigo-600 bg-white px-3 py-1 rounded-lg border border-indigo-200 shadow-sm">
                                                                            {q.slug || 'processando_neural...'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="pt-8 border-t border-slate-100 bg-slate-50/30 p-8 rounded-[2rem]">
                                                            <div className="flex items-center gap-3 mb-6">
                                                                <GitMerge size={18} className="text-indigo-600" />
                                                                <h6 className="text-[11px] font-black uppercase tracking-widest text-slate-700">{SYSTEM_TEXTS.LBL_LOGIC_FLOW}</h6>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                <div className="space-y-3">
                                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                        <ListTree size={12} /> {SYSTEM_TEXTS.LBL_LOGIC_PARENT}
                                                                    </label>
                                                                    <select
                                                                        className="w-full font-bold h-12 bg-white border border-slate-200 rounded-xl px-5 text-[10px] uppercase outline-none focus:border-indigo-500 shadow-sm"
                                                                        value={q.logic_parent_id || ''}
                                                                        onChange={e => updateQuestion(qIdx, 'logic_parent_id', e.target.value)}
                                                                    >
                                                                        <option value="">{SYSTEM_TEXTS.LBL_LOGIC_NONE}</option>
                                                                        {editingSurvey.questions
                                                                            .filter((_: any, idx: number) => idx < qIdx)
                                                                            .map((parent: any) => (
                                                                                <option key={parent.id} value={parent.id}>{parent.text}</option>
                                                                            ))
                                                                        }
                                                                    </select>
                                                                </div>
                                                                {q.logic_parent_id && (
                                                                    <div className="space-y-3 animate-fade-in">
                                                                        <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                                                            <ArrowDownRight size={12} /> {SYSTEM_TEXTS.LBL_LOGIC_TRIGGER}
                                                                        </label>
                                                                        <input
                                                                            className="w-full font-bold h-12 bg-white border border-indigo-200 text-indigo-600 rounded-xl px-5 text-[10px] uppercase outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm"
                                                                            placeholder="Ex: Sim, 18, CLT..."
                                                                            value={q.logic_trigger_value || ''}
                                                                            onChange={e => updateQuestion(qIdx, 'logic_trigger_value', e.target.value)}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {!q.logic_parent_id && (
                                                                <p className="mt-4 text-[9px] text-slate-400 font-bold uppercase italic opacity-60 leading-relaxed max-w-md">
                                                                    {SYSTEM_TEXTS.LBL_LOGIC_HINT}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => setEditingSurvey({ ...editingSurvey, questions: [...(editingSurvey.questions || []), { id: `q_${Date.now()}`, text: SYSTEM_TEXTS.DEFAULT_NEW_ATTRIBUTE, type: 'text', required: 1, mapping_tag: 'IDENTITY', logic_parent_id: '', logic_trigger_value: '', filterable: false, slug: 'novo_atributo' }] })} className="w-full py-10 border-4 border-dashed border-slate-200 rounded-[3rem] text-sm font-black uppercase tracking-[0.4em] text-slate-300 hover:text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 transition-all active:scale-[0.99] flex flex-col items-center gap-4">
                                            <Plus size={32} /> {SYSTEM_TEXTS.BTN_ADD_ATTRIBUTE}
                                        </button>
                                    </section>
                                </div>
                            </div>

                            {showAuditPanel && (
                                <div className="w-96 bg-white border-l border-slate-200 h-full overflow-y-auto hidden lg:flex flex-col animate-slide-left z-20 shadow-2xl shrink-0">
                                    <div className="p-8 border-b border-slate-100">
                                        <h5 className="font-black uppercase text-slate-800 flex items-center gap-2"><Gauge size={18} /> {SYSTEM_TEXTS.AUDIT_TITLE}</h5>
                                        <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Análise setorial em tempo real.</p>
                                    </div>
                                    <div className="p-8 space-y-8 flex-1">
                                        <div className="text-center space-y-4">
                                            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="64" cy="64" r="60" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                                                    <circle cx="64" cy="64" r="60" stroke={auditMetrics.score > 70 ? '#10b981' : auditMetrics.score > 40 ? '#f59e0b' : '#f43f5e'} strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377 - (377 * auditMetrics.score) / 100} className="transition-all duration-1000 ease-out" />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-3xl font-black text-slate-800">{auditMetrics.score}</span>
                                                    <span className="text-[8px] font-black uppercase text-slate-400">Score</span>
                                                </div>
                                            </div>
                                            <p className={`text-xs font-bold uppercase ${auditMetrics.score > 70 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                {auditMetrics.score > 70 ? SYSTEM_TEXTS.TIP_BALANCED : "Otimização Necessária"}
                                            </p>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Thermometer size={14} /> {SYSTEM_TEXTS.AUDIT_LOAD}</span>
                                                    <span className={`text-[10px] font-black uppercase ${auditMetrics.loadColor}`}>{auditMetrics.loadLabel}</span>
                                                </div>
                                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                    <div className={`h-full ${auditMetrics.loadColor.replace('text', 'bg')} transition-all`} style={{ width: `${auditMetrics.count > 0 ? Math.min(100, (auditMetrics.load / (auditMetrics.count * 3)) * 100) : 0}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><ShieldCheck size={14} /> {SYSTEM_TEXTS.AUDIT_COVERAGE}</span>
                                                    <span className="text-[10px] font-black uppercase text-indigo-600">{auditMetrics.coverage}%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-600 transition-all" style={{ width: `${auditMetrics.coverage}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <h6 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Recomendações Neural</h6>
                                            {auditMetrics.loadLabel !== SYSTEM_TEXTS.METRIC_LOW && auditMetrics.count > 0 && (
                                                <div className="flex gap-3 p-3 bg-amber-50 rounded-xl text-amber-700 text-[10px] font-bold uppercase leading-relaxed items-start">
                                                    <ShieldAlert size={14} className="shrink-0 mt-0.5" /> {SYSTEM_TEXTS.TIP_ADD_SELECT}
                                                </div>
                                            )}
                                            {auditMetrics.coverage < 50 && auditMetrics.count > 0 && (
                                                <div className="flex gap-3 p-3 bg-indigo-50 rounded-xl text-indigo-700 text-[10px] font-bold uppercase leading-relaxed items-start">
                                                    <TrendingUp size={14} className="shrink-0 mt-0.5" /> {SYSTEM_TEXTS.TIP_ADD_TAGS}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        <div className="p-8 border-t bg-white flex justify-between items-center shrink-0 z-20 relative">
                            <div className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{SYSTEM_TEXTS.LBL_FOOTER_STATUS}</span></div>
                            <div className="flex gap-4">
                                <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">{SYSTEM_TEXTS.BTN_ABORT}</button>
                                <button onClick={handleSave} className="px-12 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all transform hover:-translate-y-1">{SYSTEM_TEXTS.BTN_SAVE_STRUCTURE}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Surveys;

import React, { useState, useEffect, useRef } from 'react';
import { 
    Gavel, Play, StopCircle, FileText, Download, Trash2, Edit2, 
    Plus, Search, Clock, Users, ChevronRight, X, Save, Sparkles, Printer, Loader2, ThumbsUp, ThumbsDown, CircleSlash, Send, MonitorPlay, BarChart3
} from 'lucide-react';
import { assemblyService, aiService } from '../services/api';

const AssemblyManager = () => {
    const [assemblies, setAssemblies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'HISTORY' | 'LIVE'>('HISTORY');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssembly, setEditingAssembly] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Live Session States
    const [activeSession, setActiveSession] = useState<any>(null);
    const [isGeneratingAta, setIsGeneratingAta] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [votingData, setVotingData] = useState({
        quorum: 0, totalEligible: 452,
        topics: [
            { id: 1, title: 'Prestação de Contas Anual', votes: { yes: 0, no: 0, abstain: 0 } },
            { id: 2, title: 'Investimentos em Segurança', votes: { yes: 0, no: 0, abstain: 0 } }
        ]
    });

    useEffect(() => { loadAssemblies(); }, []);

    const loadAssemblies = async () => {
        setLoading(true);
        try {
            const res = await assemblyService.getAll();
            setAssemblies(res.data.data || (Array.isArray(res.data) ? res.data : []));
        } finally { setLoading(false); }
    };

    const handleOpenCreate = () => {
        setEditingAssembly({ title: '', description: '', date: new Date().toISOString().slice(0, 16), status: 'SCHEDULED', pautas: [] });
        setIsModalOpen(true);
    };

    const handleSave = async (e: any) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            if (editingAssembly.id) {
                await assemblyService.update(editingAssembly.id, editingAssembly);
            } else {
                await assemblyService.create(editingAssembly);
            }
            setIsModalOpen(false);
            loadAssemblies();
            alert("✅ Protocolo de assembleia registrado.");
        } catch (err) {
            alert("Falha ao salvar no Kernel.");
        } finally { setIsSaving(false); }
    };

    const handleDelete = async (id: number | string) => {
        if (!confirm("Excluir esta assembleia permanentemente?")) return;
        try {
            await assemblyService.delete(id);
            loadAssemblies();
        } catch (err) {
            alert("Erro ao remover registro.");
        }
    };

    const handleStartLive = (assembly: any) => {
        setActiveSession(assembly);
        setActiveTab('LIVE');
        setMessages([{ id: 1, user: 'SISTEMA', text: `Sessão "${assembly.title}" iniciada no Terminal.`, type: 'system' }]);
    };

    const handleEndAssembly = async () => {
        if (!confirm("Deseja encerrar a sessão e consolidar a Ata via IA?")) return;
        setIsGeneratingAta(true);
        try {
            const res = await aiService.generateAssemblyAta({
                title: activeSession.title,
                topics: votingData.topics.map(t => t.title).join(', '),
                results: votingData.topics.map(t => `${t.title}: S(${t.votes.yes}) N(${t.votes.no})`).join('; '),
                quorum: votingData.quorum,
                discussion: messages.map(m => `${m.user}: ${m.text}`).join('\n')
            });
            
            await assemblyService.update(activeSession.id, { ...activeSession, status: 'FINISHED', ata_content: res.data.ata });
            setActiveSession(null);
            setActiveTab('HISTORY');
            loadAssemblies();
            alert("✅ Sessão finalizada. Ata gerada no Hub.");
        } catch (err) {
            alert("Falha na geração neural da Ata.");
        } finally { setIsGeneratingAta(false); }
    };

    const handlePrintAta = (ata: string) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>Ata S.I.E</title><style>body{font-family:serif;padding:50px;line-height:1.6}h1{text-align:center;text-transform:uppercase;border-bottom:2px solid #000;padding-bottom:20px} .content{margin-top:40px;text-align:justify}</style></head><body><h1>Ata Oficial de Assembleia</h1><div class="content">${ata.replace(/\n/g, '<br/>')}</div></body></html>`);
            printWindow.document.close();
            printWindow.print();
        }
    };

    if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={48}/></div>;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Assembleia & Co-Gestão</h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Kernel Governança Digital V71.0</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner w-full md:w-auto">
                    <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}>Gestão Central</button>
                    <button disabled={!activeSession} onClick={() => setActiveTab('LIVE')} className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'LIVE' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 opacity-50'}`}>Live Ativa</button>
                </div>
            </header>

            {activeTab === 'HISTORY' && (
                <div className="space-y-6">
                    <div className="flex justify-end gap-4">
                        <button onClick={handleOpenCreate} className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all active:scale-95">
                            <Plus size={20}/> Agendar Nova Sessão
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {assemblies.map(ass => (
                            <div key={ass.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center group hover:border-indigo-300 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className={`p-5 rounded-[2rem] shadow-inner ${ass.status === 'FINISHED' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                        <Gavel size={28}/>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{ass.title}</h3>
                                        <div className="flex gap-4 mt-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Clock size={14}/> {new Date(ass.date).toLocaleDateString('pt-BR')} às {new Date(ass.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</span>
                                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${ass.status === 'FINISHED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{ass.status}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-6 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {ass.status === 'SCHEDULED' && (
                                        <>
                                            <button onClick={() => handleStartLive(ass)} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 transition-all" title="Iniciar Sessão Digital"><Play size={20}/></button>
                                            <button onClick={() => { setEditingAssembly(ass); setIsModalOpen(true); }} className="p-4 bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-2xl hover:bg-white transition-all shadow-sm"><Edit2 size={20}/></button>
                                        </>
                                    )}
                                    {ass.status === 'FINISHED' && ass.ata_content && (
                                        <button onClick={() => handlePrintAta(ass.ata_content)} className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Imprimir Ata IA"><Printer size={20}/></button>
                                    )}
                                    <button onClick={() => handleDelete(ass.id)} className="p-4 text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={20}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'LIVE' && activeSession && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-scale-in">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-slate-950 rounded-[3rem] p-12 text-white shadow-2xl border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 px-4 py-2 bg-rose-500/10 text-rose-400 rounded-full w-fit border border-rose-500/20 mb-6">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sessão Deliberativa On-line</span>
                                    </div>
                                    <h3 className="text-5xl font-black tracking-tightest leading-tight">{activeSession.title}</h3>
                                </div>
                                <button onClick={handleEndAssembly} disabled={isGeneratingAta} className="px-12 py-6 bg-rose-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-rose-700 transition-all flex items-center gap-4 shrink-0 active:scale-95">
                                    {isGeneratingAta ? <Loader2 className="animate-spin" size={20}/> : <StopCircle size={20}/>} Finalizar & Gerar Ata IA
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6">
                            {votingData.topics.map(topic => (
                                <div key={topic.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm group hover:border-indigo-200 transition-all">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                                        <h4 className="text-2xl font-black text-slate-800 tracking-tight">{topic.title}</h4>
                                    </div>
                                    <div className="grid grid-cols-3 gap-6">
                                        <button className="p-8 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-[2rem] flex flex-col items-center gap-3 transition-all border border-transparent hover:border-emerald-100">
                                            <ThumbsUp size={36}/><span className="text-xs font-black uppercase tracking-widest">{topic.votes.yes} FAVORÁVEIS</span>
                                        </button>
                                        <button className="p-8 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-[2rem] flex flex-col items-center gap-3 transition-all border border-transparent hover:border-rose-100">
                                            <ThumbsDown size={36}/><span className="text-xs font-black uppercase tracking-widest">{topic.votes.no} CONTRÁRIOS</span>
                                        </button>
                                        <button className="p-8 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-[2rem] flex flex-col items-center gap-3 transition-all border border-transparent hover:border-slate-200">
                                            <CircleSlash size={36}/><span className="text-xs font-black uppercase tracking-widest">{topic.votes.abstain} ABSTENÇÕES</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="lg:col-span-4 bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col h-[700px] overflow-hidden sticky top-8">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h5 className="font-black uppercase text-[10px] tracking-widest text-slate-500">Debate em Tempo Real</h5>
                            <div className="flex items-center gap-2">
                                <Users size={14} className="text-indigo-500"/>
                                <span className="text-xs font-bold text-slate-800">124 Ativos</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-5 custom-scrollbar bg-slate-50/20">
                            {messages.map(m => (
                                <div key={m.id} className={`p-5 rounded-2xl shadow-sm border ${m.type === 'system' ? 'bg-indigo-50 border-indigo-100 text-indigo-600 text-center font-bold text-[10px] uppercase tracking-widest' : 'bg-white border-slate-100 text-slate-700'}`}>
                                    {m.type !== 'system' && <p className="text-[8px] font-black uppercase text-indigo-500 mb-1">{m.user}</p>}
                                    <p className="text-xs font-medium leading-relaxed">{m.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-white flex gap-3">
                            <input className="flex-1 bg-slate-50 border-slate-100 rounded-xl px-5 text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 outline-none" placeholder="Digite sua manifestação..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && chatInput && (setMessages([...messages, {id: Date.now(), text: chatInput, user: 'Morador S.I.E'}]), setChatInput(''))} />
                            <button onClick={() => { if(chatInput){ setMessages([...messages, {id: Date.now(), text: chatInput, user: 'Morador S.I.E'}]); setChatInput(''); } }} className="p-4 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all"><Send size={20}/></button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-slate-900/95 z-[9999] p-4 backdrop-blur-xl animate-fade-in">
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/10 animate-scale-in flex flex-col max-h-[95vh]">
                        <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
                            <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl"><Plus size={24}/></div>
                                    <h3 className="font-black text-2xl tracking-tighter uppercase">Configurar Assembleia</h3>
                                </div>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 text-slate-400 hover:bg-slate-100 rounded-full transition-all"><X size={32}/></button>
                            </div>
                            <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1 bg-[#fcfcfd]">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título Oficial da Sessão</label>
                                    <input required className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-8 shadow-inner text-lg focus:border-indigo-500" value={editingAssembly.title} onChange={e => setEditingAssembly({...editingAssembly, title: e.target.value})} placeholder="Ex: Assembleia Ordinária Q1/2025" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data e Hora de Abertura</label>
                                        <input type="datetime-local" className="w-full font-bold h-16 bg-white border-slate-200 rounded-2xl px-8 shadow-inner" value={editingAssembly.date} onChange={e => setEditingAssembly({...editingAssembly, date: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Edital</label>
                                        <select className="w-full font-black h-16 bg-white border-slate-200 rounded-2xl px-8 shadow-inner appearance-none uppercase text-xs" value={editingAssembly.status} onChange={e => setEditingAssembly({...editingAssembly, status: e.target.value})}>
                                            <option value="SCHEDULED">Ordinária (Agendada)</option>
                                            <option value="FINISHED">Sessão Encerrada</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pautas Deliberativas</label>
                                    <textarea rows={4} className="w-full font-medium bg-white border-slate-200 rounded-2xl p-8 shadow-inner focus:border-indigo-500" value={editingAssembly.description} onChange={e => setEditingAssembly({...editingAssembly, description: e.target.value})} placeholder="Descreva os pontos que serão votados..." />
                                </div>
                            </div>
                            <div className="p-10 border-t border-slate-100 flex justify-end gap-6 bg-slate-50 shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 text-slate-400 font-black text-xs uppercase tracking-widest">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="px-16 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95">
                                    {isSaving ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Publicar Edital
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssemblyManager;

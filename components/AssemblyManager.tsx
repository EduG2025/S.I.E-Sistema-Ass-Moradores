
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
            { id: 1, title: 'Prestação de Contas 2024', votes: { yes: 0, no: 0, abstain: 0 } },
            { id: 2, title: 'Reforma do Telhado', votes: { yes: 0, no: 0, abstain: 0 } }
        ]
    });

    useEffect(() => { loadAssemblies(); }, []);

    const loadAssemblies = async () => {
        setLoading(true);
        try {
            const res = await assemblyService.getAll();
            setAssemblies(res.data.data || []);
        } finally { setLoading(false); }
    };

    const handleOpenCreate = () => {
        setEditingAssembly({ title: '', description: '', date: new Date().toISOString().slice(0, 16), status: 'SCHEDULED', pautas: [] });
        setIsModalOpen(true);
    };

    // FIX: Use any to bypass namespace 'React' error
    const handleSave = async (e: any) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingAssembly.id) {
                await assemblyService.update(editingAssembly.id, editingAssembly);
            } else {
                await assemblyService.create(editingAssembly);
            }
            setIsModalOpen(false);
            loadAssemblies();
        } finally { setIsSaving(false); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Excluir esta assembleia permanentemente?")) return;
        await assemblyService.delete(id);
        loadAssemblies();
    };

    const handleStartLive = (assembly: any) => {
        setActiveSession(assembly);
        setActiveTab('LIVE');
        setMessages([{ id: 1, user: 'SISTEMA', text: `Sessão "${assembly.title}" iniciada.`, type: 'system' }]);
    };

    const handleEndAssembly = async () => {
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
        } finally { setIsGeneratingAta(false); }
    };

    const handlePrintAta = (ata: string) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>Ata S.I.E</title><style>body{font-family:serif;padding:50px;line-height:1.6}h1{text-align:center;text-transform:uppercase}</style></head><body><h1>Ata Oficial de Assembleia</h1><div>${ata.replace(/\n/g, '<br/>')}</div></body></html>`);
            printWindow.document.close();
            printWindow.print();
        }
    };

    if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={48}/></div>;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Assembleia & Co-Gestão</h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Kernel Governança Digital V71.0</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button onClick={() => setActiveTab('HISTORY')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Histórico & Gestão</button>
                    <button disabled={!activeSession} onClick={() => setActiveTab('LIVE')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'LIVE' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 opacity-50'}`}>Sessão Ativa</button>
                </div>
            </header>

            {activeTab === 'HISTORY' && (
                <div className="space-y-6">
                    <div className="flex justify-end gap-4">
                        <button onClick={handleOpenCreate} className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all">
                            <Plus size={18}/> Novo Edital / Assembleia
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {assemblies.map(ass => (
                            <div key={ass.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center group hover:border-indigo-300 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-2xl ${ass.status === 'FINISHED' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                        <Gavel size={24}/>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800">{ass.title}</h3>
                                        <div className="flex gap-4 mt-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><Clock size={12}/> {new Date(ass.date).toLocaleDateString('pt-BR')}</span>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${ass.status === 'FINISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{ass.status}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4 md:mt-0">
                                    {ass.status === 'SCHEDULED' && (
                                        <>
                                            <button onClick={() => handleStartLive(ass)} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all" title="Iniciar Sessão"><Play size={18}/></button>
                                            <button onClick={() => { setEditingAssembly(ass); setIsModalOpen(true); }} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"><Edit2 size={18}/></button>
                                        </>
                                    )}
                                    {ass.status === 'FINISHED' && (
                                        <button onClick={() => handlePrintAta(ass.ata_content)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Printer size={18}/></button>
                                    )}
                                    <button onClick={() => handleDelete(ass.id)} className="p-3 text-rose-300 hover:text-rose-600 transition-all"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'LIVE' && activeSession && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-scale-in">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl border border-white/5 relative overflow-hidden">
                            <div className="relative z-10 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full w-fit border border-rose-500/30 mb-4">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
                                        <span className="text-[9px] font-black uppercase tracking-widest">Live Deliberativa</span>
                                    </div>
                                    <h3 className="text-4xl font-black tracking-tightest">{activeSession.title}</h3>
                                </div>
                                <button onClick={handleEndAssembly} disabled={isGeneratingAta} className="px-10 py-5 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-rose-700 transition-all flex items-center gap-3">
                                    {isGeneratingAta ? <Loader2 className="animate-spin"/> : <StopCircle/>} Encerrar & Gerar Ata IA
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            {votingData.topics.map(topic => (
                                <div key={topic.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                    <h4 className="text-lg font-black text-slate-800 mb-6">{topic.title}</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <button onClick={() => {}} className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl flex flex-col items-center">
                                            <ThumbsUp size={24}/><span className="text-xs font-black mt-2">{topic.votes.yes} SIM</span>
                                        </button>
                                        <button onClick={() => {}} className="p-4 bg-rose-50 text-rose-600 rounded-2xl flex flex-col items-center">
                                            <ThumbsDown size={24}/><span className="text-xs font-black mt-2">{topic.votes.no} NÃO</span>
                                        </button>
                                        <button onClick={() => {}} className="p-4 bg-slate-50 text-slate-400 rounded-2xl flex flex-col items-center">
                                            <CircleSlash size={24}/><span className="text-xs font-black mt-2">{topic.votes.abstain} ABST.</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="lg:col-span-4 bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col h-[600px] overflow-hidden">
                        <div className="p-6 border-b border-slate-100 font-black uppercase text-[10px] tracking-widest text-slate-500">Debate em Tempo Real</div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {messages.map(m => (
                                <div key={m.id} className={`p-4 rounded-2xl text-xs ${m.type === 'system' ? 'bg-indigo-50 text-indigo-600 text-center font-bold' : 'bg-slate-100 text-slate-700'}`}>{m.text}</div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-100 flex gap-2">
                            <input className="flex-1 bg-slate-50 border-none rounded-xl px-4 text-xs" placeholder="Manifestar-se..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                            <button onClick={() => { if(chatInput){ setMessages([...messages, {id: Date.now(), text: chatInput, user: 'Morador'}]); setChatInput(''); } }} className="p-3 bg-indigo-600 text-white rounded-xl"><Send size={18}/></button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-scale-in">
                        <form onSubmit={handleSave}>
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-black text-2xl tracking-tighter">Configurar Assembleia</h3>
                                <button type="button" onClick={() => setIsModalOpen(false)}><X/></button>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Título da Sessão</label><input required className="w-full font-bold" value={editingAssembly.title} onChange={e => setEditingAssembly({...editingAssembly, title: e.target.value})} placeholder="Ex: Assembleia Ordinária de Verão" /></div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Data e Hora</label><input type="datetime-local" className="w-full font-bold" value={editingAssembly.date} onChange={e => setEditingAssembly({...editingAssembly, date: e.target.value})} /></div>
                                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Status</label><select className="w-full font-bold" value={editingAssembly.status} onChange={e => setEditingAssembly({...editingAssembly, status: e.target.value})}><option value="SCHEDULED">Agendada</option><option value="FINISHED">Concluída (Apenas Histórico)</option></select></div>
                                </div>
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Pautas (Separe por vírgula)</label><textarea rows={3} className="w-full font-medium" value={editingAssembly.description} onChange={e => setEditingAssembly({...editingAssembly, description: e.target.value})} placeholder="Descreva os assuntos principais..." /></div>
                            </div>
                            <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-xs uppercase">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3">
                                    {isSaving ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Commitar Edital
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

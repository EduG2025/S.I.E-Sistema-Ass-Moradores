import React, { useState, useRef, useEffect } from 'react';
import { Send, Brain, User, Loader2, Sparkles, ShieldCheck, Zap, Trash2, Link as LinkIcon, ExternalLink, RefreshCw, Search, X } from 'lucide-react';
import { aiService } from '../services/api';

interface Message {
  id: string;
  text: string;
  sender: 'AI' | 'USER';
  timestamp: Date;
  sources?: { title: string; uri: string }[];
}

const ChatAssistant = ({ systemInfo }: { systemInfo?: any }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Olá! Sou o Advisor S.I.E PRO. Possuo acesso às leis brasileiras e regimentos associativos em tempo real. Como posso auxiliar na gestão do seu cluster hoje?',
      sender: 'AI',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useGrounding, setUseGrounding] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input;
    const userMsg: Message = { id: Date.now().toString(), text: query, sender: 'USER', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    
    setInput('');
    setIsLoading(true);

    try {
      const res = await aiService.chat(query, { search: useGrounding }); 
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: res.data.text || 'O Kernel Mentor não retornou uma resposta válida para esta pauta.',
        sender: 'AI',
        timestamp: new Date(),
        sources: res.data.groundingChunks?.map((c: any) => {
            if (c.web) return { title: c.web.title || 'Ref Pública', uri: c.web.uri || '#' };
            return null;
        }).filter(Boolean) || []
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: 'err',
        text: '⚠️ FALHA DE SINCRONIA NEURAL: Verifique as chaves no Console Master ou sua conexão.',
        sender: 'AI',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in overflow-hidden bg-slate-50/50">
      <div className="bg-slate-900 px-8 py-6 flex justify-between items-center shrink-0 border-b border-white/5 shadow-xl relative z-20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-2xl animate-pulse">
            <Brain size={22} />
          </div>
          <div>
            <h2 className="text-white font-black text-lg uppercase tracking-tight leading-none">Advisor Mentor</h2>
            <p className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] mt-1.5">Inteligência Governamental Ativa</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
            <button onClick={() => setUseGrounding(!useGrounding)} className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 border font-black text-[9px] uppercase tracking-widest ${useGrounding ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}>
                <Search size={14} /> {useGrounding ? 'Grounding On' : 'Grounding Off'}
            </button>
            <button onClick={() => setMessages([messages[0]])} className="p-2.5 bg-white/5 hover:bg-rose-500 text-white rounded-xl transition-all border border-white/5" title="Limpar Diálogo">
                <Trash2 size={16} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'} animate-scale-in`}>
              <div className={`max-w-[95%] md:max-w-[80%] flex gap-4 ${msg.sender === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2 ${msg.sender === 'USER' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-900 text-indigo-400 border-white/10'}`}>
                  {msg.sender === 'USER' ? <User size={20}/> : <Sparkles size={20}/>}
                </div>
                <div className="space-y-4 flex-1">
                  <div className={`p-6 rounded-[2rem] text-sm font-medium leading-loose shadow-sm border ${msg.sender === 'USER' ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' : 'bg-white border-slate-100 text-slate-700 rounded-tl-none'}`}>
                    <p className="whitespace-pre-wrap uppercase tracking-tight">{msg.text}</p>
                  </div>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-2">
                       {msg.sources.map((s, idx) => (
                         <a key={idx} href={s.uri} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white border border-slate-200 text-[9px] font-black text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 uppercase shadow-sm">
                            <LinkIcon size={12}/> {s.title.slice(0, 25)}... <ExternalLink size={10}/>
                         </a>
                       ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-pulse ml-14">
                <div className="p-4 bg-white border border-slate-100 rounded-3xl flex items-center gap-4 shadow-md">
                  <Loader2 size={18} className="animate-spin text-indigo-600" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processando Matriz Neural...</span>
                </div>
            </div>
          )}
        </div>

        <div className="px-6 md:px-12 py-8 bg-white border-t border-slate-200 shrink-0">
          <form onSubmit={handleSend} className="relative flex items-center gap-4 max-w-5xl mx-auto">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="w-full pl-8 pr-20 h-16 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase placeholder:text-slate-300 shadow-inner"
              placeholder="Consultar Mentor Advisor SRE..."
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 p-4 bg-slate-900 text-white rounded-[1.5rem] hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-30 shadow-2xl"
            >
              <Send size={20} />
            </button>
          </form>
          <div className="flex justify-center gap-8 mt-6 opacity-50">
             <div className="flex items-center gap-2"><ShieldCheck size={12} className="text-emerald-500"/><span className="text-[8px] font-black uppercase text-slate-500">SRE Audit Link</span></div>
             <div className="flex items-center gap-2"><RefreshCw size={12} className="text-indigo-500"/><span className="text-[8px] font-black uppercase text-slate-500">Kernel Active Sync</span></div>
             <div className="flex items-center gap-2"><Zap size={12} className="text-amber-500"/><span className="text-[8px] font-black uppercase text-slate-500">Pro-3 Engine</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
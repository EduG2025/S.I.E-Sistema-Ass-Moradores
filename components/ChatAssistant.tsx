
import React, { useState, useRef, useEffect } from 'react';
import { Send, Brain, User, Loader2, Sparkles, ShieldCheck, Zap, Trash2, Link as LinkIcon, ExternalLink, RefreshCw, Search } from 'lucide-react';
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
      text: 'Olá! Sou o assistente de inteligência do S.I.E PRO. Possuo acesso em tempo real à legislação, normas técnicas brasileiras e mapas locais. Como posso auxiliar na sua gestão hoje?',
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
      // SRE: Chamada ao serviço com Grounding habilitado
      const res = await aiService.chat(query, { search: useGrounding }); 
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: res.data.text || 'O Kernel não retornou dados válidos.',
        sender: 'AI',
        timestamp: new Date(),
        sources: res.data.groundingChunks?.map((c: any) => ({ 
            title: c.web?.title || 'Referência Externa', 
            uri: c.web?.uri || '#' 
        })) || []
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: 'err',
        text: '⚠️ FALHA DE COMUNICAÇÃO NEURAL: Verifique a conexão com o cluster de inteligência.',
        sender: 'AI',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in overflow-hidden">
      {/* MODULE HEADER */}
      <div className="module-header relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-xl">
            <Brain size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">SRE Advisor Core</h2>
            <p className="text-[7px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-1">Grounded Intelligence V260</p>
          </div>
        </div>
        <div className="flex items-center gap-2 relative z-10">
            <button 
                onClick={() => setUseGrounding(!useGrounding)}
                className={`p-2 rounded-lg transition-all flex items-center gap-2 border ${useGrounding ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg' : 'bg-white/5 text-slate-400 border-white/5'}`}
                title="Google Search Grounding"
            >
                <Search size={14} />
                <span className="text-[8px] font-black uppercase hidden md:inline">{useGrounding ? 'Search On' : 'Search Off'}</span>
            </button>
            <button onClick={() => setMessages([messages[0]])} className="p-2 bg-white/5 hover:bg-rose-500 text-white rounded-lg transition-all border border-white/5">
                <Trash2 size={14} />
            </button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="content-wrapper">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-50/30">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'} animate-scale-in`}>
              <div className={`max-w-[95%] md:max-w-[85%] flex gap-3 ${msg.sender === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-md ${msg.sender === 'USER' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-indigo-400'}`}>
                  {msg.sender === 'USER' ? <User size={14}/> : <Sparkles size={14}/>}
                </div>
                <div className="space-y-3 flex-1">
                  <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${msg.sender === 'USER' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-1">
                       {msg.sources.map((s, idx) => (
                         <a key={idx} href={s.uri} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white border border-slate-200 text-[8px] font-black text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 uppercase shadow-sm">
                            <LinkIcon size={10}/> {s.title.slice(0, 18)}... <ExternalLink size={10}/>
                         </a>
                       ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-pulse ml-11">
                <div className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center gap-3 shadow-sm">
                  <Loader2 size={14} className="animate-spin text-indigo-600" />
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Cluster...</span>
                </div>
            </div>
          )}
        </div>

        {/* INPUT FOOTER */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <form onSubmit={handleSend} className="relative flex items-center gap-2 px-1 max-w-4xl mx-auto">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="w-full pl-6 pr-14 h-12 bg-slate-50 border border-slate-200 rounded-full text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase placeholder:text-slate-300 shadow-inner"
              placeholder="Consulte o Advisor..."
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-1.5 top-1.5 p-2.5 bg-slate-900 text-white rounded-full hover:bg-indigo-600 active:scale-90 transition-all disabled:opacity-30 shadow-lg"
            >
              <Send size={16} />
            </button>
          </form>
          <div className="flex justify-center gap-6 py-3 opacity-60">
             <div className="flex items-center gap-1.5"><ShieldCheck size={10} className="text-emerald-500"/><span className="text-[7px] font-black uppercase text-slate-400">Secure Protocol</span></div>
             <div className="flex items-center gap-1.5"><RefreshCw size={10} className="text-indigo-500"/><span className="text-[7px] font-black uppercase text-slate-400">DB Sync Active</span></div>
             <div className="flex items-center gap-1.5"><Zap size={10} className="text-amber-500"/><span className="text-[7px] font-black uppercase text-slate-400">Gemini 3 Flash</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;


import React, { useState, useRef, useEffect } from 'react';
import { Send, Brain, User, Loader2, Sparkles, ShieldCheck, Zap, Trash2 } from 'lucide-react';
import { aiService } from '../services/api';

interface Message {
  id: string;
  text: string;
  sender: 'AI' | 'USER';
  timestamp: Date;
}

const ChatAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Olá! Sou o assistente de inteligência do S.I.E. Como posso ajudar na gestão do seu cluster hoje?',
      sender: 'AI',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = async (e?: any) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'USER', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    
    const query = input;
    setInput('');
    setIsLoading(true);

    try {
      const res = await aiService.chat(query); 
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: typeof res.data === 'string' ? res.data : (res.data.text || 'Resposta indisponível.'),
        sender: 'AI',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: 'err',
        text: '⚠️ Falha de comunicação com o núcleo de IA.',
        sender: 'AI',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in pb-8 overflow-hidden">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 shrink-0">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-slate-950 text-indigo-400 rounded-2xl shadow-xl">
            <Brain size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tighter">SRE Advisor</h2>
            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-1">Motor Neural Gemini 3</p>
          </div>
        </div>
        <button onClick={() => setMessages([messages[0]])} className="p-3 text-slate-300 hover:text-rose-500 transition-colors">
          <Trash2 size={20} />
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 overflow-hidden flex flex-col relative shadow-inner min-h-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50/20">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'} animate-scale-in`}>
              <div className={`max-w-[85%] flex gap-5 ${msg.sender === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.sender === 'USER' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-indigo-400'}`}>
                  {msg.sender === 'USER' ? <User size={22}/> : <Sparkles size={22}/>}
                </div>
                <div className={`p-6 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm ${msg.sender === 'USER' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-pulse">
                <div className="p-6 bg-white border border-slate-100 rounded-[2rem] rounded-tl-none flex items-center gap-4 ml-16">
                  <Loader2 size={20} className="animate-spin text-indigo-600" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processando...</span>
                </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-white border-t border-slate-100 shrink-0">
          <form onSubmit={handleSend} className="relative">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="w-full pl-8 pr-24 py-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] text-sm font-bold outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all shadow-inner placeholder:text-slate-300"
              placeholder="Digite sua dúvida de gestão..."
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-slate-950 text-white rounded-full hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-30"
            >
              <Send size={24} />
            </button>
          </form>
          <div className="mt-4 flex justify-center items-center gap-8 opacity-40">
             <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500"/><span className="text-[9px] font-black uppercase tracking-widest">Terminal Seguro</span></div>
             <div className="flex items-center gap-2"><Zap size={14} className="text-indigo-500"/><span className="text-[9px] font-black uppercase tracking-widest">Resposta Ativa</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;

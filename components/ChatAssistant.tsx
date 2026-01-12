
import React, { useState, useRef, useEffect } from 'react';
import { Send, Brain, User, Loader2, Sparkles, ShieldCheck, Zap, Trash2, Shield } from 'lucide-react';
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
      text: 'Olá! Sou o assistente de inteligência do S.I.E PRO. Como posso auxiliar na governança do seu cluster hoje?',
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
        text: typeof res.data === 'string' ? res.data : (res.data.text || 'O Kernel não retornou dados válidos.'),
        sender: 'AI',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: 'err',
        text: '⚠️ FALHA DE COMUNICAÇÃO NEURAL: Verifique a saúde da API Gateway no painel de configurações.',
        sender: 'AI',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in pb-8 overflow-hidden">
      <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white shrink-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl animate-pulse">
            <Brain size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tightest uppercase leading-none">SRE Advisor Core</h2>
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1.5 opacity-80">Motor de Decisão Gemini 3 • Governança Ativa</p>
          </div>
        </div>
        <button onClick={() => setMessages([messages[0]])} className="p-4 bg-white/5 hover:bg-rose-500 hover:text-white rounded-2xl transition-all relative z-10 border border-white/5">
          <Trash2 size={20} />
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden flex flex-col relative shadow-inner min-h-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar bg-slate-50/10">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'} animate-scale-in`}>
              <div className={`max-w-[85%] flex gap-6 ${msg.sender === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.sender === 'USER' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-indigo-400'}`}>
                  {msg.sender === 'USER' ? <User size={24}/> : <Sparkles size={24}/>}
                </div>
                <div className={`p-8 rounded-[2.5rem] text-sm md:text-base font-medium leading-relaxed shadow-sm ${msg.sender === 'USER' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-pulse ml-20">
                <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] rounded-tl-none flex items-center gap-5 shadow-sm">
                  <div className="relative">
                    <Loader2 size={24} className="animate-spin text-indigo-600" />
                    <Brain size={12} className="absolute top-1.5 left-1.5 text-indigo-400" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processando Lógica de Governança...</span>
                </div>
            </div>
          )}
        </div>

        <div className="p-10 bg-white border-t border-slate-100 shrink-0">
          <form onSubmit={handleSend} className="relative max-w-6xl mx-auto">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-32 py-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] text-sm md:text-base font-bold outline-none focus:ring-8 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all shadow-inner placeholder:text-slate-300"
              placeholder="Descreva o problema normativo ou solicite um dossiê..."
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-5 bg-slate-900 text-white rounded-full hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-30 active:scale-90"
            >
              <Send size={28} />
            </button>
          </form>
          <div className="mt-6 flex justify-center items-center gap-12 opacity-30">
             <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-500"/><span className="text-[9px] font-black uppercase tracking-widest">Protocolo Seguro JWT</span></div>
             <div className="flex items-center gap-2"><Zap size={16} className="text-indigo-500"/><span className="text-[9px] font-black uppercase tracking-widest">IA Preditiva Ativa</span></div>
             <div className="flex items-center gap-2"><Shield size={16} className="text-indigo-500"/><span className="text-[9px] font-black uppercase tracking-widest">Auditoria SRE</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;

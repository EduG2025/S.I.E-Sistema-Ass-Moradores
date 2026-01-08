
import React, { useState, useRef, useEffect } from 'react';
import { Send, Brain, User, Loader2, Sparkles, ShieldCheck, Zap, X, Trash2, Info } from 'lucide-react';
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
      text: 'Olá! Sou o assistente oficial do S.I.E PRO. Como posso auxiliar na governança ou nas operações hoje?',
      sender: 'AI',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // FIX: Use any to bypass namespace 'React' error
  const handleSend = async (e?: any) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'USER',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const res = await aiService.chat(currentInput);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: res.data.text,
        sender: 'AI',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '⚠️ Erro de conexão com o cluster neural. Por favor, tente novamente em instantes.',
        sender: 'AI',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm("Deseja limpar o histórico desta sessão?")) {
      setMessages([messages[0]]);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in pb-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl">
            <Brain size={24} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tighter">SRE Advisor</h2>
            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-1">
              Neural Gateway Ativo • Gemini 3 Pro
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={clearChat} className="p-3 text-slate-400 hover:bg-slate-100 rounded-2xl transition-all" title="Limpar Chat">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-indigo-500 opacity-30"></div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/30">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[80%] flex gap-4 ${msg.sender === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.sender === 'USER' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
                  {msg.sender === 'USER' ? <User size={20}/> : <Brain size={20}/>}
                </div>
                <div className={`p-5 rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-sm ${msg.sender === 'USER' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className={`text-[9px] mt-2 block opacity-50 font-bold uppercase ${msg.sender === 'USER' ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="max-w-[80%] flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Brain size={20}/>
                </div>
                <div className="p-5 bg-white border border-slate-100 rounded-[1.5rem] rounded-tl-none flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin text-indigo-600" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processando Resposta...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100">
          <form onSubmit={handleSend} className="relative group">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="w-full pl-6 pr-20 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 shadow-inner"
              placeholder="Digite sua dúvida de gestão, técnica ou normativa..."
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3.5 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all disabled:opacity-30 shadow-lg"
            >
              <Send size={20} />
            </button>
          </form>
          <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 opacity-50">
                  <ShieldCheck size={12} className="text-emerald-500"/>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Dados Criptografados</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                  <Zap size={12} className="text-amber-500"/>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Latência: ~350ms</span>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;

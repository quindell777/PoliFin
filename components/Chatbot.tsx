import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles } from 'lucide-react';
import { DashboardSummary } from '../types';
import { createChatSession } from '../services/geminiService';
import { Chat } from "@google/genai";

interface ChatbotProps {
  data: DashboardSummary;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const SUGGESTED_QUESTIONS = [
  "Qual a maior despesa de 2025?",
  "Explique o gráfico de fluxo de caixa",
  "Quanto foi gasto com publicidade?",
  "Quem é o maior doador?"
];

const Chatbot: React.FC<ChatbotProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Olá! Sou seu assistente financeiro PoliFin. Tenho acesso completo aos dados. Como posso ajudar?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("[Chatbot] Component mounted or data updated. Initializing chat session...");
    const initChat = async () => {
      try {
        const session = await createChatSession(data);
        setChatSession(session);
        console.log("[Chatbot] Session initialized.");
      } catch (e) {
        console.error("[Chatbot] Failed to init chat:", e);
      }
    };
    initChat();
  }, [data]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || !chatSession) {
      console.warn("[Chatbot] Send aborted. Empty text or no session.");
      return;
    }

    console.log(`[Chatbot] User sending message: "${text}"`);
    setMessages(prev => [...prev, { role: 'user', text: text }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatSession.sendMessage({ message: text });
      const responseText = response.text || "Desculpe, não consegui processar a resposta.";
      console.log("[Chatbot] Model response received.");
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error("[Chatbot] Error sending message:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Erro ao conectar com o serviço de IA." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => {
            console.log("[Chatbot] Opening UI");
            setIsOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-105 flex items-center gap-2"
        >
          <MessageCircle size={28} />
          <span className="font-semibold hidden sm:inline">Assistente</span>
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-80 sm:w-96 flex flex-col h-[600px] border border-gray-200 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">PoliFin AI</h3>
                <p className="text-xs text-blue-100 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 rounded-full p-1.5 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 max-w-[85%] ${
                  msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'
                }`}
              >
                <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                }`}>
                  {msg.text.split('**').map((part, i) => 
                    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="self-start bg-white border border-gray-100 p-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2 w-16 justify-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chips suggestions */}
          {messages.length < 3 && !isLoading && (
             <div className="px-4 py-2 bg-gray-50 flex gap-2 overflow-x-auto no-scrollbar pb-2">
               {SUGGESTED_QUESTIONS.map((q, i) => (
                 <button
                   key={i}
                   onClick={() => handleSend(q)}
                   className="whitespace-nowrap px-3 py-1.5 bg-white border border-blue-100 text-blue-600 text-xs rounded-full hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-1"
                 >
                   <Sparkles size={12} />
                   {q}
                 </button>
               ))}
             </div>
          )}

          <div className="p-3 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Faça uma pergunta sobre os dados..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-gray-400"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !chatSession || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl p-2.5 transition-colors shadow-sm"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
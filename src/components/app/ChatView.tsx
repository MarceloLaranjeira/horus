import { useState, useRef } from "react";
import { Send, Mic, MicOff, Paperclip, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Olá! 👋 Eu sou o AuraTask, seu assistente pessoal com IA. Posso te ajudar a organizar tarefas, hábitos, finanças, lembretes e muito mais. Como posso te ajudar hoje?",
    timestamp: new Date(),
  },
];

export const ChatView = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulated AI response
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateResponse(input),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    if (!isListening) {
      // Simulate voice recognition
      setTimeout(() => {
        setInput("Preciso terminar o relatório até sexta e pagar a conta de luz amanhã");
        setIsListening(false);
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">Chat com AuraTask IA</h2>
          <p className="text-xs text-muted-foreground">Seu assistente pessoal inteligente</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary border border-border rounded-bl-md"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-secondary border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.1s]" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="px-6 py-4 border-t border-border">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
            <Paperclip className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Digite sua mensagem..."
              className="pr-12 bg-secondary border-border"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVoice}
            className={cn("shrink-0", isListening ? "text-destructive animate-pulse" : "text-muted-foreground")}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Button size="icon" onClick={handleSend} disabled={!input.trim()} className="shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

function generateResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("tarefa") || lower.includes("relatório") || lower.includes("terminar")) {
    return "✅ Pronto! Criei as seguintes tarefas:\n\n📋 **Terminar relatório** — Prazo: Sexta-feira, Prioridade: Alta\n💡 **Pagar conta de luz** — Prazo: Amanhã, Prioridade: Alta\n\nTudo organizado no seu painel de tarefas! Quer adicionar mais alguma coisa?";
  }
  if (lower.includes("finan") || lower.includes("gast") || lower.includes("dinheiro")) {
    return "💰 Aqui está um resumo das suas finanças:\n\n📈 Receitas: R$ 5.300\n📉 Despesas: R$ 930\n💚 Saldo: +R$ 4.370\n\nSeus maiores gastos estão em alimentação e transporte. Quer ver os detalhes?";
  }
  if (lower.includes("hábito") || lower.includes("academia") || lower.includes("meditar")) {
    return "🎯 Hábito criado com sucesso!\n\n**Meditar 15 minutos por dia**\n📊 Meta: 30 dias consecutivos\n🔥 Sequência atual: 0 dias\n\nVou te lembrar todos os dias. Vamos começar amanhã de manhã?";
  }
  return "Entendi! Vou organizar isso para você. 🚀\n\nPosso te ajudar com tarefas, hábitos, finanças, lembretes ou projetos. O que mais posso fazer?";
}

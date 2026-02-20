import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Loader2, MessageCircle, Phone, CheckCircle2, XCircle } from "lucide-react";

interface SentMessage {
  id: string;
  phone: string;
  message: string;
  success: boolean;
  timestamp: Date;
}

export const WhatsAppView = () => {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SentMessage[]>([]);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const sendMessage = async () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Informe um número de telefone válido");
      return;
    }
    if (!message.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp", {
        body: { action: "send_message", phone: cleanPhone, message: message.trim() },
      });

      const entry: SentMessage = {
        id: crypto.randomUUID(),
        phone: cleanPhone,
        message: message.trim(),
        success: !error && data?.success,
        timestamp: new Date(),
      };
      setHistory((prev) => [entry, ...prev]);

      if (error || !data?.success) {
        toast.error(data?.error || error?.message || "Erro ao enviar mensagem");
      } else {
        toast.success("Mensagem enviada!");
        setMessage("");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro inesperado");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">WhatsApp</h1>
        <p className="text-muted-foreground">Envie mensagens via Evolution API.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Send message form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="w-5 h-5 text-primary" />
              Nova Mensagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="w-3.5 h-3.5 inline mr-1" />
                Número do telefone
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                maxLength={16}
              />
              <p className="text-xs text-muted-foreground">
                Formato: DDD + número (com ou sem código do país)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                rows={5}
                maxLength={4096}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Enter para enviar, Shift+Enter para nova linha</span>
                <span>{message.length}/4096</span>
              </div>
            </div>

            <Button
              onClick={sendMessage}
              disabled={sending || !phone || !message.trim()}
              className="w-full"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {sending ? "Enviando..." : "Enviar Mensagem"}
            </Button>
          </CardContent>
        </Card>

        {/* Message history */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Send className="w-5 h-5 text-primary" />
              Mensagens Enviadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma mensagem enviada nesta sessão.
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium font-mono">
                        {item.phone}
                      </span>
                      <Badge
                        variant={item.success ? "default" : "destructive"}
                        className="gap-1 text-xs"
                      >
                        {item.success ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {item.success ? "Enviada" : "Falhou"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.timestamp.toLocaleTimeString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

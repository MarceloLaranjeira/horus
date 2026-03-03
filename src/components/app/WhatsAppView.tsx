import { useState, useEffect, useRef } from "react";
import { useWhatsApp, WhatsAppConversation } from "@/hooks/useWhatsApp";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Loader2, ArrowLeft, RefreshCw, Plus, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

export const WhatsAppView = () => {
  const { conversations, messages, loading, loadingMessages, sending, fetchConversations, fetchMessages, sendMessage } = useWhatsApp();
  const isMobile = useIsMobile();
  const [selectedContact, setSelectedContact] = useState<WhatsAppConversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openChat = async (conv: WhatsAppConversation) => {
    setSelectedContact(conv);
    await fetchMessages(conv.contact_phone);
  };

  const handleSend = async () => {
    if (!messageText.trim() || !selectedContact) return;
    try {
      await sendMessage(selectedContact.contact_phone, messageText, selectedContact.contact_name);
      setMessageText("");
      await fetchMessages(selectedContact.contact_phone);
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar");
    }
  };

  const handleNewChat = async () => {
    if (!newPhone.trim()) { toast.error("Informe o número"); return; }
    const phone = newPhone.replace(/\D/g, "");
    const conv: WhatsAppConversation = {
      contact_phone: phone,
      contact_name: newName || phone,
      last_message: "",
      last_date: new Date().toISOString(),
      unread: 0,
    };
    setSelectedContact(conv);
    setShowNewChat(false);
    setNewPhone("");
    setNewName("");
    setNewPhone("");
    setNewName("");
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      const now = new Date();
      if (d.toDateString() === now.toDateString()) return format(d, "HH:mm");
      return format(d, "dd/MM HH:mm", { locale: ptBR });
    } catch { return ""; }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversations list */}
      <div className={cn(
        "flex flex-col overflow-hidden border-r border-border/30 transition-all",
        selectedContact ? (isMobile ? "hidden" : "w-80") : "flex-1"
      )}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 shrink-0">
          <MessageCircle className="w-5 h-5" style={{ color: "#25D366" }} />
          <h1 className="text-lg font-semibold">WhatsApp</h1>
          <div className="flex-1" />
          <Button variant="outline" size="icon" onClick={fetchConversations} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setShowNewChat(true)} style={{ backgroundColor: "#25D366" }}>
            <Plus className="w-4 h-4" /> Nova
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
              <p className="text-xs text-muted-foreground mt-1">Clique em "Nova" para enviar uma mensagem</p>
            </div>
          ) : (
            <div>
              {conversations.map((conv) => (
                <div
                  key={conv.contact_phone}
                  onClick={() => openChat(conv)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 border-b border-border/20 cursor-pointer hover:bg-accent/30 transition-colors",
                    selectedContact?.contact_phone === conv.contact_phone && "bg-accent/40"
                  )}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#25D36620" }}>
                    <User className="w-5 h-5" style={{ color: "#25D366" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{conv.contact_name}</p>
                      <span className="text-[11px] text-muted-foreground shrink-0">{formatDate(conv.last_date)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message || "..."}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat view */}
      <AnimatePresence>
        {selectedContact && (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setSelectedContact(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#25D36620" }}>
                <User className="w-4 h-4" style={{ color: "#25D366" }} />
              </div>
              <div>
                <p className="text-sm font-semibold">{selectedContact.contact_name}</p>
                <p className="text-xs text-muted-foreground">{selectedContact.contact_phone}</p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda. Envie a primeira!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.direction === "outgoing" ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                        msg.direction === "outgoing"
                          ? "bg-[#25D366]/20 text-foreground"
                          : "bg-accent/40 text-foreground"
                      )}>
                        <p className="whitespace-pre-wrap">{msg.message_text}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 text-right">{formatDate(msg.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="flex items-center gap-2 px-4 py-3 border-t border-border/30 shrink-0">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              />
              <Button size="icon" onClick={handleSend} disabled={sending || !messageText.trim()} style={{ backgroundColor: "#25D366" }}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New chat dialog */}
      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Número (com DDI, ex: 5511999999999)</Label>
              <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="5511999999999" />
            </div>
            <div>
              <Label>Nome do contato (opcional)</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="João Silva" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewChat(false)}>Cancelar</Button>
            <Button onClick={handleNewChat} style={{ backgroundColor: "#25D366" }}>Iniciar Conversa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

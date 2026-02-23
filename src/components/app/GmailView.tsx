import { useState, useEffect } from "react";
import { useGmail, GmailMessage } from "@/hooks/useGmail";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Mail, Inbox, Search, RefreshCw, Loader2, Send, ArrowLeft,
  Pencil, Star, MailOpen, X,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

export const GmailView = () => {
  const { emails, loading, fetchEmails, readEmail, readingEmail, selectedEmail, clearSelectedEmail, sendEmail, sending } = useGmail();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("in:inbox");
  const [showCompose, setShowCompose] = useState(false);
  const [compose, setCompose] = useState({ to: "", subject: "", body: "" });

  useEffect(() => { fetchEmails(20, searchQuery); }, []);

  const handleSearch = () => fetchEmails(20, searchQuery);

  const handleSend = async () => {
    if (!compose.to || !compose.subject) { toast.error("Preencha destinatário e assunto"); return; }
    try {
      await sendEmail(compose.to, compose.subject, compose.body);
      toast.success("Email enviado!");
      setShowCompose(false);
      setCompose({ to: "", subject: "", body: "" });
      fetchEmails(20, searchQuery);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleReply = (email: GmailMessage) => {
    const fromMatch = email.from?.match(/<(.+?)>/);
    const replyTo = fromMatch ? fromMatch[1] : email.from;
    setCompose({
      to: replyTo,
      subject: `Re: ${email.subject}`,
      body: `\n\n---\nDe: ${email.from}\n${email.body || email.snippet}`,
    });
    setShowCompose(true);
    clearSelectedEmail();
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) return format(d, "HH:mm");
      return format(d, "dd MMM", { locale: ptBR });
    } catch { return dateStr; }
  };

  const extractName = (from: string) => {
    const match = from?.match(/^(.+?)\s*</);
    return match ? match[1].replace(/"/g, "") : from?.split("@")[0] || "";
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Email list */}
      <div className={cn("flex flex-col overflow-hidden border-r border-border/30 transition-all", selectedEmail ? (isMobile ? "hidden" : "w-96") : "flex-1")}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 shrink-0">
          <Inbox className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">Gmail</h1>
          <div className="flex-1" />
          <Button variant="outline" size="icon" onClick={() => fetchEmails(20, searchQuery)} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setShowCompose(true)}>
            <Pencil className="w-4 h-4" /> Compor
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-border/30 shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Buscar emails..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()} />
            </div>
          </div>
        </div>

        {/* Email list */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : emails.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum email encontrado</p>
            </div>
          ) : (
            <div>
              {emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => readEmail(email.id)}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 border-b border-border/20 cursor-pointer hover:bg-accent/30 transition-colors",
                    email.isUnread && "bg-accent/10",
                    selectedEmail?.id === email.id && "bg-accent/40"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm truncate", email.isUnread && "font-semibold")}>
                        {extractName(email.from)}
                      </p>
                      <span className="text-[11px] text-muted-foreground shrink-0">{formatDate(email.date)}</span>
                    </div>
                    <p className={cn("text-sm truncate", email.isUnread ? "font-medium" : "text-muted-foreground")}>
                      {email.subject || "(sem assunto)"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{email.snippet}</p>
                  </div>
                  {email.isUnread && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Email reader */}
      <AnimatePresence>
        {selectedEmail && (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 shrink-0">
              <Button variant="ghost" size="icon" onClick={clearSelectedEmail}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2 className="font-semibold truncate flex-1">{selectedEmail.subject}</h2>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => handleReply(selectedEmail)}>
                <Send className="w-3 h-3" /> Responder
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4">
              {readingEmail ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{extractName(selectedEmail.from)}</p>
                      <p className="text-xs text-muted-foreground">{selectedEmail.from}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Para: {selectedEmail.to}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(selectedEmail.date)}</span>
                  </div>
                  <div className="border-t border-border/30 pt-4">
                    <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{selectedEmail.body || selectedEmail.snippet}</pre>
                  </div>
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compose dialog */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compor Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Para</Label>
              <Input value={compose.to} onChange={e => setCompose(p => ({ ...p, to: e.target.value }))} placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label>Assunto</Label>
              <Input value={compose.subject} onChange={e => setCompose(p => ({ ...p, subject: e.target.value }))} placeholder="Assunto..." />
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea value={compose.body} onChange={e => setCompose(p => ({ ...p, body: e.target.value }))} placeholder="Escreva sua mensagem..." rows={8} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompose(false)}>Cancelar</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Send className="w-4 h-4 mr-1.5" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

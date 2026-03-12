import { useState, useEffect, useRef, useMemo, type KeyboardEvent } from "react";
import { useWhatsApp, WhatsAppConversation, type WhatsAppMessage } from "@/hooks/useWhatsApp";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle,
  Send,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Plus,
  User,
  QrCode,
  Smartphone,
  PowerOff,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Bot,
  Save,
  Play,
  Smile,
  Paperclip,
  Camera,
  Mic,
  Check,
  CheckCheck,
  Phone,
  Video,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const connectionStateLabel: Record<string, string> = {
  connected: "Conectado",
  open: "Conectado",
  online: "Conectado",
  ready: "Conectado",
  connecting: "Conectando",
  connecting_browser: "Conectando",
  disconnected: "Desconectado",
  close: "Desconectado",
  closed: "Desconectado",
  qrcode: "Aguardando QR",
};

const emojiSections = [
  {
    label: "Reacoes",
    emojis: ["ðŸ˜€", "ðŸ˜ƒ", "ðŸ˜„", "ðŸ˜", "ðŸ˜…", "ðŸ˜‚", "ðŸ¤£", "ðŸ˜Š", "ðŸ˜", "ðŸ˜˜", "ðŸ˜Ž", "ðŸ¤©"],
  },
  {
    label: "Gestos",
    emojis: ["ðŸ‘", "ðŸ‘Ž", "ðŸ‘", "ðŸ™Œ", "ðŸ™", "ðŸ¤", "ðŸ‘Œ", "âœŒï¸", "ðŸ¤Ÿ", "ðŸ‘Š", "ðŸ¤ž", "ðŸ«¶"],
  },
  {
    label: "Objetos",
    emojis: ["ðŸ”¥", "âœ¨", "ðŸŽ‰", "ðŸ’š", "â¤ï¸", "ðŸ’™", "âœ…", "âŒ", "âš¡", "ðŸ“Œ", "ðŸ“Ž", "ðŸŽ¯"],
  },
  {
    label: "Atalhos",
    emojis: ["ðŸ¤–", "ðŸ§ ", "ðŸ“ž", "ðŸ’¬", "ðŸ•’", "ðŸ’¼", "ðŸ“Š", "ðŸ’°", "ðŸ", "ðŸš€", "ðŸ‘€", "âš ï¸"],
  },
];

const formatConnectionState = (state: string) => connectionStateLabel[state?.toLowerCase()] || state || "Desconhecido";

type TimelineItem =
  | { type: "day"; key: string; label: string }
  | { type: "message"; key: string; message: WhatsAppMessage };

const getDayKey = (dateStr: string | null | undefined) => {
  if (!dateStr) return "sem-data";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "sem-data";
  return format(d, "yyyy-MM-dd");
};

const formatMessageDayLabel = (dateStr: string | null | undefined) => {
  if (!dateStr) return "Sem data";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Sem data";

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === now.toDateString()) return "Hoje";
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";

  return format(d, "dd 'de' MMMM", { locale: ptBR });
};

const formatMessageTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "HH:mm");
};

const resolveMessageIdentity = (message: Partial<WhatsAppMessage>) => {
  const messageKey = String(message.message_key || "").trim();
  if (messageKey) return messageKey;

  const waId = String(message.wa_message_id || "").trim();
  if (waId) return `wa:${waId}`;

  const id = String(message.id || "").trim();
  if (id) return `id:${id}`;

  return `tmp:${message.direction || "unknown"}|${message.created_at || ""}|${message.message_text || ""}`;
};
const renderStatusIcon = (status: string) => {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("read") || normalized.includes("seen")) {
    return <CheckCheck className="h-3.5 w-3.5 text-sky-500" />;
  }

  if (normalized.includes("deliver")) {
    return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
  }

  return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
};

export const WhatsAppView = () => {
  const {
    conversations,
    messages,
    loading,
    loadingMessages,
    sending,
    connected,
    connectionState,
    qrCode,
    instanceName,
    connectionDiagnostic,
    connectionLoading,
    disconnecting,
    resetting,
    fetchConnectionStatus,
    disconnectSession,
    resetConnection,
    fetchConversations,
    fetchMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    deleteConversation,
    botConfig,
    configLoading,
    savingConfig,
    syncingAutoReply,
    fetchBotConfig,
    saveBotConfig,
    syncAutoReply,
  } = useWhatsApp();

  const [selectedContact, setSelectedContact] = useState<WhatsAppConversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");

  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyPhone, setAutoReplyPhone] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [autoReplyPrompt, setAutoReplyPrompt] = useState("");
  const [editingMessage, setEditingMessage] = useState<{ id: string; text: string } | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<{ id: string; text: string } | null>(null);
  const [confirmDeleteConversation, setConfirmDeleteConversation] = useState(false);
  const [messageActionLoading, setMessageActionLoading] = useState(false);
  const [conversationActionLoading, setConversationActionLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchConnectionStatus(true).catch((e: any) => {
      toast.error(e?.message || "Erro ao verificar conexao do WhatsApp");
    });

    fetchBotConfig().catch((e: any) => {
      toast.error(e?.message || "Erro ao carregar configuracao do bot");
    });
  }, [fetchBotConfig, fetchConnectionStatus]);

  useEffect(() => {
    setAutoReplyEnabled(Boolean(botConfig.auto_reply_enabled));
    setAutoReplyPhone(botConfig.auto_reply_phone || "");
    setOwnerPhone(botConfig.owner_phone || "");
    setAutoReplyPrompt(botConfig.auto_reply_prompt || "");
  }, [botConfig]);

  useEffect(() => {
    if (!connected) return;
    fetchConversations().catch((e: any) => {
      toast.error(e?.message || "Erro ao carregar conversas");
    });
  }, [connected, fetchConversations]);

  useEffect(() => {
    if (connected) return;

    let cancelled = false;
    let inFlight = false;
    let timer: number | null = null;

    const schedule = (delay: number) => {
      timer = window.setTimeout(tick, delay);
    };

    const tick = async () => {
      if (cancelled) return;

      if (document.hidden) {
        schedule(15000);
        return;
      }

      if (inFlight) {
        schedule(8000);
        return;
      }

      inFlight = true;
      try {
        await fetchConnectionStatus(false, { silent: true });
      } catch {
        // poll silencioso
      } finally {
        inFlight = false;
        schedule(12000);
      }
    };

    schedule(4000);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [connected, fetchConnectionStatus]);

  useEffect(() => {
    if (!connected || !autoReplyEnabled) return;

    let cancelled = false;
    let inFlight = false;
    let timer: number | null = null;

    const schedule = (delay: number) => {
      timer = window.setTimeout(tick, delay);
    };

    const tick = async () => {
      if (cancelled) return;

      if (document.hidden) {
        schedule(30000);
        return;
      }

      if (inFlight) {
        schedule(10000);
        return;
      }

      inFlight = true;
      try {
        await syncAutoReply({ silent: true });
      } catch {
        // silencioso no polling
      } finally {
        inFlight = false;
        schedule(25000);
      }
    };

    void tick();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [autoReplyEnabled, connected, syncAutoReply]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!connected || !selectedContact?.contact_phone) return;

    const contactPhone = selectedContact.contact_phone;
    let cancelled = false;
    let inFlight = false;
    let timer: number | null = null;
    let cycle = 0;

    const schedule = (delay: number) => {
      timer = window.setTimeout(tick, delay);
    };

    const tick = async () => {
      if (cancelled) return;

      if (document.hidden) {
        schedule(12000);
        return;
      }

      if (inFlight) {
        schedule(4000);
        return;
      }

      inFlight = true;
      try {
        await fetchMessages(contactPhone, { silent: true });

        if (cycle % 3 === 0) {
          await fetchConversations({ silent: true });
        }

        cycle += 1;
      } catch {
        // poll silencioso
      } finally {
        inFlight = false;
        schedule(6000);
      }
    };

    schedule(3000);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [connected, selectedContact?.contact_phone, fetchMessages, fetchConversations]);

  const openChat = async (conv: WhatsAppConversation) => {
    setSelectedContact(conv);
    try {
      await fetchMessages(conv.contact_phone);
      window.requestAnimationFrame(() => composerRef.current?.focus());
    } catch (e: any) {
      toast.error(e?.message || "Erro ao carregar mensagens");
    }
  };

  const resizeComposer = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const handleSend = async () => {
    if (!selectedContact) return;

    const cleanedMessage = messageText.trim();
    if (!cleanedMessage) return;

    try {
      await sendMessage(selectedContact.contact_phone, cleanedMessage, selectedContact.contact_name);
      setMessageText("");
      window.requestAnimationFrame(() => {
        resizeComposer(composerRef.current);
        composerRef.current?.focus();
      });
      await fetchMessages(selectedContact.contact_phone);
      await fetchConversations();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao enviar");
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const appendEmoji = (emoji: string) => {
    const composer = composerRef.current;

    if (!composer) {
      setMessageText((prev) => `${prev}${emoji}`);
      return;
    }

    const start = composer.selectionStart ?? messageText.length;
    const end = composer.selectionEnd ?? messageText.length;

    setMessageText((prev) => {
      const nextText = `${prev.slice(0, start)}${emoji}${prev.slice(end)}`;

      window.requestAnimationFrame(() => {
        const input = composerRef.current;
        if (!input) return;
        input.focus();
        const cursor = start + emoji.length;
        input.setSelectionRange(cursor, cursor);
        resizeComposer(input);
      });

      return nextText;
    });
  };

  const handleFeatureNotice = (featureName: string) => {
    toast.info(`${featureName} sera habilitado em breve nesta integracao.`);
  };

  const openEditDialog = (message: WhatsAppMessage) => {
    if (message.direction !== "outgoing") {
      toast.info("A edicao esta disponivel apenas para mensagens enviadas.");
      return;
    }

    setEditingMessage({
      id: resolveMessageIdentity(message),
      text: message.message_text || "",
    });
  };

  const confirmEditMessage = async () => {
    if (!selectedContact || !editingMessage) return;

    const nextText = editingMessage.text.trim();
    if (!nextText) {
      toast.error("Informe o novo texto da mensagem.");
      return;
    }

    setMessageActionLoading(true);
    try {
      await editMessage(selectedContact.contact_phone, editingMessage.id, nextText);
      setEditingMessage(null);
      await fetchMessages(selectedContact.contact_phone, { silent: true });
      await fetchConversations({ silent: true });
      toast.success("Mensagem editada.");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao editar mensagem");
    } finally {
      setMessageActionLoading(false);
    }
  };

  const openDeleteMessageDialog = (message: WhatsAppMessage) => {
    setDeletingMessage({
      id: resolveMessageIdentity(message),
      text: String(message.message_text || ""),
    });
  };

  const confirmDeleteMessage = async () => {
    if (!selectedContact || !deletingMessage) return;

    setMessageActionLoading(true);
    try {
      await deleteMessage(selectedContact.contact_phone, deletingMessage.id);
      setDeletingMessage(null);
      await fetchMessages(selectedContact.contact_phone, { silent: true });
      await fetchConversations({ silent: true });
      toast.success("Mensagem apagada.");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao apagar mensagem");
    } finally {
      setMessageActionLoading(false);
    }
  };

  const confirmConversationDelete = async () => {
    if (!selectedContact) return;

    setConversationActionLoading(true);
    try {
      await deleteConversation(selectedContact.contact_phone);
      setConfirmDeleteConversation(false);
      setSelectedContact(null);
      await fetchConversations({ silent: true });
      toast.success("Conversa excluida.");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao excluir conversa");
    } finally {
      setConversationActionLoading(false);
    }
  };

  const handleNewChat = async () => {
    if (!newPhone.trim()) {
      toast.error("Informe o numero");
      return;
    }
    const phone = newPhone.replace(/\D/g, "");
    if (!phone) {
      toast.error("Numero invalido");
      return;
    }
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

    window.requestAnimationFrame(() => composerRef.current?.focus());
  };

  const handleResetIntegration = async () => {
    try {
      await resetConnection();
      toast.success("Integracao resetada. Escaneie o novo QR Code.");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao resetar integracao");
    }
  };

  const handleSaveBotConfig = async () => {
    try {
      await saveBotConfig({
        auto_reply_enabled: autoReplyEnabled,
        auto_reply_phone: autoReplyPhone,
        owner_phone: ownerPhone,
        auto_reply_prompt: autoReplyPrompt,
      });
      toast.success("Configuracao do Horus no WhatsApp salva");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar configuracao");
    }
  };

  const handleSyncNow = async () => {
    try {
      const result = await syncAutoReply();
      toast.success(`Sincronizacao concluida. Processadas: ${result?.processed || 0}, respondidas: ${result?.replied || 0}`);
      if (selectedContact) {
        await fetchMessages(selectedContact.contact_phone);
      }
      await fetchConversations();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao sincronizar auto-respostas");
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return "";
      const now = new Date();
      if (d.toDateString() === now.toDateString()) return format(d, "HH:mm");
      return format(d, "dd/MM HH:mm", { locale: ptBR });
    } catch {
      return "";
    }
  };

  const sortedMessages = useMemo(() => {
    const unique = new Map<string, WhatsAppMessage>();

    for (const message of messages) {
      const key = resolveMessageIdentity(message);
      const current = unique.get(key);

      if (!current) {
        unique.set(key, message);
        continue;
      }

      const currentTime = new Date(current.created_at || 0).getTime();
      const nextTime = new Date(message.created_at || 0).getTime();
      const shouldReplace =
        (Number.isFinite(nextTime) && Number.isFinite(currentTime) && nextTime >= currentTime) ||
        (!!message.edited && !current.edited);

      if (shouldReplace) {
        unique.set(key, {
          ...current,
          ...message,
          message_key: message.message_key || current.message_key || key,
        });
      }
    }

    const cloned = Array.from(unique.values());
    cloned.sort((a, b) => {
      const left = new Date(a.created_at).getTime();
      const right = new Date(b.created_at).getTime();
      return left - right;
    });

    return cloned;
  }, [messages]);

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    let lastDayKey = "";

    for (const msg of sortedMessages) {
      const currentDayKey = getDayKey(msg.created_at);
      if (currentDayKey !== lastDayKey) {
        items.push({
          type: "day",
          key: `day-${currentDayKey}`,
          label: formatMessageDayLabel(msg.created_at),
        });
        lastDayKey = currentDayKey;
      }

      items.push({
        type: "message",
        key: `msg-${resolveMessageIdentity(msg)}`,
        message: msg,
      });
    }

    return items;
  }, [sortedMessages]);

  const renderBotConfigCard = () => (
    <div className="space-y-3 rounded-xl border border-border/50 bg-secondary/20 p-4">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Horus Auto-resposta</p>
        <div className="ml-auto text-[10px] text-muted-foreground">
          {configLoading ? "carregando..." : autoReplyEnabled ? "ativo" : "inativo"}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Numero alvo (opcional)</Label>
          <Input
            value={autoReplyPhone}
            onChange={(e) => setAutoReplyPhone(e.target.value)}
            placeholder="5511999999999"
          />
          <p className="text-[11px] text-muted-foreground">Se vazio, responde qualquer contato recebido.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Numero do usuario (opcional)</Label>
          <Input
            value={ownerPhone}
            onChange={(e) => setOwnerPhone(e.target.value)}
            placeholder="5511999999999"
          />
          <p className="text-[11px] text-muted-foreground">Campo reservado para alertas futuros no WhatsApp.</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Instrucao do Horus para resposta</Label>
        <Textarea
          value={autoReplyPrompt}
          onChange={(e) => setAutoReplyPrompt(e.target.value)}
          placeholder="Ex: Responda de forma curta, profissional e cordial."
          className="min-h-[90px]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={autoReplyEnabled ? "default" : "outline"}
          onClick={() => setAutoReplyEnabled((prev) => !prev)}
        >
          {autoReplyEnabled ? "Auto-resposta ativada" : "Ativar auto-resposta"}
        </Button>

        <Button type="button" variant="outline" onClick={handleSaveBotConfig} disabled={savingConfig}>
          {savingConfig ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
          Salvar
        </Button>

        <Button type="button" variant="outline" onClick={handleSyncNow} disabled={syncingAutoReply || !connected}>
          {syncingAutoReply ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Play className="mr-1 h-4 w-4" />}
          Sincronizar agora
        </Button>
      </div>
    </div>
  );

  const renderConnectPanel = () => (
    <div className="h-full w-full p-6 md:p-8">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-center">
        <div className="w-full rounded-2xl border border-border/50 bg-card/70 p-6 shadow-xl backdrop-blur md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#25D3661A] p-3">
                <MessageCircle className="h-6 w-6 text-[#25D366]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Conectar WhatsApp por QR Code</h1>
                <p className="text-sm text-muted-foreground">Escaneie o QR com seu celular para liberar o atendimento no Horus.</p>
              </div>
            </div>
            <div className={cn("rounded-full px-3 py-1 text-xs font-semibold", connected ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400")}>
              {formatConnectionState(connectionState)}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[330px_1fr]">
            <div className="rounded-xl border border-border/50 bg-secondary/25 p-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                <QrCode className="h-4 w-4 text-primary" />
                QR Code da sessao
              </div>

              <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-border/40 bg-background/70 p-4">
                {connectionLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : qrCode ? (
                  <img src={qrCode} alt="QR Code WhatsApp" className="h-64 w-64 rounded-md border border-border/50 bg-white object-contain p-2" />
                ) : (
                  <div className="text-center">
                    <AlertCircle className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">QR ainda nao disponivel.</p>
                    <p className="mt-1 text-xs text-muted-foreground">Clique em "Gerar QR Code" para atualizar.</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <Button onClick={() => fetchConnectionStatus(true).catch((e: any) => toast.error(e?.message || "Erro ao gerar QR"))} disabled={connectionLoading || resetting} className="gap-2">
                  {connectionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                  Gerar QR Code
                </Button>
                <Button variant="outline" onClick={() => fetchConnectionStatus(false).catch((e: any) => toast.error(e?.message || "Erro ao atualizar"))} disabled={connectionLoading || resetting} className="gap-2">
                  <RefreshCw className={cn("h-4 w-4", connectionLoading && "animate-spin")} />
                  Atualizar status
                </Button>
                <Button variant="outline" onClick={handleResetIntegration} disabled={resetting || connectionLoading} className="gap-2">
                  {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  Resetar integracao
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border/50 bg-secondary/20 p-5">
                <h2 className="mb-3 text-sm font-semibold">Como conectar</h2>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Abra o WhatsApp no seu celular.</li>
                  <li>2. Toque em Menu &gt; Aparelhos conectados.</li>
                  <li>3. Toque em "Conectar aparelho".</li>
                  <li>4. Escaneie o QR Code exibido aqui.</li>
                </ol>

                <div className="mt-6 rounded-lg border border-border/40 bg-background/60 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Smartphone className="h-4 w-4 text-primary" />
                    Sessao
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Estado atual: <span className="font-medium text-foreground">{formatConnectionState(connectionState)}</span>
                  </p>
                  {instanceName && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Instancia: <span className="font-mono">{instanceName}</span>
                    </p>
                  )}
                </div>

                {connectionDiagnostic && (
                  <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    {connectionDiagnostic}
                  </div>
                )}
              </div>

              {renderBotConfigCard()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const canSendMessage = Boolean(messageText.trim());

  const renderConnectedPanel = () => (
    <div className="flex h-full overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden border-r border-border/30 md:w-80 md:flex-none">
        <div className="flex items-center gap-2 border-b border-border/30 px-4 py-3">
          <MessageCircle className="h-5 w-5 text-[#25D366]" />
          <h1 className="text-lg font-semibold">WhatsApp</h1>
          <div className="ml-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            <CheckCircle2 className="mr-1 inline h-3 w-3" />
            Conectado
          </div>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleFeatureNotice("Busca de mensagens")}
            title="Buscar"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => fetchConversations().catch((e: any) => toast.error(e?.message || "Erro ao atualizar"))} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button variant="outline" size="icon" onClick={handleResetIntegration} disabled={resetting || disconnecting} title="Resetar integracao WhatsApp">
            {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              disconnectSession()
                .then(() => toast.success("WhatsApp desconectado"))
                .catch((e: any) => toast.error(e?.message || "Erro ao desconectar"))
            }
            disabled={disconnecting || resetting}
            title="Desconectar WhatsApp"
          >
            {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PowerOff className="h-4 w-4" />}
          </Button>
          <Button size="sm" className="gap-1.5 bg-[#25D366] text-black hover:bg-[#25D366]/90" onClick={() => setShowNewChat(true)}>
            <Plus className="h-4 w-4" /> Nova
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : conversations.length === 0 ? (
            <div className="py-12 text-center">
              <MessageCircle className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
              <p className="mt-1 text-xs text-muted-foreground">Clique em "Nova" para iniciar uma conversa</p>
            </div>
          ) : (
            <div>
              {conversations.map((conv) => (
                <div
                  key={conv.contact_phone}
                  onClick={() => openChat(conv)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 border-b border-border/20 px-4 py-3 transition-colors hover:bg-accent/30",
                    selectedContact?.contact_phone === conv.contact_phone && "bg-accent/40"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D36620]">
                    <User className="h-5 w-5 text-[#25D366]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{conv.contact_name}</p>
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(conv.last_date)}</span>
                        {conv.unread > 0 && (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#25D366] px-1.5 text-[10px] font-bold text-black">
                            {conv.unread > 99 ? "99+" : conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{conv.last_message || "..."}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="hidden overflow-auto border-r border-border/30 p-4 lg:flex lg:w-[380px]">
        <div className="w-full">{renderBotConfigCard()}</div>
      </div>

      <AnimatePresence>
        {selectedContact && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-border/30 bg-card/60 px-4 py-3 backdrop-blur">
              <Button variant="ghost" size="icon" onClick={() => setSelectedContact(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D36620]">
                <User className="h-4 w-4 text-[#25D366]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{selectedContact.contact_name}</p>
                <p className="truncate text-xs text-muted-foreground">{selectedContact.contact_phone}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleFeatureNotice("Ligacao de voz")} title="Ligar">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleFeatureNotice("Videochamada")} title="Videochamada">
                <Video className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" title="Mais opcoes">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setConfirmDeleteConversation(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir conversa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <ScrollArea className="flex-1 bg-[radial-gradient(circle_at_15%_20%,rgba(37,211,102,0.07),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(14,165,233,0.08),transparent_40%)]">
              {loadingMessages ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : sortedMessages.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda. Envie a primeira.</p>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-3xl space-y-2 p-4">
                  {timelineItems.map((item) => {
                    if (item.type === "day") {
                      return (
                        <div key={item.key} className="my-3 flex justify-center">
                          <span className="rounded-full border border-border/50 bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">
                            {item.label}
                          </span>
                        </div>
                      );
                    }

                    const msg = item.message;
                    const isOutgoing = msg.direction === "outgoing";

                    return (
                      <div key={item.key} className={cn("group flex", isOutgoing ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[86%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                            isOutgoing
                              ? "rounded-br-md bg-[#25D366]/20 text-foreground"
                              : "rounded-bl-md border border-border/40 bg-card/75 text-foreground"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.message_text}</p>
                          <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
                            {msg.edited && <span className="italic">editada</span>}
                            <span>{formatMessageTime(msg.created_at)}</span>
                            {isOutgoing && renderStatusIcon(msg.status)}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-1 h-8 w-8 self-end rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                              title="Acoes da mensagem"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isOutgoing ? "end" : "start"} className="w-44">
                            {isOutgoing && (
                              <DropdownMenuItem onClick={() => openEditDialog(msg)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar mensagem
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => openDeleteMessageDialog(msg)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Apagar mensagem
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="border-t border-border/30 bg-card/60 px-3 py-2 backdrop-blur">
              <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
                <div className="flex flex-1 items-end gap-1 rounded-2xl border border-border/50 bg-background/70 px-2 py-1.5">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
                        <Smile className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[320px] space-y-2 p-3">
                      {emojiSections.map((section) => (
                        <div key={section.label} className="space-y-1">
                          <p className="text-[11px] font-medium text-muted-foreground">{section.label}</p>
                          <div className="grid grid-cols-6 gap-1">
                            {section.emojis.map((emoji) => (
                              <Button
                                key={`${section.label}-${emoji}`}
                                type="button"
                                variant="ghost"
                                className="h-8 w-8 rounded-md p-0 text-lg"
                                onClick={() => appendEmoji(emoji)}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full text-muted-foreground"
                    onClick={() => handleFeatureNotice("Envio de anexo")}
                    title="Anexar arquivo"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full text-muted-foreground"
                    onClick={() => handleFeatureNotice("Captura por camera")}
                    title="Camera"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>

                  <Textarea
                    ref={composerRef}
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      resizeComposer(e.target);
                    }}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Digite uma mensagem"
                    className="max-h-[140px] min-h-[38px] flex-1 resize-none border-0 bg-transparent p-2 text-sm shadow-none focus-visible:ring-0"
                    rows={1}
                  />
                </div>

                <Button
                  size="icon"
                  onClick={canSendMessage ? () => void handleSend() : () => handleFeatureNotice("Mensagem de voz")}
                  disabled={sending}
                  className="h-11 w-11 rounded-full bg-[#25D366] text-black hover:bg-[#25D366]/90"
                  title={canSendMessage ? "Enviar" : "Gravar audio"}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : canSendMessage ? <Send className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="h-full overflow-hidden">
      {!connected ? renderConnectPanel() : renderConnectedPanel()}

      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova conversa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Numero (com DDI, ex: 5511999999999)</Label>
              <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="5511999999999" />
            </div>
            <div>
              <Label>Nome do contato (opcional)</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Joao Silva" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewChat(false)}>Cancelar</Button>
            <Button onClick={handleNewChat} className="bg-[#25D366] text-black hover:bg-[#25D366]/90">Iniciar conversa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingMessage)} onOpenChange={(open) => !open && setEditingMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar mensagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Novo texto</Label>
            <Textarea
              value={editingMessage?.text || ""}
              onChange={(e) => setEditingMessage((prev) => (prev ? { ...prev, text: e.target.value } : prev))}
              className="min-h-[100px]"
              placeholder="Digite a nova mensagem"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMessage(null)} disabled={messageActionLoading}>
              Cancelar
            </Button>
            <Button onClick={confirmEditMessage} disabled={messageActionLoading}>
              {messageActionLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Pencil className="mr-1 h-4 w-4" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingMessage)} onOpenChange={(open) => !open && setDeletingMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apagar mensagem</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Deseja apagar esta mensagem?</p>
          <div className="max-h-28 overflow-auto rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            {deletingMessage?.text || "-"}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingMessage(null)} disabled={messageActionLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteMessage} disabled={messageActionLoading}>
              {messageActionLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
              Apagar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteConversation} onOpenChange={setConfirmDeleteConversation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir conversa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta acao remove o historico da conversa desta tela. Deseja continuar?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteConversation(false)} disabled={conversationActionLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmConversationDelete} disabled={conversationActionLoading}>
              {conversationActionLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
              Excluir conversa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};













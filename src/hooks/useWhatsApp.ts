import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp`;

async function callWhatsAppFn(action: string, body: any = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Não autenticado");

  let res: Response;
  try {
    res = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, ...body }),
    });
  } catch (e) {
    console.error("WhatsApp network error:", e);
    throw new Error("Erro de conexão com o servidor");
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Erro ao processar resposta (status ${res.status})`);
  }

  if (!res.ok) throw new Error(data?.error || "Erro na API");
  return data;
}

export interface WhatsAppConversation {
  contact_phone: string;
  contact_name: string;
  last_message: string;
  last_date: string;
  unread: number;
}

export interface WhatsAppMessage {
  id: string;
  contact_phone: string;
  contact_name: string | null;
  direction: "incoming" | "outgoing";
  message_text: string;
  created_at: string;
  status: string;
}

export function useWhatsApp() {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callWhatsAppFn("list_conversations");
      setConversations(data.conversations || []);
    } catch (e) {
      console.error("WhatsApp conversations error:", e);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (contactPhone: string) => {
    setLoadingMessages(true);
    try {
      const data = await callWhatsAppFn("get_messages", { contact_phone: contactPhone });
      setMessages(data.messages || []);
      return data.messages || [];
    } catch (e) {
      console.error("WhatsApp messages error:", e);
      setMessages([]);
      return [];
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const sendMessage = useCallback(async (to: string, message: string, contactName?: string) => {
    setSending(true);
    try {
      const data = await callWhatsAppFn("send_message", { to, message, contact_name: contactName });
      return data;
    } catch (e) {
      console.error("WhatsApp send error:", e);
      throw e;
    } finally {
      setSending(false);
    }
  }, []);

  return { conversations, messages, loading, loadingMessages, sending, fetchConversations, fetchMessages, sendMessage };
}

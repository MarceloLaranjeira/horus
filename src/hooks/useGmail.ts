import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail`;

async function callGmailFn(action: string, body: any = {}) {
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
    console.error("Gmail network error:", e);
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

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  labelIds: string[];
  isUnread: boolean;
  body?: string;
}

export function useGmail() {
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [readingEmail, setReadingEmail] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);
  const [sending, setSending] = useState(false);

  const fetchEmails = useCallback(async (maxResults = 20, query = "in:inbox") => {
    setLoading(true);
    try {
      const data = await callGmailFn("list_emails", { maxResults, query });
      setEmails(data.emails || []);
      return data.emails || [];
    } catch (e) {
      console.error("Gmail fetch error:", e);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const readEmail = useCallback(async (messageId: string) => {
    setReadingEmail(true);
    try {
      const data = await callGmailFn("read_email", { messageId });
      setSelectedEmail(data.email || null);
      return data.email || null;
    } catch (e) {
      console.error("Gmail read error:", e);
      return null;
    } finally {
      setReadingEmail(false);
    }
  }, []);

  const sendEmail = useCallback(async (to: string, subject: string, body: string) => {
    setSending(true);
    try {
      const data = await callGmailFn("send_email", { to, subject, body });
      return data;
    } catch (e) {
      console.error("Gmail send error:", e);
      throw e;
    } finally {
      setSending(false);
    }
  }, []);

  const clearSelectedEmail = useCallback(() => setSelectedEmail(null), []);

  return { emails, loading, fetchEmails, readEmail, readingEmail, selectedEmail, clearSelectedEmail, sendEmail, sending };
}

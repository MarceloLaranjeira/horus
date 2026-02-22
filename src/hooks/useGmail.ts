import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail`;

async function callGmailFn(action: string, body: any = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Não autenticado");

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro na API");
  return data;
}

export function useGmail() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [readingEmail, setReadingEmail] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  const fetchUnread = useCallback(async (maxResults = 5) => {
    setLoading(true);
    try {
      const data = await callGmailFn("list_emails", {
        maxResults,
        query: "is:unread in:inbox",
      });
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

  const clearSelectedEmail = useCallback(() => setSelectedEmail(null), []);

  return { emails, loading, fetchUnread, readEmail, readingEmail, selectedEmail, clearSelectedEmail };
}

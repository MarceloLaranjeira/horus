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

  return { emails, loading, fetchUnread };
}

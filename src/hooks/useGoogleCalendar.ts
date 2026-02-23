import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-google-calendar`;

async function callCalendarFn(action: string, body: any = {}) {
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

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  colorId?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees?: Array<{ email: string; responseStatus?: string }>;
  hangoutLink?: string;
  conferenceData?: any;
  htmlLink?: string;
}

export interface CreateEventInput {
  summary: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  attendees?: string[];
  colorId?: string;
  addMeet?: boolean;
}

export function useGoogleCalendar() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const data = await callCalendarFn("status");
      setConnected(data.connected);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  const connect = useCallback(async () => {
    const redirectUri = `${window.location.origin}/app`;
    const data = await callCalendarFn("get_auth_url", { redirect_uri: redirectUri });
    if (data.auth_url) {
      window.location.href = data.auth_url;
    }
  }, []);

  const exchangeCode = useCallback(async (code: string) => {
    const redirectUri = `${window.location.origin}/app`;
    const data = await callCalendarFn("exchange_code", { code, redirect_uri: redirectUri });
    if (data.success) {
      setConnected(true);
    }
    return data;
  }, []);

  const disconnect = useCallback(async () => {
    await callCalendarFn("disconnect");
    setConnected(false);
    setEvents([]);
  }, []);

  const fetchEvents = useCallback(async (timeMin?: string, timeMax?: string, maxResults?: number) => {
    setLoadingEvents(true);
    try {
      const data = await callCalendarFn("list_events", { timeMin, timeMax, maxResults });
      setEvents(data.events || []);
      return data.events || [];
    } catch (e) {
      console.error("Error fetching events:", e);
      return [];
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  const createEvent = useCallback(async (event: CreateEventInput) => {
    return await callCalendarFn("create_event", event);
  }, []);

  const updateEvent = useCallback(async (eventId: string, updates: Partial<CreateEventInput>) => {
    return await callCalendarFn("update_event", { eventId, ...updates });
  }, []);

  const deleteEvent = useCallback(async (eventId: string) => {
    return await callCalendarFn("delete_event", { eventId });
  }, []);

  return { connected, loading, connect, exchangeCode, disconnect, events, fetchEvents, loadingEvents, createEvent, updateEvent, deleteEvent };
}

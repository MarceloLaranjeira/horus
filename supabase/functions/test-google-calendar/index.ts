import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getSupabaseAndUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw { status: 401, error: "Token de autenticação ausente. Faça login novamente." };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw { status: 401, error: "Sessão expirada. Faça login novamente.", details: userError?.message };
  }

  return { supabase, userId: user.id };
}

async function getTokens(supabase: any, userId: string) {
  const { data: integration, error } = await supabase
    .from("user_integrations")
    .select("credentials, enabled")
    .eq("user_id", userId)
    .eq("integration_type", "google_calendar")
    .maybeSingle();

  if (error) {
    console.error("Error fetching integration:", error);
    return null;
  }

  return integration?.credentials as any || null;
}

async function refreshAccessToken(supabase: any, userId: string, creds: any) {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

  if (!creds.refresh_token) {
    console.error("No refresh_token available for user:", userId);
    return null;
  }

  const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: creds.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const refreshData = await refreshRes.json();

  if (!refreshRes.ok) {
    console.error("Token refresh failed:", JSON.stringify(refreshData));
    // If refresh token is revoked/invalid, mark integration as disconnected
    if (refreshData.error === "invalid_grant") {
      await supabase
        .from("user_integrations")
        .update({ enabled: false })
        .eq("user_id", userId)
        .eq("integration_type", "google_calendar");
    }
    return null;
  }

  const newCreds = {
    ...creds,
    access_token: refreshData.access_token,
    expires_at: Date.now() + refreshData.expires_in * 1000,
  };
  await supabase
    .from("user_integrations")
    .update({ credentials: newCreds })
    .eq("user_id", userId)
    .eq("integration_type", "google_calendar");

  return refreshData.access_token;
}

async function getValidAccessToken(supabase: any, userId: string) {
  const creds = await getTokens(supabase, userId);
  if (!creds?.access_token) return { token: null, error: "not_connected" };

  // Refresh if expired or expiring within 5 minutes
  const bufferMs = 5 * 60 * 1000;
  if (creds.expires_at && Date.now() > (creds.expires_at - bufferMs) && creds.refresh_token) {
    const newToken = await refreshAccessToken(supabase, userId, creds);
    if (!newToken) return { token: null, error: "refresh_failed" };
    return { token: newToken, error: null };
  }

  return { token: creds.access_token, error: null };
}

function requireAccessToken(result: { token: string | null; error: string | null }) {
  if (!result.token) {
    const messages: Record<string, string> = {
      not_connected: "Google Calendar não conectado. Vá em Configurações > Integrações para conectar.",
      refresh_failed: "Sua autorização do Google expirou. Reconecte o Google Calendar em Configurações > Integrações.",
    };
    throw { status: 401, error: messages[result.error || "not_connected"] || "Erro de autorização do Google Calendar." };
  }
  return result.token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { supabase, userId } = await getSupabaseAndUser(req);
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
      return jsonResponse({ error: "Google OAuth não configurado no servidor. Contate o administrador." }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "status";

    // ── STATUS ──
    if (action === "status") {
      const creds = await getTokens(supabase, userId);
      const connected = !!(creds?.access_token && creds?.refresh_token);
      return jsonResponse({ connected, has_tokens: !!creds?.access_token });
    }

    // ── GET AUTH URL ──
    if (action === "get_auth_url") {
      const redirectUri = body.redirect_uri || `${req.headers.get("origin")}/app`;
      const scope = [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
      ].join(" ");

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope,
        access_type: "offline",
        prompt: "consent",
        state: userId,
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      console.log("Generated auth URL with redirect_uri:", redirectUri);
      return jsonResponse({ success: true, auth_url: authUrl });
    }

    // ── EXCHANGE CODE ──
    if (action === "exchange_code") {
      const { code, redirect_uri } = body;
      if (!code) return jsonResponse({ error: "Código de autorização ausente. Tente conectar novamente." }, 400);

      const finalRedirectUri = redirect_uri || `${req.headers.get("origin")}/app`;
      console.log("Exchanging code with redirect_uri:", finalRedirectUri);

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: finalRedirectUri,
          grant_type: "authorization_code",
        }),
      });
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        console.error("Token exchange failed:", JSON.stringify(tokenData));

        let userMessage = "Erro ao conectar com o Google.";
        if (tokenData.error === "redirect_uri_mismatch") {
          userMessage = "URI de redirecionamento não autorizada no Google Cloud Console. Adicione a URI: " + finalRedirectUri;
        } else if (tokenData.error === "invalid_grant") {
          userMessage = "Código de autorização expirado ou já utilizado. Tente conectar novamente.";
        } else if (tokenData.error === "invalid_client") {
          userMessage = "Credenciais do Google OAuth inválidas. Verifique o Client ID e Secret.";
        } else if (tokenData.error_description) {
          userMessage = tokenData.error_description;
        }

        return jsonResponse({ success: false, error: userMessage, google_error: tokenData.error }, 400);
      }

      if (!tokenData.refresh_token) {
        console.warn("No refresh_token received. User may need to revoke access and reconnect.");
      }

      const credentials = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: Date.now() + tokenData.expires_in * 1000,
      };

      const { data: existing } = await supabase
        .from("user_integrations")
        .select("id")
        .eq("user_id", userId)
        .eq("integration_type", "google_calendar")
        .maybeSingle();

      if (existing) {
        await supabase.from("user_integrations").update({ credentials, enabled: true }).eq("id", existing.id);
      } else {
        await supabase.from("user_integrations").insert({
          user_id: userId,
          integration_type: "google_calendar",
          credentials,
          enabled: true,
        });
      }

      return jsonResponse({ success: true, message: "Google Calendar conectado com sucesso!" });
    }

    // ── DISCONNECT ──
    if (action === "disconnect") {
      await supabase
        .from("user_integrations")
        .delete()
        .eq("user_id", userId)
        .eq("integration_type", "google_calendar");
      return jsonResponse({ success: true });
    }

    // ── LIST EVENTS ──
    if (action === "list_events") {
      const accessToken = requireAccessToken(await getValidAccessToken(supabase, userId));

      const timeMin = body.timeMin || new Date().toISOString();
      const timeMax = body.timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const maxResults = body.maxResults || 50;

      const calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=${maxResults}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const calData = await calRes.json();

      if (!calRes.ok) {
        console.error("Calendar API error:", JSON.stringify(calData));
        if (calRes.status === 401) {
          throw { status: 401, error: "Token do Google expirou. Reconecte em Configurações > Integrações." };
        }
        return jsonResponse({ success: false, error: "Erro ao buscar eventos do Google Calendar.", details: calData.error?.message }, calRes.status);
      }

      return jsonResponse({ success: true, events: calData.items || [] });
    }

    // ── CREATE EVENT ──
    if (action === "create_event") {
      const accessToken = requireAccessToken(await getValidAccessToken(supabase, userId));

      const { summary, description, start, end, location, attendees, colorId, addMeet } = body;
      if (!summary || !start || !end) {
        return jsonResponse({ error: "Campos obrigatórios: título (summary), início (start) e fim (end)." }, 400);
      }

      const event: any = {
        summary,
        description: description || "",
        start: typeof start === "string" ? { dateTime: start, timeZone: "America/Sao_Paulo" } : start,
        end: typeof end === "string" ? { dateTime: end, timeZone: "America/Sao_Paulo" } : end,
      };
      if (location) event.location = location;
      if (colorId) event.colorId = colorId;
      if (attendees && Array.isArray(attendees) && attendees.length > 0) {
        event.attendees = attendees.map((email: string) => ({ email }));
      }
      if (addMeet) {
        event.conferenceData = {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        };
      }

      const url = addMeet
        ? "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all"
        : "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all";

      const createRes = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      const createData = await createRes.json();

      if (!createRes.ok) {
        console.error("Create event error:", JSON.stringify(createData));
        return jsonResponse({ success: false, error: "Erro ao criar evento: " + (createData.error?.message || "erro desconhecido") }, createRes.status);
      }

      return jsonResponse({ success: true, event: createData });
    }

    // ── UPDATE EVENT ──
    if (action === "update_event") {
      const accessToken = requireAccessToken(await getValidAccessToken(supabase, userId));

      const { eventId, ...updates } = body;
      if (!eventId) return jsonResponse({ error: "ID do evento é obrigatório." }, 400);

      const event: any = {};
      if (updates.summary) event.summary = updates.summary;
      if (updates.description !== undefined) event.description = updates.description;
      if (updates.location !== undefined) event.location = updates.location;
      if (updates.colorId) event.colorId = updates.colorId;
      if (updates.start) event.start = typeof updates.start === "string" ? { dateTime: updates.start, timeZone: "America/Sao_Paulo" } : updates.start;
      if (updates.end) event.end = typeof updates.end === "string" ? { dateTime: updates.end, timeZone: "America/Sao_Paulo" } : updates.end;
      if (updates.attendees) event.attendees = updates.attendees.map((email: string) => ({ email }));

      const patchRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(event),
        }
      );
      const patchData = await patchRes.json();

      if (!patchRes.ok) {
        console.error("Update event error:", JSON.stringify(patchData));
        return jsonResponse({ success: false, error: "Erro ao atualizar evento: " + (patchData.error?.message || "erro desconhecido") }, patchRes.status);
      }

      return jsonResponse({ success: true, event: patchData });
    }

    // ── DELETE EVENT ──
    if (action === "delete_event") {
      const accessToken = requireAccessToken(await getValidAccessToken(supabase, userId));

      const { eventId } = body;
      if (!eventId) return jsonResponse({ error: "ID do evento é obrigatório." }, 400);

      const delRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`,
        { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!delRes.ok && delRes.status !== 204) {
        const errData = await delRes.json().catch(() => ({}));
        console.error("Delete event error:", JSON.stringify(errData));
        return jsonResponse({ success: false, error: "Erro ao deletar evento: " + (errData.error?.message || "erro desconhecido") }, delRes.status);
      }

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Ação não reconhecida: " + action }, 400);
  } catch (err: any) {
    if (err.status) return jsonResponse({ error: err.error, details: err.details }, err.status);
    console.error("Unexpected error:", err);
    return jsonResponse({ error: "Erro interno do servidor. Tente novamente." }, 500);
  }
});

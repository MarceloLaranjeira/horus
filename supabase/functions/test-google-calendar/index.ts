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
  if (!authHeader?.startsWith("Bearer ")) throw { status: 401, error: "Unauthorized" };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw { status: 401, error: "Unauthorized" };

  return { supabase, userId: user.id };
}

async function getTokens(supabase: any, userId: string) {
  const { data: integration } = await supabase
    .from("user_integrations")
    .select("credentials, enabled")
    .eq("user_id", userId)
    .eq("integration_type", "google_calendar")
    .maybeSingle();

  return integration?.credentials as any || null;
}

async function refreshAccessToken(supabase: any, userId: string, creds: any) {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

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
  if (!refreshRes.ok) return null;

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
  if (!creds?.access_token) return null;

  if (creds.expires_at && Date.now() > creds.expires_at && creds.refresh_token) {
    return await refreshAccessToken(supabase, userId, creds);
  }
  return creds.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { supabase, userId } = await getSupabaseAndUser(req);
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return jsonResponse({ error: "Google OAuth não configurado no servidor" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "status";

    if (action === "status") {
      const creds = await getTokens(supabase, userId);
      const connected = !!(creds?.access_token && creds?.refresh_token);
      return jsonResponse({ connected, has_tokens: !!creds?.access_token });
    }

    if (action === "get_auth_url") {
      const redirectUri = body.redirect_uri || `${req.headers.get("origin")}/app`;
      const scope = [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
      ].join(" ");
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${userId}`;
      return jsonResponse({ success: true, auth_url: authUrl });
    }

    if (action === "exchange_code") {
      const { code, redirect_uri } = body;
      if (!code) return jsonResponse({ error: "Código de autorização ausente" }, 400);

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirect_uri || `${req.headers.get("origin")}/app`,
          grant_type: "authorization_code",
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        return jsonResponse({ success: false, error: "Erro ao trocar código", details: tokenData }, 400);
      }

      const { data: existing } = await supabase
        .from("user_integrations")
        .select("id")
        .eq("user_id", userId)
        .eq("integration_type", "google_calendar")
        .maybeSingle();

      const credentials = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: Date.now() + tokenData.expires_in * 1000,
      };

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

      return jsonResponse({ success: true, message: "Google Calendar conectado!" });
    }

    if (action === "disconnect") {
      await supabase
        .from("user_integrations")
        .delete()
        .eq("user_id", userId)
        .eq("integration_type", "google_calendar");
      return jsonResponse({ success: true });
    }

    if (action === "list_events") {
      const accessToken = await getValidAccessToken(supabase, userId);
      if (!accessToken) return jsonResponse({ error: "Autorize o Google Calendar primeiro." }, 401);

      const timeMin = body.timeMin || new Date().toISOString();
      const timeMax = body.timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const maxResults = body.maxResults || 50;

      const calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=${maxResults}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const calData = await calRes.json();
      if (!calRes.ok) return jsonResponse({ success: false, error: "Erro ao buscar eventos", details: calData }, calRes.status);

      return jsonResponse({ success: true, events: calData.items || [] });
    }

    // Create event with attendees, location, Google Meet support
    if (action === "create_event") {
      const accessToken = await getValidAccessToken(supabase, userId);
      if (!accessToken) return jsonResponse({ error: "Autorize o Google Calendar primeiro." }, 401);

      const { summary, description, start, end, location, attendees, colorId, addMeet } = body;
      if (!summary || !start || !end) {
        return jsonResponse({ error: "summary, start e end são obrigatórios" }, 400);
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
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });
      const createData = await createRes.json();
      if (!createRes.ok) return jsonResponse({ success: false, error: "Erro ao criar evento", details: createData }, createRes.status);

      return jsonResponse({ success: true, event: createData });
    }

    // Update event
    if (action === "update_event") {
      const accessToken = await getValidAccessToken(supabase, userId);
      if (!accessToken) return jsonResponse({ error: "Autorize o Google Calendar primeiro." }, 401);

      const { eventId, ...updates } = body;
      if (!eventId) return jsonResponse({ error: "eventId é obrigatório" }, 400);

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
      if (!patchRes.ok) return jsonResponse({ success: false, error: "Erro ao atualizar evento", details: patchData }, patchRes.status);

      return jsonResponse({ success: true, event: patchData });
    }

    // Delete event
    if (action === "delete_event") {
      const accessToken = await getValidAccessToken(supabase, userId);
      if (!accessToken) return jsonResponse({ error: "Autorize o Google Calendar primeiro." }, 401);

      const { eventId } = body;
      if (!eventId) return jsonResponse({ error: "eventId é obrigatório" }, 400);

      const delRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`,
        { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!delRes.ok && delRes.status !== 204) {
        const errData = await delRes.json().catch(() => ({}));
        return jsonResponse({ success: false, error: "Erro ao deletar evento", details: errData }, delRes.status);
      }

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Ação não reconhecida" }, 400);
  } catch (err: any) {
    if (err.status) return jsonResponse({ error: err.error }, err.status);
    return jsonResponse({ error: "Erro interno", details: String(err) }, 500);
  }
});

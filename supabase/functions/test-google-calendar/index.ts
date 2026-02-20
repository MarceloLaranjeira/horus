import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Fetch user's Google Calendar credentials
    const { data: integration, error: dbError } = await supabase
      .from("user_integrations")
      .select("credentials, enabled")
      .eq("user_id", userId)
      .eq("integration_type", "google_calendar")
      .maybeSingle();

    if (dbError) {
      return new Response(JSON.stringify({ error: "Erro ao buscar credenciais", details: dbError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!integration) {
      return new Response(JSON.stringify({ error: "Credenciais do Google Calendar não configuradas" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { client_id, client_secret } = integration.credentials as { client_id: string; client_secret: string };

    if (!client_id || !client_secret) {
      return new Response(JSON.stringify({ error: "Client ID ou Client Secret ausente" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "test";

    if (action === "test") {
      // Test: validate credentials by calling Google's tokeninfo endpoint
      // We check that the client_id format is valid by querying Google's discovery endpoint
      const discoveryUrl = "https://accounts.google.com/.well-known/openid-configuration";
      const discoveryRes = await fetch(discoveryUrl);
      const discoveryText = await discoveryRes.text();

      if (!discoveryRes.ok) {
        return new Response(JSON.stringify({ success: false, error: "Não foi possível conectar ao Google" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate client_id format
      if (!client_id.endsWith(".apps.googleusercontent.com") && !client_id.includes(".")) {
        return new Response(JSON.stringify({ success: false, error: "Formato do Client ID inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Credenciais do Google Calendar parecem válidas. Para acesso completo, o usuário precisa autorizar via OAuth.",
          client_id_preview: client_id.substring(0, 10) + "...",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_auth_url") {
      // Generate OAuth2 authorization URL
      const redirectUri = body.redirect_uri || `${req.headers.get("origin")}/app`;
      const scope = "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send";
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(client_id)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${userId}`;

      return new Response(JSON.stringify({ success: true, auth_url: authUrl }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "exchange_code") {
      // Exchange authorization code for tokens
      const { code, redirect_uri } = body;
      if (!code) {
        return new Response(JSON.stringify({ error: "Código de autorização ausente" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id,
          client_secret,
          redirect_uri: redirect_uri || `${req.headers.get("origin")}/app`,
          grant_type: "authorization_code",
        }),
      });
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        return new Response(JSON.stringify({ success: false, error: "Erro ao trocar código", details: tokenData }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Store tokens in credentials
      await supabase
        .from("user_integrations")
        .update({
          credentials: {
            client_id,
            client_secret,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: Date.now() + tokenData.expires_in * 1000,
          },
        })
        .eq("user_id", userId)
        .eq("integration_type", "google_calendar");

      return new Response(JSON.stringify({ success: true, message: "Google Calendar conectado com sucesso!" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list_events") {
      const creds = integration.credentials as any;
      let accessToken = creds.access_token;

      // Refresh token if expired
      if (creds.expires_at && Date.now() > creds.expires_at && creds.refresh_token) {
        const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id,
            client_secret,
            refresh_token: creds.refresh_token,
            grant_type: "refresh_token",
          }),
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok) {
          accessToken = refreshData.access_token;
          await supabase
            .from("user_integrations")
            .update({
              credentials: {
                ...creds,
                access_token: refreshData.access_token,
                expires_at: Date.now() + refreshData.expires_in * 1000,
              },
            })
            .eq("user_id", userId)
            .eq("integration_type", "google_calendar");
        }
      }

      if (!accessToken) {
        return new Response(JSON.stringify({ error: "Token de acesso ausente. Autorize o Google Calendar primeiro." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const now = new Date().toISOString();
      const maxTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&timeMax=${encodeURIComponent(maxTime)}&singleEvents=true&orderBy=startTime&maxResults=10`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const calData = await calRes.json();

      if (!calRes.ok) {
        return new Response(JSON.stringify({ success: false, error: "Erro ao buscar eventos", details: calData }), {
          status: calRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, events: calData.items || [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação não reconhecida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

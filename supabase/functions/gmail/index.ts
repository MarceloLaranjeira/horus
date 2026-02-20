import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function refreshAccessToken(
  supabase: any,
  userId: string,
  creds: any
): Promise<string | null> {
  if (!creds.refresh_token) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      refresh_token: creds.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();

  await supabase
    .from("user_integrations")
    .update({
      credentials: {
        ...creds,
        access_token: data.access_token,
        expires_at: Date.now() + data.expires_in * 1000,
      },
    })
    .eq("user_id", userId)
    .eq("integration_type", "google_calendar");

  return data.access_token;
}

async function getAccessToken(
  supabase: any,
  userId: string
): Promise<{ token: string | null; error: string | null }> {
  const { data: integration, error } = await supabase
    .from("user_integrations")
    .select("credentials, enabled")
    .eq("user_id", userId)
    .eq("integration_type", "google_calendar")
    .maybeSingle();

  if (error || !integration) {
    return { token: null, error: "Credenciais do Google não configuradas. Configure o Google Calendar nas integrações primeiro." };
  }

  const creds = integration.credentials as any;
  let accessToken = creds.access_token;

  if (creds.expires_at && Date.now() > creds.expires_at) {
    accessToken = await refreshAccessToken(supabase, userId, creds);
  }

  if (!accessToken) {
    return { token: null, error: "Token de acesso expirado. Re-autorize o Google nas integrações." };
  }

  return { token: accessToken, error: null };
}

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
    const body = await req.json().catch(() => ({}));
    const action = body.action || "list_emails";

    const { token: accessToken, error: tokenError } = await getAccessToken(supabase, userId);
    if (tokenError || !accessToken) {
      return new Response(JSON.stringify({ error: tokenError || "Sem token de acesso" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gmailHeaders = { Authorization: `Bearer ${accessToken}` };

    if (action === "list_emails") {
      const maxResults = body.maxResults || 10;
      const query = body.query || "in:inbox";
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent(query)}`,
        { headers: gmailHeaders }
      );
      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: "Erro ao listar emails", details: data }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch details for each message
      const messages = data.messages || [];
      const detailed = await Promise.all(
        messages.slice(0, maxResults).map(async (msg: any) => {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date&metadataHeaders=To`,
            { headers: gmailHeaders }
          );
          if (!detailRes.ok) return null;
          const detail = await detailRes.json();
          const headers = detail.payload?.headers || [];
          const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
          return {
            id: detail.id,
            threadId: detail.threadId,
            snippet: detail.snippet,
            subject: getHeader("Subject"),
            from: getHeader("From"),
            to: getHeader("To"),
            date: getHeader("Date"),
            labelIds: detail.labelIds,
            isUnread: detail.labelIds?.includes("UNREAD"),
          };
        })
      );

      return new Response(JSON.stringify({ success: true, emails: detailed.filter(Boolean) }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "read_email") {
      const messageId = body.messageId;
      if (!messageId) {
        return new Response(JSON.stringify({ error: "messageId é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        { headers: gmailHeaders }
      );
      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: "Erro ao ler email", details: data }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Extract body text
      let bodyText = "";
      const extractText = (part: any): string => {
        if (part.mimeType === "text/plain" && part.body?.data) {
          return atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
        }
        if (part.parts) {
          return part.parts.map(extractText).join("\n");
        }
        return "";
      };
      bodyText = extractText(data.payload);

      const headers = data.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

      return new Response(JSON.stringify({
        success: true,
        email: {
          id: data.id,
          subject: getHeader("Subject"),
          from: getHeader("From"),
          to: getHeader("To"),
          date: getHeader("Date"),
          body: bodyText.substring(0, 5000),
          snippet: data.snippet,
        },
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "send_email") {
      const { to, subject, body: emailBody } = body;
      if (!to || !subject || !emailBody) {
        return new Response(JSON.stringify({ error: "to, subject e body são obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const rawEmail = [
        `To: ${to}`,
        `Subject: ${subject}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        emailBody,
      ].join("\r\n");

      const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { ...gmailHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ raw: encodedEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        return new Response(JSON.stringify({ error: "Erro ao enviar email", details: data }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Email enviado com sucesso!", messageId: data.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação não reconhecida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Gmail function error:", err);
    return new Response(JSON.stringify({ error: "Erro interno", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

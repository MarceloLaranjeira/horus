import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userId = claimsData.claims.sub;

    // Fetch user's Evolution API config
    const { data: integration, error: dbError } = await supabase
      .from("user_integrations")
      .select("credentials, enabled")
      .eq("user_id", userId)
      .eq("integration_type", "evolution_api")
      .maybeSingle();

    if (dbError) {
      return json({ error: "Erro ao buscar configuração", details: dbError.message }, 500);
    }

    if (!integration) {
      return json({ error: "Evolution API não configurada. Vá em Configurações > Integrações." }, 404);
    }

    const { api_url, api_key, instance_name } = integration.credentials as {
      api_url: string;
      api_key: string;
      instance_name: string;
    };

    if (!api_url || !api_key) {
      return json({ error: "URL ou API Key da Evolution API não configurada" }, 400);
    }

    const baseUrl = api_url.replace(/\/+$/, "");
    const body = await req.json().catch(() => ({}));
    const action = body.action || "status";

    // === STATUS ===
    if (action === "status") {
      try {
        const url = instance_name
          ? `${baseUrl}/instance/connectionState/${encodeURIComponent(instance_name)}`
          : `${baseUrl}/instance/fetchInstances`;

        const res = await fetch(url, {
          headers: { apikey: api_key },
          signal: AbortSignal.timeout(10000),
        });
        const data = await res.json();

        if (!res.ok) {
          return json({ success: false, error: `Erro ${res.status}`, data }, res.status);
        }

        // connectionState returns { instance: { state: "open" | "close" } }
        const state = data?.instance?.state ?? data?.state;
        const connected = state === "open";

        return json({
          success: true,
          connected,
          message: connected ? "WhatsApp conectado!" : "WhatsApp desconectado",
          data,
        });
      } catch (e) {
        return json({ success: false, error: `Não foi possível conectar: ${String(e)}` }, 502);
      }
    }

    // === GET QR CODE ===
    if (action === "get_qrcode") {
      if (!instance_name) {
        return json({ error: "Nome da instância não configurado" }, 400);
      }

      try {
        const res = await fetch(`${baseUrl}/instance/connect/${encodeURIComponent(instance_name)}`, {
          headers: { apikey: api_key },
          signal: AbortSignal.timeout(15000),
        });
        const data = await res.json();

        if (!res.ok) {
          return json({ success: false, error: "Erro ao obter QR Code", details: data }, res.status);
        }

        // Evolution API returns { base64: "data:image/..." } or { pairingCode: "..." }
        const qr = data.base64 || data.qrcode?.base64 || null;
        const pairingCode = data.pairingCode || data.code || null;

        // If already connected
        if (data.instance?.state === "open") {
          return json({ success: true, alreadyConnected: true, message: "WhatsApp já está conectado!" });
        }

        if (qr) {
          return json({ success: true, qr: qr.startsWith("data:") ? qr : `data:image/png;base64,${qr}` });
        }

        if (pairingCode) {
          return json({ success: true, pairingCode });
        }

        return json({ success: false, error: "QR Code não disponível", data }, 400);
      } catch (e) {
        return json({ success: false, error: `Erro ao obter QR Code: ${String(e)}` }, 502);
      }
    }

    // === SEND MESSAGE ===
    if (action === "send_message") {
      const { phone, message } = body;
      if (!phone || !message) {
        return json({ error: "Telefone e mensagem são obrigatórios" }, 400);
      }
      if (!instance_name) {
        return json({ error: "Nome da instância não configurado" }, 400);
      }

      const cleanPhone = phone.replace(/\D/g, "");

      try {
        const res = await fetch(`${baseUrl}/message/sendText/${encodeURIComponent(instance_name)}`, {
          method: "POST",
          headers: {
            apikey: api_key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ number: cleanPhone, text: message }),
          signal: AbortSignal.timeout(15000),
        });
        const data = await res.json();

        if (!res.ok) {
          return json({ success: false, error: "Erro ao enviar mensagem", details: data }, res.status);
        }

        return json({ success: true, message: "Mensagem enviada!", data });
      } catch (e) {
        return json({ success: false, error: `Erro ao enviar: ${String(e)}` }, 502);
      }
    }

    return json({ error: "Ação não reconhecida" }, 400);
  } catch (err) {
    return json({ error: "Erro interno", details: String(err) }, 500);
  }
});

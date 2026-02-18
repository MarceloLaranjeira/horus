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

    // Fetch user's WhatsApp server config
    const { data: integration, error: dbError } = await supabase
      .from("user_integrations")
      .select("credentials, enabled")
      .eq("user_id", userId)
      .eq("integration_type", "whatsapp_server")
      .maybeSingle();

    if (dbError) {
      return json({ error: "Erro ao buscar configuração", details: dbError.message }, 500);
    }

    if (!integration) {
      return json({ error: "Servidor WhatsApp não configurado" }, 404);
    }

    const { server_url } = integration.credentials as { server_url: string };

    if (!server_url) {
      return json({ error: "URL do servidor não configurada" }, 400);
    }

    const baseUrl = server_url.replace(/\/+$/, "");
    const body = await req.json().catch(() => ({}));
    const action = body.action || "status";

    // === STATUS: check if server is reachable and WhatsApp is connected ===
    if (action === "status") {
      try {
        const res = await fetch(`${baseUrl}/status`, {
          signal: AbortSignal.timeout(10000),
        });
        const data = await res.json();
        return json({
          success: true,
          connected: data.connected ?? data.authenticated ?? false,
          message: data.connected || data.authenticated
            ? "WhatsApp conectado!"
            : "WhatsApp desconectado",
          data,
        });
      } catch (e) {
        return json({
          success: false,
          error: `Não foi possível conectar ao servidor: ${String(e)}`,
        }, 502);
      }
    }

    // === QR CODE: get QR code for pairing ===
    if (action === "get_qrcode") {
      try {
        const res = await fetch(`${baseUrl}/qr`, {
          signal: AbortSignal.timeout(15000),
        });
        const contentType = res.headers.get("content-type") || "";

        // If server returns image directly
        if (contentType.startsWith("image/")) {
          const buffer = await res.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          return json({
            success: true,
            qr: `data:${contentType};base64,${base64}`,
          });
        }

        // If server returns JSON with QR data
        const data = await res.json();
        const qrValue = data.qr || data.qrcode || data.base64 || data.data?.qr || null;
        const pairingCode = data.pairingCode || data.code || null;

        if (qrValue) {
          const qr = qrValue.startsWith("data:") ? qrValue : `data:image/png;base64,${qrValue}`;
          return json({ success: true, qr });
        }

        if (pairingCode) {
          return json({ success: true, pairingCode });
        }

        // If already connected
        if (data.connected || data.authenticated) {
          return json({ success: true, alreadyConnected: true, message: "WhatsApp já está conectado!" });
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

      const cleanPhone = phone.replace(/\D/g, "");

      try {
        const res = await fetch(`${baseUrl}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanPhone, message }),
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

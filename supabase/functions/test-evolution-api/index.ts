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

    // Fetch user's Evolution API credentials
    const { data: integration, error: dbError } = await supabase
      .from("user_integrations")
      .select("credentials, enabled")
      .eq("user_id", userId)
      .eq("integration_type", "evolution_api")
      .maybeSingle();

    if (dbError) {
      return new Response(JSON.stringify({ error: "Erro ao buscar credenciais", details: dbError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!integration) {
      return new Response(JSON.stringify({ error: "Credenciais da Evolution API não configuradas" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { api_url, api_key, instance_name } = integration.credentials as {
      api_url: string;
      api_key: string;
      instance_name: string;
    };

    if (!api_url || !api_key) {
      return new Response(JSON.stringify({ error: "URL ou API Key ausente" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "test";

    // Normalize base URL
    const baseUrl = api_url.replace(/\/+$/, "");

    if (action === "test") {
      // Test connection by fetching instance info
      const testUrl = instance_name
        ? `${baseUrl}/instance/fetchInstances?instanceName=${encodeURIComponent(instance_name)}`
        : `${baseUrl}/instance/fetchInstances`;

      const res = await fetch(testUrl, {
        headers: { apikey: api_key },
      });
      const text = await res.text();

      if (!res.ok) {
        return new Response(
          JSON.stringify({ success: false, error: `Erro ${res.status}: ${text.substring(0, 200)}` }),
          { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Conexão com Evolution API estabelecida com sucesso!",
          instances: Array.isArray(data) ? data.length : 1,
          data,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "send_message") {
      const { phone, message } = body;
      if (!phone || !message) {
        return new Response(JSON.stringify({ error: "Telefone e mensagem são obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!instance_name) {
        return new Response(JSON.stringify({ error: "Nome da instância não configurado" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Clean phone number
      const cleanPhone = phone.replace(/\D/g, "");

      const sendRes = await fetch(`${baseUrl}/message/sendText/${instance_name}`, {
        method: "POST",
        headers: {
          apikey: api_key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: cleanPhone,
          text: message,
        }),
      });
      const sendData = await sendRes.json();

      if (!sendRes.ok) {
        return new Response(JSON.stringify({ success: false, error: "Erro ao enviar mensagem", details: sendData }), {
          status: sendRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Mensagem enviada!", data: sendData }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_qrcode") {
      if (!instance_name) {
        return new Response(JSON.stringify({ error: "Nome da instância não configurado" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const qrRes = await fetch(`${baseUrl}/instance/connect/${instance_name}`, {
        headers: { apikey: api_key },
      });
      const qrData = await qrRes.json();

      if (!qrRes.ok) {
        return new Response(JSON.stringify({ success: false, error: "Erro ao obter QR Code", details: qrData }), {
          status: qrRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, data: qrData }), {
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

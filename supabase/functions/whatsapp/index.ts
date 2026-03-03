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
    const WA_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    if (!WA_TOKEN || !PHONE_ID) {
      return new Response(
        JSON.stringify({ error: "WhatsApp credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const body = await req.json();
    const { action } = body;

    // Send a message
    if (action === "send_message") {
      const { to, message } = body;
      if (!to || !message) {
        return new Response(JSON.stringify({ error: "Missing 'to' or 'message'" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Clean phone number
      const phone = to.replace(/\D/g, "");

      const waRes = await fetch(
        `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WA_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "text",
            text: { body: message },
          }),
        }
      );

      const waData = await waRes.json();

      if (!waRes.ok) {
        console.error("WhatsApp API error:", waData);
        return new Response(
          JSON.stringify({ error: waData?.error?.message || "Erro ao enviar mensagem" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const waMessageId = waData?.messages?.[0]?.id || null;

      // Save to DB
      await supabase.from("whatsapp_messages").insert({
        user_id: userId,
        contact_phone: phone,
        contact_name: body.contact_name || null,
        direction: "outgoing",
        message_text: message,
        wa_message_id: waMessageId,
        status: "sent",
      });

      return new Response(JSON.stringify({ success: true, wa_message_id: waMessageId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // List conversations (grouped by contact)
    if (action === "list_conversations") {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      // Group by contact_phone
      const convMap = new Map<string, any>();
      for (const msg of data || []) {
        if (!convMap.has(msg.contact_phone)) {
          convMap.set(msg.contact_phone, {
            contact_phone: msg.contact_phone,
            contact_name: msg.contact_name || msg.contact_phone,
            last_message: msg.message_text,
            last_date: msg.created_at,
            unread: 0,
          });
        }
      }

      return new Response(JSON.stringify({ conversations: Array.from(convMap.values()) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get messages for a specific contact
    if (action === "get_messages") {
      const { contact_phone } = body;
      if (!contact_phone) {
        return new Response(JSON.stringify({ error: "Missing contact_phone" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("contact_phone", contact_phone.replace(/\D/g, ""))
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      return new Response(JSON.stringify({ messages: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("WhatsApp function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

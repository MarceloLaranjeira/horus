import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

interface AsaasPaymentPayload {
  id?: string;
  customer?: string;
  status?: string;
  externalReference?: string;
  subscription?: string;
}

interface AsaasSubscriptionPayload {
  id?: string;
  customer?: string;
  externalReference?: string;
}

interface AsaasWebhookPayload {
  id?: string;
  event?: string;
  payment?: AsaasPaymentPayload;
  subscription?: AsaasSubscriptionPayload;
}

const responseJson = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const parseWebhookState = (eventName: string) => {
  if (eventName === "PAYMENT_RECEIVED" || eventName === "PAYMENT_CONFIRMED") {
    return { status: "paid", paymentStatus: "received" };
  }
  if (eventName === "PAYMENT_CREATED") {
    return { status: "payment_pending", paymentStatus: "created" };
  }
  if (eventName === "PAYMENT_OVERDUE") {
    return { status: "overdue", paymentStatus: "overdue" };
  }
  if (eventName === "PAYMENT_REFUNDED") {
    return { status: "refunded", paymentStatus: "refunded" };
  }
  if (eventName === "PAYMENT_DELETED") {
    return { status: "cancelled", paymentStatus: "deleted" };
  }
  if (eventName === "SUBSCRIPTION_CREATED") {
    return { status: "payment_pending", paymentStatus: "subscription_created" };
  }
  if (eventName === "SUBSCRIPTION_DELETED" || eventName === "SUBSCRIPTION_INACTIVATED") {
    return { status: "cancelled", paymentStatus: "subscription_cancelled" };
  }

  return { status: null, paymentStatus: eventName.toLowerCase() };
};

const sha256 = async (input: string) => {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return responseJson(405, { error: "Method not allowed" });
  }

  const expectedWebhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
  const incomingWebhookToken = req.headers.get("asaas-access-token");

  if (!expectedWebhookToken || incomingWebhookToken !== expectedWebhookToken) {
    return responseJson(401, { error: "Invalid webhook token" });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return responseJson(500, { error: "Supabase env vars are missing" });
  }

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody) as AsaasWebhookPayload;

    const eventName = payload.event ?? "UNKNOWN_EVENT";
    const paymentId = payload.payment?.id ?? null;
    const subscriptionId = payload.payment?.subscription ?? payload.subscription?.id ?? null;
    const customerId = payload.payment?.customer ?? payload.subscription?.customer ?? null;
    const leadId = payload.payment?.externalReference ?? payload.subscription?.externalReference ?? null;

    if (!paymentId && !subscriptionId && !leadId) {
      return responseJson(400, { error: "Webhook sem referencia para vincular lead" });
    }

    const stableEventId = payload.id ?? `evt_${await sha256(rawBody)}`;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { error: eventInsertError } = await supabaseAdmin
      .from("saas_payment_events")
      .insert({
        asaas_event_id: stableEventId,
        asaas_payment_id: paymentId,
        asaas_customer_id: customerId,
        event_type: eventName,
        payload,
      });

    if (eventInsertError && !eventInsertError.message.toLowerCase().includes("duplicate")) {
      throw new Error(eventInsertError.message);
    }

    if (eventInsertError && eventInsertError.message.toLowerCase().includes("duplicate")) {
      return responseJson(200, { ok: true, alreadyProcessed: true });
    }

    const mapped = parseWebhookState(eventName);
    const nowIso = new Date().toISOString();

    const updateData: Record<string, unknown> = {
      payment_status: mapped.paymentStatus,
      error_message: null,
      updated_at: nowIso,
    };

    if (mapped.status) {
      updateData.status = mapped.status;
    }

    if (paymentId) {
      updateData.asaas_payment_id = paymentId;
    }

    if (subscriptionId) {
      updateData.asaas_subscription_id = subscriptionId;
    }

    if (mapped.status === "paid") {
      updateData.paid_at = nowIso;
      updateData.payment_received_at = nowIso;
    }

    const updateBy = async (
      field: "id" | "asaas_payment_id" | "asaas_subscription_id" | "asaas_customer_id",
      value: string | null,
    ) => {
      if (!value) {
        return false;
      }

      const { data, error } = await supabaseAdmin
        .from("saas_onboarding_leads")
        .update(updateData)
        .eq(field, value)
        .select("id")
        .limit(1);

      if (error) {
        throw new Error(error.message);
      }

      return (data?.length ?? 0) > 0;
    };

    let updated = false;

    if (!updated) {
      updated = await updateBy("id", leadId);
    }

    if (!updated) {
      updated = await updateBy("asaas_payment_id", paymentId);
    }

    if (!updated) {
      updated = await updateBy("asaas_subscription_id", subscriptionId);
    }

    if (!updated) {
      updated = await updateBy("asaas_customer_id", customerId);
    }

    return responseJson(200, {
      ok: true,
      event: eventName,
      paymentId,
      subscriptionId,
      statusApplied: mapped.status,
      leadUpdated: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected webhook error";
    return responseJson(500, { error: message });
  }
});

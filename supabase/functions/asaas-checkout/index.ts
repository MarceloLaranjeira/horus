import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type PlanId = "horus" | "starter" | "pro" | "scale";
type BillingMethod = "pix" | "boleto" | "cartao";
type AccessMode = "login" | "sales_page" | "checkout";

interface OnboardingRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  cpfCnpj?: string;
  teamSize?: string;
  useCase?: string;
  plan: PlanId;
  billingMethod: BillingMethod;
  accessMode?: AccessMode;
  accessEmail?: string;
  utm?: Record<string, string>;
}

interface AsaasListResponse<T> {
  data: T[];
}

interface AsaasCustomer {
  id: string;
}

interface AsaasPayment {
  id: string;
  invoiceUrl?: string;
}

interface AsaasSubscription {
  id: string;
}

const billingTypeByMethod: Record<BillingMethod, string> = {
  pix: "PIX",
  boleto: "BOLETO",
  cartao: "UNDEFINED",
};

const sanitizeDigits = (value: string | undefined): string => (value ?? "").replace(/\D/g, "");

const parseNumber = (value: string | undefined, fallback: string): number => {
  const normalized = (value ?? fallback).replace(",", ".").trim();
  return Number(normalized);
};

const parsePlanAmounts = (): Record<PlanId, number> => ({
  horus: parseNumber(Deno.env.get("ASAAS_PRICE_MONTHLY"), "39.90"),
  starter: parseNumber(Deno.env.get("ASAAS_PRICE_STARTER"), "197"),
  pro: parseNumber(Deno.env.get("ASAAS_PRICE_PRO"), "397"),
  scale: parseNumber(Deno.env.get("ASAAS_PRICE_SCALE"), "997"),
});

const getAsaasBaseUrl = (): string => {
  const env = (Deno.env.get("ASAAS_ENV") ?? "sandbox").toLowerCase();
  return env === "production" ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/api/v3";
};

const jsonResponse = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const isPlanId = (value: string): value is PlanId =>
  value === "horus" || value === "starter" || value === "pro" || value === "scale";

const isBillingMethod = (value: string): value is BillingMethod =>
  value === "pix" || value === "boleto" || value === "cartao";

const isAccessMode = (value: string): value is AccessMode =>
  value === "login" || value === "sales_page" || value === "checkout";

const asaasRequest = async <T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${getAsaasBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: token,
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    const asaasMessage =
      typeof payload?.errors?.[0]?.description === "string"
        ? payload.errors[0].description
        : "Erro na API do Asaas";
    throw new Error(asaasMessage);
  }

  return payload as T;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchSubscriptionPayment = async (
  token: string,
  subscriptionId: string,
): Promise<AsaasPayment> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const payments = await asaasRequest<AsaasListResponse<AsaasPayment>>(
      token,
      `/payments?subscription=${subscriptionId}&limit=1&offset=0`,
      { method: "GET" },
    );

    const firstPayment = payments.data[0];

    if (firstPayment?.id && firstPayment.invoiceUrl) {
      return firstPayment;
    }

    await wait(1200);
  }

  throw new Error("Assinatura criada, mas sem URL de checkout para o primeiro pagamento.");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const ASAAS_ACCESS_TOKEN = Deno.env.get("ASAAS_ACCESS_TOKEN");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(500, { error: "Supabase env vars are missing." });
  }

  if (!ASAAS_ACCESS_TOKEN) {
    return jsonResponse(500, { error: "ASAAS_ACCESS_TOKEN is not configured." });
  }

  let leadId: string | null = null;

  try {
    const body = (await req.json()) as Partial<OnboardingRequest>;

    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const phone = sanitizeDigits(body.phone);
    const company = (body.company ?? "").trim();
    const cpfCnpj = sanitizeDigits(body.cpfCnpj);
    const teamSize = (body.teamSize ?? "").trim();
    const useCase = (body.useCase ?? "").trim();
    const planInput = (body.plan ?? "").toString();
    const billingMethodInput = (body.billingMethod ?? "").toString();
    const accessModeInput = (body.accessMode ?? "checkout").toString();
    const accessEmail = (body.accessEmail ?? email).trim().toLowerCase();

    if (!name || !email) {
      return jsonResponse(400, { error: "Nome e email sao obrigatorios." });
    }

    if (!isPlanId(planInput)) {
      return jsonResponse(400, { error: "Plano invalido." });
    }

    if (!isBillingMethod(billingMethodInput)) {
      return jsonResponse(400, { error: "Forma de pagamento invalida." });
    }

    if (!isAccessMode(accessModeInput)) {
      return jsonResponse(400, { error: "Modalidade de acesso invalida." });
    }

    if (!accessEmail) {
      return jsonResponse(400, { error: "Email de acesso e obrigatorio." });
    }

    const planAmounts = parsePlanAmounts();
    const amount = planAmounts[planInput];

    if (!Number.isFinite(amount) || amount <= 0) {
      return jsonResponse(500, { error: "Preco do plano invalido na configuracao." });
    }

    const billingType = billingTypeByMethod[billingMethodInput];

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const { data, error } = await supabaseAuth.auth.getUser();
      if (!error && data.user) {
        userId = data.user.id;
      }
    }

    const { data: leadInsert, error: leadInsertError } = await supabaseAdmin
      .from("saas_onboarding_leads")
      .insert({
        user_id: userId,
        full_name: name,
        email,
        phone: phone || null,
        company: company || null,
        cpf_cnpj: cpfCnpj || null,
        team_size: teamSize || null,
        use_case: useCase || null,
        plan_id: planInput,
        plan_amount: amount,
        billing_method: billingMethodInput,
        billing_type: billingType,
        access_mode: accessModeInput,
        access_email: accessEmail,
        utm: body.utm ?? {},
      })
      .select("id")
      .single();

    if (leadInsertError || !leadInsert) {
      throw new Error(leadInsertError?.message ?? "Falha ao registrar onboarding.");
    }

    leadId = leadInsert.id;

    const customerQuery = new URLSearchParams({ email });
    if (cpfCnpj) {
      customerQuery.set("cpfCnpj", cpfCnpj);
    }

    const listCustomers = await asaasRequest<AsaasListResponse<AsaasCustomer>>(
      ASAAS_ACCESS_TOKEN,
      `/customers?${customerQuery.toString()}`,
      { method: "GET" },
    );

    const existingCustomerId = listCustomers.data[0]?.id;

    const customerId = existingCustomerId
      ? existingCustomerId
      : (
          await asaasRequest<AsaasCustomer>(ASAAS_ACCESS_TOKEN, "/customers", {
            method: "POST",
            body: JSON.stringify({
              name,
              email,
              cpfCnpj: cpfCnpj || undefined,
              mobilePhone: phone || undefined,
              company: company || undefined,
              notificationDisabled: false,
            }),
          })
        ).id;

    const nextDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const subscription = await asaasRequest<AsaasSubscription>(ASAAS_ACCESS_TOKEN, "/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        customer: customerId,
        billingType,
        value: amount,
        nextDueDate,
        cycle: "MONTHLY",
        description: `Assinatura mensal Horus (${planInput.toUpperCase()})`,
        externalReference: leadId,
        sendPaymentByPostalService: false,
      }),
    });

    const firstPayment = await fetchSubscriptionPayment(ASAAS_ACCESS_TOKEN, subscription.id);

    const { error: updateError } = await supabaseAdmin
      .from("saas_onboarding_leads")
      .update({
        status: "checkout_created",
        payment_status: "subscription_created",
        checkout_url: firstPayment.invoiceUrl,
        asaas_customer_id: customerId,
        asaas_subscription_id: subscription.id,
        asaas_payment_id: firstPayment.id,
        error_message: null,
      })
      .eq("id", leadId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return jsonResponse(200, {
      leadId,
      customerId,
      subscriptionId: subscription.id,
      paymentId: firstPayment.id,
      checkoutUrl: firstPayment.invoiceUrl,
      plan: planInput,
      amount,
      billingType,
      environment: (Deno.env.get("ASAAS_ENV") ?? "sandbox").toLowerCase(),
    });
  } catch (error) {
    if (leadId) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      await supabaseAdmin
        .from("saas_onboarding_leads")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message.slice(0, 300) : "Erro inesperado",
        })
        .eq("id", leadId);
    }

    const message = error instanceof Error ? error.message : "Falha inesperada no checkout.";
    return jsonResponse(500, { error: message });
  }
});

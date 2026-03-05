import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PlanId = "starter" | "pro" | "scale";
type BillingMethod = "pix" | "boleto" | "cartao";

interface OnboardingFormState {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  document: string;
  teamSize: string;
  useCase: string;
  plan: PlanId;
  billingMethod: BillingMethod;
}

interface CheckoutResponse {
  checkoutUrl: string;
  paymentId: string;
  customerId: string;
  leadId: string;
  amount: number;
  plan: PlanId;
  billingType: string;
  environment: string;
}

const planCatalog: Record<PlanId, { name: string; subtitle: string; amountLabel: string }> = {
  starter: {
    name: "Starter",
    subtitle: "Base para solo founders e operadores",
    amountLabel: "R$ 197 / mes",
  },
  pro: {
    name: "Pro",
    subtitle: "Melhor para crescer com campanhas e funil ativo",
    amountLabel: "R$ 397 / mes",
  },
  scale: {
    name: "Scale",
    subtitle: "Para operacao de time e maior volume comercial",
    amountLabel: "R$ 997 / mes",
  },
};

const billingOptions: Array<{ id: BillingMethod; label: string; hint: string }> = [
  { id: "pix", label: "PIX", hint: "Aprovacao rapida" },
  { id: "boleto", label: "Boleto", hint: "Pagamento bancario" },
  { id: "cartao", label: "Cartao", hint: "Checkout hospedado" },
];

const sanitizeDigits = (value: string) => value.replace(/\D/g, "");

const isValidPlan = (value: string | null): value is PlanId => {
  return value === "starter" || value === "pro" || value === "scale";
};

const OnboardingPage = () => {
  const [searchParams] = useSearchParams();
  const initialPlan = isValidPlan(searchParams.get("plan")) ? searchParams.get("plan") : "pro";

  const [form, setForm] = useState<OnboardingFormState>({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    document: "",
    teamSize: "",
    useCase: "",
    plan: initialPlan,
    billingMethod: "pix",
  });
  const [loading, setLoading] = useState(false);

  const utm = useMemo(
    () => ({
      source: searchParams.get("utm_source") ?? "",
      medium: searchParams.get("utm_medium") ?? "",
      campaign: searchParams.get("utm_campaign") ?? "",
      term: searchParams.get("utm_term") ?? "",
      content: searchParams.get("utm_content") ?? "",
    }),
    [searchParams]
  );

  const setField = <K extends keyof OnboardingFormState>(field: K, value: OnboardingFormState[K]) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: sanitizeDigits(form.phone),
        company: form.company.trim(),
        cpfCnpj: sanitizeDigits(form.document),
        teamSize: form.teamSize.trim(),
        useCase: form.useCase.trim(),
        plan: form.plan,
        billingMethod: form.billingMethod,
        utm,
      };

      const { data, error } = await supabase.functions.invoke<CheckoutResponse>("asaas-checkout", {
        body: payload,
      });

      if (error) {
        throw new Error(error.message || "Nao foi possivel iniciar checkout.");
      }

      if (!data?.checkoutUrl) {
        throw new Error("Checkout nao retornou URL valida.");
      }

      toast.success("Checkout criado. Redirecionando para pagamento...");
      window.location.assign(data.checkoutUrl);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Erro inesperado no onboarding.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = planCatalog[form.plan];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_0.95fr]">
        <section className="rounded-3xl border border-border/60 bg-card/35 p-6 sm:p-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar para home
          </Link>

          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Onboarding SaaS</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight">Ative seu Horus e va para checkout agora</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Este fluxo foi feito para converter direto de campanha: formulario simples, cobranca automatica e pagamento sem atendimento manual.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/[0.07] p-5">
            <p className="text-sm font-semibold">Plano selecionado: {selectedPlan.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{selectedPlan.subtitle}</p>
            <p className="mt-3 text-2xl font-bold">{selectedPlan.amountLabel}</p>

            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> Fluxo de venda 24h com onboarding automatico</li>
              <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-primary" /> Checkout Asaas com rastreio de lead e campanha</li>
              <li className="flex items-start gap-2"><Zap className="mt-0.5 h-4 w-4 text-primary" /> Arquitetura pronta para escalar o produto como SaaS</li>
            </ul>
          </div>

          <div className="mt-6 rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">UTM capturada automaticamente:</p>
            <p className="mt-1 break-all">source={utm.source || "-"} | medium={utm.medium || "-"} | campaign={utm.campaign || "-"}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-border/60 bg-card/45 p-6 sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  required
                  placeholder="Seu nome"
                  value={form.fullName}
                  onChange={(event) => setField("fullName", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  required
                  type="email"
                  placeholder="voce@empresa.com"
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp</Label>
                <Input
                  id="phone"
                  required
                  placeholder="(11) 99999-9999"
                  value={form.phone}
                  onChange={(event) => setField("phone", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  required
                  placeholder="Nome da empresa"
                  value={form.company}
                  onChange={(event) => setField("company", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">CPF ou CNPJ</Label>
                <Input
                  id="document"
                  required
                  placeholder="Somente numeros"
                  value={form.document}
                  onChange={(event) => setField("document", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamSize">Tamanho da equipe</Label>
                <Input
                  id="teamSize"
                  placeholder="Ex: 1-5 pessoas"
                  value={form.teamSize}
                  onChange={(event) => setField("teamSize", event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="useCase">Objetivo principal</Label>
              <Textarea
                id="useCase"
                required
                rows={4}
                placeholder="Descreva o que voce quer automatizar e vender"
                value={form.useCase}
                onChange={(event) => setField("useCase", event.target.value)}
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Plano</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(planCatalog) as PlanId[]).map((planId) => (
                  <button
                    key={planId}
                    type="button"
                    onClick={() => setField("plan", planId)}
                    className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                      form.plan === planId
                        ? "border-primary bg-primary/10"
                        : "border-border/60 bg-background/60 hover:border-border"
                    }`}
                  >
                    <p className="font-semibold">{planCatalog[planId].name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{planCatalog[planId].amountLabel}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Forma de pagamento</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {billingOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setField("billingMethod", option.id)}
                    className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                      form.billingMethod === option.id
                        ? "border-primary bg-primary/10"
                        : "border-border/60 bg-background/60 hover:border-border"
                    }`}
                  >
                    <p className="font-semibold">{option.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{option.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button className="h-11 w-full gap-2 text-sm font-semibold" type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {loading ? "Criando checkout..." : "Ir para pagamento"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Ao continuar, voce concorda com o processamento dos dados para gerar sua cobranca no Asaas.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
};

export default OnboardingPage;


import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Fingerprint,
  Loader2,
  ShieldCheck,
  UserRoundCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PlanId = "horus";
type BillingMethod = "pix" | "boleto" | "cartao";
type AccessMode = "login" | "sales_page" | "checkout";

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
  accessMode: AccessMode;
  accessEmail: string;
  accessPassword: string;
  accessPasswordConfirm: string;
}

interface CheckoutResponse {
  checkoutUrl: string;
  paymentId: string;
  subscriptionId: string;
  customerId: string;
  leadId: string;
  amount: number;
  plan: PlanId;
  billingType: string;
  environment: string;
}

const planCatalog: Record<PlanId, { name: string; subtitle: string; amountLabel: string }> = {
  horus: {
    name: "Horus",
    subtitle: "Plano unico para captar, converter e operar 24h",
    amountLabel: "R$ 39,90 / mes",
  },
};

const billingOptions: Array<{ id: BillingMethod; label: string; hint: string }> = [
  { id: "pix", label: "PIX", hint: "Aprovacao rapida" },
  { id: "boleto", label: "Boleto", hint: "Pagamento bancario" },
  { id: "cartao", label: "Cartao", hint: "Checkout hospedado" },
];

const accessOptions: Array<{ id: AccessMode; label: string; hint: string }> = [
  { id: "login", label: "Login", hint: "Entrada direta no sistema" },
  { id: "sales_page", label: "Pagina de vendas", hint: "Fluxo para campanhas" },
  { id: "checkout", label: "Checkout", hint: "Compra sem friccao" },
];

const sanitizeDigits = (value: string) => value.replace(/\D/g, "");

const isValidAccessMode = (value: string | null): value is AccessMode => {
  return value === "login" || value === "sales_page" || value === "checkout";
};

const OnboardingPage = () => {
  const [searchParams] = useSearchParams();
  const initialAccessMode = isValidAccessMode(searchParams.get("mode")) ? searchParams.get("mode") : "checkout";

  const [form, setForm] = useState<OnboardingFormState>({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    document: "",
    teamSize: "",
    useCase: "",
    plan: "horus",
    billingMethod: "cartao",
    accessMode: initialAccessMode,
    accessEmail: "",
    accessPassword: "",
    accessPasswordConfirm: "",
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

  const selectedPlan = planCatalog.horus;
  const selectedAccess = accessOptions.find((option) => option.id === form.accessMode) ?? accessOptions[2];

  const setField = <K extends keyof OnboardingFormState>(field: K, value: OnboardingFormState[K]) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const ensureClientCredentials = async (email: string, password: string) => {
    const { data: currentUserData } = await supabase.auth.getUser();
    const currentUserEmail = currentUserData.user?.email?.toLowerCase();

    if (currentUserEmail && currentUserEmail === email) {
      return;
    }

    const signUpResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: form.fullName.trim(),
          company: form.company.trim(),
        },
      },
    });

    if (!signUpResult.error) {
      return;
    }

    const signUpMessage = signUpResult.error.message.toLowerCase();
    const userAlreadyExists =
      signUpMessage.includes("already") ||
      signUpMessage.includes("registered") ||
      signUpMessage.includes("exist");

    if (!userAlreadyExists) {
      throw signUpResult.error;
    }

    const signInResult = await supabase.auth.signInWithPassword({ email, password });

    if (signInResult.error) {
      throw new Error("As credenciais informadas ja existem, mas a senha nao confere.");
    }
  };

  const validateCredentials = () => {
    const accessEmail = form.accessEmail.trim().toLowerCase();
    const accessPassword = form.accessPassword;

    if (!accessEmail) {
      throw new Error("Informe o email de acesso do cliente.");
    }

    if (accessPassword.length < 8) {
      throw new Error("A senha de acesso precisa ter ao menos 8 caracteres.");
    }

    if (accessPassword !== form.accessPasswordConfirm) {
      throw new Error("A confirmacao de senha nao confere.");
    }

    return { accessEmail, accessPassword };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { accessEmail, accessPassword } = validateCredentials();
      await ensureClientCredentials(accessEmail, accessPassword);

      const payload = {
        name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: sanitizeDigits(form.phone),
        company: form.company.trim(),
        cpfCnpj: sanitizeDigits(form.document),
        teamSize: form.teamSize.trim(),
        useCase: form.useCase.trim(),
        plan: "horus" as PlanId,
        billingMethod: form.billingMethod,
        accessMode: form.accessMode,
        accessEmail,
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

      toast.success("Assinatura criada. Redirecionando para pagamento...");
      window.location.assign(data.checkoutUrl);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Erro inesperado no onboarding.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060a13] text-slate-100">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_0.95fr]">
        <section className="rounded-3xl border border-cyan-300/20 bg-slate-900/50 p-6 sm:p-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-cyan-100">
            <ArrowLeft className="h-4 w-4" />
            Voltar para home
          </Link>

          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.15em] text-cyan-200">Onboarding Horus</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight">Ative seu Horus e venda com recorrencia automatica</h1>
            <p className="mt-3 text-sm text-slate-300">
              Fluxo pronto para campanhas: cadastro do cliente, credenciais de acesso, assinatura recorrente no Asaas
              e confirmacao por webhook sem atendimento manual.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-cyan-300/30 bg-cyan-400/[0.10] p-5">
            <p className="text-sm font-semibold">Plano selecionado: {selectedPlan.name}</p>
            <p className="mt-1 text-sm text-slate-200">{selectedPlan.subtitle}</p>
            <p className="mt-3 text-2xl font-bold text-cyan-200">{selectedPlan.amountLabel}</p>

            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" /> Fluxo de venda 24h com onboarding automatizado</li>
              <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-cyan-300" /> Assinatura recorrente Asaas + confirmacao por webhook</li>
              <li className="flex items-start gap-2"><Zap className="mt-0.5 h-4 w-4 text-cyan-300" /> Cliente escolhe modalidade de acesso e comeca sem friccao</li>
            </ul>
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-[#091325] p-4 text-sm text-slate-300">
            <p className="font-medium text-slate-100">Modalidade atual: {selectedAccess.label}</p>
            <p className="mt-1">{selectedAccess.hint}</p>
            <p className="mt-2 break-all text-xs text-slate-400">
              source={utm.source || "-"} | medium={utm.medium || "-"} | campaign={utm.campaign || "-"}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-cyan-300/20 bg-slate-900/55 p-6 sm:p-8">
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
                <Label htmlFor="email">Email comercial</Label>
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

              <div className="space-y-2 sm:col-span-2">
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

            <div className="space-y-3 rounded-2xl border border-cyan-300/20 bg-[#0b1323] p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UserRoundCheck className="h-4 w-4 text-cyan-300" />
                Modalidade de acesso
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {accessOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setField("accessMode", option.id)}
                    className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                      form.accessMode === option.id
                        ? "border-cyan-300 bg-cyan-400/10"
                        : "border-cyan-300/20 bg-slate-900/30 hover:border-cyan-300/40"
                    }`}
                  >
                    <p className="font-semibold text-slate-100">{option.label}</p>
                    <p className="mt-1 text-xs text-slate-400">{option.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-cyan-300/20 bg-[#0b1323] p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Fingerprint className="h-4 w-4 text-cyan-300" />
                Credenciais do cliente
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="accessEmail">Email de acesso</Label>
                  <Input
                    id="accessEmail"
                    required
                    type="email"
                    placeholder="login@empresa.com"
                    value={form.accessEmail}
                    onChange={(event) => setField("accessEmail", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessPassword">Senha de acesso</Label>
                  <Input
                    id="accessPassword"
                    required
                    type="password"
                    placeholder="Minimo 8 caracteres"
                    value={form.accessPassword}
                    onChange={(event) => setField("accessPassword", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessPasswordConfirm">Confirmar senha</Label>
                  <Input
                    id="accessPasswordConfirm"
                    required
                    type="password"
                    placeholder="Repita a senha"
                    value={form.accessPasswordConfirm}
                    onChange={(event) => setField("accessPasswordConfirm", event.target.value)}
                  />
                </div>
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
                        ? "border-cyan-300 bg-cyan-400/10"
                        : "border-cyan-300/20 bg-slate-900/30 hover:border-cyan-300/40"
                    }`}
                  >
                    <p className="font-semibold text-slate-100">{option.label}</p>
                    <p className="mt-1 text-xs text-slate-400">{option.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button className="h-11 w-full gap-2 bg-cyan-400 text-sm font-semibold text-slate-900 hover:bg-cyan-300" type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {loading ? "Criando assinatura..." : "Ir para pagamento"}
            </Button>

            <p className="text-center text-xs text-slate-400">
              Ao continuar, voce concorda com o processamento dos dados para criar sua assinatura recorrente no Asaas.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
};

export default OnboardingPage;


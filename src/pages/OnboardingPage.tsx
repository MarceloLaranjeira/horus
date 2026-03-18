import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  Fingerprint,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import horusLogo from "@/assets/horus-logo.png";

type PlanId = "horus";
type BillingMethod = "pix" | "boleto" | "cartao";
type AccessMode = "login" | "sales_page" | "checkout";

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

const sanitizeDigits = (value: string) => value.replace(/\D/g, "");

const isValidAccessMode = (value: string | null): value is AccessMode =>
  value === "login" || value === "sales_page" || value === "checkout";

// ─── Plan features shown in the checkout sidebar ──────────────────────────────
const PLAN_FEATURES = [
  "Chat com IA ilimitado",
  "Tarefas e projetos",
  "Hábitos com streak e metas",
  "Finanças pessoais + análises",
  "Agenda + Google Calendar",
  "Notas e lembretes inteligentes",
  "Integração Gmail & WhatsApp",
  "Briefing diário personalizado",
  "PWA — funciona como app nativo",
];

// ─── Billing options ──────────────────────────────────────────────────────────
const billingOptions: Array<{ id: BillingMethod; label: string; hint: string }> = [
  { id: "pix", label: "PIX", hint: "Aprovação rápida" },
  { id: "boleto", label: "Boleto", hint: "Pagamento bancário" },
  { id: "cartao", label: "Cartão", hint: "Checkout hospedado" },
];

// ─── Internal access + modal-of-access options (sales/login mode) ─────────────
const accessOptions: Array<{ id: AccessMode; label: string; hint: string }> = [
  { id: "login", label: "Login", hint: "Entrada direta no sistema" },
  { id: "sales_page", label: "Página de vendas", hint: "Fluxo para campanhas" },
  { id: "checkout", label: "Checkout", hint: "Compra sem fricção" },
];

// ─── Success screen after public checkout ─────────────────────────────────────
function CheckoutSuccess({
  email,
  checkoutUrl,
}: {
  email: string;
  checkoutUrl: string;
}) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) {
      window.location.assign(checkoutUrl);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, checkoutUrl]);

  return (
    <div className="min-h-screen bg-[#060a13] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Animated checkmark */}
        <div className="inline-flex w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 items-center justify-center mb-6 mx-auto">
          <CheckCircle2 size={36} className="text-green-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Assinatura criada!
        </h1>
        <p className="text-slate-300 mb-6 leading-relaxed">
          Ótimo! Sua assinatura foi iniciada com sucesso.{" "}
          <span className="text-cyan-400 font-medium">
            Enviamos um link de acesso para{" "}
            <span className="underline">{email}</span>
          </span>{" "}
          — você poderá configurar sua senha após confirmar o pagamento.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Check size={14} className="text-green-400 shrink-0" />
            Assinatura Horus registrada no Asaas
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Check size={14} className="text-green-400 shrink-0" />
            Email de acesso enviado para {email}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Loader2 size={14} className="text-cyan-400 shrink-0 animate-spin" />
            Redirecionando para pagamento em {countdown}s...
          </div>
        </div>

        <Button
          onClick={() => window.location.assign(checkoutUrl)}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 gap-2"
        >
          Ir para pagamento agora
          <ArrowRight size={16} />
        </Button>

        <p className="text-slate-500 text-xs mt-4">
          Pagamento seguro via Asaas — Pix, cartão e boleto
        </p>
      </div>
    </div>
  );
}

// ─── Public checkout (from landing page) ─────────────────────────────────────
function PublicCheckout({ accessMode, utm }: { accessMode: AccessMode; utm: Record<string, string> }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    document: "",
    billingMethod: "cartao" as BillingMethod,
  });
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ email: string; checkoutUrl: string } | null>(null);

  const setField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const email = form.email.trim().toLowerCase();

      const { data, error } = await supabase.functions.invoke<CheckoutResponse>("asaas-checkout", {
        body: {
          name: form.fullName.trim(),
          email,
          phone: sanitizeDigits(form.phone),
          cpfCnpj: sanitizeDigits(form.document),
          plan: "horus" as PlanId,
          billingMethod: form.billingMethod,
          accessMode,
          accessEmail: email,
          utm,
        },
      });

      if (error) throw new Error(error.message || "Não foi possível iniciar o checkout.");
      if (!data?.checkoutUrl) throw new Error("Checkout não retornou uma URL válida.");

      // Send magic link so user can access the app after paying
      await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });

      setSuccessData({ email, checkoutUrl: data.checkoutUrl });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return <CheckoutSuccess email={successData.email} checkoutUrl={successData.checkoutUrl} />;
  }

  return (
    <div className="min-h-screen bg-[#060a13] text-slate-100">
      {/* Nav */}
      <header className="border-b border-white/5 px-5 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={horusLogo} alt="Horus" className="w-7 h-7 object-contain" />
            <span className="font-bold text-white">Horus</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            Voltar
          </Link>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:py-16">
        {/* Left — plan summary */}
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-400 mb-2">Plano Horus</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-bold text-white">R$ 39</span>
              <span className="text-slate-400 text-lg mb-1">,90/mês</span>
            </div>
            <p className="text-slate-400 text-sm">
              Assinatura recorrente — cancele quando quiser
            </p>
          </div>

          <ul className="space-y-2.5">
            {PLAN_FEATURES.map((feat) => (
              <li key={feat} className="flex items-center gap-3 text-sm text-slate-200">
                <Check size={14} className="text-cyan-400 shrink-0" />
                {feat}
              </li>
            ))}
          </ul>

          <div className="pt-2 space-y-2">
            {[
              { icon: ShieldCheck, text: "Pagamento processado pela Asaas" },
              { icon: Lock, text: "Dados protegidos — LGPD" },
              { icon: Mail, text: "Acesso enviado por email após pagamento" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-slate-500">
                <Icon size={13} className="text-slate-400 shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h1 className="text-xl font-bold text-white mb-6">Seus dados para a assinatura</h1>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                required
                placeholder="Como consta no CPF"
                value={form.fullName}
                onChange={(e) => setField("fullName", e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                required
                type="email"
                placeholder="voce@email.com"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className="bg-white/5 border-white/10"
              />
              <p className="text-xs text-slate-500">
                Será usado para acessar o Horus após o pagamento
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">WhatsApp</Label>
              <Input
                id="phone"
                required
                placeholder="(11) 99999-9999"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="document">CPF ou CNPJ</Label>
              <Input
                id="document"
                required
                placeholder="Somente números"
                value={form.document}
                onChange={(e) => setField("document", e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>

            {/* Billing method */}
            <div className="space-y-2 pt-1">
              <p className="text-sm font-medium text-slate-200">Forma de pagamento</p>
              <div className="grid grid-cols-3 gap-2">
                {billingOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setField("billingMethod", opt.id)}
                    className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                      form.billingMethod === opt.id
                        ? "border-cyan-400 bg-cyan-400/10"
                        : "border-white/10 bg-white/3 hover:border-white/20"
                    }`}
                  >
                    <p className="font-semibold text-slate-100 text-xs">{opt.label}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{opt.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Criando assinatura...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Assinar por R$ 39,90/mês
                </>
              )}
            </Button>

            <p className="text-center text-xs text-slate-500 leading-relaxed">
              Ao assinar, você concorda com o processamento dos dados para criar sua assinatura
              recorrente. Cancele quando quiser.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Internal / sales page (original form, preserved) ────────────────────────
function InternalCheckout({
  accessMode,
  utm,
}: {
  accessMode: AccessMode;
  utm: Record<string, string>;
}) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    document: "",
    teamSize: "",
    useCase: "",
    billingMethod: "cartao" as BillingMethod,
    accessMode,
    accessEmail: "",
    accessPassword: "",
    accessPasswordConfirm: "",
  });
  const [loading, setLoading] = useState(false);

  const setField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const selectedAccess = accessOptions.find((o) => o.id === form.accessMode) ?? accessOptions[2];

  const ensureClientCredentials = async (email: string, password: string) => {
    const { data: currentUserData } = await supabase.auth.getUser();
    if (currentUserData.user?.email?.toLowerCase() === email) return;

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: form.fullName.trim(), company: form.company.trim() } },
    });

    if (!signUpError) return;

    const msg = signUpError.message.toLowerCase();
    const exists = msg.includes("already") || msg.includes("registered") || msg.includes("exist");
    if (!exists) throw signUpError;

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error("As credenciais informadas já existem, mas a senha não confere.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accessEmail = form.accessEmail.trim().toLowerCase();
      const { accessPassword } = form;

      if (!accessEmail) throw new Error("Informe o email de acesso do cliente.");
      if (accessPassword.length < 8) throw new Error("A senha precisa ter ao menos 8 caracteres.");
      if (accessPassword !== form.accessPasswordConfirm) throw new Error("As senhas não coincidem.");

      await ensureClientCredentials(accessEmail, accessPassword);

      const { data, error } = await supabase.functions.invoke<CheckoutResponse>("asaas-checkout", {
        body: {
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
        },
      });

      if (error) throw new Error(error.message || "Não foi possível iniciar o checkout.");
      if (!data?.checkoutUrl) throw new Error("Checkout não retornou URL válida.");

      toast.success("Assinatura criada. Redirecionando para pagamento...");
      window.location.assign(data.checkoutUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro inesperado no onboarding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060a13] text-slate-100">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_0.95fr]">
        {/* Left info panel */}
        <section className="rounded-3xl border border-cyan-300/20 bg-slate-900/50 p-6 sm:p-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-cyan-100">
            <ArrowLeft className="h-4 w-4" />
            Voltar para home
          </Link>

          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.15em] text-cyan-200">Onboarding Horus</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight">
              Ative seu Horus e venda com recorrência automática
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Fluxo pronto para campanhas: cadastro do cliente, credenciais de acesso, assinatura
              recorrente no Asaas e confirmação por webhook sem atendimento manual.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-cyan-300/30 bg-cyan-400/[0.10] p-5">
            <p className="text-sm font-semibold">Plano Horus</p>
            <p className="mt-1 text-sm text-slate-200">Plano único para captar, converter e operar 24h</p>
            <p className="mt-3 text-2xl font-bold text-cyan-200">R$ 39,90 / mês</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />
                Fluxo de venda 24h com onboarding automatizado
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-cyan-300" />
                Assinatura recorrente Asaas + confirmação por webhook
              </li>
              <li className="flex items-start gap-2">
                <Zap className="mt-0.5 h-4 w-4 text-cyan-300" />
                Cliente escolhe modalidade de acesso e começa sem fricção
              </li>
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

        {/* Right form */}
        <section className="rounded-3xl border border-cyan-300/20 bg-slate-900/55 p-6 sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input id="fullName" required placeholder="Nome do cliente" value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email comercial</Label>
                <Input id="email" required type="email" placeholder="cliente@empresa.com" value={form.email} onChange={(e) => setField("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp</Label>
                <Input id="phone" required placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input id="company" required placeholder="Nome da empresa" value={form.company} onChange={(e) => setField("company", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document">CPF ou CNPJ</Label>
                <Input id="document" required placeholder="Somente números" value={form.document} onChange={(e) => setField("document", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="teamSize">Tamanho da equipe</Label>
                <Input id="teamSize" placeholder="Ex: 1-5 pessoas" value={form.teamSize} onChange={(e) => setField("teamSize", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="useCase">Objetivo principal</Label>
              <Textarea id="useCase" required rows={3} placeholder="Descreva o que o cliente quer automatizar" value={form.useCase} onChange={(e) => setField("useCase", e.target.value)} />
            </div>

            {/* Access mode */}
            <div className="space-y-3 rounded-2xl border border-cyan-300/20 bg-[#0b1323] p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UserRoundCheck className="h-4 w-4 text-cyan-300" />
                Modalidade de acesso
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {accessOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setField("accessMode", opt.id)}
                    className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                      form.accessMode === opt.id
                        ? "border-cyan-300 bg-cyan-400/10"
                        : "border-cyan-300/20 bg-slate-900/30 hover:border-cyan-300/40"
                    }`}
                  >
                    <p className="font-semibold text-slate-100">{opt.label}</p>
                    <p className="mt-1 text-xs text-slate-400">{opt.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Credentials */}
            <div className="space-y-3 rounded-2xl border border-cyan-300/20 bg-[#0b1323] p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Fingerprint className="h-4 w-4 text-cyan-300" />
                Credenciais do cliente
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="accessEmail">Email de acesso</Label>
                  <Input id="accessEmail" required type="email" placeholder="login@empresa.com" value={form.accessEmail} onChange={(e) => setField("accessEmail", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessPassword">Senha de acesso</Label>
                  <Input id="accessPassword" required type="password" placeholder="Mínimo 8 caracteres" value={form.accessPassword} onChange={(e) => setField("accessPassword", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessPasswordConfirm">Confirmar senha</Label>
                  <Input id="accessPasswordConfirm" required type="password" placeholder="Repita a senha" value={form.accessPasswordConfirm} onChange={(e) => setField("accessPasswordConfirm", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Billing */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Forma de pagamento</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {billingOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setField("billingMethod", opt.id)}
                    className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                      form.billingMethod === opt.id
                        ? "border-cyan-300 bg-cyan-400/10"
                        : "border-cyan-300/20 bg-slate-900/30 hover:border-cyan-300/40"
                    }`}
                  >
                    <p className="font-semibold text-slate-100">{opt.label}</p>
                    <p className="mt-1 text-xs text-slate-400">{opt.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="h-11 w-full gap-2 bg-cyan-400 text-sm font-semibold text-slate-900 hover:bg-cyan-300"
              type="submit"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {loading ? "Criando assinatura..." : "Ir para pagamento"}
            </Button>

            <p className="text-center text-xs text-slate-400">
              Ao continuar, você concorda com o processamento dos dados para criar a assinatura
              recorrente no Asaas.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────
const OnboardingPage = () => {
  const [searchParams] = useSearchParams();
  const accessMode: AccessMode = isValidAccessMode(searchParams.get("mode"))
    ? (searchParams.get("mode") as AccessMode)
    : "checkout";

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

  // Public checkout flow (from landing page)
  if (accessMode === "checkout") {
    return <PublicCheckout accessMode={accessMode} utm={utm} />;
  }

  // Internal/sales flow (login, sales_page)
  return <InternalCheckout accessMode={accessMode} utm={utm} />;
};

export default OnboardingPage;

import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  CreditCard,
  Fingerprint,
  Globe,
  Rocket,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const priceLabel = "R$ 39,90 / mes";

const benefits = [
  "Onboarding self-service para vender 24h por dia em campanhas",
  "Checkout Asaas integrado com confirmacao automatica de pagamento",
  "Assistente IA estilo J.A.R.V.I.S para operacao, execucao e follow-up",
  "Painel unico para tarefas, projetos, mensagens e analises",
  "Estrutura pronta para escalar como produto SaaS sem equipe gigante",
  "Coleta de credenciais do cliente no fluxo de ativacao",
] as const;

const resources = [
  {
    title: "Funil direto ADS > Venda",
    description: "Lead entra, preenche dados, ativa assinatura e ja inicia sem depender de humano.",
    icon: Rocket,
  },
  {
    title: "Assinatura mensal recorrente",
    description: "Pagamento mensal automatizado no Asaas para previsibilidade de receita.",
    icon: CreditCard,
  },
  {
    title: "Conta e acesso estruturados",
    description: "Cliente escolhe modalidade de acesso por login, pagina de vendas ou checkout.",
    icon: UserRoundCheck,
  },
  {
    title: "Seguranca e rastreio",
    description: "Webhook de confirmacao, trilha de eventos e dados centralizados no Supabase.",
    icon: ShieldCheck,
  },
] as const;

const accessModes = [
  {
    id: "login",
    title: "Acesso por login",
    description: "Ideal para quem ja quer entrar no app e operar o Horus no dia a dia.",
    href: "/auth",
  },
  {
    id: "sales_page",
    title: "Acesso por pagina de vendas",
    description: "Fluxo para campanhas: destaca beneficios, prova valor e envia para onboarding.",
    href: "/onboarding?mode=sales_page",
  },
  {
    id: "checkout",
    title: "Acesso por checkout",
    description: "Direto para compra com formulario e assinatura recorrente.",
    href: "/onboarding?mode=checkout",
  },
] as const;

const Index = () => {
  return (
    <div className="min-h-screen bg-[#060a13] text-slate-100">
      <div className="relative overflow-hidden border-b border-cyan-400/15">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(20,184,166,0.28),transparent_42%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_10%,rgba(56,189,248,0.24),transparent_38%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(34,211,238,0.12),transparent_45%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#060a13_0%,#090f1e_52%,#060a13_100%)]" />
        </div>

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.35)]">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.12em] text-cyan-100">HORUS AI</p>
              <p className="text-xs text-slate-400">SaaS de automacao comercial e operacao inteligente</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden border border-cyan-400/25 text-cyan-100 hover:bg-cyan-400/10 sm:inline-flex">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild className="bg-cyan-400 text-slate-900 hover:bg-cyan-300">
              <Link to="/onboarding?mode=checkout">Assinar agora</Link>
            </Button>
          </div>
        </header>

        <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-16 pt-6 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:pt-14">
          <div>
            <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-cyan-200">
              Horus | assistente de alta performance
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
              Tony Stark tinha o JARVIS.
              <span className="block text-cyan-300">Voce tem o Horus para vender e operar 24h.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">
              A pagina inicial foi desenhada para deslumbrar o lead e converter com clareza: proposta forte,
              beneficios objetivos, onboarding self-service e assinatura recorrente em um fluxo unico.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2 bg-cyan-400 text-slate-900 hover:bg-cyan-300">
                <Link to="/onboarding?mode=checkout">
                  Ativar Horus por {priceLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-cyan-400/35 bg-transparent text-cyan-100 hover:bg-cyan-400/10"
              >
                <Link to="/onboarding?mode=sales_page">Ver fluxo de vendas</Link>
              </Button>
            </div>

            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {benefits.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 rounded-2xl border border-cyan-400/20 bg-slate-900/45 px-4 py-3 text-sm text-slate-200"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-cyan-300/25 bg-slate-900/55 p-5 shadow-[0_20px_90px_rgba(20,184,166,0.15)] backdrop-blur">
            <div className="rounded-2xl border border-cyan-300/25 bg-[#0a1222] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">Horus Engine</p>
              <p className="mt-2 text-xl font-semibold">Assinatura unica {priceLabel}</p>
              <p className="mt-2 text-sm text-slate-300">
                Tudo em um so plano para acelerar aquisicao, onboarding e monetizacao recorrente.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {[
                "Lead entra pela landing em campanhas ADS",
                "Cliente escolhe modalidade: login, pagina de vendas ou checkout",
                "Formulario capta dados + credenciais de acesso",
                "Asaas cria assinatura recorrente e webhook confirma pagamento",
              ].map((step) => (
                <div
                  key={step}
                  className="rounded-xl border border-cyan-300/15 bg-[#0a1222]/80 px-4 py-3 text-sm text-slate-200"
                >
                  {step}
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs uppercase tracking-[0.12em] text-slate-300">
              <div className="rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-2 py-2">Self-service</div>
              <div className="rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-2 py-2">Recorrencia</div>
              <div className="rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-2 py-2">24h online</div>
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8">
        <div className="mb-6 flex items-center gap-2 text-cyan-200">
          <Sparkles className="h-4 w-4" />
          <p className="text-xs uppercase tracking-[0.16em]">Recursos e beneficios Horus</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {resources.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-cyan-300/20 bg-slate-900/45 p-5">
              <feature.icon className="h-5 w-5 text-cyan-300" />
              <h2 className="mt-4 text-base font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-14 sm:px-8">
        <div className="rounded-3xl border border-cyan-300/20 bg-[#071120] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Modalidades de acesso</p>
          <h2 className="mt-2 text-3xl font-bold">Escolha como o cliente entra no Horus</h2>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {accessModes.map((mode) => (
              <article key={mode.id} className="rounded-2xl border border-cyan-300/20 bg-slate-900/55 p-5">
                <div className="flex items-center gap-2 text-cyan-200">
                  {mode.id === "login" && <Fingerprint className="h-4 w-4" />}
                  {mode.id === "sales_page" && <Globe className="h-4 w-4" />}
                  {mode.id === "checkout" && <Bot className="h-4 w-4" />}
                  <p className="text-sm font-semibold">{mode.title}</p>
                </div>
                <p className="mt-3 text-sm text-slate-300">{mode.description}</p>
                <Button
                  asChild
                  className={cn(
                    "mt-5 w-full",
                    mode.id === "checkout"
                      ? "bg-cyan-400 text-slate-900 hover:bg-cyan-300"
                      : "border border-cyan-300/30 bg-transparent text-cyan-100 hover:bg-cyan-400/10"
                  )}
                >
                  <Link to={mode.href}>Usar esta entrada</Link>
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8">
        <div className="rounded-3xl border border-cyan-300/20 bg-slate-900/55 p-8 text-center">
          <h3 className="text-2xl font-bold">Plano unico Horus: {priceLabel}</h3>
          <p className="mt-3 text-sm text-slate-300">
            Sem tabela complexa, sem atrito. Um valor mensal para ativar onboarding, checkout recorrente e toda a operacao.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-cyan-400 text-slate-900 hover:bg-cyan-300">
              <Link to="/onboarding?mode=checkout">Comecar agora</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-cyan-300/30 bg-transparent text-cyan-100 hover:bg-cyan-400/10"
            >
              <Link to="/auth">Ja tenho login</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

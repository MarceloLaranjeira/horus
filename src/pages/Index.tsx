import { Link } from "react-router-dom";
import { ArrowRight, Bot, ShieldCheck, Rocket, Sparkles, Clock3, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "R$ 197",
    description: "Para profissionais solo que querem um copiloto de execucao.",
    bullets: ["Assistente IA estilo JARVIS", "Automacoes de tarefas e agenda", "Onboarding e checkout automatico"],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 397",
    description: "Para operacao comercial com campanhas e escala.",
    bullets: ["Fluxos de venda 24h", "Painel financeiro e produtividade", "Integracao de pagamentos Asaas"],
    highlight: true,
  },
  {
    id: "scale",
    name: "Scale",
    price: "R$ 997",
    description: "Para times com metas agressivas de crescimento.",
    bullets: ["Multi usuarios", "Rotinas e playbooks de equipe", "Suporte para integracoes avancadas"],
    highlight: false,
  },
] as const;

const features = [
  {
    title: "Operacao estilo JARVIS",
    description: "Interface e automacao pensadas para resposta rapida, foco e controle total da operacao.",
    icon: Bot,
  },
  {
    title: "Venda 24 horas",
    description: "Campanhas ADS entram no onboarding e o cliente fecha sozinho, sem precisar de humano.",
    icon: Clock3,
  },
  {
    title: "Checkout com Asaas",
    description: "Geracao de cobranca automatica com link de pagamento para acelerar conversao.",
    icon: CreditCard,
  },
  {
    title: "Base segura e escalavel",
    description: "Arquitetura com Supabase, trilha de onboarding e rastreio para evoluir como SaaS.",
    icon: ShieldCheck,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,hsl(var(--primary)/0.18),transparent_42%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_5%,hsl(var(--accent)/0.16),transparent_36%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,hsl(var(--background)),hsl(var(--background)/0.95))]" />
        </div>

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">HORUS AI</p>
              <p className="text-xs text-muted-foreground">SaaS de operacao inteligente</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild>
              <Link to="/onboarding">Comecar onboarding</Link>
            </Button>
          </div>
        </header>

        <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-16 pt-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:pt-14">
          <div>
            <span className="inline-flex items-center rounded-full border border-border/70 bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              SaaS pronto para ADS + vendas automaticas
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
              Seu produto digital no piloto automatico, com onboarding e pagamento 24h
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              O Horus combina assistente IA, operacao comercial e fluxo de cobranca para vender sem friccao.
              Campanha entra, lead qualifica, checkout abre e o cliente compra sem depender de atendimento manual.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/onboarding">
                  Ativar plano agora
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">Ja tenho conta</Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                ["Onboarding", "100% self-service"],
                ["Pagamento", "Asaas integrado"],
                ["Operacao", "Assistente estilo JARVIS"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border/60 bg-card/40 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                  <p className="mt-1 text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/40 p-5 shadow-2xl shadow-primary/10 backdrop-blur">
            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Pipeline</p>
                <p className="text-sm font-semibold">ADS {'>'} Onboarding {'>'} Checkout</p>
              </div>
              <Rocket className="h-5 w-5 text-primary" />
            </div>

            <div className="mt-4 space-y-3">
              {[
                "Lead entra pela pagina de onboarding",
                "Formulario qualifica sem friccao",
                "Edge function cria cobranca no Asaas",
                "Cliente finaliza no link de pagamento",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-border/60 bg-card/45 p-5">
              <feature.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-4 text-base font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Planos</p>
            <h2 className="text-3xl font-bold">Escolha seu nivel de escala</h2>
          </div>
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link to="/onboarding">Fazer onboarding</Link>
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={cn(
                "rounded-3xl border p-6",
                plan.highlight
                  ? "border-primary/70 bg-primary/[0.08] shadow-xl shadow-primary/20"
                  : "border-border/60 bg-card/45"
              )}
            >
              <p className="text-sm font-semibold">{plan.name}</p>
              <p className="mt-3 text-3xl font-bold">{plan.price}</p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {plan.bullets.map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" variant={plan.highlight ? "default" : "outline"}>
                <Link to={`/onboarding?plan=${plan.id}`}>Ativar {plan.name}</Link>
              </Button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;

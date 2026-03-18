import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  MessageSquare,
  CalendarDays,
  Wallet,
  ListTodo,
  StickyNote,
  Bell,
  Mail,
  Repeat2,
  BarChart3,
  Star,
  ArrowRight,
  Zap,
  Shield,
  Sparkles,
  Menu,
  X,
  Check,
  Globe,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import horusLogo from "@/assets/horus-logo.png";

// ─── Asaas Checkout URLs ─────────────────────────────────────────────────────
// Substitua pelas URLs reais do seu checkout Asaas
const ASAAS_LINKS = {
  mensal: "https://www.asaas.com/c/SEU_LINK_MENSAL",
  anual: "https://www.asaas.com/c/SEU_LINK_ANUAL",
  vitalicio: "https://www.asaas.com/c/SEU_LINK_VITALICIO",
};
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.07 },
  }),
};

function useScrolled(threshold = 20) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return scrolled;
}

// ─── Animated Section wrapper ────────────────────────────────────────────────
function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Preços", href: "#precos" },
    { label: "Depoimentos", href: "#depoimentos" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#060b14]/90 backdrop-blur-md border-b border-white/5"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5">
          <img src={horusLogo} alt="Horus" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg text-white tracking-tight">
            Horus
          </span>
        </a>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/auth"
            className="text-sm text-slate-300 hover:text-white transition-colors px-3 py-1.5"
          >
            Entrar
          </Link>
          <a
            href={ASAAS_LINKS.mensal}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-5 rounded-full"
            >
              Começar agora
            </Button>
          </a>
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-slate-300 hover:text-white p-1"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-[#060b14]/95 backdrop-blur-md border-t border-white/5 px-4 pb-4"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-slate-300 hover:text-white text-sm border-b border-white/5"
            >
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 mt-4">
            <Link to="/auth" onClick={() => setOpen(false)}>
              <Button
                variant="outline"
                className="w-full border-white/10 text-white hover:bg-white/5"
              >
                Entrar
              </Button>
            </Link>
            <a
              href={ASAAS_LINKS.mensal}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
                Começar agora
              </Button>
            </a>
          </div>
        </motion.div>
      )}
    </header>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#060b14] pt-16">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,200,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left — copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-6 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-4 py-1 text-xs font-medium">
              <Sparkles size={12} className="mr-1.5" />
              Seu Jarvis Pessoal — com IA
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6"
          >
            Organize sua vida{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              só conversando
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-400 text-lg leading-relaxed mb-8 max-w-xl"
          >
            Horus integra tarefas, hábitos, finanças, agenda, notas e muito
            mais em uma única conversa inteligente. Chega de mil abas abertas.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-3 mb-10"
          >
            <a
              href={ASAAS_LINKS.mensal}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full px-8 gap-2"
              >
                Começar agora
                <ArrowRight size={16} />
              </Button>
            </a>
            <Link to="/auth">
              <Button
                size="lg"
                variant="outline"
                className="border-white/10 text-white hover:bg-white/5 rounded-full px-8"
              >
                Já tenho conta
              </Button>
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-wrap gap-x-6 gap-y-2"
          >
            {[
              { icon: Shield, text: "Dados seguros" },
              { icon: Zap, text: "Respostas em segundos" },
              { icon: Globe, text: "100% em português" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-slate-400 text-sm">
                <Icon size={13} className="text-cyan-400" />
                {text}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — Chat mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <ChatMockup />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Chat mockup visual ───────────────────────────────────────────────────────
function ChatMockup() {
  const messages = [
    {
      role: "user",
      text: "Oi Horus, me lembra de pagar o cartão amanhã às 10h e adiciona uma tarefa pra revisar meu orçamento esta semana.",
    },
    {
      role: "ai",
      text: "Feito! ✅ Lembrete criado para amanhã às 10h. Tarefa \"Revisar orçamento\" adicionada para esta semana. Quer que eu já analise seus gastos do mês?",
    },
    {
      role: "user",
      text: "Sim! E como estou nos hábitos desta semana?",
    },
    {
      role: "ai",
      text: "📊 Você completou 6/7 hábitos ontem — ótimo! Seus gastos este mês: R$ 2.340 (82% do orçamento). Exercício: 5 dias seguidos 🔥",
    },
  ];

  return (
    <div className="relative mx-auto max-w-md">
      {/* Glow behind */}
      <div className="absolute -inset-4 bg-cyan-500/10 blur-2xl rounded-3xl" />

      {/* Phone frame */}
      <div className="relative bg-[#0e1520] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0a1018]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <Brain size={14} className="text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Horus</p>
            <p className="text-green-400 text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              online
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-3 max-h-80 overflow-hidden">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 + i * 0.3 }}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed",
                  m.role === "user"
                    ? "bg-cyan-500 text-black font-medium rounded-br-sm"
                    : "bg-white/8 text-slate-200 border border-white/5 rounded-bl-sm"
                )}
              >
                {m.text}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <span className="text-slate-500 text-xs flex-1">
              Escreva uma mensagem...
            </span>
            <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
              <ArrowRight size={12} className="text-black" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Social proof bar ─────────────────────────────────────────────────────────
function SocialProofBar() {
  const stats = [
    { value: "5.000+", label: "usuários ativos" },
    { value: "98%", label: "de satisfação" },
    { value: "12+", label: "integrações" },
    { value: "24/7", label: "disponível" },
  ];

  return (
    <Section className="bg-[#080d16] border-y border-white/5 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              custom={i}
              className="text-center"
            >
              <p className="text-2xl sm:text-3xl font-bold text-white">
                {s.value}
              </p>
              <p className="text-slate-400 text-sm mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const features = [
  {
    icon: MessageSquare,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    title: "Chat com IA",
    description:
      "Converse naturalmente e deixe a IA criar tarefas, lembretes e notas para você automaticamente.",
  },
  {
    icon: ListTodo,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    title: "Tarefas & Projetos",
    description:
      "Organize projetos complexos ou simples listas de tarefas com prioridades e prazos.",
  },
  {
    icon: Repeat2,
    color: "text-green-400",
    bg: "bg-green-400/10",
    title: "Hábitos",
    description:
      "Construa e monitore hábitos diários com streaks, metas e gráficos de progresso.",
  },
  {
    icon: CalendarDays,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    title: "Agenda & Google Calendar",
    description:
      "Veja e crie eventos em um único lugar, sincronizado com seu Google Calendar.",
  },
  {
    icon: Wallet,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    title: "Finanças Pessoais",
    description:
      "Controle receitas, despesas e orçamentos. Veja análises do seu comportamento financeiro.",
  },
  {
    icon: StickyNote,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    title: "Notas Inteligentes",
    description:
      "Capture ideias rapidamente. A IA organiza, resume e conecta suas notas.",
  },
  {
    icon: Bell,
    color: "text-red-400",
    bg: "bg-red-400/10",
    title: "Lembretes",
    description:
      "Nunca mais esqueça nada. Defina lembretes por texto e a IA entende o contexto.",
  },
  {
    icon: Mail,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    title: "Gmail & WhatsApp",
    description:
      "Leia e responda emails e mensagens diretamente pelo Horus, sem trocar de app.",
  },
  {
    icon: BarChart3,
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    title: "Análises & Insights",
    description:
      "Relatórios visuais sobre produtividade, finanças e hábitos para você evoluir.",
  },
];

function Features() {
  return (
    <Section id="funcionalidades" className="bg-[#060b14] py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="text-center mb-16">
          <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20">
            Tudo em um lugar
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Um assistente completo para sua vida
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Chega de abrir 10 apps diferentes. Horus centraliza tudo que você
            precisa para ser mais produtivo e organizado.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              custom={i}
              className="group relative bg-white/[0.03] border border-white/8 rounded-2xl p-6 hover:bg-white/[0.05] hover:border-white/15 transition-all duration-300"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-4",
                  f.bg
                )}
              >
                <f.icon size={20} className={f.color} />
              </div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      step: "01",
      icon: Brain,
      title: "Crie sua conta",
      description:
        "Cadastre-se em segundos com email ou Google. Sem configuração complicada.",
    },
    {
      step: "02",
      icon: MessageSquare,
      title: "Converse com o Horus",
      description:
        "Diga o que precisa em português natural. Ele cria tarefas, eventos e lembretes automaticamente.",
    },
    {
      step: "03",
      icon: TrendingUp,
      title: "Evolua com dados",
      description:
        "Acompanhe seu progresso, finanças e hábitos com análises visuais inteligentes.",
    },
  ];

  return (
    <Section
      id="como-funciona"
      className="bg-[#080d16] py-24 border-y border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="text-center mb-16">
          <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
            Como funciona
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Simples como uma conversa
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Sem curva de aprendizado. Se você sabe conversar, você sabe usar o
            Horus.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-cyan-500/20 via-blue-500/30 to-cyan-500/20" />

          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              variants={fadeUp}
              custom={i}
              className="relative text-center"
            >
              <div className="relative inline-flex w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 items-center justify-center mb-6 mx-auto">
                <s.icon size={28} className="text-cyan-400" />
                <span className="absolute -top-2 -right-2 text-xs font-bold text-cyan-400 bg-[#080d16] border border-cyan-500/30 rounded-full w-6 h-6 flex items-center justify-center">
                  {s.step}
                </span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-3">
                {s.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
                {s.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  const [billing, setBilling] = useState<"mensal" | "anual">("anual");

  const plans = [
    {
      name: "Mensal",
      price: "R$ 39",
      period: "/mês",
      description: "Perfeito para experimentar sem compromisso.",
      asaasKey: "mensal" as keyof typeof ASAAS_LINKS,
      highlight: false,
      features: [
        "Chat com IA ilimitado",
        "Tarefas e projetos",
        "Hábitos e lembretes",
        "Finanças pessoais",
        "Agenda e Google Calendar",
        "Suporte por email",
      ],
    },
    {
      name: "Anual",
      price: "R$ 27",
      period: "/mês",
      badge: "Mais popular",
      totalNote: "Cobrado R$ 324/ano — economia de R$ 144",
      description: "O melhor custo-benefício para usuários sérios.",
      asaasKey: "anual" as keyof typeof ASAAS_LINKS,
      highlight: true,
      features: [
        "Tudo do plano Mensal",
        "Integração Gmail & WhatsApp",
        "Análises e insights avançados",
        "Briefing diário inteligente",
        "Suporte prioritário",
        "Novos recursos em primeira mão",
      ],
    },
    {
      name: "Vitalício",
      price: "R$ 497",
      period: "único",
      description: "Pague uma vez, use para sempre.",
      asaasKey: "vitalicio" as keyof typeof ASAAS_LINKS,
      highlight: false,
      features: [
        "Tudo do plano Anual",
        "Acesso vitalício sem mensalidade",
        "Todas as integrações futuras",
        "Acesso a funcionalidades beta",
        "Suporte VIP",
        "Badge de fundador",
      ],
    },
  ];

  return (
    <Section id="precos" className="bg-[#060b14] py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="text-center mb-16">
          <Badge className="mb-4 bg-green-500/10 text-green-400 border-green-500/20">
            Preços transparentes
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Escolha seu plano
          </h2>
          <p className="text-slate-400 text-lg">
            Sem surpresas. Cancele quando quiser.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              custom={i}
              className={cn(
                "relative rounded-2xl p-7 flex flex-col",
                plan.highlight
                  ? "bg-gradient-to-b from-cyan-950/60 to-blue-950/40 border-2 border-cyan-500/40 shadow-[0_0_40px_rgba(0,200,255,0.10)]"
                  : "bg-white/[0.03] border border-white/8"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-cyan-500 text-black text-xs font-bold px-4 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="text-slate-300 font-semibold mb-1">{plan.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-slate-400 mb-1">{plan.period}</span>
                </div>
                {plan.totalNote && (
                  <p className="text-xs text-cyan-400 mt-1">{plan.totalNote}</p>
                )}
                <p className="text-slate-500 text-sm mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-8">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm">
                    <Check
                      size={15}
                      className={
                        plan.highlight ? "text-cyan-400 mt-0.5 shrink-0" : "text-slate-400 mt-0.5 shrink-0"
                      }
                    />
                    <span className="text-slate-300">{feat}</span>
                  </li>
                ))}
              </ul>

              <a
                href={ASAAS_LINKS[plan.asaasKey]}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  className={cn(
                    "w-full rounded-xl font-semibold",
                    plan.highlight
                      ? "bg-cyan-500 hover:bg-cyan-400 text-black"
                      : "bg-white/8 hover:bg-white/15 text-white border border-white/10"
                  )}
                >
                  Assinar {plan.name}
                </Button>
              </a>
            </motion.div>
          ))}
        </div>

        <motion.p
          variants={fadeIn}
          className="text-center text-slate-500 text-sm mt-8"
        >
          Pagamento seguro via{" "}
          <span className="text-slate-400 font-medium">Asaas</span> — Pix,
          cartão de crédito e boleto
        </motion.p>
      </div>
    </Section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const testimonials = [
    {
      name: "Lucas Andrade",
      role: "Empreendedor",
      avatar: "LA",
      color: "bg-cyan-500",
      text: "Horus mudou completamente como eu gerencio meu dia. Antes usava Notion, Todoist e um app de finanças separados. Agora é tudo em uma conversa.",
      stars: 5,
    },
    {
      name: "Mariana Costa",
      role: "Designer freelancer",
      avatar: "MC",
      color: "bg-purple-500",
      text: "O que mais gosto é poder falar em português mesmo. 'Me lembra disso amanhã' e pronto, tá feito. Parece mágica mas é IA de verdade.",
      stars: 5,
    },
    {
      name: "Rafael Souza",
      role: "Desenvolvedor",
      avatar: "RS",
      color: "bg-blue-500",
      text: "Finalmente um app de produtividade que não precisa de tutorial. Simplesmente funciona. Os insights de finanças me ajudaram a economizar R$ 400 no mês.",
      stars: 5,
    },
    {
      name: "Juliana Ferreira",
      role: "Professora",
      avatar: "JF",
      color: "bg-green-500",
      text: "Comecei os hábitos pelo Horus e em 3 meses consegui construir uma rotina de estudos consistente. O streak de 67 dias me motiva demais!",
      stars: 5,
    },
    {
      name: "Pedro Lima",
      role: "Médico",
      avatar: "PL",
      color: "bg-orange-500",
      text: "Com agenda cheia, preciso de algo que entenda minha rotina caótica. O Horus organiza tudo sem julgamento e ainda me dá um briefing diário.",
      stars: 5,
    },
    {
      name: "Ana Beatriz",
      role: "Estudante de MBA",
      avatar: "AB",
      color: "bg-pink-500",
      text: "A integração com Gmail foi um divisor de águas. Consigo lidar com todos os emails importantes sem sair do Horus. Economizo 1h por dia facilmente.",
      stars: 5,
    },
  ];

  return (
    <Section id="depoimentos" className="bg-[#080d16] py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="text-center mb-16">
          <Badge className="mb-4 bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
            Depoimentos
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Quem usa, não larga
          </h2>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={18}
                className="text-yellow-400 fill-yellow-400"
              />
            ))}
            <span className="text-slate-400 text-sm ml-2">
              4.9 de 5 — +500 avaliações
            </span>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              custom={i}
              className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(t.stars)].map((_, j) => (
                  <Star
                    key={j}
                    size={13}
                    className="text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-5">
                "{t.text}"
              </p>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold",
                    t.color
                  )}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: "O Horus funciona em celular?",
      a: "Sim! Horus é um PWA (Progressive Web App) — funciona como um app nativo no Android e iOS. Basta abrir no navegador e adicionar à tela inicial. Sem precisar de App Store.",
    },
    {
      q: "Como funciona o pagamento via Asaas?",
      a: "Aceitamos Pix, cartão de crédito (parcelado em até 12x) e boleto bancário, tudo processado com segurança pela plataforma Asaas. Após o pagamento confirmado, seu acesso é liberado automaticamente.",
    },
    {
      q: "Posso cancelar a qualquer momento?",
      a: "Sim, sem multas nem burocracia. Para planos mensais e anuais, você pode cancelar a qualquer momento pelo painel de configurações. Seu acesso permanece ativo até o fim do período pago.",
    },
    {
      q: "Meus dados estão seguros?",
      a: "Absolutamente. Usamos Supabase com criptografia em trânsito e em repouso. Seus dados nunca são usados para treinar modelos de IA de terceiros. Conformidade com LGPD.",
    },
    {
      q: "Que modelos de IA o Horus usa?",
      a: "Horus suporta GPT-4o (OpenAI), Claude 3.5 (Anthropic) e Gemini (Google). Você pode escolher o modelo nas configurações de IA. Cada plano inclui uso generoso de tokens.",
    },
    {
      q: "A integração com Google Calendar é automática?",
      a: "Sim! Basta conectar sua conta Google nas configurações. Seus eventos aparecem na agenda do Horus e você pode criar novos eventos pela conversa com a IA.",
    },
    {
      q: "Tem limite de mensagens com a IA?",
      a: "Os planos pagos têm uso generoso que atende a maioria dos usuários. Caso precise de volumes maiores, entre em contato para um plano personalizado.",
    },
    {
      q: "O plano vitalício inclui futuras funcionalidades?",
      a: "Sim! O plano vitalício inclui todas as funcionalidades atuais e futuras, além de acesso a betas e o badge de fundador no perfil.",
    },
  ];

  return (
    <Section id="faq" className="bg-[#060b14] py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="text-center mb-14">
          <Badge className="mb-4 bg-slate-500/10 text-slate-400 border-slate-500/20">
            Dúvidas frequentes
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ainda tem dúvidas?
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              custom={i}
              className="border border-white/8 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
              >
                <span className="text-white font-medium text-sm pr-4">
                  {faq.q}
                </span>
                <ChevronDown
                  size={16}
                  className={cn(
                    "text-slate-400 shrink-0 transition-transform duration-200",
                    open === i ? "rotate-180" : ""
                  )}
                />
              </button>
              {open === i && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 pb-4"
                >
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <Section className="bg-[#080d16] py-24 border-t border-white/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div variants={fadeUp}>
          <div className="inline-flex w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 items-center justify-center mb-8 mx-auto">
            <Brain size={36} className="text-cyan-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Pronto para organizar sua vida{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              de um jeito novo?
            </span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Junte-se a milhares de pessoas que já usam o Horus para ser mais
            produtivas, organizadas e financeiramente conscientes.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <a
              href={ASAAS_LINKS.mensal}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full px-10 gap-2"
              >
                Começar agora
                <ArrowRight size={16} />
              </Button>
            </a>
            <Link to="/auth">
              <Button
                size="lg"
                variant="outline"
                className="border-white/10 text-white hover:bg-white/5 rounded-full px-8"
              >
                Já tenho conta
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {[
              "Sem cartão para testar",
              "Cancele quando quiser",
              "Suporte em português",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-1.5 text-slate-400 text-sm"
              >
                <CheckCircle2 size={14} className="text-cyan-400" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#060b14] border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <img
                src={horusLogo}
                alt="Horus"
                className="w-7 h-7 object-contain"
              />
              <span className="font-bold text-white">Horus</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Seu assistente pessoal com IA. Organize sua vida só conversando.
            </p>
          </div>

          {/* Produto */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">Produto</p>
            <ul className="space-y-2">
              {[
                { label: "Funcionalidades", href: "#funcionalidades" },
                { label: "Preços", href: "#precos" },
                { label: "Como funciona", href: "#como-funciona" },
                { label: "Depoimentos", href: "#depoimentos" },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">Suporte</p>
            <ul className="space-y-2">
              {[
                { label: "FAQ", href: "#faq" },
                { label: "Contato", href: "mailto:contato@horus.app" },
                { label: "Status", href: "#" },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">Legal</p>
            <ul className="space-y-2">
              {[
                { label: "Política de Privacidade", href: "#" },
                { label: "Termos de Uso", href: "#" },
                { label: "LGPD", href: "#" },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Horus. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-1.5 text-slate-500 text-sm">
            <Clock size={13} />
            Pagamento seguro via{" "}
            <span className="text-slate-400 font-medium">Asaas</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060b14] font-sans">
      <Navbar />
      <Hero />
      <SocialProofBar />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

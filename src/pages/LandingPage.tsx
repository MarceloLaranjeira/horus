import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight, Check, X, Mic, MessageSquare, Calendar, Shield, Star, Zap, Brain, Target, Clock, DollarSign, Bell, FolderKanban, BarChart3, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import aurataskLogo from "@/assets/auratask-logo.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const competitors = [
  { name: "Notion", problem: "O labirinto da configuração infinita", issues: ["2 horas configurando para usar 10 minutos", "Templates que ninguém usa", "Complexidade que paralisa", "Curva de aprendizado de uma semana"] },
  { name: "ClickUp", problem: "A sobrecarga cognitiva em forma de app", issues: ["Mil botões, zero produtividade", "Interface confusa", "Funcionalidades demais", "Você se perde na ferramenta"] },
  { name: "Trello", problem: "A ilusão da organização visual", issues: ["Quadrinhos coloridos, organização zero", "Visual bonito sem substância", "Sem priorização inteligente", "Parece organizado mas não funciona"] },
  { name: "Todoist", problem: "O caos das listas infinitas", issues: ["Listas que se multiplicam sozinhas", "Sem contexto real das prioridades", "Organização que vira desorganização", "50 listas e você perdido"] },
];

const features = [
  { icon: MessageSquare, title: "Chat IA", desc: "Converse naturalmente por texto ou voz" },
  { icon: Target, title: "Tarefas", desc: "Priorização automática inteligente" },
  { icon: BarChart3, title: "Hábitos", desc: "Gamificação que realmente funciona" },
  { icon: DollarSign, title: "Finanças", desc: "Controle financeiro completo" },
  { icon: Bell, title: "Lembretes", desc: "Nunca mais esqueça nada" },
  { icon: FolderKanban, title: "Projetos", desc: "Gerencie projetos complexos" },
  { icon: BookOpen, title: "Conhecimento", desc: "Sua base de conhecimento pessoal" },
  { icon: Brain, title: "Análises", desc: "Insights sobre sua vida" },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="min-h-screen bg-gradient-dark overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px]" />
        </div>

        <motion.div className="relative z-10 text-center max-w-4xl mx-auto" initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} className="flex justify-center mb-6">
            <img src={aurataskLogo} alt="AuraTask" className="w-24 h-24 md:w-32 md:h-32 object-contain" />
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Tony Stark tem o Jarvis.
            <br />
            <span className="text-gradient-blue">Você tem o AuraTask.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground mb-4">
            Se organize apenas <span className="text-foreground font-semibold">conversando</span>.
          </motion.p>

          <motion.p variants={fadeUp} className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Enquanto espera o café, você organiza a semana inteira. Só conversando. Como com um amigo.
          </motion.p>

          {/* Mock App Preview */}
          <motion.div variants={fadeUp} className="mx-auto max-w-3xl mb-10">
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-accent/60" />
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--nectar-green))]/60" />
                </div>
                <div className="flex-1 text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" /> app.auratask.com
                </div>
              </div>
              <div className="p-6 space-y-3">
                {["Comprar passagens aéreas para Portugal", "Pesquisar hotéis em Lisboa", "Terminar relatório para o trabalho", "Pagar conta de luz"].map((task, i) => (
                  <div key={i} className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                        <Target className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{task}</p>
                        <p className="text-xs text-muted-foreground">📅 {18 + i}/02 • 🟡 Média</p>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded border border-border" />
                  </div>
                ))}
                <div className="flex items-center gap-2 text-primary text-sm pt-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse delay-100" />
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse delay-200" />
                  </div>
                  Criando projeto: Viagem Portugal...
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="text-lg px-8 py-6 glow-blue" onClick={() => navigate("/auth")}>
              Ativar meu Jarvis agora <ArrowRight className="ml-2" />
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-6 justify-center mt-6 text-sm text-muted-foreground">
            <span>🔒 14 dias de garantia</span>
            <span>📱 Multidispositivo</span>
            <span>❌ Cancele quando quiser</span>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <motion.div className="max-w-6xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <p className="text-primary text-sm font-semibold mb-2">Conheça o AuraTask por Dentro</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Cada área da sua vida,<br /><span className="text-gradient-blue">organizada em um só lugar</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 hover:glow-blue cursor-pointer group">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <f.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">{f.title}</h3>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Comparison: ChatGPT vs Néctar */}
      <section className="py-20 px-4 border-t border-border/30">
        <motion.div className="max-w-6xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <p className="text-primary text-sm font-semibold mb-2">A Diferença é Real</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              IAs Comuns <span className="text-muted-foreground">vs</span> <span className="text-gradient-blue">AuraTask</span>
            </h2>
            <p className="text-muted-foreground">Veja a diferença entre chatbots que só respondem e um assistente que <strong className="text-foreground">organiza toda sua vida</strong>.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* ChatGPT side */}
            <motion.div variants={fadeUp}>
              <Card className="bg-card border-destructive/20 h-full">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <X className="w-5 h-5 text-destructive" /> ChatGPT, Claude, Gemini...
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">Só respondem perguntas</p>
                  <div className="bg-secondary/50 rounded-lg p-4 text-sm text-muted-foreground">
                    Que ótimo! Meditação é uma excelente prática para reduzir o estresse. Aqui estão algumas dicas para começar: encontre um local tranquilo, defina um horário fixo e use aplicativos como Headspace...
                  </div>
                  <p className="text-xs text-destructive mt-3 flex items-center gap-1">
                    <X className="w-3 h-3" /> Nada foi organizado ou salvo
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Néctar side */}
            <motion.div variants={fadeUp}>
              <Card className="bg-card border-primary/30 h-full glow-blue">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" /> AuraTask AI
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">Entende, executa e organiza</p>
                  <div className="space-y-2">
                    <div className="bg-secondary/50 rounded-lg p-3 flex items-center justify-between border border-[hsl(var(--nectar-green))]/20">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[hsl(var(--nectar-green))]" />
                        <span className="text-sm">Meditar 15 min/dia</span>
                      </div>
                      <span className="text-xs text-muted-foreground">0/30</span>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 flex items-center justify-between border border-destructive/20">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-destructive" />
                        <span className="text-sm">Ligar para o médico</span>
                      </div>
                      <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">alta</span>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 flex items-center justify-between border border-accent/20">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-accent" />
                        <span className="text-sm">Finalizar apresentação</span>
                      </div>
                      <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">alta</span>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 flex items-center justify-between border border-[hsl(var(--nectar-green))]/20">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-[hsl(var(--nectar-green))]" />
                        <span className="text-sm">Freelance</span>
                      </div>
                      <span className="text-xs text-[hsl(var(--nectar-green))]">+R$ 800</span>
                    </div>
                  </div>
                  <p className="text-xs text-[hsl(var(--nectar-green))] mt-3 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Tudo salvo e sincronizado
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 border-t border-border/30">
        <motion.div className="max-w-4xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <p className="text-primary text-sm font-semibold mb-2">Como Funciona a Mágica</p>
            <h2 className="text-3xl md:text-5xl font-bold">
              Por que ter o <span className="text-gradient-blue">AuraTask</span> como seu Jarvis pessoal?
            </h2>
          </motion.div>

          {[
            { step: "1", title: "Você Conversa Naturalmente", desc: "Fale como fala com um amigo. Misture tarefas, compromissos, hábitos e finanças numa única mensagem." },
            { step: "2", title: "AuraTask Processa e Entende", desc: "O AuraTask analisa, categoriza e organiza tudo automaticamente usando processamento de linguagem natural avançado." },
            { step: "3", title: "Tudo Organizado Automaticamente", desc: "Sua vida organizada em segundos. Tudo categorizado, priorizado e pronto para ação." },
          ].map((item, i) => (
            <motion.div key={i} variants={fadeUp} className="flex gap-6 mb-12 last:mb-0">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg border border-primary/30">
                {item.step}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Competitors Comparison */}
      <section className="py-20 px-4 border-t border-border/30">
        <motion.div className="max-w-6xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <p className="text-primary text-sm font-semibold mb-2">Comparação Honesta</p>
            <h2 className="text-3xl md:text-5xl font-bold">
              Claro, você <span className="text-muted-foreground line-through">pode</span> usar outras ferramentas...
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {competitors.map((c, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="bg-card border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{c.name}</h3>
                        <p className="text-sm text-muted-foreground">{c.problem}</p>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">VS AuraTask</span>
                    </div>
                    <div className="space-y-2">
                      {c.issues.map((issue, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm">
                          <X className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 border-t border-border/30">
        <motion.div className="max-w-2xl mx-auto text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp}>
            <p className="text-primary text-sm font-semibold mb-2">Investimento na Sua Produtividade</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Tecnologia Tony Stark,<br /><span className="text-gradient-gold">feita para você!</span>
            </h2>
            <p className="text-muted-foreground mb-8">Por menos de R$ 1 por dia, tenha acesso ao seu próprio Jarvis.</p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="bg-card border-primary/30 glow-blue">
              <CardContent className="p-8">
                <p className="text-primary text-sm font-semibold mb-1">🚀 Seu Jarvis Pessoal Completo</p>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-5xl font-bold">R$ 49,90</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">Apenas R$ 1,66 por dia — Menos que um café ☕</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8">
                  {[
                    "IA conversacional completa",
                    "Tarefas e projetos ilimitados",
                    "Controle financeiro completo",
                    "Hábitos ilimitados",
                    "Lembretes ilimitados",
                    "Análises avançadas e insights",
                    "Sync com Google Calendar",
                    "Comandos de voz",
                    "Suporte prioritário",
                    "Integração WhatsApp",
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-[hsl(var(--nectar-green))]" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <Button size="lg" className="w-full text-lg py-6 glow-blue" onClick={() => navigate("/app")}>
                  Começar Agora <ArrowRight className="ml-2" />
                </Button>

                <p className="text-xs text-muted-foreground mt-4">
                  🎯 14 dias de garantia • Cancele quando quiser • Suporte em português
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 border-t border-border/30">
        <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp}>
            <div className="flex justify-center gap-8 mb-8">
              <div><p className="text-3xl font-bold text-primary">1.000+</p><p className="text-sm text-muted-foreground">vidas organizadas</p></div>
              <div><p className="text-3xl font-bold text-accent">4.9★</p><p className="text-sm text-muted-foreground">avaliação média</p></div>
              <div><p className="text-3xl font-bold text-[hsl(var(--nectar-green))]">97%</p><p className="text-sm text-muted-foreground">recomendam</p></div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Então, vamos ativar seu próprio Jarvis?</h2>
            <p className="text-muted-foreground mb-8">Pare de imaginar e comece a viver uma vida verdadeiramente organizada.</p>
            <Button size="lg" className="text-lg px-10 py-6 glow-blue" onClick={() => navigate("/app")}>
              Sim, Quero Meu Jarvis Agora! <ArrowRight className="ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground mt-4">⚡ Ativação instantânea • 🎯 14 dias de garantia • 🔒 Sem compromisso</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/30 text-center text-sm text-muted-foreground">
        <div className="flex justify-center gap-6 mb-4">
          <span>🔒 Dados 100% seguros</span>
          <span>📜 LGPD Compliance</span>
          <span>🇧🇷 Suporte em português</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

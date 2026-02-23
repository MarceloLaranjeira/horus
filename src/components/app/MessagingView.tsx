import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Bot, ExternalLink, Settings } from "lucide-react";

interface MessagingSetupViewProps {
  platform: "whatsapp" | "telegram";
}

const config = {
  whatsapp: {
    title: "WhatsApp",
    icon: MessageCircle,
    color: "#25D366",
    description: "Conecte o WhatsApp Business para ter o Horus como agente IA respondendo seus clientes automaticamente, além de visualizar e enviar mensagens.",
    steps: [
      "Acesse o Meta for Developers e crie um app do tipo Business",
      "Ative a API do WhatsApp Business no seu app",
      "Obtenha o Phone Number ID e Permanent Access Token",
      "Configure o webhook com a URL do Horus",
    ],
    docUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
  },
  telegram: {
    title: "Telegram",
    icon: Bot,
    color: "#0088cc",
    description: "Conecte o Telegram Bot para ter o Horus como agente IA automatizado, respondendo mensagens e gerenciando conversas diretamente pelo painel.",
    steps: [
      "Abra o Telegram e busque @BotFather",
      "Envie /newbot e siga as instruções para criar seu bot",
      "Copie o token de API fornecido",
      "Configure o webhook para conectar ao Horus",
    ],
    docUrl: "https://core.telegram.org/bots#how-do-i-create-a-bot",
  },
};

export const MessagingView = ({ platform }: MessagingSetupViewProps) => {
  const c = config[platform];
  const Icon = c.icon;

  return (
    <div className="flex items-center justify-center h-full p-6">
      <Card className="max-w-lg w-full border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto p-4 rounded-2xl w-fit mb-3" style={{ backgroundColor: c.color + "15" }}>
            <Icon className="w-10 h-10" style={{ color: c.color }} />
          </div>
          <CardTitle className="text-xl">{c.title} – Agente Horus</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">{c.description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Como configurar:</h4>
            <ol className="space-y-2">
              {c.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button className="gap-2" style={{ backgroundColor: c.color }}>
              <Settings className="w-4 h-4" />
              Configurar {c.title}
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <a href={c.docUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" /> Documentação
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Em breve: integração completa com agente IA automático + painel de conversas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  Copy,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Server,
  Rocket,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

const REPO_URL = "https://github.com/user/whatsapp-web-api-template";

const RAILWAY_DEPLOY_URL = `https://railway.app/template?template=${encodeURIComponent(REPO_URL)}`;
const RENDER_DEPLOY_URL = `https://render.com/deploy?repo=${encodeURIComponent(REPO_URL)}`;

const SERVER_CODE = `// server.js — WhatsApp Web API (whatsapp-web.js)
// Deploy no Railway ou Render em 1 clique!

const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");

const app = express();
app.use(express.json());

let qrCodeData = null;
let isReady = false;
let clientInfo = null;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
    ],
  },
});

client.on("qr", async (qr) => {
  qrCodeData = await qrcode.toDataURL(qr);
  console.log("QR Code gerado!");
});

client.on("ready", () => {
  isReady = true;
  qrCodeData = null;
  clientInfo = client.info;
  console.log("WhatsApp conectado:", clientInfo?.pushname);
});

client.on("disconnected", () => {
  isReady = false;
  clientInfo = null;
  console.log("WhatsApp desconectado");
});

// Endpoints da API
app.get("/status", (req, res) => {
  res.json({
    connected: isReady,
    user: clientInfo?.pushname || null,
    phone: clientInfo?.wid?.user || null,
  });
});

app.get("/qr", (req, res) => {
  if (isReady) {
    return res.json({ connected: true, message: "Já conectado" });
  }
  if (!qrCodeData) {
    return res.json({ error: "QR Code ainda não gerado, aguarde..." });
  }
  res.json({ qr: qrCodeData });
});

app.post("/send", async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: "phone e message são obrigatórios" });
    }
    if (!isReady) {
      return res.status(503).json({ error: "WhatsApp não conectado" });
    }
    const chatId = phone.includes("@c.us") ? phone : \`\${phone}@c.us\`;
    await client.sendMessage(chatId, message);
    res.json({ success: true, message: "Mensagem enviada!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`Servidor rodando na porta \${PORT}\`));

client.initialize();`;

const PACKAGE_JSON = `{
  "name": "whatsapp-web-api",
  "version": "1.0.0",
  "scripts": { "start": "node server.js" },
  "dependencies": {
    "express": "^4.18.2",
    "whatsapp-web.js": "^1.26.0",
    "qrcode": "^1.5.3"
  }
}`;

const DOCKERFILE = `FROM node:20-slim
RUN apt-get update && apt-get install -y \\
  chromium \\
  --no-install-recommends && \\
  rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`;

interface CodeBlockProps {
  title: string;
  code: string;
  language?: string;
}

const CodeBlock = ({ title, code }: CodeBlockProps) => {
  const [expanded, setExpanded] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const lines = code.split("\n");
  const preview = lines.slice(0, 5).join("\n");

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50">
        <span className="text-xs font-mono font-medium text-muted-foreground">{title}</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={copyCode}>
            <Copy className="w-3 h-3 mr-1" /> Copiar
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </div>
      <pre className="p-3 text-xs font-mono overflow-x-auto bg-background/50 max-h-[400px] overflow-y-auto">
        <code>{expanded ? code : `${preview}\n...`}</code>
      </pre>
    </div>
  );
};

interface StepProps {
  number: number;
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}

const Step = ({ number, title, children, icon }: StepProps) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
        {number}
      </div>
      <div className="w-px flex-1 bg-border mt-2" />
    </div>
    <div className="pb-8 flex-1">
      <h3 className="font-semibold flex items-center gap-2 mb-2">
        {icon}
        {title}
      </h3>
      <div className="space-y-3 text-sm text-muted-foreground">{children}</div>
    </div>
  </div>
);

export const WhatsAppSetupGuide = () => {
  const [showGuide, setShowGuide] = useState(false);

  if (!showGuide) {
    return (
      <Button
        variant="link"
        className="px-0 text-xs h-auto"
        onClick={() => setShowGuide(true)}
      >
        Não tem um servidor? Veja como criar em minutos →
      </Button>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Rocket className="w-3 h-3" /> Guia Rápido
            </Badge>
            <span className="text-sm font-semibold">Criar servidor WhatsApp</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowGuide(false)}>
            Fechar
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Crie seu próprio servidor WhatsApp em minutos. Escolha Railway ou Render (ambos têm plano gratuito).
        </p>

        <Step number={1} title="Crie os arquivos do servidor" icon={<Server className="w-4 h-4" />}>
          <p>
            Crie um novo repositório no GitHub com estes 3 arquivos:
          </p>
          <div className="space-y-2">
            <CodeBlock title="server.js" code={SERVER_CODE} />
            <CodeBlock title="package.json" code={PACKAGE_JSON} />
            <CodeBlock title="Dockerfile" code={DOCKERFILE} />
          </div>
        </Step>

        <Step number={2} title="Deploy com 1 clique" icon={<Rocket className="w-4 h-4" />}>
          <p>Escolha uma plataforma e faça o deploy:</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="https://railway.app" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 mr-1" />
                Railway — New Project → Deploy from GitHub
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="https://render.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 mr-1" />
                Render — New Web Service → Connect Repo
              </a>
            </Button>
          </div>
          <p className="text-xs">
            Ambos detectam o Dockerfile automaticamente. O deploy leva ~2 minutos.
          </p>
        </Step>

        <Step number={3} title="Copie a URL e cole acima" icon={<Globe className="w-4 h-4" />}>
          <p>
            Após o deploy, copie a URL gerada (ex: <code className="text-xs bg-muted px-1 rounded">https://meu-whatsapp.up.railway.app</code>) e cole no campo "URL do servidor" acima.
          </p>
          <p>
            Depois clique em <strong>Conectar WhatsApp</strong> para escanear o QR Code!
          </p>
        </Step>
      </CardContent>
    </Card>
  );
};

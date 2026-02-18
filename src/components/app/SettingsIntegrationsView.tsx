import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calendar, MessageCircle, Loader2, CheckCircle2, XCircle, QrCode, Smartphone, Wifi } from "lucide-react";
import { WhatsAppSetupGuide } from "./WhatsAppSetupGuide";

type ConnectionStatus = "idle" | "checking" | "connected" | "disconnected" | "error";

export const SettingsIntegrationsView = () => {
  const { user } = useAuth();
  const [serverUrl, setServerUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [connectionMsg, setConnectionMsg] = useState("");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("user_integrations")
        .select("*")
        .eq("user_id", user.id)
        .eq("integration_type", "whatsapp_server")
        .maybeSingle();

      if (data?.credentials) {
        const creds = data.credentials as { server_url?: string };
        setServerUrl(creds.server_url || "");
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const saveServerUrl = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("user_integrations")
      .upsert(
        {
          user_id: user.id,
          integration_type: "whatsapp_server",
          credentials: { server_url: serverUrl },
          enabled: true,
        },
        { onConflict: "user_id,integration_type" }
      );

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("URL do servidor salva!");
    }
    setSaving(false);
  };

  const checkStatus = async () => {
    setConnectionStatus("checking");
    setConnectionMsg("");
    try {
      await saveServerUrl();
      const { data, error } = await supabase.functions.invoke("whatsapp", {
        body: { action: "status" },
      });

      if (error) {
        setConnectionStatus("error");
        setConnectionMsg(error.message);
        return;
      }

      if (data?.success && data?.connected) {
        setConnectionStatus("connected");
        setConnectionMsg("WhatsApp conectado!");
      } else if (data?.success) {
        setConnectionStatus("disconnected");
        setConnectionMsg("Servidor online, WhatsApp desconectado");
      } else {
        setConnectionStatus("error");
        setConnectionMsg(data?.error || "Falha na conexão");
      }
    } catch (e: any) {
      setConnectionStatus("error");
      setConnectionMsg(e.message || "Erro inesperado");
    }
  };

  const fetchQrCode = useCallback(async () => {
    setQrLoading(true);
    setQrError("");
    setQrCode(null);
    setPairingCode(null);
    try {
      await saveServerUrl();
      const { data, error } = await supabase.functions.invoke("whatsapp", {
        body: { action: "get_qrcode" },
      });

      if (error) {
        setQrError(error.message || "Erro ao obter QR Code");
        return;
      }

      if (data?.alreadyConnected) {
        setQrError("");
        setQrCode(null);
        setPairingCode(null);
        toast.success("WhatsApp já está conectado!");
        setQrDialogOpen(false);
        setConnectionStatus("connected");
        setConnectionMsg("WhatsApp conectado!");
        return;
      }

      if (data?.success && data?.qr) {
        setQrCode(data.qr);
      } else if (data?.success && data?.pairingCode) {
        setPairingCode(data.pairingCode);
      } else {
        setQrError(data?.error || "QR Code não disponível");
      }
    } catch (e: any) {
      setQrError(e.message || "Erro inesperado");
    } finally {
      setQrLoading(false);
    }
  }, [serverUrl, user]);

  const openQrDialog = () => {
    setQrDialogOpen(true);
    fetchQrCode();
  };

  const StatusBadge = () => {
    if (connectionStatus === "idle") return null;
    if (connectionStatus === "checking")
      return <Badge variant="secondary" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Verificando...</Badge>;
    if (connectionStatus === "connected")
      return <Badge variant="default" className="gap-1 bg-primary"><CheckCircle2 className="w-3 h-3" /> {connectionMsg}</Badge>;
    if (connectionStatus === "disconnected")
      return <Badge variant="secondary" className="gap-1"><Wifi className="w-3 h-3" /> {connectionMsg}</Badge>;
    return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> {connectionMsg}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrações</h1>
        <p className="text-muted-foreground">Configure suas conexões com serviços externos.</p>
      </div>

      {/* Google Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Google Calendar</CardTitle>
              <CardDescription>Autenticação gerenciada via login com Google — nenhuma configuração manual necessária.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Conectado automaticamente ao fazer login com Google.</span>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent">
              <MessageCircle className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">WhatsApp</CardTitle>
              <CardDescription>Conecte seu WhatsApp via servidor whatsapp-web.js</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL do servidor</Label>
            <div className="flex gap-2">
              <Input
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://meu-servidor-whatsapp.com"
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={saveServerUrl} disabled={saving || !serverUrl}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Informe a URL do seu servidor com whatsapp-web.js (endpoints: /qr, /status, /send)
            </p>
            <WhatsAppSetupGuide />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={openQrDialog} disabled={!serverUrl}>
              <QrCode className="w-4 h-4 mr-2" />
              Conectar WhatsApp
            </Button>
            <Button variant="outline" onClick={checkStatus} disabled={!serverUrl || connectionStatus === "checking"}>
              {connectionStatus === "checking" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wifi className="w-4 h-4 mr-2" />}
              Verificar Status
            </Button>
          </div>

          {connectionStatus !== "idle" && (
            <div className="pt-1">
              <StatusBadge />
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Conectar WhatsApp
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code abaixo com o WhatsApp no seu celular.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrLoading && (
              <div className="flex flex-col items-center gap-2 py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
              </div>
            )}
            {qrError && (
              <div className="flex flex-col items-center gap-2 py-4">
                <XCircle className="w-8 h-8 text-destructive" />
                <p className="text-sm text-destructive text-center">{qrError}</p>
                <Button variant="outline" size="sm" onClick={fetchQrCode}>
                  Tentar novamente
                </Button>
              </div>
            )}
            {qrCode && !qrLoading && !qrError && (
              <>
                <div className="bg-white p-4 rounded-xl">
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  Abra o WhatsApp → Menu (⋮) → Aparelhos conectados → Conectar um aparelho
                </p>
                <Button variant="outline" size="sm" onClick={fetchQrCode}>
                  <QrCode className="w-4 h-4 mr-2" />
                  Gerar novo QR Code
                </Button>
              </>
            )}
            {pairingCode && !qrLoading && !qrError && (
              <>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Código de pareamento:</p>
                  <p className="text-2xl font-mono font-bold tracking-widest">{pairingCode}</p>
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  Abra o WhatsApp → Menu (⋮) → Aparelhos conectados → Conectar com número de telefone
                </p>
                <Button variant="outline" size="sm" onClick={fetchQrCode}>
                  <QrCode className="w-4 h-4 mr-2" />
                  Gerar novo código
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

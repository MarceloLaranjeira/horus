import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Loader2, Unlink, ExternalLink } from "lucide-react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { toast } from "sonner";

export const SettingsIntegrationsView = () => {
  const { connected, loading, connect, disconnect } = useGoogleCalendar();
  const [disconnecting, setDisconnecting] = useState(false);

  // Handle OAuth callback code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
      // Exchange code handled by the hook when it detects code in URL
    }
  }, []);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (e: any) {
      toast.error(e.message || "Erro ao conectar");
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await disconnect();
      toast.success("Google Calendar desconectado");
    } catch (e: any) {
      toast.error(e.message || "Erro ao desconectar");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Calendar */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Google Calendar</CardTitle>
              <CardDescription>
                Sincronize sua agenda. O Maxx poderá ler e criar eventos.
              </CardDescription>
            </div>
            {!loading && (
              <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                connected
                  ? "bg-[hsl(var(--nectar-green))]/10 text-[hsl(var(--nectar-green))]"
                  : "bg-muted text-muted-foreground"
              }`}>
                {connected ? "Conectado" : "Desconectado"}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verificando conexão...
            </div>
          ) : connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[hsl(var(--nectar-green))]" />
                <span className="text-muted-foreground">
                  Sua agenda está sincronizada. O Maxx pode ver e criar eventos.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-destructive border-destructive/20 hover:bg-destructive/10"
              >
                {disconnecting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5 mr-1.5" />}
                Desconectar
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Conecte sua conta Google para que o Maxx possa acessar sua agenda.
              </p>
              <Button onClick={handleConnect} size="sm" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                Conectar Google Calendar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

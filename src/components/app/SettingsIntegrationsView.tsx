import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, MessageCircle, Eye, EyeOff, Loader2, Wifi, CheckCircle2, XCircle } from "lucide-react";

interface IntegrationConfig {
  evolution_api: {
    api_url: string;
    api_key: string;
    instance_name: string;
    enabled: boolean;
  };
}

const defaultConfig: IntegrationConfig = {
  evolution_api: { api_url: "", api_key: "", instance_name: "", enabled: false },
};

type TestStatus = "idle" | "testing" | "success" | "error";

export const SettingsIntegrationsView = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<IntegrationConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [evoTestStatus, setEvoTestStatus] = useState<TestStatus>("idle");
  const [evoTestMsg, setEvoTestMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("user_integrations")
        .select("*")
        .eq("user_id", user.id);

      if (data) {
        const newConfig = { ...defaultConfig };
        data.forEach((row: any) => {
          if (row.integration_type === "evolution_api") {
            newConfig.evolution_api = { ...newConfig.evolution_api, ...row.credentials, enabled: row.enabled };
          }
        });
        setConfig(newConfig);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const saveIntegration = async () => {
    if (!user) return;
    setSaving(true);

    const integrationData = {
      api_url: config.evolution_api.api_url,
      api_key: config.evolution_api.api_key,
      instance_name: config.evolution_api.instance_name,
    };

    const { error } = await supabase
      .from("user_integrations")
      .upsert(
        { user_id: user.id, integration_type: "evolution_api", credentials: integrationData, enabled: config.evolution_api.enabled },
        { onConflict: "user_id,integration_type" }
      );

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Integração salva com sucesso!");
    }
    setSaving(false);
  };

  const testEvolutionApi = async () => {
    setEvoTestStatus("testing");
    setEvoTestMsg("");
    try {
      await saveIntegration();

      const { data, error } = await supabase.functions.invoke("test-evolution-api", {
        body: { action: "test" },
      });

      if (error) {
        setEvoTestStatus("error");
        setEvoTestMsg(error.message || "Erro ao testar conexão");
        return;
      }

      if (data?.success) {
        setEvoTestStatus("success");
        setEvoTestMsg(data.message + (data.instances ? ` (${data.instances} instância(s) encontrada(s))` : ""));
      } else {
        setEvoTestStatus("error");
        setEvoTestMsg(data?.error || "Falha na conexão");
      }
    } catch (e: any) {
      setEvoTestStatus("error");
      setEvoTestMsg(e.message || "Erro inesperado");
    }
  };

  const toggleSecret = (key: string) => setShowSecrets((p) => ({ ...p, [key]: !p[key] }));

  const TestResultBadge = ({ status, message }: { status: TestStatus; message: string }) => {
    if (status === "idle") return null;
    if (status === "testing") return <Badge variant="secondary" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Testando...</Badge>;
    if (status === "success") return <Badge variant="default" className="gap-1 bg-primary"><CheckCircle2 className="w-3 h-3" /> {message}</Badge>;
    return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> {message}</Badge>;
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
        <p className="text-muted-foreground">Configure suas credenciais para conectar serviços externos.</p>
      </div>

      {/* Google Calendar - OAuth gerenciado */}
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

      {/* Evolution API (WhatsApp) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <MessageCircle className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">WhatsApp (Evolution API)</CardTitle>
                <CardDescription>Envie e receba mensagens pelo WhatsApp</CardDescription>
              </div>
            </div>
            <Switch
              checked={config.evolution_api.enabled}
              onCheckedChange={(v) => setConfig((p) => ({ ...p, evolution_api: { ...p.evolution_api, enabled: v } }))}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL da API</Label>
            <Input
              value={config.evolution_api.api_url}
              onChange={(e) => setConfig((p) => ({ ...p, evolution_api: { ...p.evolution_api, api_url: e.target.value } }))}
              placeholder="https://sua-instancia.evolution-api.com"
            />
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="relative">
              <Input
                type={showSecrets.evo_key ? "text" : "password"}
                value={config.evolution_api.api_key}
                onChange={(e) => setConfig((p) => ({ ...p, evolution_api: { ...p.evolution_api, api_key: e.target.value } }))}
                placeholder="••••••••••••"
              />
              <button type="button" onClick={() => toggleSecret("evo_key")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showSecrets.evo_key ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nome da Instância</Label>
            <Input
              value={config.evolution_api.instance_name}
              onChange={(e) => setConfig((p) => ({ ...p, evolution_api: { ...p.evolution_api, instance_name: e.target.value } }))}
              placeholder="minha-instancia"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={saveIntegration} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
            <Button variant="outline" onClick={testEvolutionApi} disabled={evoTestStatus === "testing"}>
              {evoTestStatus === "testing" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wifi className="w-4 h-4 mr-2" />}
              Testar Conexão
            </Button>
          </div>
          {evoTestStatus !== "idle" && (
            <div className="pt-2">
              <TestResultBadge status={evoTestStatus} message={evoTestMsg} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

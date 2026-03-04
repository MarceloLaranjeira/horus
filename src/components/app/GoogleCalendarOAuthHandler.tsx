import { useEffect } from "react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { toast } from "sonner";

/**
 * Component that handles Google OAuth callback code exchange.
 * Place this in the AppDashboard to catch the ?code= parameter.
 */
export const GoogleCalendarOAuthHandler = () => {
  const { exchangeCode } = useGoogleCalendar();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      window.history.replaceState({}, "", window.location.pathname);
      const messages: Record<string, string> = {
        access_denied: "Você negou o acesso ao Google Calendar. Tente novamente quando quiser conectar.",
        invalid_scope: "Escopos de permissão inválidos. Contate o suporte.",
      };
      toast.error(messages[error] || `Erro do Google: ${error}`);
      return;
    }

    if (code) {
      window.history.replaceState({}, "", window.location.pathname);
      exchangeCode(code)
        .then((data) => {
          if (data?.success) {
            toast.success("Google Calendar conectado com sucesso! 🎉");
          }
        })
        .catch((e) => {
          toast.error(e.message || "Erro ao conectar Google Calendar.");
        });
    }
  }, [exchangeCode]);

  return null;
};

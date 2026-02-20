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
    if (code) {
      window.history.replaceState({}, "", window.location.pathname);
      exchangeCode(code)
        .then((data) => {
          if (data.success) {
            toast.success("Google Calendar conectado com sucesso! 🎉");
          }
        })
        .catch((e) => {
          toast.error("Erro ao conectar Google Calendar: " + e.message);
        });
    }
  }, [exchangeCode]);

  return null;
};

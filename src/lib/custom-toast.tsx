import { toast as sonnerToast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

export const successToast = (message: string) => {
  sonnerToast.success(message, {
    icon: (
      <span className="inline-flex animate-scale-in">
        <CheckCircle2 className="w-5 h-5 text-[hsl(var(--nectar-green))]" />
      </span>
    ),
  });
};

export const errorToast = (message: string) => {
  sonnerToast.error(message, {
    icon: (
      <span className="inline-flex animate-scale-in">
        <XCircle className="w-5 h-5 text-destructive" />
      </span>
    ),
  });
};

export const warningToast = (message: string) => {
  sonnerToast.warning(message, {
    icon: (
      <span className="inline-flex animate-scale-in">
        <AlertTriangle className="w-5 h-5 text-[hsl(var(--nectar-orange))]" />
      </span>
    ),
  });
};

export const infoToast = (message: string) => {
  sonnerToast.info(message, {
    icon: (
      <span className="inline-flex animate-scale-in">
        <Info className="w-5 h-5 text-primary" />
      </span>
    ),
  });
};

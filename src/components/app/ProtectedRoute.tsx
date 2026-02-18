import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex gap-1">
          <span className="w-3 h-3 rounded-full bg-primary animate-bounce" />
          <span className="w-3 h-3 rounded-full bg-primary animate-bounce [animation-delay:0.1s]" />
          <span className="w-3 h-3 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

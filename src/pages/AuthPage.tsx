import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { lovable } from "@/integrations/lovable/index";
import horusLogo from "@/assets/horus-logo.png";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) toast.error(error.message);
      else navigate("/app");
    } else {
      const { error } = await signUp(email, password, name);
      if (error) toast.error(error.message);
      else toast.success("Conta criada! Verifique seu email para confirmar o cadastro.");
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Digite seu email."); return; }
    setLoading(true);
    const { error } = await resetPassword(email);
    if (error) toast.error(error.message);
    else toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (error) { toast.error("Erro ao entrar com Google: " + error.message); setGoogleLoading(false); }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin });
    if (error) { toast.error("Erro ao entrar com Apple: " + error.message); setAppleLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 bg-card/40 border-r border-border/40">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-96 h-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, hsl(var(--primary)), transparent)", top: "-10%", left: "-10%" }}
            animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-72 h-72 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, hsl(var(--nectar-gold)), transparent)", bottom: "5%", right: "-5%" }}
            animate={{ x: [0, -20, 0], y: [0, -30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-56 h-56 rounded-full opacity-[0.08]"
            style={{ background: "radial-gradient(circle, hsl(var(--nectar-purple)), transparent)", bottom: "30%", left: "10%" }}
            animate={{ x: [0, 15, 0], y: [0, 25, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="absolute inset-0 jarvis-grid opacity-40 pointer-events-none" />
        <motion.div
          className="relative z-10 text-center max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-40 bg-primary" />
              <img src={horusLogo} alt="Horus" className="relative w-20 h-20 rounded-2xl object-cover glow-blue" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-br from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
            Horus
          </h1>
          <p className="text-lg text-muted-foreground mb-8">Sua IA de produtividade pessoal</p>
          <div className="space-y-3 text-sm text-left">
            {[
              { icon: "✅", text: "Gerencie tarefas, hábitos e projetos" },
              { icon: "💰", text: "Controle financeiro completo" },
              { icon: "🤖", text: "Assistente IA integrado" },
              { icon: "📅", text: "Sincronizado com Google Calendar e Gmail" },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/30"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-foreground/80">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          key={isForgotPassword ? "forgot" : isLogin ? "login" : "register"}
        >
          <div className="lg:hidden flex justify-center mb-8">
            <img src={horusLogo} alt="Horus" className="w-14 h-14 rounded-xl object-cover" />
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              {isForgotPassword ? "Recuperar senha" : isLogin ? "Bem-vindo de volta" : "Criar sua conta"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isForgotPassword
                ? "Digite seu email para receber o link de recuperação"
                : isLogin
                ? "Entre para acessar seu painel Horus"
                : "Crie sua conta e ative seu assistente pessoal"}
            </p>
          </div>

          {isForgotPassword ? (
            <>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="h-11" />
                </div>
                <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Link de Recuperação"}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <button type="button" onClick={() => setIsForgotPassword(false)} className="text-sm text-primary hover:underline">
                  Voltar para o login
                </button>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium">Nome</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" required className="h-11" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                    {isLogin && (
                      <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                        Esqueci minha senha
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-11 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isLogin ? "Entrar" : "Criar Conta"}
                </Button>
              </form>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
                  ou continue com
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <Button type="button" variant="outline" className="w-full h-11 flex items-center gap-3 font-medium" onClick={handleGoogleSignIn} disabled={googleLoading}>
                  {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  Entrar com Google
                </Button>
                <Button type="button" variant="outline" className="w-full h-11 flex items-center gap-3 font-medium" onClick={handleAppleSignIn} disabled={appleLoading}>
                  {appleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  )}
                  Entrar com Apple
                </Button>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {isLogin ? "Não tem conta? " : "Já tem conta? "}
                <button type="button" onClick={() => setIsLogin(!isLogin)} className="font-medium text-primary hover:underline">
                  {isLogin ? "Criar agora" : "Entrar"}
                </button>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;

import { useState, useEffect, useRef } from "react";
import { User, Save, Mail, FileText, Camera, Briefcase, Building, Factory, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export const SettingsProfileView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [services, setServices] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, bio, avatar_url, company, role, industry, services")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setName(data.name || "");
          setBio(data.bio || "");
          setCompany((data as any).company || "");
          setRole((data as any).role || "");
          setIndustry((data as any).industry || "");
          setServices((data as any).services || "");
          setAvatarUrl(data.avatar_url || null);
        }
      });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Erro ao enviar foto", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    setAvatarUrl(publicUrl);
    setUploading(false);
    toast({ title: "Foto atualizada!" });
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim(), bio: bio.trim(), company: company.trim(), role: role.trim(), industry: industry.trim(), services: services.trim() } as any)
      .eq("user_id", user.id);
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil salvo!", description: "Suas informações foram atualizadas." });
    }
  };

  const initials = name ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "?";

  return (
    <div className="h-full overflow-auto p-6 jarvis-grid">
      <div className="max-w-2xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold text-gradient-cyan">Perfil</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
        </motion.div>

        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border/50 rounded-xl p-6 card-glow flex flex-col items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Avatar className="w-24 h-24 border-2 border-primary/30">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="Avatar" /> : null}
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <p className="text-xs text-muted-foreground">{uploading ? "Enviando..." : "Clique para alterar a foto"}</p>
        </motion.div>

        {/* Email */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border/50 rounded-xl p-6 card-glow space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Email</h3>
          </div>
          <p className="text-sm text-muted-foreground">{user?.email || "—"}</p>
        </motion.div>

        {/* Name */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border/50 rounded-xl p-6 card-glow space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Nome</h3>
          </div>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="bg-secondary/50 border-border/50" />
        </motion.div>

        {/* Work Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="bg-card border border-border/50 rounded-xl p-6 card-glow space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Informações Profissionais</h3>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Building className="w-3 h-3" /> Empresa</label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Onde você trabalha" className="bg-secondary/50 border-border/50" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Briefcase className="w-3 h-3" /> Cargo / Função</label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex: Desenvolvedor, Designer..." className="bg-secondary/50 border-border/50" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Factory className="w-3 h-3" /> Área / Indústria</label>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Ex: Tecnologia, Saúde, Educação..." className="bg-secondary/50 border-border/50" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> Serviços / Produtos</label>
              <Textarea value={services} onChange={(e) => setServices(e.target.value)} placeholder="Descreva os serviços que presta ou produtos que vende..." className="bg-secondary/50 border-border/50" rows={3} />
            </div>
          </div>
        </motion.div>

        {/* Bio */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          className="bg-card border border-border/50 rounded-xl p-6 card-glow space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Bio</h3>
          </div>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Conte um pouco sobre você..." className="bg-secondary/50 border-border/50" rows={3} />
        </motion.div>

        {/* Save */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <Button onClick={handleSave} disabled={loading} className="w-full glow-cyan bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Salvando..." : "Salvar Perfil"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

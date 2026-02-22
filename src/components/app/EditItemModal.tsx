import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, Trash2 } from "lucide-react";

interface Field {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "datetime-local" | "select" | "color";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface EditItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: Field[];
  values: Record<string, any>;
  onSave: (values: Record<string, any>) => void;
  onDelete?: () => void;
}

export const EditItemModal = ({ open, onOpenChange, title, fields, values, onSave, onDelete }: EditItemModalProps) => {
  const [form, setForm] = useState<Record<string, any>>(values);

  useEffect(() => {
    setForm(values);
  }, [values, open]);

  const update = (key: string, val: any) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{f.label}</Label>
              {f.type === "select" ? (
                <Select value={form[f.key] || ""} onValueChange={(v) => update(f.key, v)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {f.options?.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === "textarea" ? (
                <Textarea value={form[f.key] || ""} onChange={(e) => update(f.key, e.target.value)} placeholder={f.placeholder} className="bg-secondary/50 min-h-[80px]" />
              ) : f.type === "color" ? (
                <div className="flex items-center gap-2">
                  <input type="color" value={form[f.key] || "#6366f1"} onChange={(e) => update(f.key, e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                  <Input value={form[f.key] || ""} onChange={(e) => update(f.key, e.target.value)} className="flex-1 bg-secondary/50" />
                </div>
              ) : (
                <Input type={f.type} value={form[f.key] || ""} onChange={(e) => update(f.key, f.type === "number" ? parseFloat(e.target.value) : e.target.value)} placeholder={f.placeholder} className="bg-secondary/50" />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={() => { onDelete(); onOpenChange(false); }}>
              <Trash2 className="w-4 h-4 mr-1" /> Excluir
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button size="sm" onClick={() => { onSave(form); onOpenChange(false); }}>
            <Save className="w-4 h-4 mr-1" /> Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

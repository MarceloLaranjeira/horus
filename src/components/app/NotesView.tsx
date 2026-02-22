import { useState } from "react";
import { Plus, Pin, PinOff, Trash2, FileText, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNotes } from "@/hooks/useNotes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const NOTE_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export const NotesView = () => {
  const { notes, isLoading, addNote, updateNote, deleteNote } = useNotes();
  const [search, setSearch] = useState("");
  const [editNote, setEditNote] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editColor, setEditColor] = useState("#6366f1");

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleNew = () => {
    addNote.mutate(
      { title: "Nova nota", content: "", color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)] },
      {
        onSuccess: (data) => {
          setEditNote(data);
          setEditTitle(data.title);
          setEditContent(data.content);
          setEditColor(data.color);
          toast.success("Nota criada!");
        },
      }
    );
  };

  const openEdit = (note: any) => {
    setEditNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditColor(note.color);
  };

  const handleSave = () => {
    if (!editNote) return;
    updateNote.mutate(
      { id: editNote.id, title: editTitle.trim() || "Sem título", content: editContent, color: editColor },
      { onSuccess: () => { setEditNote(null); toast.success("Nota salva!"); } }
    );
  };

  return (
    <div className="h-full overflow-auto p-6 jarvis-grid">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gradient-gold">Bloco de Notas</h1>
            <p className="text-sm text-muted-foreground mt-1">{notes.length} notas</p>
          </div>
          <Button onClick={handleNew} className="glow-cyan">
            <Plus className="w-4 h-4 mr-1" /> Nova Nota
          </Button>
        </motion.div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar notas..."
            className="pl-9 bg-secondary/50"
          />
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-12">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma nota encontrada</p>
            <Button variant="outline" onClick={handleNew}>
              <Plus className="w-4 h-4 mr-1" /> Criar primeira nota
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((note, i) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => openEdit(note)}
                  className="relative bg-card border border-border/50 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all group"
                  style={{ borderLeftColor: note.color, borderLeftWidth: 4 }}
                >
                  {note.pinned && (
                    <Pin className="absolute top-3 right-3 w-3.5 h-3.5 text-primary" />
                  )}
                  <h3 className="font-semibold text-sm truncate pr-6">{note.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">
                    {note.content || "Nota vazia..."}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-3">
                    {new Date(note.updated_at).toLocaleDateString("pt-BR")}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editNote} onOpenChange={(open) => { if (!open) handleSave(); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Editar Nota
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 flex-1 overflow-auto">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Título..."
              className="bg-secondary/50 font-semibold"
            />
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Escreva sua nota..."
              className="bg-secondary/50 min-h-[200px] flex-1"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Cor:</span>
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setEditColor(c)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-all",
                    editColor === c ? "border-foreground scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!editNote) return;
                updateNote.mutate({ id: editNote.id, pinned: !editNote.pinned });
                setEditNote({ ...editNote, pinned: !editNote.pinned });
              }}
            >
              {editNote?.pinned ? <PinOff className="w-4 h-4 mr-1" /> : <Pin className="w-4 h-4 mr-1" />}
              {editNote?.pinned ? "Desafixar" : "Fixar"}
            </Button>
            <div className="flex-1" />
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (!editNote) return;
                deleteNote.mutate(editNote.id, { onSuccess: () => { setEditNote(null); toast.success("Nota excluída!"); } });
              }}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Excluir
            </Button>
            <Button size="sm" onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

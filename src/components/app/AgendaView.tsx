import { useState, useEffect, useCallback } from "react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar as CalendarIcon, Plus, Loader2, ExternalLink, Clock,
  ChevronLeft, ChevronRight, CheckCircle2, Unlink, RefreshCw,
} from "lucide-react";
import { format, startOfDay, endOfDay, addDays, startOfWeek, endOfWeek, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const AgendaView = () => {
  const { connected, loading, connect, disconnect, events, fetchEvents, loadingEvents, createEvent } = useGoogleCalendar();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({ summary: "", description: "", date: "", startTime: "09:00", endTime: "10:00" });
  const [creating, setCreating] = useState(false);

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const loadEvents = useCallback(() => {
    if (connected) {
      fetchEvents(startOfDay(weekStart).toISOString(), endOfDay(weekEnd).toISOString(), 50);
    }
  }, [connected, weekStart, fetchEvents, weekEnd]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleConnect = async () => {
    try { await connect(); } catch (e: any) { toast.error(e.message); }
  };

  const handleCreate = async () => {
    if (!newEvent.summary || !newEvent.date) { toast.error("Preencha título e data"); return; }
    setCreating(true);
    try {
      const start = `${newEvent.date}T${newEvent.startTime}:00`;
      const end = `${newEvent.date}T${newEvent.endTime}:00`;
      await createEvent({ summary: newEvent.summary, start, end, description: newEvent.description });
      toast.success("Evento criado!");
      setShowCreateDialog(false);
      setNewEvent({ summary: "", description: "", date: "", startTime: "09:00", endTime: "10:00" });
      loadEvents();
    } catch (e: any) { toast.error(e.message); }
    finally { setCreating(false); }
  };

  const getEventsForDay = (day: Date) =>
    events.filter((e: any) => {
      const eventDate = new Date(e.start?.dateTime || e.start?.date);
      return isSameDay(eventDate, day);
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="max-w-md w-full border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-xl bg-primary/10 w-fit mb-3">
              <CalendarIcon className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Conecte sua Agenda</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Conecte o Google Calendar para visualizar e gerenciar seus compromissos diretamente no Horus.
            </p>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={handleConnect} className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Conectar Google Calendar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Agenda</h1>
            <p className="text-sm text-muted-foreground">
              {format(weekStart, "dd MMM", { locale: ptBR })} – {format(weekEnd, "dd MMM yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setWeekStart(s => subWeeks(s, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={() => setWeekStart(s => addWeeks(s, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={loadEvents} disabled={loadingEvents}>
              <RefreshCw className={cn("w-4 h-4", loadingEvents && "animate-spin")} />
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4" /> Novo Evento
            </Button>
          </div>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-xl border border-border/50 bg-card/50 min-h-[200px] p-2 space-y-1.5",
                  isToday && "border-primary/50 bg-primary/5"
                )}
              >
                <div className={cn(
                  "text-center text-xs font-medium pb-1 border-b border-border/30",
                  isToday && "text-primary"
                )}>
                  <div className="uppercase text-[10px] text-muted-foreground">
                    {format(day, "EEE", { locale: ptBR })}
                  </div>
                  <div className={cn(
                    "text-lg font-bold",
                    isToday && "bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mx-auto"
                  )}>
                    {format(day, "d")}
                  </div>
                </div>
                {loadingEvents ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  </div>
                ) : dayEvents.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-2">Sem eventos</p>
                ) : (
                  dayEvents.map((ev: any, i: number) => {
                    const startTime = ev.start?.dateTime
                      ? format(new Date(ev.start.dateTime), "HH:mm")
                      : "Dia todo";
                    return (
                      <div
                        key={i}
                        className="rounded-md bg-primary/10 border border-primary/20 p-1.5 text-[11px] space-y-0.5"
                      >
                        <div className="font-medium truncate">{ev.summary}</div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-2.5 h-2.5" />
                          {startTime}
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Create Event Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Evento</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Título</Label>
                <Input value={newEvent.summary} onChange={e => setNewEvent(p => ({ ...p, summary: e.target.value }))} placeholder="Reunião..." />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Início</Label>
                  <Input type="time" value={newEvent.startTime} onChange={e => setNewEvent(p => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div>
                  <Label>Fim</Label>
                  <Input type="time" value={newEvent.endTime} onChange={e => setNewEvent(p => ({ ...p, endTime: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} placeholder="Detalhes..." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
};

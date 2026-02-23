import { useState, useEffect, useCallback, useMemo } from "react";
import { useGoogleCalendar, CalendarEvent, CreateEventInput } from "@/hooks/useGoogleCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar as CalendarIcon, Plus, Loader2, ExternalLink, Clock,
  ChevronLeft, ChevronRight, RefreshCw, MapPin, Users, Video,
  Trash2, X, CheckCircle2, Circle,
} from "lucide-react";
import { format, startOfDay, endOfDay, addDays, startOfWeek, endOfWeek, isSameDay, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

const GOOGLE_COLORS: Record<string, string> = {
  "1": "#7986cb", "2": "#33b679", "3": "#8e24aa", "4": "#e67c73",
  "5": "#f6bf26", "6": "#f4511e", "7": "#039be5", "8": "#616161",
  "9": "#3f51b5", "10": "#0b8043", "11": "#d50000",
};

const COLOR_OPTIONS = Object.entries(GOOGLE_COLORS).map(([id, color]) => ({ id, color }));

export const AgendaView = () => {
  const { connected, loading, connect, disconnect, events, fetchEvents, loadingEvents, createEvent, deleteEvent } = useGoogleCalendar();
  const isMobile = useIsMobile();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newEvent, setNewEvent] = useState<CreateEventInput & { attendeeInput: string }>({
    summary: "", description: "", start: "", end: "",
    location: "", attendees: [], colorId: "7", addMeet: false,
    attendeeInput: "",
  });
  const [creating, setCreating] = useState(false);
  const [completedEvents, setCompletedEvents] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("horus-completed-events");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const toggleCompleted = (eventId: string) => {
    setCompletedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId); else next.add(eventId);
      localStorage.setItem("horus-completed-events", JSON.stringify([...next]));
      return next;
    });
  };
  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);

  const loadEvents = useCallback(() => {
    if (connected) {
      const viewStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const viewEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      fetchEvents(startOfDay(viewStart).toISOString(), endOfDay(viewEnd).toISOString(), 100);
    }
  }, [connected, monthStart, monthEnd, fetchEvents]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleConnect = async () => {
    try { await connect(); } catch (e: any) { toast.error(e.message); }
  };

  const addAttendee = () => {
    const email = newEvent.attendeeInput.trim();
    if (email && email.includes("@") && !newEvent.attendees?.includes(email)) {
      setNewEvent(p => ({ ...p, attendees: [...(p.attendees || []), email], attendeeInput: "" }));
    }
  };

  const removeAttendee = (email: string) => {
    setNewEvent(p => ({ ...p, attendees: (p.attendees || []).filter(a => a !== email) }));
  };

  const handleCreate = async () => {
    if (!newEvent.summary || !newEvent.start || !newEvent.end) { toast.error("Preencha título, data/hora início e fim"); return; }
    setCreating(true);
    try {
      await createEvent({
        summary: newEvent.summary,
        start: newEvent.start,
        end: newEvent.end,
        description: newEvent.description,
        location: newEvent.location,
        attendees: newEvent.attendees,
        colorId: newEvent.colorId,
        addMeet: newEvent.addMeet,
      });
      toast.success("Evento criado com sucesso!");
      setShowCreateDialog(false);
      resetNewEvent();
      loadEvents();
    } catch (e: any) { toast.error(e.message); }
    finally { setCreating(false); }
  };

  const handleDelete = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      toast.success("Evento removido");
      setSelectedEvent(null);
      loadEvents();
    } catch (e: any) { toast.error(e.message); }
  };

  const resetNewEvent = () => setNewEvent({
    summary: "", description: "", start: "", end: "",
    location: "", attendees: [], colorId: "7", addMeet: false, attendeeInput: "",
  });

  const openCreateForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setNewEvent(p => ({ ...p, start: `${dateStr}T09:00`, end: `${dateStr}T10:00` }));
    setShowCreateDialog(true);
  };

  const getEventsForDay = (day: Date) =>
    events.filter((e) => {
      const eventDate = new Date(e.start?.dateTime || e.start?.date || "");
      return isSameDay(eventDate, day);
    });

  const getEventColor = (event: CalendarEvent) =>
    GOOGLE_COLORS[event.colorId || "7"] || GOOGLE_COLORS["7"];

  // Build calendar grid
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarDays: Date[] = [];
  for (let i = 0; i < 42; i++) calendarDays.push(addDays(calendarStart, i));

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

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
              Conecte o Google Calendar para visualizar e gerenciar seus compromissos.
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
    <div className={cn("flex h-full overflow-hidden", isMobile && "flex-col")}>
      {/* Left: Calendar grid */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-border/30">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(s => subMonths(s, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-sm sm:text-lg font-semibold min-w-[120px] sm:min-w-[180px] text-center capitalize">
              {format(currentMonth, isMobile ? "MMM yyyy" : "MMMM yyyy", { locale: ptBR })}
            </h2>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(s => addMonths(s, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="outline" size="sm" className="h-7 sm:h-8 text-xs" onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={loadEvents} disabled={loadingEvents}>
              <RefreshCw className={cn("w-3.5 h-3.5", loadingEvents && "animate-spin")} />
            </Button>
            <Button size="sm" className="gap-1 h-7 sm:h-8 text-xs" onClick={() => openCreateForDate(selectedDate || new Date())}>
              <Plus className="w-3.5 h-3.5" /> {!isMobile && "Novo"}
            </Button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border/30 shrink-0">
          {(isMobile ? ["D", "S", "T", "Q", "Q", "S", "S"] : ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]).map((d, i) => (
            <div key={i} className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-1.5 sm:py-2 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-hidden">
          {calendarDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "border-b border-r border-border/20 p-1 cursor-pointer transition-colors hover:bg-accent/30 overflow-hidden",
                  !isCurrentMonth && "opacity-40",
                  isSelected && "bg-accent/50 ring-1 ring-primary/30",
                )}
              >
                <div className={cn(
                  "text-xs font-medium mb-0.5 w-6 h-6 flex items-center justify-center rounded-full mx-auto",
                  isToday && "bg-primary text-primary-foreground",
                )}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((ev, i) => (
                    <div
                      key={ev.id || i}
                      onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                      className="text-[10px] leading-tight px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: getEventColor(ev) + "30", color: getEventColor(ev), borderLeft: `2px solid ${getEventColor(ev)}` }}
                    >
                      {ev.start?.dateTime ? format(new Date(ev.start.dateTime), "HH:mm") + " " : ""}{ev.summary}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground text-center">+{dayEvents.length - 3} mais</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Day detail panel */}
      <div className={cn("flex flex-col overflow-hidden bg-card/30", isMobile ? "border-t border-border/30 h-48" : "w-80")}>
        <div className="px-4 py-3 border-b border-border/30 shrink-0">
          <h3 className="font-semibold capitalize">
            {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR }) : "Selecione um dia"}
          </h3>
          <p className="text-xs text-muted-foreground">{selectedDayEvents.length} evento(s)</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {loadingEvents ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : selectedDayEvents.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum evento</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => selectedDate && openCreateForDate(selectedDate)}>
                  <Plus className="w-3 h-3 mr-1" /> Criar evento
                </Button>
              </div>
            ) : (
              <AnimatePresence>
                {selectedDayEvents.map((ev) => (
                  <EventCard key={ev.id} event={ev} onSelect={setSelectedEvent} onDelete={handleDelete} completed={completedEvents.has(ev.id)} onToggleComplete={toggleCompleted} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && (
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: getEventColor(selectedEvent) }} />
              )}
              {selectedEvent?.summary}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                {selectedEvent.start?.dateTime
                  ? `${format(new Date(selectedEvent.start.dateTime), "HH:mm")} – ${selectedEvent.end?.dateTime ? format(new Date(selectedEvent.end.dateTime), "HH:mm") : ""}`
                  : "Dia inteiro"}
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {selectedEvent.location}
                </div>
              )}
              {selectedEvent.hangoutLink && (
                <a href={selectedEvent.hangoutLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline">
                  <Video className="w-4 h-4" /> Entrar no Google Meet
                </a>
              )}
              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="w-4 h-4" /> Convidados
                  </div>
                  <div className="flex flex-wrap gap-1 ml-6">
                    {selectedEvent.attendees.map((a, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {a.email}
                        {a.responseStatus === "accepted" && " ✓"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedEvent.description && (
                <p className="text-muted-foreground whitespace-pre-wrap">{selectedEvent.description}</p>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedEvent && (
              <Button
                variant={completedEvents.has(selectedEvent.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleCompleted(selectedEvent.id)}
                className="gap-1.5"
              >
                {completedEvents.has(selectedEvent.id) ? (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> Concluído</>
                ) : (
                  <><Circle className="w-3.5 h-3.5" /> Marcar concluído</>
                )}
              </Button>
            )}
            {selectedEvent?.htmlLink && (
              <Button variant="outline" size="sm" asChild>
                <a href={selectedEvent.htmlLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3 mr-1" /> Abrir no Google
                </a>
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={() => selectedEvent && handleDelete(selectedEvent.id)}>
              <Trash2 className="w-3 h-3 mr-1" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label>Título</Label>
              <Input value={newEvent.summary} onChange={e => setNewEvent(p => ({ ...p, summary: e.target.value }))} placeholder="Reunião de equipe..." />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Início</Label>
                <Input type="datetime-local" value={newEvent.start} onChange={e => setNewEvent(p => ({ ...p, start: e.target.value }))} />
              </div>
              <div>
                <Label>Fim</Label>
                <Input type="datetime-local" value={newEvent.end} onChange={e => setNewEvent(p => ({ ...p, end: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Local</Label>
              <Input value={newEvent.location} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))} placeholder="Sala 3 / Zoom / ..." />
            </div>
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Video className="w-4 h-4 text-primary" /> Adicionar Google Meet
              </Label>
              <Switch checked={newEvent.addMeet} onCheckedChange={v => setNewEvent(p => ({ ...p, addMeet: v }))} />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-1.5 mt-1">
                {COLOR_OPTIONS.map(({ id, color }) => (
                  <button key={id} onClick={() => setNewEvent(p => ({ ...p, colorId: id }))}
                    className={cn("w-6 h-6 rounded-full transition-all", newEvent.colorId === id && "ring-2 ring-offset-2 ring-offset-background ring-primary")}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div>
              <Label>Convidados</Label>
              <div className="flex gap-2 mt-1">
                <Input value={newEvent.attendeeInput} onChange={e => setNewEvent(p => ({ ...p, attendeeInput: e.target.value }))}
                  placeholder="email@exemplo.com" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addAttendee())} />
                <Button variant="outline" size="sm" onClick={addAttendee}>Add</Button>
              </div>
              {(newEvent.attendees?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {newEvent.attendees?.map((email) => (
                    <Badge key={email} variant="secondary" className="gap-1">
                      {email}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeAttendee(email)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} placeholder="Detalhes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
              Criar Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function EventCard({ event, onSelect, onDelete, completed, onToggleComplete }: { event: CalendarEvent; onSelect: (e: CalendarEvent) => void; onDelete: (id: string) => void; completed: boolean; onToggleComplete: (id: string) => void }) {
  const color = GOOGLE_COLORS[event.colorId || "7"] || GOOGLE_COLORS["7"];
  const startTime = event.start?.dateTime ? format(new Date(event.start.dateTime), "HH:mm") : "Dia todo";
  const endTime = event.end?.dateTime ? format(new Date(event.end.dateTime), "HH:mm") : "";

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
      onClick={() => onSelect(event)}
      className={cn("rounded-lg p-3 cursor-pointer hover:bg-accent/30 transition-colors border border-border/30", completed && "opacity-60")}
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleComplete(event.id); }}
              className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
            >
              {completed ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Circle className="w-4 h-4" />}
            </button>
            <p className={cn("font-medium text-sm truncate", completed && "line-through")}>{event.summary}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Clock className="w-3 h-3" />
            {startTime}{endTime ? ` – ${endTime}` : ""}
          </div>
          {event.location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3" /> {event.location}
            </div>
          )}
          {event.hangoutLink && (
            <div className="flex items-center gap-1 text-xs text-primary mt-0.5">
              <Video className="w-3 h-3" /> Google Meet
            </div>
          )}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Users className="w-3 h-3" /> {event.attendees.length} convidado(s)
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

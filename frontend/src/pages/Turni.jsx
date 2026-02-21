import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Pencil,
  Trash2,
  Users
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { toast } from "sonner";
import api from "../lib/api";

const DAYS = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

const Turni = () => {
  const { user } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 }); // Monday
  });
  const [schedules, setSchedules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [scheduleDialog, setScheduleDialog] = useState({ open: false, schedule: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, schedule: null });
  const [scheduleForm, setScheduleForm] = useState({
    user_id: "",
    date: "",
    start_time: "08:00",
    end_time: "16:00",
    notes: ""
  });

  const isManager = user?.role === "manager";

  useEffect(() => {
    fetchData();
  }, [currentWeekStart]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const dateStr = format(currentWeekStart, "yyyy-MM-dd");
      const [schedulesRes, usersRes] = await Promise.all([
        api.get(`/work-schedules/week/${dateStr}`),
        api.get("/users")
      ]);
      setSchedules(schedulesRes.data.schedules);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error("Errore nel caricamento dei turni");
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const getWeekDates = () => {
    return DAYS.map((day, index) => ({
      name: day,
      date: addDays(currentWeekStart, index),
      dateStr: format(addDays(currentWeekStart, index), "yyyy-MM-dd")
    }));
  };

  const getSchedulesForDay = (dateStr) => {
    return schedules.filter(s => s.date === dateStr);
  };

  const openAddDialog = (dateStr) => {
    setScheduleForm({
      user_id: users[0]?.id || "",
      date: dateStr,
      start_time: "08:00",
      end_time: "16:00",
      notes: ""
    });
    setScheduleDialog({ open: true, schedule: null });
  };

  const openEditDialog = (schedule) => {
    setScheduleForm({
      user_id: schedule.user_id,
      date: schedule.date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      notes: schedule.notes || ""
    });
    setScheduleDialog({ open: true, schedule });
  };

  const saveSchedule = async () => {
    if (!scheduleForm.user_id || !scheduleForm.date) {
      toast.error("Seleziona un dipendente e una data");
      return;
    }

    try {
      if (scheduleDialog.schedule) {
        await api.put(`/work-schedules/${scheduleDialog.schedule.id}`, {
          start_time: scheduleForm.start_time,
          end_time: scheduleForm.end_time,
          notes: scheduleForm.notes
        });
        toast.success("Turno modificato!");
      } else {
        await api.post("/work-schedules", scheduleForm);
        toast.success("Turno aggiunto!");
      }
      setScheduleDialog({ open: false, schedule: null });
      fetchData();
    } catch (error) {
      toast.error("Errore nel salvataggio");
    }
  };

  const deleteSchedule = async () => {
    if (!deleteDialog.schedule) return;
    try {
      await api.delete(`/work-schedules/${deleteDialog.schedule.id}`);
      toast.success("Turno eliminato!");
      setDeleteDialog({ open: false, schedule: null });
      fetchData();
    } catch (error) {
      toast.error("Errore nell'eliminazione");
    }
  };

  const weekDates = getWeekDates();
  const isCurrentWeek = format(currentWeekStart, "yyyy-MM-dd") === format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Turni Settimanali</h1>
          <p className="text-muted-foreground">
            {format(currentWeekStart, "d MMMM", { locale: it })} - {format(addDays(currentWeekStart, 6), "d MMMM yyyy", { locale: it })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek} data-testid="prev-week-btn">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={goToToday} disabled={isCurrentWeek} data-testid="today-btn">
            Oggi
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek} data-testid="next-week-btn">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Week Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="h-48 skeleton-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDates.map((day, index) => {
            const daySchedules = getSchedulesForDay(day.dateStr);
            const isToday = format(new Date(), "yyyy-MM-dd") === day.dateStr;

            return (
              <motion.div
                key={day.dateStr}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`min-h-[200px] ${isToday ? 'border-accent border-2' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${isToday ? 'text-accent' : 'text-muted-foreground'}`}>
                          {day.name}
                        </p>
                        <p className={`text-2xl font-bold ${isToday ? 'text-accent' : ''}`}>
                          {format(day.date, "d")}
                        </p>
                      </div>
                      {isManager && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openAddDialog(day.dateStr)}
                          data-testid={`add-schedule-${day.dateStr}`}
                          className="text-accent"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {daySchedules.length > 0 ? (
                      daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="p-2 bg-secondary/50 rounded-lg text-sm group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                                <span className="text-xs font-semibold text-accent">
                                  {schedule.user_name.charAt(0)}
                                </span>
                              </div>
                              <span className="font-medium">{schedule.user_name}</span>
                            </div>
                            {isManager && (
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => openEditDialog(schedule)}
                                  data-testid={`edit-schedule-${schedule.id}`}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => setDeleteDialog({ open: true, schedule })}
                                  data-testid={`delete-schedule-${schedule.id}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{schedule.start_time} - {schedule.end_time}</span>
                          </div>
                          {schedule.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {schedule.notes}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nessun turno
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {schedules.length} turni questa settimana
              </span>
            </div>
            {users.map(u => {
              const userSchedules = schedules.filter(s => s.user_id === u.id);
              return (
                <div key={u.id} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-xs font-semibold text-accent">{u.name.charAt(0)}</span>
                  </div>
                  <span className="text-sm">{u.name}: {userSchedules.length} turni</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialog.open} onOpenChange={(open) => !open && setScheduleDialog({ open: false, schedule: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {scheduleDialog.schedule ? "Modifica Turno" : "Nuovo Turno"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Dipendente</Label>
              <Select
                value={scheduleForm.user_id}
                onValueChange={(value) => setScheduleForm({ ...scheduleForm, user_id: value })}
                disabled={!!scheduleDialog.schedule}
              >
                <SelectTrigger data-testid="schedule-user-select">
                  <SelectValue placeholder="Seleziona dipendente" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={scheduleForm.date}
                onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                disabled={!!scheduleDialog.schedule}
                data-testid="schedule-date-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ora Inizio</Label>
                <Input
                  type="time"
                  value={scheduleForm.start_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                  data-testid="schedule-start-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Ora Fine</Label>
                <Input
                  type="time"
                  value={scheduleForm.end_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                  data-testid="schedule-end-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note (opzionale)</Label>
              <Textarea
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                placeholder="Es. Apertura, Chiusura..."
                data-testid="schedule-notes-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialog({ open: false, schedule: null })}>
              Annulla
            </Button>
            <Button onClick={saveSchedule} data-testid="save-schedule-btn">
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, schedule: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo turno?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare il turno di {deleteDialog.schedule?.user_name} del {deleteDialog.schedule?.date}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteSchedule}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Turni;

import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { it } from "date-fns/locale";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Pencil,
  Trash2,
  Users,
  Copy,
  Calendar as CalendarIcon,
  List
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

const DAYS_SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

const Turni = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("month"); // month or week
  
  const [scheduleDialog, setScheduleDialog] = useState({ open: false, schedule: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, schedule: null });
  const [dayDialog, setDayDialog] = useState({ open: false, date: null });
  const [copyDialog, setCopyDialog] = useState({ open: false });
  const [copyFromWeek, setCopyFromWeek] = useState("");
  
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
  }, [currentMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      
      const [schedulesRes, usersRes] = await Promise.all([
        api.get(`/work-schedules?start_date=${start}&end_date=${end}`),
        api.get("/users")
      ]);
      setSchedules(schedulesRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error("Errore nel caricamento dei turni");
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const getMonthDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Add padding for first week
    const firstDayOfWeek = start.getDay();
    const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const paddedDays = [];
    for (let i = paddingDays; i > 0; i--) {
      paddedDays.push({ date: addDays(start, -i), isCurrentMonth: false });
    }
    
    days.forEach(day => {
      paddedDays.push({ date: day, isCurrentMonth: true });
    });
    
    return paddedDays;
  };

  const getSchedulesForDay = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return schedules.filter(s => s.date === dateStr);
  };

  const openDayDialog = (date) => {
    setSelectedDate(date);
    setDayDialog({ open: true, date });
  };

  const openAddDialog = (date) => {
    setScheduleForm({
      user_id: users[0]?.id || "",
      date: format(date, "yyyy-MM-dd"),
      start_time: "08:00",
      end_time: "16:00",
      notes: ""
    });
    setScheduleDialog({ open: true, schedule: null });
    setDayDialog({ open: false, date: null });
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

  const copyWeekSchedules = async () => {
    if (!copyFromWeek) {
      toast.error("Seleziona una settimana da copiare");
      return;
    }
    
    try {
      // Get schedules from source week
      const sourceDate = new Date(copyFromWeek);
      const sourceStart = format(startOfWeek(sourceDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const sourceEnd = format(addDays(startOfWeek(sourceDate, { weekStartsOn: 1 }), 6), "yyyy-MM-dd");
      
      const sourceSchedules = await api.get(`/work-schedules?start_date=${sourceStart}&end_date=${sourceEnd}`);
      
      // Calculate target week (current week)
      const targetStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      
      // Copy each schedule to target week
      for (const schedule of sourceSchedules.data) {
        const sourceDayOfWeek = new Date(schedule.date).getDay();
        const adjustedDay = sourceDayOfWeek === 0 ? 6 : sourceDayOfWeek - 1;
        const targetDate = format(addDays(targetStart, adjustedDay), "yyyy-MM-dd");
        
        await api.post("/work-schedules", {
          user_id: schedule.user_id,
          date: targetDate,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          notes: schedule.notes
        });
      }
      
      toast.success(`${sourceSchedules.data.length} turni copiati!`);
      setCopyDialog({ open: false });
      fetchData();
    } catch (error) {
      toast.error("Errore nella copia dei turni");
    }
  };

  const monthDays = getMonthDays();
  const isToday = (date) => isSameDay(date, new Date());

  // Get user color based on index
  const getUserColor = (userId) => {
    const index = users.findIndex(u => u.id === userId);
    const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];
    return colors[index % colors.length];
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Turni</h1>
          <p className="text-muted-foreground">
            {format(currentMonth, "MMMM yyyy", { locale: it })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Oggi
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          {isManager && (
            <Button 
              variant="outline" 
              onClick={() => setCopyDialog({ open: true })}
              className="ml-2"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copia settimana
            </Button>
          )}
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-4">
            {users.map((u, index) => (
              <div key={u.id} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getUserColor(u.id)}`} />
                <span className="text-sm">{u.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-2 md:p-4">
          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_SHORT.map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map(({ date, isCurrentMonth }, index) => {
              const daySchedules = getSchedulesForDay(date);
              const hasSchedules = daySchedules.length > 0;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  onClick={() => openDayDialog(date)}
                  className={`
                    min-h-[80px] md:min-h-[100px] p-1 md:p-2 rounded-lg cursor-pointer
                    transition-all duration-200 border
                    ${isCurrentMonth ? 'bg-card hover:bg-muted' : 'bg-muted/30 opacity-50'}
                    ${isToday(date) ? 'border-accent border-2' : 'border-transparent'}
                  `}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday(date) ? 'text-accent' : ''}`}>
                    {format(date, "d")}
                  </div>
                  
                  <div className="space-y-1">
                    {daySchedules.slice(0, 3).map((schedule, i) => (
                      <div
                        key={schedule.id}
                        className={`text-[10px] md:text-xs px-1 py-0.5 rounded text-white truncate ${getUserColor(schedule.user_id)}`}
                      >
                        <span className="hidden md:inline">{schedule.user_name} </span>
                        {schedule.start_time}
                      </div>
                    ))}
                    {daySchedules.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">
                        +{daySchedules.length - 3} altri
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <Dialog open={dayDialog.open} onOpenChange={(open) => !open && setDayDialog({ open: false, date: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {dayDialog.date && format(dayDialog.date, "EEEE d MMMM", { locale: it })}
              </span>
              {isManager && dayDialog.date && (
                <Button size="sm" onClick={() => openAddDialog(dayDialog.date)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Aggiungi
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {dayDialog.date && getSchedulesForDay(dayDialog.date).length > 0 ? (
              getSchedulesForDay(dayDialog.date).map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getUserColor(schedule.user_id)}`}>
                      {schedule.user_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{schedule.user_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {schedule.start_time} - {schedule.end_time}
                      </p>
                      {schedule.notes && (
                        <p className="text-xs text-muted-foreground italic">{schedule.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  {isManager && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(schedule)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setDeleteDialog({ open: true, schedule })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nessun turno per questo giorno
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
                <SelectTrigger>
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
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ora Inizio</Label>
                <Input
                  type="time"
                  value={scheduleForm.start_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ora Fine</Label>
                <Input
                  type="time"
                  value={scheduleForm.end_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note (opzionale)</Label>
              <Textarea
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                placeholder="Es. Apertura, Chiusura..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialog({ open: false, schedule: null })}>
              Annulla
            </Button>
            <Button onClick={saveSchedule}>
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy Week Dialog */}
      <Dialog open={copyDialog.open} onOpenChange={(open) => !open && setCopyDialog({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copia turni da altra settimana</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Seleziona una data della settimana da cui copiare i turni. 
              I turni verranno copiati nella settimana corrente.
            </p>
            <div className="space-y-2">
              <Label>Settimana di origine</Label>
              <Input
                type="date"
                value={copyFromWeek}
                onChange={(e) => setCopyFromWeek(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyDialog({ open: false })}>
              Annulla
            </Button>
            <Button onClick={copyWeekSchedules}>
              <Copy className="w-4 h-4 mr-2" />
              Copia turni
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
              Stai per eliminare il turno di {deleteDialog.schedule?.user_name}.
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

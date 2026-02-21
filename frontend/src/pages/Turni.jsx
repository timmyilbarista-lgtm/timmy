import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { it } from "date-fns/locale";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, Clock, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import api from "../lib/api";

const Turni = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [form, setForm] = useState({ user_id: "", date: "", start_time: "08:00", end_time: "16:00", notes: "" });

  const isManager = user?.role === "manager";

  useEffect(() => { fetchData(); }, [currentMonth]);

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
    } catch (e) {}
    setLoading(false);
  };

  const getMonthDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const firstDayOfWeek = start.getDay();
    const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const paddedDays = [];
    for (let i = paddingDays; i > 0; i--) paddedDays.push({ date: addDays(start, -i), isCurrentMonth: false });
    days.forEach(day => paddedDays.push({ date: day, isCurrentMonth: true }));
    return paddedDays;
  };

  const getSchedulesForDay = (date) => schedules.filter(s => s.date === format(date, "yyyy-MM-dd"));

  const openNew = (date) => {
    setEditingSchedule(null);
    setForm({ user_id: users[0]?.id || "", date: format(date, "yyyy-MM-dd"), start_time: "08:00", end_time: "16:00", notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (s) => {
    setEditingSchedule(s);
    setForm({ user_id: s.user_id, date: s.date, start_time: s.start_time, end_time: s.end_time, notes: s.notes || "" });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.user_id || !form.date) { toast.error("Compila tutti i campi"); return; }
    try {
      if (editingSchedule) {
        await api.put(`/work-schedules/${editingSchedule.id}`, { start_time: form.start_time, end_time: form.end_time, notes: form.notes });
        toast.success("Modificato!");
      } else {
        await api.post("/work-schedules", form);
        toast.success("Aggiunto!");
      }
      setDialogOpen(false);
      fetchData();
    } catch (e) { toast.error("Errore"); }
  };

  const deleteSchedule = async (id) => {
    await api.delete(`/work-schedules/${id}`);
    toast.success("Eliminato!");
    fetchData();
  };

  const monthDays = getMonthDays();

  // Vista dettaglio giorno
  if (selectedDay) {
    const daySchedules = getSchedulesForDay(selectedDay);
    return (
      <div className="p-4 md:p-8 space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedDay(null)}><ArrowLeft className="w-5 h-5"/></Button>
          <h1 className="font-heading text-xl font-bold">{format(selectedDay, "EEEE d MMMM", { locale: it })}</h1>
          {isManager && <Button size="sm" onClick={() => openNew(selectedDay)} className="ml-auto"><Plus className="w-4 h-4 mr-1"/>Aggiungi</Button>}
        </div>
        {daySchedules.length > 0 ? daySchedules.map(s => (
          <Card key={s.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold">{s.user_name}</p>
                <p className="text-sm text-muted-foreground"><Clock className="w-3 h-3 inline mr-1"/>{s.start_time} - {s.end_time}</p>
                {s.notes && <p className="text-xs italic">{s.notes}</p>}
              </div>
              {isManager && (
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="w-4 h-4"/></Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteSchedule(s.id)}><Trash2 className="w-4 h-4"/></Button>
                </div>
              )}
            </CardContent>
          </Card>
        )) : <p className="text-center text-muted-foreground py-8">Nessun turno</p>}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingSchedule ? "Modifica Turno" : "Nuovo Turno"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label>Dipendente</Label>
                <Select value={form.user_id} onValueChange={v => setForm({...form, user_id: v})} disabled={!!editingSchedule}>
                  <SelectTrigger><SelectValue placeholder="Seleziona"/></SelectTrigger>
                  <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Inizio</Label><Input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}/></div>
                <div><Label>Fine</Label><Input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})}/></div>
              </div>
              <div><Label>Note</Label><Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Es. Apertura, Chiusura"/></div>
            </div>
            <Button onClick={save} className="w-full">Salva</Button>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Vista calendario
  return (
    <div className="p-4 md:p-8 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5"/></Button>
        <h1 className="font-heading text-xl font-bold flex-1">Turni</h1>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}><ChevronLeft className="w-4 h-4"/></Button>
        <span className="text-sm font-medium w-28 text-center">{format(currentMonth, "MMM yyyy", { locale: it })}</span>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}><ChevronRight className="w-4 h-4"/></Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {["L","M","M","G","V","S","D"].map((d,i) => <div key={i}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthDays.map(({ date, isCurrentMonth }, i) => {
          const daySchedules = getSchedulesForDay(date);
          const isToday = isSameDay(date, new Date());
          return (
            <div key={i} onClick={() => setSelectedDay(date)}
              className={`min-h-[70px] p-1 rounded-lg cursor-pointer border text-sm
                ${isCurrentMonth ? 'bg-card hover:bg-muted' : 'opacity-40'}
                ${isToday ? 'border-orange-500 border-2' : 'border-transparent'}`}>
              <div className={`font-medium ${isToday ? 'text-orange-500' : ''}`}>{format(date, "d")}</div>
              {daySchedules.slice(0,2).map((s,j) => (
                <div key={j} className="text-[10px] bg-green-100 dark:bg-green-900 rounded px-1 truncate mt-0.5">{s.user_name}</div>
              ))}
              {daySchedules.length > 2 && <div className="text-[10px] text-muted-foreground">+{daySchedules.length-2}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Turni;

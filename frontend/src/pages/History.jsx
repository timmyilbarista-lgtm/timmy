import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Search,
  Filter
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";
import api from "../lib/api";

const History = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [selectedShift, setSelectedShift] = useState(null);
  const [shiftDetail, setShiftDetail] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (dateRange.from || dateRange.to) {
      fetchShifts();
    }
  }, [dateRange]);

  const fetchData = async () => {
    try {
      const [shiftsRes, categoriesRes, itemsRes] = await Promise.all([
        api.get("/shifts/history"),
        api.get("/categories"),
        api.get("/checklist-items"),
      ]);
      setShifts(shiftsRes.data);
      setCategories(categoriesRes.data);
      setItems(itemsRes.data);
    } catch (error) {
      toast.error("Errore nel caricamento dello storico");
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.from) params.append("start_date", format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange.to) params.append("end_date", format(dateRange.to, "yyyy-MM-dd"));
      
      const res = await api.get(`/shifts/history?${params.toString()}`);
      setShifts(res.data);
    } catch (error) {
      toast.error("Errore nel caricamento");
    } finally {
      setLoading(false);
    }
  };

  const viewShiftDetail = async (shift) => {
    setSelectedShift(shift);
    try {
      const res = await api.get(`/shifts/${shift.id}`);
      setShiftDetail(res.data);
    } catch (error) {
      toast.error("Errore nel caricamento dei dettagli");
    }
  };

  const getShiftTypeLabel = (type) => {
    switch (type) {
      case "morning": return "Mattina";
      case "afternoon": return "Pomeriggio";
      case "evening": return "Sera";
      default: return type;
    }
  };

  const clearFilters = () => {
    setDateRange({ from: null, to: null });
    fetchData();
  };

  if (loading && shifts.length === 0) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-8 w-48 skeleton-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 skeleton-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Storico Turni</h1>
          <p className="text-muted-foreground">
            {shifts.length} turni trovati
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" data-testid="date-filter-btn" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM")} - {format(dateRange.to, "dd/MM")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy")
                  )
                ) : (
                  "Filtra per data"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                locale={it}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>

          {(dateRange.from || dateRange.to) && (
            <Button variant="ghost" onClick={clearFilters} data-testid="clear-filters-btn">
              Pulisci filtri
            </Button>
          )}
        </div>
      </div>

      {/* Shifts List */}
      <div className="space-y-4">
        {shifts.length > 0 ? (
          shifts.map((shift, index) => (
            <motion.div
              key={shift.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="cursor-pointer hover:shadow-card-hover transition-all duration-200"
                onClick={() => viewShiftDetail(shift)}
                data-testid={`shift-card-${shift.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Date */}
                    <div className="w-16 h-16 rounded-xl bg-secondary flex flex-col items-center justify-center shrink-0">
                      <span className="text-2xl font-bold">
                        {format(new Date(shift.date), "dd")}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase">
                        {format(new Date(shift.date), "MMM", { locale: it })}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
                          Turno {getShiftTypeLabel(shift.shift_type)}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            shift.status === "closed"
                              ? "bg-muted text-muted-foreground"
                              : "bg-success/20 text-success"
                          }`}
                        >
                          {shift.status === "closed" ? "Chiuso" : "Aperto"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{shift.opened_by_name}</span>
                        </div>
                        {shift.closed_by_name && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Chiuso da {shift.closed_by_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Completion Rate */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {shift.completion_rate === 100 ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive" />
                          )}
                          <span
                            className={`text-lg font-semibold ${
                              shift.completion_rate === 100 ? "text-success" : "text-destructive"
                            }`}
                          >
                            {shift.completion_rate}%
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {shift.completed_items}/{shift.total_items}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <CalendarIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              Nessun turno trovato nel periodo selezionato
            </p>
          </div>
        )}
      </div>

      {/* Shift Detail Dialog */}
      <Dialog open={!!selectedShift} onOpenChange={(open) => !open && setSelectedShift(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Dettaglio Turno - {selectedShift && format(new Date(selectedShift.date), "dd MMMM yyyy", { locale: it })}
            </DialogTitle>
          </DialogHeader>

          {shiftDetail && (
            <div className="space-y-6 py-4">
              {/* Overview */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div>
                  <p className="text-sm text-muted-foreground">Completamento</p>
                  <p className="text-2xl font-bold">
                    {selectedShift.completed_items}/{selectedShift.total_items}
                  </p>
                </div>
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    selectedShift.completion_rate === 100
                      ? "bg-success/20 text-success"
                      : "bg-destructive/20 text-destructive"
                  }`}
                >
                  <span className="text-xl font-bold">{selectedShift.completion_rate}%</span>
                </div>
              </div>

              {/* Items by Category */}
              {categories.map((category) => {
                const categoryItems = items.filter((i) => i.category_id === category.id);
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category.id} className="space-y-2">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <div className="space-y-2">
                      {categoryItems.map((item) => {
                        const completion = shiftDetail.completions?.find((c) => c.item_id === item.id);
                        const completed = completion?.completed;

                        return (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 p-3 rounded-lg ${
                              completed ? "bg-success/10" : "bg-destructive/10"
                            }`}
                          >
                            {completed ? (
                              <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-destructive shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={completed ? "text-foreground" : "text-destructive"}>
                                {item.name}
                              </p>
                              {completion?.notes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Nota: {completion.notes}
                                </p>
                              )}
                            </div>
                            {completion?.completed_by_name && (
                              <span className="text-xs text-muted-foreground">
                                {completion.completed_by_name}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default History;

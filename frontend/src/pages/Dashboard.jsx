import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  Package,
  Coffee,
  ClipboardList,
  Boxes,
  Wallet,
  Thermometer,
  CheckCircle2,
  XCircle,
  Clock,
  PlayCircle,
  AlertTriangle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import api from "../lib/api";

const iconMap = {
  package: Package,
  coffee: Coffee,
  "clipboard-list": ClipboardList,
  boxes: Boxes,
  wallet: Wallet,
  thermometer: Thermometer,
};

const Dashboard = () => {
  const { user } = useAuth();
  const [shift, setShift] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shiftType, setShiftType] = useState("morning");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [shiftRes, categoriesRes, itemsRes] = await Promise.all([
        api.get("/shifts/current"),
        api.get("/categories"),
        api.get("/checklist-items"),
      ]);
      setShift(shiftRes.data);
      setCategories(categoriesRes.data);
      setItems(itemsRes.data);
    } catch (error) {
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  };

  const openShift = async () => {
    try {
      await api.post("/shifts", { shift_type: shiftType });
      toast.success("Turno aperto con successo!");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nell'apertura del turno");
    }
  };

  const closeShift = async () => {
    if (!shift) return;
    try {
      await api.put(`/shifts/${shift.id}/close`);
      toast.success("Turno chiuso con successo!");
      fetchData();
    } catch (error) {
      toast.error("Errore nella chiusura del turno");
    }
  };

  const getCategoryStats = (categoryId) => {
    const categoryItems = items.filter((i) => i.category_id === categoryId);
    const completions = shift?.completions || [];
    const completed = categoryItems.filter((item) =>
      completions.find((c) => c.item_id === item.id && c.completed)
    ).length;
    return { total: categoryItems.length, completed };
  };

  const getOverallStats = () => {
    if (!shift?.completions) return { total: 0, completed: 0, percentage: 0 };
    const total = items.length;
    const completed = shift.completions.filter((c) => c.completed).length;
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const stats = getOverallStats();

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-8 w-48 skeleton-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 skeleton-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold">
            Ciao, {user?.name}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString("it-IT", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>

        {!shift ? (
          <div className="flex items-center gap-3">
            <Select value={shiftType} onValueChange={setShiftType}>
              <SelectTrigger className="w-40" data-testid="shift-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Mattina</SelectItem>
                <SelectItem value="afternoon">Pomeriggio</SelectItem>
                <SelectItem value="evening">Sera</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={openShift}
              data-testid="open-shift-btn"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Apri Turno
            </Button>
          </div>
        ) : (
          <Button
            onClick={closeShift}
            data-testid="close-shift-btn"
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Clock className="w-4 h-4 mr-2" />
            Chiudi Turno
          </Button>
        )}
      </div>

      {/* Shift Status */}
      {shift ? (
        <>
          {/* Progress Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6 card-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading text-xl font-semibold">Progresso Turno</h2>
                <p className="text-sm text-muted-foreground">
                  Turno {shift.shift_type === "morning" ? "mattina" : shift.shift_type === "afternoon" ? "pomeriggio" : "sera"} 
                  {" "}aperto da {shift.opened_by_name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-accent">{stats.percentage}%</p>
                <p className="text-sm text-muted-foreground">
                  {stats.completed}/{stats.total} completati
                </p>
              </div>
            </div>
            <Progress value={stats.percentage} className="h-3" />

            {stats.percentage < 100 && (
              <div className="mt-4 flex items-center gap-2 text-warning">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">
                  {stats.total - stats.completed} attivita in sospeso
                </span>
              </div>
            )}
          </motion.div>

          {/* Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => {
              const Icon = iconMap[category.icon] || ClipboardList;
              const { total, completed } = getCategoryStats(category.id);
              const isComplete = total > 0 && completed === total;
              const hasItems = total > 0;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/checklist/${category.id}`} data-testid={`category-card-${category.id}`}>
                    <Card
                      className={`category-card cursor-pointer transition-all duration-300 hover:shadow-card-hover ${
                        isComplete
                          ? "border-success/50 bg-success/5"
                          : hasItems && completed < total
                          ? "border-destructive/50 bg-destructive/5"
                          : ""
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              isComplete ? "bg-success/20 text-success" : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          {hasItems && (
                            <div
                              className={`completion-badge w-8 h-8 rounded-full flex items-center justify-center ${
                                isComplete ? "complete bg-success text-success-foreground" : "incomplete bg-destructive text-destructive-foreground"
                              }`}
                            >
                              {isComplete ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <XCircle className="w-5 h-5" />
                              )}
                            </div>
                          )}
                        </div>
                        <CardTitle className="font-heading text-lg mt-3">{category.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {completed}/{total} completati
                          </span>
                          <span className={isComplete ? "text-success font-medium" : "text-muted-foreground"}>
                            {total > 0 ? Math.round((completed / total) * 100) : 0}%
                          </span>
                        </div>
                        <Progress
                          value={total > 0 ? (completed / total) * 100 : 0}
                          className="h-2 mt-2"
                        />
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        /* No Shift Open */
        <div className="empty-state">
          <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-6">
            <Coffee className="w-16 h-16 text-muted-foreground/50" />
          </div>
          <h2 className="font-heading text-2xl font-semibold mb-2">Nessun turno attivo</h2>
          <p className="text-muted-foreground max-w-md">
            Apri un nuovo turno per iniziare a spuntare la checklist. 
            Seleziona il tipo di turno e premi "Apri Turno".
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

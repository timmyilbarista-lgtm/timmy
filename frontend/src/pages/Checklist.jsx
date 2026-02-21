import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Coffee,
  ClipboardList,
  Boxes,
  Wallet,
  Thermometer,
  Wrench,
  CheckCircle2,
  Circle,
  ChevronLeft,
  MessageSquare,
  User,
  Pencil,
  Trash2,
  Plus
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Progress } from "../components/ui/progress";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
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

const iconMap = {
  package: Package,
  coffee: Coffee,
  "clipboard-list": ClipboardList,
  boxes: Boxes,
  wallet: Wallet,
  thermometer: Thermometer,
  wrench: Wrench,
};

const Checklist = () => {
  const { categoryId } = useParams();
  const { user } = useAuth();
  const [shift, setShift] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [noteDialog, setNoteDialog] = useState({ open: false, item: null, note: "" });
  const [editDialog, setEditDialog] = useState({ open: false, item: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  const isManager = user?.role === "manager";

  useEffect(() => {
    fetchData();
  }, [categoryId]);

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

      if (categoryId) {
        const cat = categoriesRes.data.find((c) => c.id === categoryId);
        setSelectedCategory(cat);
      }
    } catch (error) {
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (itemId, completed, notes = "") => {
    if (!shift) {
      toast.error("Nessun turno attivo");
      return;
    }

    try {
      await api.put(`/shifts/${shift.id}/complete-item`, {
        item_id: itemId,
        completed,
        notes,
      });

      // Update local state
      setShift((prev) => {
        const completions = [...(prev?.completions || [])];
        const index = completions.findIndex((c) => c.item_id === itemId);
        if (index >= 0) {
          completions[index] = {
            ...completions[index],
            completed,
            completed_by: completed ? user.id : null,
            completed_by_name: completed ? user.name : null,
            notes,
          };
        } else {
          completions.push({
            item_id: itemId,
            completed,
            completed_by: completed ? user.id : null,
            completed_by_name: completed ? user.name : null,
            notes,
          });
        }
        return { ...prev, completions };
      });

      toast.success(completed ? "Attivita completata!" : "Attivita segnata come non completata");
    } catch (error) {
      toast.error("Errore nell'aggiornamento");
    }
  };

  const handleAddNote = () => {
    if (noteDialog.item) {
      toggleItem(noteDialog.item.id, true, noteDialog.note);
    }
    setNoteDialog({ open: false, item: null, note: "" });
  };

  const openEditDialog = (item) => {
    setEditForm({ name: item.name, description: item.description || "" });
    setEditDialog({ open: true, item });
  };

  const saveEdit = async () => {
    if (!editDialog.item) return;
    try {
      await api.put(`/checklist-items/${editDialog.item.id}`, {
        name: editForm.name,
        description: editForm.description,
      });
      toast.success("Voce modificata!");
      setEditDialog({ open: false, item: null });
      fetchData();
    } catch (error) {
      toast.error("Errore nel salvataggio");
    }
  };

  const deleteItem = async () => {
    if (!deleteDialog.item) return;
    try {
      await api.delete(`/checklist-items/${deleteDialog.item.id}`);
      toast.success("Voce eliminata!");
      setDeleteDialog({ open: false, item: null });
      fetchData();
    } catch (error) {
      toast.error("Errore nell'eliminazione");
    }
  };

  const isItemCompleted = (itemId) => {
    return shift?.completions?.find((c) => c.item_id === itemId)?.completed || false;
  };

  const getItemCompletion = (itemId) => {
    return shift?.completions?.find((c) => c.item_id === itemId);
  };

  const getCategoryStats = (catId) => {
    const categoryItems = items.filter((i) => i.category_id === catId);
    const completed = categoryItems.filter((item) => isItemCompleted(item.id)).length;
    return { total: categoryItems.length, completed };
  };

  const filteredItems = selectedCategory
    ? items.filter((i) => i.category_id === selectedCategory.id)
    : items;

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-8 w-48 skeleton-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 skeleton-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="p-6 md:p-8">
        <div className="empty-state">
          <ClipboardList className="empty-state-icon" />
          <h2 className="font-heading text-2xl font-semibold mb-2">Nessun turno attivo</h2>
          <p className="text-muted-foreground mb-6">
            Apri un turno dalla dashboard per visualizzare la checklist.
          </p>
          <Link to="/">
            <Button data-testid="go-to-dashboard-btn">Vai alla Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {selectedCategory ? (
          <>
            <Link to="/checklist">
              <Button variant="ghost" size="icon" data-testid="back-to-categories-btn">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold">
                {selectedCategory.name}
              </h1>
              <p className="text-muted-foreground text-sm">
                {getCategoryStats(selectedCategory.id).completed}/{getCategoryStats(selectedCategory.id).total} completati
              </p>
            </div>
          </>
        ) : (
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold">Checklist</h1>
            <p className="text-muted-foreground">Seleziona una categoria</p>
          </div>
        )}
      </div>

      {/* Category Selection or Items */}
      {!selectedCategory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category, index) => {
            const Icon = iconMap[category.icon] || ClipboardList;
            const { total, completed } = getCategoryStats(category.id);
            const isComplete = total > 0 && completed === total;

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/checklist/${category.id}`} data-testid={`checklist-category-${category.id}`}>
                  <Card
                    className={`cursor-pointer transition-all duration-200 hover:shadow-card-hover ${
                      isComplete ? "border-success/50" : ""
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                            isComplete ? "bg-success/20 text-success" : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          <Icon className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-heading font-semibold text-lg">{category.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={(completed / total) * 100 || 0} className="flex-1 h-2" />
                            <span className="text-sm text-muted-foreground">
                              {completed}/{total}
                            </span>
                          </div>
                        </div>
                        {isComplete && <CheckCircle2 className="w-6 h-6 text-success" />}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Items List */
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => {
              const completed = isItemCompleted(item.id);
              const completion = getItemCompletion(item.id);

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`checklist-item transition-all duration-200 ${
                      completed ? "checklist-item-complete" : "checklist-item-pending"
                    }`}
                  >
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-start gap-4">
                        <div
                          className="flex items-center justify-center cursor-pointer touch-target"
                          onClick={() => toggleItem(item.id, !completed)}
                          data-testid={`checklist-item-toggle-${item.id}`}
                        >
                          <Checkbox
                            checked={completed}
                            className={`h-6 w-6 rounded-md checkbox-custom ${
                              completed ? "bg-success border-success text-success-foreground" : ""
                            }`}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3
                            className={`font-medium text-lg ${
                              completed ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          )}

                          {completion?.completed_by_name && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />
                              <span>Completato da {completion.completed_by_name}</span>
                            </div>
                          )}

                          {completion?.notes && (
                            <div className="mt-2 p-2 bg-muted/50 rounded-lg text-sm">
                              <MessageSquare className="w-3 h-3 inline-block mr-1" />
                              {completion.notes}
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setNoteDialog({ open: true, item, note: completion?.notes || "" })}
                          data-testid={`add-note-btn-${item.id}`}
                          className="shrink-0"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>

                        {isManager && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(item)}
                              data-testid={`edit-item-btn-${item.id}`}
                              className="shrink-0 text-accent"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteDialog({ open: true, item })}
                              data-testid={`delete-item-btn-${item.id}`}
                              className="shrink-0 text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredItems.length === 0 && (
            <div className="empty-state py-12">
              <Circle className="empty-state-icon" />
              <p className="text-muted-foreground">Nessuna attivita in questa categoria</p>
            </div>
          )}
        </div>
      )}

      {/* Note Dialog */}
      <Dialog open={noteDialog.open} onOpenChange={(open) => !open && setNoteDialog({ ...noteDialog, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi una nota</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Scrivi una nota per questa attivita..."
              value={noteDialog.note}
              onChange={(e) => setNoteDialog({ ...noteDialog, note: e.target.value })}
              data-testid="note-input"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog({ open: false, item: null, note: "" })}>
              Annulla
            </Button>
            <Button onClick={handleAddNote} data-testid="save-note-btn">
              Salva e Completa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false, item: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica voce</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nome della voce"
                data-testid="edit-item-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrizione (opzionale)</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Descrizione"
                data-testid="edit-item-description-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, item: null })}>
              Annulla
            </Button>
            <Button onClick={saveEdit} data-testid="save-edit-btn">
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, item: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa voce?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare "{deleteDialog.item?.name}". Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-item-btn"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Checklist;

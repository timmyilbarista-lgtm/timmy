import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Coffee,
  ClipboardList,
  Boxes,
  Wallet,
  Thermometer,
  Wrench,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Users,
  FolderKanban,
  ListChecks,
  Save,
  X,
  ChevronRight
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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

const iconOptions = [
  { value: "package", label: "Carichi", icon: Package },
  { value: "coffee", label: "Caffè", icon: Coffee },
  { value: "clipboard-list", label: "Lista", icon: ClipboardList },
  { value: "boxes", label: "Scatole", icon: Boxes },
  { value: "wallet", label: "Cassa", icon: Wallet },
  { value: "thermometer", label: "Temperatura", icon: Thermometer },
  { value: "wrench", label: "Attrezzature", icon: Wrench },
];

const Manager = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const isAdmin = user?.role === "admin";

  // Dialogs
  const [categoryDialog, setCategoryDialog] = useState({ open: false, category: null });
  const [itemDialog, setItemDialog] = useState({ open: false, item: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null });
  const [userDialog, setUserDialog] = useState({ open: false, user: null });

  // Forms
  const [categoryForm, setCategoryForm] = useState({ name: "", icon: "clipboard-list", order: 0 });
  const [itemForm, setItemForm] = useState({ category_id: "", name: "", description: "", order: 0 });
  const [userForm, setUserForm] = useState({ name: "", pin: "", role: "barista" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, itemsRes, usersRes] = await Promise.all([
        api.get("/categories"),
        api.get("/checklist-items"),
        api.get("/users"),
      ]);
      setCategories(categoriesRes.data);
      setItems(itemsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  };

  // Category handlers
  const openCategoryDialog = (category = null) => {
    if (category) {
      setCategoryForm({ name: category.name, icon: category.icon, order: category.order });
    } else {
      setCategoryForm({ name: "", icon: "clipboard-list", order: categories.length });
    }
    setCategoryDialog({ open: true, category });
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Inserisci un nome per la categoria");
      return;
    }

    try {
      if (categoryDialog.category) {
        await api.put(`/categories/${categoryDialog.category.id}`, categoryForm);
        toast.success("Categoria aggiornata");
      } else {
        await api.post("/categories", categoryForm);
        toast.success("Categoria creata");
      }
      fetchData();
      setCategoryDialog({ open: false, category: null });
    } catch (error) {
      toast.error("Errore nel salvataggio");
    }
  };

  const deleteCategory = async () => {
    try {
      await api.delete(`/categories/${deleteDialog.id}`);
      toast.success("Categoria eliminata");
      fetchData();
      setDeleteDialog({ open: false, type: null, id: null });
    } catch (error) {
      toast.error("Errore nell'eliminazione");
    }
  };

  // Item handlers
  const openItemDialog = (item = null) => {
    if (item) {
      setItemForm({
        category_id: item.category_id,
        name: item.name,
        description: item.description || "",
        order: item.order,
      });
    } else {
      setItemForm({
        category_id: categories[0]?.id || "",
        name: "",
        description: "",
        order: 0,
      });
    }
    setItemDialog({ open: true, item });
  };

  const saveItem = async () => {
    if (!itemForm.name.trim() || !itemForm.category_id) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    try {
      if (itemDialog.item) {
        await api.put(`/checklist-items/${itemDialog.item.id}`, {
          name: itemForm.name,
          description: itemForm.description,
          order: itemForm.order,
        });
        toast.success("Attivita aggiornata");
      } else {
        await api.post("/checklist-items", itemForm);
        toast.success("Attivita creata");
      }
      fetchData();
      setItemDialog({ open: false, item: null });
    } catch (error) {
      toast.error("Errore nel salvataggio");
    }
  };

  const deleteItem = async () => {
    try {
      await api.delete(`/checklist-items/${deleteDialog.id}`);
      toast.success("Attivita eliminata");
      fetchData();
      setDeleteDialog({ open: false, type: null, id: null });
    } catch (error) {
      toast.error("Errore nell'eliminazione");
    }
  };

  // User functions
  const openUserDialog = async (user = null) => {
    if (user) {
      // Fetch user details including PIN
      try {
        const res = await api.get(`/users/${user.id}`);
        setUserForm({ 
          name: res.data.name, 
          pin: res.data.pin_display || "", 
          role: res.data.role 
        });
      } catch (error) {
        setUserForm({ name: user.name, pin: "", role: user.role });
      }
    } else {
      setUserForm({ name: "", pin: "", role: "barista" });
    }
    setUserDialog({ open: true, user });
  };

  const saveUser = async () => {
    try {
      if (!userForm.name || (!userDialog.user && !userForm.pin)) {
        toast.error("Compila tutti i campi");
        return;
      }
      if (userDialog.user) {
        // Update user
        const updateData = { name: userForm.name, role: userForm.role };
        if (userForm.pin) updateData.pin = userForm.pin;
        await api.put(`/users/${userDialog.user.id}`, updateData);
        toast.success("Utente aggiornato");
      } else {
        // Create user
        await api.post("/users", userForm);
        toast.success("Utente creato");
      }
      fetchData();
      setUserDialog({ open: false, user: null });
    } catch (error) {
      toast.error("Errore nel salvataggio");
    }
  };

  const deleteUser = async () => {
    try {
      await api.delete(`/users/${deleteDialog.id}`);
      toast.success("Utente eliminato");
      fetchData();
      setDeleteDialog({ open: false, type: null, id: null });
    } catch (error) {
      toast.error("Errore nell'eliminazione");
    }
  };

  const getCategoryName = (categoryId) => {
    return categories.find((c) => c.id === categoryId)?.name || "";
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-8 w-48 skeleton-pulse" />
        <div className="h-12 w-full skeleton-pulse rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 skeleton-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold">Gestione</h1>
        <p className="text-muted-foreground">
          Configura categorie{isAdmin ? ", attivita e utenti" : " e attivita"}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className={`grid w-full ${isAdmin ? "grid-cols-3" : "grid-cols-2"}`}>
          <TabsTrigger value="categories" data-testid="tab-categories" className="gap-2">
            <FolderKanban className="w-4 h-4" />
            <span className="hidden sm:inline">Categorie</span>
          </TabsTrigger>
          <TabsTrigger value="items" data-testid="tab-items" className="gap-2">
            <ListChecks className="w-4 h-4" />
            <span className="hidden sm:inline">Attivita</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" data-testid="tab-users" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Utenti</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openCategoryDialog()} data-testid="add-category-btn">
              <Plus className="w-4 h-4 mr-2" />
              Nuova Categoria
            </Button>
          </div>

          <div className="space-y-3">
            {categories.map((category, index) => {
              const IconComponent = iconOptions.find((i) => i.value === category.icon)?.icon || ClipboardList;
              const itemCount = items.filter((i) => i.category_id === category.id).length;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedCategoryId(selectedCategoryId === category.id ? null : category.id)}
                    data-testid={`category-expand-${category.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-secondary-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {itemCount} attivita - Tocca per vedere
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); openCategoryDialog(category); }}
                            data-testid={`edit-category-${category.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, type: "category", id: category.id }); }}
                            data-testid={`delete-category-${category.id}`}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${selectedCategoryId === category.id ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      {/* Expanded Items List */}
                      {selectedCategoryId === category.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-border space-y-2"
                        >
                          {items.filter(i => i.category_id === category.id).map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium">{item.name}</p>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground">{item.description}</p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); openItemDialog(item); }}
                                data-testid={`edit-item-inline-${item.id}`}
                                className="text-accent"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, type: "item", id: item.id }); }}
                                data-testid={`delete-item-inline-${item.id}`}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          {items.filter(i => i.category_id === category.id).length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-2">Nessuna voce in questa categoria</p>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); setItemForm({...itemForm, category_id: category.id}); setItemDialog({ open: true, item: null }); }}
                            className="w-full mt-2"
                            data-testid={`add-item-to-${category.id}`}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Aggiungi voce a {category.name}
                          </Button>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openItemDialog()} data-testid="add-item-btn">
              <Plus className="w-4 h-4 mr-2" />
              Nuova Attivita
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getCategoryName(item.category_id)}
                          {item.description && ` · ${item.description}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openItemDialog(item)}
                          data-testid={`edit-item-${item.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteDialog({ open: true, type: "item", id: item.id })}
                          data-testid={`delete-item-${item.id}`}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Users Tab - Only for Admin */}
        {isAdmin && (
        <TabsContent value="users" className="space-y-4">
          <Button onClick={() => openUserDialog()} className="gap-2" data-testid="add-user-btn">
            <Plus className="w-4 h-4" />
            Nuovo Utente
          </Button>
          <div className="space-y-3">
            {users.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-lg font-semibold text-secondary-foreground">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{user.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                        {user.pin_display && (
                          <p className="text-xs text-amber-500 font-mono">PIN: {user.pin_display}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openUserDialog(user)}
                        data-testid={`edit-user-${user.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, type: "user", id: user.id })}
                        className="text-destructive"
                        data-testid={`delete-user-${user.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={categoryDialog.open} onOpenChange={(open) => !open && setCategoryDialog({ open: false, category: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {categoryDialog.category ? "Modifica Categoria" : "Nuova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Nome categoria"
                data-testid="category-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Icona</Label>
              <Select
                value={categoryForm.icon}
                onValueChange={(value) => setCategoryForm({ ...categoryForm, icon: value })}
              >
                <SelectTrigger data-testid="category-icon-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialog({ open: false, category: null })}>
              Annulla
            </Button>
            <Button onClick={saveCategory} data-testid="save-category-btn">
              <Save className="w-4 h-4 mr-2" />
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemDialog.open} onOpenChange={(open) => !open && setItemDialog({ open: false, item: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {itemDialog.item ? "Modifica Attivita" : "Nuova Attivita"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={itemForm.category_id}
                onValueChange={(value) => setItemForm({ ...itemForm, category_id: value })}
                disabled={!!itemDialog.item}
              >
                <SelectTrigger data-testid="item-category-select">
                  <SelectValue placeholder="Seleziona categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="Nome attivita"
                data-testid="item-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrizione (opzionale)</Label>
              <Textarea
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Descrizione o istruzioni"
                data-testid="item-description-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialog({ open: false, item: null })}>
              Annulla
            </Button>
            <Button onClick={saveItem} data-testid="save-item-btn">
              <Save className="w-4 h-4 mr-2" />
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, type: null, id: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.type === "category"
                ? "Eliminando questa categoria verranno eliminate anche tutte le attivita associate. Questa azione non può essere annullata."
                : deleteDialog.type === "user"
                ? "Sei sicuro di voler eliminare questo utente? Questa azione non può essere annullata."
                : "Sei sicuro di voler eliminare questa attivita? Questa azione non può essere annullata."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteDialog.type === "category" ? deleteCategory : deleteDialog.type === "user" ? deleteUser : deleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-btn"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Dialog */}
      <Dialog open={userDialog.open} onOpenChange={(open) => !open && setUserDialog({ open: false, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {userDialog.user ? "Modifica Utente" : "Nuovo Utente"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="Nome utente o bar"
                data-testid="user-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>PIN {userDialog.user && "(lascia vuoto per non cambiare)"}</Label>
              <Input
                type="password"
                value={userForm.pin}
                onChange={(e) => setUserForm({ ...userForm, pin: e.target.value })}
                placeholder="PIN (4 cifre)"
                maxLength={4}
                data-testid="user-pin-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Ruolo</Label>
              <Select
                value={userForm.role}
                onValueChange={(value) => setUserForm({ ...userForm, role: value })}
              >
                <SelectTrigger data-testid="user-role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="barista">Barista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialog({ open: false, user: null })}>
              Annulla
            </Button>
            <Button onClick={saveUser} data-testid="save-user-btn">
              <Save className="w-4 h-4 mr-2" />
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Manager;

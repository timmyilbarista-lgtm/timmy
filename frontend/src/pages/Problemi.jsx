import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Phone,
  Mail,
  MessageCircle,
  Plus,
  CheckCircle2,
  Clock,
  Wrench,
  ChevronRight,
  Settings,
  Trash2,
  Pencil,
  Send,
  X
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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

const Problemi = () => {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [reportDialog, setReportDialog] = useState({ open: false });
  const [contactDialog, setContactDialog] = useState({ open: false, equipment: null });
  const [equipmentDialog, setEquipmentDialog] = useState({ open: false, equipment: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null });
  
  const [reportForm, setReportForm] = useState({
    equipment_id: "",
    equipment_name_manual: "",
    description: "",
    priority: "medium",
    contact_phone: "",
    contact_email: "",
    contact_whatsapp: ""
  });
  
  const [equipmentForm, setEquipmentForm] = useState({
    name: "",
    type: "owned",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    contact_whatsapp: "",
    notes: ""
  });

  const isManager = user?.role === "manager";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [equipmentRes, problemsRes] = await Promise.all([
        api.get("/equipment"),
        api.get("/problems")
      ]);
      setEquipment(equipmentRes.data);
      setProblems(problemsRes.data);
    } catch (error) {
      toast.error("Errore nel caricamento");
    } finally {
      setLoading(false);
    }
  };

  const openReportDialog = () => {
    setReportForm({
      equipment_id: "",
      equipment_name_manual: "",
      description: "",
      priority: "medium"
    });
    setReportDialog({ open: true });
  };

  const submitReport = async () => {
    if ((!reportForm.equipment_id && !reportForm.equipment_name_manual) || !reportForm.description) {
      toast.error("Inserisci attrezzatura e descrivi il problema");
      return;
    }
    
    try {
      let res;
      if (reportForm.equipment_id) {
        // Use existing equipment
        res = await api.post("/problems", {
          equipment_id: reportForm.equipment_id,
          description: reportForm.description,
          priority: reportForm.priority
        });
        
        // Show contact info
        if (res.data.contact && (res.data.contact.phone || res.data.contact.email)) {
          const eq = equipment.find(e => e.id === reportForm.equipment_id);
          setContactDialog({ open: true, equipment: eq });
        }
      } else {
        // Create manual report
        res = await api.post("/problems/manual", {
          equipment_name: reportForm.equipment_name_manual,
          description: reportForm.description,
          priority: reportForm.priority
        });
      }
      
      toast.success("Problema segnalato!");
      setReportDialog({ open: false });
      fetchData();
    } catch (error) {
      toast.error("Errore nella segnalazione");
    }
  };

  const resolveProblem = async (problemId) => {
    try {
      await api.put(`/problems/${problemId}`, { status: "resolved" });
      toast.success("Problema risolto!");
      fetchData();
    } catch (error) {
      toast.error("Errore");
    }
  };

  const openEquipmentDialog = (eq = null) => {
    if (eq) {
      setEquipmentForm({
        name: eq.name,
        type: eq.type,
        contact_name: eq.contact_name || "",
        contact_phone: eq.contact_phone || "",
        contact_email: eq.contact_email || "",
        contact_whatsapp: eq.contact_whatsapp || "",
        notes: eq.notes || ""
      });
    } else {
      setEquipmentForm({
        name: "",
        type: "owned",
        contact_name: "",
        contact_phone: "",
        contact_email: "",
        contact_whatsapp: "",
        notes: ""
      });
    }
    setEquipmentDialog({ open: true, equipment: eq });
  };

  const saveEquipment = async () => {
    if (!equipmentForm.name) {
      toast.error("Inserisci il nome dell'attrezzatura");
      return;
    }
    
    try {
      if (equipmentDialog.equipment) {
        await api.put(`/equipment/${equipmentDialog.equipment.id}`, equipmentForm);
        toast.success("Attrezzatura aggiornata!");
      } else {
        await api.post("/equipment", equipmentForm);
        toast.success("Attrezzatura aggiunta!");
      }
      setEquipmentDialog({ open: false, equipment: null });
      fetchData();
    } catch (error) {
      toast.error("Errore nel salvataggio");
    }
  };

  const deleteItem = async () => {
    try {
      if (deleteDialog.type === "equipment") {
        await api.delete(`/equipment/${deleteDialog.id}`);
      } else {
        await api.delete(`/problems/${deleteDialog.id}`);
      }
      toast.success("Eliminato!");
      setDeleteDialog({ open: false, type: null, id: null });
      fetchData();
    } catch (error) {
      toast.error("Errore");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-orange-500";
      case "low": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case "high": return "Alta";
      case "medium": return "Media";
      case "low": return "Bassa";
      default: return priority;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "open": return "Aperto";
      case "in_progress": return "In corso";
      case "resolved": return "Risolto";
      default: return status;
    }
  };

  const openProblems = problems.filter(p => p.status !== "resolved");
  const resolvedProblems = problems.filter(p => p.status === "resolved");

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-8 w-48 skeleton-pulse" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 skeleton-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Problemi Attrezzature</h1>
          <p className="text-muted-foreground">
            Segnala e gestisci problemi tecnici
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={openReportDialog} className="bg-destructive hover:bg-destructive/90">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Segnala Problema
          </Button>
        </div>
      </div>

      <Tabs defaultValue="problems" className="space-y-6">
        <TabsList>
          <TabsTrigger value="problems" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Problemi ({openProblems.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Risolti
          </TabsTrigger>
          {isManager && (
            <TabsTrigger value="equipment" className="gap-2">
              <Settings className="w-4 h-4" />
              Attrezzature
            </TabsTrigger>
          )}
        </TabsList>

        {/* Open Problems */}
        <TabsContent value="problems" className="space-y-4">
          {openProblems.length > 0 ? (
            openProblems.map((problem, index) => {
              const eq = equipment.find(e => e.id === problem.equipment_id);
              return (
                <motion.div
                  key={problem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-l-4 border-l-destructive">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Wrench className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">{problem.equipment_name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs text-white ${getPriorityColor(problem.priority)}`}>
                              {getPriorityLabel(problem.priority)}
                            </span>
                          </div>
                          <p className="text-foreground">{problem.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>Segnalato da {problem.reported_by_name}</span>
                            <span>{format(new Date(problem.created_at), "dd/MM HH:mm")}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {eq && (eq.contact_phone || eq.contact_whatsapp) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setContactDialog({ open: true, equipment: eq })}
                            >
                              <Phone className="w-4 h-4 mr-1" />
                              Contatta
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600"
                            onClick={() => resolveProblem(problem.id)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Risolto
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500/30 mb-4" />
              <p className="text-muted-foreground">Nessun problema aperto!</p>
            </div>
          )}
        </TabsContent>

        {/* Resolved Problems */}
        <TabsContent value="resolved" className="space-y-4">
          {resolvedProblems.length > 0 ? (
            resolvedProblems.map((problem, index) => (
              <motion.div
                key={problem.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card className="opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="font-medium">{problem.equipment_name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{problem.description}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(problem.created_at), "dd/MM/yyyy")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-12">Nessun problema risolto</p>
          )}
        </TabsContent>

        {/* Equipment Management (Manager only) */}
        {isManager && (
          <TabsContent value="equipment" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => openEquipmentDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Attrezzatura
              </Button>
            </div>
            
            {equipment.length > 0 ? (
              equipment.map((eq, index) => (
                <motion.div
                  key={eq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                            <Wrench className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{eq.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {eq.type === "rental" ? "Comodato d'uso" : "Di proprietà"}
                              {eq.contact_name && ` · ${eq.contact_name}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEquipmentDialog(eq)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => setDeleteDialog({ open: true, type: "equipment", id: eq.id })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <Wrench className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Nessuna attrezzatura configurata</p>
                <p className="text-sm text-muted-foreground">Aggiungi le attrezzature del bar per poter segnalare problemi</p>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Report Problem Dialog */}
      <Dialog open={reportDialog.open} onOpenChange={(open) => !open && setReportDialog({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Segnala Problema</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Attrezzatura</Label>
              <Input
                value={reportForm.equipment_name_manual}
                onChange={(e) => setReportForm({ ...reportForm, equipment_name_manual: e.target.value, equipment_id: "" })}
                placeholder="Scrivi il nome dell'attrezzatura (es. Macchina Espresso)"
              />
            </div>
            
            {equipment.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Oppure seleziona da lista</Label>
                <Select
                  value={reportForm.equipment_id}
                  onValueChange={(value) => setReportForm({ ...reportForm, equipment_id: value, equipment_name_manual: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona attrezzatura esistente" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.map(eq => (
                      <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Descrizione problema</Label>
              <Textarea
                value={reportForm.description}
                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                placeholder="Descrivi il problema..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Priorità</Label>
              <Select
                value={reportForm.priority}
                onValueChange={(value) => setReportForm({ ...reportForm, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Bassa - può aspettare</SelectItem>
                  <SelectItem value="medium">Media - da risolvere presto</SelectItem>
                  <SelectItem value="high">Alta - urgente!</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialog({ open: false })}>
              Annulla
            </Button>
            <Button onClick={submitReport} className="bg-destructive hover:bg-destructive/90">
              <Send className="w-4 h-4 mr-2" />
              Invia Segnalazione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={contactDialog.open} onOpenChange={(open) => !open && setContactDialog({ open: false, equipment: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contatta Assistenza</DialogTitle>
          </DialogHeader>
          {contactDialog.equipment && (
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">
                Contatti per <strong>{contactDialog.equipment.name}</strong>
                {contactDialog.equipment.type === "rental" ? " (Comodato)" : " (Proprietà)"}
              </p>
              
              {contactDialog.equipment.contact_name && (
                <p className="font-medium">{contactDialog.equipment.contact_name}</p>
              )}
              
              <div className="space-y-3">
                {contactDialog.equipment.contact_phone && (
                  <a
                    href={`tel:${contactDialog.equipment.contact_phone}`}
                    className="flex items-center gap-3 p-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                  >
                    <Phone className="w-6 h-6" />
                    <span className="text-lg font-medium">{contactDialog.equipment.contact_phone}</span>
                  </a>
                )}
                
                {contactDialog.equipment.contact_whatsapp && (
                  <a
                    href={`https://wa.me/${contactDialog.equipment.contact_whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-[#25D366] text-white rounded-xl hover:bg-[#20BD5A] transition-colors"
                  >
                    <MessageCircle className="w-6 h-6" />
                    <span className="text-lg font-medium">WhatsApp</span>
                  </a>
                )}
                
                {contactDialog.equipment.contact_email && (
                  <a
                    href={`mailto:${contactDialog.equipment.contact_email}`}
                    className="flex items-center gap-3 p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    <Mail className="w-6 h-6" />
                    <span className="text-lg font-medium">{contactDialog.equipment.contact_email}</span>
                  </a>
                )}
              </div>
              
              {contactDialog.equipment.notes && (
                <p className="text-sm text-muted-foreground italic">
                  {contactDialog.equipment.notes}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Equipment Dialog */}
      <Dialog open={equipmentDialog.open} onOpenChange={(open) => !open && setEquipmentDialog({ open: false, equipment: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {equipmentDialog.equipment ? "Modifica Attrezzatura" : "Nuova Attrezzatura"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Nome attrezzatura</Label>
              <Input
                value={equipmentForm.name}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                placeholder="Es. Macchina Espresso La Cimbali"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={equipmentForm.type}
                onValueChange={(value) => setEquipmentForm({ ...equipmentForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owned">Di proprietà</SelectItem>
                  <SelectItem value="rental">Comodato d'uso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Contatto Assistenza</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Nome contatto</Label>
                  <Input
                    value={equipmentForm.contact_name}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, contact_name: e.target.value })}
                    placeholder="Es. Assistenza Lavazza"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefono</Label>
                  <Input
                    value={equipmentForm.contact_phone}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, contact_phone: e.target.value })}
                    placeholder="Es. 02 1234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    value={equipmentForm.contact_whatsapp}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, contact_whatsapp: e.target.value })}
                    placeholder="Es. +39 333 1234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={equipmentForm.contact_email}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, contact_email: e.target.value })}
                    placeholder="Es. assistenza@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Note</Label>
                  <Textarea
                    value={equipmentForm.notes}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, notes: e.target.value })}
                    placeholder="Es. Orari assistenza: lun-ven 9-18"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEquipmentDialog({ open: false, equipment: null })}>
              Annulla
            </Button>
            <Button onClick={saveEquipment}>
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
              Sei sicuro di voler eliminare? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={deleteItem} className="bg-destructive">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Problemi;

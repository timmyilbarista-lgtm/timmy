import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { AlertTriangle, Phone, Mail, MessageCircle, CheckCircle2, Send, Pencil, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import api from "../lib/api";

const Problemi = () => {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [form, setForm] = useState({ equipment: "", description: "", priority: "medium", phone: "", whatsapp: "", email: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/problems");
      setProblems(res.data);
    } catch (e) {}
    setLoading(false);
  };

  const openNew = () => {
    setEditingProblem(null);
    setForm({ equipment: "", description: "", priority: "medium", phone: "", whatsapp: "", email: "" });
    setDialogOpen(true);
  };

  const openEdit = (p) => {
    setEditingProblem(p);
    setForm({
      equipment: p.equipment_name || "",
      description: p.description || "",
      priority: p.priority || "medium",
      phone: p.contact_phone || "",
      whatsapp: p.contact_whatsapp || "",
      email: p.contact_email || ""
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.equipment || !form.description) {
      toast.error("Compila attrezzatura e descrizione");
      return false;
    }
    try {
      if (editingProblem) {
        await api.put(`/problems/${editingProblem.id}`, {
          equipment_name: form.equipment,
          description: form.description,
          priority: form.priority,
          contact_phone: form.phone,
          contact_email: form.email,
          contact_whatsapp: form.whatsapp
        });
        toast.success("Modificato!");
      } else {
        await api.post("/problems/manual", {
          equipment_name: form.equipment,
          description: form.description,
          priority: form.priority,
          contact_phone: form.phone,
          contact_email: form.email,
          contact_whatsapp: form.whatsapp
        });
        toast.success("Salvato!");
      }
      setDialogOpen(false);
      fetchData();
      return true;
    } catch (e) {
      toast.error("Errore");
      return false;
    }
  };

  const doCall = () => {
    if (form.phone) window.location.href = `tel:${form.phone}`;
  };

  const doWhatsapp = () => {
    if (form.whatsapp) {
      const num = form.whatsapp.replace(/\D/g, '');
      const fullNum = num.startsWith('39') ? num : '39' + num;
      const msg = encodeURIComponent(`Problema: ${form.equipment}\n${form.description}`);
      window.open(`https://wa.me/${fullNum}?text=${msg}`, '_blank');
    }
  };

  const doEmail = () => {
    if (form.email) {
      window.location.href = `mailto:${form.email}?subject=${encodeURIComponent('Problema: ' + form.equipment)}&body=${encodeURIComponent(form.description)}`;
    }
  };

  const resolve = async (id) => {
    await api.put(`/problems/${id}`, { status: "resolved" });
    toast.success("Risolto!");
    fetchData();
  };

  const deleteProblem = async (id) => {
    await api.delete(`/problems/${id}`);
    toast.success("Eliminato!");
    fetchData();
  };

  const openProblems = problems.filter(p => p.status !== "resolved");

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2"><Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5"/></Button></Link><h1 className="font-heading text-2xl font-bold">Problemi</h1></div>
        <Button onClick={openNew} className="bg-red-600"><AlertTriangle className="w-4 h-4 mr-2"/>Segnala</Button>
      </div>

      {openProblems.map(p => (
        <Card key={p.id} className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-semibold">{p.equipment_name}</p>
                <p className="text-sm">{p.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.reported_by_name} - {format(new Date(p.created_at), "dd/MM HH:mm")}</p>
                {(p.contact_phone || p.contact_whatsapp || p.contact_email) && (
                  <div className="flex gap-2 mt-2">
                    {p.contact_phone && <a href={`tel:${p.contact_phone}`} className="text-green-600"><Phone className="w-5 h-5"/></a>}
                    {p.contact_whatsapp && <a href={`https://wa.me/39${p.contact_whatsapp.replace(/\D/g,'')}`} target="_blank" className="text-green-500"><MessageCircle className="w-5 h-5"/></a>}
                    {p.contact_email && <a href={`mailto:${p.contact_email}`} className="text-blue-600"><Mail className="w-5 h-5"/></a>}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4"/></Button>
                <Button size="sm" variant="ghost" onClick={() => resolve(p.id)} className="text-green-600"><CheckCircle2 className="w-4 h-4"/></Button>
                <Button size="sm" variant="ghost" onClick={() => deleteProblem(p.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {openProblems.length === 0 && <p className="text-center text-muted-foreground py-8">Nessun problema aperto</p>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingProblem ? "Modifica" : "Segnala Problema"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Attrezzatura</Label><Input value={form.equipment} onChange={e => setForm({...form, equipment: e.target.value})} placeholder="Es. Macchina Espresso"/></div>
            <div><Label>Descrizione</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descrivi il problema" rows={2}/></div>
            <div><Label>Priorità</Label>
              <Select value={form.priority} onValueChange={v => setForm({...form, priority: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Bassa</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-t pt-3 space-y-2">
              <Label className="text-sm">Contatti (opzionale)</Label>
              <div className="flex gap-2 items-center"><Phone className="w-4 h-4 shrink-0"/><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Telefono"/></div>
              <div className="flex gap-2 items-center"><MessageCircle className="w-4 h-4 shrink-0"/><Input value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} placeholder="WhatsApp"/></div>
              <div className="flex gap-2 items-center"><Mail className="w-4 h-4 shrink-0"/><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email"/></div>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={async () => { if(await save()) doCall(); }} className="bg-green-600 w-full" disabled={!form.phone}><Phone className="w-4 h-4 mr-2"/>Salva e Chiama</Button>
            <Button onClick={async () => { if(await save()) doWhatsapp(); }} className="bg-green-500 w-full" disabled={!form.whatsapp}><MessageCircle className="w-4 h-4 mr-2"/>Salva e WhatsApp</Button>
            <Button onClick={async () => { if(await save()) doEmail(); }} className="bg-blue-600 w-full" disabled={!form.email}><Mail className="w-4 h-4 mr-2"/>Salva e Email</Button>
            <Button onClick={save} variant="outline" className="w-full"><Send className="w-4 h-4 mr-2"/>Solo Salva</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Problemi;

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { StickyNote, Send, Trash2, Clock, User, Coffee } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import api from "../lib/api";

const Notes = () => {
  const { user } = useAuth();
  const [shift, setShift] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const shiftRes = await api.get("/shifts/current");
      setShift(shiftRes.data);
      
      if (shiftRes.data) {
        const notesRes = await api.get(`/notes/shift/${shiftRes.data.id}`);
        setNotes(notesRes.data);
      }
    } catch (error) {
      toast.error("Errore nel caricamento delle note");
    } finally {
      setLoading(false);
    }
  };

  const sendNote = async () => {
    if (!newNote.trim()) {
      toast.error("Scrivi qualcosa prima di inviare");
      return;
    }
    if (!shift) {
      toast.error("Nessun turno attivo");
      return;
    }

    setSending(true);
    try {
      const res = await api.post("/notes", {
        shift_id: shift.id,
        content: newNote.trim(),
      });
      setNotes((prev) => [
        {
          ...res.data,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setNewNote("");
      toast.success("Nota inviata!");
    } catch (error) {
      toast.error("Errore nell'invio della nota");
    } finally {
      setSending(false);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      await api.delete(`/notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Nota eliminata");
    } catch (error) {
      toast.error("Errore nell'eliminazione");
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-8 w-48 skeleton-pulse" />
        <div className="h-32 skeleton-pulse rounded-2xl" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 skeleton-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="p-6 md:p-8">
        <div className="empty-state">
          <StickyNote className="empty-state-icon" />
          <h2 className="font-heading text-2xl font-semibold mb-2">Nessun turno attivo</h2>
          <p className="text-muted-foreground mb-6">
            Apri un turno dalla dashboard per lasciare note.
          </p>
          <Link to="/">
            <Button data-testid="notes-go-dashboard-btn">Vai alla Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold">Note Turno</h1>
        <p className="text-muted-foreground">
          Lascia messaggi per il turno successivo
        </p>
      </div>

      {/* New Note Input */}
      <Card className="border-accent/30 bg-amber-50/50 dark:bg-amber-900/10">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <StickyNote className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <Textarea
                placeholder="Scrivi una nota per il prossimo turno..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                data-testid="new-note-textarea"
                className="min-h-[100px] resize-none border-accent/30 focus:border-accent bg-white dark:bg-stone-900"
              />
              <div className="flex justify-end mt-3">
                <Button
                  onClick={sendNote}
                  disabled={sending || !newNote.trim()}
                  data-testid="send-note-btn"
                  className="bg-accent hover:bg-accent/90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? "Invio..." : "Invia Nota"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      <div className="space-y-4">
        <h2 className="font-heading font-semibold text-lg">Note di questo turno</h2>

        <AnimatePresence mode="popLayout">
          {notes.length > 0 ? (
            notes.map((note, index) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 20, rotate: -1 }}
                animate={{ opacity: 1, y: 0, rotate: index % 2 === 0 ? -1 : 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="note-card sticky-note">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-4">
                      <p className="text-foreground whitespace-pre-wrap flex-1">{note.content}</p>
                      {note.user_id === user.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNote(note.id)}
                          data-testid={`delete-note-${note.id}`}
                          className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{note.user_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(note.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Coffee className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                Nessuna nota per questo turno. Sii il primo a lasciare un messaggio!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Notes;

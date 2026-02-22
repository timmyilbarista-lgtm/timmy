import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  MessageSquare, 
  History, 
  Settings, 
  LogOut,
  Sun,
  Moon,
  Coffee,
  CalendarDays,
  AlertTriangle,
  Key
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { toast } from "sonner";
import api from "../lib/api";
import { cn } from "../lib/utils";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/checklist", icon: ClipboardCheck, label: "Checklist" },
  { path: "/turni", icon: CalendarDays, label: "Turni" },
  { path: "/problemi", icon: AlertTriangle, label: "Problemi" },
  { path: "/notes", icon: MessageSquare, label: "Note" },
  { path: "/history", icon: History, label: "Storico" },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [credentialsDialog, setCredentialsDialog] = useState(false);
  const [credentialsForm, setCredentialsForm] = useState({ name: "", pin: "", confirmPin: "" });

  const isManager = user?.role === "manager";

  const openCredentialsDialog = () => {
    setCredentialsForm({ name: user?.name || "", pin: "", confirmPin: "" });
    setCredentialsDialog(true);
  };

  const saveCredentials = async () => {
    if (credentialsForm.pin && credentialsForm.pin !== credentialsForm.confirmPin) {
      toast.error("I PIN non corrispondono");
      return;
    }
    if (credentialsForm.pin && credentialsForm.pin.length !== 4) {
      toast.error("Il PIN deve essere di 4 cifre");
      return;
    }
    try {
      const updateData = {};
      if (credentialsForm.name && credentialsForm.name !== user?.name) {
        updateData.name = credentialsForm.name;
      }
      if (credentialsForm.pin) {
        updateData.pin = credentialsForm.pin;
      }
      if (Object.keys(updateData).length === 0) {
        toast.error("Nessuna modifica da salvare");
        return;
      }
      await api.put(`/users/${user?.id}/self`, updateData);
      toast.success("Credenziali aggiornate! Effettua di nuovo l'accesso.");
      setCredentialsDialog(false);
      logout();
    } catch (error) {
      toast.error("Errore nell'aggiornamento");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop/Tablet */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl sticky top-0 h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Coffee className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg text-foreground">BaristaShift</h1>
              <p className="text-xs text-muted-foreground">Gestione Turni</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== "/" && location.pathname.startsWith(item.path));
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.path.replace("/", "") || "dashboard"}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 touch-target",
                  isActive
                    ? "bg-secondary text-secondary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {isManager && (
            <NavLink
              to="/manager"
              data-testid="nav-manager"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 touch-target",
                location.pathname === "/manager"
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Settings className="w-5 h-5" />
              <span>Gestione</span>
            </NavLink>
          )}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center gap-3 px-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-sm font-semibold text-secondary-foreground">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={openCredentialsDialog}
              data-testid="change-credentials-btn"
              className="flex-1 h-10"
              title="Cambia credenziali"
            >
              <Key className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="theme-toggle"
              className="flex-1 h-10"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              data-testid="logout-btn"
              className="flex-1 h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden mobile-nav glass-effect border-t border-border">
        <div className="flex justify-between px-1 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-0 px-1 py-1 rounded-lg transition-colors",
                  isActive ? "text-accent" : "text-muted-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[8px]">{item.label}</span>
              </NavLink>
            );
          })}
          {isManager && (
            <NavLink
              to="/manager"
              className={cn(
                "flex flex-col items-center gap-0 px-1 py-1 rounded-lg transition-colors",
                location.pathname === "/manager" ? "text-accent" : "text-muted-foreground"
              )}
            >
              <Settings className="w-4 h-4" />
              <span className="text-[8px]">Gestione</span>
            </NavLink>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Layout;

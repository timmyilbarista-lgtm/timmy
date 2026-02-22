import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Coffee, Sun, Moon, Eye, EyeOff, KeyRound, ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import api from "../lib/api";

const Login = () => {
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [newRecoveryCode, setNewRecoveryCode] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    pin: "",
  });
  const [recoveryData, setRecoveryData] = useState({
    name: "",
    recovery_code: "",
    new_pin: "",
  });

  // Seed data on first load
  useEffect(() => {
    const seedData = async () => {
      try {
        await api.post("/seed");
      } catch (error) {
        // Already seeded, ignore
      }
    };
    seedData();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.pin) {
      toast.error("Inserisci nome e PIN");
      return;
    }
    
    setLoading(true);
    try {
      await login(formData.name, formData.pin);
      toast.success("Benvenuto!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Credenziali non valide");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.pin) {
      toast.error("Inserisci nome e PIN");
      return;
    }
    if (formData.pin.length < 4) {
      toast.error("Il PIN deve avere almeno 4 cifre");
      return;
    }
    
    setLoading(true);
    try {
      await register(formData.name, formData.pin);
      toast.success("Account creato con successo!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nella registrazione");
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e) => {
    e.preventDefault();
    if (!recoveryData.name || !recoveryData.recovery_code || !recoveryData.new_pin) {
      toast.error("Compila tutti i campi");
      return;
    }
    if (recoveryData.new_pin.length < 4) {
      toast.error("Il nuovo PIN deve avere almeno 4 cifre");
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post("/auth/recover", recoveryData);
      setNewRecoveryCode(response.data.new_recovery_code);
      toast.success("PIN aggiornato con successo!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nel recupero");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero Image */}
      <div 
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80')"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-coffee-900/90 to-coffee-800/70" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Coffee className="w-6 h-6" />
            </div>
            <span className="font-heading font-bold text-2xl">BaristaShift</span>
          </div>
          
          <div className="max-w-lg">
            <h1 className="font-heading text-4xl xl:text-5xl font-bold mb-6">
              Gestisci i tuoi turni in modo semplice
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              Checklist intelligenti per il cambio turno. Mai piu dimenticanze, 
              tutto sotto controllo con un tap.
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>Fatto con amore per i baristi</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Theme Toggle */}
          <div className="flex justify-end mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="login-theme-toggle"
              className="rounded-full"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Coffee className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-2xl">BaristaShift</span>
          </div>

          <Card className="border-0 shadow-none lg:border lg:shadow-card bg-transparent lg:bg-card">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="font-heading text-2xl">Accedi al tuo turno</CardTitle>
              <CardDescription>
                Inserisci le tue credenziali per iniziare
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" data-testid="tab-login">Accedi</TabsTrigger>
                  <TabsTrigger value="register" data-testid="tab-register">Registrati</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-name">Nome</Label>
                      <Input
                        id="login-name"
                        data-testid="login-name-input"
                        placeholder="Il tuo nome"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-pin">PIN</Label>
                      <div className="relative">
                        <Input
                          id="login-pin"
                          data-testid="login-pin-input"
                          type={showPin ? "text" : "password"}
                          placeholder="Il tuo PIN"
                          value={formData.pin}
                          onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                          className="h-12 pr-12"
                          maxLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPin(!showPin)}
                        >
                          {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      data-testid="login-submit-btn"
                      className="w-full h-12 bg-primary hover:bg-primary/90"
                      disabled={loading}
                    >
                      {loading ? "Accesso in corso..." : "Accedi"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Nome</Label>
                      <Input
                        id="register-name"
                        data-testid="register-name-input"
                        placeholder="Il tuo nome"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-pin">PIN (min. 4 cifre)</Label>
                      <div className="relative">
                        <Input
                          id="register-pin"
                          data-testid="register-pin-input"
                          type={showPin ? "text" : "password"}
                          placeholder="Scegli un PIN"
                          value={formData.pin}
                          onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                          className="h-12 pr-12"
                          maxLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPin(!showPin)}
                        >
                          {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      data-testid="register-submit-btn"
                      className="w-full h-12 bg-primary hover:bg-primary/90"
                      disabled={loading}
                    >
                      {loading ? "Registrazione..." : "Crea Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;

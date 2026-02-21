import { useState } from "react";
import { Check, Smartphone, Download, Coffee, ClipboardCheck, Users, Bell, Instagram, Mail, ChevronDown } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

const Landing = () => {
  const [showIOS, setShowIOS] = useState(false);
  const [showAndroid, setShowAndroid] = useState(false);

  const features = [
    { icon: ClipboardCheck, title: "Checklist Turno", desc: "Mai più dimenticare un'attività durante il cambio turno" },
    { icon: Users, title: "Gestione Staff", desc: "Calendario turni e assegnazione compiti" },
    { icon: Bell, title: "Segnalazione Problemi", desc: "Report guasti con contatto diretto assistenza" },
    { icon: Coffee, title: "Pensata per Baristi", desc: "Creata da un Coffee Master per i professionisti del caffè" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
          {/* Logo */}
          <img 
            src="https://customer-assets.emergentagent.com/job_78c4fd9d-22bd-4052-9fe1-72ca94f819a4/artifacts/925i7ml5_IMG_1461.jpeg" 
            alt="Timmy Coffee Master" 
            className="w-48 mx-auto mb-8 rounded-2xl shadow-2xl"
          />
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            BaristaShift
          </h1>
          <p className="text-xl md:text-2xl text-amber-400 font-medium mb-6">
            L'App per Gestire i Cambi Turno nel Tuo Bar
          </p>
          <p className="text-lg text-stone-300 max-w-2xl mx-auto mb-8">
            Checklist digitale, gestione turni e segnalazione problemi. 
            Tutto in un'app semplice pensata da un barista per i baristi.
          </p>
          
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/50 rounded-full px-6 py-3 mb-8">
            <span className="text-2xl font-bold text-amber-400">14,99€</span>
            <span className="text-stone-300">/mese</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Cosa può fare per il tuo bar
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <Card key={i} className="bg-stone-800/50 border-stone-700">
              <CardContent className="p-6 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <feature.icon className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white mb-1">{feature.title}</h3>
                  <p className="text-stone-400">{feature.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Come Installare */}
      <div className="bg-stone-800/50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Come Installare l'App
          </h2>
          <p className="text-center text-stone-400 mb-12">
            Nessun download dallo store. Installi direttamente dal browser in 30 secondi!
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* iPhone */}
            <Card className="bg-stone-900 border-stone-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone className="w-8 h-8 text-amber-400" />
                  <h3 className="text-xl font-semibold text-white">iPhone</h3>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between text-left text-stone-300 hover:text-white hover:bg-stone-800"
                  onClick={() => setShowIOS(!showIOS)}
                >
                  Vedi istruzioni
                  <ChevronDown className={`w-5 h-5 transition-transform ${showIOS ? 'rotate-180' : ''}`} />
                </Button>
                {showIOS && (
                  <ol className="mt-4 space-y-3 text-stone-300">
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-900 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                      <span>Apri Safari e vai al link dell'app</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-900 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                      <span>Tocca il pulsante <strong>Condividi</strong> (quadrato con freccia)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-900 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                      <span>Scorri e tocca <strong>"Aggiungi a Home"</strong></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-900 flex items-center justify-center text-sm font-bold shrink-0">4</span>
                      <span>Tocca <strong>"Aggiungi"</strong> in alto a destra</span>
                    </li>
                    <li className="flex gap-3 text-green-400">
                      <Check className="w-6 h-6 shrink-0" />
                      <span>L'icona appare sulla tua Home!</span>
                    </li>
                  </ol>
                )}
              </CardContent>
            </Card>

            {/* Android */}
            <Card className="bg-stone-900 border-stone-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone className="w-8 h-8 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">Android</h3>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between text-left text-stone-300 hover:text-white hover:bg-stone-800"
                  onClick={() => setShowAndroid(!showAndroid)}
                >
                  Vedi istruzioni
                  <ChevronDown className={`w-5 h-5 transition-transform ${showAndroid ? 'rotate-180' : ''}`} />
                </Button>
                {showAndroid && (
                  <ol className="mt-4 space-y-3 text-stone-300">
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-green-500 text-stone-900 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                      <span>Apri Chrome e vai al link dell'app</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-green-500 text-stone-900 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                      <span>Tocca i <strong>3 puntini</strong> in alto a destra</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-green-500 text-stone-900 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                      <span>Tocca <strong>"Aggiungi a schermata Home"</strong></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-green-500 text-stone-900 flex items-center justify-center text-sm font-bold shrink-0">4</span>
                      <span>Tocca <strong>"Aggiungi"</strong></span>
                    </li>
                    <li className="flex gap-3 text-green-400">
                      <Check className="w-6 h-6 shrink-0" />
                      <span>L'icona appare sulla tua Home!</span>
                    </li>
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Vuoi BaristaShift per il tuo bar?
        </h2>
        <p className="text-stone-400 mb-8 max-w-xl mx-auto">
          Contattami per attivare l'app. Ti creo le credenziali e sei operativo in 5 minuti!
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <a 
            href="https://instagram.com/TimmyCoffeeMaster" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Instagram className="w-5 h-5 mr-2" />
              @TimmyCoffeeMaster
            </Button>
          </a>
          <a href="mailto:Timmyilbarista@gmail.com">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-stone-600 text-white hover:bg-stone-800">
              <Mail className="w-5 h-5 mr-2" />
              Scrivimi una Email
            </Button>
          </a>
        </div>

        <div className="inline-flex items-center gap-2 text-stone-500 text-sm">
          <Coffee className="w-4 h-4" />
          <span>Creato con passione da Timmy Coffee Master</span>
        </div>
      </div>
    </div>
  );
};

export default Landing;

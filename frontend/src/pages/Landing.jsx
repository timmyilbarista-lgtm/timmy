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
            href="https://wa.me/39342616845?text=Ciao%20Timmy!%20Vorrei%20info%20su%20BaristaShift" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </Button>
          </a>
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
              Email
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

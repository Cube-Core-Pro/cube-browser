"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  Lock, 
  Globe, 
  Zap, 
  Eye,
  Server,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VPNTourProps {
  onClose: () => void;
  onComplete: () => void;
}

const tourSteps = [
  {
    title: "¡Bienvenido a CUBE Nexum VPN!",
    description: "Tu protección de nivel empresarial está aquí. Vamos a mostrarte cómo funciona.",
    icon: Shield,
    content: [
      "🔒 Cifrado militar de 256-bit",
      "🌍 Servidores en 70+ países",
      "⚡ Sin límites de velocidad",
      "🛡️ Kill Switch automático",
      "👁️ Política de cero registros"
    ]
  },
  {
    title: "¿Por qué necesitas una VPN?",
    description: "Protege tu privacidad y seguridad en línea",
    icon: Eye,
    content: [
      "🏢 Tu ISP puede ver todo lo que haces en línea",
      "🌐 Sitios web rastrean tu ubicación y actividad",
      "☕ WiFi público expone tus datos personales",
      "🎯 Anunciantes crean perfiles detallados sobre ti",
      "🔓 Hackers pueden interceptar tu información"
    ]
  },
  {
    title: "Cómo funciona",
    description: "Simple y poderoso",
    icon: Server,
    content: [
      "1️⃣ Selecciona un servidor de la lista",
      "2️⃣ Haz clic en 'Conectar'",
      "3️⃣ ¡Listo! Tu conexión está protegida",
      "📊 Monitorea tu actividad en tiempo real",
      "🔄 Cambia de servidor cuando quieras"
    ]
  },
  {
    title: "Características Premium",
    description: "Desbloquea todo el potencial",
    icon: Zap,
    content: [
      "🚀 Servidores de ultra-alta velocidad",
      "🎬 Streaming sin restricciones (Netflix, Hulu, etc.)",
      "🎮 Gaming con baja latencia",
      "💼 Múltiples conexiones simultáneas",
      "🔐 Split Tunneling avanzado"
    ]
  },
  {
    title: "VPN Personalizado",
    description: "Conecta tu propio servidor",
    icon: Globe,
    content: [
      "💼 Usa el VPN de tu empresa",
      "🏠 Conecta a tu red doméstica",
      "⚙️ Configuración manual completa",
      "📝 Soporta OpenVPN, WireGuard, IKEv2",
      "🔧 Importa archivos .ovpn"
    ]
  },
  {
    title: "Consejos de Seguridad",
    description: "Maximiza tu protección",
    icon: Lock,
    content: [
      "✅ Mantén el Kill Switch activado siempre",
      "✅ Usa servidores cercanos para mejor velocidad",
      "✅ Activa la VPN antes de conectarte a WiFi público",
      "✅ Verifica que tu IP real esté oculta",
      "✅ Actualiza regularmente para parches de seguridad"
    ]
  }
];

export const VPNTour: React.FC<VPNTourProps> = ({ onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = tourSteps[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('vpn-tour-completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10"
          onClick={handleSkip}
        >
          <X className="h-4 w-4" />
        </Button>

        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-10 w-10 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl mb-2">{step.title}</CardTitle>
            <CardDescription className="text-base">{step.description}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            {step.content.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="text-lg leading-none mt-0.5">{item.split(' ')[0]}</div>
                <div className="flex-1 text-sm leading-relaxed">
                  {item.split(' ').slice(1).join(' ')}
                </div>
              </div>
            ))}
          </div>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === currentStep
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>

            <div className="text-sm text-muted-foreground">
              {currentStep + 1} de {tourSteps.length}
            </div>

            <Button onClick={handleNext}>
              {currentStep === tourSteps.length - 1 ? (
                "¡Empezar!"
              ) : (
                <>
                  Siguiente
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          <div className="text-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Saltar tour
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

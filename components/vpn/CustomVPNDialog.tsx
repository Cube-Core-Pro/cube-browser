"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomVPNService } from '@/lib/services/vpn-extended-service';
import { 
  Globe, 
  Shield, 
  Upload, 
  Server,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  FileText,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomVPNDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface VPNConfig {
  name: string;
  protocol: 'OpenVPN' | 'WireGuard' | 'IKEv2';
  serverAddress: string;
  port: number;
  username?: string;
  password?: string;
  certificate?: string;
  privateKey?: string;
  publicKey?: string;
  presharedKey?: string;
}

export const CustomVPNDialog: React.FC<CustomVPNDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const [config, setConfig] = useState<VPNConfig>({
    name: '',
    protocol: 'OpenVPN',
    serverAddress: '',
    port: 1194,
    username: '',
    password: '',
    certificate: '',
    privateKey: '',
    publicKey: '',
    presharedKey: '',
  });

  const [ovpnContent, setOvpnContent] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setOvpnContent(text);
      
      // Parse basic info from .ovpn file
      const nameMatch = file.name.match(/^(.+)\.ovpn$/);
      if (nameMatch) {
        setConfig(prev => ({ ...prev, name: nameMatch[1] }));
      }

      // Try to extract server address
      const remoteMatch = text.match(/remote\s+([^\s]+)\s+(\d+)/);
      if (remoteMatch) {
        setConfig(prev => ({
          ...prev,
          serverAddress: remoteMatch[1],
          port: parseInt(remoteMatch[2])
        }));
      }

      toast({
        title: "Archivo cargado",
        description: `${file.name} importado exitosamente`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to read file",
        variant: "destructive",
      });
    }
  };

  const handleConnect = async () => {
    // Validation
    if (!config.name.trim()) {
      toast({
        title: "Error de validación",
        description: "El nombre de la conexión es requerido",
        variant: "destructive",
      });
      return;
    }

    if (!config.serverAddress.trim()) {
      toast({
        title: "Error de validación",
        description: "La dirección del servidor es requerida",
        variant: "destructive",
      });
      return;
    }

    if (config.port < 1 || config.port > 65535) {
      toast({
        title: "Error de validación",
        description: "El puerto debe estar entre 1 y 65535",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create VPN config using backend service
      let configId: string;
      
      if (activeTab === 'import' && ovpnContent) {
        // Import from .ovpn file - use import_vpn_config
        configId = await CustomVPNService.importConfig(ovpnContent, config.name);
      } else {
        // Create manual config - use create_vpn_config
        configId = await CustomVPNService.createConfig(
          config.name,
          config.protocol,
          config.serverAddress,
          config.port,
          config.username || null,
          config.password || null
        );
      }

      // Step 2: Connect using the created config ID
      await CustomVPNService.connect(configId);

      toast({
        title: "Conexión exitosa",
        description: `Conectado a ${config.name}`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: error instanceof Error ? error.message : "Failed to connect to custom VPN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPortPlaceholder = () => {
    switch (config.protocol) {
      case 'OpenVPN': return '1194';
      case 'WireGuard': return '51820';
      case 'IKEv2': return '500';
      default: return '1194';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Conectar VPN Personalizado
          </DialogTitle>
          <DialogDescription>
            Configura tu propia conexión VPN para acceder a tu red corporativa o doméstica
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="gap-2">
              <Server className="h-4 w-4" />
              Configuración Manual
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Upload className="h-4 w-4" />
              Importar .ovpn
            </TabsTrigger>
          </TabsList>

          {/* Manual Configuration Tab */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información Básica</CardTitle>
                <CardDescription>
                  Nombre y protocolo de conexión
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Conexión *</Label>
                  <Input
                    id="name"
                    placeholder="Ej: VPN Oficina, VPN Casa"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="protocol">Protocolo</Label>
                  <Select
                    value={config.protocol}
                    onValueChange={(value: string) => setConfig(prev => ({ ...prev, protocol: value as 'OpenVPN' | 'WireGuard' }))}
                  >
                    <SelectTrigger id="protocol">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OpenVPN">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          OpenVPN (más compatible)
                        </div>
                      </SelectItem>
                      <SelectItem value="WireGuard">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          WireGuard (más rápido)
                        </div>
                      </SelectItem>
                      <SelectItem value="IKEv2">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          IKEv2/IPSec (móvil)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Server Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Servidor</CardTitle>
                <CardDescription>
                  Dirección y puerto del servidor VPN
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="server">Dirección del Servidor *</Label>
                  <Input
                    id="server"
                    placeholder="vpn.miempresa.com o 192.168.1.1"
                    value={config.serverAddress}
                    onChange={(e) => setConfig(prev => ({ ...prev, serverAddress: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="port">Puerto</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder={getPortPlaceholder()}
                    value={config.port}
                    onChange={(e) => setConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Authentication (OpenVPN/IKEv2) */}
            {(config.protocol === 'OpenVPN' || config.protocol === 'IKEv2') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Autenticación</CardTitle>
                  <CardDescription>
                    Credenciales de usuario (opcional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Usuario</Label>
                    <Input
                      id="username"
                      placeholder="nombre_usuario"
                      value={config.username}
                      onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={config.password}
                        onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certificates (OpenVPN) */}
            {config.protocol === 'OpenVPN' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Certificados (Opcional)</CardTitle>
                  <CardDescription>
                    Para autenticación basada en certificados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="certificate">Certificado Cliente</Label>
                    <Textarea
                      id="certificate"
                      placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                      value={config.certificate}
                      onChange={(e) => setConfig(prev => ({ ...prev, certificate: e.target.value }))}
                      rows={3}
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="privateKey">Clave Privada</Label>
                    <Textarea
                      id="privateKey"
                      placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                      value={config.privateKey}
                      onChange={(e) => setConfig(prev => ({ ...prev, privateKey: e.target.value }))}
                      rows={3}
                      className="font-mono text-xs"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* WireGuard Keys */}
            {config.protocol === 'WireGuard' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Claves WireGuard</CardTitle>
                  <CardDescription>
                    Claves pública y privada para WireGuard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="publicKey">Clave Pública</Label>
                    <Input
                      id="publicKey"
                      placeholder="Base64 encoded public key"
                      value={config.publicKey}
                      onChange={(e) => setConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="privateKey">Clave Privada</Label>
                    <Input
                      id="privateKey"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Base64 encoded private key"
                      value={config.privateKey}
                      onChange={(e) => setConfig(prev => ({ ...prev, privateKey: e.target.value }))}
                      className="font-mono text-xs pr-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="presharedKey">Clave Precompartida (Opcional)</Label>
                    <Input
                      id="presharedKey"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Base64 encoded preshared key"
                      value={config.presharedKey}
                      onChange={(e) => setConfig(prev => ({ ...prev, presharedKey: e.target.value }))}
                      className="font-mono text-xs"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Import .ovpn Tab */}
          <TabsContent value="import" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Importar Archivo .ovpn</CardTitle>
                <CardDescription>
                  Carga un archivo de configuración OpenVPN (.ovpn)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name-import">Nombre de la Conexión *</Label>
                  <Input
                    id="name-import"
                    placeholder="Ej: VPN Oficina, VPN Casa"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <Label
                      htmlFor="file-upload"
                      className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80"
                    >
                      Seleccionar archivo .ovpn
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".ovpn"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      o arrastra y suelta aquí
                    </p>
                  </div>
                </div>

                {ovpnContent && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Archivo cargado exitosamente</span>
                    </div>
                    {config.serverAddress && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Servidor: {config.serverAddress}</div>
                        <div>Puerto: {config.port}</div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Archivos .ovpn
                  </p>
                  <p className="text-blue-800 dark:text-blue-200 text-xs">
                    Los archivos .ovpn contienen toda la configuración necesaria para conectarte. 
                    Tu administrador de red o proveedor VPN debería proporcionarte este archivo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConnect} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Conectando...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Conectar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
